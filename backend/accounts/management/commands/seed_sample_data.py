import os
from datetime import UTC, datetime, time, timedelta
from zoneinfo import ZoneInfo

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import IntegrityError, transaction
from django.utils import timezone

from accounts.models import User
from flights.models import Airline, Airport, Flight

AIRPORTS = (
    ("MNL", "Ninoy Aquino International Airport", "Manila", "Philippines"),
    ("CEB", "Mactan-Cebu International Airport", "Cebu", "Philippines"),
    ("DVO", "Francisco Bangoy International Airport", "Davao", "Philippines"),
    ("SIN", "Singapore Changi Airport", "Singapore", "Singapore"),
    ("NRT", "Narita International Airport", "Tokyo", "Japan"),
    ("KIX", "Kansai International Airport", "Osaka", "Japan"),
    ("FUK", "Fukuoka Airport", "Fukuoka", "Japan"),
)
AIRLINES = (("Cebu Pacific", "5J"), ("Singapore Airlines", "SQ"))
FLIGHTS = (
    ("Cebu Pacific", "MNL", "NRT", 1, "08:30", 260, 180, 64),
    ("Cebu Pacific", "MNL", "KIX", 2, "06:15", 250, 180, 92),
    ("Cebu Pacific", "CEB", "NRT", 3, "09:40", 275, 180, 35),
    ("Cebu Pacific", "MNL", "SIN", 4, "11:20", 220, 180, 118),
    ("Cebu Pacific", "DVO", "MNL", 5, "07:00", 120, 180, 150),
    ("Singapore Airlines", "SIN", "MNL", 5, "13:45", 230, 250, 87),
    ("Singapore Airlines", "SIN", "CEB", 6, "10:10", 235, 250, 120),
    ("Singapore Airlines", "SIN", "NRT", 7, "00:05", 430, 300, 41),
    ("Singapore Airlines", "SIN", "KIX", 8, "08:50", 405, 300, 156),
    ("Singapore Airlines", "SIN", "FUK", 9, "09:25", 390, 250, 73),
)


def flight_numbers_from_environment():
    value = os.environ.get("SEED_FLIGHT_NUMBERS")
    if value is None or not value.strip():
        raise CommandError(
            "SEED_FLIGHT_NUMBERS is missing; provide exactly 10 comma-separated values."
        )
    numbers = [number.strip() for number in value.split(",")]
    if len(numbers) != 10 or any(not number for number in numbers):
        raise CommandError(
            "SEED_FLIGHT_NUMBERS must contain exactly 10 nonempty comma-separated values."
        )
    if len(set(numbers)) != 10:
        raise CommandError(
            "SEED_FLIGHT_NUMBERS must contain 10 distinct values; duplicates are not allowed."
        )
    if any(len(number) > 10 for number in numbers):
        raise CommandError(
            "Each SEED_FLIGHT_NUMBERS value must be at most 10 characters."
        )
    return numbers


def seed_flights(staff, numbers):
    airports = {
        code: Airport.objects.get_or_create(
            code=code,
            defaults={"name": name, "city": city, "country": country},
        )[0]
        for code, name, city, country in AIRPORTS
    }
    airlines = {
        name: Airline.objects.get_or_create(name=name, defaults={"code": code})[0]
        for name, code in AIRLINES
    }
    project_timezone = ZoneInfo(settings.TIME_ZONE)
    today = timezone.localdate(timezone=project_timezone)
    for number, specification in zip(numbers, FLIGHTS, strict=True):
        (
            airline_name,
            origin,
            destination,
            days,
            local_time,
            duration,
            total,
            available,
        ) = specification
        airline = airlines[airline_name]
        owned = list(
            Flight.objects.filter(
                airline=airline, flight_number=number, created_by=staff
            )
        )
        if len(owned) > 1:
            raise CommandError(
                "Multiple seed-owned flights match an airline and flight number. No rows changed."
            )
        flight = (
            owned[0]
            if owned
            else Flight(
                airline=airline,
                flight_number=number,
                created_by=staff,
                origin=airports[origin],
                destination=airports[destination],
            )
        )
        departure = datetime.combine(
            today + timedelta(days=days),
            time.fromisoformat(local_time),
            tzinfo=project_timezone,
        )
        flight.departure_time = departure
        flight.arrival_time = (
            departure.astimezone(UTC) + timedelta(minutes=duration)
        ).astimezone(project_timezone)
        flight.total_seats = total
        flight.available_seats = available
        conflicts = Flight.objects.filter(
            airline=airline,
            flight_number=number,
            departure_time=departure,
        ).exclude(pk=flight.pk)
        if conflicts.exists():
            raise CommandError(
                "A requested departure conflicts with an existing flight. No rows changed."
            )
        if flight.pk:
            flight.save(
                update_fields=(
                    "departure_time",
                    "arrival_time",
                    "total_seats",
                    "available_seats",
                )
            )
        else:
            flight.save()


class Command(BaseCommand):
    help = "Seed 10 invented flights for local development only, not real timetables."

    def handle(self, *args, **options):
        if settings.DEBUG is not True:
            raise CommandError(
                "seed_sample_data requires DEBUG=True and is for local development only."
            )
        numbers = flight_numbers_from_environment()
        try:
            with transaction.atomic():
                staff = (
                    User.objects.select_for_update()
                    .filter(
                        username=os.environ.get("SEED_STAFF_USERNAME"),
                        role=User.Role.STAFF,
                    )
                    .first()
                )
                if staff is None:
                    raise CommandError(
                        "The seed Staff user is missing. Run python manage.py seed_staff first."
                    )
                seed_flights(staff, numbers)
        except IntegrityError:
            raise CommandError(
                "Sample data conflicts with existing database constraints. No rows changed."
            ) from None
        self.stdout.write("Airports: 7, airlines: 2, flights: 10 (sample data)")
