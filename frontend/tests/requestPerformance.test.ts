// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { apiRequest } from '../src/api/client'

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.unstubAllEnvs() })

it('shares concurrent identical reads without caching a later response', async () => {
  vi.stubEnv('VITE_API_URL', 'https://api.example.test')
  let finish: (response: Response) => void = () => {}
  const fetchMock = vi.fn().mockReturnValueOnce(new Promise(resolve => { finish = resolve }))
    .mockResolvedValueOnce(new Response('{"value":2}'))
  vi.stubGlobal('fetch', fetchMock)
  const first = apiRequest('/api/flights/')
  const second = apiRequest('/api/flights/')
  expect(fetchMock).toHaveBeenCalledTimes(1)
  finish(new Response('{"value":1}'))
  expect(await first).toEqual(await second)
  expect(await apiRequest('/api/flights/')).toEqual({ value: 2 })
  expect(fetchMock).toHaveBeenCalledTimes(2)
})

it('does not time out a slow read and permits retry after a failure', async () => {
  vi.useFakeTimers(); vi.stubEnv('VITE_API_URL', 'https://api.example.test')
  const fetchMock = vi.fn().mockImplementationOnce(() => new Promise(resolve => setTimeout(() => resolve(new Response('[]')), 16000)))
    .mockRejectedValueOnce(new Error('Offline')).mockResolvedValueOnce(new Response('[]'))
  vi.stubGlobal('fetch', fetchMock)
  const slow = apiRequest('/api/flights/')
  await vi.advanceTimersByTimeAsync(16000)
  expect(await slow).toEqual([])
  await expect(apiRequest('/api/flights/')).rejects.toThrow('Offline')
  expect(await apiRequest('/api/flights/')).toEqual([])
})
