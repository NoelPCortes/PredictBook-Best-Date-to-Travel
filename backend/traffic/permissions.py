from rest_framework.permissions import SAFE_METHODS

from flights.permissions import CanManageOwnRecords

from .calculation import CALCULATED_SOURCES


class CanManageManualForecasts(CanManageOwnRecords):
    def has_object_permission(self, request, view, obj):
        if request.method not in SAFE_METHODS and obj.data_source in CALCULATED_SOURCES:
            return False
        return super().has_object_permission(request, view, obj)
