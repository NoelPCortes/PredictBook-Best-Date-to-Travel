from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from . import services
from .models import StaffAssignment, User
from .permissions import IsHead
from .serializers import (
    EmailSerializer,
    LogoutSerializer,
    PasswordChangeSerializer,
    PendingStaffSerializer,
    ProfileSerializer,
    RemoveHeadSerializer,
    SigninSerializer,
    SignupSerializer,
    StaffListSerializer,
)


class SignupView(generics.GenericAPIView):
    authentication_classes = ()
    permission_classes = (AllowAny,)
    serializer_class = SignupSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(ProfileSerializer(user).data, status=status.HTTP_201_CREATED)


class SigninView(generics.GenericAPIView):
    authentication_classes = ()
    permission_classes = (AllowAny,)
    serializer_class = SigninSerializer

    def get_authenticate_header(self, request):
        return "Bearer"

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = serializer.validated_data
        return Response(
            {
                "access": result["access"],
                "refresh": result["refresh"],
                "profile": ProfileSerializer(result["user"]).data,
            }
        )


class LogoutView(generics.GenericAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = LogoutSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"detail": "Signed out."})


class ProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = ProfileSerializer
    http_method_names = ("get", "patch", "head", "options")

    def get_object(self):
        return self.request.user


class PasswordChangeView(generics.GenericAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = PasswordChangeSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"detail": "Password changed."})


class HeadAreaView(APIView):
    permission_classes = (IsAuthenticated, IsHead)

    def get(self, request):
        return Response({"detail": "Head management access granted."})


class HeadManagementView(APIView):
    permission_classes = (
        IsAuthenticated,
        IsHead,
    )
    serializer_class = EmailSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        detail = self.perform_action(request.user, **serializer.validated_data)
        return Response({"detail": detail})


class AssignStaffView(HeadManagementView):
    perform_action = staticmethod(services.assign_staff)


class PromoteHeadView(HeadManagementView):
    perform_action = staticmethod(services.promote_head)


class RemoveHeadView(HeadManagementView):
    serializer_class = RemoveHeadSerializer
    perform_action = staticmethod(services.remove_head)


class RevokeStaffView(HeadManagementView):
    perform_action = staticmethod(services.revoke_staff)


class StaffListView(APIView):
    permission_classes = (IsAuthenticated, IsHead)

    def get(self, request):
        staff = User.objects.filter(role=User.Role.STAFF).order_by("username")
        pending = StaffAssignment.objects.select_related("assigned_by").order_by(
            "email"
        )
        return Response(
            {
                "staff": StaffListSerializer(staff, many=True).data,
                "pending": PendingStaffSerializer(pending, many=True).data,
            }
        )
