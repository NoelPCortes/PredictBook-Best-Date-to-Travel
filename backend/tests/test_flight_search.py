from datetime import UTC, datetime, timedelta
from unittest.mock import patch

import pytest
import test_forecast_calculation as calculation_tests
from django.db import connection
from django.test.utils import CaptureQueriesContext
from rest_framework.test import APIClient
from test_forecast_calculation import make_flight

pytestmark = pytest.mark.django_db
scenario = calculation_tests.scenario


def client(scenario):
    user = scenario[0]
    user.role = "traveler"
    user.save(update_fields=["role"])
    result = APIClient()
    result.force_authenticate(user)
    return result


@pytest.mark.parametrize(
    "search", ["TA", "Test AIRLINE", "1", "ceb", "mnl", "Philippines-no-match"]
)
def test_case_insensitive_search_matches_only_supported_fields(scenario, search):
    flight = make_flight(scenario)
    response = client(scenario).get("/api/flights/", {"search": search})
    assert response.status_code == 200
    assert response.json()["count"] == (0 if search == "Philippines-no-match" else 1)
    if response.json()["count"]:
        assert response.json()["results"][0]["id"] == flight.pk


def test_filters_combine_upcoming_and_order_departures(scenario):
    now = datetime(2026, 12, 1, 10, tzinfo=UTC)
    past = make_flight(scenario, departure=now - timedelta(seconds=1))
    first = make_flight(scenario, number="2", departure=now)
    second = make_flight(scenario, number="3", departure=now + timedelta(days=1))
    make_flight(
        scenario,
        number="4",
        origin=first.destination,
        destination=first.origin,
        departure=now,
    )
    with patch("django.utils.timezone.now", return_value=now):
        result = (
            client(scenario)
            .get(
                "/api/flights/",
                {
                    "origin": first.origin_id,
                    "destination": first.destination_id,
                    "airline": first.airline_id,
                    "upcoming": "true",
                    "search": "TA",
                },
            )
            .json()
        )
    assert [row["id"] for row in result["results"]] == [first.pk, second.pk]
    assert past.pk not in [row["id"] for row in result["results"]]


def test_route_dates_uses_project_zone_and_departing_direction_only(scenario, settings):
    settings.TIME_ZONE = "Asia/Manila"
    first = make_flight(scenario, departure=datetime(2026, 11, 30, 17, tzinfo=UTC))
    make_flight(
        scenario, number="2", departure=first.departure_time + timedelta(hours=1)
    )
    make_flight(scenario, number="3", departure=datetime(2026, 12, 31, 17, tzinfo=UTC))
    make_flight(
        scenario,
        number="4",
        origin=first.destination,
        destination=first.origin,
        departure=first.departure_time,
    )
    api = client(scenario)
    params = {
        "origin": first.origin_id,
        "destination": first.destination_id,
        "month": "2026-12",
    }
    with CaptureQueriesContext(connection) as queries:
        response = api.get("/api/flights/route-dates/", params)
    assert response.json() == {
        "dates": [{"date": "2026-12-01", "flight_count": 2, "open_seats": 100}]
    }
    assert len(queries) == 2
    assert (
        api.get("/api/flights/route-dates/", {**params, "origin": 99999}).status_code
        == 404
    )
    assert (
        api.get(
            "/api/flights/route-dates/", {**params, "destination": first.origin_id}
        ).status_code
        == 400
    )
    assert (
        api.get("/api/flights/route-dates/", {**params, "month": "2026-99"}).status_code
        == 400
    )
    assert api.get("/api/flights/route-dates/").status_code == 400
    assert APIClient().get("/api/flights/route-dates/", params).status_code == 401
