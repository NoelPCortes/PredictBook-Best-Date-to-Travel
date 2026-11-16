from io import StringIO

import pytest
from django.core.management import call_command
from django.core.management.base import CommandError
from django.utils import timezone

from accounts.management.commands.seed_sample_data import PHILIPPINE_TIME
from accounts.models import User
from flights.models import Airline, Airport, Flight

pytestmark = pytest.mark.django_db


def test_seed_requires_existing_staff_without_writing_records(monkeypatch):
    monkeypatch.setenv("SEED_STAFF_USERNAME", "missing")
    with pytest.raises(CommandError, match="seed_staff first"):
        call_command("seed_sample_data")
    assert not Airport.objects.exists()
    assert not Airline.objects.exists()
    assert not Flight.objects.exists()


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
        "Airports: 5", "Airlines: 3", "Flights: 70",
    ]
    assert staff.username not in output.getvalue()
