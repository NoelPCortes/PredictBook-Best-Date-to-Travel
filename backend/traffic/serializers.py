from datetime import date

from rest_framework import serializers

from accounts.models import User
from accounts.serializers import StrictFieldsMixin
from flights.models import Airport
from flights.permissions import can_edit_record

from .calculation import CALCULATED_SOURCES, flight_totals
from .models import CrowdForecast


class ForecastSerializer(StrictFieldsMixin, serializers.ModelSerializer):
    created_by_username = serializers.SerializerMethodField()
    can_edit = serializers.SerializerMethodField()
    is_calculated = serializers.SerializerMethodField()
    flight_count = serializers.SerializerMethodField()
    seats_total = serializers.SerializerMethodField()
    seats_booked = serializers.SerializerMethodField()

    class Meta:
        model = CrowdForecast
        fields = (
            "id",
            "airport",
            "date",
            "crowd_level",
            "crowd_score",
            "calculated_at",
            "data_source",
            "created_by_username",
            "can_edit",
            "is_calculated",
            "flight_count",
            "seats_total",
            "seats_booked",
        )
        read_only_fields = ("id", "calculated_at")
        validators = ()

    def get_fields(self):
        fields = super().get_fields()
        if self.context["request"].user.role == User.Role.TRAVELER:
            fields.pop("created_by_username")
            fields.pop("can_edit")
        return fields

    def get_can_edit(self, obj):
        return not self.get_is_calculated(obj) and can_edit_record(
            self.context["request"].user, obj
        )

    def get_is_calculated(self, obj):
        return obj.data_source in CALCULATED_SOURCES

    def get_created_by_username(self, obj):
        return None if self.get_is_calculated(obj) else obj.created_by.username

    def totals(self, obj):
        if "flight_totals" not in self.context:
            instances = (
                self.instance if isinstance(self.instance, (list, tuple)) else [obj]
            )
            self.context["flight_totals"] = flight_totals(
                {(item.airport_id, item.date) for item in instances}
            )
        return self.context["flight_totals"][(obj.airport_id, obj.date)]

    def get_flight_count(self, obj):
        return self.totals(obj)["flight_count"]

    def get_seats_total(self, obj):
        return self.totals(obj)["seats_total"]

    def get_seats_booked(self, obj):
        return self.totals(obj)["seats_booked"]

    def validate(self, attrs):
        if attrs.get("data_source") in CALCULATED_SOURCES:
            raise serializers.ValidationError(
                {"data_source": ["Calculated forecasts are managed automatically."]}
            )
        current = self.instance
        airport = attrs.get("airport", getattr(current, "airport", None))
        forecast_date = attrs.get("date", getattr(current, "date", None))
        duplicates = CrowdForecast.objects.filter(airport=airport, date=forecast_date)
        if current:
            duplicates = duplicates.exclude(pk=current.pk)
        if duplicates.exists():
            raise serializers.ValidationError(
                {"date": ["A forecast already exists for this airport and date."]}
            )
        attrs["data_source"] = (
            attrs.get("data_source", getattr(current, "data_source", None))
            or "Staff entry"
        )
        return attrs


class ForecastFilterSerializer(serializers.Serializer):
    search = serializers.CharField(required=False, allow_blank=True)
    level = serializers.ChoiceField(choices=CrowdForecast.CrowdLevel.choices, required=False)
    source = serializers.ChoiceField(choices=("calculated", "manual"), required=False)
    airport = serializers.PrimaryKeyRelatedField(
        queryset=Airport.objects.all(), required=False
    )
    month = serializers.RegexField(r"^\d{4}-\d{2}$", required=False)
    mine = serializers.BooleanField(required=False)

    def validate_month(self, value):
        try:
            return date.fromisoformat(f"{value}-01")
        except ValueError:
            raise serializers.ValidationError(
                "Enter a valid month in YYYY-MM format."
            ) from None


class DateInsightFilterSerializer(serializers.Serializer):
    airport = serializers.IntegerField(min_value=1)
    date = serializers.DateField(input_formats=("%Y-%m-%d",))


class RecommendationFilterSerializer(DateInsightFilterSerializer):
    destination = serializers.IntegerField(min_value=1, required=False)

    def validate(self, attrs):
        if attrs.get("destination") == attrs["airport"]:
            raise serializers.ValidationError({"destination": ["Origin and destination must be different."]})
        return attrs
