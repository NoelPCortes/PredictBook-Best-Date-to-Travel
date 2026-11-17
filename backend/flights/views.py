from datetime import datetime, time, timedelta
from zoneinfo import ZoneInfo

from django.db.models import Count, Q, Sum
from django.db.models.functions import TruncDate
from django.utils import timezone
from rest_framework import generics
from rest_framework.exceptions import NotFound
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from traffic.calculation import project_timezone

from .models import Airline, Airport, Flight
from .permissions import CanManageOwnRecords
from .serializers import (
    AirlineSerializer,
    AirportSerializer,
    FlightFilterSerializer,
    FlightSerializer,
    RouteDatesFilterSerializer,
)
from .services import delete_flight, save_flight


class AirportListView(generics.ListAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = AirportSerializer
    queryset = Airport.objects.annotate(forecast_count=Count("crowdforecast")).order_by("code")


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
        for field in ("destination", "airline"):
            if field in values:
                flights = flights.filter(**{field: values[field]})
        if values.get("upcoming"):
            flights = flights.filter(departure_time__gte=timezone.now())
        if values.get("search"):
            matches = Q()
            for field in (
                "flight_number",
                "airline__name",
                "airline__code",
                "origin__code",
                "origin__name",
                "origin__city",
                "destination__code",
                "destination__name",
                "destination__city",
            ):
                matches |= Q(**{f"{field}__icontains": values["search"]})
            flights = flights.filter(matches)
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


class RouteDatesView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        filters = RouteDatesFilterSerializer(data=request.query_params)
        filters.is_valid(raise_exception=True)
        values = filters.validated_data
        if (
            Airport.objects.filter(
                pk__in=[values["origin"], values["destination"]]
            ).count()
            != 2
        ):
            raise NotFound("Airport not found.")
        month = values["month"]
        start = datetime.combine(month, time.min, tzinfo=project_timezone())
        end = (start.replace(day=28) + timedelta(days=4)).replace(day=1)
        rows = (
            Flight.objects.filter(
                origin_id=values["origin"],
                destination_id=values["destination"],
                departure_time__gte=start,
                departure_time__lt=end,
            )
            .annotate(date=TruncDate("departure_time", tzinfo=project_timezone()))
            .values("date")
            .annotate(flight_count=Count("pk"), open_seats=Sum("available_seats"))
            .order_by("date")
        )
        return Response({"dates": list(rows)})
