import { buildPanels } from '../data/resultBuilder.js'
import '../styles/result.css'

export default function ResultPage({ data, onRestart }) {
  const { year, month, day, hour, name, gender } = data
  const panels = buildPanels(year, month, day, hour, name, gender)

  return (
    <div id="result-phase">
      <div dangerouslySetInnerHTML={{ __html: panels }} />
      <div className="ending-sec">
        <span className="ending-ico">✦</span>
        <div className="ending-msg">
          <strong>GYARU FORTUNE REPORT</strong>
          <br /><br />어때~? 완전 나 아니야?!<br />by 갸루
        </div>
        <button className="restart-btn" onClick={onRestart}>다시 처음부터~</button>
      </div>
    </div>
  )
}
