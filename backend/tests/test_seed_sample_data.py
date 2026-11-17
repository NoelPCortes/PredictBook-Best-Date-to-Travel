from datetime import UTC, datetime, timedelta
from io import StringIO
from unittest.mock import patch
from zoneinfo import ZoneInfo

import pytest
from django.core.management import call_command
from django.core.management.base import CommandError
from django.utils import timezone

from accounts.models import User
from flights.models import Airline, Airport, Flight
from traffic.models import CrowdForecast

pytestmark = pytest.mark.django_db
NUMBERS = [f"TEST{index}" for index in range(10)]
EXPECTED_FLIGHTS = (
    ("5J", "MNL", "NRT", 1, "08:30", 260, 180, 64),
    ("5J", "MNL", "KIX", 2, "06:15", 250, 180, 92),
    ("5J", "CEB", "NRT", 3, "09:40", 275, 180, 35),
    ("5J", "MNL", "SIN", 4, "11:20", 220, 180, 118),
    ("5J", "DVO", "MNL", 5, "07:00", 120, 180, 150),
    ("SQ", "SIN", "MNL", 5, "13:45", 230, 250, 87),
    ("SQ", "SIN", "CEB", 6, "10:10", 235, 250, 120),
    ("SQ", "SIN", "NRT", 7, "00:05", 430, 300, 41),
    ("SQ", "SIN", "KIX", 8, "08:50", 405, 300, 156),
    ("SQ", "SIN", "FUK", 9, "09:25", 390, 250, 73),
)


@pytest.fixture(autouse=True)
def seed_environment(settings, monkeypatch):
    settings.DEBUG = True
    monkeypatch.setenv("SEED_STAFF_USERNAME", "sample_owner")
    monkeypatch.setenv("SEED_FLIGHT_NUMBERS", ",".join(NUMBERS))


@pytest.fixture
def staff():
    return User.objects.create(
        username="sample_owner", email="owner@example.com", role="staff"
    )


def run_seed():
    output = StringIO()
    call_command("seed_sample_data", stdout=output)
    return output.getvalue()


def assert_no_seed_rows():
    assert not Airport.objects.exists()
    assert not Airline.objects.exists()
    assert not Flight.objects.exists()
    assert not CrowdForecast.objects.exists()


def test_creates_only_approved_lookups_and_ten_owned_flights(staff):
    assert run_seed() == "Airports: 7, airlines: 2, flights: 10 (sample data)\n"
    assert Airport.objects.count() == 7
    assert set(Airport.objects.values_list("code", "name", "city", "country")) == {
        ("MNL", "Ninoy Aquino International Airport", "Manila", "Philippines"),
        ("CEB", "Mactan-Cebu International Airport", "Cebu", "Philippines"),
        ("DVO", "Francisco Bangoy International Airport", "Davao", "Philippines"),
        ("SIN", "Singapore Changi Airport", "Singapore", "Singapore"),
        ("NRT", "Narita International Airport", "Tokyo", "Japan"),
        ("KIX", "Kansai International Airport", "Osaka", "Japan"),
        ("FUK", "Fukuoka Airport", "Fukuoka", "Japan"),
    }
    assert set(Airline.objects.values_list("name", "code")) == {
        ("Cebu Pacific", "5J"),
        ("Singapore Airlines", "SQ"),
    }
    assert Flight.objects.count() == 10
    assert Flight.objects.filter(created_by=staff).count() == 10
    assert set(Flight.objects.values_list("flight_number", flat=True)) == set(NUMBERS)
    assert CrowdForecast.objects.filter(data_source="Calculated from flights").exists()


def test_exact_schedule_and_database_rules_use_project_timezone(staff, settings):
    settings.TIME_ZONE = "UTC"
    now = datetime(2026, 11, 16, 23, 30, tzinfo=UTC)
    with patch("django.utils.timezone.now", return_value=now):
        run_seed()
    for number, expected in zip(NUMBERS, EXPECTED_FLIGHTS, strict=True):
        airline, origin, destination, offset, departure, duration, total, available = (
            expected
        )
        flight = Flight.objects.select_related("airline", "origin", "destination").get(
            flight_number=number
        )
        assert (flight.airline.code, flight.origin.code, flight.destination.code) == (
            airline,
            origin,
            destination,
        )
        assert flight.departure_time.date() == now.date() + timedelta(days=offset)
        assert flight.departure_time.strftime("%H:%M") == departure
        assert flight.arrival_time - flight.departure_time == timedelta(
            minutes=duration
        )
        assert (flight.total_seats, flight.available_seats) == (total, available)
        assert flight.origin_id != flight.destination_id
        assert flight.arrival_time > flight.departure_time
        assert 0 <= flight.available_seats <= flight.total_seats
        assert flight.created_by == staff
        flight.full_clean()


def test_arrival_uses_elapsed_time_across_daylight_saving_transition(staff, settings):
    settings.TIME_ZONE = "America/New_York"
    now = datetime(2026, 10, 25, 12, tzinfo=UTC)
    with patch("django.utils.timezone.now", return_value=now):
        run_seed()
    flight = Flight.objects.get(flight_number=NUMBERS[7])
    project_timezone = ZoneInfo(settings.TIME_ZONE)
    assert (
        flight.departure_time.astimezone(project_timezone).strftime("%Y-%m-%d %H:%M")
        == "2026-11-01 00:05"
    )
    assert (
        flight.arrival_time.astimezone(project_timezone).strftime("%Y-%m-%d %H:%M")
        == "2026-11-01 06:15"
    )
    assert flight.arrival_time - flight.departure_time == timedelta(hours=7, minutes=10)


@pytest.mark.parametrize(
    "value,message",
    [
        (None, "missing"),
        ("", "missing"),
        ("   ", "missing"),
        ("A,B", "exactly 10"),
        (",".join(NUMBERS + ["EXTRA"]), "exactly 10"),
        (",".join(NUMBERS[:-1] + [""]), "nonempty"),
        (",".join(NUMBERS[:-1] + [NUMBERS[0]]), "distinct"),
        (",".join(NUMBERS[:-1] + ["LONGNUMBER1"]), "at most 10"),
    ],
)
def test_invalid_numbers_stop_before_writing(staff, monkeypatch, value, message):
    if value is None:
        monkeypatch.delenv("SEED_FLIGHT_NUMBERS", raising=False)
    else:
        monkeypatch.setenv("SEED_FLIGHT_NUMBERS", value)
    with pytest.raises(CommandError, match=message) as error:
        run_seed()
    assert "SEED_FLIGHT_NUMBERS" in str(error.value)
    assert_no_seed_rows()


def test_surrounding_whitespace_is_trimmed_and_ten_character_values_are_allowed(
    staff, monkeypatch
):
    values = [f"NUMBER000{index}" for index in range(10)]
    monkeypatch.setenv("SEED_FLIGHT_NUMBERS", ", ".join(values))
    run_seed()
    assert set(Flight.objects.values_list("flight_number", flat=True)) == set(values)


def test_whitespace_cannot_hide_duplicate_numbers(staff, monkeypatch):
    monkeypatch.setenv(
        "SEED_FLIGHT_NUMBERS", ",".join(NUMBERS[:-1] + [f" {NUMBERS[0]} "])
    )
    with pytest.raises(CommandError, match="distinct"):
        run_seed()
    assert_no_seed_rows()


def test_missing_staff_directs_owner_to_seed_staff():
    with pytest.raises(CommandError, match="python manage.py seed_staff first"):
        run_seed()
    assert_no_seed_rows()


@pytest.mark.parametrize("role", ["traveler", "head"])
def test_non_staff_user_does_not_qualify(role):
    User.objects.create(username="sample_owner", email="owner@example.com", role=role)
    with pytest.raises(CommandError, match="seed Staff user"):
        run_seed()
    assert_no_seed_rows()


def test_debug_false_refuses_to_write(staff, settings):
    settings.DEBUG = False
    with pytest.raises(CommandError, match="DEBUG=True"):
        run_seed()
    assert_no_seed_rows()


def test_rerunning_moves_dates_and_updates_seats_without_adding_owned_flights(staff):
    today = datetime(2026, 11, 16, 12, tzinfo=UTC)
    with patch("django.utils.timezone.now", return_value=today):
        run_seed()
    before = {flight.pk: flight.departure_time for flight in Flight.objects.all()}
    Flight.objects.update(total_seats=400, available_seats=0)
    with patch("django.utils.timezone.now", return_value=today + timedelta(days=5)):
        run_seed()
    assert Flight.objects.count() == 10
    assert set(Flight.objects.values_list("pk", flat=True)) == set(before)
    for flight in Flight.objects.all():
        assert flight.departure_time == before[flight.pk] + timedelta(days=5)
    assert Flight.objects.get(flight_number=NUMBERS[0]).available_seats == 64
    assert Flight.objects.get(flight_number=NUMBERS[0]).total_seats == 180


def test_never_changes_another_users_flight_even_with_the_same_airline_and_number(
    staff,
):
    run_seed()
    other = User.objects.create(
        username="other", email="other@example.com", role="staff"
    )
    flight = Flight.objects.get(flight_number=NUMBERS[0])
    flight.pk = None
    flight.created_by = other
    flight.departure_time -= timedelta(days=30)
    flight.arrival_time -= timedelta(days=30)
    flight.available_seats = 11
    flight.save()
    before = Flight.objects.filter(pk=flight.pk).values().get()
    run_seed()
    assert Flight.objects.filter(created_by=staff).count() == 10
    assert Flight.objects.count() == 11
    assert Flight.objects.filter(pk=flight.pk).values().get() == before


def test_existing_lookups_and_forecasts_are_never_modified(staff):
    airport = Airport.objects.create(
        code="CEB", name="Existing name", city="Cebu", country="Philippines"
    )
    airline = Airline.objects.create(name="Cebu Pacific", code="5J")
    extra_airport = Airport.objects.create(
        code="ILO", name="Iloilo", city="Iloilo", country="Philippines"
    )
    extra_airline = Airline.objects.create(name="Existing airline", code="ZZ")
    forecast = CrowdForecast.objects.create(
        airport=airport,
        date=timezone.localdate(),
        crowd_level="high",
        crowd_score=73,
        data_source="Existing source",
        calculated_at=timezone.now(),
        created_by=staff,
    )
    before = CrowdForecast.objects.filter(pk=forecast.pk).values().get()
    run_seed()
    airport.refresh_from_db()
    airline.refresh_from_db()
    assert airport.name == "Existing name"
    assert airline.code == "5J"
    assert Airport.objects.filter(pk=extra_airport.pk).exists()
    assert Airline.objects.filter(pk=extra_airline.pk).exists()
    assert (
        CrowdForecast.objects.exclude(data_source="Calculated from flights").count()
        == 1
    )
    assert CrowdForecast.objects.filter(pk=forecast.pk).values().get() == before


def test_conflicting_other_user_departure_stops_atomically(staff):
    run_seed()
    conflict = Flight.objects.get(flight_number=NUMBERS[0])
    other = User.objects.create(
        username="other", email="other@example.com", role="staff"
    )
    conflict.created_by = other
    conflict.save()
    before = list(Flight.objects.order_by("pk").values())
    with pytest.raises(CommandError, match="conflicts with an existing flight"):
        run_seed()
    assert list(Flight.objects.order_by("pk").values()) == before


def test_multiple_existing_seed_matches_stop_without_deleting_data(staff):
    run_seed()
    duplicate = Flight.objects.get(flight_number=NUMBERS[0])
    duplicate.pk = None
    duplicate.departure_time -= timedelta(days=30)
    duplicate.arrival_time -= timedelta(days=30)
    duplicate.save()
    before = list(Flight.objects.order_by("pk").values())
    with pytest.raises(CommandError, match="Multiple seed-owned flights"):
        run_seed()
    assert list(Flight.objects.order_by("pk").values()) == before
