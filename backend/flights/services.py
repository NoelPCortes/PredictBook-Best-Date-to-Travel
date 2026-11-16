from django.db import IntegrityError, transaction
from rest_framework.exceptions import ValidationError

FLIGHT_CONSTRAINT_ERRORS = {
    "flight_distinct_airports": {
        "destination": ["Origin and destination must be different."],
    },
    "flight_arrival_after_departure": {
        "arrival_time": ["Arrival must be after departure."],
    },
    "flight_available_seats_in_range": {
        "available_seats": ["Available seats must be between 0 and total seats."],
    },
    "flight_unique_airline_number_departure": {
        "flight_number": ["This airline, flight number, and departure time already exist."],
    },
}


def save_flight(serializer, **kwargs):
    try:
        with transaction.atomic():
            return serializer.save(**kwargs)
    except IntegrityError as error:
        constraint = getattr(getattr(error.__cause__, "diag", None), "constraint_name", None)
        if constraint in FLIGHT_CONSTRAINT_ERRORS:
            raise ValidationError(FLIGHT_CONSTRAINT_ERRORS[constraint]) from None
        raise
