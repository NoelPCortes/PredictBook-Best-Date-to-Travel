// @vitest-environment jsdom
import { act, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, expect, it } from 'vitest'
import SearchableSelect from '../src/components/SearchableSelect'

let container: HTMLDivElement
let root: ReturnType<typeof createRoot>
const options = [{ value: '', label: 'All airports' }, { value: '1', label: 'MNL — Manila', searchText: 'Pasay Philippines' }, { value: '2', label: 'NRT — Narita', searchText: 'Tokyo Japan' }]
function Picker({ disabled = false, error = '', navy = false }) { const [value, setValue] = useState(''); return <SearchableSelect name="airport" label="Airport" options={options} value={value} onChange={setValue} disabled={disabled} error={error} navy={navy} /> }
beforeEach(() => { Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true }); container = document.createElement('div'); document.body.append(container); root = createRoot(container) })
afterEach(async () => { await act(async () => root.unmount()); container.remove() })
async function render(props = {}) { await act(async () => root.render(<Picker {...props} />)) }
async function click(selector: string) { await act(async () => container.querySelector<HTMLElement>(selector)!.click()) }
async function key(selector: string, key: string) { await act(async () => container.querySelector(selector)!.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))) }
async function search(value: string) { await act(async () => { const input = container.querySelector('input')!; Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')!.set!.call(input,value); input.dispatchEvent(new Event('input',{bubbles:true})) }) }

it('filters code, label, city and country; shows no matches; selects and clears', async () => {
  await render(); await click('[role=combobox]')
  for (const query of ['nrt','Narita','tokyo','japan']) { await search(query); expect(container.querySelectorAll('[role=option]')).toHaveLength(1) }
  await search('absent'); expect(container.textContent).toContain('No matches')
  await search('Philippines'); await click('[data-value="1"]')
  expect(container.querySelector<HTMLButtonElement>('[role=combobox]')?.value).toBe('1')
  await click('[aria-label="Clear Airport"]')
  expect(container.querySelector('[role=combobox]')?.textContent).toContain('All airports')
})
it('supports opening, arrows, Home, End, Enter, Escape and typing', async () => {
  await render(); await key('[role=combobox]','ArrowDown')
  const button = container.querySelector('[role=combobox]')!
  expect(button.getAttribute('aria-expanded')).toBe('true')
  expect(document.getElementById(button.getAttribute('aria-controls')!)?.getAttribute('role')).toBe('listbox')
  await key('input','End'); await key('input','ArrowUp'); await key('input','Home'); await key('input','End')
  expect(container.querySelector('input')?.getAttribute('aria-activedescendant')).toBe(container.querySelector('[data-value="2"]')?.id)
  await key('input','Enter'); expect(document.activeElement).toBe(button)
  expect((button as HTMLButtonElement).value).toBe('2')
  await key('[role=combobox]','m'); expect(container.querySelector<HTMLInputElement>('input')?.value).toBe('m')
  await key('input','Escape'); expect(button.getAttribute('aria-expanded')).toBe('false')
})
it('closes outside, exposes errors, and respects disabled', async () => {
  await render({error:'Choose an airport.'}); await click('[role=combobox]')
  await act(async () => document.body.dispatchEvent(new Event('pointerdown',{bubbles:true})))
  expect(container.querySelector('[role=listbox]')).toBeNull()
  const button = container.querySelector('[role=combobox]')!
  expect(button.getAttribute('aria-invalid')).toBe('true')
  expect(document.getElementById(button.getAttribute('aria-describedby')!)?.textContent).toBe('Choose an airport.')
  await render({disabled:true}); expect((container.querySelector('[role=combobox]') as HTMLButtonElement).disabled).toBe(true)
})

it('preserves keyboard selection, clearing, errors and disabled access in navy fields', async () => {
  await render({navy:true,error:'Choose an airport.'})
  expect(container.querySelector('.record-field-navy')).not.toBeNull()
  expect(container.querySelector('[role=combobox] img')?.classList.contains('navy-white-icon')).toBe(true)
  const trigger=container.querySelector<HTMLButtonElement>('[role=combobox]')!
  expect(document.getElementById(trigger.getAttribute('aria-describedby')!)?.textContent).toBe('Choose an airport.')
  await key('[role=combobox]','ArrowDown')
  expect(container.querySelector('.searchable-popover [role=listbox]')).not.toBeNull()
  expect(container.querySelector('.searchable-search img')?.classList.contains('navy-white-icon')).toBe(false)
  await search('Tokyo'); await key('input','Enter')
  expect(trigger.value).toBe('2')
  expect(document.activeElement).toBe(trigger)
  await click('[aria-label="Clear Airport"]')
  expect(trigger.value).toBe('')
  await render({navy:true,disabled:true})
  expect(container.querySelector<HTMLButtonElement>('[role=combobox]')!.disabled).toBe(true)
})
