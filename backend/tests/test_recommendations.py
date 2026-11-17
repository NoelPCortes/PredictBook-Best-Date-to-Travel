from datetime import UTC, datetime, timedelta

import pytest
import test_forecast_calculation as calculation_tests
from django.db import connection
from django.test.utils import CaptureQueriesContext
from rest_framework.test import APIClient
from test_blended_forecasts import history
from test_forecast_calculation import make_flight

from traffic.calculation import recalculate_forecasts
from traffic.models import CrowdForecast

pytestmark = pytest.mark.django_db
scenario = calculation_tests.scenario
SELECTED = datetime(2026, 12, 15, 8, tzinfo=UTC)
PATH = "/api/traffic/recommendations/"


def request(scenario, **params):
    client = APIClient()
    client.force_authenticate(scenario[0])
    return client.get(
        PATH, {"airport": scenario[1][0].pk, "date": "2026-12-15", **params}
    )


def add(scenario, offset, available=50, total=100, **kwargs):
    return make_flight(
        scenario,
        number=str(offset),
        departure=SELECTED + timedelta(days=offset),
        available=available,
        total=total,
        **kwargs,
    )


def test_window_selected_exclusion_ranking_seats_and_date_ties(scenario):
    add(scenario, 0, available=10)
    for offset in [-8, -7, -6, 1, 7, 8]:
        add(scenario, offset, available=60 if offset != -7 else 50, total=100)
    recalculate_forecasts(scenario[0])
    result = request(scenario).json()
    assert [row["date"] for row in result["recommendations"]] == [
        "2026-12-09",
        "2026-12-16",
        "2026-12-22",
    ]
    assert result["message"] == ""
    assert result["selected"] == {
        "date": "2026-12-15",
        "has_data": True,
        "crowd_score": 90,
        "crowd_level": "high",
    }
    assert all(row["score_difference"] == 50 for row in result["recommendations"])
    assert result["recommendations"][0]["reasons"] == [
        "Expected crowd score is 50.0 points lower than Dec 15, 2026 (40.0 compared with 90.0).",
        "60 seats are open on 1 departing flights.",
        "1 flights are scheduled that day, with 40.0% of seats booked.",
    ]


def test_equal_score_open_seats_descending_then_date(scenario):
    add(scenario, 0, available=0)
    add(scenario, -2, available=50, total=100)
    add(scenario, -1, available=100, total=200)
    add(scenario, 1, available=100, total=200)
    recalculate_forecasts(scenario[0])
    assert [row["date"] for row in request(scenario).json()["recommendations"]] == [
        "2026-12-14",
        "2026-12-16",
        "2026-12-13",
    ]


def test_only_departing_open_seats_qualify_and_manual_null_scores_are_excluded(
    scenario,
):
    add(scenario, 0, available=20)
    add(scenario, -1, available=20)  # Equal score.
    add(scenario, 1, available=0)
    add(scenario, 2, available=90, origin=scenario[1][1], destination=scenario[1][0])
    add(scenario, 3, available=90)
    recalculate_forecasts(scenario[0])
    CrowdForecast.objects.filter(
        airport=scenario[1][0], date=(SELECTED + timedelta(days=3)).date()
    ).update(crowd_score=None, data_source="Staff entry")
    assert request(scenario).json()["recommendations"] == []
    assert "No qualifying dates" in request(scenario).json()["message"]


def test_missing_selected_forecast_returns_fewer_without_difference_or_invented_history(
    scenario,
):
    add(scenario, 1, available=60)
    recalculate_forecasts(scenario[0])
    result = request(scenario).json()
    assert result["selected"]["has_data"] is False
    assert len(result["recommendations"]) == 1 and "Only 1" in result["message"]
    row = result["recommendations"][0]
    assert (
        row["score_difference"] is None
        and row["history_average_occupancy_percent"] is None
    )
    assert len(row["reasons"]) == 2


def test_history_reasons_only_compare_when_selected_history_exists(scenario):
    selected = add(scenario, 0, available=0)
    candidate = add(scenario, 1, available=60)
    history(candidate, 364, 60)
    recalculate_forecasts(scenario[0])
    reason = request(scenario).json()["recommendations"][0]["reasons"][1]
    assert (
        reason
        == "In 2025, the same weekday around this date averaged 60.0% seats booked."
    )
    history(selected, 364, 80)
    assert (
        "compared with 80.0% for the selected date"
        in request(scenario).json()["recommendations"][0]["reasons"][1]
    )


def test_recommendation_permissions_validation_and_constant_query_count(scenario):
    assert APIClient().get(PATH).status_code == 401
    assert request(scenario, date="bad").status_code == 400
    assert request(scenario, airport=999999).status_code == 404
    client = APIClient()
    client.force_authenticate(scenario[0])
    assert client.get(PATH).status_code == 400
    add(scenario, 0, available=0)
    add(scenario, 1)
    recalculate_forecasts(scenario[0])
    with CaptureQueriesContext(connection) as first:
        assert request(scenario).status_code == 200
    for offset in [-7, -6, -5, -4, -3, -2, -1, 2, 3, 4, 5, 6, 7]:
        add(scenario, offset)
    recalculate_forecasts(scenario[0])
    with CaptureQueriesContext(connection) as second:
        result = request(scenario).json()
    assert len(first) == len(second) == 5
    assert not any(
        value in str(result)
        for value in [scenario[0].username, scenario[0].email, "created_by"]
    )
