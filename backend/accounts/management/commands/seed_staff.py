import os

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import IntegrityError, transaction
from django.db.models import Q

from accounts.models import User


class Command(BaseCommand):
    help = "Create or update a local development Staff account."

    def handle(self, *args, **options):
        if settings.DEBUG is not True:
            raise CommandError(
                "seed_staff requires DEBUG=True and is for local testing only."
            )
        fields = {}
        for suffix in ("USERNAME", "EMAIL", "PASSWORD"):
            name = f"SEED_STAFF_{suffix}"
            value = os.environ.get(name)
            if not value or not value.strip():
                raise CommandError(f"Missing environment variable: {name}")
            fields[suffix.lower()] = value
        if fields["password"] == "change-me-staff-password":
            raise CommandError(
                "Replace the placeholder SEED_STAFF_PASSWORD before running seed_staff."
            )
        try:
            with transaction.atomic():
                matches = list(
                    User.objects.select_for_update()
                    .filter(
                        Q(username=fields["username"]) | Q(email=fields["email"]),
                    )
                    .order_by("pk")
                )
                if any(user.role == User.Role.HEAD for user in matches):
                    self.stdout.write(
                        "Head account unchanged; Head access cannot be downgraded."
                    )
                    return
                if len(matches) > 1:
                    raise CommandError(
                        "SEED_STAFF_USERNAME and SEED_STAFF_EMAIL match different accounts."
                    )
                user = matches[0] if matches else User()
                is_created = user.pk is None
                user.username = fields["username"]
                user.email = fields["email"]
                user.role = User.Role.STAFF
                user.promoted_by = None
                user.set_password(fields["password"])
                user.save()
        except IntegrityError:
            raise CommandError(
                "SEED_STAFF_USERNAME or SEED_STAFF_EMAIL conflicts with an existing account."
            ) from None
        action = "created" if is_created else "updated"
        self.stdout.write(f"{user.username}: {action}")
