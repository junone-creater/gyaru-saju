import { CHARS, YONGSIN } from './data.js'

export const STEMS  = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸']
export const BRANCH = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥']

export const STEM_EL   = ['wood','wood','fire','fire','earth','earth','metal','metal','water','water']
export const BRANCH_EL = ['water','earth','wood','wood','earth','fire','fire','earth','metal','metal','earth','water']

export const EL_HJ  = { wood:'木', fire:'火', earth:'土', metal:'金', water:'水' }
export const EL_KR  = { wood:'목', fire:'화', earth:'토', metal:'금', water:'수' }
export const EL_COL = { wood:'#52FFD8', fire:'#FF007F', earth:'#EEDAA2', metal:'#DCE7F5', water:'#9B70FF' }
export const EL_ORD = ['wood','fire','earth','metal','water']

const _si = n => ((n % 10) + 10) % 10
const _bi = n => ((n % 12) + 12) % 12
const DAY_MS = 24 * 60 * 60 * 1000
const HOUR_MS = 60 * 60 * 1000
const KST_OFFSET_HOURS = 9
const DEG = Math.PI / 180

function normDeg(n) {
  return ((n % 360) + 360) % 360
}

function angleDelta(from, to) {
  return ((from - to + 540) % 360) - 180
}

function kstTime(y, m, d, h = 12) {
  const hour = Math.floor(h)
  const minute = Math.round((h - hour) * 60)
  return Date.UTC(y, m - 1, d, hour - KST_OFFSET_HOURS, minute)
}

function julianDate(time) {
  return time / DAY_MS + 2440587.5
}

// Meeus/NOAA 계열 근사식. 절기 경계 판정용으로 분 단위 오차를 줄이는 데 충분하다.
function solarLongitude(time) {
  const t = (julianDate(time) - 2451545.0) / 36525
  const l0 = normDeg(280.46646 + t * (36000.76983 + t * 0.0003032))
  const m = normDeg(357.52911 + t * (35999.05029 - 0.0001537 * t))
  const c =
    Math.sin(m * DEG) * (1.914602 - t * (0.004817 + 0.000014 * t)) +
    Math.sin(2 * m * DEG) * (0.019993 - 0.000101 * t) +
    Math.sin(3 * m * DEG) * 0.000289
  const omega = 125.04 - 1934.136 * t
  return normDeg(l0 + c - 0.00569 - 0.00478 * Math.sin(omega * DEG))
}

// ─ jd 계산 (Gregorian 표준 공식, March=0 기준)
function _jd(y, m, d) {
  const a = Math.floor((14 - m) / 12)
  const yy = y - a
  const mm = m + 12 * a - 3
  return d
    + Math.floor((153 * mm + 2) / 5)
    + 365 * yy
    + Math.floor(yy / 4)
    - Math.floor(yy / 100)
    + Math.floor(yy / 400)
}


const solarTermCache = new Map()

function findSolarTermTime(year, targetDeg) {
  const cacheKey = `${year}:${targetDeg}`
  if (solarTermCache.has(cacheKey)) return solarTermCache.get(cacheKey)

  const step = 6 * HOUR_MS
  let prevTime = Date.UTC(year, 0, 1, -KST_OFFSET_HOURS)
  let prevDelta = angleDelta(solarLongitude(prevTime), targetDeg)
  const endTime = Date.UTC(year + 1, 0, 1, -KST_OFFSET_HOURS) + DAY_MS

  for (let time = prevTime + step; time <= endTime; time += step) {
    const delta = angleDelta(solarLongitude(time), targetDeg)
    if (prevDelta <= 0 && delta >= 0) {
      let lo = prevTime
      let hi = time
      for (let i = 0; i < 42; i++) {
        const mid = (lo + hi) / 2
        if (angleDelta(solarLongitude(mid), targetDeg) >= 0) hi = mid
        else lo = mid
      }
      solarTermCache.set(cacheKey, hi)
      return hi
    }
    prevTime = time
    prevDelta = delta
  }

  throw new Error(`solar term not found: ${year}, ${targetDeg}`)
}

const JIE_TERMS = [
  { name: '소한', deg: 285, bi: 1  },
  { name: '입춘', deg: 315, bi: 2  },
  { name: '경칩', deg: 345, bi: 3  },
  { name: '청명', deg: 15,  bi: 4  },
  { name: '입하', deg: 45,  bi: 5  },
  { name: '망종', deg: 75,  bi: 6  },
  { name: '소서', deg: 105, bi: 7  },
  { name: '입추', deg: 135, bi: 8  },
  { name: '백로', deg: 165, bi: 9  },
  { name: '한로', deg: 195, bi: 10 },
  { name: '입동', deg: 225, bi: 11 },
  { name: '대설', deg: 255, bi: 0  },
]

function jieTermsForYear(year) {
  return JIE_TERMS.map(term => ({
    ...term,
    time: findSolarTermTime(year, term.deg),
  })).sort((a, b) => a.time - b.time)
}

function jieTermsAround(year) {
  return [
    ...jieTermsForYear(year - 1),
    ...jieTermsForYear(year),
    ...jieTermsForYear(year + 1),
  ].sort((a, b) => a.time - b.time)
}

function birthTime(y, m, d, h) {
  return kstTime(y, m, d, h >= 0 ? h : 12)
}

function lichunTime(year) {
  return findSolarTermTime(year, 315)
}

function sajuYear(y, m, d, h) {
  return birthTime(y, m, d, h) < lichunTime(y) ? y - 1 : y
}

// ─ 년주: 실제 입춘 시각 기준으로 연도 보정
function yearGz(y, m, d, h) {
  const sy = sajuYear(y, m, d, h)
  const s = _si(sy - 4)
  const b = _bi(sy - 4)
  return { stem: STEMS[s], branch: BRANCH[b], si: s, bi: b }
}

function nearestJie(y, m, d, h, fwd) {
  const bt = birthTime(y, m, d, h)
  const terms = jieTermsAround(y)
  if (fwd) return terms.find(term => term.time > bt)

  for (let i = terms.length - 1; i >= 0; i--) {
    if (terms[i].time <= bt) return terms[i]
  }
  return terms[0]
}

// ─ 월주: 실제 절입 시각 기준 + 오호건원법(五虎建元法)
function monthGz(y, m, d, h, yearStem) {
  const bi = nearestJie(y, m, d, h, false).bi
  // 오호건원법: 년주 천간으로 寅月(bi=2) 시작 천간 결정
  const startStem = ((yearStem % 5) * 2 + 2) % 10
  // bi=2(寅)를 offset 0으로, 이후 순서대로 증가
  const offset = (bi - 2 + 12) % 12
  const si = (startStem + offset) % 10
  return { stem: STEMS[si], branch: BRANCH[bi], si, bi }
}

// ─ 일주: Gregorian 표준 _jd + 오프셋 +8 (천간/지지 공통)
// 검증: manseryeok 기준 1992-10-24=癸酉, 1996-02-04=辛未, 1993-03-22=壬寅 일치
function dayGz(y, m, d) {
  const jd = _jd(y, m, d)
  const s = _si(jd + 8)
  const b = _bi(jd + 8)
  return { stem: STEMS[s], branch: BRANCH[b], si: s, bi: b }
}

// ─ 시주: 오자건원법(五子建元法) — 일주 천간 기준
function hourGz(dsi, h) {
  if (h < 0) return { ...UNKNOWN_PILLAR }
  // 자시(子時): 23:00~00:59, 축시: 01:00~02:59 ...
  const bi = Math.floor(((h + 1) % 24) / 2)
  const si = ((dsi % 5) * 2 + bi) % 10
  return { stem: STEMS[si], branch: BRANCH[bi], si, bi }
}

function countEl(pillars) {
  const c = { wood:0, fire:0, earth:0, metal:0, water:0 }
  for (const p of pillars) {
    if (p.unknown) continue
    c[STEM_EL[p.si]]++
    c[BRANCH_EL[p.bi]]++
  }
  return c
}

function domEl(ec) {
  return EL_ORD.reduce((a, b) => ec[a] >= ec[b] ? a : b)
}

function calcDaeun(ysi, msi, mbi, gender, by, bm, bd, bh) {
  // 순행: 양년 남자, 음년 여자 / 역행: 그 반대
  const fwd = (gender === 'm' && ysi % 2 === 0) || (gender !== 'm' && ysi % 2 !== 0)
  // 대운 시작 나이: 순행은 다음 절입, 역행은 이전 절입까지의 시간 / 3일=1년
  const bt = birthTime(by, bm, bd, bh)
  const term = nearestJie(by, bm, bd, bh, fwd)
  const days = Math.abs(term.time - bt) / DAY_MS
  const startAge = Math.max(1, Math.round(days / 3))
  const runs = []
  for (let i = 0; i < 9; i++) {
    const off = fwd ? i + 1 : -(i + 1)
    const s = _si(msi + off), b = _bi(mbi + off)
    runs.push({ age: startAge + i * 10, end: startAge + i * 10 + 9, stem: STEMS[s], branch: BRANCH[b], si: s, bi: b })
  }
  return runs
}

function calcSamjae(ybi, startYear) {
  const map = {
    2:[8,9,10], 6:[8,9,10], 10:[8,9,10],
    5:[11,0,1], 9:[11,0,1],  1:[11,0,1],
    8:[2,3,4],  0:[2,3,4],   4:[2,3,4],
    11:[5,6,7], 3:[5,6,7],   7:[5,6,7],
  }
  const sj = map[ybi] || []
  const res = []
  for (let yr = startYear; yr < startYear + 5; yr++) {
    const b = _bi(yr - 4)
    const idx = sj.indexOf(b)
    if (idx >= 0) res.push({ year: yr, type: ['들','눌','날'][idx] })
  }
  return res
}

export function mkRng(seed) {
  let s = seed >>> 0
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 0xffffffff }
}

export function pick(rng, arr) { return arr[Math.floor(rng() * arr.length)] }

const UNKNOWN_PILLAR = { stem: '?', branch: '?', si: 0, bi: 0, unknown: true }

export function calcAll(year, month, day, hour, name, gender, forecastStartYear = new Date().getFullYear()) {
  const dateUnknown = year === 0
  const nameSeed = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const seed = dateUnknown
    ? Math.abs(hour) + nameSeed
    : year * 1e6 + month * 1e4 + day * 1e2 + Math.abs(hour) + nameSeed
  const rng = mkRng(seed)

  if (dateUnknown) {
    const hp = { stem: STEMS[0], branch: BRANCH[0], si: 0, bi: 0 }
    const pillars = [{ ...UNKNOWN_PILLAR }, { ...UNKNOWN_PILLAR }, { ...UNKNOWN_PILLAR }, hp]
    const ec = countEl([hp])
    const dom = domEl(ec)
    const char = CHARS[Math.floor(rng() * 10)]
    return { rng, pillars, ec, dom, char, daeun: [], sj: [], vs: YONGSIN[dom], dateUnknown: true }
  }

  const yp = yearGz(year, month, day, hour)
  const mp = monthGz(year, month, day, hour, yp.si)
  const dp = dayGz(year, month, day)
  const hp = hourGz(dp.si, hour)
  const pillars = [yp, mp, dp, hp]

  const ec   = countEl(pillars)
  const dom  = domEl(ec)
  const char = CHARS[dp.si]
  const daeun = calcDaeun(yp.si, mp.si, mp.bi, gender, year, month, day, hour)
  const sj   = calcSamjae(yp.bi, forecastStartYear)
  const vs   = YONGSIN[dom]

  return { rng, pillars, ec, dom, char, daeun, sj, vs, dateUnknown: false }
}
