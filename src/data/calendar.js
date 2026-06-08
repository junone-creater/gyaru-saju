const MIN_YEAR = 1900
const DAY_MS = 24 * 60 * 60 * 1000

const lunarFormatter = new Intl.DateTimeFormat('en-u-ca-chinese', {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  timeZone: 'UTC',
})

function partsToLunar(date) {
  const parts = lunarFormatter.formatToParts(date)
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]))
  const monthValue = values.month || ''

  return {
    year: Number(values.relatedYear),
    month: Number.parseInt(monthValue, 10),
    day: Number(values.day),
    isLeapMonth: monthValue.includes('bis'),
  }
}

export function getCurrentDateParts(now = new Date()) {
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
  }
}

export function isValidSolarDate(year, month, day, now = new Date()) {
  const current = getCurrentDateParts(now)
  if (!Number.isInteger(year) || year < MIN_YEAR || year > current.year) return false

  const date = new Date(Date.UTC(year, month - 1, day, 12))
  const isRealDate =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day

  if (!isRealDate) return false

  const entered = year * 10000 + month * 100 + day
  const today = current.year * 10000 + current.month * 100 + current.day
  return entered <= today
}

export function lunarToSolar(year, month, day) {
  if (
    !Number.isInteger(year) ||
    year < MIN_YEAR ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 30
  ) {
    return null
  }

  const start = Date.UTC(year, 0, 1, 12)
  const end = Date.UTC(year + 1, 2, 1, 12)

  for (let time = start; time <= end; time += DAY_MS) {
    const date = new Date(time)
    const lunar = partsToLunar(date)
    if (
      lunar.year === year &&
      lunar.month === month &&
      lunar.day === day &&
      !lunar.isLeapMonth
    ) {
      return {
        year: date.getUTCFullYear(),
        month: date.getUTCMonth() + 1,
        day: date.getUTCDate(),
      }
    }
  }

  return null
}

export function resolveBirthDate(year, month, day, isLunar, now = new Date()) {
  if (!isLunar) {
    return isValidSolarDate(year, month, day, now)
      ? { year, month, day }
      : null
  }

  const solar = lunarToSolar(year, month, day)
  return solar && isValidSolarDate(solar.year, solar.month, solar.day, now)
    ? solar
    : null
}
