from rest_framework.permissions import SAFE_METHODS, BasePermission

from accounts.models import User


def can_edit_record(user, record):
    return user.role == User.Role.HEAD or (
        user.role == User.Role.STAFF and record.created_by_id == user.pk
    )


class CanManageOwnRecords(BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.method in SAFE_METHODS or request.user.role in (
            User.Role.STAFF, User.Role.HEAD,
        )

    def has_object_permission(self, request, view, obj):
        return request.method in SAFE_METHODS or can_edit_record(request.user, obj)
