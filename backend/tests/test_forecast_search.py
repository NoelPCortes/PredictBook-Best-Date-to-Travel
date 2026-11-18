from datetime import UTC, datetime, timedelta

import pytest
import test_forecast_calculation as calculation_tests
from django.db import connection
from django.test.utils import CaptureQueriesContext
from rest_framework.test import APIClient
from test_forecast_calculation import make_flight

from traffic.calculation import recalculate_forecasts
from traffic.models import CrowdForecast

pytestmark = pytest.mark.django_db
scenario = calculation_tests.scenario


def test_forecasts_global_search_and_per_airport_filters(scenario):
    flight = make_flight(scenario, departure=datetime(2026, 12, 1, 8, tzinfo=UTC))
    recalculate_forecasts(scenario[0])
    manual = CrowdForecast.objects.create(
        airport=scenario[1][2],
        date=flight.departure_time.date(),
        crowd_level="high",
        crowd_score=None,
        data_source="Staff entry",
        created_by=scenario[0],
        calculated_at=flight.departure_time,
    )
    api = APIClient()
    api.force_authenticate(scenario[0])

    def result(**filters):
        return api.get("/api/traffic/forecasts/", filters).json()

    assert result(search="2026-12")["count"] == 3
    assert result(search="2026-12-01")["count"] == 3
    assert result(search="dvo")["results"][0]["id"] == manual.pk
    assert result(search="MNL")["count"] == 1
    assert (
        result(
            level="high", source="manual", airport=manual.airport_id, month="2026-12"
        )["count"]
        == 1
    )
    assert result(source="calculated")["count"] == 2
    assert result(source="manual", level="low")["count"] == 0
    assert api.get("/api/traffic/forecasts/", {"source": "bad"}).status_code == 400
    assert api.get("/api/traffic/forecasts/", {"level": "bad"}).status_code == 400
    airports = api.get("/api/flights/airports/").json()["results"]
    assert sum(row["forecast_count"] for row in airports) == 3

def test_airport_forecast_counts_include_all_sources_in_one_aggregate_query(scenario):
    flight = make_flight(scenario)
    recalculate_forecasts(scenario[0])
    CrowdForecast.objects.create(
        airport=scenario[1][2], date=flight.departure_time.date(),
        crowd_level='low', data_source='Staff entry', created_by=scenario[0], calculated_at=flight.departure_time,
    )
    api = APIClient()
    api.force_authenticate(scenario[0])
    with CaptureQueriesContext(connection) as first:
        rows = api.get('/api/flights/airports/').json()['results']
    assert {row['id']: row['forecast_count'] for row in rows} == {airport.pk: 1 for airport in scenario[1]}
    for offset in range(1, 10):
        CrowdForecast.objects.create(airport=scenario[1][2], date=flight.departure_time.date()+timedelta(days=offset), crowd_level='low', data_source='Staff entry', created_by=scenario[0], calculated_at=flight.departure_time)
    with CaptureQueriesContext(connection) as expanded:
        rows = api.get('/api/flights/airports/').json()['results']
    assert {row['id']: row['forecast_count'] for row in rows}[scenario[1][2].pk] == 10
    assert len(first) == len(expanded) == 2
