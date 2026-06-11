import { useEffect, useMemo, useRef } from 'react'
import { buildPanels } from '../data/resultBuilder.js'
import '../styles/result.css'

export default function ResultPage({ data, onRestart }) {
  const { year, month, day, hour, name, gender, originalDate } = data
  const resultRef = useRef(null)
  const applyUrl = import.meta.env.VITE_APPLY_URL || '#apply'
  const panels = useMemo(
    () => buildPanels(year, month, day, hour, name, gender, originalDate),
    [year, month, day, hour, name, gender, originalDate],
  )

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
    const cuts = [...resultRef.current.querySelectorAll('.toon-reveal')]

    if (!('IntersectionObserver' in window)) {
      cuts.forEach(cut => cut.classList.add('is-visible'))
      return undefined
    }

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return
        entry.target.classList.add('is-visible')
        observer.unobserve(entry.target)
      })
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 })

    cuts.forEach(cut => observer.observe(cut))
    return () => observer.disconnect()
  }, [panels])

  return (
    <main id="result-phase" ref={resultRef} aria-label={`${name}님의 유이짱 사주 결과`}>
      <div className="toon-flow" dangerouslySetInnerHTML={{ __html: panels }} />
      <button className="restart-link" onClick={onRestart}>처음부터 다시 보기</button>
      <aside className="apply-dock" aria-label="1:1 사주 리딩 신청">
        <div>
          <span>YUI PRIVATE READING</span>
          <strong>딱 15명만 신청 가능</strong>
        </div>
        <a href={applyUrl}>신청하기</a>
      </aside>
    </main>
  )
}
