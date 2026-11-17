from datetime import UTC, datetime, timedelta
from unittest.mock import patch

import pytest
import test_forecast_calculation as calculation_tests
from django.db import connection
from django.test.utils import CaptureQueriesContext
from rest_framework.test import APIClient
from test_blended_forecasts import history
from test_forecast_calculation import make_flight

from traffic.calculation import recalculate_forecasts
from traffic.models import CrowdForecast

pytestmark = pytest.mark.django_db
scenario = calculation_tests.scenario


def test_days_reuses_aggregates_and_manual_missing_score_uses_history_without_writes(
    scenario,
):
    today = datetime(2026, 12, 1, 8, tzinfo=UTC)
    flight = make_flight(scenario, departure=today)
    history(flight, 364, 80)
    recalculate_forecasts(scenario[0])
    manual = CrowdForecast.objects.get(airport=flight.origin, date=today.date())
    manual.data_source = "Staff entry"
    manual.crowd_score = None
    manual.save()
    api = APIClient()
    api.force_authenticate(scenario[0])
    with patch("django.utils.timezone.now", return_value=today):
        with CaptureQueriesContext(connection) as first:
            result = api.get(
                "/api/dashboard/summary/", {"airport": flight.origin_id}
            ).json()
        assert result["days"] == [
            {
                "date": "2026-12-01",
                "weekday": "Tuesday",
                "crowd_level": manual.crowd_level,
                "crowd_score": 80,
                "seats_booked": 50,
                "seats_total": 100,
                "flight_count": 1,
            }
        ]
        for index in range(2, 22):
            make_flight(
                scenario, number=str(index), departure=today + timedelta(days=index)
            )
        recalculate_forecasts(scenario[0])
        with CaptureQueriesContext(connection) as second:
            expanded = api.get(
                "/api/dashboard/summary/", {"airport": flight.origin_id}
            ).json()
    assert len(expanded["days"]) == 21
    assert len(first) == len(second) == 5
    manual.refresh_from_db()
    assert manual.crowd_score is None
