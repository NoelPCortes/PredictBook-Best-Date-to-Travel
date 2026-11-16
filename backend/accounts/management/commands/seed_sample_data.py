import os
from datetime import datetime, time, timedelta
from zoneinfo import ZoneInfo

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from accounts.models import User
from flights.models import Airline, Airport, Flight
from traffic.models import CrowdForecast

AIRPORTS = (
    ("CEB", "Mactan-Cebu International Airport", "Cebu"),
    ("MNL", "Ninoy Aquino International Airport", "Manila"),
    ("DVO", "Francisco Bangoy International Airport", "Davao"),
    ("ILO", "Iloilo International Airport", "Iloilo"),
    ("CRK", "Clark International Airport", "Clark"),
)
AIRLINES = (
    ("PR", "Philippine Airlines"),
    ("5J", "Cebu Pacific"),
    ("Z2", "AirAsia Philippines"),
)
PHILIPPINE_TIME = ZoneInfo("Asia/Manila")
WEEKDAY_LEVELS = ("low", "low", "medium", "medium", "high", "high", "medium")


class Command(BaseCommand):
    help = "Create deterministic sample data, not real airline schedules."

    @transaction.atomic
    def handle(self, *args, **options):
        username = os.environ.get("SEED_STAFF_USERNAME")
        staff = User.objects.filter(username=username, role=User.Role.STAFF).first()
        if staff is None:
            raise CommandError(
                "An existing Staff user named by SEED_STAFF_USERNAME is required. "
                "Run python manage.py seed_staff first."
            )

        airports = [
            Airport.objects.update_or_create(
                code=code,
                defaults={"name": name, "city": city, "country": "Philippines"},
            )[0]
            for code, name, city in AIRPORTS
        ]
        airlines = [
            Airline.objects.update_or_create(code=code, defaults={"name": name})[0]
            for code, name in AIRLINES
        ]
        today = timezone.localdate(timezone=PHILIPPINE_TIME)
        flight_count = 0
        for day in range(14):
            for index, origin in enumerate(airports):
                departure = datetime.combine(
                    today + timedelta(days=day),
                    time(hour=8 + index * 2),
                    tzinfo=PHILIPPINE_TIME,
                )
                Flight.objects.update_or_create(
                    airline=airlines[index % len(airlines)],
                    flight_number=str(100 + index),
                    departure_time=departure,
                    defaults={
                        "origin": origin,
                        "destination": airports[(index + 1) % len(airports)],
                        "arrival_time": departure + timedelta(hours=1, minutes=30),
                        "total_seats": 180,
                        "available_seats": 20 + (day * 7 + index * 11) % 161,
                        "created_by": staff,
                    },
                )
                flight_count += 1
        forecast_count = 0
        for day in range(60):
            forecast_date = today + timedelta(days=day)
            for airport in airports:
                CrowdForecast.objects.update_or_create(
                    airport=airport,
                    date=forecast_date,
                    defaults={
                        "crowd_level": WEEKDAY_LEVELS[forecast_date.weekday()],
                        "crowd_score": None,
                        "calculated_at": timezone.now(),
                        "data_source": "Sample data",
                        "created_by": staff,
                    },
                )
                forecast_count += 1
        self.stdout.write("Sample data only; not real airline schedules or predictions.")
        self.stdout.write(f"Airports: {len(airports)}")
        self.stdout.write(f"Airlines: {len(airlines)}")
        self.stdout.write(f"Flights: {flight_count}")
        self.stdout.write(f"Forecasts: {forecast_count}")
