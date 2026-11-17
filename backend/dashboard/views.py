from rest_framework import serializers
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsStaffOrHead
from flights.models import Airport

from .services import dashboard_summary


class StaffDashboardView(APIView):
    permission_classes = (IsAuthenticated, IsStaffOrHead)

    def get(self, request):
        return Response(
            {
                "detail": "Dashboard uses sample data until the dashboard backend is implemented.",
                "is_sample": True,
            }
        )


class SummaryFilterSerializer(serializers.Serializer):
    airport = serializers.PrimaryKeyRelatedField(
        queryset=Airport.objects.all(), required=False
    )


class StaffSummaryView(APIView):
    permission_classes = (IsAuthenticated, IsStaffOrHead)

    def get(self, request):
        filters = SummaryFilterSerializer(data=request.query_params)
        filters.is_valid(raise_exception=True)
        return Response(dashboard_summary(filters.validated_data.get("airport")))
