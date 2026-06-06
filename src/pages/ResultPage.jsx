import { useEffect, useRef } from 'react'
import { buildPanels } from '../data/resultBuilder.js'
import '../styles/result.css'

export default function ResultPage({ data, onRestart }) {
  const containerRef = useRef(null)
  const { year, month, day, hour, name, gender } = data
  const panels = buildPanels(year, month, day, hour, name, gender)

  useEffect(() => {
    const timer = setTimeout(() => {
      containerRef.current?.querySelectorAll('.el-fill').forEach(el => {
        const w = el.style.width
        el.style.width = '0'
        setTimeout(() => { el.style.transition = 'width 1.5s ease'; el.style.width = w }, 50)
      })
    }, 300)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div id="result-phase" ref={containerRef}>
      <div dangerouslySetInnerHTML={{ __html: panels }} />
      <div className="wt finale">
        <span className="fin-icon">☽</span>
        <div className="fin-msg">
          <strong>GYARU FORTUNE REPORT</strong>
          <br /><br />어때~? 완전 나 아니야?!<br />by 루루
        </div>
        <button className="restart-btn" onClick={onRestart}>다시 해볼래~ 처음으로</button>
      </div>
    </div>
  )
}
