from django.urls import path

from .views import DateExplanationView, ForecastDetailView, ForecastListCreateView

urlpatterns = [
    path("explanation/", DateExplanationView.as_view(), name="date-explanation"),
    path("forecasts/", ForecastListCreateView.as_view(), name="forecast-list"),
    path("forecasts/<int:pk>/", ForecastDetailView.as_view(), name="forecast-detail"),
]
