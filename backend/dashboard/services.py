from collections import Counter
from datetime import timedelta

from django.utils import timezone

from flights.models import Airport
from traffic.calculation import calculate_pairs, project_timezone, rounded
from traffic.models import CrowdForecast


def dashboard_summary(airport=None):
    today = timezone.localdate(timezone=project_timezone())
    end = today + timedelta(days=29)
    forecasts = CrowdForecast.objects.filter(date__range=(today, end))
    if airport is None:
        airports = Airport.objects.order_by("code")
        airport = (
            airports.filter(pk__in=forecasts.values("airport_id")).first()
            or airports.first()
        )
    rows = list(forecasts.filter(airport=airport).order_by("date")) if airport else []
    counts = {level: 0 for level in ("low", "medium", "high")}
    dates = {level: [] for level in counts}
    levels = {}
    for row in rows:
        counts[row.crowd_level] += 1
        dates[row.crowd_level].append(
            {"date": row.date.isoformat(), "weekday": row.date.strftime("%A")}
        )
        levels[row.date] = row.crowd_level
    high_weekdays = Counter(row["weekday"] for row in dates["high"])
    busiest = None
    if high_weekdays:
        maximum = max(high_weekdays.values())
        busiest = next(
            row["weekday"]
            for row in dates["high"]
            if high_weekdays[row["weekday"]] == maximum
        )
    next_days = []
    for offset in range(7):
        date = today + timedelta(days=offset)
        next_days.append(
            {
                "date": date.isoformat(),
                "weekday": date.strftime("%A"),
                "crowd_level": levels.get(date),
            }
        )
    calculations = calculate_pairs({(row.airport_id, row.date) for row in rows})
    days = []
    for row in rows:
        data = calculations[(row.airport_id, row.date)]
        score = row.crowd_score
        if score is None and data["history_average"] is not None:
            score = rounded(data["history_average"])
        days.append(
            {
                "date": row.date.isoformat(),
                "weekday": row.date.strftime("%A"),
                "crowd_level": row.crowd_level,
                "crowd_score": score,
                **{
                    field: data["flights"][field]
                    for field in ("seats_booked", "seats_total", "flight_count")
                },
            }
        )
    return {
        "airport": {"id": airport.pk, "code": airport.code, "name": airport.name}
        if airport
        else None,
        "period_start": today.isoformat(),
        "period_end": end.isoformat(),
        "counts": counts,
        "dates": dates,
        "busiest_weekday": busiest,
        "next_7_days": next_days,
        "comparison": period_comparison(airport, rows, calculations),
        "days": days,
        "weekday_ranges": weekday_ranges(days),
    }


def period_comparison(airport, forecasts, calculations=None):
    calculations = (
        calculations
        if calculations is not None
        else (
            calculate_pairs({(airport.pk, row.date) for row in forecasts})
            if airport
            else {}
        )
    )
    values = list(calculations.values())
    flights = [row["occupancy"] for row in values if row["occupancy"] is not None]
    history = [
        row["history_average"] for row in values if row["history_average"] is not None
    ]
    paired = [
        row
        for row in values
        if row["occupancy"] is not None and row["history_average"] is not None
    ]
    average_flights = sum(flights) / len(flights) if flights else None
    average_history = sum(history) / len(history) if history else None
    return {
        "average_occupancy_2026_percent": rounded(average_flights)
        if average_flights is not None
        else None,
        "average_occupancy_2025_percent": rounded(average_history)
        if average_history is not None
        else None,
        "difference_points": rounded(average_flights - average_history)
        if average_flights is not None and average_history is not None
        else None,
        "days_busier_than_2025": sum(
            row["occupancy"] > row["history_average"] for row in paired
        ),
        "days_quieter_than_2025": sum(
            row["occupancy"] < row["history_average"] for row in paired
        ),
        "days_compared": len(paired),
    }


def weekday_ranges(days):
    ranges = []
    for weekday in ("Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"):
        known = [day for day in days if day["weekday"] == weekday and day["crowd_score"] is not None]
        least = min(known, key=lambda day: (day["crowd_score"], day["date"])) if known else None
        most = min(known, key=lambda day: (-day["crowd_score"], day["date"])) if known else None
        ranges.append({
            "weekday": weekday,
            "day_count": len(known),
            "min_score": least["crowd_score"] if least else None,
            "min_date": least["date"] if least else None,
            "max_score": most["crowd_score"] if most else None,
            "max_date": most["date"] if most else None,
            "max_day_seats_booked": most["seats_booked"] if most else None,
            "max_day_seats_total": most["seats_total"] if most else None,
            "max_day_flight_count": most["flight_count"] if most else None,
        })
    return ranges
