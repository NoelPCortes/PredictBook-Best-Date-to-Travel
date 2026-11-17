from datetime import UTC, datetime, timedelta
from pathlib import Path

import pytest
from django.db import connection
from django.db.models import Count, F
from django.db.models.functions import TruncDate

from accounts.models import User
from flights.models import Airline, Airport, Flight
from traffic.models import CrowdForecast, HistoricalRecord

pytestmark = pytest.mark.django_db(transaction=True)
SCRIPT = Path(__file__).resolve().parents[1] / "database" / "sample_flights.sql"


def execute_sample(username):
    with connection.cursor() as cursor:
        cursor.execute("SELECT set_config('predictbook.seed_staff_username', %s, false)", [username])
        cursor.execute(SCRIPT.read_text())


def test_sql_is_repeatable_and_preserves_other_flights_and_manual_forecasts():
    seed = User.objects.create(username="sql_seed", email="seed@example.com", role="head")
    other = User.objects.create(username="other", email="other@example.com", role="staff")
    origin = Airport.objects.create(code="MNL", name="Manila", city="Manila", country="Philippines")
    destination = Airport.objects.create(code="CEB", name="Cebu", city="Cebu", country="Philippines")
    airline = Airline.objects.create(name="Cebu Pacific", code="5J")
    departure = datetime(2026, 1, 1, tzinfo=UTC)
    flight = Flight.objects.create(created_by=other, airline=airline, flight_number="KEEP", origin=origin,
        destination=destination, departure_time=departure, arrival_time=departure + timedelta(hours=1),
        total_seats=100, available_seats=50)
    manual = CrowdForecast.objects.create(created_by=other, airport=origin, date=departure.date(),
        crowd_level="high", calculated_at=departure, data_source="Staff entry")
    for _ in range(2):
        execute_sample(seed.username)
        seeded = Flight.objects.filter(created_by=seed)
        assert seeded.count() == 7300
        assert HistoricalRecord.objects.count() == 3650
        assert Airport.objects.count() == 10 and Airline.objects.count() == 5
        assert not seeded.filter(origin=F("destination")).exists()
        assert not seeded.filter(arrival_time__lte=F("departure_time")).exists()
        assert not seeded.filter(available_seats__gt=F("total_seats")).exists()
        counts = list(seeded.annotate(day=TruncDate("departure_time")).values("day").annotate(total=Count("pk")))
        assert len(counts) == 365 and all(row["total"] == 20 for row in counts)
        assert Flight.objects.get(pk=flight.pk).available_seats == 50
        assert CrowdForecast.objects.get(pk=manual.pk).data_source == "Staff entry"


def test_sql_missing_seed_stops_before_deleting_anything():
    with pytest.raises(Exception, match="seed_staff first"):
        execute_sample("missing")
    connection.rollback()
    assert Flight.objects.count() == HistoricalRecord.objects.count() == 0
