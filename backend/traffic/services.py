from django.db import IntegrityError, transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError


def save_forecast(serializer, **kwargs):
    try:
        with transaction.atomic():
            return serializer.save(calculated_at=timezone.now(), **kwargs)
    except IntegrityError as error:
        constraint = getattr(getattr(error.__cause__, "diag", None), "constraint_name", None)
        if constraint == "forecast_unique_airport_date":
            raise ValidationError({"date": ["A forecast already exists for this airport and date."]}) from None
        raise
