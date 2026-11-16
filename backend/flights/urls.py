from django.urls import path

from .views import (
    AirlineListView,
    AirportListView,
    FlightDetailView,
    FlightListCreateView,
)

urlpatterns = [
    path("airports/", AirportListView.as_view(), name="airport-list"),
    path("airlines/", AirlineListView.as_view(), name="airline-list"),
    path("", FlightListCreateView.as_view(), name="flight-list"),
    path("<int:pk>/", FlightDetailView.as_view(), name="flight-detail"),
]
