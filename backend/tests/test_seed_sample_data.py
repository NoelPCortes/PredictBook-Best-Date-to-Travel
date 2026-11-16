from io import StringIO

import pytest
from django.core.management import call_command
from django.core.management.base import CommandError
from django.utils import timezone

from accounts.management.commands.seed_sample_data import (
    PHILIPPINE_TIME,
    WEEKDAY_LEVELS,
)
from accounts.models import User
from flights.models import Airline, Airport, Flight
from traffic.models import CrowdForecast

pytestmark = pytest.mark.django_db


def test_seed_requires_existing_staff_without_writing_records(monkeypatch):
    monkeypatch.setenv("SEED_STAFF_USERNAME", "missing")
    with pytest.raises(CommandError, match="seed_staff first"):
        call_command("seed_sample_data")
    assert not Airport.objects.exists()
    assert not Airline.objects.exists()
    assert not Flight.objects.exists()
    assert not CrowdForecast.objects.exists()


@pytest.mark.parametrize("role", ["traveler", "head"])
def test_seed_rejects_non_staff_owner(monkeypatch, role):
    User.objects.create(username="seed", email="seed@example.com", role=role)
    monkeypatch.setenv("SEED_STAFF_USERNAME", "seed")
    with pytest.raises(CommandError, match="existing Staff"):
        call_command("seed_sample_data")
    assert not Airport.objects.exists()


def test_seed_is_idempotent_owned_and_prints_counts_only(monkeypatch):
    staff = User.objects.create(username="seed", email="seed@example.com", role="staff")
    monkeypatch.setenv("SEED_STAFF_USERNAME", staff.username)
    output = StringIO()
    call_command("seed_sample_data", stdout=output)
    flight = Flight.objects.order_by("pk").first()
    flight.available_seats = 0
    flight.save()
    call_command("seed_sample_data", stdout=StringIO())
    flight.refresh_from_db()
    assert flight.available_seats == 20
    assert Airport.objects.count() == 5
    assert Airline.objects.count() == 3
    assert Flight.objects.count() == 70
    assert Flight.objects.filter(created_by=staff).count() == 70
    assert Airport.objects.filter(country="Philippines").count() == 5
    today = timezone.localdate(timezone=PHILIPPINE_TIME)
    assert len({f.departure_time.astimezone(PHILIPPINE_TIME).date() for f in Flight.objects.all()}) == 14
    assert flight.departure_time.astimezone(PHILIPPINE_TIME).date() == today
    assert output.getvalue().splitlines() == [
        "Sample data only; not real airline schedules or predictions.",
        "Airports: 5", "Airlines: 3", "Flights: 70", "Forecasts: 300",
    ]
    assert staff.username not in output.getvalue()


def test_seed_forecasts_cover_sixty_days_and_are_idempotent(monkeypatch):
    staff = User.objects.create(username="seed", email="seed@example.com", role="staff")
    monkeypatch.setenv("SEED_STAFF_USERNAME", staff.username)
    call_command("seed_sample_data", stdout=StringIO())
    forecast = CrowdForecast.objects.order_by("date", "pk").first()
    forecast.crowd_level = "high" if forecast.crowd_level == "low" else "low"
    forecast.data_source = "Changed"
    forecast.save()
    before = timezone.now()
    call_command("seed_sample_data", stdout=StringIO())
    forecast.refresh_from_db()
    assert forecast.calculated_at >= before
    assert CrowdForecast.objects.count() == 300
    assert CrowdForecast.objects.filter(created_by=staff, data_source="Sample data").count() == 300
    for airport in Airport.objects.all():
        forecasts = list(CrowdForecast.objects.filter(airport=airport).order_by("date"))
        assert len(forecasts) == 60
        assert forecasts[0].date == timezone.localdate(timezone=PHILIPPINE_TIME)
        assert (forecasts[-1].date - forecasts[0].date).days == 59
        assert all(record.crowd_level == WEEKDAY_LEVELS[record.date.weekday()] for record in forecasts)
        assert all(record.crowd_score is None for record in forecasts)
