from datetime import UTC, datetime, timedelta

import pytest
import test_forecast_calculation as calculation_tests
from django.db import connection
from django.test.utils import CaptureQueriesContext
from test_forecast_calculation import make_flight

from traffic.calculation import (
    CALCULATED_SOURCE,
    HISTORY_DAY_OFFSETS,
    calculate_pairs,
    recalculate_forecasts,
)
from traffic.models import CrowdForecast, HistoricalRecord

pytestmark = pytest.mark.django_db
scenario = calculation_tests.scenario


def history(flight, offset, booked, total=100):
    return HistoricalRecord.objects.create(
        airport=flight.origin,
        date=flight.departure_time.date() - timedelta(days=offset),
        total_flights=10,
        seats_total=total,
        seats_booked=booked,
    )


@pytest.mark.parametrize(
    "offsets,expected", [((371, 364, 357), 60), ((364,), 70), ((), 40)]
)
def test_blend_averages_daily_percentages_before_weighting(scenario, offsets, expected):
    flight = make_flight(scenario, available=60)
    for offset in offsets:
        history(flight, offset, {371: 60, 364: 100, 357: 80}[offset])
    recalculate_forecasts(scenario[0])
    assert CrowdForecast.objects.get(airport=flight.origin).crowd_score == expected


def test_history_uses_only_three_offsets_ignores_zero_and_uses_unweighted_daily_average(
    scenario,
):
    flight = make_flight(scenario, available=60)
    history(flight, 371, 50, 100)
    history(flight, 364, 180, 200)
    history(flight, 357, 0, 0)
    history(flight, 365, 100, 100)
    row = calculate_pairs({(flight.origin_id, flight.departure_time.date())})
    data = next(iter(row.values()))
    assert data["history_average"] == 70
    assert data["crowd_score"] == 55
    assert len(data["records"]) == 2


@pytest.mark.parametrize(
    "score,level", [(49.9, "low"), (50, "medium"), (74.9, "medium"), (75, "high")]
)
def test_blended_thresholds(scenario, score, level):
    flight = make_flight(scenario, total=1000, available=1000 - int(score * 10))
    for offset in HISTORY_DAY_OFFSETS:
        history(flight, offset, int(score * 10), 1000)
    recalculate_forecasts(scenario[0])
    row = CrowdForecast.objects.get(airport=flight.origin)
    assert row.crowd_score == score and row.crowd_level == level


def test_old_calculated_label_updates_and_retains_creator(scenario):
    flight = make_flight(scenario)
    row = CrowdForecast.objects.create(
        airport=flight.origin,
        date=flight.departure_time.date(),
        crowd_level="high",
        crowd_score=99,
        created_by=scenario[0],
        calculated_at=flight.departure_time,
        data_source="Calculated from flights",
    )
    recalculate_forecasts(scenario[0])
    row.refresh_from_db()
    assert row.data_source == CALCULATED_SOURCE and row.crowd_score == 50
    assert row.created_by == scenario[0]


def test_bulk_recalculation_queries_do_not_grow_per_pair(scenario):
    make_flight(scenario)
    recalculate_forecasts(scenario[0])
    with CaptureQueriesContext(connection) as first:
        recalculate_forecasts(scenario[0])
    for index in range(2, 20):
        make_flight(
            scenario,
            number=str(index),
            departure=datetime(2026, 12, index, 8, tzinfo=UTC),
        )
    recalculate_forecasts(scenario[0])
    with CaptureQueriesContext(connection) as second:
        recalculate_forecasts(scenario[0])
    assert len(second) == len(first)
