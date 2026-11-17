import pytest
import test_forecast_calculation as calculation_tests
from django.db import connection
from django.test.utils import CaptureQueriesContext
from rest_framework.test import APIClient
from test_forecast_calculation import make_flight

from accounts.models import User
from traffic.calculation import recalculate_forecasts

pytestmark = pytest.mark.django_db
scenario = calculation_tests.scenario


@pytest.mark.parametrize(
    "role,status", [("head", 200), ("staff", 403), ("traveler", 403), (None, 401)]
)
def test_staff_detail_permissions_and_only_approved_fields(scenario, role, status):
    flight = make_flight(scenario)
    make_flight(scenario, number="2")
    recalculate_forecasts(scenario[0])
    user = (
        User.objects.create(username="viewer", email="viewer@example.com", role=role)
        if role
        else None
    )
    api = APIClient()
    if user:
        api.force_authenticate(user)
    with CaptureQueriesContext(connection) as queries:
        response = api.get(f"/api/accounts/staff/{flight.created_by_id}/")
    assert response.status_code == status
    if status == 200:
        result = response.json()
        assert set(result) == {
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "date_joined",
            "flights_created",
            "forecasts_created",
        }
        assert result["flights_created"] == 2 and result["forecasts_created"] == 2
        assert len(queries) == 1
        assert api.get(f"/api/accounts/staff/{user.pk}/").status_code == 404
        assert api.get("/api/accounts/staff/999999/").status_code == 404
        traveler = User.objects.create(
            username="traveler", email="traveler@example.com", role="traveler"
        )
        assert api.get(f"/api/accounts/staff/{traveler.pk}/").status_code == 404
        rows = api.get("/api/accounts/staff/", {"search": "CALCULATOR"}).json()[
            "staff"
        ]["results"]
        assert rows == [
            {
                "id": scenario[0].pk,
                "username": "calculator",
                "email": "calc@example.com",
            }
        ]
