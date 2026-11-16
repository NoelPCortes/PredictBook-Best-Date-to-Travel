from django.conf import settings
from django.db import models


class Airport(models.Model):
    code = models.CharField(max_length=3, unique=True)
    name = models.CharField(max_length=150)
    city = models.CharField(max_length=100)
    country = models.CharField(max_length=100)


class Airline(models.Model):
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=10, unique=True)


class Flight(models.Model):
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    airline = models.ForeignKey(Airline, on_delete=models.PROTECT)
    flight_number = models.CharField(max_length=10)
    origin = models.ForeignKey(
        Airport,
        on_delete=models.PROTECT,
        related_name="departing_flights",
    )
    destination = models.ForeignKey(
        Airport,
        on_delete=models.PROTECT,
        related_name="arriving_flights",
    )
    departure_time = models.DateTimeField()
    arrival_time = models.DateTimeField()
    total_seats = models.PositiveIntegerField()
    available_seats = models.PositiveIntegerField()

    class Meta:
        constraints = (
            models.CheckConstraint(
                condition=~models.Q(origin=models.F("destination")),
                name="flight_distinct_airports",
            ),
            models.CheckConstraint(
                condition=models.Q(arrival_time__gt=models.F("departure_time")),
                name="flight_arrival_after_departure",
            ),
            models.CheckConstraint(
                condition=models.Q(available_seats__gte=0)
                & models.Q(available_seats__lte=models.F("total_seats")),
                name="flight_available_seats_in_range",
            ),
            models.UniqueConstraint(
                fields=["airline", "flight_number", "departure_time"],
                name="flight_unique_airline_number_departure",
            ),
        )
