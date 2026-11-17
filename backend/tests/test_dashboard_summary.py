from datetime import UTC, datetime, timedelta
from unittest.mock import patch

import pytest
from rest_framework.test import APIClient

from accounts.models import User
from flights.models import Airport
from traffic.models import CrowdForecast

pytestmark = pytest.mark.django_db
PATH = "/api/dashboard/summary/"


@pytest.fixture
def scenario():
    staff = User.objects.create(
        username="private_manager",
        email="private@example.com",
        role="staff",
        first_name="Hidden name",
    )
    airports = [
        Airport.objects.create(code=code, name=code, city=code, country="Philippines")
        for code in ("CEB", "MNL")
    ]
    return staff, airports


def request_summary(user, filters=None):
    client = APIClient()
    if user:
        client.force_authenticate(user)
    return client.get(PATH, filters or {})


def forecast(scenario, airport, date, level):
    return CrowdForecast.objects.create(
        airport=airport,
        date=date,
        crowd_level=level,
        calculated_at=datetime(2026, 11, 16, tzinfo=UTC),
        data_source="Staff entry",
        created_by=scenario[0],
    )


def test_summary_counts_dates_weekdays_period_airport_and_no_private_details(scenario):
    staff, airports = scenario
    today = datetime(2026, 11, 16, tzinfo=UTC)
    for offset, level in (
        (0, "high"),
        (1, "medium"),
        (2, "low"),
        (7, "high"),
        (29, "high"),
        (30, "high"),
        (-1, "low"),
    ):
        forecast(scenario, airports[1], today.date() + timedelta(days=offset), level)
    forecast(scenario, airports[0], today.date(), "low")
    with patch("django.utils.timezone.now", return_value=today):
        response = request_summary(staff, {"airport": airports[1].pk})
    assert response.status_code == 200
    result = response.json()
    assert result["airport"] == {"id": airports[1].pk, "code": "MNL", "name": "MNL"}
    assert (
        result["period_start"] == "2026-11-16" and result["period_end"] == "2026-12-15"
    )
    assert result["counts"] == {"low": 1, "medium": 1, "high": 3}
    assert result["dates"]["high"] == [
        {"date": "2026-11-16", "weekday": "Monday"},
        {"date": "2026-11-23", "weekday": "Monday"},
        {"date": "2026-12-15", "weekday": "Tuesday"},
    ]
    assert result["busiest_weekday"] == "Monday"
    assert len(result["next_7_days"]) == 7
    assert result["next_7_days"][0] == {
        "date": "2026-11-16",
        "weekday": "Monday",
        "crowd_level": "high",
    }
    assert result["next_7_days"][3]["crowd_level"] is None
    assert result["next_7_days"][-1]["date"] == "2026-11-22"
    assert not any(
        value in str(result)
        for value in (
            staff.username,
            staff.email,
            staff.first_name,
            "created_by",
            "password",
        )
    )


def test_default_airport_prefers_forecasts_then_code_and_ties_prefer_earliest_date(
    scenario,
):
    staff, airports = scenario
    today = datetime(2026, 11, 16, tzinfo=UTC)
    forecast(scenario, airports[1], today.date(), "high")
    forecast(scenario, airports[1], today.date() + timedelta(days=1), "high")
    with patch("django.utils.timezone.now", return_value=today):
        result = request_summary(staff).json()
        assert result["airport"]["code"] == "MNL"
        assert result["busiest_weekday"] == "Monday"
        empty = request_summary(staff, {"airport": airports[0].pk}).json()
        assert empty["counts"] == {"low": 0, "medium": 0, "high": 0}
        assert empty["busiest_weekday"] is None
        assert all(day["crowd_level"] is None for day in empty["next_7_days"])
    CrowdForecast.objects.all().delete()
    with patch("django.utils.timezone.now", return_value=today):
        assert request_summary(staff).json()["airport"]["code"] == "CEB"


def test_empty_database_and_project_local_period(scenario, settings):
    settings.TIME_ZONE = "Asia/Manila"
    with patch(
        "django.utils.timezone.now", return_value=datetime(2026, 11, 16, 17, tzinfo=UTC)
    ):
        assert request_summary(scenario[0]).json()["period_start"] == "2026-11-17"
    Airport.objects.all().delete()
    result = request_summary(scenario[0]).json()
    assert result["airport"] is None
    assert result["counts"] == {"low": 0, "medium": 0, "high": 0}


@pytest.mark.parametrize(
    "role,expected", [("head", 200), ("staff", 200), ("traveler", 403), (None, 401)]
)
def test_summary_permissions(role, expected):
    user = (
        User.objects.create(username="actor", email="actor@example.com", role=role)
        if role
        else None
    )
    assert request_summary(user).status_code == expected


def test_invalid_airport_is_field_400(scenario):
    response = request_summary(scenario[0], {"airport": "bad"})
    assert response.status_code == 400 and "airport" in response.json()
