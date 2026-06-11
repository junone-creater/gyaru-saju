import { useState, useEffect, useRef } from "react";
import {
  calcAll, STEM_EL, BRANCH_EL, EL_KR, EL_HJ, EL_COL, EL_ORD, pick,
} from "./data/saju.js";
import {
  CHARS, YONGSIN, GUIIN, SSINSAL, DAEUN_TXT, YEAR_GRADES, TIMES,
} from "./data/data.js";
import { resolveBirthDate } from "./data/calendar.js";

/* ──────────────────────────────────────────────
   갸루사주 — 심야 점집 에디션 (유이짱 영상 무드 적용)
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
  page17: landingUrl("Page_17.jpeg"),   // 앉아서 내려다보는
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

/* ===== 일주 미리보기(간이) — 결과 헤더 라벨용 ===== */
function iljuLabel(si, bi) {
  return `${STEMS[si]}${BRANCHES[bi]}일주`;
}

/* ===== 십성(十星) — 일간 기준 오행 생극 + 음양으로 판별 ===== */
const TEN_GODS = ["비견", "겁재", "식신", "상관", "편재", "정재", "편관", "정관", "편인", "정인"];
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

/* 명식에 실제로 들어있는 십성 집합 (년·월·시 천간 + 네 지지 본기 기준) */
function presentTenGods(pillars) {
  const dp = pillars[2];
  const found = new Set();
  pillars.forEach((p, i) => {
    if (p.unknown) return;
    if (i !== 2) found.add(tenGodOf(dp.si, STEM_EL[p.si], p.si % 2 === 0));
    found.add(tenGodOf(dp.si, BRANCH_EL[p.bi], p.bi % 2 === 0));
  });
  return found;
}

/* ===== 전체 풀이 데이터 구성 (잠자던 사주 엔진 + 텍스트 데이터 연결) ===== */
function buildReading(solar, hour, name, gender, original) {
  const res = calcAll(solar.year, solar.month, solar.day, hour, name, gender);
  const { rng, pillars, ec, dom, char, daeun, sj, vs } = res;
  const labels = ["년주", "월주", "일주", "시주"];

  // 전통 만세력 표기 순서: 시주 → 일주 → 월주 → 연주
  const pillarView = pillars.map((p, i) => ({
    label: labels[i],
    stem: p.unknown ? "?" : STEMS[p.si],
    branch: p.unknown ? "?" : BRANCHES[p.bi],
    stemEl: p.unknown ? null : STEM_EL[p.si],
    branchEl: p.unknown ? null : BRANCH_EL[p.bi],
    unknown: !!p.unknown,
  })).reverse();

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
      desc: samjae ? `${samjae.type}삼재 — 서두르기보다 점검이 먼저야` : grade.d,
    };
  });

  return {
    name, original,
    iljuLabel: iljuLabel(dp.si, dp.bi),
    animal: BRANCH_ANIMAL[dp.bi],
    pillarView, elBars,
    domKr: EL_KR[dom], domHj: EL_HJ[dom],
    char, profile,
    tenGods: presentTenGods(pillars),
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
  const [form, setForm] = useState({ name: "", by: "", bm: "", bd: "", calendarType: "solar", bt: "", timeUnknown: false, gender: "", email: "", agree: false });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [reading, setReading] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    const isForm = phase === "form";
    document.documentElement.classList.toggle("gs-form-locked", isForm);
    document.body.classList.toggle("gs-form-locked", isForm);

    return () => {
      document.documentElement.classList.remove("gs-form-locked");
      document.body.classList.remove("gs-form-locked");
    };
  }, [phase]);

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
        <FormScreen form={form} onChange={onChange} submit={submitTest} sending={sending} error={error} />
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
function HeroVideo() {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <img
        className="gs-hero-video"
        src={ASSET.heroPoster}
        alt="사주 리딩을 시작하는 유이짱"
      />
    );
  }

  return (
    <div className="gs-hero-video-wrap">
      <video
        className="gs-hero-video"
        src={ASSET.heroVideo}
        poster={ASSET.heroPoster}
        autoPlay
        muted
        loop
        playsInline
        onError={() => setFailed(true)}
        aria-label="촛불 앞에서 사주 리딩을 시작하는 유이짱"
      />
      <div className="gs-hero-glow" aria-hidden="true" />
    </div>
  );
}

/* ===== 1단계: 대화형 입력 폼 (인트로 → ①이름·생일 → ②시간·성별 → ③이메일) ===== */
const INPUT_STEPS = 3; // 인트로 제외 입력 단계 수

function FormScreen({ form, onChange, submit, sending, error }) {
  const [step, setStep] = useState(0); // 0=인트로, 1=이름·생일, 2=시간·성별, 3=이메일
  const [stepError, setStepError] = useState("");

  const setDigits = (key, max) => (e) =>
    onChange(key)({ target: { value: e.target.value.replace(/\D/g, "").slice(0, max), type: "text" } });
  const setValue = (key, value) => onChange(key)({ target: { value, type: "text" } });
  const setBool = (key, value) => onChange(key)({ target: { checked: value, type: "checkbox" } });

  const timeOk = form.timeUnknown || form.bt !== "";

  const next = () => {
    setStepError("");
    if (step === 0) {
      setStep(1);
    } else if (step === 1) {
      if (!form.name.trim()) return setStepError("이름을 알려줘야 시작할 수 있어요!");
      if (!isValidBirth(Number(form.by), Number(form.bm), Number(form.bd), form.calendarType === "lunar"))
        return setStepError("생년월일을 다시 확인해 주세요. (음력은 평달 기준)");
      setStep(2);
    } else if (step === 2) {
      if (!timeOk) return setStepError("시간을 입력하거나 ‘시간 몰라요’를 눌러줘.");
      if (!form.gender) return setStepError("대운 방향을 위해 성별을 골라줘!");
      setStep(3);
    }
  };

  const onEnter = (e) => {
    if (e.key === "Enter") (step === 3 ? submit() : next());
  };

  return (
    <main className="gs-page gs-form-page">
      <header className={`gs-hero ${step > 0 ? "gs-hero-dim" : ""}`}>
        <HeroVideo />
        <div className="gs-hero-copy">
          <p className="gs-eyebrow">오늘 밤, 바로 펼쳐보는 사주 명식 풀이</p>
          <h1 className="gs-title">갸루<span className="gs-title-pop">사주</span></h1>
          <p className="gs-sub">유이짱이랑 대화하면 끝~☆</p>
        </div>

        <section className="gs-chat" aria-label="사주 풀이 신청 대화">
        <p className="gs-bubble yui">
          <b className="gs-bubble-who">유이짱</b>
          {step === 0 && "어서 와~☆ 촛불 켜놓고 기다렸어. 오늘 밤, 네 팔자 전부 봐줄게♡"}
          {step === 1 && "좋아, 접수~☆ 이름이랑 생일부터 알려줘!"}
          {step === 2 && `${form.name}! 좋은 이름이다♡ 태어난 시간이랑, 어느 쪽인지도 알려줘~ 시간은 몰라도 괜찮아!`}
          {step === 3 && "오케이, 접수~☆ 풀이는 바로 보여주고, 메일로도 한 번 더 보내줄게!"}
        </p>

        <div className="gs-step-panel" onKeyDown={onEnter}>
          {step === 0 && (
            <button className="gs-cta" onClick={next}>유이짱에게 사주 보러가기 ☆</button>
          )}

          {step === 1 && (
            <>
              <input className="gs-input" value={form.name} onChange={onChange("name")} placeholder="이름 입력" maxLength={20} autoFocus aria-label="이름" />
              <div className="gs-date-row" aria-label="생년월일 직접 입력">
                <label className="gs-date-cell">
                  <input className="gs-input" inputMode="numeric" value={form.by} onChange={setDigits("by", 4)} placeholder="1999" aria-label="년" />
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
              {stepError && <p className="gs-error" role="alert">{stepError}</p>}
              <div className="gs-step-nav">
                <button className="gs-back" onClick={() => setStep(0)}>← 이전</button>
                <button className="gs-cta gs-cta-grow" onClick={next}>다음 →</button>
              </div>
            </>
          )}

          {step === 2 && (
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
              <div className="gs-toggle">
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
                <button className="gs-back" onClick={() => setStep(1)}>← 이전</button>
                <button className="gs-cta gs-cta-grow" onClick={next}>다음 →</button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <input className="gs-input" type="email" value={form.email} onChange={onChange("email")} placeholder="yui@example.com" autoFocus aria-label="결과지 받을 이메일" />
              <label className="gs-agree">
                <input type="checkbox" checked={form.agree} onChange={onChange("agree")} />
                <span>풀이 발송을 위한 개인정보(이름·생년월일·이메일) 수집에 동의해요.</span>
              </label>
              {error && <p className="gs-error" role="alert">{error}</p>}
              <div className="gs-step-nav">
                <button className="gs-back" onClick={() => setStep(2)}>← 이전</button>
                <button className="gs-cta gs-cta-grow" onClick={submit} disabled={sending}>
                  {sending ? "펼치는 중…" : "내 사주 풀이 보기 ♡"}
                </button>
              </div>
              <p className="gs-fineprint">풀이는 바로 화면에 나와요. 메일로도 한 부 보내드려요!</p>
            </>
          )}
        </div>

        {step > 0 && (
          <div className="gs-progress" aria-label={`${INPUT_STEPS}단계 중 ${step}단계`}>
            {Array.from({ length: INPUT_STEPS }, (_, i) => (
              <span key={i} className={`gs-dot ${i < step ? "on" : ""}`} />
            ))}
          </div>
        )}
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
    <b className="gs-bubble-who">{who === "yui" ? "유이짱" : "친구"}</b>
    {children}
  </p>
);

/* 웹툰식 타원 말풍선 — 기본은 이미지 상단에 걸치고, pos로 이미지 위 임의 위치 배치 가능 */
const Balloon = ({ tail = "l", pos = "", children }) => (
  <div className={`gs-balloon gs-balloon-${tail} ${pos}`}>
    <p>{children}</p>
  </div>
);

/* ===== 2단계: 온페이지 풀 사주 풀이 (유이짱 웹툰 26컷) ===== */
function ResultScreen({ name, reading, openSheet }) {
  if (!reading) return null;
  const {
    pillarView, elBars, domKr, domHj, char, original, tenGods,
    moneyType, relationTrap, luckyAction, sal, sal2, gi, daeunView, yearView, vs,
  } = reading;
  const nick = `${name}짱`;

  return (
    <main className="gs-page gs-page-pad gs-result">
      {/* 1컷 — 커버 */}
      <Cut num={1} className="gs-wt-photo-cut gs-wt-cover">
        <CutPhoto src={ASSET.page01} alt="사주책 뒤에 숨어 눈만 빼꼼 내민 유이짱">
          <div className="gs-wt-overlay">
            <p className="gs-wt-eyebrow">✨ 유이짱의 초특급 사주 분석 ✨</p>
            <p className="gs-wt-quote">너... 생각보다 훨씬<br />흥미로운 팔자네~?<i className="gs-emo">(¬‿¬)♡</i></p>
          </div>
        </CutPhoto>
      </Cut>

      {/* 2컷 — 인사 */}
      <Cut num={2} className="gs-wt-photo-cut">
        <CutPhoto src={ASSET.page02} alt="손을 흔들며 인사하는 유이짱">
          <Balloon tail="r" pos="gs-balloon-tl">{birthLineText(original)}<br /><b>{nick}~!</b></Balloon>
          <Balloon tail="up" pos="gs-balloon-br">너 사주...<br /><b>너~무 흥미롭다♡</b></Balloon>
          <div className="gs-wt-overlay">
            <h2 className="gs-wt-title">안녕~!<br />난 <em>유이짱</em>이야♡</h2>
          </div>
        </CutPhoto>
      </Cut>

      {/* 3컷 — 기운 세당 */}
      <Cut num={3} className="gs-wt-photo-cut">
        <CutPhoto src={ASSET.page03} alt="책 위로 눈만 빼꼼 보이는 유이짱">
          <Balloon tail="r" pos="gs-balloon-tl">옴마나~!<br /><b>너 기운이 꽤 세당?♡</b></Balloon>
          <div className="gs-wt-overlay">
            <p className="gs-wt-line">너 진짜 보통 팔자가 아닌데~?<br />딱 봐도 알지☆<br />유이짱은 못 속여~<i className="gs-emo">(¬‿¬)♡</i></p>
          </div>
        </CutPhoto>
      </Cut>

      {/* 4컷 — 고민 짚기 */}
      <Cut num={4} className="gs-wt-photo-cut">
        <CutPhoto src={ASSET.page04} alt="놀란 표정으로 사주책을 펼친 유이짱">
          <Balloon tail="l" pos="gs-balloon-tr">이게 고민되는 거지~?</Balloon>
          <Balloon tail="upr" pos="gs-balloon-bl"><b>너 어떤 사람인지도☆<br />너 고민이 뭔지도☆</b><br />딱 봐도 알징~♡</Balloon>
        </CutPhoto>
      </Cut>

      {/* 5컷 — 37번 확인 */}
      <Cut num={5} className="gs-wt-text-cut gs-wt-lace">
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
        <p className="gs-wt-kicker">THE REASON</p>
        <h2 className="gs-wt-title">{nick}이 지금<br />이게 고민되는 이유☆</h2>
        <p className="gs-wt-answer">유이짱은 알지~♡<br /><b>바로 니 팔자 때문이야</b> <i className="gs-emo">(¬‿¬)✨</i></p>
      </Cut>

      {/* 7컷 — 사주 명식 (실데이터) */}
      <Cut num={7} className="gs-card gs-wt-data">
        <SectionHead kicker="四柱命式 · SAJU CHART" title={`${nick}의 사주 명식`} />
        <p className="gs-wt-chartdate">{birthLineText(original)}</p>
        <div className="gs-pillars">
          {pillarView.map((p) => (
            <div key={p.label} className="gs-pillar">
              <span className="gs-pillar-label">{p.label}</span>
              <strong className="gs-pillar-stem" style={p.stemEl ? { color: EL_COL[p.stemEl] } : undefined}>{p.stem}</strong>
              <b className="gs-pillar-branch" style={p.branchEl ? { color: EL_COL[p.branchEl] } : undefined}>{p.branch}</b>
            </div>
          ))}
        </div>
        <div className="gs-core">
          <span>핵심 기운</span>
          <strong>{domHj} · {domKr} — {char.name}</strong>
        </div>
        <div className="gs-bars">
          {elBars.map((b) => (
            <div key={b.el} className="gs-bar-row">
              <span className="gs-bar-name" style={{ color: b.col }}>{b.hj} {b.kr}</span>
              <span className="gs-bar-track">
                <span className="gs-bar-fill" style={{ width: `${b.pct}%`, background: b.col }} />
              </span>
              <span className="gs-bar-num">{b.n}</span>
            </div>
          ))}
        </div>
        <p className="gs-sub-label">십성(十星) — 명식에 빛나는 별</p>
        <div className="gs-tengods">
          {TEN_GODS.map((g) => (
            <span key={g} className={`gs-tengod ${tenGods.has(g) ? "on" : ""}`}>{g}</span>
          ))}
        </div>
        <p className="gs-sub-label">신살 분석</p>
        <div className="gs-chips">
          <span className="gs-chip">{sal.n}</span>
          <span className="gs-chip">{sal2.n}</span>
        </div>
      </Cut>

      {/* 8컷 — 흐름 궁금하지 */}
      <Cut num={8} className="gs-wt-photo-cut">
        <Balloon tail="r">니 팔자가 <b>어떻게 흘러가는지</b><br />궁금하지~?♡</Balloon>
        <CutPhoto src={ASSET.page08} alt="귀엽게 올려다보는 유이짱" />
      </Cut>

      {/* 9컷 — 적나라하게 */}
      <Cut num={9} className="gs-wt-text-cut">
        <h2 className="gs-wt-title">니 눈앞에<br /><em>완전 적나라하게</em><br />보여줄 수 있엉~<i className="gs-emo">(¬‿¬)♡</i></h2>
        <p className="gs-wt-sparkle" aria-hidden="true">✦ ♡ ✦</p>
      </Cut>

      {/* 10컷 — 그런데 말이야 */}
      <Cut num={10} className="gs-wt-photo-cut">
        <Balloon tail="l">그런데 말이야~♡</Balloon>
        <CutPhoto src={ASSET.page10} alt="살짝 고민하는 표정의 유이짱" />
      </Cut>

      {/* 11컷 — 삐빅 */}
      <Cut num={11} className="gs-wt-text-cut gs-wt-warning gs-wt-realtalk">
        <div className="gs-wt-tape-bg" aria-hidden="true">
          <div className="gs-wt-tape gs-wt-tape-ghost-big">REAL TALK · REAL TALK</div>
          <div className="gs-wt-tape gs-wt-tape-ghost-sm">REAL TALK · REAL TALK · REAL TALK · REAL TALK</div>
        </div>
        <span className="gs-wt-beep"><i className="gs-wt-beep-warn">⚠︎</i> 삐빅☆ <i className="gs-wt-beep-warn">⚠︎</i></span>
        <h2 className="gs-wt-title">좋은 말만은<br /><em>안 한다~?</em> <i className="gs-emo">(¬‿¬)♡</i></h2>
      </Cut>

      {/* 13컷 — 반복될 문제 */}
      <Cut num={13} className="gs-wt-text-cut gs-wt-impact">
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

      {/* 14~15컷 — 방법 + 조언 (한 흐름으로) */}
      <Cut num={"14~15"} className="gs-wt-text-cut">
        <h2 className="gs-wt-title">✨ 니 팔자를<br /><em>제대로 쓰는 방법</em> ✨</h2>
        <Bubble>궁금하지~?♡</Bubble>
        <span className="gs-wt-divider" aria-hidden="true">✦</span>
        <h2 className="gs-wt-title">니 문제는<br /><em>능력 부족이 아니야~☆</em></h2>
        <p className="gs-wt-line">생각보다 너무 오래 참는 거야<i className="gs-emo">(¬‿¬)♡</i></p>
        <div className="gs-wt-actions">
          <span>확인만 하지 말고<br /><b>표현도 하고☆</b></span>
          <span>기다리지만 말고<br /><b>움직여봐☆</b></span>
        </div>
        <p className="gs-wt-line">니 팔자는 생각만 할 때보다<br /><b>움직이는 순간 훨씬 크게 열리거든</b> <i className="gs-emo">(°▽°)✨</i></p>
        <p className="gs-wt-throw">“알아서 알겠지” <b>그거 버려~♡</b><br /><small>말해야 알더라구~?<i className="gs-emo">(&gt;_&lt;)💦</i></small></p>
      </Cut>

      {/* 16컷 — 후훗 */}
      <Cut num={16} className="gs-wt-text-cut gs-wt-impact">
        <p className="gs-wt-script">후훗♡</p>
        <p className="gs-wt-answer">이거 말고도 할 얘기가<br /><b>엄청 많다구~<i className="gs-emo">(¬‿¬)✨</i></b></p>
      </Cut>

      {/* 17컷 — 복채 */}
      <Cut num={17} className="gs-wt-photo-cut">
        <Balloon tail="c">그래서~<br /><b>복채는 준비했어~?♡</b></Balloon>
        <CutPhoto src={ASSET.page17} alt="의자에 앉아 내려다보는 유이짱">
          <div className="gs-wt-overlay">
            <p className="gs-wt-only">오직 <b>{nick}</b>만을 위한 이야기✨</p>
          </div>
        </CutPhoto>
      </Cut>

      {/* 18~21컷 — 피날레 빌드업 (한 흐름으로) */}
      <Cut num={"18~21"} className="gs-wt-text-cut gs-wt-impact gs-wt-finale">
        <span className="gs-wt-hand" aria-hidden="true">✋</span>
        <Bubble>잠깐♡<br /><b>무슨 생각해~?☆</b></Bubble>
        <h2 className="gs-wt-title">설마~<br />다른 운세 알려주는 곳이랑<br /><em>똑같다고 생각한 건 아니지~?</em></h2>
        <p className="gs-wt-stupid">스투핏~!!<small><i className="gs-emo">(&gt;_&lt;)💦</i></small></p>
        <span className="gs-wt-divider" aria-hidden="true">✦</span>
        <h2 className="gs-wt-title">유이짱 사주는♡</h2>
        <div className="gs-wt-lifeline" aria-hidden="true">
          <span>태어난 순간</span><i /><span>눈을 감는 순간</span>
        </div>
        <p className="gs-wt-answer">네 인생의 흐름을<br /><b>전부 알려준다구~<i className="gs-emo">(¬‿¬)✨</i></b></p>
        <span className="gs-wt-divider" aria-hidden="true">✦</span>
        <h2 className="gs-wt-title">너가 보게 될<br /><em>마지막 사주☆</em></h2>
        <p className="gs-wt-destiny">운명을 바꿀 기회✨</p>
      </Cut>

      {/* 22컷 — 연애 패턴 · 집착 (실데이터) */}
      <Cut num={22} className="gs-card gs-wt-data">
        <SectionHead kicker="LOVE &amp; OBSESSION" title="연애 패턴 · 집착" />
        <p className="gs-body">{char.couple}</p>
        <div className="gs-kv">
          <span className="gs-kv-key">반복 포인트</span>
          <p className="gs-kv-val">{relationTrap}</p>
        </div>
        <div className="gs-kv">
          <span className="gs-kv-key">귀인 타입 · {gi.t}</span>
          <p className="gs-kv-val">{gi.d}</p>
        </div>
      </Cut>

      {/* 23컷 — 인간관계 · 호구 패턴 (실데이터) */}
      <Cut num={23} className="gs-card gs-wt-data">
        <SectionHead kicker="RELATIONSHIP FILTER" title="인간관계 · 호구 패턴, 가짜 인연까지" />
        <div className="gs-kv">
          <span className="gs-kv-key">네가 약해지는 순간</span>
          <p className="gs-kv-val">{char.weak} — 컨디션이 흔들리는 날엔 판단도 같이 흔들려.</p>
        </div>
        <p className="gs-body">좋은 사람으로 남으려다 네 기준을 늦게 말하면, 맞지 않는 인연이 오래 눌러앉기 쉬워.</p>
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
              <p>{d.txt}</p>
            </div>
          ))}
        </div>
        <div className="gs-kv">
          <span className="gs-kv-key">오늘부터 한 가지</span>
          <p className="gs-kv-val">{luckyAction}부터 시작하면 흐름을 네 편으로 돌리기 좋아.</p>
        </div>
      </Cut>

      {/* 25컷 — 재물 흐름 (실데이터) */}
      <Cut num={25} className="gs-card gs-wt-data">
        <SectionHead kicker="MONEY FLOW" title={`재물 흐름 — ${moneyType}`} />
        <p className="gs-body">돈 감각이 없는 타입은 아니야. <b>{vs.g} 기운이 강한 날엔 기분 따라 새는 돈만 조심☆</b></p>
        <div className="gs-kv">
          <span className="gs-kv-key">행운 아이템</span>
          <p className="gs-kv-val">{vs.yd}</p>
        </div>
        <div className="gs-years">
          {yearView.map((y) => (
            <div key={y.year} className="gs-year-card">
              <span className="gs-year-num">{y.year}</span>
              <strong className="gs-year-grade">{y.grade}</strong>
              <p>{y.desc}</p>
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
        <CutPhoto src={ASSET.page02b} alt="활짝 웃으며 손을 흔드는 유이짱" />
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
          <Bubble>읽으면서 찔렸잖아~?<br /><b>그게 지금 너한테 가장 필요한 거야♡</b></Bubble>
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
      <div className="gs-sticky-info">
        <span className="gs-sticky-name">스코메 올인원</span>
        <span className="gs-sticky-price">
          <s>{won(129000)}</s> <b>오늘 0원</b>
        </span>
      </div>
      <button className="gs-sticky-btn" onClick={openSheet}>
        {applied ? "신청 완료 ♡" : "무료 신청 ☆"}
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
                  {t.best && <span className="gs-tier-badge">유이짱 픽 ☆</span>}
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
      @import url('https://fonts.googleapis.com/css2?family=Gaegu:wght@700&family=Noto+Sans+KR:wght@400;500;700;900&display=swap');
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
        font: 500 16px 'Pretendard Variable', 'Noto Sans KR', sans-serif;
        padding: 12px 14px; border: 1px solid var(--line); border-radius: 12px;
        background: #170B14; color: var(--text); caret-color: var(--pink);
      }
      .gs-input::placeholder { color: #7E5870; }
      .gs-input:focus-visible { outline: 2px solid var(--pink); outline-offset: 2px; }
      .gs-toggle { display: flex; gap: 8px; }
      .gs-toggle-btn {
        flex: 1; padding: 11px 0; font: 700 15px 'Pretendard Variable', 'Noto Sans KR', sans-serif;
        border: 1px solid var(--line); border-radius: 12px; background: #170B14; color: var(--muted); cursor: pointer;
      }
      .gs-toggle-btn.on {
        background: linear-gradient(120deg, var(--pink), var(--deep)); color: #fff; border-color: var(--pink);
        box-shadow: 0 0 14px rgba(255,77,157,.5);
      }
      .gs-toggle-btn:focus-visible { outline: 2px solid var(--gold); outline-offset: 2px; }
      .gs-time-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
      .gs-time-cell {
        display: flex; flex-direction: column; align-items: center; gap: 1px;
        padding: 8px 2px; border: 1px solid var(--line); border-radius: 11px;
        background: #170B14; color: var(--muted); cursor: pointer;
      }
      .gs-time-cell b { font: 700 13.5px 'Pretendard Variable', 'Noto Sans KR', sans-serif; color: var(--text); }
      .gs-time-cell small { font-size: 10px; }
      .gs-time-cell.on {
        background: linear-gradient(120deg, var(--pink), var(--deep));
        border-color: var(--pink); box-shadow: 0 0 12px rgba(255,77,157,.5);
      }
      .gs-time-cell.on b, .gs-time-cell.on small { color: #fff; }
      .gs-time-cell:focus-visible { outline: 2px solid var(--gold); outline-offset: 2px; }
      .gs-unknown-btn { width: 100%; flex: none; }
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
        font-family: 'Gaegu', cursive; font-size: 17px; line-height: 1.35;
        background: var(--card); border: 1px solid var(--line); border-radius: 16px;
        padding: 9px 13px; max-width: 92%; color: var(--text);
      }
      .gs-bubble.yui {
        align-self: flex-start; border-bottom-left-radius: 4px;
        background: rgba(224,0,122,.18); border-color: rgba(255,77,157,.45);
        box-shadow: 0 0 14px rgba(224,0,122,.18);
      }
      .gs-bubble.friend { align-self: flex-end; border-bottom-right-radius: 4px; }
      .gs-bubble.me {
        align-self: flex-end; border-bottom-right-radius: 4px;
        background: linear-gradient(120deg, var(--pink), var(--deep)); color: #fff; border: 0;
        box-shadow: 0 0 14px rgba(255,77,157,.4);
      }
      .gs-bubble-who { display: block; font: 700 11px 'Pretendard Variable', 'Noto Sans KR', sans-serif; color: var(--gold); margin-bottom: 2px; }
      .gs-step-panel {
        background: rgba(36,18,38,.9); border: 1px solid var(--line); border-radius: 18px;
        box-shadow: 0 0 20px rgba(224,0,122,.14); padding: 13px 12px;
        display: flex; flex-direction: column; gap: 9px;
        backdrop-filter: blur(12px);
      }
      .gs-date-row { display: flex; gap: 8px; }
      .gs-date-cell { flex: 1; display: flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 700; color: var(--muted); }
      .gs-date-cell .gs-input { width: 100%; min-width: 0; text-align: center; }
      .gs-step-nav { display: flex; gap: 8px; }
      .gs-back {
        font: 700 14px 'Pretendard Variable', 'Noto Sans KR', sans-serif; padding: 0 16px;
        border: 1px solid var(--line); border-radius: 999px; background: transparent; color: var(--muted); cursor: pointer;
      }
      .gs-back:focus-visible { outline: 2px solid var(--pink); outline-offset: 2px; }
      .gs-cta-grow { flex: 1; }
      .gs-progress { display: flex; gap: 6px; justify-content: center; }
      .gs-dot { width: 8px; height: 8px; border-radius: 50%; background: #3A2236; }
      .gs-dot.on { background: var(--pink); box-shadow: 0 0 8px rgba(255,77,157,.7); }

      /* ===== 온페이지 풀이 (웹툰 26컷 — 경계선 없는 연속 스크롤) ===== */
      .gs-result { --muted: #D9B6C9; display: flex; flex-direction: column; gap: 0; padding: 0 0 110px; }

      /* 웹툰식 고대비 말풍선: 흰 바탕 + 검정 테두리 + 진한 글자 */
      .gs-result .gs-bubble,
      .gs-result .gs-bubble.yui,
      .gs-result .gs-bubble.friend {
        font-size: 19px; padding: 13px 18px; max-width: 88%;
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
      .gs-balloon-tl { position: absolute; z-index: 5; top: 18px; left: 14px; margin: 0; max-width: 70%; padding: 20px 26px; }
      .gs-balloon-tl p { font-size: 15.5px; }
      .gs-balloon-tr { position: absolute; z-index: 5; top: 18px; right: 14px; margin: 0; max-width: 72%; padding: 22px 28px; }
      .gs-balloon-br { position: absolute; z-index: 5; right: 14px; bottom: 150px; margin: 0; max-width: 66%; padding: 24px 30px; }
      .gs-balloon-bl { position: absolute; z-index: 5; left: 14px; bottom: 26px; margin: 0; max-width: 74%; padding: 24px 28px; }

      .gs-reveal { opacity: 0; transform: translateY(16px); transition: opacity .5s ease, transform .55s cubic-bezier(.2,.75,.2,1); }
      .gs-reveal.shown { opacity: 1; transform: none; }

      .gs-sec-head { display: flex; flex-direction: column; gap: 5px; margin-bottom: 4px; }
      .gs-sec-kicker { font: 700 12.5px 'Pretendard Variable', 'Noto Sans KR', sans-serif; letter-spacing: .14em; color: var(--gold); }
      .gs-sec-title { font: 400 21px/1.4 'yg-jalnan', 'Pretendard Variable', sans-serif; margin: 0; color: #FFF7EE; }

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
        background: linear-gradient(180deg, rgba(12,5,10,.2), transparent 26% 46%, rgba(12,5,10,.62) 72%, rgba(12,5,10,.96) 96%);
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
        margin: 0; font-family: 'Gaegu', cursive; font-size: 24px; line-height: 1.4;
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
      .gs-wt-script { margin: 0; font-family: 'Gaegu', cursive; font-size: 31px; color: #FF8FC2; }
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
      .gs-wt-line { margin: 0; font-size: 16.5px; font-weight: 700; line-height: 1.75; color: #FFF3E6; }
      .gs-wt-line b { color: var(--gold); }
      .gs-wt-kicker { margin: 0; font: 700 12.5px 'Pretendard Variable', 'Noto Sans KR', sans-serif; letter-spacing: .2em; color: var(--gold); }
      .gs-wt-answer { margin: 0; font-family: 'Gaegu', cursive; font-size: 24px; line-height: 1.5; color: #FFD3E8; }
      .gs-wt-answer b { color: #fff; }

      /* 텍스트 컷 — 경계선 없는 풀폭 밴드 (배경색으로만 구분) */
      .gs-wt-text-cut {
        background: var(--card);
        padding: 48px 22px; display: flex; flex-direction: column; gap: 16px;
        align-items: center; text-align: center;
      }
      .gs-wt-text-cut .gs-bubble { align-self: center; }
      .gs-wt-impact {
        background:
          radial-gradient(circle at 50% 10%, rgba(255,77,157,.24), transparent 55%),
          linear-gradient(160deg, #31112A, #190818);
      }

      /* 블랙 레이스 테두리 — 스캘럽(반원) 띠 + 도트 트림 */
      .gs-wt-lace { position: relative; padding: 64px 40px; }
      .gs-wt-lace::before {
        content: ''; position: absolute; inset: 0; z-index: 0; pointer-events: none;
        --lc: #0A0309;
        background:
          linear-gradient(var(--lc), var(--lc)) top left / 100% 12px no-repeat,
          linear-gradient(var(--lc), var(--lc)) bottom left / 100% 12px no-repeat,
          linear-gradient(var(--lc), var(--lc)) top left / 12px 100% no-repeat,
          linear-gradient(var(--lc), var(--lc)) top right / 12px 100% no-repeat,
          radial-gradient(circle 10px at 50% 10px, var(--lc) 9px, transparent 10px) top left / 26px 24px repeat-x,
          radial-gradient(circle 10px at 50% calc(100% - 10px), var(--lc) 9px, transparent 10px) bottom left / 26px 24px repeat-x,
          radial-gradient(circle 10px at 10px 50%, var(--lc) 9px, transparent 10px) top left / 24px 26px repeat-y,
          radial-gradient(circle 10px at calc(100% - 10px) 50%, var(--lc) 9px, transparent 10px) top right / 24px 26px repeat-y;
      }
      .gs-wt-lace::after {
        content: ''; position: absolute; inset: 30px; z-index: 0; pointer-events: none;
        border: 3px dotted rgba(10,3,9,.9); border-radius: 12px;
        box-shadow: 0 0 0 1px rgba(255,77,157,.22);
      }
      .gs-wt-lace > * { position: relative; z-index: 1; }
      .gs-wt-warning {
        background:
          radial-gradient(circle at 50% 0%, rgba(240,180,80,.18), transparent 55%),
          #20101C;
      }
      .gs-wt-finale { gap: 18px; padding-block: 54px; }
      .gs-wt-divider { width: 100%; text-align: center; color: var(--gold); font-size: 16px; opacity: .85; margin-block: 14px; text-shadow: 0 0 10px rgba(240,180,80,.6); }

      .gs-wt-checks { display: flex; flex-direction: column; gap: 7px; }
      .gs-wt-checks p { margin: 0; font: 700 16.5px 'Pretendard Variable', 'Noto Sans KR', sans-serif; color: #FFF3E6; }
      .gs-wt-punch { margin: 0; font-size: 16px; line-height: 1.75; color: #F1DBE7; }
      .gs-wt-punch b { color: #FF6FB0; font-size: 17.5px; }

      .gs-wt-sparkle { margin: 0; color: var(--gold); font-size: 18px; letter-spacing: 10px; text-shadow: 0 0 12px rgba(240,180,80,.6); }

      .gs-wt-beep {
        display: inline-flex; align-items: center; gap: 8px;
        font-family: 'Gaegu', cursive; font-size: 22px; color: var(--ink);
        background: var(--gold); border-radius: 999px; padding: 3px 16px;
        box-shadow: 0 0 16px rgba(240,180,80,.5);
      }
      .gs-wt-beep-warn { font-style: normal; font-size: 17px; line-height: 1; transform: translateY(-1px); }
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

      .gs-wt-problem-title {
        font: 800 clamp(17px, 4.6vw, 22px)/1.4 'Pretendard Variable', 'Noto Sans KR', sans-serif;
        white-space: nowrap;
      }
      .gs-wt-problem-title .gs-warn { font-style: normal; color: var(--gold); }

      .gs-wt-problem {
        width: 100%; text-align: left; border-radius: 14px;
        background: rgba(255,77,157,.09); padding: 18px 17px;
        display: flex; flex-direction: column; gap: 10px;
      }
      .gs-wt-problem strong { font-family: 'Gaegu', cursive; font-size: 24px; color: #FF8FC2; }
      .gs-wt-problem p { margin: 0; font-size: 15.5px; line-height: 1.7; color: #FFF3E6; }
      .gs-wt-problem b { color: #FF8FC2; }
      .gs-wt-problem ul { margin: 0; padding-left: 4px; list-style: none; display: flex; flex-direction: column; gap: 6px; }
      .gs-wt-problem li { font: 700 15.5px 'Pretendard Variable', 'Noto Sans KR', sans-serif; color: #FFF3E6; }
      .gs-wt-chill { margin: 0; font-family: 'Gaegu', cursive; font-size: 21px; line-height: 1.5; color: #FFD3E8; }
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

      .gs-wt-hand { font-size: 52px; line-height: 1; filter: drop-shadow(0 0 14px rgba(255,77,157,.5)); }
      .gs-wt-stupid { margin: 0; font: 400 38px 'yg-jalnan', 'Pretendard Variable', sans-serif; color: var(--pink); text-shadow: 0 0 26px rgba(255,77,157,.7); }
      .gs-wt-stupid small { display: block; font-size: 17px; font-weight: 500; color: var(--muted); margin-top: 2px; }

      .gs-wt-lifeline { display: flex; align-items: center; gap: 10px; width: 100%; }
      .gs-wt-lifeline span { font: 700 12.5px 'Pretendard Variable', 'Noto Sans KR', sans-serif; color: var(--gold); white-space: nowrap; }
      .gs-wt-lifeline i { flex: 1; height: 2px; background: linear-gradient(90deg, var(--gold), var(--pink)); box-shadow: 0 0 10px rgba(255,77,157,.6); }
      .gs-wt-destiny { margin: 0; font: 400 27px 'yg-jalnan', 'Pretendard Variable', sans-serif; color: var(--gold); text-shadow: 0 0 24px rgba(240,180,80,.7); }

      /* 데이터 컷 — 풀폭 밴드 (배경색으로만 구분) */
      .gs-wt-data {
        border: 0; border-radius: 0; box-shadow: none;
        background: #1C0C18; padding: 40px 20px 44px; gap: 14px;
      }
      .gs-wt-chartdate { margin: -6px 0 2px; font-size: 13.5px; color: var(--muted); }
      .gs-tengods { display: flex; flex-wrap: wrap; gap: 7px; }
      .gs-tengod {
        font: 700 13.5px 'Pretendard Variable', 'Noto Sans KR', sans-serif; padding: 5px 12px; border-radius: 999px;
        color: #8A6376; background: #140710; border: 1px solid var(--line);
      }
      .gs-tengod.on {
        color: #fff; background: linear-gradient(120deg, var(--pink), var(--deep));
        border-color: var(--pink); box-shadow: 0 0 12px rgba(255,77,157,.55);
      }
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
      .gs-wt-reviews span { font-family: 'Gaegu', cursive; font-size: 20px; color: #FFFCF5; }
      .gs-wt-limit { margin: 0; font-size: 16px; line-height: 1.7; color: #F1DBE7; }
      .gs-wt-limit b { color: #FF6FB0; font-size: 18px; }
      .gs-wt-nudge { margin: 0; font-size: 14px; line-height: 1.7; color: var(--muted); }
      .gs-wt-nudge b { color: var(--gold); }

      /* 명식 */
      .gs-pillars { display: grid; grid-template-columns: repeat(4, 1fr); gap: 7px; }
      .gs-pillar { min-width: 0; display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 14px 2px; background: #140710; border-radius: 12px; }
      .gs-pillar-label { font-size: 12.5px; font-weight: 700; color: var(--muted); }
      .gs-pillar-stem { font: 700 29px 'Pretendard Variable', 'Noto Sans KR', sans-serif; line-height: 1.1; }
      .gs-pillar-branch { font: 700 24px 'Pretendard Variable', 'Noto Sans KR', sans-serif; line-height: 1.1; }
      .gs-core { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 13px 16px; background: rgba(240,180,80,.12); border-radius: 12px; }
      .gs-core span { font-size: 13.5px; font-weight: 700; color: var(--muted); }
      .gs-core strong { font: 800 17px/1.35 'Pretendard Variable', 'Noto Sans KR', sans-serif; color: var(--gold); text-align: right; }

      /* 오행 밸런스 */
      .gs-bars { display: flex; flex-direction: column; gap: 10px; }
      .gs-bar-row { display: grid; grid-template-columns: 64px 1fr 20px; align-items: center; gap: 9px; }
      .gs-bar-name { font-size: 13.5px; font-weight: 700; }
      .gs-bar-track { height: 10px; border-radius: 999px; background: #140710; overflow: hidden; }
      .gs-bar-fill { display: block; height: 100%; border-radius: 999px; transition: width .8s cubic-bezier(.2,.75,.2,1); box-shadow: 0 0 10px currentColor; }
      .gs-bar-num { font-size: 13.5px; font-weight: 700; color: var(--muted); text-align: right; }

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
        display: flex; align-items: center; gap: 10px;
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
        .gs-bubble { display: none; }
        .gs-agree { font-size: 10px; }
        .gs-hint { font-size: 10px; }
      }

      @media (prefers-reduced-motion: reduce) {
        .gs-reveal, .gs-cta, .gs-bar-fill { transition: none; }
        .gs-sheet { animation: none; }
        .gs-hero-glow { animation: none; }
      }
    `}</style>
  );
}
