export type CrowdLevel = 'Low' | 'Medium' | 'High'
export const januaryLevels: readonly CrowdLevel[] = [
  'Medium', 'Medium', 'High', 'High', 'Medium', 'Low', 'Low', 'Low',
  'Medium', 'High', 'High', 'Medium', 'Low', 'Low', 'Low', 'Low',
  'Medium', 'High', 'Medium', 'Low', 'Low', 'Low', 'Medium', 'High',
  'High', 'High', 'Medium', 'Low', 'Low', 'Medium', 'Medium',
]
export const januaryDays = januaryLevels.map((level, index) => ({
  day: index + 1,
  level,
  date: new Date(2026, 0, index + 1),
}))
