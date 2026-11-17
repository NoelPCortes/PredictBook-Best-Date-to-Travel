from django.urls import path

from .views import (
    DateExplanationView,
    DateRecommendationsView,
    ForecastDetailView,
    ForecastListCreateView,
)

urlpatterns = [
    path(
        "recommendations/",
        DateRecommendationsView.as_view(),
        name="date-recommendations",
    ),
    path("explanation/", DateExplanationView.as_view(), name="date-explanation"),
    path("forecasts/", ForecastListCreateView.as_view(), name="forecast-list"),
    path("forecasts/<int:pk>/", ForecastDetailView.as_view(), name="forecast-detail"),
]
