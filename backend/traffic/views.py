
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from flights.permissions import CanManageOwnRecords

from .models import CrowdForecast
from .serializers import ForecastFilterSerializer, ForecastSerializer
from .services import save_forecast


class ForecastListCreateView(generics.ListCreateAPIView):
    permission_classes = (IsAuthenticated, CanManageOwnRecords)
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


class ForecastDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = (IsAuthenticated, CanManageOwnRecords)
    serializer_class = ForecastSerializer
    queryset = CrowdForecast.objects.select_related("airport", "created_by")
    http_method_names = ("get", "patch", "delete", "head", "options")

    def perform_update(self, serializer):
        save_forecast(serializer)
