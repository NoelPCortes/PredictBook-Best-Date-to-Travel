from datetime import date

from rest_framework import serializers

from accounts.models import User
from accounts.serializers import StrictFieldsMixin
from flights.models import Airport
from flights.permissions import can_edit_record

from .models import CrowdForecast


class ForecastSerializer(StrictFieldsMixin, serializers.ModelSerializer):
    created_by_username = serializers.CharField(source="created_by.username", read_only=True)
    can_edit = serializers.SerializerMethodField()

    class Meta:
        model = CrowdForecast
        fields = (
            "id", "airport", "date", "crowd_level", "crowd_score", "calculated_at",
            "data_source", "created_by_username", "can_edit",
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
        return can_edit_record(self.context["request"].user, obj)

    def validate(self, attrs):
        current = self.instance
        airport = attrs.get("airport", getattr(current, "airport", None))
        forecast_date = attrs.get("date", getattr(current, "date", None))
        duplicates = CrowdForecast.objects.filter(airport=airport, date=forecast_date)
        if current:
            duplicates = duplicates.exclude(pk=current.pk)
        if duplicates.exists():
            raise serializers.ValidationError({"date": ["A forecast already exists for this airport and date."]})
        attrs["data_source"] = attrs.get("data_source", getattr(current, "data_source", None)) or "Staff entry"
        return attrs


class ForecastFilterSerializer(serializers.Serializer):
    airport = serializers.PrimaryKeyRelatedField(queryset=Airport.objects.all(), required=False)
    month = serializers.RegexField(r"^\d{4}-\d{2}$", required=False)
    mine = serializers.BooleanField(required=False)

    def validate_month(self, value):
        try:
            return date.fromisoformat(f"{value}-01")
        except ValueError:
            raise serializers.ValidationError("Enter a valid month in YYYY-MM format.") from None
