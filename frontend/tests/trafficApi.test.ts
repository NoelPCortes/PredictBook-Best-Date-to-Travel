// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { getOwnRecordCounts } from '../src/features/staff-dashboard/api'
import { loadFlights, loadForecasts } from '../src/api/traffic'

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs() })

it('counts only the results from mine=true requests for both record types', async () => {
  vi.stubEnv('VITE_API_URL', 'https://api.example.test')
  const fetchMock = vi.fn<typeof fetch>().mockImplementation(async url => new Response(JSON.stringify(
    String(url).includes('/api/flights/') ? [{ id: 1 }, { id: 2 }] : [{ id: 3 }],
  ), { status: 200 }))
  vi.stubGlobal('fetch', fetchMock)
  expect(await getOwnRecordCounts()).toEqual({ flights: 2, forecasts: 1 })
  expect(fetchMock.mock.calls.map(([url]) => String(url)).sort()).toEqual([
    'https://api.example.test/api/flights/?mine=true',
    'https://api.example.test/api/traffic/forecasts/?mine=true',
  ])
})

it('sends the selected airport, month and departure date through shared reads', async () => {
  vi.stubEnv('VITE_API_URL', 'https://api.example.test')
  const fetchMock = vi.fn<typeof fetch>().mockImplementation(async () => new Response('[]', { status: 200 }))
  vi.stubGlobal('fetch', fetchMock)
  await loadFlights({ origin: '2', date: '2026-12-01' })
  await loadForecasts({ airport: '2', month: '2026-12' })
  expect(fetchMock.mock.calls.map(([url]) => String(url))).toEqual([
    'https://api.example.test/api/flights/?origin=2&date=2026-12-01',
    'https://api.example.test/api/traffic/forecasts/?airport=2&month=2026-12',
  ])
})
