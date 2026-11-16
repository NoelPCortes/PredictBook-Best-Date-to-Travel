from django.urls import path

from .views import ForecastDetailView, ForecastListCreateView

urlpatterns = [
    path("forecasts/", ForecastListCreateView.as_view(), name="forecast-list"),
    path("forecasts/<int:pk>/", ForecastDetailView.as_view(), name="forecast-detail"),
]
