from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsStaffOrHead


class StaffDashboardView(APIView):
    permission_classes = (IsAuthenticated, IsStaffOrHead)

    def get(self, request):
        return Response(
            {
                "detail": "Dashboard uses sample data until the dashboard backend is implemented.",
                "is_sample": True,
            }
        )
