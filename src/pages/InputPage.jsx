import { useState, useEffect, useMemo, useRef } from 'react'
import { TIMES } from '../data/data.js'
import { getCurrentDateParts, resolveBirthDate } from '../data/calendar.js'
import '../styles/input.css'

const TIME_GRID = TIMES.slice(0, 12)
const CURRENT_YEAR = getCurrentDateParts().year

function parseTimeValue(value) {
  const match = /^(\d{2}):(\d{2})$/.exec(value)
  if (!match) return null

  const hour = Number(match[1])
  const minute = Number(match[2])
  if (hour > 23 || minute > 59) return null

  return hour + minute / 60
}

function getTimeInfo(hour) {
  if (hour === null || hour < 0) return null
  const branchIndex = Math.floor(((hour + 1) % 24) / 2)
  return TIME_GRID[branchIndex]
}

export default function InputPage({ onComplete }) {
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState('forward')
  const [dateStr, setDateStr] = useState('')
  const [isLunar, setIsLunar] = useState(false)
  const [birthTime, setBirthTime] = useState('')
  const [isTimeUnknown, setIsTimeUnknown] = useState(false)
  const [name, setName] = useState('')
  const [gender, setGender] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('갸루 만세력 펼치는 중...')
  const nameInputRef = useRef(null)
  const loadingIntervalRef = useRef(null)
  const loadingTimeoutRef = useRef(null)

  useEffect(() => {
    if (step !== 3) return undefined
    const timeout = setTimeout(() => nameInputRef.current?.focus(), 450)
    return () => clearTimeout(timeout)
  }, [step])

  useEffect(() => () => {
    clearInterval(loadingIntervalRef.current)
    clearTimeout(loadingTimeoutRef.current)
  }, [])

  function goNext(to) {
    setDirection('forward')
    setStep(to)
  }

  function goBack() {
    setDirection('back')
    setStep(s => s - 1)
  }

  function onDateInput(e) {
    let v = e.target.value.replace(/\D/g, '')
    if (v.length > 8) v = v.slice(0, 8)
    let fmt = ''
    for (let i = 0; i < v.length; i++) {
      if (i === 4 || i === 6) fmt += '.'
      fmt += v[i]
    }
    setDateStr(fmt)
  }

  const dateRaw = dateStr.replace(/\D/g, '')
  const enteredDate = useMemo(() => {
    if (dateRaw.length !== 8) return null
    return {
      year: Number(dateRaw.slice(0, 4)),
      month: Number(dateRaw.slice(4, 6)),
      day: Number(dateRaw.slice(6, 8)),
    }
  }, [dateRaw])
  const resolvedDate = useMemo(() => (
    enteredDate
      ? resolveBirthDate(enteredDate.year, enteredDate.month, enteredDate.day, isLunar)
      : null
  ), [enteredDate, isLunar])
  const dateValid = resolvedDate !== null
  const dateError = dateRaw.length === 8 && !dateValid
    ? isLunar
      ? '앗 그 음력 날짜는 안 잡혀! 평달 기준으로 다시 찍어줘~'
      : `1900년부터 ${CURRENT_YEAR}년 오늘까지, 진짜 있는 생일로 부탁해~`
    : ''
  const selectedHour = isTimeUnknown ? -1 : parseTimeValue(birthTime)
  const timeInfo = getTimeInfo(selectedHour)
  const timeValid = selectedHour !== null

  function startLoading() {
    if (isLoading || !resolvedDate || !enteredDate) return
    setIsLoading(true)
    const msgs = ['헐~ 만세력 펼치는 중...','오행 글리터 밸런스 보는 중...','대운 타이밍 픽스하는 중...','갸루 리딩 완전 정리 직전~!']
    let i = 0
    loadingIntervalRef.current = setInterval(() => {
      if (i < msgs.length) setLoadingMsg(msgs[i++])
    }, 900)
    loadingTimeoutRef.current = setTimeout(() => {
      clearInterval(loadingIntervalRef.current)
      onComplete({
        ...resolvedDate,
        hour: selectedHour,
        name: name.trim() || '운명의 갸루',
        gender: gender ?? 'f',
        originalDate: {
          ...enteredDate,
          isLunar,
          birthTime: isTimeUnknown ? null : birthTime,
        },
      })
    }, 3200)
  }

  function slideClass(idx) {
    if (idx === step) return 'slide'
    if (direction === 'forward') return idx < step ? 'slide hidden-left' : 'slide hidden-right'
    return idx > step ? 'slide hidden-right' : 'slide hidden-left'
  }

  function slideProps(idx) {
    const isActive = idx === step
    return {
      className: slideClass(idx),
      'aria-hidden': !isActive,
      inert: isActive ? undefined : '',
    }
  }

  return (
    <>
      {/* 슬라이드 0 — 인트로 */}
      <div {...slideProps(0)}>
        <div className="slide-bg-ph" />
        <div className="slide-overlay" />
        <div className="slide-content intro-content">
          <p className="slide-label">GAL FORTUNE SALON</p>
          <div className="intro-badges" aria-hidden="true">
            <span>HOT</span><span>LUCKY</span><span>REAL</span>
          </div>
          <div className="intro-moon">✦</div>
          <h1 className="intro-title">갸루 만세력</h1>
          <p className="intro-sub">헐~ 사주는 정확하게, 해석은 반짝하게.<br/>오늘 네 팔자 완전 꾸며줄게</p>
          <button className="next-btn intro-btn" onClick={() => goNext(1)}>입장하기 →</button>
        </div>
      </div>

      {/* 슬라이드 1 — 생년월일 */}
      <div {...slideProps(1)}>
        <div className="slide-bg-ph" />
        <div className="slide-overlay" />
        <button className="back-btn" onClick={goBack}>← 뒤로</button>
        <div className="slide-content">
          <p className="slide-label">STEP 01 · BIRTH</p>
          <h1 className="slide-q">생일 먼저 찍어줘~<br/>여기서 판이 열려!</h1>
          <div className="date-row">
            <input
              className="date-input"
              type="text"
              inputMode="numeric"
              maxLength={10}
              placeholder="YYYY.MM.DD"
              aria-label="생년월일"
              aria-invalid={Boolean(dateError)}
              aria-describedby={dateError ? 'date-error' : undefined}
              value={dateStr}
              onChange={onDateInput}
              onKeyDown={e => { if (e.key === 'Enter' && dateValid) goNext(2) }}
              autoComplete="off"
            />
            <div className="cal-toggle">
              <button className={`cal-btn ${!isLunar ? 'on' : 'off'}`} aria-pressed={!isLunar} onClick={() => setIsLunar(false)}>양력</button>
              <button className={`cal-btn ${isLunar ? 'on' : 'off'}`} aria-pressed={isLunar} onClick={() => setIsLunar(true)}>음력</button>
            </div>
          </div>
          {isLunar && <span className="lunar-badge show">음력 평달 기준으로 볼게~</span>}
          {dateError && <p id="date-error" className="input-error" role="alert">{dateError}</p>}
          <button className="next-btn" disabled={!dateValid} onClick={() => goNext(2)}>좋아, 다음 →</button>
        </div>
      </div>

      {/* 슬라이드 2 — 태어난 시간 */}
      <div {...slideProps(2)}>
        <div className="slide-bg-ph" />
        <div className="slide-overlay" />
        <button className="back-btn" onClick={goBack}>← 뒤로</button>
        <div className="slide-content slide-content-scroll">
          <p className="slide-label">STEP 02 · TIME</p>
          <h1 className="slide-q">태어난 시간 알려줘~<br/>시주까지 반짝 보자!</h1>
          <label className="birth-time-card">
            <span className="birth-time-label">BIRTH TIME</span>
            <input
              className="birth-time-input"
              type="time"
              aria-label="태어난 시간"
              value={birthTime}
              disabled={isTimeUnknown}
              onChange={e => {
                setBirthTime(e.target.value)
                setIsTimeUnknown(false)
              }}
              onKeyDown={e => { if (e.key === 'Enter' && timeValid) goNext(3) }}
            />
          </label>
          <div className={`time-preview${timeInfo ? ' show' : ''}`} aria-live="polite">
            {timeInfo
              ? (
                <>
                  <span className="time-preview-kicker">시주 픽스</span>
                  <strong>{timeInfo.n}</strong>
                  <span>{timeInfo.r}</span>
                </>
              )
              : isTimeUnknown
                ? '시간 모름이면 시주는 비워두고, 나머지는 야무지게 볼게~'
                : '분까지 넣으면 대운 타이밍도 더 예쁘게 잡혀~'}
          </div>
          <button
            className={`time-unknown-btn${selectedHour === -1 ? ' sel' : ''}`}
            aria-pressed={selectedHour === -1}
            onClick={() => setIsTimeUnknown(v => !v)}
          >
            {selectedHour === -1 ? '✓ 시간 몰라도 ㄱㅊ~' : '시간 몰라! 패스할래'}
          </button>
          <button className="next-btn" disabled={!timeValid} onClick={() => goNext(3)}>오케이, 다음 →</button>
        </div>
      </div>

      {/* 슬라이드 3 — 이름 */}
      <div {...slideProps(3)}>
        <div className="slide-bg-ph" />
        <div className="slide-overlay" />
        <button className="back-btn" onClick={goBack}>← 뒤로</button>
        <div className="slide-content">
          <p className="slide-label">STEP 03 · NAME</p>
          <h1 className="slide-q">이름 뭐라고 부를까?<br/>주인공 이름 딱!</h1>
          <input
            ref={nameInputRef}
            className="text-input"
            type="text"
            placeholder="이름 입력"
            aria-label="이름"
            maxLength={10}
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && name.trim()) goNext(4) }}
            autoComplete="off"
          />
          <button className="next-btn" disabled={!name.trim()} onClick={() => goNext(4)}>완전 좋아 →</button>
        </div>
      </div>

      {/* 슬라이드 4 — 성별 */}
      <div {...slideProps(4)}>
        <div className="slide-bg-ph" />
        <div className="slide-overlay" />
        <button className="back-btn" onClick={goBack}>← 뒤로</button>
        <div className="slide-content">
          <p className="slide-label">STEP 04 · MODE</p>
          <h1 className="slide-q">대운 방향 잡자~<br/>어느 쪽으로 볼까?</h1>
          <div className="gender-row">
            <button className={`gender-btn${gender === 'f' ? ' sel' : ''}`} aria-pressed={gender === 'f'} onClick={() => setGender('f')}>여자</button>
            <button className={`gender-btn${gender === 'm' ? ' sel' : ''}`} aria-pressed={gender === 'm'} onClick={() => setGender('m')}>남자</button>
          </div>
          <button className="next-btn" disabled={!gender} onClick={startLoading}>대박, 리딩 시작!</button>
        </div>
      </div>

      {/* 로딩 */}
      {isLoading && (
        <div id="loading-phase" className="show" role="status" aria-live="polite" aria-label="사주 결과 계산 중">
          <div className="loading-inner">
            <div className="loading-sym">☽</div>
            <p className="loading-msg">{loadingMsg}</p>
            <div className="loading-bar"><div className="loading-bar-inner" /></div>
          </div>
        </div>
      )}
    </>
  )
}
