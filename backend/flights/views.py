from datetime import datetime, time, timedelta
from zoneinfo import ZoneInfo

from django.db.models import Q
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from traffic.calculation import project_timezone

from .models import Airline, Airport, Flight
from .permissions import CanManageOwnRecords
from .serializers import (
    AirlineSerializer,
    AirportSerializer,
    FlightFilterSerializer,
    FlightSerializer,
)
from .services import delete_flight, save_flight


class AirportListView(generics.ListAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = AirportSerializer
    queryset = Airport.objects.order_by("code")


class AirlineListView(generics.ListAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = AirlineSerializer
    queryset = Airline.objects.order_by("name")


class FlightListCreateView(generics.ListCreateAPIView):
    permission_classes = (IsAuthenticated, CanManageOwnRecords)
    serializer_class = FlightSerializer

    def get_queryset(self):
        filters = FlightFilterSerializer(data=self.request.query_params)
        filters.is_valid(raise_exception=True)
        values = filters.validated_data
        flights = Flight.objects.select_related(
            "airline", "origin", "destination", "created_by"
        )
        if "origin" in values:
            flights = flights.filter(origin=values["origin"])
        if "airport" in values:
            airport = values["airport"]
            if "date" in values:
                start = datetime.combine(
                    values["date"], time.min, tzinfo=project_timezone()
                )
                end = start + timedelta(days=1)
                flights = flights.filter(
                    Q(origin=airport, departure_time__gte=start, departure_time__lt=end)
                    | Q(
                        destination=airport,
                        arrival_time__gte=start,
                        arrival_time__lt=end,
                    )
                )
            else:
                flights = flights.filter(Q(origin=airport) | Q(destination=airport))
        elif "date" in values:
            start = datetime.combine(
                values["date"], time.min, tzinfo=ZoneInfo("Asia/Manila")
            )
            flights = flights.filter(
                departure_time__gte=start, departure_time__lt=start + timedelta(days=1)
            )
        if values.get("mine"):
            flights = flights.filter(created_by=self.request.user)
        return flights.order_by("departure_time", "pk")

    def perform_create(self, serializer):
        save_flight(serializer, created_by=self.request.user)


class FlightDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = (IsAuthenticated, CanManageOwnRecords)
    serializer_class = FlightSerializer
    queryset = Flight.objects.select_related(
        "airline", "origin", "destination", "created_by"
    )
    http_method_names = ("get", "patch", "delete", "head", "options")

    def perform_update(self, serializer):
        save_flight(serializer)

    def perform_destroy(self, instance):
        delete_flight(instance, self.request.user)
