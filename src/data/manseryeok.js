/**
 * 만세력 — lunisolar 패키지 기반 (API 키 불필요)
 * npm install lunisolar
 */
import lunisolar from 'lunisolar';

const { SolarTerm } = lunisolar;

const KR_NAMES = [
  '소한','대한','입춘','우수','경칩','춘분',
  '청명','곡우','입하','소만','망종','하지',
  '소서','대서','입추','처서','백로','추분',
  '한로','상강','입동','소설','대설','동지',
];

function pad(n) {
  return String(n).padStart(2, '0');
}

/**
 * 양력 날짜 → 음력 정보 + 간지
 */
export function getLunarInfo(year, month, day) {
  try {
    const d = lunisolar(`${year}-${pad(month)}-${pad(day)}`);
    const lunar = d.lunar;
    const char8 = d.char8;
    return {
      lunYear:      lunar.year,
      lunMonth:     lunar.month,
      lunDay:       lunar.day,
      lunLeapmonth: !!lunar.isLeapMonth,
      ganjisi:      d.solarTerm ? d.solarTerm.toString() : '',
      // 일주 검증용 (lunisolar 계산값)
      dayChar: char8?.day?.toString() || '',
    };
  } catch {
    return null;
  }
}

/**
 * 특정 연도의 24절기 날짜 목록
 * 반환: [{ name, month, day }, ...]
 */
export function getSolarTerms(year) {
  try {
    const terms = [];
    for (let i = 0; i < 24; i++) {
      const found = SolarTerm.findDate(year, i); // [year, month(1-indexed), day]
      if (found) {
        terms.push({
          name:  KR_NAMES[i],
          month: found[1],
          day:   found[2],
        });
      }
    }
    return terms;
  } catch {
    return null;
  }
}
