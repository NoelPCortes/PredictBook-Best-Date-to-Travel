import pytest
import test_forecast_calculation as calculation_tests
from django.db import connection
from django.test.utils import CaptureQueriesContext
from rest_framework.test import APIClient
from test_blended_forecasts import history
from test_forecast_calculation import make_flight

pytestmark = pytest.mark.django_db
scenario = calculation_tests.scenario
PATH = "/api/traffic/explanation/"


def request(scenario, **params):
    client = APIClient()
    client.force_authenticate(scenario[0])
    return client.get(
        PATH, {"airport": scenario[1][0].pk, "date": "2026-12-01", **params}
    )


def test_explanation_fields_real_numbers_sentences_and_privacy(scenario):
    flight = make_flight(scenario, available=60)
    history(flight, 364, 80)
    result = request(scenario).json()
    assert result["airport"] == {"id": flight.origin_id, "code": "CEB", "name": "CEB"}
    assert result["weekday"] == "Tuesday" and result["date"] == "2026-12-01"
    assert result["flights"] == {
        "count": 1,
        "departing_count": 1,
        "arriving_count": 0,
        "seats_total": 100,
        "seats_booked": 40,
        "occupancy_percent": 40,
    }
    assert result["history"]["used_dates"] == ["2025-12-02"]
    assert result["history"]["records"] == [
        {
            "date": "2025-12-02",
            "weekday": "Tuesday",
            "seats_total": 100,
            "seats_booked": 80,
            "occupancy_percent": 80,
        }
    ]
    assert result["history"]["average_occupancy_percent"] == 80
    assert result["weights"] == {"flights": 50, "history": 50}
    assert result["thresholds"] == {"medium_from": 50, "high_from": 75}
    assert result["crowd_score"] == 60 and result["crowd_level"] == "medium"
    assert (
        result["history_available"]
        and result["has_data"]
        and result["open_seats"] == 60
    )
    assert result["sentences"] == [
        "1 flights are scheduled for Tuesday, Dec 1, 2026: 40 of 100 seats are booked (40.0%).",
        "In 2025, the same weekday around this date averaged 80.0% of seats booked.",
        "The combined score is 60.0, which is Medium (below 50 is Low, 50 to 74.9 is Medium, 75 and above is High).",
        "60 seats are open on 1 departing flights.",
    ]
    assert not any(
        value in str(result)
        for value in [scenario[0].username, scenario[0].email, "created_by", "password"]
    )


def test_explanation_fallback_no_flights_and_zero_seats(scenario):
    result = request(scenario).json()
    assert result["has_data"] is False and result["crowd_score"] is None
    assert result["sentences"] == []
    make_flight(scenario, available=50)
    result = request(scenario).json()
    assert result["crowd_score"] == 50 and not result["history_available"]
    assert (
        "No 2025 history is available for this date, so the score uses 2026 flights only."
        in result["sentences"]
    )
    assert result["history"]["average_occupancy_percent"] is None


@pytest.mark.parametrize(
    "params",
    [
        {},
        {"airport": 1},
        {"date": "2026-12-01"},
        {"airport": "bad", "date": "2026-12-01"},
        {"airport": 1, "date": "2026-99-01"},
    ],
)
def test_missing_or_invalid_parameters_are_400(scenario, params):
    client = APIClient()
    client.force_authenticate(scenario[0])
    assert client.get(PATH, params).status_code == 400


def test_unknown_airport_404_and_signed_out_401(scenario):
    assert request(scenario, airport=999999).status_code == 404
    assert APIClient().get(PATH).status_code == 401


def test_explanation_query_count_is_constant_with_many_flights_and_history(scenario):
    make_flight(scenario)
    with CaptureQueriesContext(connection) as first:
        assert request(scenario).status_code == 200
    for number in range(2, 20):
        flight = make_flight(scenario, number=str(number))
    for offset in (371, 364, 357):
        history(flight, offset, 80)
    with CaptureQueriesContext(connection) as second:
        assert request(scenario).json()["flights"]["count"] == 19
    assert len(first) == len(second) == 4
