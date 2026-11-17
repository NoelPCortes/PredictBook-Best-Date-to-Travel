from rest_framework import serializers

from accounts.models import User
from accounts.serializers import StrictFieldsMixin

from .models import Airline, Airport, Flight
from .permissions import can_edit_record


class AirportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Airport
        fields = ("id", "code", "name", "city", "country")


class AirlineSerializer(serializers.ModelSerializer):
    class Meta:
        model = Airline
        fields = ("id", "name", "code")


class FlightSerializer(StrictFieldsMixin, serializers.ModelSerializer):
    airline_name = serializers.CharField(source="airline.name", read_only=True)
    airline_code = serializers.CharField(source="airline.code", read_only=True)
    origin_code = serializers.CharField(source="origin.code", read_only=True)
    origin_name = serializers.CharField(source="origin.name", read_only=True)
    destination_code = serializers.CharField(source="destination.code", read_only=True)
    destination_name = serializers.CharField(source="destination.name", read_only=True)
    created_by_username = serializers.CharField(
        source="created_by.username", read_only=True
    )
    can_edit = serializers.SerializerMethodField()

    class Meta:
        model = Flight
        fields = (
            "id",
            "airline",
            "airline_name",
            "airline_code",
            "flight_number",
            "origin",
            "origin_code",
            "origin_name",
            "destination",
            "destination_code",
            "destination_name",
            "departure_time",
            "arrival_time",
            "total_seats",
            "available_seats",
            "created_by_username",
            "can_edit",
        )
        read_only_fields = ("id",)
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

        def value(name):
            return attrs[name] if name in attrs else getattr(current, name, None)

        errors = {}
        if value("origin") == value("destination"):
            errors["destination"] = ["Origin and destination must be different."]
        if value("arrival_time") <= value("departure_time"):
            errors["arrival_time"] = ["Arrival must be after departure."]
        if not 0 <= value("available_seats") <= value("total_seats"):
            errors["available_seats"] = [
                "Available seats must be between 0 and total seats."
            ]
        duplicates = Flight.objects.filter(
            airline=value("airline"),
            flight_number=value("flight_number"),
            departure_time=value("departure_time"),
        )
        if current:
            duplicates = duplicates.exclude(pk=current.pk)
        if duplicates.exists():
            errors["flight_number"] = [
                "This airline, flight number, and departure time already exist."
            ]
        if errors:
            raise serializers.ValidationError(errors)
        return attrs


class FlightFilterSerializer(serializers.Serializer):
    airport = serializers.PrimaryKeyRelatedField(
        queryset=Airport.objects.all(), required=False
    )
    origin = serializers.PrimaryKeyRelatedField(
        queryset=Airport.objects.all(), required=False
    )
    date = serializers.DateField(required=False, input_formats=("%Y-%m-%d",))
    mine = serializers.BooleanField(required=False)
