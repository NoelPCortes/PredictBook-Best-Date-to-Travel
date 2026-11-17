from datetime import UTC, datetime, timedelta

import pytest
import test_forecast_calculation as calculation_tests
from django.db import connection
from django.test.utils import CaptureQueriesContext
from rest_framework.test import APIClient
from test_forecast_calculation import make_flight

from traffic.calculation import recalculate_forecasts

pytestmark = pytest.mark.django_db
scenario = calculation_tests.scenario


def test_pagination_bounds_work_and_queries_are_constant(scenario):
    client = APIClient()
    client.force_authenticate(scenario[0])
    for index in range(110):
        make_flight(scenario, number=str(index), departure=datetime(2026,1,1,tzinfo=UTC)+timedelta(days=index))
    recalculate_forecasts(scenario[0])
    for path, expected_queries in [('/api/flights/',2),('/api/traffic/forecasts/',4)]:
        with CaptureQueriesContext(connection) as queries:
            result = client.get(path).json()
        assert set(result) == {'count','next','previous','results'}
        assert len(result['results']) == 50 and result['count'] >= 110
        assert len(queries) == expected_queries
        with CaptureQueriesContext(connection) as second:
            page = client.get(path,{'page':2}).json()
        assert len(second) == len(queries)
        assert len(page['results']) == 50 and page['previous']
        assert client.get(path,{'page_size':10000}).json()['results'] == result['results']
