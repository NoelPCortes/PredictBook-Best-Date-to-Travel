from collections import Counter
from datetime import timedelta

from django.utils import timezone

from flights.models import Airport
from traffic.calculation import project_timezone
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
    }
