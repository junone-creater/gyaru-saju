import test from 'node:test'
import assert from 'node:assert/strict'
import { calcAll } from '../src/data/saju.js'

test('unknown birth hour is not treated as midnight', () => {
  const unknown = calcAll(1992, 10, 24, -1, '테스트', 'f', 2026)
  const midnight = calcAll(1992, 10, 24, 23, '테스트', 'f', 2026)

  assert.equal(unknown.pillars[3].unknown, true)
  assert.equal(unknown.pillars[3].stem, '?')
  assert.notDeepEqual(unknown.ec, midnight.ec)
  assert.equal(Object.values(unknown.ec).reduce((sum, value) => sum + value, 0), 6)
})

test('exact birth time with minutes still resolves the right hour pillar', () => {
  const result = calcAll(1992, 10, 24, 23.5, '테스트', 'f', 2026)

  assert.equal(result.pillars[3].branch, '子')
})

test('five-year samjae window follows the requested start year', () => {
  const result = calcAll(1992, 10, 24, 23, '테스트', 'f', 2030)
  assert.ok(result.sj.every(item => item.year >= 2030 && item.year <= 2034))
})

test('year and month pillars change at actual lichun time', () => {
  const before = calcAll(2024, 2, 4, 11, '테스트', 'm', 2026)
  const after = calcAll(2024, 2, 4, 19, '테스트', 'm', 2026)

  assert.equal(before.pillars[0].stem + before.pillars[0].branch, '癸卯')
  assert.equal(before.pillars[1].stem + before.pillars[1].branch, '乙丑')
  assert.equal(after.pillars[0].stem + after.pillars[0].branch, '甲辰')
  assert.equal(after.pillars[1].stem + after.pillars[1].branch, '丙寅')
})

test('month pillar changes at actual gyeongchip time', () => {
  const before = calcAll(2024, 3, 5, 9, '테스트', 'm', 2026)
  const after = calcAll(2024, 3, 5, 13, '테스트', 'm', 2026)

  assert.equal(before.pillars[1].stem + before.pillars[1].branch, '丙寅')
  assert.equal(after.pillars[1].stem + after.pillars[1].branch, '丁卯')
})
