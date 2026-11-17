import { useEffect, useId, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import searchIcon from '../assets/icons/SearchIcon.png'
import chevronIcon from '../assets/icons/chevron-downIcon.png'
import './SearchableSelect.css'

export type SelectOption = { value: string; label: string; searchText?: string }
type Props = { name: string; label: string; value: string; options: SelectOption[]; onChange: (value: string) => void; error?: string; disabled?: boolean; clearable?: boolean }

export default function SearchableSelect({ name, label, value, options, onChange, error, disabled, clearable = true }: Props) {
  const id = useId()
  const listId = `${id}-list`
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const wrapper = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const search = useRef<HTMLInputElement>(null)
  const filtered = options.filter(option => `${option.label} ${option.searchText ?? ''}`.toLowerCase().includes(query.toLowerCase().trim()))
  function show() { setQuery(''); setActive(Math.max(0, options.findIndex(option => option.value === value))); setOpen(true) }
  function close() { setOpen(false); trigger.current?.focus() }
  function choose(selected: string) { onChange(selected); close() }
  useEffect(() => {
    if (!open) return
    search.current?.focus()
    const outside = (event: PointerEvent) => { if (!wrapper.current?.contains(event.target as Node)) setOpen(false) }
    document.addEventListener('pointerdown', outside)
    return () => document.removeEventListener('pointerdown', outside)
  }, [open])
  useEffect(() => { if (open) document.getElementById(`${listId}-${active}`)?.scrollIntoView?.({ block: 'nearest' }) }, [active, open, listId])
  function key(event: KeyboardEvent) {
    if (event.key === 'Escape') { event.preventDefault(); close(); return }
    if (event.key === 'Tab') { setOpen(false); return }
    if (['ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter'].includes(event.key)) {
      event.preventDefault()
      if (!open) { show(); return }
      if (event.key === 'Enter') { if (filtered[active]) choose(filtered[active]!.value); return }
      setActive(previous => event.key === 'Home' ? 0 : event.key === 'End' ? Math.max(0, filtered.length - 1) : Math.max(0, Math.min(filtered.length - 1, previous + (event.key === 'ArrowDown' ? 1 : -1))))
    } else if (!open && event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
      event.preventDefault(); setQuery(event.key); setActive(0); setOpen(true)
    }
  }
  const activeId = open && filtered[active] ? `${listId}-${active}` : undefined
  return <div className="record-field-group searchable-select" ref={wrapper}>
    <div className={`record-field${error ? ' record-field-invalid' : ''}`}>
      <label id={`${id}-label`} htmlFor={`record-${name}`}>{label}</label>
      <div className="searchable-select-control">
        <button type="button" id={`record-${name}`} name={name} value={value} ref={trigger} role="combobox" aria-haspopup="listbox" aria-expanded={open} aria-controls={listId} aria-activedescendant={activeId} aria-labelledby={`${id}-label`} aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-error` : undefined} disabled={disabled} onClick={() => open ? close() : show()} onKeyDown={key}>
          <span>{options.find(option => option.value === value)?.label ?? `Choose ${label.toLowerCase()}`}</span><img src={chevronIcon} alt="" />
        </button>
        {clearable && value && <button type="button" className="searchable-clear" aria-label={`Clear ${label}`} disabled={disabled} onClick={() => onChange('')}>Clear</button>}
      </div>
    </div>
    {open && <div className="searchable-popover">
      <label className="searchable-search"><img src={searchIcon} alt="" /><input ref={search} role="searchbox" aria-label={`Search ${label}`} aria-controls={listId} aria-activedescendant={activeId} value={query} onChange={event => { setQuery(event.target.value); setActive(0) }} onKeyDown={key} /></label>
      <ul id={listId} role="listbox" aria-labelledby={`${id}-label`}>
        {filtered.map((option, index) => <li key={option.value} id={`${listId}-${index}`} role="option" aria-selected={option.value === value} data-value={option.value} className={index === active ? 'is-active' : ''} onPointerDown={event => event.preventDefault()} onClick={() => choose(option.value)}>{option.label}</li>)}
        {!filtered.length && <li role="presentation">No matches</li>}
      </ul>
    </div>}
    {error && <p className="record-field-error" id={`${id}-error`}>{error}</p>}
  </div>
}
