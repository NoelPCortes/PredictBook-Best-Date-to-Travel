from datetime import timedelta

from .calculation import (
    FLIGHT_WEIGHT,
    HIGH_THRESHOLD,
    HISTORY_WEIGHT,
    MAX_RECOMMENDATIONS,
    MEDIUM_THRESHOLD,
    RECOMMENDATION_WINDOW,
    calculate_pairs,
    percentage,
    rounded,
)
from .models import CrowdForecast


def date_label(date):
    return f"{date:%b} {date.day}, {date.year}"


def date_explanation(airport, date):
    data = calculate_pairs({(airport.pk, date)})[(airport.pk, date)]
    flights = data["flights"]
    occupancy = rounded(data["occupancy"]) if data["occupancy"] is not None else None
    average = (
        rounded(data["history_average"])
        if data["history_average"] is not None
        else None
    )
    records = [
        {
            "date": row["date"].isoformat(),
            "weekday": row["date"].strftime("%A"),
            "seats_booked": row["seats_booked"],
            "seats_total": row["seats_total"],
            "occupancy_percent": rounded(
                percentage(row["seats_booked"], row["seats_total"])
            ),
        }
        for row in data["records"]
    ]
    sentences = []
    if occupancy is not None:
        sentences.append(
            f"{flights['flight_count']} flights are scheduled for {date:%A}, {date_label(date)}: "
            f"{flights['seats_booked']} of {flights['seats_total']} seats are booked ({occupancy:.1f}%)."
        )
    if average is not None:
        sentences.append(
            f"In 2025, the same weekday around this date averaged {average:.1f}% of seats booked."
        )
    elif data["has_data"]:
        sentences.append(
            "No 2025 history is available for this date, so the score uses 2026 flights only."
        )
    if data["has_data"]:
        sentences.append(
            f"The combined score is {data['crowd_score']:.1f}, which is {data['crowd_level'].title()} "
            "(below 50 is Low, 50 to 74.9 is Medium, 75 and above is High)."
        )
    if flights["departing_count"]:
        sentences.append(
            f"{flights['open_seats']} seats are open on {flights['departing_count']} departing flights."
        )
    return {
        "airport": {"id": airport.pk, "code": airport.code, "name": airport.name},
        "date": date.isoformat(),
        "weekday": date.strftime("%A"),
        "has_data": data["has_data"],
        "flights": {
            "count": flights["flight_count"],
            "departing_count": flights["departing_count"],
            "arriving_count": flights["arriving_count"],
            "seats_total": flights["seats_total"],
            "seats_booked": flights["seats_booked"],
            "occupancy_percent": occupancy,
        },
        "history": {
            "used_dates": [row["date"] for row in records],
            "records": records,
            "average_occupancy_percent": average,
        },
        "weights": {
            "flights": int(FLIGHT_WEIGHT * 100),
            "history": int(HISTORY_WEIGHT * 100),
        },
        "thresholds": {"medium_from": MEDIUM_THRESHOLD, "high_from": HIGH_THRESHOLD},
        "crowd_score": data["crowd_score"],
        "crowd_level": data["crowd_level"],
        "history_available": average is not None,
        "open_seats": flights["open_seats"],
        "sentences": sentences,
    }


def date_recommendations(airport, selected_date):
    forecasts = {
        row.date: row
        for row in CrowdForecast.objects.filter(
            airport=airport,
            date__range=(
                selected_date - timedelta(days=RECOMMENDATION_WINDOW),
                selected_date + timedelta(days=RECOMMENDATION_WINDOW),
            ),
        )
    }
    selected = forecasts.get(selected_date)
    selected_score = selected.crowd_score if selected else None
    calculations = calculate_pairs(
        {(airport.pk, date) for date in {*forecasts, selected_date}}
    )
    selected_history = calculations[(airport.pk, selected_date)]["history_average"]
    candidates = []
    for date, forecast in forecasts.items():
        if date == selected_date or forecast.crowd_score is None:
            continue
        data = calculations[(airport.pk, date)]
        flights = data["flights"]
        if flights["open_seats"] <= 0 or (
            selected_score is not None and forecast.crowd_score >= selected_score
        ):
            continue
        difference = (
            rounded(str(selected_score - forecast.crowd_score))
            if selected_score is not None
            else None
        )
        average = (
            rounded(data["history_average"])
            if data["history_average"] is not None
            else None
        )
        reasons = []
        if difference is not None:
            reasons.append(
                f"Expected crowd score is {difference:.1f} points lower than {date_label(selected_date)} "
                f"({forecast.crowd_score:.1f} compared with {selected_score:.1f})."
            )
        if average is not None:
            comparison = (
                f", compared with {rounded(selected_history):.1f}% for the selected date"
                if selected_history is not None
                else ""
            )
            reasons.append(
                f"In 2025, the same weekday around this date averaged {average:.1f}% seats booked{comparison}."
            )
        reasons.append(
            f"{flights['open_seats']} seats are open on {flights['departing_count']} departing flights."
        )
        if data["occupancy"] is not None:
            reasons.append(
                f"{flights['flight_count']} flights are scheduled that day, with {rounded(data['occupancy']):.1f}% of seats booked."
            )
        candidates.append(
            {
                "date": date.isoformat(),
                "weekday": date.strftime("%A"),
                "crowd_level": forecast.crowd_level,
                "crowd_score": forecast.crowd_score,
                "score_difference": difference,
                "open_seats": flights["open_seats"],
                "flight_count": flights["flight_count"],
                "history_average_occupancy_percent": average,
                "reasons": reasons,
            }
        )
    candidates.sort(
        key=lambda row: (row["crowd_score"], -row["open_seats"], row["date"])
    )
    result = candidates[:MAX_RECOMMENDATIONS]
    return {
        "selected": {
            "date": selected_date.isoformat(),
            "has_data": selected is not None,
            "crowd_score": selected_score,
            "crowd_level": selected.crowd_level if selected else None,
        },
        "recommendations": result,
        "message": ""
        if len(result) == MAX_RECOMMENDATIONS
        else (
            f"Only {len(result)} qualifying dates are available within {RECOMMENDATION_WINDOW} days before or after your selected date."
            if result
            else f"No qualifying dates are available within {RECOMMENDATION_WINDOW} days before or after your selected date."
        ),
    }
