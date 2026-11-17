from collections import defaultdict
from datetime import datetime, time, timedelta
from decimal import ROUND_HALF_UP, Decimal
from zoneinfo import ZoneInfo

from django.conf import settings
from django.db import transaction
from django.db.models import Count, F, Sum
from django.db.models.functions import TruncDate
from django.utils import timezone

from flights.models import Airport, Flight

from .models import CrowdForecast, HistoricalRecord

MEDIUM_THRESHOLD = 50
HIGH_THRESHOLD = 75
FLIGHT_WEIGHT = Decimal("0.5")
HISTORY_WEIGHT = Decimal("0.5")
HISTORY_DAY_OFFSETS = (371, 364, 357)
RECOMMENDATION_WINDOW = 7
MAX_RECOMMENDATIONS = 3
CALCULATED_SOURCE = "Calculated from 2026 flights and 2025 history"
CALCULATED_SOURCES = (CALCULATED_SOURCE, "Calculated from flights")
SAMPLE_SOURCE = "Sample data"


def project_timezone():
    return ZoneInfo(settings.TIME_ZONE)


def flight_pairs(flight):
    timezone = project_timezone()
    return {
        (flight.origin_id, flight.departure_time.astimezone(timezone).date()),
        (flight.destination_id, flight.arrival_time.astimezone(timezone).date()),
    }


def flight_totals(pairs=None, include_directions=False):
    totals = defaultdict(
        lambda: {
            "flight_count": 0,
            "seats_total": 0,
            "seats_booked": 0,
            **(
                {"departing_count": 0, "arriving_count": 0, "open_seats": 0}
                if include_directions
                else {}
            ),
        }
    )
    if pairs is not None and not pairs:
        return totals
    timezone = project_timezone()
    for airport_field, time_field in (
        ("origin_id", "departure_time"),
        ("destination_id", "arrival_time"),
    ):
        flights = Flight.objects.all()
        if pairs is not None:
            airports = {airport for airport, _ in pairs}
            dates = {date for _, date in pairs}
            start = datetime.combine(min(dates), time.min, tzinfo=timezone)
            end = datetime.combine(
                max(dates) + timedelta(days=1), time.min, tzinfo=timezone
            )
            flights = flights.filter(
                **{
                    f"{airport_field}__in": airports,
                    f"{time_field}__gte": start,
                    f"{time_field}__lt": end,
                }
            )
        rows = (
            flights.annotate(local_date=TruncDate(time_field, tzinfo=timezone))
            .values(airport_field, "local_date")
            .annotate(
                flight_count=Count("pk"),
                seats_total=Sum("total_seats"),
                seats_booked=Sum(F("total_seats") - F("available_seats")),
                open_seats=Sum("available_seats"),
            )
        )
        for row in rows:
            pair = (row[airport_field], row["local_date"])
            if pairs is not None and pair not in pairs:
                continue
            for field in ("flight_count", "seats_total", "seats_booked"):
                totals[pair][field] += row[field]
            if include_directions:
                direction = (
                    "departing_count"
                    if airport_field == "origin_id"
                    else "arriving_count"
                )
                totals[pair][direction] += row["flight_count"]
                if airport_field == "origin_id":
                    totals[pair]["open_seats"] += row["open_seats"]
    return totals


def crowd_score(seats_booked, seats_total):
    return rounded(percentage(seats_booked, seats_total))


def rounded(value):
    return float(Decimal(value).quantize(Decimal("0.1"), rounding=ROUND_HALF_UP))


def percentage(booked, total):
    return Decimal(booked) * 100 / Decimal(total) if total else None


def calculate_pairs(pairs=None):
    totals = flight_totals(pairs, include_directions=True)
    pairs = set(totals) if pairs is None else set(pairs)
    history = {}
    if pairs:
        dates = {
            date - timedelta(days=offset)
            for _, date in pairs
            for offset in HISTORY_DAY_OFFSETS
        }
        records = (
            HistoricalRecord.objects.filter(
                airport_id__in={airport for airport, _ in pairs},
                date__in=dates,
                seats_total__gt=0,
            )
            .order_by("date")
            .values("airport_id", "date", "seats_booked", "seats_total")
        )
        history = {(row["airport_id"], row["date"]): row for row in records}
    result = {}
    for pair in pairs:
        airport, date = pair
        flights = totals[pair]
        records = [
            history[(airport, date - timedelta(days=offset))]
            for offset in HISTORY_DAY_OFFSETS
            if (airport, date - timedelta(days=offset)) in history
        ]
        averages = [
            percentage(row["seats_booked"], row["seats_total"]) for row in records
        ]
        historical = sum(averages) / len(averages) if averages else None
        occupancy = percentage(flights["seats_booked"], flights["seats_total"])
        score = None
        if occupancy is not None:
            score = rounded(
                FLIGHT_WEIGHT * occupancy + HISTORY_WEIGHT * historical
                if historical is not None
                else occupancy
            )
        result[pair] = {
            "flights": flights,
            "records": records,
            "occupancy": occupancy,
            "history_average": historical,
            "crowd_score": score,
            "crowd_level": crowd_level(score) if score is not None else None,
            "has_data": score is not None,
        }
    return result


def crowd_level(score):
    if score < MEDIUM_THRESHOLD:
        return CrowdForecast.CrowdLevel.LOW
    if score < HIGH_THRESHOLD:
        return CrowdForecast.CrowdLevel.MEDIUM
    return CrowdForecast.CrowdLevel.HIGH


@transaction.atomic
def recalculate_forecasts(actor, pairs=None, remove_sample_data=False):
    airports = Airport.objects.select_for_update().order_by("pk")
    if pairs is not None:
        airports = airports.filter(pk__in={airport for airport, _ in pairs})
    list(airports)
    calculations = calculate_pairs(pairs)
    calculated = CrowdForecast.objects.filter(data_source__in=CALCULATED_SOURCES)
    if pairs is None:
        pairs = set(calculations) | set(calculated.values_list("airport_id", "date"))
    removed_sample = 0
    if remove_sample_data:
        removed_sample, _ = CrowdForecast.objects.filter(
            data_source=SAMPLE_SOURCE
        ).delete()
    counts = {
        "created": 0,
        "updated": 0,
        "deleted": 0,
        "skipped": 0,
        "sample_deleted": removed_sample,
    }
    existing = {}
    if pairs:
        existing = {
            (row.airport_id, row.date): row
            for row in CrowdForecast.objects.select_for_update().filter(
                airport_id__in={airport for airport, _ in pairs},
                date__in={date for _, date in pairs},
            )
        }
    created, updated, deleted = [], [], []
    now = timezone.now()
    for airport_id, date in sorted(pairs):
        forecast = existing.get((airport_id, date))
        if forecast and forecast.data_source not in (
            *CALCULATED_SOURCES,
            SAMPLE_SOURCE,
        ):
            counts["skipped"] += 1
            continue
        calculation = calculations.get((airport_id, date))
        if not calculation or not calculation["has_data"]:
            if forecast and forecast.data_source in CALCULATED_SOURCES:
                deleted.append(forecast.pk)
                counts["deleted"] += 1
            continue
        is_new = forecast is None
        forecast = forecast or CrowdForecast(
            airport_id=airport_id, date=date, created_by=actor
        )
        if forecast.data_source not in CALCULATED_SOURCES:
            forecast.created_by = actor
        forecast.crowd_score = calculation["crowd_score"]
        forecast.crowd_level = calculation["crowd_level"]
        forecast.data_source = CALCULATED_SOURCE
        forecast.calculated_at = now
        (created if is_new else updated).append(forecast)
        counts["created" if is_new else "updated"] += 1
    CrowdForecast.objects.filter(pk__in=deleted).delete()
    CrowdForecast.objects.bulk_create(created, batch_size=500)
    CrowdForecast.objects.bulk_update(
        updated,
        ["crowd_score", "crowd_level", "data_source", "calculated_at", "created_by"],
        batch_size=500,
    )
    return counts
