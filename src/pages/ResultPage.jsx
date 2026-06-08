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
    cuts.forEach((cut, index) => cut.style.setProperty('--cut-index', index))

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
    }, {
      rootMargin: '0px 0px -10% 0px',
      threshold: 0.08,
    })

    cuts.forEach(cut => observer.observe(cut))
    return () => observer.disconnect()
  }, [panels])

  return (
    <main id="result-phase" ref={resultRef} aria-label={`${name}님의 갸루 사주 결과`}>
      <div className="toon-flow" dangerouslySetInnerHTML={{ __html: panels }} />
      <section className="toon-cut toon-reveal ending-sec" id="apply">
        <span className="ending-ico">✦</span>
        <div className="ending-msg">
          <strong>여기서 더 반짝 열 수 있어</strong>
          <br /><br />방금 “헐?” 했던 문장 있지?<br />그게 지금 봐야 할 질문이야.
        </div>
        <p className="ending-note">
          돈, 연애, 일, 타이밍 중 지금 제일 걸리는 주제로 이어서 딥하게 봐줄게.
        </p>
        <a className="restart-btn apply-ending-btn" href={applyUrl}>1:1 리딩 신청하기</a>
        <button className="restart-btn" onClick={onRestart}>다시 반짝 보기</button>
      </section>
      <aside className="apply-dock" aria-label="1:1 리딩 신청">
        <div className="apply-dock-copy">
          <span>GAL PRIVATE READING</span>
          <strong>내 사주 딥하게 보기</strong>
        </div>
        <a href={applyUrl}>신청하기</a>
      </aside>
    </main>
  )
}
