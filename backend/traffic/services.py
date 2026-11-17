from django.db import IntegrityError, transaction
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied, ValidationError

from flights.models import Airport

from .calculation import CALCULATED_SOURCE
from .models import CrowdForecast


def save_forecast(serializer, **kwargs):
    try:
        with transaction.atomic():
            airport = serializer.validated_data.get(
                "airport", getattr(serializer.instance, "airport", None)
            )
            airport_ids = {airport.pk}
            if serializer.instance:
                airport_ids.add(serializer.instance.airport_id)
            list(
                Airport.objects.select_for_update()
                .filter(pk__in=airport_ids)
                .order_by("pk")
            )
            if serializer.instance:
                current = (
                    CrowdForecast.objects.select_for_update()
                    .filter(pk=serializer.instance.pk)
                    .first()
                )
                if current and current.data_source == CALCULATED_SOURCE:
                    raise PermissionDenied("Calculated forecasts are read-only.")
            return serializer.save(calculated_at=timezone.now(), **kwargs)
    except IntegrityError as error:
        constraint = getattr(
            getattr(error.__cause__, "diag", None), "constraint_name", None
        )
        if constraint == "forecast_unique_airport_date":
            raise ValidationError(
                {"date": ["A forecast already exists for this airport and date."]}
            ) from None
        raise
