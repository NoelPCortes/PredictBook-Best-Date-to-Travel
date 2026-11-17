from django.urls import path

from .views import StaffDashboardView, StaffSummaryView

app_name = "dashboard"

urlpatterns = [
    path("summary/", StaffSummaryView.as_view(), name="staff_summary"),
    path("", StaffDashboardView.as_view(), name="staff_dashboard"),
]
