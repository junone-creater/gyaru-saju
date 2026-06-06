import { useState, useEffect, useRef } from 'react'
import { TIMES } from '../data/data.js'
import '../styles/input.css'

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
    if (step === 2) setTimeout(() => nameInputRef.current?.focus(), 450)
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
    const msgs = ['사주팔자를 계산하는 중...','오행의 균형을 분석하는 중...','운명의 실을 읽는 중...','결과를 정리하는 중...']
    let i = 0
    const iv = setInterval(() => {
      if (i < msgs.length) setLoadingMsg(msgs[i++])
    }, 900)
    setTimeout(() => {
      clearInterval(iv)
      const parts = dateStr.split('.')
      onComplete({
        year: +parts[0], month: +parts[1], day: +parts[2],
        hour: selectedHour ?? 11,
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
      {/* 슬라이드 0 — 생년월일 */}
      <div className={slideClass(0)}>
        <div className="slide-bg-ph" />
        <div className="slide-content">
          <p className="slide-label">GYARU FORTUNE</p>
          <h1 className="slide-q">생년월일을<br/>알려줘</h1>
          <div className="date-row">
            <input
              className="date-input"
              type="text"
              inputMode="numeric"
              maxLength={10}
              placeholder="YYYY.MM.DD"
              value={dateStr}
              onChange={onDateInput}
              onKeyDown={e => { if (e.key === 'Enter' && dateValid) goNext(1) }}
              autoComplete="off"
            />
            <div className="cal-toggle">
              <button className={`cal-btn ${!isLunar ? 'on' : 'off'}`} onClick={() => setIsLunar(false)}>양력</button>
              <button className={`cal-btn ${isLunar ? 'on' : 'off'}`} onClick={() => setIsLunar(true)}>음력</button>
            </div>
          </div>
          {isLunar && <span className="lunar-badge show">음력</span>}
          <button className="next-btn" disabled={!dateValid} onClick={() => goNext(1)}>다음 →</button>
        </div>
      </div>

      {/* 슬라이드 1 — 태어난 시간 */}
      <div className={slideClass(1)}>
        <div className="slide-bg-ph" />
        <div className="slide-content">
          <button className="back-btn" onClick={goBack}>← 뒤로</button>
          <h1 className="slide-q">태어난 시간을<br/>알려줘</h1>
          <div className="time-grid">
            {TIMES.map(t => (
              <div
                key={t.v}
                className={`time-opt${selectedHour === t.v ? ' sel' : ''}`}
                style={t.wide ? { gridColumn: '1 / -1' } : {}}
                onClick={() => setSelectedHour(t.v)}
              >
                <div className="time-name">{t.n}</div>
                <div className="time-range">{t.r}</div>
              </div>
            ))}
          </div>
          <button className="next-btn" disabled={selectedHour === null} onClick={() => goNext(2)}>다음 →</button>
        </div>
      </div>

      {/* 슬라이드 2 — 이름 */}
      <div className={slideClass(2)}>
        <div className="slide-bg-ph" />
        <div className="slide-content">
          <button className="back-btn" onClick={goBack}>← 뒤로</button>
          <h1 className="slide-q">네 이름은<br/>뭐야?</h1>
          <input
            ref={nameInputRef}
            className="text-input"
            type="text"
            placeholder="이름 입력"
            maxLength={10}
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && name.trim()) goNext(3) }}
            autoComplete="off"
          />
          <button className="next-btn" disabled={!name.trim()} onClick={() => goNext(3)}>다음 →</button>
        </div>
      </div>

      {/* 슬라이드 3 — 성별 */}
      <div className={slideClass(3)}>
        <div className="slide-bg-ph" />
        <div className="slide-content">
          <button className="back-btn" onClick={goBack}>← 뒤로</button>
          <h1 className="slide-q">성별은?</h1>
          <div className="gender-row">
            <button className={`gender-btn${gender === 'f' ? ' sel' : ''}`} onClick={() => setGender('f')}>여자</button>
            <button className={`gender-btn${gender === 'm' ? ' sel' : ''}`} onClick={() => setGender('m')}>남자</button>
          </div>
          <button className="next-btn" disabled={!gender} onClick={startLoading}>사주 보기</button>
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
