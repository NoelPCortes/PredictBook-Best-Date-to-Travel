from django.shortcuts import get_object_or_404
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from flights.models import Airport

from .calculation import flight_totals
from .insights import date_explanation, date_recommendations
from .models import CrowdForecast
from .permissions import CanManageManualForecasts
from .serializers import (
    DateInsightFilterSerializer,
    ForecastFilterSerializer,
    ForecastSerializer,
)
from .services import save_forecast


class ForecastListCreateView(generics.ListCreateAPIView):
    permission_classes = (IsAuthenticated, CanManageManualForecasts)
    serializer_class = ForecastSerializer

    def get_queryset(self):
        filters = ForecastFilterSerializer(data=self.request.query_params)
        filters.is_valid(raise_exception=True)
        values = filters.validated_data
        forecasts = CrowdForecast.objects.select_related("airport", "created_by")
        if "airport" in values:
            forecasts = forecasts.filter(airport=values["airport"])
        if "month" in values:
            month = values["month"]
            forecasts = forecasts.filter(date__year=month.year, date__month=month.month)
        if values.get("mine"):
            forecasts = forecasts.filter(created_by=self.request.user)
        return forecasts.order_by("date", "airport__code", "pk")

    def perform_create(self, serializer):
        save_forecast(serializer, created_by=self.request.user)

    def get_serializer(self, *args, **kwargs):
        if kwargs.get("many"):
            args = (list(args[0]), *args[1:])
            context = self.get_serializer_context()
            context["flight_totals"] = flight_totals(
                {(item.airport_id, item.date) for item in args[0]}
            )
            kwargs["context"] = context
        return super().get_serializer(*args, **kwargs)


class ForecastDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = (IsAuthenticated, CanManageManualForecasts)
    serializer_class = ForecastSerializer
    queryset = CrowdForecast.objects.select_related("airport", "created_by")
    http_method_names = ("get", "patch", "delete", "head", "options")

    def perform_update(self, serializer):
        save_forecast(serializer)


class DateExplanationView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        filters = DateInsightFilterSerializer(data=request.query_params)
        filters.is_valid(raise_exception=True)
        airport = get_object_or_404(Airport, pk=filters.validated_data["airport"])
        return Response(date_explanation(airport, filters.validated_data["date"]))


class DateRecommendationsView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        filters = DateInsightFilterSerializer(data=request.query_params)
        filters.is_valid(raise_exception=True)
        airport = get_object_or_404(Airport, pk=filters.validated_data["airport"])
        return Response(date_recommendations(airport, filters.validated_data["date"]))
