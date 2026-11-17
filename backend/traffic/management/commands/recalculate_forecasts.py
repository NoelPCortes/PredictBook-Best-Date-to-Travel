import os

from django.core.management.base import BaseCommand, CommandError

from accounts.models import User
from traffic.calculation import recalculate_forecasts


class Command(BaseCommand):
    help = "Recalculate flight-based forecasts, preserving manual entries."

    def add_arguments(self, parser):
        parser.add_argument("--remove-sample-data", action="store_true")

    def handle(self, *args, **options):
        staff = User.objects.filter(
            username=os.environ.get("SEED_STAFF_USERNAME"), role=User.Role.STAFF
        ).first()
        if staff is None:
            raise CommandError(
                "The seed Staff user is missing. Run python manage.py seed_staff first."
            )
        counts = recalculate_forecasts(
            staff, remove_sample_data=options["remove_sample_data"]
        )
        self.stdout.write(
            f"Created: {counts['created']}, updated: {counts['updated']}, deleted: {counts['deleted']}, "
            f"manual skipped: {counts['skipped']}, sample deleted: {counts['sample_deleted']}"
        )
