const paths = {
  home: 'M3 10 12 3l9 7M5 9v12h5v-7h4v7h5V9',
  calendar: 'M5 5h14a2 2 0 0 1 2 2v13H3V7a2 2 0 0 1 2-2ZM3 10h18M8 3v4m8-4v4',
  person: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-2a8 8 0 0 1 16 0v2Z',
  chevron: 'm9 5 7 7-7 7',
  down: 'm6 9 6 6 6-6',
  left: 'm15 5-7 7 7 7',
  plane: 'm3 13 6 2 9-9c3-3 5-1 2 2l-9 9-2 5-2-1 1-5-5-1Zm7-2L5 6l2-2 7 3',
  seat: 'm7 4 3 9h8l3 7h-4l-2-4H8L4 5ZM8 20h6',
  pin: 'M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0ZM15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
  swap: 'M4 7h16m-4-4 4 4-4 4M20 17H4m4-4-4 4 4 4',
  search: 'M16 10a6 6 0 1 1-12 0 6 6 0 0 1 12 0Zm-1 5 6 6',
  arrow: 'M3 12h18m-6-6 6 6-6 6',
} as const

export default function Icon({ name }: { name: keyof typeof paths }) {
  return <svg className="app-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>
}
