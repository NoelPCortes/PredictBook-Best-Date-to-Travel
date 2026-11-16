from django.db import models


class CrowdForecast(models.Model):
    class CrowdLevel(models.TextChoices):
        LOW = "low", "Low"
        MEDIUM = "medium", "Medium"
        HIGH = "high", "High"

    airport = models.ForeignKey("flights.Airport", on_delete=models.PROTECT)
    date = models.DateField()
    crowd_level = models.CharField(max_length=6, choices=CrowdLevel.choices)
    crowd_score = models.FloatField(null=True, blank=True)
    calculated_at = models.DateTimeField()
    data_source = models.CharField(max_length=100, null=True, blank=True)

    class Meta:
        constraints = (
            models.UniqueConstraint(
                fields=["airport", "date"],
                name="forecast_unique_airport_date",
            ),
        )


class HistoricalRecord(models.Model):
    airport = models.ForeignKey("flights.Airport", on_delete=models.PROTECT)
    date = models.DateField()
    total_flights = models.PositiveIntegerField()
    seats_total = models.PositiveIntegerField()
    seats_booked = models.PositiveIntegerField()

    class Meta:
        constraints = (
            models.UniqueConstraint(
                fields=["airport", "date"],
                name="history_unique_airport_date",
            ),
        )
