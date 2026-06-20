import { useState, useEffect, useRef } from "react";
import {
  calcAll, STEM_EL, BRANCH_EL, EL_KR, EL_HJ, EL_COL, EL_ORD, pick,
  STEMS as STEMS_HJ, BRANCH as BRANCH_HJ,
} from "./data/saju.js";
import {
  CHARS, YONGSIN, GUIIN, SSINSAL, DAEUN_TXT, YEAR_GRADES, TIMES,
} from "./data/data.js";
import { resolveBirthDate } from "./data/calendar.js";

/* ──────────────────────────────────────────────
   갸루사주 — 심야 점집 에디션 (유이쨩 영상 무드 적용)
   대화형 입력 → 메일 발송 + 온페이지 풀 사주 풀이 → 스코메(하단 고정바)

   [에셋 배치] Vite 프로젝트의 public/assets/garusaju/ 폴더에:
   - yui-hero.mp4   (히어로 루프 영상)
   - yui-poster.jpg (영상 포스터)
   - yui-cut-smile.jpg / yui-cut-hand.jpg / yui-cut-final.jpg (웹툰 컷)
   에셋이 없으면 자동으로 자리표시 박스로 대체돼요.

   [웹훅] WEBHOOK_URL을 Make Custom Webhook URL로 교체
   [음력] calendarType:"lunar" 플래그 전송 → Make에서 변환 후 일주 재계산
   ────────────────────────────────────────────── */

const WEBHOOK_URL = import.meta.env.VITE_MAKE_WEBHOOK_URL || "YOUR_MAKE_WEBHOOK_URL";
const assetUrl = (file) => `${import.meta.env.BASE_URL}assets/garusaju/${file}`;

const landingUrl = (file) => `${import.meta.env.BASE_URL}assets/LandingPage/${file}`;

const ASSET = {
  heroVideo: `${import.meta.env.BASE_URL}assets/mainPage/main_page.MP4`,
  heroPoster: assetUrl("yui-poster.jpg"),
  page01: landingUrl("Page_01.jpeg"),   // 책 뒤에 숨어 눈만 빼꼼 (커버)
  page02: landingUrl("Page_02.jpeg"),   // 손 흔들며 인사
  page02b: landingUrl("Page_02_2.jpeg"),// 활짝 웃으며 인사 (CTA)
  page03: landingUrl("Page_03.jpeg"),   // 책 위로 눈만 보이는
  page04: landingUrl("Page_04.jpeg"),   // 놀라며 책 펼침
  page07: landingUrl("Page_07.jpeg"),   // 정면 미소 클로즈업
  page08: landingUrl("Page_08.jpeg"),   // 귀엽게 올려다보는
  page10: landingUrl("Page_10.jpeg"),   // 살짝 고민하는 표정
  page14: landingUrl("Page_14.jpeg"),   // 키티&보석 붓으로 상대를 가리키는
  page17: landingUrl("Page_17.jpeg"),   // 앉아서 내려다보는
  page18: landingUrl("Page_18.jpeg"),   // 스탑 손동작
};

/* ===== 일주 계산 (앵커: 1949-10-01 = 갑자일, JDN 2433191) ===== */
const STEMS = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"];
const BRANCHES = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"];
const BRANCH_ANIMAL = ["쥐", "소", "호랑이", "토끼", "용", "뱀", "말", "양", "원숭이", "닭", "개", "돼지"];

const STEM_PROFILE = {
  갑: { kw: ["직진", "리더", "성장"], line: "큰 나무처럼 곧게 자라는 타입이에요. 시작이 빠르고, 사람들을 끌고 가는 힘이 있어요.", pattern: "근데 한번 꺾이면 아무한테도 말 못 하고 혼자 오래 앓는 패턴… 있지 않아요?" },
  을: { kw: ["유연", "센스", "공감"], line: "덩굴처럼 어디서든 길을 찾는 타입이에요. 분위기 파악이 빠르고 사람을 편하게 해줘요.", pattern: "근데 다 맞춰주다가 정작 내 마음은 뒷전이 되는 패턴… 익숙하지 않아요?" },
  병: { kw: ["에너지", "표현", "긍정"], line: "태양처럼 있는 그대로 빛나는 타입이에요. 주변을 환하게 만드는 텐션이 있어요.", pattern: "근데 텐션이 꺼지는 날엔 누구보다 깊게 가라앉는 패턴… 있죠?" },
  정: { kw: ["섬세", "온기", "집중"], line: "촛불처럼 가까운 사람을 따뜻하게 비추는 타입이에요. 디테일을 보는 눈이 있어요.", pattern: "근데 눈치 보고 배려하다가 혼자 방전되는 패턴… 자주 겪지 않아요?" },
  무: { kw: ["듬직", "중심", "신뢰"], line: "산처럼 흔들리지 않는 타입이에요. 사람들이 기대고 싶어 하는 안정감이 있어요.", pattern: "근데 정작 내 속마음은 꺼내는 법을 모르는 패턴… 찔리지 않아요?" },
  기: { kw: ["포용", "성실", "현실"], line: "기름진 밭처럼 뭐든 품고 키워내는 타입이에요. 묵묵히 해내는 힘이 있어요.", pattern: "근데 다 받아주다가 결국 나만 손해 보는 패턴… 반복되지 않아요?" },
  경: { kw: ["결단", "정의", "추진"], line: "단단한 강철처럼 맺고 끊음이 분명한 타입이에요. 위기에 강해요.", pattern: "근데 '너무 칼 같다'는 오해에 속으로 상처받는 패턴… 있지 않아요?" },
  신: { kw: ["감각", "완성", "예리"], line: "세공된 보석처럼 빛나는 감각의 타입이에요. 퀄리티에 타협이 없어요.", pattern: "근데 완벽하려다 스스로를 제일 혹독하게 검열하는 패턴… 맞죠?" },
  임: { kw: ["스케일", "지혜", "자유"], line: "바다처럼 크고 깊은 타입이에요. 받아들이는 그릇이 남달라요.", pattern: "근데 마음이 넓어 보여도 진짜 깊은 곳은 아무도 못 보게 하는 패턴… 있지 않아요?" },
  계: { kw: ["직관", "감성", "치유"], line: "조용히 스며드는 빗물 같은 타입이에요. 말 안 해도 마음을 읽어내요.", pattern: "근데 생각이 너무 많아서 밤에 혼자 시뮬레이션 돌리는 패턴… 오늘도 했죠?" },
};

/* 생년월일 유효성 — 양력/음력 모두 calendar 엔진으로 검증 (음력은 양력 변환까지 성공해야 통과) */
function isValidBirth(y, m, d, isLunar = false) {
  if (!y || !m || !d) return false;
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  return resolveBirthDate(y, m, d, isLunar) !== null;
}

/* 시진 선택 그리드용 — '모름' 제외한 12지신 시간대 */
const TIME_CELLS = TIMES.filter((t) => t.v >= 0);

/* ===== 추가 프로필 입력 (연애 상태 · 기간 · 직업) ===== */
const RELATIONSHIPS = [
  { v: "solo", t: "솔로", q: "솔로 기간은 얼마나 됐어~?" },
  { v: "dating", t: "연애 중", q: "연애한 지 얼마나 됐어~?" },
  { v: "married", t: "결혼", q: "결혼한 지 얼마나 됐어~?" },
];
const DURATIONS = ["3개월 미만", "3개월~1년", "1~3년", "3년 이상"];
const JOBS = ["학생", "취준생", "직장인", "프리랜서", "자영업·사업", "기타"];
const STEP_TITLES = ["이름", "생년월일", "태어난 시간", "성별", "연애 상태", "기간", "직업", "결과 받을 메일"];

/* 만 나이 계산 — 양력 변환된 생일 기준 */
function calcAge(solar) {
  const now = new Date();
  let age = now.getFullYear() - solar.year;
  if (now.getMonth() + 1 < solar.month || (now.getMonth() + 1 === solar.month && now.getDate() < solar.day)) age -= 1;
  return age;
}

/* ===== 일주 미리보기(간이) — 결과 헤더 라벨용 ===== */
function iljuLabel(si, bi) {
  return `${STEMS[si]}${BRANCHES[bi]}일주`;
}

/* ===== 십성(十星) — 일간 기준 오행 생극 + 음양으로 판별 ===== */
const EL_GEN = { wood: "fire", fire: "earth", earth: "metal", metal: "water", water: "wood" };   // 내가 생하는
const EL_CTRL = { wood: "earth", earth: "water", water: "fire", fire: "metal", metal: "wood" };  // 내가 극하는

function tenGodOf(daySi, el, yang) {
  const dayEl = STEM_EL[daySi];
  const same = (daySi % 2 === 0) === yang;
  if (el === dayEl) return same ? "비견" : "겁재";
  if (EL_GEN[dayEl] === el) return same ? "식신" : "상관";
  if (EL_CTRL[dayEl] === el) return same ? "편재" : "정재";
  if (EL_CTRL[el] === dayEl) return same ? "편관" : "정관";
  return same ? "편인" : "정인"; // el이 일간을 생함
}

/* ===== 십이운성(十二運星) — 일간 기준, 양간 순행 · 음간 역행 ===== */
const UNSEONG = ["장생", "목욕", "관대", "건록", "제왕", "쇠", "병", "사", "묘", "절", "태", "양"];
// 각 천간의 장생(長生) 지지 인덱스: 甲→亥, 乙→午, 丙·戊→寅, 丁·己→酉, 庚→巳, 辛→子, 壬→申, 癸→卯
const UNSEONG_BIRTH = [11, 6, 2, 9, 2, 9, 5, 0, 8, 3];
function unseongOf(daySi, bi) {
  const start = UNSEONG_BIRTH[daySi];
  const step = daySi % 2 === 0 ? (bi - start + 12) % 12 : (start - bi + 12) % 12;
  return UNSEONG[step];
}

/* ===== 십이신살(十二神煞) — 일지 삼합 기준 ===== */
const SINSAL12 = ["지살", "도화살", "월살", "망신살", "장성살", "반안살", "역마살", "육해살", "화개살", "겁살", "재살", "천살"];
// 삼합 장생지: 신자진(水)→申, 인오술(火)→寅, 사유축(金)→巳, 해묘미(木)→亥
const SAMHAP_START = [8, 5, 2, 11, 8, 5, 2, 11, 8, 5, 2, 11];
function sinsalOf(dayBi, bi) {
  return SINSAL12[(bi - SAMHAP_START[dayBi] + 12) % 12];
}

/* 십이신살 갸루 해설 — 명식에 실제로 뜬 신살만 골라 보여준다 */
const SINSAL_DESC = {
  지살: "새로운 곳에서 길을 여는 신살이야~ 낯선 환경에서도 금방 적응하는 개척자 타입!!",
  도화살: "매력과 인기의 신살이야!! 이성한테 특히 인기 완전 많아~ 잘만 쓰면 최강 무기거든?!",
  월살: "씨앗을 품고 때를 기다리는 신살이야~ 조급해하지 않으면 제일 빛나는 타입!!",
  망신살: "솔직함이 무기이자 약점인 신살이야! 오픈 마인드로 살면 오히려 매력 폭발~",
  장성살: "타고난 지도자 기질이야!! 권위와 인정 받는 운이 있어~ 리더 해봐 진짜로!",
  반안살: "말 안장에 올라타는 출세운 신살이야!! 주변의 인정과 승진운이 따라와~",
  역마살: "이동과 변화의 신살이야~ 끊임없이 움직이며 기회 찾아! 해외운도 완전 좋아!!",
  육해살: "눈치 빠르고 센스 만점인 신살이야~ 사람 마음 읽는 속도 진짜 빨라!!",
  화개살: "예술적 감수성의 신살이야! 독특하고 신비로운 매력이 있어~ 완전 아티스트 기질!!",
  겁살: "승부사 기질의 신살이야! 위기를 기회로 바꾸는 강한 멘탈 가졌어~",
  재살: "머리 회전 초고속 전략가 신살이야~ 수 싸움에서 지는 법이 없거든?!",
  천살: "하늘이 시험하는 만큼 크게 크는 신살이야! 버틴 만큼 단단해지는 타입~",
};


/* ===== 전체 풀이 데이터 구성 (잠자던 사주 엔진 + 텍스트 데이터 연결) ===== */
function buildReading(solar, hour, name, gender, original) {
  const res = calcAll(solar.year, solar.month, solar.day, hour, name, gender);
  const { rng, pillars, ec, dom, char, daeun, sj, vs } = res;
  const labels = ["년주", "월주", "일주", "시주"];

  // 전통 만세력 표기 순서: 시주 → 일주 → 월주 → 연주 (글자는 한자, 십성 라벨 포함)
  const dsi = pillars[2].si;
  const dbi = pillars[2].bi;
  const pillarView = pillars.map((p, i) => ({
    label: labels[i],
    stem: p.unknown ? "?" : STEMS_HJ[p.si],
    branch: p.unknown ? "?" : BRANCH_HJ[p.bi],
    stemEl: p.unknown ? null : STEM_EL[p.si],
    branchEl: p.unknown ? null : BRANCH_EL[p.bi],
    stemGod: p.unknown ? "—" : i === 2 ? "일간(나)" : tenGodOf(dsi, STEM_EL[p.si], p.si % 2 === 0),
    branchGod: p.unknown ? "—" : tenGodOf(dsi, BRANCH_EL[p.bi], p.bi % 2 === 0),
    unseong: p.unknown ? "—" : unseongOf(dsi, p.bi),
    sinsal: p.unknown ? "—" : sinsalOf(dbi, p.bi),
    isDay: i === 2,
    unknown: !!p.unknown,
  })).reverse();

  // 명식에 실제로 뜬 신살 목록 (중복 제거, 차트 표기 순서 유지)
  const sinsalView = [...new Set(pillarView.filter((p) => !p.unknown).map((p) => p.sinsal))]
    .map((n) => ({ n, d: SINSAL_DESC[n] }));

  const maxEl = Math.max(1, ...EL_ORD.map((el) => ec[el]));
  const elBars = EL_ORD.map((el) => ({
    el, kr: EL_KR[el], hj: EL_HJ[el], n: ec[el], col: EL_COL[el],
    pct: Math.round((ec[el] / maxEl) * 100),
  }));

  const dp = pillars[2];
  const stemKo = STEMS[dp.si];
  const profile = STEM_PROFILE[stemKo];

  const moneyType = pick(rng, ["꾸준한 실력 수입형", "기회를 크게 잡는 한방형", "여러 길을 동시에 여는 부업형", "사람을 통해 판이 커지는 연결형"]);
  const relationTrap = pick(rng, ["상대의 가능성까지 대신 믿어주는 것", "싫다는 말을 너무 늦게 하는 것", "분위기를 지키느라 속마음을 숨기는 것", "한 번 정 준 사람을 오래 기다리는 것"]);
  const luckyAction = pick(rng, ["미뤄둔 연락 먼저 하기", "결정한 일에 마감 시간 붙이기", "싫은 건 짧게라도 말하기", "작은 약속부터 바로 실행하기"]);
  const sal = pick(rng, SSINSAL);
  const sal2 = pick(rng, SSINSAL.filter((s) => s !== sal));
  const gi = pick(rng, GUIIN);

  const daeunView = daeun.slice(0, 3).map((it) => ({
    age: it.age, end: it.end,
    gz: `${STEMS[it.si]}${BRANCHES[it.bi]}`,
    txt: pick(rng, DAEUN_TXT[STEM_EL[it.si]]),
  }));

  const startYear = new Date().getFullYear();
  const yearView = Array.from({ length: 3 }, (_, i) => {
    const yr = startYear + i;
    const grade = YEAR_GRADES[i % YEAR_GRADES.length];
    const samjae = sj.find((s) => s.year === yr);
    return {
      year: yr, grade: grade.g,
      desc: samjae ? `${samjae.type}삼재, 서두르기보다 점검이 먼저야` : grade.d,
    };
  });

  return {
    name, original,
    iljuLabel: iljuLabel(dp.si, dp.bi),
    animal: BRANCH_ANIMAL[dp.bi],
    pillarView, sinsalView, elBars,
    domKr: EL_KR[dom], domHj: EL_HJ[dom],
    char, profile,
    moneyType, relationTrap, luckyAction, sal, sal2, gi,
    daeunView, yearView, vs,
  };
}

/* ===== 웹훅 전송 ===== */
async function postToWebhook(payload) {
  if (WEBHOOK_URL.includes("YOUR_")) {
    console.log("[데모 모드] 웹훅 미설정 — 전송 데이터:", payload);
    return { ok: true, demo: true };
  }
  const res = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return { ok: res.ok };
}

/* ===== 스코메 가격 3단계 ===== */
const TIERS = [
  { id: "light", name: "라이트", price: 29000, desc: "일주 심층 리포트 (PDF)" },
  { id: "standard", name: "스탠다드", price: 79000, desc: "리포트 + 1:1 코칭 50분" },
  { id: "allin", name: "올인원", price: 129000, desc: "리포트 + 1:1 코칭 + 2주 팔로업 DM", best: true },
];
const won = (n) => "₩" + n.toLocaleString("ko-KR");

/* ===== 메인 ===== */
export default function GaruSajuNight() {
  const [phase, setPhase] = useState("form"); // form | result
  const [form, setForm] = useState({ name: "", by: "", bm: "", bd: "", calendarType: "solar", bt: "", timeUnknown: false, gender: "", relationship: "", relationDuration: "", job: "", email: "", agree: false });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [reading, setReading] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [applied, setApplied] = useState(false);
  const [formStep, setFormStep] = useState(0);

  useEffect(() => {
    const locked = phase === "form" && formStep > 0;
    document.documentElement.classList.toggle("gs-form-locked", locked);
    document.body.classList.toggle("gs-form-locked", locked);

    return () => {
      document.documentElement.classList.remove("gs-form-locked");
      document.body.classList.remove("gs-form-locked");
    };
  }, [phase, formStep]);

  const onChange = (k) => (e) =>
    setForm((f) => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const submitTest = async () => {
    setError("");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) return setError("이메일 주소를 확인해 주세요.");
    if (!form.agree) return setError("결과지 발송을 위해 개인정보 수집에 동의해 주세요.");

    const y = Number(form.by), m = Number(form.bm), d = Number(form.bd);
    const isLunar = form.calendarType === "lunar";
    const solar = resolveBirthDate(y, m, d, isLunar);
    if (!solar) return setError("생년월일을 다시 확인해 주세요. (음력은 평달 기준)");

    const hour = form.timeUnknown || form.bt === "" ? -1 : Number(form.bt);
    const timeCell = TIMES.find((t) => String(t.v) === form.bt);
    const timeLabel = hour < 0 || !timeCell ? null : `${timeCell.n} (${timeCell.r})`;
    const gender = form.gender || "f";
    const name = form.name.trim() || "운명의 갸루";
    const original = { year: y, month: m, day: d, isLunar, birthTime: timeLabel };

    const result = buildReading(solar, hour, name, gender, original);
    setReading(result);

    setSending(true);
    try {
      await postToWebhook({
        type: "saju_full",
        name,
        email: form.email.trim(),
        birthInput: `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
        calendarType: form.calendarType,
        birthSolar: `${solar.year}-${String(solar.month).padStart(2, "0")}-${String(solar.day).padStart(2, "0")}`,
        birthTime: timeLabel || "모름",
        gender,
        age: calcAge(solar),
        relationship: (RELATIONSHIPS.find((r) => r.v === form.relationship) || {}).t || "미입력",
        relationDuration: form.relationDuration || "미입력",
        job: form.job || "미입력",
        ilju: result.iljuLabel,
        dominantElement: result.domKr,
        submittedAt: new Date().toISOString(),
      });
      setPhase("result");
      window.scrollTo({ top: 0 });
    } catch {
      // 이메일 전송 실패해도 온페이지 풀이는 보여준다 (리드 우선)
      setPhase("result");
      window.scrollTo({ top: 0 });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={`gs-root ${phase === "form" ? "gs-root-form" : "gs-root-result"}`}>
      <StyleTag />
      {phase === "form" ? (
        <FormScreen form={form} onChange={onChange} submit={submitTest} sending={sending} error={error} onStepChange={setFormStep} />
      ) : (
        <>
          <ResultScreen name={form.name} reading={reading} openSheet={() => setSheetOpen(true)} />
          <StickyBar applied={applied} openSheet={() => setSheetOpen(true)} />
          {sheetOpen && (
            <ApplySheet
              name={form.name}
              email={form.email}
              ilju={reading ? reading.iljuLabel : null}
              applied={applied}
              onApplied={() => setApplied(true)}
              close={() => setSheetOpen(false)}
            />
          )}
        </>
      )}
      {phase !== "form" && (
        <footer className="gs-footer">
          <span className="gs-logo-mini">🌱</span> 이음나루 인지심리연구소 · @ieumnaru
        </footer>
      )}
    </div>
  );
}

/* ===== 히어로 영상 ===== */
// 그림체 인트로를 건너뛰고 사람 느낌 구간부터 반복 재생할 시작 지점(초).
// 영상이 그림체→사람으로 바뀌는 시점에 맞춰 숫자만 조정하면 돼요.
const HERO_START_TIME = 1;

function HeroVideo() {
  const [failed, setFailed] = useState(false);
  const videoRef = useRef(null);

  const seekToStart = () => {
    const v = videoRef.current;
    if (v) v.currentTime = HERO_START_TIME;
  };

  if (failed) {
    return (
      <img
        className="gs-hero-video"
        src={ASSET.heroPoster}
        alt="사주 리딩을 시작하는 유이쨩"
      />
    );
  }

  return (
    <div className="gs-hero-video-wrap">
      <video
        ref={videoRef}
        className="gs-hero-video"
        src={ASSET.heroVideo}
        autoPlay
        muted
        playsInline
        onLoadedMetadata={seekToStart}
        onEnded={() => {
          seekToStart();
          videoRef.current?.play();
        }}
        onError={() => setFailed(true)}
        aria-label="촛불 앞에서 사주 리딩을 시작하는 유이쨩"
      />
      <div className="gs-hero-glow" aria-hidden="true" />
    </div>
  );
}

/* ===== 웹툰 뷰어 인트로 — 네이버 웹툰 스타일 세로 스크롤 ===== */
const LANDING_IMAGES = [
  landingUrl("Page_01.jpeg"),
  landingUrl("Page_02.jpeg"),
  landingUrl("Page_02_2.jpeg"),
  landingUrl("Page_03.jpeg"),
  landingUrl("Page_04.jpeg"),
  landingUrl("Page_07.jpeg"),
  landingUrl("Page_08.jpeg"),
  landingUrl("Page_10.jpeg"),
  landingUrl("Page_14.jpeg"),
  landingUrl("Page_17.jpeg"),
  landingUrl("Page_18.jpeg"),
];

function WebtoonIntro({ onStart }) {
  return (
    <div className="gs-viewer">
      <header className="gs-viewer-bar">
        <span className="gs-viewer-title">갸루사주 · 심야 점집</span>
      </header>
      <div className="gs-viewer-strip">
        {LANDING_IMAGES.map((src, i) => (
          <img
            key={i}
            className="gs-viewer-img"
            src={src}
            alt=""
            loading={i < 2 ? "eager" : "lazy"}
          />
        ))}
      </div>
      <div className="gs-viewer-bottom">
        <p className="gs-viewer-hint">✦ 스크롤을 내려서 미리보기를 봤다면 ✦</p>
        <button className="gs-cta" onClick={onStart}>
          유이쨩에게 사주 보러가기 ☆
        </button>
      </div>
    </div>
  );
}

/* ===== 1단계: 대화형 입력 폼 — 질문 하나당 한 단계씩
   (인트로 → ①이름 → ②생일 → ③시간 → ④성별 → ⑤연애 상태 → ⑥기간 → ⑦직업 → ⑧이메일) ===== */
const INPUT_STEPS = 8; // 인트로 제외 입력 단계 수

function FormScreen({ form, onChange, submit, sending, error, onStepChange }) {
  const [step, setStep] = useState(0); // 0=인트로, 1=이름, 2=생일, 3=시간, 4=성별, 5=연애, 6=기간, 7=직업, 8=이메일
  const [stepError, setStepError] = useState("");

  useEffect(() => { onStepChange?.(step); }, [step]);

  const setDigits = (key, max) => (e) =>
    onChange(key)({ target: { value: e.target.value.replace(/\D/g, "").slice(0, max), type: "text" } });
  const setValue = (key, value) => onChange(key)({ target: { value, type: "text" } });
  const setBool = (key, value) => onChange(key)({ target: { checked: value, type: "checkbox" } });

  const timeOk = form.timeUnknown || form.bt !== "";

  /* 생일이 유효하면 만 나이 미리 보여주기 */
  const birthSolar = isValidBirth(Number(form.by), Number(form.bm), Number(form.bd), form.calendarType === "lunar")
    ? resolveBirthDate(Number(form.by), Number(form.bm), Number(form.bd), form.calendarType === "lunar")
    : null;
  const previewAge = birthSolar ? calcAge(birthSolar) : null;

  const relationQ = (RELATIONSHIPS.find((r) => r.v === form.relationship) || {}).q;

  const next = () => {
    setStepError("");
    if (step === 0) {
      setStep(1);
    } else if (step === 1) {
      if (!form.name.trim()) return setStepError("이름을 알려줘야 시작할 수 있어요!");
      setStep(2);
    } else if (step === 2) {
      if (!isValidBirth(Number(form.by), Number(form.bm), Number(form.bd), form.calendarType === "lunar"))
        return setStepError("생년월일을 다시 확인해 주세요. (음력은 평달 기준)");
      setStep(3);
    } else if (step === 3) {
      if (!timeOk) return setStepError("시간을 고르거나 ‘시간 몰라요’를 눌러줘.");
      setStep(4);
    } else if (step === 4) {
      if (!form.gender) return setStepError("대운 방향을 위해 성별을 골라줘!");
      setStep(5);
    } else if (step === 5) {
      if (!form.relationship) return setStepError("지금 연애 상태를 골라줘! 연애운 풀이에 꼭 필요해~");
      setStep(6);
    } else if (step === 6) {
      if (!form.relationDuration) return setStepError("기간도 살짝만 알려줘~ 흐름을 봐야 하거든!");
      setStep(7);
    } else if (step === 7) {
      if (!form.job) return setStepError("직업도 골라줘! 재물운이 달라진다구~");
      setStep(8);
    }
  };

  const onEnter = (e) => {
    // 한글 IME 조합을 끝내는 Enter는 무시 — 안 그러면 한 번 누른 Enter가 두 단계를 연속 통과시켜 다음 단계에 에러가 미리 뜬다
    if (e.key !== "Enter" || e.nativeEvent.isComposing || e.repeat) return;
    (step === 8 ? submit() : next());
  };

  if (step === 0) return <WebtoonIntro onStart={() => setStep(1)} />;

  return (
    <main className="gs-page gs-form-page">
      <header className="gs-hero gs-hero-dim">
        <HeroVideo />
        <div className="gs-hero-copy">
          <h1 className="gs-title">갸루<span className="gs-title-pop">사주</span></h1>
        </div>

        <section className="gs-chat" aria-label="사주 풀이 신청 대화">
        {step > 0 && (
          <div className="gs-progress" aria-label={`${INPUT_STEPS}단계 중 ${step}단계`}>
            <span className="gs-progress-track" aria-hidden="true">
              <i style={{ width: `${(step / INPUT_STEPS) * 100}%` }} />
            </span>
            <b className="gs-progress-num">{step}/{INPUT_STEPS}</b>
          </div>
        )}
        {step > 0 && (
        <div className="gs-chat-msg" key={`bubble-${step}`}>
          <img className="gs-chat-avatar" src={assetUrl("yui-cut-smile.jpg")} alt="" aria-hidden="true" />
          <div className="gs-chat-body">
            <b className="gs-bubble-who">유이쨩</b>
            <p className="gs-bubble yui">
              {step === 1 && "좋아, 접수~☆ 먼저 이름부터 알려줘!"}
              {step === 2 && `${form.name}! 좋은 이름이다♡ 생일은 언제야~?`}
              {step === 3 && "태어난 시간도 알려줘~ 몰라도 괜찮아!"}
              {step === 4 && "대운 방향을 봐야 하니까~ 성별도 골라줘☆"}
              {step === 5 && "이제 진짜 중요한 거~☆ 지금 연애하고 있어?♡"}
              {step === 6 && (relationQ || "기간은 얼마나 됐어~?")}
              {step === 7 && "마지막 질문~! 요즘 뭐 하면서 지내?☆ 직업 따라 재물운이 달라지거든♡"}
              {step === 8 && "오케이, 접수~☆ 풀이는 바로 보여주고, 메일로도 한 번 더 보내줄게!"}
            </p>
          </div>
        </div>
        )}

        <div className="gs-step-panel" key={`panel-${step}`} onKeyDown={onEnter}>
          {step > 0 && <span className="gs-q-chip">Q{step}. {STEP_TITLES[step - 1]}</span>}
          {step === 0 && (
            <button className="gs-cta" onClick={next}>유이쨩에게 사주 보러가기 ☆</button>
          )}

          {step === 1 && (
            <>
              <input className="gs-input" value={form.name} onChange={onChange("name")} placeholder="이름 입력" maxLength={20} autoFocus aria-label="이름" />
              {stepError && <p className="gs-error" role="alert">{stepError}</p>}
              <div className="gs-step-nav">
                <button className="gs-back" onClick={() => setStep(0)}>← 이전</button>
                <button className="gs-cta gs-cta-grow" onClick={next}>다음 →</button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="gs-date-row" aria-label="생년월일 직접 입력">
                <label className="gs-date-cell">
                  <input className="gs-input" inputMode="numeric" value={form.by} onChange={setDigits("by", 4)} placeholder="1999" autoFocus aria-label="년" />
                  <span>년</span>
                </label>
                <label className="gs-date-cell">
                  <input className="gs-input" inputMode="numeric" value={form.bm} onChange={setDigits("bm", 2)} placeholder="3" aria-label="월" />
                  <span>월</span>
                </label>
                <label className="gs-date-cell">
                  <input className="gs-input" inputMode="numeric" value={form.bd} onChange={setDigits("bd", 2)} placeholder="14" aria-label="일" />
                  <span>일</span>
                </label>
              </div>
              <div className="gs-toggle">
                {[["solar", "양력"], ["lunar", "음력"]].map(([v, t]) => (
                  <button
                    key={v}
                    type="button"
                    className={`gs-toggle-btn ${form.calendarType === v ? "on" : ""}`}
                    onClick={() => setValue("calendarType", v)}
                  >
                    {t}
                  </button>
                ))}
              </div>
              {form.calendarType === "lunar" && (
                <p className="gs-hint">음력은 평달 기준으로 양력 변환해서 볼게~</p>
              )}
              {previewAge !== null && (
                <p className="gs-hint">오~ 만 {previewAge}세구나! 접수했어♡</p>
              )}
              {stepError && <p className="gs-error" role="alert">{stepError}</p>}
              <div className="gs-step-nav">
                <button className="gs-back" onClick={() => setStep(1)}>← 이전</button>
                <button className="gs-cta gs-cta-grow" onClick={next}>다음 →</button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="gs-time-grid" role="group" aria-label="태어난 시진 선택">
                {TIME_CELLS.map((t) => (
                  <button
                    key={t.v}
                    type="button"
                    className={`gs-time-cell ${!form.timeUnknown && form.bt === String(t.v) ? "on" : ""}`}
                    aria-pressed={!form.timeUnknown && form.bt === String(t.v)}
                    onClick={() => { setValue("bt", String(t.v)); if (form.timeUnknown) setBool("timeUnknown", false); }}
                  >
                    <b>{t.n}</b>
                    <small>{t.r}</small>
                  </button>
                ))}
              </div>
              <button
                type="button"
                className={`gs-toggle-btn gs-unknown-btn ${form.timeUnknown ? "on" : ""}`}
                aria-pressed={form.timeUnknown}
                onClick={() => setBool("timeUnknown", !form.timeUnknown)}
              >
                {form.timeUnknown ? "✓ 시간 몰라도 괜찮아~" : "시간 몰라요 (시주 빼고 볼게)"}
              </button>
              {stepError && <p className="gs-error" role="alert">{stepError}</p>}
              <div className="gs-step-nav">
                <button className="gs-back" onClick={() => setStep(2)}>← 이전</button>
                <button className="gs-cta gs-cta-grow" onClick={next}>다음 →</button>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <div className="gs-toggle" role="group" aria-label="성별 선택">
                {[["f", "여자"], ["m", "남자"]].map(([v, t]) => (
                  <button
                    key={v}
                    type="button"
                    className={`gs-toggle-btn ${form.gender === v ? "on" : ""}`}
                    aria-pressed={form.gender === v}
                    onClick={() => setValue("gender", v)}
                  >
                    {t}
                  </button>
                ))}
              </div>
              {stepError && <p className="gs-error" role="alert">{stepError}</p>}
              <div className="gs-step-nav">
                <button className="gs-back" onClick={() => setStep(3)}>← 이전</button>
                <button className="gs-cta gs-cta-grow" onClick={next}>다음 →</button>
              </div>
            </>
          )}

          {step === 5 && (
            <>
              <div className="gs-toggle" role="group" aria-label="연애 상태 선택">
                {RELATIONSHIPS.map((r) => (
                  <button
                    key={r.v}
                    type="button"
                    className={`gs-toggle-btn ${form.relationship === r.v ? "on" : ""}`}
                    aria-pressed={form.relationship === r.v}
                    onClick={() => setValue("relationship", r.v)}
                  >
                    {r.t}
                  </button>
                ))}
              </div>
              {stepError && <p className="gs-error" role="alert">{stepError}</p>}
              <div className="gs-step-nav">
                <button className="gs-back" onClick={() => setStep(4)}>← 이전</button>
                <button className="gs-cta gs-cta-grow" onClick={next}>다음 →</button>
              </div>
            </>
          )}

          {step === 6 && (
            <>
              <div className="gs-pick-grid gs-duration-grid" role="group" aria-label="기간 선택">
                {DURATIONS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    className={`gs-toggle-btn ${form.relationDuration === d ? "on" : ""}`}
                    aria-pressed={form.relationDuration === d}
                    onClick={() => setValue("relationDuration", d)}
                  >
                    {d}
                  </button>
                ))}
              </div>
              {stepError && <p className="gs-error" role="alert">{stepError}</p>}
              <div className="gs-step-nav">
                <button className="gs-back" onClick={() => setStep(5)}>← 이전</button>
                <button className="gs-cta gs-cta-grow" onClick={next}>다음 →</button>
              </div>
            </>
          )}

          {step === 7 && (
            <>
              <div className="gs-pick-grid" role="group" aria-label="직업 선택">
                {JOBS.map((j) => (
                  <button
                    key={j}
                    type="button"
                    className={`gs-toggle-btn ${form.job === j ? "on" : ""}`}
                    aria-pressed={form.job === j}
                    onClick={() => setValue("job", j)}
                  >
                    {j}
                  </button>
                ))}
              </div>
              {stepError && <p className="gs-error" role="alert">{stepError}</p>}
              <div className="gs-step-nav">
                <button className="gs-back" onClick={() => setStep(6)}>← 이전</button>
                <button className="gs-cta gs-cta-grow" onClick={next}>다음 →</button>
              </div>
            </>
          )}

          {step === 8 && (
            <>
              <input className="gs-input" type="email" value={form.email} onChange={onChange("email")} placeholder="yui@example.com" autoFocus aria-label="결과지 받을 이메일" />
              <label className="gs-agree">
                <input type="checkbox" checked={form.agree} onChange={onChange("agree")} />
                <span>풀이 발송을 위한 개인정보(이름·생년월일·이메일) 수집에 동의해요.</span>
              </label>
              {error && <p className="gs-error" role="alert">{error}</p>}
              <div className="gs-step-nav">
                <button className="gs-back" onClick={() => setStep(7)}>← 이전</button>
                <button className="gs-cta gs-cta-grow" onClick={submit} disabled={sending}>
                  {sending ? "펼치는 중…" : "내 사주 풀이 보기 ♡"}
                </button>
              </div>
              <p className="gs-fineprint">풀이는 바로 화면에 나와요. 메일로도 한 부 보내드려요!</p>
            </>
          )}
        </div>

        </section>
      </header>
    </main>
  );
}

/* ===== 스크롤 등장 래퍼 ===== */
function Reveal({ as: Tag = "section", className = "", children, ...rest }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return setShown(true);
    const ob = new IntersectionObserver(([e]) => e.isIntersecting && setShown(true), { threshold: 0.12 });
    if (ref.current) ob.observe(ref.current);
    return () => ob.disconnect();
  }, []);
  return (
    <Tag ref={ref} className={`gs-reveal ${shown ? "shown" : ""} ${className}`} {...rest}>
      {children}
    </Tag>
  );
}

function birthLineText(o) {
  if (!o) return "";
  const cal = o.isLunar ? "음력" : "양력";
  const date = `${o.year}.${String(o.month).padStart(2, "0")}.${String(o.day).padStart(2, "0")}`;
  return `${cal} ${date} · ${o.birthTime ? o.birthTime : "시간 미상"}`;
}

/* ===== 섹션 헤더 ===== */
function SectionHead({ kicker, title }) {
  return (
    <header className="gs-sec-head">
      <span className="gs-sec-kicker">{kicker}</span>
      <h3 className="gs-sec-title">{title}</h3>
    </header>
  );
}

/* ===== 웹툰 컷 빌딩블록 ===== */
function Cut({ num, className = "", children, ...rest }) {
  return (
    <Reveal as="article" className={`gs-wt-cut ${className}`} data-cut={String(num).padStart(2, "0")} {...rest}>
      {children}
    </Reveal>
  );
}

function CutPhoto({ src, alt, children }) {
  return (
    <div className="gs-wt-photo">
      <img className="gs-wt-img" src={src} alt={alt} loading="lazy" />
      <div className="gs-wt-shade" aria-hidden="true" />
      {children}
    </div>
  );
}

const Bubble = ({ who = "yui", children }) => (
  <p className={`gs-bubble ${who}`}>
    <b className="gs-bubble-who">{who === "yui" ? "유이쨩" : "친구"}</b>
    {children}
  </p>
);

/* 핵심구만 블러 처리 — 신청 유도용 (마디마다 핵심 내용을 가림) */
const Blur = ({ children }) => (
  <span className="gs-blur" title="신청하면 전부 공개돼요♡">{children}</span>
);

/* 앞 단어 몇 개만 보여주고 나머지(핵심)는 블러 — 호기심 유발 */
const PartialBlur = ({ text }) => {
  const words = String(text).trim().split(/\s+/);
  const show = words.length <= 2 ? 1 : 2;
  const visible = words.slice(0, show).join(" ");
  const hidden = words.slice(show).join(" ");
  return (
    <>
      {visible}
      {hidden && " "}
      {hidden && <span className="gs-blur" title="신청하면 전부 공개돼요♡">{hidden}</span>}
    </>
  );
};

/* 웹툰식 타원 말풍선 — 기본은 이미지 상단에 걸치고, pos로 이미지 위 임의 위치 배치 가능 */
const Balloon = ({ tail = "l", pos = "", children }) => (
  <div className={`gs-balloon gs-balloon-${tail} ${pos}`}>
    <p>{children}</p>
  </div>
);

/* ===== 2단계: 온페이지 풀 사주 풀이 (유이쨩 웹툰 26컷) ===== */
function ResultScreen({ name, reading, openSheet }) {
  if (!reading) return null;
  const {
    pillarView, sinsalView, domKr, domHj, char, original,
    moneyType, relationTrap, luckyAction, gi, daeunView, yearView, vs,
  } = reading;
  const nick = `${name}쨩`;

  return (
    <main className="gs-page gs-page-pad gs-result">
      {/* 1컷 — 인사 (상단 머리말 + 이미지) */}
      <Cut num={1} className="gs-wt-photo-cut">
        <div className="gs-wt-greet-head">
          <h2 className="gs-wt-title">안녕~!<br />난 <em>유이쨩</em>이야♡</h2>
        </div>
        <CutPhoto src={ASSET.page02} alt="손을 흔들며 인사하는 유이쨩">
          <Balloon tail="r" pos="gs-balloon-tl"><b>{nick} 안녕~♡</b><br />오늘의 반짝 운명, 열어볼까?</Balloon>
        </CutPhoto>
      </Cut>

      {/* 2컷 — 인트로 카피 (텍스트 전용) */}
      <Cut num={2} className="gs-wt-text-cut gs-wt-intro">
        <p className="gs-wt-eyebrow">✨ 유이쨩의 초특급 사주 분석 ✨</p>
        <p className="gs-wt-quote">너... 생각보다 훨씬<br />흥미로운 팔자네~?<i className="gs-emo">(¬‿¬)♡</i></p>
      </Cut>

      {/* 3컷 — 기운 세당 */}
      <Cut num={3} className="gs-wt-photo-cut">
        <CutPhoto src={ASSET.page03} alt="책 위로 눈만 빼꼼 보이는 유이쨩">
          <Balloon tail="r" pos="gs-balloon-tl">옴마나~!<br /><b>너 기운이 꽤 세당?♡</b></Balloon>
          <div className="gs-wt-overlay gs-wt-overlay-mid">
            <p className="gs-wt-line">너 진짜 보통 팔자가 아닌데~?<br />딱 봐도 알지☆<br />유이쨩은 못 속여~<i className="gs-emo">(¬‿¬)♡</i></p>
          </div>
        </CutPhoto>
      </Cut>

      {/* 4컷 — 고민 짚기 */}
      <Cut num={4} className="gs-wt-photo-cut">
        <CutPhoto src={ASSET.page04} alt="놀란 표정으로 사주책을 펼친 유이쨩">
          <Balloon tail="l" pos="gs-balloon-tr">이게 고민되는 거지~?</Balloon>
          <Balloon tail="up" pos="gs-balloon-bc"><b>너 어떤 사람인지도☆<br />너 고민이 뭔지도☆</b><br />딱 봐도 알징~♡</Balloon>
        </CutPhoto>
      </Cut>

      {/* 5컷 — 37번 확인 */}
      <Cut num={5} className="gs-wt-text-cut gs-wt-lace gs-wt-lace-join">
        <h2 className="gs-wt-title">결정 다 해놓고<br /><em>마지막 확인만 37번</em><br />하는 거 맞지~?<i className="gs-emo">(¬‿¬)♡</i></h2>
        <div className="gs-wt-checks">
          <p>좋아하는 것도 오래 고민하고☆</p>
          <p>사는 것도 오래 고민하고☆</p>
          <p>떠나는 것도 오래 고민해☆</p>
        </div>
        <p className="gs-wt-punch">근데 웃긴 건~ 그렇게 고민하다 타이밍 놓치고<br /><b>“에이~ 원래 내 거 아니었나 보네♡”</b><br />하고 넘겨버리잖아~<i className="gs-emo">(&gt;_&lt;)💦</i></p>
      </Cut>

      {/* 6컷 — 팔자 때문 */}
      <Cut num={6} className="gs-wt-text-cut gs-wt-impact">
        <h2 className="gs-wt-title">{nick}이 지금<br />이게 고민되는 이유☆</h2>
        <p className="gs-wt-answer">유이쨩은 알지~♡<br /><b>바로 니 팔자 때문이야</b> <i className="gs-emo">(¬‿¬)✨</i></p>
      </Cut>

      {/* 7컷 — 사주 명식 (전통 만세력 스타일 + 십이운성/신살) */}
      <Cut num={7} className="gs-wt-data gs-myeongsik">
        <div className="gs-ms-head">
          <span className="gs-ms-kicker">四柱命式</span>
          <h2 className="gs-ms-title">{nick}의 사주</h2>
          <p className="gs-ms-date">{birthLineText(original)}</p>
          <span className="gs-ms-deco" aria-hidden="true">✦ ♡ ✦</span>
        </div>
        <div className="gs-ms-grid">
          {pillarView.map((p) => (
            <div key={p.label} className="gs-ms-col">
              <span className={`gs-ms-god ${p.isDay ? "me" : ""}`}>{p.stemGod}</span>
              <strong className={`gs-ms-tile el-${p.stemEl || "none"}`}>{p.stem}</strong>
              <strong className={`gs-ms-tile el-${p.branchEl || "none"}`}>{p.branch}</strong>
              <span className="gs-ms-god">{p.branchGod}</span>
            </div>
          ))}
        </div>
        <div className="gs-ms-rows">
          <div className="gs-ms-row">
            {pillarView.map((p) => <span key={p.label}>{p.unseong}</span>)}
          </div>
          <div className="gs-ms-row gs-ms-sal">
            {pillarView.map((p) => <span key={p.label}>{p.sinsal}</span>)}
          </div>
        </div>
        <p className="gs-ms-guide">위에서부터 십성 · 십이운성 · 신살이야~♡</p>
        <div className="gs-ms-core">
          <span>핵심 기운</span>
          <strong>{domHj} · {domKr} · {char.name}</strong>
        </div>
        {sinsalView.length > 0 && (
          <div className="gs-ms-salcards">
            <p className="gs-ms-sallabel">신살 분석</p>
            {sinsalView.map((s) => (
              <div key={s.n} className="gs-ms-salcard">
                <b>{s.n}</b>
                <p>{s.d}</p>
              </div>
            ))}
          </div>
        )}
      </Cut>

      {/* 8컷 — 흐름 궁금하지 */}
      <Cut num={8} className="gs-wt-photo-cut">
        <Balloon tail="r">니 팔자가 <b>어떻게 흘러가는지</b><br />궁금하지~?♡</Balloon>
        <CutPhoto src={ASSET.page08} alt="귀엽게 올려다보는 유이쨩" />
      </Cut>

      {/* 9컷 — 적나라하게 */}
      <Cut num={9} className="gs-wt-text-cut gs-wt-join-y">
        <h2 className="gs-wt-title gs-wt-title-sm">니 눈앞에 <em>완전 적나라하게</em><br />보여줄 수 있엉~<i className="gs-emo">(¬‿¬)♡</i></h2>
        <p className="gs-wt-sparkle" aria-hidden="true">✦ ♡ ✦</p>
      </Cut>

      {/* 10컷 — 그런데 말이야 */}
      <Cut num={10} className="gs-wt-photo-cut">
        <Balloon tail="l">그런데 말이야~♡</Balloon>
        <CutPhoto src={ASSET.page10} alt="살짝 고민하는 표정의 유이쨩" />
      </Cut>

      {/* 11컷 — 삐빅 */}
      <Cut num={11} className="gs-wt-text-cut gs-wt-warning gs-wt-realtalk gs-wt-join-top">
        <div className="gs-wt-tape-bg" aria-hidden="true">
          <div className="gs-wt-tape gs-wt-tape-ghost-big">REAL TALK · REAL TALK</div>
          <div className="gs-wt-tape gs-wt-tape-ghost-sm">REAL TALK · REAL TALK · REAL TALK · REAL TALK</div>
        </div>
        <span className="gs-wt-beep"><i className="gs-wt-beep-warn">⚠︎</i> 삐빅☆ <i className="gs-wt-beep-warn">⚠︎</i></span>
        <h2 className="gs-wt-title">좋은 말만은<br /><em>안 한다~?</em> <i className="gs-emo">(¬‿¬)♡</i></h2>
      </Cut>

      {/* 13컷 — 반복될 문제 */}
      <Cut num={13} className="gs-wt-text-cut gs-wt-impact gs-wt-lace">
        <h2 className="gs-wt-title gs-wt-problem-title"><i className="gs-warn">⚠︎</i> 니 인생에서 <em>반복될 수 있는 문제</em> <i className="gs-warn">⚠︎</i></h2>
        <div className="gs-wt-problem">
          <strong>“알아서 알아주겠지~”</strong>
          <p>이 생각 때문에 손해 본 적 있지~?<i className="gs-emo">(¬‿¬)♡</i></p>
          <ul>
            <li>고맙다는 말도 못 하고☆</li>
            <li>섭섭하다는 말도 못 하고☆</li>
            <li>좋아한다는 말도 못 하고☆</li>
          </ul>
          <p>참을 만큼 참다가 어느 날 갑자기<br /><b>“나 이제 못 하겠어”</b><br />하고 사라지는 패턴<i className="gs-emo">(&gt;_&lt;)💦</i></p>
        </div>
        <p className="gs-wt-chill">근데 더 소름 돋는 건~<br /><b>이게 한 번이 아니라는 거야♡</b></p>
      </Cut>

      {/* 14컷 — 방법 (키티 붓으로 가리키는 유이쨩) */}
      <Cut num={14} className="gs-wt-photo-cut">
        <div className="gs-wt-greet-head">
          <h2 className="gs-wt-title">✨ 니 팔자를<br /><em>제대로 쓰는 방법</em> ✨</h2>
        </div>
        <CutPhoto src={ASSET.page14} alt="키티 보석 붓으로 상대를 가리키는 유이쨩">
          <Balloon tail="l" pos="gs-balloon-br">궁금하지~?♡</Balloon>
        </CutPhoto>
      </Cut>

      {/* 15컷 — 조언 */}
      <Cut num={15} className="gs-wt-text-cut gs-wt-impact gs-wt-lace gs-wt-lace-join">
        <h2 className="gs-wt-title">니 문제는<br /><em>능력 부족이 아니야~☆</em></h2>
        <div className="gs-wt-problem">
          <p>생각보다 너무 오래 참는 거야</p>
          <p>확인만 하지 말고 <b>표현도 하고☆</b><br />기다리지만 말고 <b>움직여봐☆</b></p>
          <p>니 팔자는 생각만 할 때보다<br /><b>움직이는 순간 훨씬 크게 열리거든</b></p>
          <strong>“알아서 알겠지” 그거 버려~♡</strong>
          <p>말해야 알더라구~?</p>
        </div>
      </Cut>

      {/* 16컷 — 후훗 */}
      <Cut num={16} className="gs-wt-text-cut gs-wt-impact gs-wt-join-y">
        <p className="gs-wt-script">후훗♡</p>
        <p className="gs-wt-answer">이거 말고도 할 얘기가<br /><b>엄청 많다구~<i className="gs-emo">(¬‿¬)✨</i></b></p>
      </Cut>

      {/* 17컷 — 복채 */}
      <Cut num={17} className="gs-wt-photo-cut">
        <Balloon tail="c">그래서~<br /><b>복채는 준비했어~?♡</b></Balloon>
        <CutPhoto src={ASSET.page17} alt="의자에 앉아 내려다보는 유이쨩" />
      </Cut>

      {/* 18컷 — 잠깐 (스탑 손동작) */}
      <Cut num={18} className="gs-wt-photo-cut">
        <Balloon tail="c">잠깐♡<br /><b>무슨 생각해~?☆</b></Balloon>
        <CutPhoto src={ASSET.page18} alt="손바닥을 내밀어 멈추라는 유이쨩" />
      </Cut>

      {/* 19~21컷 — 피날레 빌드업 (한 흐름으로) */}
      <Cut num={"19~21"} className="gs-wt-text-cut gs-wt-impact gs-wt-finale">
        <h2 className="gs-wt-title gs-wt-prose">설마~<br />다른 운세 알려주는 곳이랑<br /><em>똑같다고 생각한 건 아니지~?</em></h2>
        <p className="gs-wt-stupid gs-wt-prose">스투핏~!!</p>
        <h2 className="gs-wt-title gs-wt-prose">유이쨩 사주는♡</h2>
        <p className="gs-wt-answer gs-wt-prose">네 인생의 흐름을<br /><b>전부 알려준다구~</b></p>
        <h2 className="gs-wt-title gs-wt-prose">너가 보게 될<br /><em>마지막 사주</em></h2>
        <p className="gs-wt-destiny gs-wt-prose">운명을 바꿀 기회</p>
      </Cut>

      {/* 22컷 — 연애 패턴 · 집착 (실데이터) */}
      <Cut num={22} className="gs-card gs-wt-data">
        <SectionHead kicker="LOVE &amp; OBSESSION" title="연애 패턴 · 집착" />
        <p className="gs-body">{char.couple}</p>
        <div className="gs-kv">
          <span className="gs-kv-key">반복 포인트</span>
          <p className="gs-kv-val"><PartialBlur text={relationTrap} /></p>
        </div>
        <div className="gs-kv">
          <span className="gs-kv-key">귀인 타입 · {gi.t}</span>
          <p className="gs-kv-val"><PartialBlur text={gi.d} /></p>
        </div>
      </Cut>

      {/* 23컷 — 인간관계 · 호구 패턴 (실데이터) */}
      <Cut num={23} className="gs-card gs-wt-data">
        <SectionHead kicker="RELATIONSHIP FILTER" title="인간관계 · 호구 패턴, 가짜 인연까지" />
        <div className="gs-kv">
          <span className="gs-kv-key">네가 약해지는 순간</span>
          <p className="gs-kv-val"><PartialBlur text={`${char.weak}. 컨디션이 흔들리는 날엔 판단도 같이 흔들려.`} /></p>
        </div>
        <p className="gs-body">좋은 사람으로 남으려다 네 기준을 늦게 말하면, <Blur>맞지 않는 인연이 오래 눌러앉기 쉬워.</Blur></p>
        <p className="gs-wt-fake" aria-hidden="true">FAKE OUT</p>
      </Cut>

      {/* 24컷 — 행운 타이밍 · 성공 시기 (실데이터) */}
      <Cut num={24} className="gs-card gs-wt-data">
        <SectionHead kicker="LUCKY TIMING" title="행운 타이밍 · 성공 시기" />
        <div className="gs-flow">
          {daeunView.map((d) => (
            <div key={d.age} className="gs-flow-card">
              <span className="gs-flow-age">{d.age}~{d.end}세</span>
              <strong className="gs-flow-gz">{d.gz}</strong>
              <p><PartialBlur text={d.txt} /></p>
            </div>
          ))}
        </div>
        <div className="gs-kv">
          <span className="gs-kv-key">오늘부터 한 가지</span>
          <p className="gs-kv-val"><PartialBlur text={`${luckyAction}부터 시작하면 흐름을 네 편으로 돌리기 좋아.`} /></p>
        </div>
      </Cut>

      {/* 25컷 — 재물 흐름 (실데이터) */}
      <Cut num={25} className="gs-card gs-wt-data">
        <SectionHead kicker="MONEY FLOW" title={`재물 흐름 · ${moneyType}`} />
        <p className="gs-body">돈 감각이 없는 타입은 아니야. <b><PartialBlur text={`${vs.g} 기운이 강한 날엔 기분 따라 새는 돈만 조심☆`} /></b></p>
        <div className="gs-kv">
          <span className="gs-kv-key">행운 아이템</span>
          <p className="gs-kv-val"><PartialBlur text={vs.yd} /></p>
        </div>
        <div className="gs-years">
          {yearView.map((y) => (
            <div key={y.year} className="gs-year-card">
              <span className="gs-year-num">{y.year}</span>
              <strong className="gs-year-grade">{y.grade}</strong>
              <p><PartialBlur text={y.desc} /></p>
            </div>
          ))}
        </div>
        <p className="gs-sub-label">잘 맞는 분야</p>
        <div className="gs-chips">
          {char.job.map((j) => <span key={j} className="gs-chip gold">{j}</span>)}
        </div>
      </Cut>

      {/* 26컷 — CTA */}
      <Cut num={26} className="gs-wt-photo-cut gs-wt-cta">
        <Balloon tail="c">여기까지 봤으면<br /><b>느낌 왔잖아~?<i className="gs-emo">(¬‿¬)♡</i></b><br /><small>근데 이건 겉만 본 거야☆</small></Balloon>
        <CutPhoto src={ASSET.page02b} alt="활짝 웃으며 손을 흔드는 유이쨩" />
        <div className="gs-wt-cta-body">
          <h2 className="gs-wt-title">너 사주 속까지<br /><em>싹 다 뜯어봐주는 곳</em>이 있어♡</h2>
          <div className="gs-chips gs-wt-center">
            <span className="gs-chip">연애♡</span>
            <span className="gs-chip">진로♡</span>
            <span className="gs-chip">인간관계♡</span>
            <span className="gs-chip">돈♡</span>
          </div>
          <p className="gs-wt-line">전부 1:1로 분석해줘<i className="gs-emo">(°▽°)✨</i></p>
          <div className="gs-wt-reviews">
            <strong>해본 사람들? 다 소름 돋았다더라~ <i className="gs-emo">Σ(°△°)💦</i></strong>
            <span>“내 얘기 그대로야”</span>
            <span>“왜 진작 안 했지?”</span>
          </div>
          <p className="gs-wt-limit">근데 아무나 못 해☆<br /><b>딱 15명만 가능하거든~<i className="gs-emo">(&gt;_&lt;)✋</i></b></p>
          <p className="gs-wt-line">읽으면서 찔렸잖아~?<br /><b>그게 지금 너한테 가장 필요한 거야♡</b></p>
          <button className="gs-cta" onClick={openSheet}>👉 지금 바로 신청하기</button>
          <p className="gs-wt-nudge">안 하면~? 또 같은 하루 반복이야☆<br /><b>나라면 안 참는데~?<i className="gs-emo">(¬‿¬)✨</i></b></p>
        </div>
      </Cut>
    </main>
  );
}

/* ===== 하단 고정바 ===== */
function StickyBar({ applied, openSheet }) {
  return (
    <div className="gs-sticky" role="region" aria-label="스코메 신청">
      <button className="gs-sticky-btn" onClick={openSheet}>
        {applied ? "신청 완료 ♡" : "지금 바로 신청하기"}
      </button>
    </div>
  );
}

/* ===== 바텀시트: 가격 3단계 + 신청 폼 ===== */
function ApplySheet({ name, email, ilju, applied, onApplied, close }) {
  const [apply, setApply] = useState({ name: name || "", contact: "", insta: "" });
  const [state, setState] = useState(applied ? "done" : "idle");
  const [error, setError] = useState("");

  const submit = async () => {
    setError("");
    if (!apply.name.trim()) return setError("이름을 입력해 주세요.");
    if (!apply.contact.trim()) return setError("연락처(전화번호 또는 카카오톡 ID)를 입력해 주세요.");
    setState("sending");
    try {
      const r = await postToWebhook({
        type: "scome_apply",
        tier: "allin_free_launch",
        name: apply.name.trim(),
        contact: apply.contact.trim(),
        instagram: apply.insta.trim(),
        email,
        ilju: ilju || null,
        submittedAt: new Date().toISOString(),
      });
      if (!r.ok) throw new Error();
      setState("done");
      onApplied();
    } catch {
      setState("idle");
      setError("신청 전송에 실패했어요. 잠시 후 다시 시도해 주세요.");
    }
  };

  return (
    <div className="gs-sheet-overlay" onClick={close}>
      <div className="gs-sheet" role="dialog" aria-modal="true" aria-label="스코메 신청" onClick={(e) => e.stopPropagation()}>
        <button className="gs-sheet-close" onClick={close} aria-label="닫기">✕</button>

        {state === "done" ? (
          <div className="gs-sheet-done">
            <h3 className="gs-apply-title">신청 완료 ♡</h3>
            <p className="gs-apply-sub">
              담당 코치가 1~2일 안에 연락드려요.
              <br />그 사이에 <b>@ieumnaru</b> 팔로우하고 기다려 줘~☆
            </p>
            <button className="gs-cta" onClick={close}>닫기</button>
          </div>
        ) : (
          <>
            <p className="gs-eyebrow">오픈 기념 이벤트</p>
            <h3 className="gs-apply-title">스코메(3코어매직)</h3>
            <p className="gs-apply-sub">에니어그램 기반, 내 마음의 코어 3개를 찾는 인지심리 코칭이에요.</p>

            <div className="gs-tiers">
              {TIERS.map((t) => (
                <div key={t.id} className={`gs-tier ${t.best ? "best" : ""}`}>
                  <div className="gs-tier-head">
                    <b>{t.name}</b>
                    {t.best ? (
                      <span className="gs-tier-price"><s>{won(t.price)}</s> <em>오늘 0원</em></span>
                    ) : (
                      <span className="gs-tier-price"><s>{won(t.price)}</s></span>
                    )}
                  </div>
                  <p className="gs-tier-desc">{t.desc}</p>
                  {t.best && <span className="gs-tier-badge">유이쨩 픽 ☆</span>}
                </div>
              ))}
            </div>
            <p className="gs-free-note">
              지금 무료로 신청해도 <b>올인원 구성을 빠짐없이 전부</b> 받아요.
              <br />오픈 기념 한정이라, 끝나면 정가로 돌아가요!
            </p>

            <label className="gs-label">
              이름
              <input className="gs-input" value={apply.name} onChange={(e) => setApply((a) => ({ ...a, name: e.target.value }))} />
            </label>
            <label className="gs-label">
              연락처 (전화번호 또는 카카오톡 ID)
              <input className="gs-input" value={apply.contact} onChange={(e) => setApply((a) => ({ ...a, contact: e.target.value }))} placeholder="010-0000-0000" />
            </label>
            <label className="gs-label">
              인스타그램 ID (선택)
              <input className="gs-input" value={apply.insta} onChange={(e) => setApply((a) => ({ ...a, insta: e.target.value }))} placeholder="@" />
            </label>

            {error && <p className="gs-error" role="alert">{error}</p>}

            <button className="gs-cta" onClick={submit} disabled={state === "sending"}>
              {state === "sending" ? "신청하는 중…" : "0원으로 전부 받기 ☆"}
            </button>
            <p className="gs-fineprint">신청 정보는 코칭 상담 연락 용도로만 사용해요.</p>
          </>
        )}
      </div>
    </div>
  );
}

/* ===== 스타일 — 심야 점집 테마 ===== */
function StyleTag() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&display=swap');
      @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css');

      @font-face {
        font-family: 'yg-jalnan';
        src: url('https://fastly.jsdelivr.net/gh/projectnoonnu/noonfonts_four@1.2/JalnanOTF00.woff') format('woff');
        font-weight: normal;
        font-style: normal;
        font-display: swap;
      }

      :root {
        --bg: #150A12;            /* 딥 플럼 블랙 (영상 밤하늘) */
        --card: #241226;          /* 카드 배경 */
        --line: #4A2A45;          /* 카드 테두리 */
        --text: #FFEFE0;          /* 촛불빛 크림 */
        --muted: #C9A3B8;
        --pink: #FF4D9D;          /* 네온 핑크 */
        --deep: #E0007A;
        --gold: #F0B450;          /* 촛불 골드 */
        --ink: #1A0D17;
      }
      .gs-root {
        min-height: 100vh;
        background:
          radial-gradient(1.5px 1.5px at 18% 12%, rgba(240,180,80,.9), transparent),
          radial-gradient(1px 1px at 72% 8%, rgba(255,255,255,.7), transparent),
          radial-gradient(1.5px 1.5px at 88% 32%, rgba(240,180,80,.8), transparent),
          radial-gradient(1px 1px at 32% 44%, rgba(255,200,120,.6), transparent),
          radial-gradient(1.5px 1.5px at 12% 72%, rgba(240,180,80,.7), transparent),
          radial-gradient(1px 1px at 64% 86%, rgba(255,255,255,.5), transparent),
          radial-gradient(circle at 50% 0%, rgba(224,0,122,.16), transparent 55%),
          var(--bg);
        color: var(--text);
        font-family: 'Pretendard Variable', 'Noto Sans KR', sans-serif;
        display: flex; flex-direction: column; align-items: center;
      }
      html.gs-form-locked,
      body.gs-form-locked {
        width: 100%;
        height: 100%;
        height: 100dvh;
        overflow: hidden;
        overscroll-behavior: none;
      }
      body.gs-form-locked #root {
        width: 100%;
        height: 100%;
        height: 100dvh;
        min-height: 0;
        overflow: hidden;
      }
      .gs-root-form {
        width: 100%;
        height: 100%;
        height: 100dvh;
        min-height: 0;
        overflow: hidden;
      }
      .gs-page { width: 100%; max-width: 480px; padding: 26px 18px 40px; }
      .gs-page-pad { padding-bottom: 120px; }
      .gs-form-page {
        position: relative;
        width: 100%;
        height: 100%;
        height: 100dvh;
        min-height: 0;
        padding: 0;
        overflow: hidden;
      }

      /* hero */
      .gs-hero {
        position: relative;
        width: 100%;
        height: 100%;
        height: 100dvh;
        min-height: 0;
        margin: 0;
        overflow: hidden;
        text-align: center;
        background: #0C050A;
      }
      .gs-hero::after {
        content: '';
        position: absolute;
        inset: 0;
        z-index: 1;
        pointer-events: none;
        background:
          linear-gradient(180deg, rgba(10,3,8,.26) 0%, transparent 25%),
          linear-gradient(180deg, transparent 48%, rgba(10,3,8,.38) 70%, #150A12 100%),
          linear-gradient(90deg, rgba(10,3,8,.12), transparent 25% 75%, rgba(10,3,8,.12));
      }
      .gs-hero-copy {
        position: absolute;
        z-index: 3;
        top: max(34px, calc(env(safe-area-inset-top, 0px) + 22px));
        right: 18px;
        left: 18px;
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      .gs-eyebrow {
        display: inline-block; margin: 0 0 8px; padding: 4px 12px;
        background: rgba(21,10,18,.54); color: #FFD98D;
        border: 1px solid rgba(240,180,80,.58);
        font-size: 12px; font-weight: 700; border-radius: 999px; letter-spacing: .06em;
        backdrop-filter: blur(8px);
      }
      .gs-title {
        font-family: 'yg-jalnan', 'Pretendard Variable', sans-serif;
        font-size: clamp(46px, 13.5vw, 62px); line-height: 1.05;
        margin: 6px 0 10px; color: #FFF7EE;
        text-shadow: 0 3px 4px rgba(0,0,0,.7), 0 0 22px rgba(255,77,157,.72), 0 0 50px rgba(255,77,157,.4);
      }
      .gs-title-pop { color: var(--pink); }
      .gs-sub {
        padding: 5px 12px;
        border-radius: 999px;
        color: #FFF4F9;
        font-size: 14px;
        font-weight: 700;
        line-height: 1.5;
        background: rgba(21,10,18,.48);
        text-shadow: 0 1px 8px rgba(0,0,0,.8);
        backdrop-filter: blur(8px);
      }

      .gs-hero-video-wrap { position: absolute; inset: 0; }
      .gs-hero-video {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: center center;
        display: block;
        transition: filter .45s ease, transform .45s ease;
      }
      /* 입력 단계: 상단 카피 숨기고 배경을 흐리게 */
      .gs-hero-dim .gs-hero-video { filter: blur(7px) brightness(.55); transform: scale(1.06); }
      .gs-hero-copy { transition: opacity .35s ease; }
      .gs-hero-dim .gs-hero-copy { opacity: 0; pointer-events: none; }
      .gs-hero-glow {
        position: absolute; inset: 0; pointer-events: none;
        box-shadow: inset 0 0 80px rgba(240,180,80,.12);
        animation: gs-flicker 3.4s ease-in-out infinite;
      }
      @keyframes gs-flicker {
        0%, 100% { opacity: .75; } 42% { opacity: 1; } 58% { opacity: .65; } 71% { opacity: .95; }
      }
      .gs-hero-fallback {
        aspect-ratio: 9 / 16; max-height: 50vh; width: 100%;
        border: 2px dashed rgba(255,77,157,.5); border-radius: 20px;
        display: flex; flex-direction: column; gap: 6px; align-items: center; justify-content: center;
        color: var(--pink); font-size: 14px; background: rgba(255,77,157,.06);
      }
      .gs-hero-fallback small { color: var(--muted); font-size: 11px; }

      /* card */
      .gs-card {
        background: var(--card); border: 1px solid var(--line); border-radius: 20px;
        box-shadow: 0 0 24px rgba(224,0,122,.14);
        padding: 22px 18px; display: flex; flex-direction: column; gap: 12px;
      }
      .gs-label { display: flex; flex-direction: column; gap: 6px; font-size: 13px; font-weight: 700; color: var(--text); }
      .gs-input {
        font: 600 16px 'Pretendard Variable', 'Noto Sans KR', sans-serif;
        padding: 13px 15px; border: 1.5px solid rgba(255,77,157,.26); border-radius: 14px;
        background: rgba(20,9,18,.85); color: var(--text); caret-color: var(--pink);
        transition: border-color .15s ease, box-shadow .15s ease;
      }
      .gs-input::placeholder { color: #7E5870; font-weight: 500; }
      .gs-input:focus-visible {
        outline: none; border-color: var(--pink);
        box-shadow: 0 0 0 3px rgba(255,77,157,.2), 0 0 16px rgba(255,77,157,.3);
      }
      .gs-toggle { display: flex; gap: 8px; }
      .gs-toggle-btn {
        flex: 1; padding: 12px 0; font: 700 15px 'Pretendard Variable', 'Noto Sans KR', sans-serif;
        border: 1.5px solid rgba(255,77,157,.22); border-radius: 999px;
        background: rgba(20,9,18,.85); color: var(--muted); cursor: pointer;
        transition: border-color .15s ease, color .15s ease, box-shadow .15s ease, transform .1s ease;
      }
      .gs-toggle-btn:not(.on):hover { border-color: rgba(255,77,157,.55); color: var(--text); }
      .gs-toggle-btn:active { transform: scale(.97); }
      .gs-toggle-btn.on {
        background: linear-gradient(120deg, var(--pink), var(--deep)); color: #fff; border-color: var(--pink);
        box-shadow: 0 0 16px rgba(255,77,157,.55);
      }
      .gs-toggle-btn:focus-visible { outline: 2px solid var(--gold); outline-offset: 2px; }
      .gs-time-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 7px; }
      .gs-time-cell {
        display: flex; flex-direction: column; align-items: center; gap: 1px;
        padding: 9px 2px; border: 1.5px solid rgba(255,77,157,.18); border-radius: 13px;
        background: rgba(20,9,18,.85); color: var(--muted); cursor: pointer;
        transition: border-color .15s ease, box-shadow .15s ease, transform .1s ease;
      }
      .gs-time-cell:not(.on):hover { border-color: rgba(255,77,157,.5); }
      .gs-time-cell:active { transform: scale(.96); }
      .gs-time-cell b { font: 700 13.5px 'Pretendard Variable', 'Noto Sans KR', sans-serif; color: var(--text); }
      .gs-time-cell small { font-size: 10px; }
      .gs-time-cell.on {
        background: linear-gradient(120deg, var(--pink), var(--deep));
        border-color: var(--pink); box-shadow: 0 0 14px rgba(255,77,157,.55);
      }
      .gs-time-cell.on b, .gs-time-cell.on small { color: #fff; }
      .gs-time-cell:focus-visible { outline: 2px solid var(--gold); outline-offset: 2px; }
      .gs-unknown-btn { width: 100%; flex: none; }
      .gs-pick-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
      .gs-pick-grid .gs-toggle-btn { padding: 10px 0; font-size: 13.5px; }
      .gs-duration-grid { grid-template-columns: repeat(2, 1fr); }
      .gs-hint { font-size: 12px; color: var(--gold); margin-top: 6px; }
      .gs-agree { display: flex; gap: 8px; font-size: 12px; line-height: 1.5; align-items: flex-start; color: var(--muted); }
      .gs-agree input { margin-top: 2px; accent-color: var(--deep); }
      .gs-error { font-size: 13px; font-weight: 700; color: #FF9DBE; background: rgba(224,0,122,.16); border: 1px solid rgba(255,77,157,.4); border-radius: 10px; padding: 8px 12px; }
      .gs-cta {
        font: 700 17px 'Pretendard Variable', 'Noto Sans KR', sans-serif;
        padding: 15px 0; border: 0; border-radius: 999px;
        background: linear-gradient(120deg, var(--pink), var(--deep));
        color: #fff; cursor: pointer;
        box-shadow: 0 0 18px rgba(255,77,157,.55), 0 0 44px rgba(224,0,122,.25);
        transition: transform .12s ease;
      }
      .gs-cta:not(:disabled):active { transform: scale(.985); }
      .gs-cta:disabled { opacity: .6; cursor: wait; }
      .gs-cta:focus-visible { outline: 2px solid var(--gold); outline-offset: 3px; }
      .gs-fineprint { font-size: 11px; color: #9A7186; text-align: center; }

      /* chat form */
      .gs-chat {
        position: absolute;
        z-index: 4;
        right: 14px;
        bottom: max(12px, env(safe-area-inset-bottom, 0px));
        left: 14px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        max-height: calc(100dvh - 220px);
      }
      .gs-bubble {
        font: 600 15.5px/1.5 'Pretendard Variable', 'Noto Sans KR', sans-serif;
        letter-spacing: -.01em;
        background: var(--card); border: 1px solid var(--line); border-radius: 16px;
        padding: 10px 14px; max-width: 92%; color: var(--text);
      }
      .gs-bubble.yui {
        align-self: flex-start; border-bottom-left-radius: 4px;
        background: rgba(224,0,122,.18); border-color: rgba(255,77,157,.45);
        box-shadow: 0 0 14px rgba(224,0,122,.18);
      }
      /* 입력 폼 대화: 메신저식 아바타 + 웹툰풍 흰 말풍선 */
      .gs-chat-msg {
        display: flex; gap: 10px; align-items: flex-start;
        max-width: 94%; animation: gs-step-in .26s ease both;
      }
      .gs-chat-avatar {
        flex: none; width: 46px; height: 46px; border-radius: 50%;
        object-fit: cover; object-position: 50% 22%;
        border: 2px solid var(--pink);
        box-shadow: 0 0 12px rgba(255,77,157,.55), 0 2px 6px rgba(0,0,0,.4);
        background: #221019;
      }
      .gs-chat-body { display: flex; flex-direction: column; gap: 4px; min-width: 0; align-items: flex-start; }
      .gs-chat .gs-bubble-who {
        font: 700 12px 'Pretendard Variable', 'Noto Sans KR', sans-serif;
        color: #FFD98D; margin: 0; padding-left: 2px;
        text-shadow: 0 1px 6px rgba(0,0,0,.8);
      }
      .gs-chat .gs-bubble.yui {
        position: relative;
        font: 400 16.5px/1.5 'Pretendard Variable', 'Noto Sans KR', sans-serif; letter-spacing: 0;
        background: #FFFDF7; border: 2px solid #221019; color: #221019;
        border-radius: 16px; border-top-left-radius: 4px;
        padding: 10px 15px 11px; max-width: 100%;
        box-shadow: 4px 5px 0 rgba(224,0,122,.4);
      }
      .gs-bubble.friend { align-self: flex-end; border-bottom-right-radius: 4px; }
      .gs-bubble.me {
        align-self: flex-end; border-bottom-right-radius: 4px;
        background: linear-gradient(120deg, var(--pink), var(--deep)); color: #fff; border: 0;
        box-shadow: 0 0 14px rgba(255,77,157,.4);
      }
      .gs-bubble-who { display: block; font: 700 11px 'Pretendard Variable', 'Noto Sans KR', sans-serif; color: var(--gold); margin-bottom: 2px; }
      .gs-step-panel {
        background: linear-gradient(165deg, rgba(46,20,46,.94), rgba(24,11,24,.96));
        border: 1px solid rgba(255,77,157,.35); border-radius: 22px;
        box-shadow: 0 12px 32px rgba(0,0,0,.45), 0 0 24px rgba(224,0,122,.18),
                    inset 0 1px 0 rgba(255,210,120,.08);
        padding: 15px 14px;
        display: flex; flex-direction: column; gap: 10px;
        backdrop-filter: blur(14px);
        overflow-y: auto; min-height: 0;
        animation: gs-step-in .26s ease both;
      }
      @keyframes gs-step-in {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: none; }
      }
      .gs-q-chip {
        align-self: flex-start;
        font: 700 11px 'Pretendard Variable', 'Noto Sans KR', sans-serif; letter-spacing: .05em;
        color: var(--gold); background: rgba(255,210,120,.1);
        border: 1px solid rgba(255,210,120,.32); border-radius: 999px;
        padding: 4px 11px;
      }
      .gs-date-row { display: flex; gap: 8px; }
      .gs-date-cell { flex: 1; display: flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 700; color: var(--gold); }
      .gs-date-cell .gs-input { width: 100%; min-width: 0; text-align: center; }
      .gs-step-nav { display: flex; gap: 8px; margin-top: 2px; }
      .gs-back {
        font: 700 14px 'Pretendard Variable', 'Noto Sans KR', sans-serif; padding: 0 16px;
        border: 1.5px solid rgba(255,77,157,.22); border-radius: 999px;
        background: transparent; color: var(--muted); cursor: pointer;
        transition: border-color .15s ease, color .15s ease;
      }
      .gs-back:hover { border-color: rgba(255,77,157,.5); color: var(--text); }
      .gs-back:focus-visible { outline: 2px solid var(--pink); outline-offset: 2px; }
      .gs-cta-grow { flex: 1; }
      .gs-progress { display: flex; align-items: center; gap: 8px; padding: 0 4px; }
      .gs-progress-track {
        flex: 1; height: 5px; border-radius: 999px; overflow: hidden;
        background: rgba(255,255,255,.13);
      }
      .gs-progress-track i {
        display: block; height: 100%; border-radius: 999px;
        background: linear-gradient(90deg, var(--pink), var(--gold));
        box-shadow: 0 0 8px rgba(255,77,157,.7);
        transition: width .35s ease;
      }
      .gs-progress-num {
        font: 700 11.5px 'Pretendard Variable', 'Noto Sans KR', sans-serif;
        color: var(--gold); min-width: 26px; text-align: right;
      }

      /* ===== 온페이지 풀이 (웹툰 26컷 — 경계선 없는 연속 스크롤) ===== */
      .gs-result { --muted: #D9B6C9; display: flex; flex-direction: column; gap: 0; padding: 0 0 110px; word-break: keep-all; }

      /* 웹툰식 고대비 말풍선: 흰 바탕 + 검정 테두리 + 진한 글자 */
      .gs-result .gs-bubble,
      .gs-result .gs-bubble.yui,
      .gs-result .gs-bubble.friend {
        font: 400 17px/1.5 'Pretendard Variable', 'Noto Sans KR', sans-serif; letter-spacing: 0;
        padding: 13px 18px; max-width: 88%;
        background: #FFFDF7; border: 2px solid #221019; color: #221019;
        box-shadow: 5px 6px 0 rgba(224,0,122,.3);
      }
      .gs-result .gs-bubble b { color: var(--deep); }
      .gs-result .gs-bubble-who { color: var(--deep); }
      .gs-result .gs-bubble small { color: #6E4A5D; }

      /* 웹툰식 타원 말풍선 (이미지 상단에 걸침) */
      .gs-balloon {
        position: relative; z-index: 5;
        width: fit-content; max-width: 84%;
        margin: 30px auto -38px;
        background: #FFFDF7; border: 2.5px solid #221019;
        border-radius: 50%;
        padding: 30px 40px 32px;
        text-align: center;
        filter: drop-shadow(0 8px 16px rgba(0,0,0,.4));
      }
      .gs-balloon p { margin: 0; font: 700 18.5px/1.6 'Pretendard Variable', 'Noto Sans KR', sans-serif; color: #221019; }
      .gs-balloon b { color: var(--deep); }
      .gs-balloon small { display: block; font-size: 14.5px; font-weight: 500; color: #6E4A5D; }
      .gs-balloon::before, .gs-balloon::after { content: ''; position: absolute; border-style: solid; border-color: transparent; }
      .gs-balloon::before { border-width: 20px 11px 0; border-top-color: #221019; bottom: -17px; }
      .gs-balloon::after  { border-width: 14px 7px 0; border-top-color: #FFFDF7; bottom: -8px; }
      .gs-balloon-l::before { left: 30%; transform: rotate(12deg); }
      .gs-balloon-l::after  { left: calc(30% + 4px); transform: rotate(12deg); }
      .gs-balloon-c::before { left: 50%; margin-left: -11px; }
      .gs-balloon-c::after  { left: 50%; margin-left: -7px; }
      .gs-balloon-r::before { right: 30%; transform: rotate(-12deg); }
      .gs-balloon-r::after  { right: calc(30% + 4px); transform: rotate(-12deg); }
      /* 위로 향하는 꼬리 (아래쪽 말풍선용) */
      .gs-balloon-up::before {
        top: -17px; bottom: auto; left: 32%;
        border-width: 0 11px 20px; border-bottom-color: #221019; border-top-color: transparent;
        transform: rotate(10deg);
      }
      .gs-balloon-up::after {
        top: -8px; bottom: auto; left: calc(32% + 4px);
        border-width: 0 7px 14px; border-bottom-color: #FFFDF7; border-top-color: transparent;
        transform: rotate(10deg);
      }
      /* 위로 향하는 꼬리 — 오른쪽 변형 */
      .gs-balloon-upr::before {
        top: -17px; bottom: auto; right: 28%;
        border-width: 0 11px 20px; border-bottom-color: #221019; border-top-color: transparent;
        transform: rotate(-10deg);
      }
      .gs-balloon-upr::after {
        top: -8px; bottom: auto; right: calc(28% + 4px);
        border-width: 0 7px 14px; border-bottom-color: #FFFDF7; border-top-color: transparent;
        transform: rotate(-10deg);
      }
      /* 이미지 위 임의 배치 */
      .gs-balloon-tl { position: absolute; z-index: 5; top: 18px; left: 14px; margin: 0; max-width: 86%; padding: 20px 26px; }
      .gs-balloon-tl p { font-size: 16px; white-space: nowrap; }
      .gs-balloon-tr { position: absolute; z-index: 5; top: 18px; right: 14px; margin: 0; max-width: 72%; padding: 22px 28px; }
      .gs-balloon-br { position: absolute; z-index: 5; right: 14px; bottom: 150px; margin: 0; max-width: 66%; padding: 24px 30px; }
      .gs-balloon-bl { position: absolute; z-index: 5; left: 14px; bottom: 26px; margin: 0; max-width: 74%; padding: 24px 28px; }
      .gs-balloon-bc { position: absolute; z-index: 5; left: 50%; transform: translateX(-50%); bottom: 26px; margin: 0; max-width: 82%; padding: 24px 30px; }

      .gs-reveal { opacity: 0; transform: translateY(16px); transition: opacity .5s ease, transform .55s cubic-bezier(.2,.75,.2,1); }
      .gs-reveal.shown { opacity: 1; transform: none; }

      .gs-sec-head { display: flex; flex-direction: column; gap: 5px; margin-bottom: 4px; }
      .gs-sec-kicker { font: 700 12.5px 'Pretendard Variable', 'Noto Sans KR', sans-serif; letter-spacing: .14em; color: var(--gold); }
      .gs-sec-title { font: 800 20px/1.4 'Pretendard Variable', 'Noto Sans KR', sans-serif; margin: 0; color: #FFF7EE; letter-spacing: -.01em; }

      /* 핵심구 블러 — 신청 전엔 가려서 호기심 유발 */
      .gs-blur {
        filter: blur(5px); -webkit-user-select: none; user-select: none;
        pointer-events: none; opacity: .9; white-space: normal;
      }
      .gs-body { font-size: 16px; line-height: 1.75; color: #FFEFE0; margin: 0; }
      .gs-body b { color: var(--gold); }
      .gs-sub-label { font: 700 13.5px 'Pretendard Variable', 'Noto Sans KR', sans-serif; color: var(--gold); margin: 6px 0 -2px; letter-spacing: .04em; }
      .gs-chips { display: flex; gap: 7px; flex-wrap: wrap; }
      .gs-chip { font-size: 14.5px; font-weight: 700; color: #FF7FB9; background: rgba(255,77,157,.16); border: 1px solid rgba(255,77,157,.45); border-radius: 999px; padding: 5px 13px; }

      /* 웹툰 컷 공통 */
      .gs-wt-cut { position: relative; }

      .gs-wt-photo-cut { overflow: hidden; background: #0C050A; }
      .gs-wt-photo { position: relative; }
      .gs-wt-img { width: 100%; display: block; }
      .gs-wt-shade {
        position: absolute; inset: 0; pointer-events: none;
        background: linear-gradient(180deg, rgba(12,5,10,.95) 0%, rgba(12,5,10,0) 16%, rgba(12,5,10,0) 46%, rgba(12,5,10,.62) 72%, rgba(12,5,10,.98) 97%);
      }
      .gs-wt-overlay {
        position: absolute; right: 14px; bottom: 14px; left: 14px;
        display: flex; flex-direction: column; gap: 10px; align-items: flex-start;
      }
      .gs-wt-overlay .gs-bubble b { color: var(--deep); }
      .gs-wt-overlay .gs-bubble small { display: block; font-size: 14px; }

      /* 커버 (1컷) */
      .gs-wt-cover .gs-wt-overlay { align-items: center; text-align: center; gap: 12px; }
      .gs-wt-eyebrow {
        margin: 0; padding: 5px 14px; border-radius: 999px;
        font: 700 12.5px 'Pretendard Variable', 'Noto Sans KR', sans-serif; letter-spacing: .04em;
        color: #FFD98D; background: rgba(21,10,18,.6); border: 1px solid rgba(240,180,80,.55);
        backdrop-filter: blur(8px);
      }
      .gs-wt-quote {
        margin: 0; font-family: 'yg-jalnan', 'Pretendard Variable', sans-serif; font-size: 21px; line-height: 1.45;
        color: #FFFCF5; text-shadow: 0 2px 14px rgba(0,0,0,.9);
      }

      /* 타이포 — 크고 또렷하게 (글로우 없는 솔리드, 이미지 위에서만 다크 섀도) */
      .gs-emo { font: 500 0.62em 'Pretendard Variable', 'Noto Sans KR', sans-serif; font-style: normal; letter-spacing: -.02em; opacity: .92; }
      .gs-wt-title {
        margin: 0; font: 400 clamp(23px, 6.8vw, 31px)/1.48 'yg-jalnan', 'Pretendard Variable', sans-serif;
        color: #FFFCF5;
        text-wrap: balance;
      }
      .gs-wt-title em { font-style: normal; color: #FF6FB0; }
      .gs-wt-overlay .gs-wt-title {
        text-shadow:
          -2px -2px 0 rgba(12,5,10,.9), 2px -2px 0 rgba(12,5,10,.9),
          -2px 2px 0 rgba(12,5,10,.9), 2px 2px 0 rgba(12,5,10,.9),
          0 4px 18px rgba(0,0,0,.9);
      }
      .gs-wt-script { margin: 0; font-family: 'yg-jalnan', 'Pretendard Variable', sans-serif; font-size: 26px; color: #FF8FC2; }
      .gs-wt-overlay .gs-wt-script {
        text-shadow:
          -1.5px -1.5px 0 rgba(12,5,10,.85), 1.5px -1.5px 0 rgba(12,5,10,.85),
          -1.5px 1.5px 0 rgba(12,5,10,.85), 1.5px 1.5px 0 rgba(12,5,10,.85),
          0 3px 12px rgba(0,0,0,.9);
      }
      .gs-wt-overlay .gs-wt-line {
        font-size: 19px; font-weight: 700; line-height: 1.8;
        text-shadow: 0 1px 8px rgba(0,0,0,.95), 0 0 3px rgba(0,0,0,.9);
      }
      /* 이미지 위 오버레이 — 가운데 정렬 + 크게 */
      .gs-wt-overlay-mid { align-items: center; text-align: center; left: 14px; right: 14px; }
      .gs-wt-overlay-mid .gs-wt-line { font-size: 23px; line-height: 1.7; }
      /* 이미지 위 오버레이 — 상단 + 가운데 정렬 */
      .gs-wt-overlay-top { top: 18px; bottom: auto; align-items: center; text-align: center; }
      .gs-wt-line { margin: 0; font-size: 16.5px; font-weight: 700; line-height: 1.75; color: #FFF3E6; }
      .gs-wt-line b { color: var(--gold); }
      .gs-wt-kicker { margin: 0; font: 700 12.5px 'Pretendard Variable', 'Noto Sans KR', sans-serif; letter-spacing: .2em; color: var(--gold); }
      .gs-wt-answer { margin: 0; font-family: 'yg-jalnan', 'Pretendard Variable', sans-serif; font-size: 20px; line-height: 1.55; color: #FFD3E8; }
      .gs-wt-answer b { color: #fff; }

      /* 텍스트 컷 — 경계선 없는 풀폭 밴드 (배경색으로만 구분) */
      .gs-wt-text-cut {
        background: var(--card);
        padding: 48px 22px; display: flex; flex-direction: column; gap: 16px;
        align-items: center; text-align: center;
      }
      .gs-wt-text-cut .gs-bubble { align-self: center; }
      /* 인트로 카피 (텍스트 전용) */
      .gs-wt-intro {
        gap: 14px;
        background:
          linear-gradient(180deg, #0C050A 0%, rgba(12,5,10,0) 130px),
          linear-gradient(0deg, #0C050A 0%, rgba(12,5,10,0) 130px),
          radial-gradient(circle at 50% 50%, rgba(255,77,157,.18), transparent 62%),
          linear-gradient(160deg, #2A1024, #170816);
      }
      .gs-wt-intro .gs-wt-quote { font-size: clamp(24px, 7vw, 30px); text-shadow: 0 2px 16px rgba(0,0,0,.5); }
      /* 인사 머리말 띠 (1컷 상단) */
      .gs-wt-greet-head {
        padding: 40px 22px 26px; text-align: center;
        background:
          radial-gradient(circle at 50% 0%, rgba(255,77,157,.2), transparent 60%),
          linear-gradient(180deg, #2A1024, #170816);
      }
      .gs-wt-greet-head .gs-wt-title { text-shadow: 0 2px 16px rgba(0,0,0,.5); }
      .gs-wt-impact {
        background:
          linear-gradient(180deg, #0C050A 0, rgba(12,5,10,0) 120px),
          linear-gradient(0deg, #0C050A 0, rgba(12,5,10,0) 120px),
          radial-gradient(circle at 50% 50%, rgba(255,77,157,.22), transparent 58%),
          linear-gradient(160deg, #31112A, #190818);
      }
      /* 위(레이스 자주색)·아래(사진 컷 검정 #0C050A)와 실제로 이어지도록 끝 색을 맞춤 */
      .gs-wt-join-y {
        background:
          radial-gradient(circle at 50% 48%, rgba(255,77,157,.2), transparent 64%),
          linear-gradient(180deg, #1B0A18 0%, #2A1024 42%, #160913 76%, #0C050A 100%);
      }

      /* 블랙 레이스 테두리 — 사각 프레임 레이스 이미지(투명 배경)를 border-image로
         가장자리는 밝은 로즈 톤으로 깔아 레이스 실루엣이 드러나게 */
      .gs-wt-lace {
        position: relative; padding: 20px 10px;
        border: 56px solid transparent;
        border-image: url('${import.meta.env.BASE_URL}assets/garusaju/lace.png') 244 272 264 272 round;
        background:
          linear-gradient(90deg, #63365A 0px, rgba(99,54,90,0) 120px),
          linear-gradient(-90deg, #63365A 0px, rgba(99,54,90,0) 120px),
          linear-gradient(180deg, #63365A 0px, rgba(99,54,90,0) 120px),
          linear-gradient(0deg, #63365A 0px, rgba(99,54,90,0) 120px),
          radial-gradient(circle at 50% 12%, rgba(255,77,157,.16), transparent 60%),
          linear-gradient(160deg, #2C1127, #1B0A18);
        background-origin: border-box;
      }
      .gs-wt-lace > * { position: relative; z-index: 1; }
      /* 위 이미지(어두운 하단)와 자연스럽게 이어지는 상단 그라데이션 */
      .gs-wt-lace-join {
        background:
          linear-gradient(180deg, #0C050A 0, rgba(12,5,10,0) 150px),
          linear-gradient(90deg, #63365A 0px, rgba(99,54,90,0) 120px),
          linear-gradient(-90deg, #63365A 0px, rgba(99,54,90,0) 120px),
          linear-gradient(180deg, #63365A 0px, rgba(99,54,90,0) 120px),
          linear-gradient(0deg, #63365A 0px, rgba(99,54,90,0) 120px),
          radial-gradient(circle at 50% 12%, rgba(255,77,157,.16), transparent 60%),
          linear-gradient(160deg, #2C1127, #1B0A18);
        background-origin: border-box;
      }
      .gs-wt-warning {
        background:
          radial-gradient(circle at 50% 0%, rgba(240,180,80,.18), transparent 55%),
          #20101C;
      }
      /* 위 이미지(어두운 하단)와 자연스럽게 이어지는 상단 그라데이션 */
      .gs-wt-join-top::before {
        content: ''; position: absolute; top: 0; left: 0; right: 0; height: 150px;
        background: linear-gradient(180deg, #0C050A, rgba(12,5,10,0));
        z-index: 1; pointer-events: none;
      }
      .gs-wt-finale { gap: 18px; padding-block: 54px; }
      .gs-wt-divider { width: 100%; text-align: center; color: var(--gold); font-size: 16px; opacity: .85; margin-block: 14px; text-shadow: 0 0 10px rgba(240,180,80,.6); }

      .gs-wt-checks { display: flex; flex-direction: column; gap: 7px; }
      .gs-wt-checks p { margin: 0; font: 700 16.5px 'Pretendard Variable', 'Noto Sans KR', sans-serif; color: #FFF3E6; }
      .gs-wt-punch { margin: 0; font-size: 16px; line-height: 1.75; color: #F1DBE7; }
      .gs-wt-punch b { color: #FF6FB0; font-size: 17.5px; }

      .gs-wt-sparkle { margin: 0; color: var(--gold); font-size: 18px; letter-spacing: 10px; text-shadow: 0 0 12px rgba(240,180,80,.6); }

      /* 삐빅 — 알약 박스 없이 텍스트 + 양옆 경고 이모지 (아래 ⚠ 타이틀과 통일) */
      .gs-wt-beep {
        margin: 0; display: inline-flex; align-items: center; gap: 10px;
        font: 800 clamp(19px, 5vw, 24px)/1.3 'Pretendard Variable', 'Noto Sans KR', sans-serif;
        letter-spacing: .02em; color: var(--gold);
        text-shadow: 0 0 14px rgba(240,180,80,.45);
      }
      .gs-wt-beep-warn { font-style: normal; font-size: 1em; line-height: 1; color: var(--gold); }
      /* REAL TALK 컷 — 흐릿한 테이프들이 대화 텍스트 뒤 배경으로 */
      .gs-wt-realtalk { overflow: hidden; justify-content: center; padding-block: 64px; }
      .gs-wt-realtalk .gs-wt-beep,
      .gs-wt-realtalk .gs-wt-title { position: relative; z-index: 2; }
      .gs-wt-tape-bg { position: absolute; inset: 0; z-index: 1; pointer-events: none; }
      .gs-wt-tape {
        position: absolute; left: -50px; right: -50px;
        text-align: center; white-space: nowrap;
        font-family: 'Pretendard Variable', 'Noto Sans KR', sans-serif; font-weight: 900; color: var(--ink);
        background: repeating-linear-gradient(45deg, var(--gold) 0 14px, #D89B3C 14px 28px);
      }
      .gs-wt-tape-ghost-big {
        top: 50%; transform: translateY(calc(-78% - 10px)) rotate(-7deg);
        padding: 24px 0; font-size: 26px; letter-spacing: 7px;
        opacity: .25; filter: blur(3px);
      }
      .gs-wt-tape-ghost-sm {
        top: 50%; transform: translateY(calc(40% + 50px)) rotate(6deg);
        padding: 6px 0; font-size: 11px; letter-spacing: 5px;
        opacity: .32; filter: blur(1.2px);
      }

      .gs-wt-title-sm { font: 800 clamp(19px, 5.2vw, 24px)/1.6 'Pretendard Variable', 'Noto Sans KR', sans-serif; }

      .gs-wt-problem-title {
        font: 800 clamp(17px, 4.6vw, 22px)/1.4 'Pretendard Variable', 'Noto Sans KR', sans-serif;
        white-space: nowrap;
      }
      .gs-wt-problem-title .gs-warn { font-style: normal; color: var(--gold); }

      .gs-wt-problem {
        width: 100%; text-align: center;
        display: flex; flex-direction: column; gap: 10px;
      }
      .gs-wt-problem strong { font-family: 'yg-jalnan', 'Pretendard Variable', sans-serif; font-size: 20px; color: #FF8FC2; }
      .gs-wt-problem p { margin: 0; font-size: 15.5px; line-height: 1.7; color: #FFF3E6; }
      .gs-wt-problem b { color: #FF8FC2; }
      .gs-wt-problem ul { margin: 0; padding-left: 4px; list-style: none; display: flex; flex-direction: column; gap: 6px; }
      .gs-wt-problem li { font: 700 15.5px 'Pretendard Variable', 'Noto Sans KR', sans-serif; color: #FFF3E6; }
      .gs-wt-chill { margin: 0; font-family: 'yg-jalnan', 'Pretendard Variable', sans-serif; font-size: 18px; line-height: 1.55; color: #FFD3E8; }
      .gs-wt-chill b { color: #fff; }

      .gs-wt-actions { display: flex; gap: 8px; width: 100%; }
      .gs-wt-actions span {
        flex: 1; min-width: 0; padding: 14px 9px; border-radius: 13px;
        background: #150812;
        font-size: 14.5px; line-height: 1.6; color: #F1DBE7;
      }
      .gs-wt-actions b { color: var(--gold); font-size: 16px; }
      .gs-wt-throw {
        margin: 0; padding: 14px 18px; border-radius: 13px;
        background: rgba(240,180,80,.13);
        font-size: 15.5px; line-height: 1.65; color: #FFEFE0;
      }
      .gs-wt-throw b { color: var(--gold); }
      .gs-wt-throw small { color: var(--muted); font-size: 13px; }

      .gs-wt-only {
        margin: 0; align-self: flex-end; padding: 7px 15px; border-radius: 999px;
        font-size: 14px; color: #FFF4F9; background: rgba(21,10,18,.66);
        border: 1px solid rgba(255,77,157,.45); backdrop-filter: blur(8px);
      }
      .gs-wt-only b { color: var(--gold); }

      .gs-wt-stupid { margin: 0; font: 400 30px 'yg-jalnan', 'Pretendard Variable', sans-serif; color: var(--pink); }
      .gs-wt-stupid small { display: block; font-size: 17px; font-weight: 500; color: var(--muted); margin-top: 2px; }

      .gs-wt-lifeline { display: flex; align-items: center; gap: 10px; width: 100%; }
      .gs-wt-lifeline span { font: 700 12.5px 'Pretendard Variable', 'Noto Sans KR', sans-serif; color: var(--gold); white-space: nowrap; }
      .gs-wt-lifeline i { flex: 1; height: 2px; background: linear-gradient(90deg, var(--gold), var(--pink)); box-shadow: 0 0 10px rgba(255,77,157,.6); }
      .gs-wt-destiny { margin: 0; font: 400 24px 'yg-jalnan', 'Pretendard Variable', sans-serif; color: var(--gold); }
      /* 긴 문장은 본문 폰트(Pretendard)로 — 두께 통일, 잘난체의 초등학생 느낌 완화 */
      .gs-wt-prose { font-family: 'Pretendard Variable', 'Noto Sans KR', sans-serif; font-weight: 800; letter-spacing: -.01em; line-height: 1.5; }

      /* 데이터 컷 — 풀폭 밴드 (배경색으로만 구분) */
      .gs-wt-data {
        border: 0; border-radius: 0; box-shadow: none;
        background: #1C0C18; padding: 40px 20px 44px; gap: 14px;
      }
      .gs-wt-chartdate { margin: -6px 0 2px; font-size: 13.5px; color: var(--muted); }
      .gs-wt-fake {
        margin: 2px 0 0; align-self: flex-end; padding: 4px 12px;
        border: 2px solid rgba(255,77,157,.65); border-radius: 8px; transform: rotate(-6deg);
        font: 900 13px 'Pretendard Variable', 'Noto Sans KR', sans-serif; letter-spacing: 2px; color: var(--pink); opacity: .85;
      }

      /* CTA 컷 */
      .gs-wt-cta-body {
        padding: 34px 20px 44px; display: flex; flex-direction: column; gap: 16px;
        align-items: center; text-align: center;
        background: linear-gradient(180deg, #0C050A, #2C0F26 40%, #190818);
      }
      .gs-wt-cta-body .gs-bubble { align-self: center; }
      .gs-wt-cta-body .gs-cta { width: 100%; font-size: 19px; padding-block: 17px; }
      .gs-wt-center { justify-content: center; }
      .gs-wt-reviews { display: flex; flex-direction: column; gap: 6px; }
      .gs-wt-reviews strong { font-size: 16px; color: var(--gold); }
      .gs-wt-reviews span { font-family: 'yg-jalnan', 'Pretendard Variable', sans-serif; font-size: 17px; color: #FFFCF5; }
      .gs-wt-limit { margin: 0; font-size: 16px; line-height: 1.7; color: #F1DBE7; }
      .gs-wt-limit b { color: #FF6FB0; font-size: 18px; }
      .gs-wt-nudge { margin: 0; font-size: 14px; line-height: 1.7; color: var(--muted); }
      .gs-wt-nudge b { color: var(--gold); }

      /* 명식 — 만세력 틀 + 갸루 네온 컬러 (글로우 한자 타일 + 운성/신살 줄) */
      .gs-myeongsik {
        display: flex; flex-direction: column; align-items: stretch; gap: 0;
        position: relative; overflow: hidden;
        padding: 46px 22px 48px;
        background:
          radial-gradient(circle at 50% 8%, rgba(255,77,157,.22), transparent 50%),
          radial-gradient(circle at 12% 60%, rgba(155,112,255,.12), transparent 45%),
          radial-gradient(circle at 88% 90%, rgba(82,255,216,.1), transparent 45%),
          #160913;
      }
      .gs-myeongsik::before {
        content: '命'; position: absolute; top: -34px; left: 50%; transform: translateX(-50%);
        font: 900 300px/1 'Pretendard Variable', 'Noto Sans KR', sans-serif; color: rgba(255,77,157,.07);
        pointer-events: none;
      }
      .gs-ms-head { position: relative; display: flex; flex-direction: column; align-items: center; gap: 7px; margin-bottom: 26px; text-align: center; }
      .gs-ms-kicker { font: 600 12px 'Pretendard Variable', 'Noto Sans KR', sans-serif; letter-spacing: 7px; text-indent: 7px; color: var(--pink); text-shadow: 0 0 12px rgba(255,77,157,.7); }
      .gs-ms-title { margin: 0; font: 400 28px/1.4 'yg-jalnan', 'Pretendard Variable', sans-serif; letter-spacing: 1px; color: #FFF4F9; text-shadow: 0 0 26px rgba(255,77,157,.65); }
      .gs-ms-date { margin: 0; font: 600 14.5px 'Pretendard Variable', 'Noto Sans KR', sans-serif; letter-spacing: 1px; color: #E3A8C6; }
      .gs-ms-deco { margin-top: 4px; font-size: 12px; letter-spacing: 4px; color: var(--pink); text-shadow: 0 0 10px rgba(255,77,157,.8); }

      .gs-ms-grid { position: relative; display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
      .gs-ms-col { min-width: 0; display: flex; flex-direction: column; align-items: center; gap: 8px; }
      .gs-ms-god { font: 700 12.5px 'Pretendard Variable', 'Noto Sans KR', sans-serif; color: #FFD98D; white-space: nowrap; letter-spacing: .03em; text-shadow: 0 0 8px rgba(240,180,80,.4); }
      .gs-ms-god.me { color: #FF8FC2; text-shadow: 0 0 10px rgba(255,77,157,.7); }
      .gs-ms-tile {
        width: 100%; aspect-ratio: 1; display: flex; align-items: center; justify-content: center;
        border-radius: 12px; border: 1px solid;
        font: 800 clamp(34px, 11vw, 46px) 'Pretendard Variable', 'Noto Sans KR', sans-serif; color: #1A0613;
        text-shadow: 0 1px 0 rgba(255,255,255,.35);
      }
      .gs-ms-tile.el-wood  { background: linear-gradient(150deg, #8CFFE6, #17C29B 85%); border-color: #52FFD8; box-shadow: 0 0 16px rgba(82,255,216,.4), inset 0 0 14px rgba(255,255,255,.18); }
      .gs-ms-tile.el-fire  { background: linear-gradient(150deg, #FF7CB8, #E0007A 85%); border-color: #FF4D9D; box-shadow: 0 0 16px rgba(255,77,157,.55), inset 0 0 14px rgba(255,255,255,.18); }
      .gs-ms-tile.el-earth { background: linear-gradient(150deg, #FFECB0, #E0A93E 85%); border-color: #F0B450; box-shadow: 0 0 16px rgba(240,180,80,.45), inset 0 0 14px rgba(255,255,255,.2); }
      .gs-ms-tile.el-metal { background: linear-gradient(150deg, #FFFFFF, #AEBBD0 85%); border-color: #DCE7F5; box-shadow: 0 0 16px rgba(220,231,245,.4), inset 0 0 14px rgba(255,255,255,.25); }
      .gs-ms-tile.el-water { background: linear-gradient(150deg, #C9AEFF, #7B3FF2 85%); border-color: #9B70FF; box-shadow: 0 0 16px rgba(155,112,255,.5), inset 0 0 14px rgba(255,255,255,.16); }
      .gs-ms-tile.el-none  { background: linear-gradient(150deg, #321F2D, #150A12 85%); border-color: #4A2A45; color: #8A6376; text-shadow: none; }

      .gs-ms-rows { margin-top: 20px; border-top: 1px solid rgba(255,77,157,.32); }
      .gs-ms-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; padding: 13px 0; border-bottom: 1px solid rgba(255,77,157,.32); }
      .gs-ms-row span { min-width: 0; text-align: center; font: 600 15px 'Pretendard Variable', 'Noto Sans KR', sans-serif; letter-spacing: 1px; color: #FFE9C9; text-shadow: 0 0 10px rgba(240,180,80,.35); }
      .gs-ms-row.gs-ms-sal span { color: #FF9DC8; text-shadow: 0 0 10px rgba(255,77,157,.5); }
      .gs-ms-guide { margin: 10px 0 0; text-align: center; font-family: 'Pretendard Variable', 'Noto Sans KR', sans-serif; font-size: 14px; color: #E3A8C6; }
      .gs-ms-core { margin-top: 18px; display: flex; flex-direction: column; align-items: center; gap: 4px; text-align: center; }
      .gs-ms-core span { font: 700 11px 'Pretendard Variable', 'Noto Sans KR', sans-serif; letter-spacing: 4px; text-indent: 4px; color: #E3A8C6; }
      .gs-ms-core strong { font: 700 19px 'Pretendard Variable', 'Noto Sans KR', sans-serif; letter-spacing: .5px; color: var(--gold); text-shadow: 0 0 18px rgba(240,180,80,.6); }

      .gs-ms-salcards { margin-top: 26px; display: flex; flex-direction: column; gap: 9px; }
      .gs-ms-sallabel { margin: 0 0 3px; text-align: center; font: 400 15px 'yg-jalnan', 'Pretendard Variable', sans-serif; letter-spacing: 5px; text-indent: 5px; color: var(--pink); text-shadow: 0 0 12px rgba(255,77,157,.7); }
      .gs-ms-salcard {
        display: flex; flex-direction: column; gap: 4px; padding: 13px 16px;
        border: 1px solid rgba(255,77,157,.45); border-radius: 14px;
        background: rgba(255,77,157,.1);
        box-shadow: 0 0 14px rgba(224,0,122,.18);
      }
      .gs-ms-salcard b { font: 400 17px 'yg-jalnan', 'Pretendard Variable', sans-serif; letter-spacing: 1px; color: #FF9DC8; text-shadow: 0 0 10px rgba(255,77,157,.5); }
      .gs-ms-salcard p { margin: 0; font-size: 14px; line-height: 1.6; color: #F1DBE7; }

      /* 키-밸류 */
      .gs-kv { display: flex; flex-direction: column; gap: 4px; padding: 13px 15px; background: rgba(255,77,157,.08); border-radius: 12px; }
      .gs-kv-key { font: 700 13.5px 'Pretendard Variable', 'Noto Sans KR', sans-serif; color: var(--gold); }
      .gs-kv-val { font-size: 15.5px; line-height: 1.65; color: #FFEFE0; margin: 0; }

      .gs-chip.gold { color: var(--ink); background: var(--gold); border-color: var(--gold); }

      /* 대운 흐름 */
      .gs-flow { display: flex; gap: 8px; }
      .gs-flow-card { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px; padding: 14px 8px; background: #140710; border-radius: 13px; text-align: center; }
      .gs-flow-age { font-size: 12.5px; font-weight: 700; color: var(--muted); }
      .gs-flow-gz { font: 700 23px 'Pretendard Variable', 'Noto Sans KR', sans-serif; color: var(--pink); }
      .gs-flow-card p { font-size: 13px; line-height: 1.55; color: #FFEFE0; margin: 0; }

      /* 연도별 운세 */
      .gs-years { display: flex; flex-direction: column; gap: 8px; }
      .gs-year-card { display: grid; grid-template-columns: 56px 84px 1fr; align-items: center; gap: 10px; padding: 13px 15px; background: #140710; border-radius: 12px; }
      .gs-year-num { font: 800 17px 'Pretendard Variable', 'Noto Sans KR', sans-serif; color: var(--gold); }
      .gs-year-grade { font-size: 13px; font-weight: 700; color: var(--pink); line-height: 1.35; }
      .gs-year-card p { min-width: 0; font-size: 13px; line-height: 1.55; color: #F1DBE7; margin: 0; }

      /* sticky bar */
      .gs-sticky {
        position: fixed; left: 50%; bottom: 0; transform: translateX(-50%);
        width: 100%; max-width: 480px; z-index: 40;
        display: flex; align-items: center; justify-content: center; gap: 10px;
        background: rgba(26,13,23,.92); backdrop-filter: blur(8px);
        border-top: 1px solid rgba(255,77,157,.45);
        padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
        box-shadow: 0 -8px 30px rgba(224,0,122,.3);
      }
      .gs-sticky-info { flex: 1; display: flex; flex-direction: column; gap: 1px; min-width: 0; }
      .gs-sticky-name { font-size: 12px; font-weight: 700; color: var(--muted); }
      .gs-sticky-price { font-size: 15px; }
      .gs-sticky-price s { color: #8A6376; font-size: 13px; margin-right: 6px; }
      .gs-sticky-price b { color: var(--gold); font-size: 17px; text-shadow: 0 0 10px rgba(240,180,80,.5); }
      .gs-sticky-btn {
        font: 700 15px 'Pretendard Variable', 'Noto Sans KR', sans-serif;
        padding: 13px 20px; border: 0; border-radius: 999px;
        background: linear-gradient(120deg, var(--pink), var(--deep)); color: #fff;
        cursor: pointer; white-space: nowrap;
        box-shadow: 0 0 16px rgba(255,77,157,.6);
      }
      .gs-sticky-btn:focus-visible { outline: 2px solid var(--gold); outline-offset: 2px; }

      /* bottom sheet */
      .gs-sheet-overlay {
        position: fixed; inset: 0; z-index: 50;
        background: rgba(10,4,9,.72);
        display: flex; align-items: flex-end; justify-content: center;
      }
      .gs-sheet {
        position: relative; width: 100%; max-width: 480px; max-height: 86vh; overflow-y: auto;
        background: #1E0E1B; border-radius: 24px 24px 0 0;
        border: 1px solid rgba(255,77,157,.4); border-bottom: 0;
        padding: 24px 18px calc(24px + env(safe-area-inset-bottom));
        display: flex; flex-direction: column; gap: 12px;
        animation: gs-up .28s ease;
        box-shadow: 0 -10px 40px rgba(224,0,122,.3);
      }
      @keyframes gs-up { from { transform: translateY(40px); opacity: 0; } to { transform: none; opacity: 1; } }
      .gs-sheet-close {
        position: absolute; top: 14px; right: 14px;
        width: 32px; height: 32px; border-radius: 50%;
        border: 1px solid var(--line); background: var(--card); color: var(--text); font-size: 14px; cursor: pointer;
      }
      .gs-sheet-done { display: flex; flex-direction: column; gap: 12px; text-align: center; padding: 16px 0; }
      .gs-apply-title { font: 400 22px 'yg-jalnan', 'Pretendard Variable', sans-serif; margin: 0; text-shadow: 0 0 16px rgba(255,77,157,.45); }
      .gs-apply-sub { font-size: 14px; line-height: 1.6; margin: 0; color: var(--muted); }
      .gs-apply-sub b { color: var(--text); }

      .gs-tiers { display: flex; flex-direction: column; gap: 8px; }
      .gs-tier {
        position: relative; border: 1px solid var(--line); border-radius: 14px; padding: 12px 14px;
        background: rgba(255,255,255,.03); opacity: .65;
      }
      .gs-tier.best {
        border: 1px solid var(--pink); background: rgba(224,0,122,.14); opacity: 1;
        box-shadow: 0 0 18px rgba(224,0,122,.35);
      }
      .gs-tier-head { display: flex; justify-content: space-between; align-items: baseline; }
      .gs-tier-head b { font-size: 15px; }
      .gs-tier-price s { color: #8A6376; font-size: 13px; }
      .gs-tier-price em { font-style: normal; font-weight: 700; color: var(--gold); margin-left: 6px; text-shadow: 0 0 10px rgba(240,180,80,.5); }
      .gs-tier-desc { font-size: 12px; color: var(--muted); margin: 4px 0 0; }
      .gs-tier-badge {
        position: absolute; top: -11px; right: 12px;
        font: 700 11px 'Pretendard Variable', 'Noto Sans KR', sans-serif; color: var(--ink);
        background: var(--gold); border-radius: 999px; padding: 2px 10px;
        box-shadow: 0 0 12px rgba(240,180,80,.5);
      }
      .gs-free-note { font-size: 13px; line-height: 1.6; text-align: center; color: var(--text); background: rgba(240,180,80,.1); border: 1px solid rgba(240,180,80,.35); border-radius: 12px; padding: 10px 12px; }

      .gs-footer { padding: 18px 0 30px; font-size: 12px; color: #6E4A5D; }
      .gs-logo-mini { margin-right: 4px; }

      @media (max-height: 720px) {
        .gs-hero-copy {
          top: max(16px, calc(env(safe-area-inset-top, 0px) + 8px));
        }
        .gs-title {
          font-size: clamp(38px, 12vw, 52px);
          margin-block: 3px 6px;
        }
        .gs-sub { font-size: 12px; }
        .gs-chat { max-height: calc(100dvh - 150px); }
        .gs-bubble { font-size: 15px; padding: 7px 11px; }
        .gs-chat-avatar { width: 38px; height: 38px; }
        .gs-step-panel { padding: 10px; gap: 7px; }
        .gs-input { padding-block: 10px; }
        .gs-cta { padding-block: 12px; font-size: 15px; }
        .gs-fineprint { display: none; }
      }

      @media (max-height: 560px) {
        .gs-hero-copy .gs-eyebrow,
        .gs-hero-copy .gs-sub {
          display: none;
        }
        .gs-title { font-size: 36px; }
        .gs-chat {
          top: max(66px, calc(env(safe-area-inset-top, 0px) + 58px));
          max-height: none;
          justify-content: flex-end;
        }
        .gs-chat-msg { display: none; }
        .gs-agree { font-size: 10px; }
        .gs-hint { font-size: 10px; }
      }

      @media (prefers-reduced-motion: reduce) {
        .gs-reveal, .gs-cta, .gs-bar-fill { transition: none; }
        .gs-sheet { animation: none; }
        .gs-hero-glow { animation: none; }
      }

      /* ===== 전역 배경 덮어쓰기 (common.css 밝은 배경 제거) ===== */
      html, body, #root {
        background: #111 !important;
      }

      /* ===== 웹툰 뷰어 인트로 — 네이버 웹툰 스타일 ===== */
      .gs-viewer {
        width: 100vw;
        min-height: 100dvh;
        background: #111;
        display: flex;
        flex-direction: column;
        align-items: center;
        overflow-x: hidden;
      }
      .gs-viewer-bar {
        position: sticky;
        top: 0;
        z-index: 20;
        width: 100%;
        background: rgba(17,17,17,.97);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border-bottom: 1px solid #2a2a2a;
        padding: 14px 18px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .gs-viewer-title {
        font: 700 15px 'Pretendard Variable', 'Noto Sans KR', sans-serif;
        color: #fff;
        letter-spacing: .04em;
      }
      .gs-viewer-strip {
        width: 100%;
        max-width: 690px;
        display: flex;
        flex-direction: column;
        font-size: 0;
        line-height: 0;
        gap: 0;
      }
      .gs-viewer-img {
        width: 100%;
        height: auto;
        display: block;
        margin: 0;
        padding: 0;
        border: none;
        vertical-align: bottom;
        line-height: 0;
      }
      .gs-viewer-bottom {
        width: 100%;
        max-width: 690px;
        padding: 44px 24px calc(56px + env(safe-area-inset-bottom));
        display: flex;
        flex-direction: column;
        align-items: stretch;
        gap: 14px;
        background: #111;
      }
      .gs-viewer-hint {
        margin: 0;
        text-align: center;
        font-size: 13px;
        color: #555;
        letter-spacing: .02em;
      }
      .gs-viewer-bottom .gs-cta {
        font-size: 18px;
        padding-block: 17px;
      }
    `}</style>
  );
}
