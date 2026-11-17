import pytest
from rest_framework.test import APIClient

from accounts.models import StaffAssignment, User

pytestmark = pytest.mark.django_db
PATH = "/api/accounts/staff/"


@pytest.mark.parametrize(
    "role,status", [("head", 200), ("staff", 403), ("traveler", 403), (None, 401)]
)
def test_head_list_permissions(role, status):
    client = APIClient()
    if role:
        user = User.objects.create(
            username="actor", email="actor@example.com", role=role
        )
        client.force_authenticate(user)
    assert client.get(PATH).status_code == status


def test_head_lists_only_approved_staff_and_pending_fields():
    head = User.objects.create(username="head", email="head@example.com", role="head")
    staff = User.objects.create(
        username="staff",
        email="staff@example.com",
        role="staff",
        first_name="Private",
        last_name="Hidden",
    )
    User.objects.create(
        username="traveler", email="traveler@example.com", role="traveler"
    )
    pending = StaffAssignment.objects.create(
        email="pending@example.com", assigned_by=head
    )
    client = APIClient()
    client.force_authenticate(head)
    result = client.get(PATH).json()
    assert result["staff"]["results"] == [{"id": staff.pk, "username": staff.username, "email": staff.email}]
    assert len(result["pending"]["results"]) == 1
    assert set(result["pending"]["results"][0]) == {"email", "assigned_by_username", "assigned_at"}
    assert result["pending"]["results"][0]["email"] == pending.email
    assert result["pending"]["results"][0]["assigned_by_username"] == head.username
    assert result["pending"]["results"][0]["assigned_at"]
    assert "Private" not in str(result) and "Hidden" not in str(result)


def test_existing_assign_and_revoke_refresh_lists_without_deleting_accounts():
    head = User.objects.create(username="head", email="head@example.com", role="head")
    target = User.objects.create(
        username="target", email="target@example.com", role="traveler"
    )
    client = APIClient()
    client.force_authenticate(head)
    assert client.get(PATH).json()["staff"]["count"] == 0
    assert client.get(PATH).json()["pending"]["count"] == 0
    assert (
        client.post(
            "/api/accounts/staff/assign/", {"email": target.email}, format="json"
        ).status_code
        == 200
    )
    assert client.get(PATH).json()["staff"]["results"] == [
        {"id": target.pk, "username": target.username, "email": target.email}
    ]
    response = client.post(
        "/api/accounts/staff/revoke/", {"email": target.email}, format="json"
    )
    assert response.status_code == 200
    target.refresh_from_db()
    assert target.role == "traveler" and User.objects.filter(pk=target.pk).exists()
    assert client.get(PATH).json()["staff"]["results"] == []
    assert (
        client.post(
            "/api/accounts/staff/assign/",
            {"email": "pending@example.com"},
            format="json",
        ).status_code
        == 200
    )
    assert len(client.get(PATH).json()["pending"]["results"]) == 1
    assert (
        client.post(
            "/api/accounts/staff/revoke/",
            {"email": "pending@example.com"},
            format="json",
        ).status_code
        == 200
    )
    assert client.get(PATH).json()["pending"]["results"] == []
    assert User.objects.count() == 2
