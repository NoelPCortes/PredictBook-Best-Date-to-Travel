from datetime import UTC, datetime, timedelta

import pytest
from rest_framework.test import APIClient

from accounts.models import User
from flights.models import Airline, Airport, Flight

pytestmark = pytest.mark.django_db


def test_airport_filter_uses_arrival_or_departure_local_dates_and_combines_mine(
    settings,
):
    settings.TIME_ZONE = "UTC"
    user = User.objects.create(
        username="staff", email="staff@example.com", role="staff"
    )
    other = User.objects.create(
        username="other", email="other@example.com", role="staff"
    )
    airport = Airport.objects.create(
        code="CEB", name="Cebu", city="Cebu", country="Philippines"
    )
    away = Airport.objects.create(
        code="MNL", name="Manila", city="Manila", country="Philippines"
    )
    airline = Airline.objects.create(name="Airline", code="TA")

    def create(number, origin, destination, departure, owner=user):
        return Flight.objects.create(
            airline=airline,
            flight_number=number,
            origin=origin,
            destination=destination,
            departure_time=departure,
            arrival_time=departure + timedelta(hours=2),
            total_seats=100,
            available_seats=50,
            created_by=owner,
        )

    departing = create("1", airport, away, datetime(2026, 12, 1, 23, tzinfo=UTC))
    arriving = create("2", away, airport, datetime(2026, 11, 30, 23, tzinfo=UTC))
    create("3", airport, away, datetime(2026, 12, 2, 1, tzinfo=UTC))
    other_flight = create(
        "4", away, airport, datetime(2026, 12, 1, 8, tzinfo=UTC), other
    )
    client = APIClient()
    client.force_authenticate(user)
    response = client.get(
        "/api/flights/", {"airport": airport.pk, "date": "2026-12-01"}
    )
    assert response.status_code == 200
    directions = {row["id"]: row["direction"] for row in response.json()["results"]}
    assert directions == {
        departing.pk: "departing",
        arriving.pk: "arriving",
        other_flight.pk: "arriving",
    }
    assert {row["id"] for row in response.json()["results"]} == {
        departing.pk,
        arriving.pk,
        other_flight.pk,
    }
    assert {
        row["id"]
        for row in client.get(
            "/api/flights/",
            {"airport": airport.pk, "date": "2026-12-01", "mine": "true"},
        ).json()["results"]
    } == {departing.pk, arriving.pk}
    assert client.get("/api/flights/", {"airport": "bad"}).status_code == 400
    settings.TIME_ZONE = "Asia/Manila"
    assert departing.pk not in {
        row["id"]
        for row in client.get(
            "/api/flights/", {"airport": airport.pk, "date": "2026-12-01"}
        ).json()["results"]
    }
