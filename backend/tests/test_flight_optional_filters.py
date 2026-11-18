from datetime import UTC, datetime, timedelta

import pytest
import test_forecast_calculation as calculation_tests
from rest_framework.test import APIClient
from test_forecast_calculation import make_flight

pytestmark = pytest.mark.django_db
scenario = calculation_tests.scenario


def api(scenario):
    result = APIClient()
    result.force_authenticate(scenario[0])
    return result


@pytest.mark.parametrize('prefix', ['departure', 'arrival'])
@pytest.mark.parametrize('filters,expected', [
    ({'hour_from': '6', 'hour_to': '11'}, [1, 2]),
    ({'hour_from': '11'}, [2, 3]),
    ({'hour_to': '6'}, [0, 1]),
    ({'date': '2026-11-17'}, [0, 1, 2, 3]),
    ({'date': '2026-11-17', 'hour_from': '6', 'hour_to': '11'}, [1, 2]),
])
def test_display_zone_date_and_inclusive_hours(scenario, prefix, filters, expected):
    flights = []
    for index, (hour, minute) in enumerate([(0, 30), (6, 0), (11, 59), (23, 59)]):
        local = datetime(2026, 11, 17, hour, minute, tzinfo=UTC) - timedelta(hours=8)
        departure = local if prefix == 'departure' else local - timedelta(hours=2)
        flights.append(make_flight(scenario, number=str(index), departure=departure))
    response = api(scenario).get('/api/flights/', {f'{prefix}_{key}': value for key, value in filters.items()})
    assert response.status_code == 200
    assert [row['id'] for row in response.json()['results']] == [flights[index].pk for index in expected]


@pytest.mark.parametrize('prefix', ['departure', 'arrival'])
@pytest.mark.parametrize('value', ['-1', '24', '6.5', 'abc', '1.0'])
def test_invalid_hours_have_field_errors(scenario, prefix, value):
    for bound in ['from', 'to']:
        field = f'{prefix}_hour_{bound}'
        response = api(scenario).get('/api/flights/', {field: value})
        assert response.status_code == 400
        assert field in response.json()


@pytest.mark.parametrize('prefix', ['departure', 'arrival'])
def test_cross_midnight_range_is_rejected(scenario, prefix):
    response = api(scenario).get('/api/flights/', {f'{prefix}_hour_from': 12, f'{prefix}_hour_to': 6})
    assert response.status_code == 400
    assert response.json()[f'{prefix}_hour_to'] == ['The ending hour cannot be earlier than the starting hour.']


def test_optional_filters_combine_with_route_and_pagination(scenario):
    first = make_flight(scenario, departure=datetime(2026, 11, 17, 1, tzinfo=UTC))
    for index in range(1, 6):
        make_flight(scenario, number=str(index + 1), departure=first.departure_time + timedelta(minutes=index))
    response = api(scenario).get('/api/flights/', {
        'origin': first.origin_id, 'destination': first.destination_id,
        'departure_date': '2026-11-17', 'arrival_date': '2026-11-17',
        'departure_hour_from': 9, 'arrival_hour_to': 11, 'page_size': 4,
    })
    assert response.status_code == 200
    assert response.json()['count'] == 6
    assert len(response.json()['results']) == 4
    assert response.json()['next'] is not None
