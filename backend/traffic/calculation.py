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

from .models import CrowdForecast

MEDIUM_THRESHOLD = 50
HIGH_THRESHOLD = 75
CALCULATED_SOURCE = "Calculated from flights"
SAMPLE_SOURCE = "Sample data"


def project_timezone():
    return ZoneInfo(settings.TIME_ZONE)


def flight_pairs(flight):
    timezone = project_timezone()
    return {
        (flight.origin_id, flight.departure_time.astimezone(timezone).date()),
        (flight.destination_id, flight.arrival_time.astimezone(timezone).date()),
    }


def flight_totals(pairs=None):
    totals = defaultdict(
        lambda: {"flight_count": 0, "seats_total": 0, "seats_booked": 0}
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
            )
        )
        for row in rows:
            pair = (row[airport_field], row["local_date"])
            if pairs is not None and pair not in pairs:
                continue
            for field in ("flight_count", "seats_total", "seats_booked"):
                totals[pair][field] += row[field]
    return totals


def crowd_score(seats_booked, seats_total):
    return float(
        (Decimal(seats_booked) * 100 / Decimal(seats_total)).quantize(
            Decimal("0.1"), rounding=ROUND_HALF_UP
        )
    )


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
    totals = flight_totals(pairs)
    calculated = CrowdForecast.objects.filter(data_source=CALCULATED_SOURCE)
    if pairs is None:
        pairs = set(totals) | set(calculated.values_list("airport_id", "date"))
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
    for airport_id, date in sorted(pairs):
        forecast = (
            CrowdForecast.objects.select_for_update()
            .filter(airport_id=airport_id, date=date)
            .first()
        )
        if forecast and forecast.data_source not in (CALCULATED_SOURCE, SAMPLE_SOURCE):
            counts["skipped"] += 1
            continue
        seats = totals[(airport_id, date)]
        if not seats["seats_total"]:
            if forecast and forecast.data_source == CALCULATED_SOURCE:
                forecast.delete()
                counts["deleted"] += 1
            continue
        is_new = forecast is None
        forecast = forecast or CrowdForecast(
            airport_id=airport_id, date=date, created_by=actor
        )
        if forecast.data_source != CALCULATED_SOURCE:
            forecast.created_by = actor
        forecast.crowd_score = crowd_score(seats["seats_booked"], seats["seats_total"])
        forecast.crowd_level = crowd_level(forecast.crowd_score)
        forecast.data_source = CALCULATED_SOURCE
        forecast.calculated_at = timezone.now()
        forecast.save()
        counts["created" if is_new else "updated"] += 1
    return counts
