import { expect, test } from 'claude-code/testing'
import { bar, resetIn, tone } from './register'

test('bar fills proportionally and clamps', async () => {
  expect(bar(0)).toBe('░'.repeat(20))
  expect(bar(50)).toBe('█'.repeat(10) + '░'.repeat(10))
  expect(bar(150)).toBe('█'.repeat(20))
})

test('tone escalates at 70 and 90', async () => {
  expect(tone(10)).toBe('success')
  expect(tone(75)).toBe('warning')
  expect(tone(95)).toBe('error')
})

test('reset countdown', async () => {
  const now = Date.parse('2026-10-14T10:00:00Z')
  expect(resetIn('2026-10-14T12:30:00Z', now)).toBe(' · resets 2h 30m')
  expect(resetIn('2026-10-17T13:00:00Z', now)).toBe(' · resets 3d 3h')
  expect(resetIn(undefined, now)).toBe('')
})
