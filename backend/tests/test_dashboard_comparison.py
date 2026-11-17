from datetime import UTC, datetime, timedelta
from unittest.mock import patch

import pytest
import test_forecast_calculation as calculation_tests
from test_blended_forecasts import history
from test_dashboard_summary import request_summary
from test_forecast_calculation import make_flight

from traffic.calculation import recalculate_forecasts

pytestmark = pytest.mark.django_db
scenario = calculation_tests.scenario
TODAY = datetime(2026, 12, 1, 8, tzinfo=UTC)


def summary(scenario):
    with patch("django.utils.timezone.now", return_value=TODAY):
        return request_summary(scenario[0], {"airport": scenario[1][0].pk}).json()[
            "comparison"
        ]


def test_comparison_uses_daily_percentages_and_counts_only_paired_days(scenario):
    first = make_flight(scenario, departure=TODAY, available=20)
    second = make_flight(
        scenario,
        number="2",
        departure=TODAY + timedelta(days=1),
        total=200,
        available=120,
    )
    third = make_flight(
        scenario, number="3", departure=TODAY + timedelta(days=2), available=60
    )
    history(first, 364, 60)
    history(second, 364, 80)
    history(third, 364, 40)
    make_flight(scenario, number="4", departure=TODAY + timedelta(days=3), available=0)
    recalculate_forecasts(scenario[0])
    assert summary(scenario) == {
        "average_occupancy_2026_percent": 65,
        "average_occupancy_2025_percent": 60,
        "difference_points": 5,
        "days_busier_than_2025": 1,
        "days_quieter_than_2025": 1,
        "days_compared": 3,
    }


def test_comparison_handles_no_data_and_no_history(scenario):
    empty = summary(scenario)
    assert empty["average_occupancy_2026_percent"] is None
    assert (
        empty["average_occupancy_2025_percent"] is None
        and empty["difference_points"] is None
    )
    assert empty["days_compared"] == 0
    make_flight(scenario, departure=TODAY, available=30)
    recalculate_forecasts(scenario[0])
    result = summary(scenario)
    assert result["average_occupancy_2026_percent"] == 70
    assert (
        result["average_occupancy_2025_percent"] is None
        and result["difference_points"] is None
    )
