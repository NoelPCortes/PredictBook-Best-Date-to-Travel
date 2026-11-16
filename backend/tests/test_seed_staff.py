from io import StringIO

import pytest
from django.core.management import call_command
from django.core.management.base import CommandError

from accounts.models import StaffAssignment, User

pytestmark = pytest.mark.django_db
TEST_PASSWORD = "Development-test-932!"


@pytest.fixture(autouse=True)
def seed_environment(settings, monkeypatch):
    settings.DEBUG = True
    monkeypatch.setenv("SEED_STAFF_USERNAME", "seed_staff")
    monkeypatch.setenv("SEED_STAFF_EMAIL", "staff@example.com")
    monkeypatch.setenv("SEED_STAFF_PASSWORD", TEST_PASSWORD)


def run_seed():
    output = StringIO()
    call_command("seed_staff", stdout=output)
    assert TEST_PASSWORD not in output.getvalue()
    return output.getvalue()


def test_seed_creates_staff_with_hashed_password():
    assert run_seed() == "seed_staff: created\n"
    user = User.objects.get(username="seed_staff")
    assert user.role == "staff"
    assert user.check_password(TEST_PASSWORD)
    assert user.password != TEST_PASSWORD
    assert not user.is_staff


@pytest.mark.parametrize("matching_field", ["username", "email"])
def test_seed_updates_existing_user(matching_field):
    fields = {"username": "other", "email": "other@example.com"}
    fields[matching_field] = (
        "seed_staff" if matching_field == "username" else "staff@example.com"
    )
    user = User.objects.create_user(**fields, password="old-password")
    assert run_seed() == "seed_staff: updated\n"
    user.refresh_from_db()
    assert user.role == "staff"
    assert user.check_password(TEST_PASSWORD)
    assert User.objects.count() == 1


def test_seed_refuses_outside_debug(settings):
    settings.DEBUG = False
    with pytest.raises(CommandError, match="DEBUG"):
        run_seed()
    assert not User.objects.exists()


def test_seed_refuses_placeholder_password(monkeypatch):
    monkeypatch.setenv("SEED_STAFF_PASSWORD", "change-me-staff-password")
    with pytest.raises(CommandError, match="SEED_STAFF_PASSWORD"):
        run_seed()
    assert not User.objects.exists()


@pytest.mark.parametrize(
    "variable", ["SEED_STAFF_USERNAME", "SEED_STAFF_EMAIL", "SEED_STAFF_PASSWORD"]
)
@pytest.mark.parametrize("empty", [False, True])
def test_seed_names_missing_variables(monkeypatch, variable, empty):
    if empty:
        monkeypatch.setenv(variable, "")
    else:
        monkeypatch.delenv(variable)
    with pytest.raises(CommandError, match=variable) as failure:
        run_seed()
    assert TEST_PASSWORD not in str(failure.value)
    assert not User.objects.exists()


@pytest.mark.parametrize("matching_field", ["username", "email"])
def test_seed_never_changes_matching_head(matching_field):
    fields = {"username": "head", "email": "head@example.com"}
    fields[matching_field] = (
        "seed_staff" if matching_field == "username" else "staff@example.com"
    )
    user = User.objects.create_user(**fields, role="head", password="old-password")
    original_hash = user.password
    assert "Head account unchanged" in run_seed()
    user.refresh_from_db()
    assert user.role == "head"
    assert user.password == original_hash
    assert User.objects.count() == 1


def test_seed_refuses_identity_collision_without_changing_either_user():
    User.objects.create_user(username="seed_staff", email="other@example.com")
    User.objects.create_user(username="other", email="staff@example.com")
    with pytest.raises(CommandError, match="different accounts"):
        run_seed()
    assert not User.objects.filter(role="staff").exists()


def test_seed_leaves_pending_staff_assignments_untouched():
    head = User.objects.create_user(
        username="head", email="head@example.com", role="head"
    )
    pending = StaffAssignment.objects.create(
        email="staff@example.com", assigned_by=head
    )
    run_seed()
    assert StaffAssignment.objects.filter(pk=pending.pk, assigned_by=head).exists()
