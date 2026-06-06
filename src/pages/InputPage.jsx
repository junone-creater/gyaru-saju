import { useState, useEffect, useRef } from 'react'
import { TIMES } from '../data/data.js'
import '../styles/input.css'

const TIME_GRID = TIMES.slice(0, 12)

export default function InputPage({ onComplete }) {
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState('forward')
  const [dateStr, setDateStr] = useState('')
  const [isLunar, setIsLunar] = useState(false)
  const [selectedHour, setSelectedHour] = useState(null)
  const [name, setName] = useState('')
  const [gender, setGender] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('사주팔자를 계산하는 중...')
  const nameInputRef = useRef(null)

  useEffect(() => {
    if (step === 3) setTimeout(() => nameInputRef.current?.focus(), 450)
  }, [step])

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

  function validateDate(v) {
    const y = +v.slice(0,4), m = +v.slice(4,6), d = +v.slice(6,8)
    return y >= 1900 && y <= 2025 && m >= 1 && m <= 12 && d >= 1 && d <= 31
  }

  const dateRaw = dateStr.replace(/\D/g, '')
  const dateValid = dateRaw.length === 8 && validateDate(dateRaw)

  function startLoading() {
    setIsLoading(true)
    const msgs = ['헐~ 사주 계산하는 중...','오행 밸런스 체크하는 중...','운명의 실 읽어내는 중...','결과 정리 완료 직전~!']
    let i = 0
    const iv = setInterval(() => {
      if (i < msgs.length) setLoadingMsg(msgs[i++])
    }, 900)
    setTimeout(() => {
      clearInterval(iv)
      const parts = dateStr.split('.')
      onComplete({
        year:  +parts[0],
        month: +parts[1],
        day:   +parts[2],
        hour: selectedHour,
        name: name.trim() || '운명의 갸루',
        gender: gender ?? 'f',
        isLunar,
      })
    }, 3200)
  }

  function slideClass(idx) {
    if (idx === step) return 'slide'
    if (direction === 'forward') return idx < step ? 'slide hidden-left' : 'slide hidden-right'
    return idx > step ? 'slide hidden-right' : 'slide hidden-left'
  }

  return (
    <>
      {/* 슬라이드 0 — 인트로 */}
      <div className={slideClass(0)}>
        <div className="slide-bg-ph" />
        <div className="slide-overlay" />
        <div className="slide-content intro-content">
          <p className="slide-label">GYARU FORTUNE</p>
          <div className="intro-moon">☽</div>
          <h1 className="intro-title">갸루 사주</h1>
          <p className="intro-sub">헐~ 너 사주 아직도 안 봤어?!<br/>내가 다 읽어줄게 완전 믿어봐</p>
          <button className="next-btn intro-btn" onClick={() => goNext(1)}>완전 궁금해! 고고 →</button>
        </div>
      </div>

      {/* 슬라이드 1 — 생년월일 */}
      <div className={slideClass(1)}>
        <div className="slide-bg-ph" />
        <div className="slide-overlay" />
        <button className="back-btn" onClick={goBack}>← 뒤로</button>
        <div className="slide-content">
          <p className="slide-label">GYARU FORTUNE</p>
          <h1 className="slide-q">생일이 언제야~?<br/>알랴줘!</h1>
          <div className="date-row">
            <input
              className="date-input"
              type="text"
              inputMode="numeric"
              maxLength={10}
              placeholder="YYYY.MM.DD"
              value={dateStr}
              onChange={onDateInput}
              onKeyDown={e => { if (e.key === 'Enter' && dateValid) goNext(2) }}
              autoComplete="off"
            />
            <div className="cal-toggle">
              <button className={`cal-btn ${!isLunar ? 'on' : 'off'}`} onClick={() => setIsLunar(false)}>양력</button>
              <button className={`cal-btn ${isLunar ? 'on' : 'off'}`} onClick={() => setIsLunar(true)}>음력</button>
            </div>
          </div>
          {isLunar && <span className="lunar-badge show">음력</span>}
          <button className="next-btn" disabled={!dateValid} onClick={() => goNext(2)}>다음 →</button>
        </div>
      </div>

      {/* 슬라이드 2 — 태어난 시간 */}
      <div className={slideClass(2)}>
        <div className="slide-bg-ph" />
        <div className="slide-overlay" />
        <button className="back-btn" onClick={goBack}>← 뒤로</button>
        <div className="slide-content slide-content-scroll">
          <h1 className="slide-q">몇 시에 태어났어?<br/>시간도 중요해~!</h1>
          <div className="time-grid">
            {TIME_GRID.map(t => (
              <button
                key={t.v}
                className={`tg-btn${selectedHour === t.v ? ' sel' : ''}`}
                onClick={() => setSelectedHour(t.v)}
              >
                <span className="tg-name">{t.n}</span>
                <span className="tg-range">{t.r}</span>
              </button>
            ))}
          </div>
          <button
            className={`time-unknown-btn${selectedHour === -1 ? ' sel' : ''}`}
            onClick={() => setSelectedHour(v => v === -1 ? null : -1)}
          >
            {selectedHour === -1 ? '✓ 진짜 모르겠어~' : '몰라몰라~ 모르겠음'}
          </button>
          <button className="next-btn" disabled={selectedHour === null} onClick={() => goNext(3)}>다음 →</button>
        </div>
      </div>

      {/* 슬라이드 3 — 이름 */}
      <div className={slideClass(3)}>
        <div className="slide-bg-ph" />
        <div className="slide-overlay" />
        <button className="back-btn" onClick={goBack}>← 뒤로</button>
        <div className="slide-content">
          <h1 className="slide-q">이름이 뭐야~?<br/>나한테 알랴줘!</h1>
          <input
            ref={nameInputRef}
            className="text-input"
            type="text"
            placeholder="이름 입력"
            maxLength={10}
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && name.trim()) goNext(4) }}
            autoComplete="off"
          />
          <button className="next-btn" disabled={!name.trim()} onClick={() => goNext(4)}>다음 →</button>
        </div>
      </div>

      {/* 슬라이드 4 — 성별 */}
      <div className={slideClass(4)}>
        <div className="slide-bg-ph" />
        <div className="slide-overlay" />
        <button className="back-btn" onClick={goBack}>← 뒤로</button>
        <div className="slide-content">
          <h1 className="slide-q">여자야 남자야?<br/>솔직하게~!</h1>
          <div className="gender-row">
            <button className={`gender-btn${gender === 'f' ? ' sel' : ''}`} onClick={() => setGender('f')}>여자</button>
            <button className={`gender-btn${gender === 'm' ? ' sel' : ''}`} onClick={() => setGender('m')}>남자</button>
          </div>
          <button className="next-btn" disabled={!gender} onClick={startLoading}>대박~ 사주 뜯어봐!</button>
        </div>
      </div>

      {/* 로딩 */}
      {isLoading && (
        <div id="loading-phase" className="show">
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
