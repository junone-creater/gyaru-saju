import { CHARS, YONGSIN } from './data.js'

export const STEMS  = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸']
export const BRANCH = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥']

export const STEM_EL   = ['wood','wood','fire','fire','earth','earth','metal','metal','water','water']
export const BRANCH_EL = ['water','earth','wood','wood','earth','fire','fire','earth','metal','metal','earth','water']

export const EL_HJ  = { wood:'木', fire:'火', earth:'土', metal:'金', water:'水' }
export const EL_KR  = { wood:'목', fire:'화', earth:'토', metal:'금', water:'수' }
export const EL_COL = { wood:'#6fcf6f', fire:'#cf5050', earth:'#c8a000', metal:'#a0a0d0', water:'#5090c8' }
export const EL_ORD = ['wood','fire','earth','metal','water']

const _si = n => ((n % 10) + 10) % 10
const _bi = n => ((n % 12) + 12) % 12

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

// ─ 입춘 날짜 근사 (연도별 2월 3~5일 사이, 4일로 고정 근사)
// 정확한 절기 시간 없이 날짜만 비교할 때 사용
function isBeforeLichun(m, d) {
  if (m < 2) return true
  if (m === 2 && d < 4) return true
  return false
}

// ─ 버그1+3 수정: 입춘 기준으로 연도 보정
function sajuYear(y, m, d) {
  return isBeforeLichun(m, d) ? y - 1 : y
}

// ─ 년주: 입춘 보정 적용
function yearGz(y, m, d) {
  const sy = sajuYear(y, m, d)
  const s = _si(sy - 4)
  const b = _bi(sy - 4)
  return { stem: STEMS[s], branch: BRANCH[b], si: s, bi: b }
}

// ─ 버그2 수정: 월주 — 오호건원법(五虎建元法)
// 월주 지지: 절기 기준 근사 (소한 6일, 입춘 4일, 경칩 6일, ... 고정값)
const TERM_DAYS = [
  { mo: 1,  d: 6,  bi: 1  }, // 소한 → 丑月(1)
  { mo: 2,  d: 4,  bi: 2  }, // 입춘 → 寅月(2)
  { mo: 3,  d: 6,  bi: 3  }, // 경칩 → 卯月(3)
  { mo: 4,  d: 5,  bi: 4  }, // 청명 → 辰月(4)
  { mo: 5,  d: 6,  bi: 5  }, // 입하 → 巳月(5)
  { mo: 6,  d: 6,  bi: 6  }, // 망종 → 午月(6)
  { mo: 7,  d: 7,  bi: 7  }, // 소서 → 未月(7)
  { mo: 8,  d: 8,  bi: 8  }, // 입추 → 申月(8)
  { mo: 9,  d: 8,  bi: 9  }, // 백로 → 酉月(9)
  { mo: 10, d: 8,  bi: 10 }, // 한로 → 戌月(10)
  { mo: 11, d: 8,  bi: 11 }, // 입동 → 亥月(11)
  { mo: 12, d: 7,  bi: 0  }, // 대설 → 子月(0)
]

function monthBranch(m, d) {
  // 뒤에서부터 순서대로 확인, 해당 절기 이후이면 그 月支 반환
  for (let i = TERM_DAYS.length - 1; i >= 0; i--) {
    const t = TERM_DAYS[i]
    if (m > t.mo || (m === t.mo && d >= t.d)) return t.bi
  }
  return 0 // 1월 소한 이전 → 子月 (대설월 연속)
}

function monthGz(y, m, d, yearStem) {
  const bi = monthBranch(m, d)
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
  if (h < 0) {
    // 시간 모름 → 일간 기준 자시(子時) 반환
    const s = (dsi % 5) * 2
    return { stem: STEMS[s], branch: BRANCH[0], si: s, bi: 0 }
  }
  // 자시(子時): 23:00~00:59, 축시: 01:00~02:59 ...
  const bi = Math.floor(((h + 1) % 24) / 2)
  const si = ((dsi % 5) * 2 + bi) % 10
  return { stem: STEMS[si], branch: BRANCH[bi], si, bi }
}

function countEl(pillars) {
  const c = { wood:0, fire:0, earth:0, metal:0, water:0 }
  for (const p of pillars) { c[STEM_EL[p.si]]++; c[BRANCH_EL[p.bi]]++ }
  return c
}

function domEl(ec) {
  return EL_ORD.reduce((a, b) => ec[a] >= ec[b] ? a : b)
}

function calcDaeun(ysi, msi, mbi, gender, bm, bd) {
  // 순행: 양년 남자, 음년 여자 / 역행: 그 반대
  const fwd = (gender === 'm' && ysi % 2 === 0) || (gender !== 'm' && ysi % 2 !== 0)
  // 대운 시작 나이: 생월·생일로 가장 가까운 절기까지 날수 / 3 (근사)
  const startAge = Math.max(2, Math.min(8, Math.round(bm * 0.6 + bd * 0.05)))
  const runs = []
  for (let i = 0; i < 9; i++) {
    const off = fwd ? i + 1 : -(i + 1)
    const s = _si(msi + off), b = _bi(mbi + off)
    runs.push({ age: startAge + i * 10, end: startAge + i * 10 + 9, stem: STEMS[s], branch: BRANCH[b], si: s, bi: b })
  }
  return runs
}

function calcSamjae(ybi) {
  const map = {
    2:[8,9,10], 6:[8,9,10], 10:[8,9,10],
    5:[11,0,1], 9:[11,0,1],  1:[11,0,1],
    8:[2,3,4],  0:[2,3,4],   4:[2,3,4],
    11:[5,6,7], 3:[5,6,7],   7:[5,6,7],
  }
  const sj = map[ybi] || []
  const yearBranches = { 2026:6, 2027:7, 2028:8, 2029:9, 2030:10 }
  const res = []
  for (const [yr, b] of Object.entries(yearBranches)) {
    const idx = sj.indexOf(b)
    if (idx >= 0) res.push({ year: +yr, type: ['들','눌','날'][idx] })
  }
  return res
}

export function mkRng(seed) {
  let s = seed >>> 0
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 0xffffffff }
}

export function pick(rng, arr) { return arr[Math.floor(rng() * arr.length)] }

const UNKNOWN_PILLAR = { stem: '?', branch: '?', si: 0, bi: 0, unknown: true }

export function calcAll(year, month, day, hour, name, gender) {
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

  const yp = yearGz(year, month, day)
  const mp = monthGz(year, month, day, yp.si)
  const dp = dayGz(year, month, day)
  const hp = hourGz(dp.si, hour)
  const pillars = [yp, mp, dp, hp]

  const ec   = countEl(pillars)
  const dom  = domEl(ec)
  const char = CHARS[dp.si]
  const daeun = calcDaeun(yp.si, mp.si, mp.bi, gender, month, day)
  const sj   = calcSamjae(yp.bi)
  const vs   = YONGSIN[dom]

  return { rng, pillars, ec, dom, char, daeun, sj, vs, dateUnknown: false }
}
