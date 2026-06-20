/**
 * 한국천문연구원 역서 API 연동
 * data.go.kr → 한국천문연구원_특일 정보 / 음력정보 API
 *
 * API 키 발급: https://www.data.go.kr 에서
 * "한국천문연구원_역서" 검색 후 활용 신청
 */

const API_KEY = import.meta.env.VITE_MANSERYEOK_API_KEY;

const BASE = 'https://apis.data.go.kr/B090041/openapi/service/LrsrCldInfoService';

function pad(n) {
  return String(n).padStart(2, '0');
}

/**
 * 양력 날짜 → 음력 정보 + 간지 + 절기 조회
 * @returns {{ lunYear, lunMonth, lunDay, lunLeapmonth, ganjisi, jd } | null}
 */
export async function fetchLunarInfo(year, month, day) {
  if (!API_KEY || API_KEY === 'YOUR_API_KEY_HERE') return null;

  const url =
    `${BASE}/getLunCalInfo` +
    `?serviceKey=${encodeURIComponent(API_KEY)}` +
    `&solYear=${year}&solMonth=${pad(month)}&solDay=${pad(day)}&_type=json`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;

    const json = await res.json();
    const item = json?.response?.body?.items?.item;
    if (!item) return null;

    return {
      lunYear:      Number(item.lunYear),
      lunMonth:     Number(item.lunMonth),
      lunDay:       Number(item.lunDay),
      lunLeapmonth: item.lunLeapmonth === '윤',
      ganjisi:      item.ganjisigangi || '',   // 절기 이름 (해당 날이 절기면 기재)
      jd:           Number(item.jd),            // 율리우스 적일 (일주 정확도 향상)
    };
  } catch {
    return null;
  }
}

/**
 * 특정 연도의 24절기 날짜·시각 목록 조회
 * @returns {Array<{ name, month, day, time }> | null}
 */
export async function fetchSolarTerms(year) {
  if (!API_KEY || API_KEY === 'YOUR_API_KEY_HERE') return null;

  const url =
    `${BASE}/getSolarTermInfo` +
    `?serviceKey=${encodeURIComponent(API_KEY)}` +
    `&solYear=${year}&_type=json&numOfRows=30`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;

    const json = await res.json();
    const items = json?.response?.body?.items?.item;
    if (!items) return null;

    const list = Array.isArray(items) ? items : [items];
    return list.map(it => ({
      name:  it.sgName,
      month: Number(it.solMonth),
      day:   Number(it.solDay),
      time:  it.sgTime || '0000',  // HHMM 형식
    }));
  } catch {
    return null;
  }
}
