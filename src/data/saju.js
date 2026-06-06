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

function yearGz(y) {
  const s = _si(y - 4), b = _bi(y - 4)
  return { stem: STEMS[s], branch: BRANCH[b], si: s, bi: b }
}
function monthGz(y, m) {
  const base = (y - 4) * 12 + (m - 1)
  const s = _si(base + 2), b = _bi(m - 1)
  return { stem: STEMS[s], branch: BRANCH[b], si: s, bi: b }
}
function dayGz(y, m, d) {
  const a = Math.floor((14 - m) / 12)
  const yy = y - a, mm = m + 12 * a - 2
  const jd = d + Math.floor((153 * mm + 2) / 5) + 365 * yy
    + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400)
  const s = _si(jd), b = _bi(jd)
  return { stem: STEMS[s], branch: BRANCH[b], si: s, bi: b }
}
function hourGz(dsi, h) {
  if (h < 0) return { stem: STEMS[0], branch: BRANCH[0], si: 0, bi: 0 }
  const b = Math.floor(((h + 1) % 24) / 2)
  const s = (dsi % 5) * 2 + b % 10
  return { stem: STEMS[s % 10], branch: BRANCH[b], si: s % 10, bi: b }
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
  const fwd = (gender === 'm' && ysi % 2 === 0) || (gender !== 'm' && ysi % 2 !== 0)
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

export function calcAll(year, month, day, hour, name, gender) {
  const seed = year * 1e6 + month * 1e4 + day * 1e2
    + Math.abs(hour) + name.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const rng = mkRng(seed)

  const yp = yearGz(year)
  const mp = monthGz(year, month)
  const dp = dayGz(year, month, day)
  const hp = hourGz(dp.si, hour)
  const pillars = [yp, mp, dp, hp]
  const ec   = countEl(pillars)
  const dom  = domEl(ec)
  const char = CHARS[dp.si]
  const daeun = calcDaeun(yp.si, mp.si, mp.bi, gender, month, day)
  const sj   = calcSamjae(yp.bi)
  const vs   = YONGSIN[dom]

  return { rng, pillars, ec, dom, char, daeun, sj, vs }
}
