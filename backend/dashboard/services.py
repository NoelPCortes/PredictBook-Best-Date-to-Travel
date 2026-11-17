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
        "comparison": period_comparison(airport, rows),
    }


def period_comparison(airport, forecasts):
    calculations = (
        calculate_pairs({(airport.pk, row.date) for row in forecasts})
        if airport
        else {}
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
