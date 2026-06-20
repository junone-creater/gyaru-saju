import test from 'node:test'
import assert from 'node:assert/strict'
import { isValidSolarDate, lunarToSolar, resolveBirthDate } from '../src/data/calendar.js'

const NOW = new Date(2026, 5, 6)

test('rejects impossible and future solar dates', () => {
  assert.equal(isValidSolarDate(2025, 2, 29, NOW), false)
  assert.equal(isValidSolarDate(2026, 6, 7, NOW), false)
  assert.equal(isValidSolarDate(2024, 2, 29, NOW), true)
})

test('converts a normal lunar date to solar', () => {
  assert.deepEqual(lunarToSolar(2024, 1, 1), {
    year: 2024,
    month: 2,
    day: 10,
  })
})

test('rejects invalid lunar dates', () => {
  assert.equal(resolveBirthDate(2024, 1, 30, true, NOW), null)
})
