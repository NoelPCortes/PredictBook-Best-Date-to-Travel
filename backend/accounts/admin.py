from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import User


@admin.register(User)
class AccountUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ("Application access", {"fields": ("role", "promoted_by")}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        (
            "Profile and application access",
            {
                "fields": ("email", "role", "promoted_by"),
            },
        ),
    )
