/* ══════════════════════════════
   input.js — 입력 슬라이드 흐름
══════════════════════════════ */

let currentSlide = 0;

/* ─ 날짜 자동 포맷 YYYY.MM.DD ─ */
function onDateInput(el) {
  let v = el.value.replace(/\D/g, '');
  if (v.length > 8) v = v.slice(0, 8);
  let fmt = '';
  for (let i = 0; i < v.length; i++) {
    if (i === 4 || i === 6) fmt += '.';
    fmt += v[i];
  }
  el.value = fmt;
  const valid = v.length === 8 && validateDate(v);
  document.getElementById('next-0').disabled = !valid;
}

function validateDate(v) {
  const y = +v.slice(0,4), m = +v.slice(4,6), d = +v.slice(6,8);
  return y >= 1900 && y <= 2025 && m >= 1 && m <= 12 && d >= 1 && d <= 31;
}

/* ─ 양력/음력 토글 ─ */
function setCalendar(type) {
  document.getElementById('btn-solar').className = 'cal-btn ' + (type === 'solar' ? 'on' : 'off');
  document.getElementById('btn-lunar').className = 'cal-btn ' + (type === 'lunar' ? 'on' : 'off');
  document.getElementById('lunar-badge').className = 'lunar-badge' + (type === 'lunar' ? ' show' : '');
}

/* ─ 시간 그리드 생성 ─ */
function buildTimeGrid() {
  const grid = document.getElementById('time-grid');
  TIMES.forEach(t => {
    const el = document.createElement('div');
    el.className = 'time-opt';
    if (t.wide) el.style.gridColumn = '1 / -1';
    el.innerHTML = `<div class="time-name">${t.n}</div><div class="time-range">${t.r}</div>`;
    el.onclick = () => {
      document.querySelectorAll('.time-opt').forEach(x => x.classList.remove('sel'));
      el.classList.add('sel');
      window._selectedHour = t.v;
      document.getElementById('next-1').disabled = false;
    };
    grid.appendChild(el);
  });
}

/* ─ 성별 선택 ─ */
function selectGender(val, el) {
  document.querySelectorAll('.gender-btn').forEach(b => b.classList.remove('sel'));
  el.classList.add('sel');
  window._selectedGender = val;
  document.getElementById('next-3').disabled = false;
}

/* ─ 슬라이드 이동 ─ */
function nextSlide(to) {
  document.getElementById('slide-' + currentSlide).className = 'slide hidden-left';
  document.getElementById('slide-' + to).className = 'slide';
  currentSlide = to;
  if (to === 2) setTimeout(() => document.getElementById('name-input').focus(), 450);
}

function goBack() {
  if (currentSlide === 0) return;
  const from = currentSlide;
  document.getElementById('slide-' + from).className = 'slide hidden-right';
  document.getElementById('slide-' + (from - 1)).className = 'slide';
  currentSlide = from - 1;
}

/* ─ 사주 보기 → localStorage 저장 후 result.html 이동 ─ */
function goToResult() {
  const dateStr  = document.getElementById('date-input').value;
  const parts    = dateStr.split('.');
  const name     = document.getElementById('name-input').value.trim() || '운명의 갸루';
  const hour     = window._selectedHour  ?? 11;
  const gender   = window._selectedGender ?? 'f';
  const isLunar  = document.getElementById('btn-lunar').classList.contains('on');

  const payload = {
    year:   +parts[0],
    month:  +parts[1],
    day:    +parts[2],
    hour,
    name,
    gender,
    isLunar,
  };
  localStorage.setItem('sajuData', JSON.stringify(payload));
  window.location.href = 'result.html';
}

/* ─ 로딩 메시지 순환 ─ */
function startLoadingMsgs() {
  const msgs = ['사주팔자를 계산하는 중...','오행의 균형을 분석하는 중...','운명의 실을 읽는 중...','결과를 정리하는 중...'];
  let i = 0;
  return setInterval(() => {
    const el = document.getElementById('loading-msg');
    if (el && i < msgs.length) el.textContent = msgs[i++];
  }, 900);
}

/* ─ 초기화 ─ */
document.addEventListener('DOMContentLoaded', () => {
  buildTimeGrid();

  // Enter 키로 날짜 진행
  document.getElementById('date-input').addEventListener('keydown', e => {
    if (e.key === 'Enter' && !document.getElementById('next-0').disabled) nextSlide(1);
  });
  // Enter 키로 이름 진행
  document.getElementById('name-input').addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.value.trim()) nextSlide(3);
  });
  document.getElementById('name-input').addEventListener('input', e => {
    document.getElementById('next-2').disabled = !e.target.value.trim();
  });
});
