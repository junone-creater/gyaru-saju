import { GUIIN, SSINSAL, DAEUN_TXT, YEAR_GRADES } from './data.js'
import { calcAll, STEM_EL, BRANCH_EL, EL_HJ, EL_KR, pick } from './saju.js'
import gyaruReaderUrl from '../assets/gyaru-fortune-reader.jpg'
import gyaruOpeningUrl from '../assets/gyaru-opening.jpg'
import gyaruTimingUrl from '../assets/gyaru-timing.jpg'
import gyaruLoveUrl from '../assets/gyaru-love.jpg'
import gyaruSelfcareUrl from '../assets/gyaru-selfcare.jpg'

function esc(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const APPLY_URL = import.meta.env.VITE_APPLY_URL || '#apply'

// 캐릭터 이미지가 준비되면 true 로 바꾸면 실제 사진이 들어가요.
// false 인 동안은 이미지 자리를 깔끔한 플레이스홀더로 비워둡니다.
const IMAGES_READY = false

const cut = (number, content, className = '') => `
  <section class="story-cut toon-reveal ${className}" data-cut="${String(number).padStart(2, '0')}">
    ${content}
  </section>
`

const photo = (src, alt = '') =>
  IMAGES_READY
    ? `<img class="scene-photo" src="${src}" alt="${alt}" loading="lazy" />`
    : `<div class="scene-photo scene-photo-ph" role="img" aria-label="${esc(alt)}">
        <span aria-hidden="true">☾</span>
        <small>이미지 자리</small>
      </div>`

const shade = '<div class="scene-shade" aria-hidden="true"></div>'

const bubble = (content, className = '') =>
  `<div class="speech ${className}">${content}</div>`

const kicker = text => `<span class="scene-kicker">${text}</span>`

const title = (content, className = '') =>
  `<h2 class="scene-title ${className}">${content}</h2>`

const body = content => `<div class="scene-copy">${content}</div>`

const sticker = (content, className = '') =>
  `<span class="deco-sticker ${className}" aria-hidden="true">${content}</span>`

export function buildPanels(year, month, day, hour, name, gender, originalDate) {
  const forecastStartYear = new Date().getFullYear()
  const { rng, pillars, dom, char, daeun, sj, vs, dateUnknown } =
    calcAll(year, month, day, hour, name, gender, forecastStartYear)
  const N = esc(name || '너')
  const shownDate = originalDate || { year, month, day, isLunar: false }
  const calendarLabel = shownDate.isLunar ? '음력' : '양력'
  const birthTime = shownDate.birthTime || (hour >= 0 ? `${String(hour).padStart(2, '0')}:00` : '시간 미상')
  const birthLine = dateUnknown
    ? '생년월일 미입력'
    : `${calendarLabel} ${shownDate.year}년 ${shownDate.month}월 ${shownDate.day}일 ${birthTime}`
  const sal = pick(rng, SSINSAL)
  const sal2 = pick(rng, SSINSAL.filter(item => item !== sal))
  const gi = pick(rng, GUIIN)
  const moneyType = pick(rng, ['꾸준한 실력 수입형', '기회를 크게 잡는 한방형', '여러 길을 동시에 여는 부업형', '사람을 통해 판이 커지는 연결형'])
  const relationTrap = pick(rng, ['상대의 가능성까지 대신 믿어주는 것', '싫다는 말을 너무 늦게 하는 것', '분위기를 지키느라 속마음을 숨기는 것', '한 번 정 준 사람을 오래 기다리는 것'])
  const luckyAction = pick(rng, ['미뤄둔 연락 먼저 하기', '결정한 일에 마감 시간 붙이기', '싫은 건 짧게라도 말하기', '작은 약속부터 바로 실행하기'])
  const nextYear = forecastStartYear + 1

  const tiles = pillars.map((pillar, index) => {
    const labels = ['년주', '월주', '일주', '시주']
    const stemElement = pillar.unknown ? 'metal' : STEM_EL[pillar.si]
    const branchElement = pillar.unknown ? 'metal' : BRANCH_EL[pillar.bi]
    return `
      <div class="pillar-card">
        <span>${labels[index]}</span>
        <strong class="${stemElement}">${pillar.stem}</strong>
        <b class="${branchElement}">${pillar.branch}</b>
      </div>
    `
  }).join('')

  const tenGods = ['비견', '겁재', '식신', '상관', '편재', '정재', '편관', '정관', '편인', '정인']
  const highlighted = new Set([
    Math.floor(rng() * tenGods.length),
    Math.floor(rng() * tenGods.length),
    Math.floor(rng() * tenGods.length),
  ])
  const tenGodChips = tenGods.map((label, index) =>
    `<span class="${highlighted.has(index) ? 'is-hot' : ''}">${label}</span>`
  ).join('')

  const flowCards = daeun.slice(0, 3).map(item => `
    <div class="flow-card">
      <span>${item.age}~${item.end}세</span>
      <strong>${item.stem}${item.branch}</strong>
      <p>${pick(rng, DAEUN_TXT[STEM_EL[item.si]])}</p>
    </div>
  `).join('')

  const yearCards = Array.from({ length: 3 }, (_, index) => {
    const targetYear = forecastStartYear + index
    const grade = YEAR_GRADES[index % YEAR_GRADES.length]
    const samjae = sj.find(item => item.year === targetYear)
    return `
      <div class="mini-fortune">
        <span>${targetYear}</span>
        <strong>${grade.g}</strong>
        <p>${samjae ? `${samjae.type}삼재, 서두르기보다 점검이 먼저` : grade.d}</p>
      </div>
    `
  }).join('')

  const out = []

  out.push(cut(1, `
    ${photo(gyaruReaderUrl, '사주 카드를 든 유이짱')}
    ${shade}
    <div class="leopard-layer" aria-hidden="true"></div>
    <div class="cover-book" aria-hidden="true"><span>YUI</span><b>四柱</b></div>
    <div class="cover-copy">
      ${kicker('YUI’S SECRET READING')}
      <h1>유이짱의<br/><em>초특급 사주 분석</em></h1>
      <p>“너... 생각보다 훨씬<br/>흥미로운 팔자네~?(¬‿¬)♡”</p>
    </div>
    <div class="scroll-hint">OPEN YOUR FATE <span>↓</span></div>
  `, 'cover-cut dark-cut'))

  out.push(cut(2, `
    ${photo(gyaruOpeningUrl, '상대를 바라보는 유이짱')}
    ${shade}
    <div class="top-intro">
      ${kicker('HELLO BABE')}
      ${title('안녕~!<br/>난 <em>유이짱</em>이야♡')}
    </div>
    ${bubble('너 사주...<br/><strong>너~무 흥미롭다♡</strong>', 'speech-bottom')}
    <div class="birth-tag"><span>${birthLine}</span><strong>${N}짱~!</strong></div>
  `, 'photo-story gaze-cut'))

  out.push(cut(3, `
    <div class="peek-photo">${photo(gyaruReaderUrl, '눈만 빼꼼 보이는 유이짱')}</div>
    ${sticker('OMG!', 'sticker-left')}
    ${body(`
      <p>옴마나~!</p>
      <h2>너 기운이<br/><em>꽤 세당?♡</em></h2>
      <p>너 진짜 보통 팔자가 아닌데~?</p>
      <p>딱 봐도 알지☆<br/>유이짱은 못 속여~(¬‿¬)♡</p>
    `)}
  `, 'peek-cut pink-paper'))

  out.push(cut(4, `
    ${photo(gyaruTimingUrl, '살짝 내려다보는 유이짱')}
    ${shade}
    ${bubble(`
      <span>이게 고민되는 거지~?</span>
      <strong>너 어떤 사람인지도☆<br/>너 고민이 뭔지도☆</strong>
      <b>딱 봐도 알징~♡</b>
    `, 'speech-center')}
  `, 'photo-story lookdown-cut'))

  out.push(cut(5, `
    ${kicker('YUI KNOWS')}
    ${title('결정 다 해놓고<br/><em>마지막 확인만 37번</em><br/>하는 거 맞지~?(¬‿¬)♡')}
    <div class="check-list">
      <p>좋아하는 것도 오래 고민하고☆</p>
      <p>사는 것도 오래 고민하고☆</p>
      <p>떠나는 것도 오래 고민해☆</p>
    </div>
    <div class="punch-copy">그렇게 고민하다 타이밍 놓치고<br/><strong>“에이~ 원래 내 거 아니었나 보네♡”</strong><br/>하고 넘겨버리잖아~(&gt;_&lt;)💦</div>
    ${sticker('37', 'number-sticker')}
  `, 'confession-cut leopard-paper'))

  out.push(cut(6, `
    <div class="starburst" aria-hidden="true"></div>
    ${kicker('THE REASON')}
    ${title(`${N}짱이 지금<br/>이게 고민되는 이유☆`)}
    <p class="big-answer">유이짱은 알지~♡<br/><strong>바로 니 팔자 때문이야</strong><br/>(¬‿¬)✨</p>
  `, 'impact-cut dark-cut'))

  out.push(cut(7, `
    ${kicker('四柱命式 · SAJU CHART')}
    ${title(`${N}짱의<br/><em>사주 명식</em>`)}
    <p class="chart-date">${birthLine}</p>
    <div class="pillar-grid">${tiles}</div>
    <div class="element-summary">
      <span>핵심 기운</span>
      <strong>${EL_HJ[dom]} · ${EL_KR[dom]}</strong>
      <p>${char.name} 무드가 강하게 보여</p>
    </div>
    <div class="ten-gods">${tenGodChips}</div>
    <div class="sinsal-row">
      <span>신살 분석</span><strong>${sal.n}</strong><strong>${sal2.n}</strong>
    </div>
  `, 'chart-cut pink-paper'))

  out.push(cut(8, `
    ${photo(gyaruLoveUrl, '귀엽게 올려다보는 유이짱')}
    ${shade}
    ${bubble('니 팔자가<br/><strong>어떻게 흘러가는지</strong><br/>궁금하지~?♡', 'speech-bottom wide-speech')}
  `, 'photo-story soft-cut'))

  out.push(cut(9, `
    ${sticker('OPEN', 'sticker-right')}
    ${title('니 눈앞에<br/><em>완전 적나라하게</em><br/>보여줄 수 있엉~(¬‿¬)♡')}
    <div class="sparkle-frame" aria-hidden="true">✦ ♡ ✦</div>
  `, 'promise-cut gem-paper'))

  out.push(cut(10, `
    ${photo(gyaruSelfcareUrl, '생각에 잠긴 유이짱')}
    ${shade}
    ${bubble('그런데 말이야~♡', 'speech-top')}
  `, 'photo-story thinking-cut'))

  out.push(cut(11, `
    <span class="beep">삐빅☆</span>
    ${title('좋은 말만은<br/><em>안 한다~?</em><br/>(¬‿¬)♡')}
    <div class="warning-tape">REAL TALK · REAL TALK · REAL TALK</div>
  `, 'warning-cut'))

  out.push(cut(12, `
    ${photo(gyaruReaderUrl, '고개를 갸웃하는 유이짱')}
    ${shade}
    <div class="question-mark">?</div>
    ${bubble('설마 벌써<br/>찔린 건 아니지~?♡', 'speech-bottom')}
  `, 'photo-story tilt-cut'))

  out.push(cut(13, `
    ${kicker('REPEAT WARNING')}
    ${title('⚠ 니 인생에서<br/><em>반복될 수 있는 문제</em> ⚠')}
    <div class="problem-card">
      <strong>“알아서 알아주겠지~”</strong>
      <p>이 생각 때문에 손해 본 적 있지~?(¬‿¬)♡</p>
      <ul>
        <li>고맙다는 말도 못 하고☆</li>
        <li>섭섭하다는 말도 못 하고☆</li>
        <li>좋아한다는 말도 못 하고☆</li>
      </ul>
      <p>참을 만큼 참다가 어느 날 갑자기<br/><b>“나 이제 못 하겠어”</b><br/>하고 사라지는 패턴(&gt;_&lt;)💦</p>
    </div>
    <p class="chill-line">근데 더 소름 돋는 건~<br/><strong>이게 한 번이 아니라는 거야♡</strong></p>
  `, 'problem-cut dark-cut'))

  out.push(cut(14, `
    ${photo(gyaruOpeningUrl, '상대를 가리키는 유이짱')}
    ${shade}
    ${sticker('KEY', 'sticker-left')}
    <div class="method-heading">✨ 니 팔자를<br/>제대로 쓰는 방법 ✨</div>
    ${bubble('궁금하지~?♡', 'speech-bottom')}
  `, 'photo-story point-cut gem-overlay'))

  out.push(cut(15, `
    ${kicker('YUI’S ADVICE')}
    ${title('니 문제는<br/><em>능력 부족이 아니야~☆</em>')}
    <p class="advice-lead">생각보다 너무 오래 참는 거야(¬‿¬)♡</p>
    <div class="action-grid">
      <span>확인만 하지 말고<br/><strong>표현도 하고☆</strong></span>
      <span>기다리지만 말고<br/><strong>움직여봐☆</strong></span>
    </div>
    <p class="advice-result">니 팔자는 생각만 할 때보다<br/><strong>움직이는 순간 훨씬 크게 열리거든</strong><br/>(°▽°)✨</p>
    <div class="throw-away">“알아서 알겠지”<br/><b>그거 버려~♡</b><br/><small>말해야 알더라구~?(&gt;_&lt;)💦</small></div>
  `, 'advice-cut pink-paper'))

  out.push(cut(16, `
    <div class="lace-frame" aria-hidden="true"></div>
    ${title('후훗♡')}
    <p>이거 말고도 할 얘기가<br/><strong>엄청 많다구~(¬‿¬)✨</strong></p>
  `, 'tease-cut dark-cut'))

  out.push(cut(17, `
    ${photo(gyaruTimingUrl, '의자에 앉아 내려다보는 유이짱')}
    ${shade}
    ${bubble('그래서~<br/><strong>복채는 준비했어~?♡</strong>', 'speech-bottom wide-speech')}
    <div class="only-you">오직 <strong>${N}짱</strong>만을 위한 이야기✨</div>
  `, 'photo-story payment-cut'))

  out.push(cut(18, `
    <div class="stop-hand">✋</div>
    ${bubble('잠깐♡<br/><strong>무슨 생각해~?☆</strong>', 'speech-center')}
    ${sticker('STOP!', 'sticker-right')}
  `, 'stop-cut leopard-paper'))

  out.push(cut(19, `
    ${title('설마~<br/>다른 운세 알려주는 곳이랑<br/><em>똑같다고 생각한 건 아니지~?</em>')}
    <div class="stupid-burst">스투핏~!!<small>(&gt;_&lt;)💦</small></div>
  `, 'difference-cut hot-cut'))

  out.push(cut(20, `
    ${kicker('WHOLE LIFE READING')}
    ${title('유이짱 사주는♡')}
    <div class="life-line"><span>태어난 순간</span><i></i><span>눈을 감는 순간</span></div>
    <p>네 인생의 흐름을<br/><strong>전부 알려준다구~(¬‿¬)✨</strong></p>
  `, 'lifetime-cut dark-cut'))

  out.push(cut(21, `
    <div class="door-glow" aria-hidden="true"></div>
    ${title('너가 보게 될<br/><em>마지막 사주☆</em>')}
    <p>그리고</p>
    <strong class="destiny-line">운명을 바꿀 기회✨</strong>
  `, 'destiny-cut gem-paper'))

  out.push(cut(22, `
    ${photo(gyaruLoveUrl, '연애 카드를 든 유이짱')}
    ${shade}
    ${kicker('LOVE & OBSESSION')}
    <div class="topic-card">
      <h2>연애 패턴 · 집착</h2>
      <p>${char.couple}</p>
      <strong>반복 포인트</strong>
      <p>${relationTrap}</p>
      <span>귀인 타입 · ${gi.t}</span>
    </div>
  `, 'topic-cut love-topic'))

  out.push(cut(23, `
    ${kicker('RELATIONSHIP FILTER')}
    ${title('인간관계 · 호구 패턴<br/><em>가짜 인연까지</em>')}
    <div class="relation-card">
      <span>네가 약해지는 순간</span>
      <strong>${char.weak}</strong>
      <p>좋은 사람으로 남으려다 네 기준을 늦게 말하면, 맞지 않는 인연이 오래 눌러앉기 쉬워.</p>
    </div>
    <div class="fake-stamp">FAKE<br/>OUT</div>
  `, 'relation-cut pink-paper'))

  out.push(cut(24, `
    ${photo(gyaruTimingUrl, '타이밍을 읽는 유이짱')}
    ${shade}
    ${kicker('LUCKY TIMING')}
    <div class="flow-panel">
      <h2>행운 타이밍 · 성공 시기</h2>
      <div class="flow-list">${flowCards}</div>
      <p>${luckyAction}부터 시작하면 흐름을 네 편으로 돌리기 좋아.</p>
    </div>
  `, 'topic-cut timing-topic'))

  out.push(cut(25, `
    ${kicker('MONEY FLOW')}
    ${title(`재물 흐름<br/><em>${moneyType}</em>`)}
    <div class="money-note">
      <p>돈 감각이 없는 타입은 아니야.</p>
      <strong>${vs.g} 기운이 강한 날엔<br/>기분 따라 새는 돈만 조심☆</strong>
    </div>
    <div class="year-preview">${yearCards}</div>
    <p class="locked-preview">${nextYear}년 이후의 진짜 분기점은<br/>1:1 리딩에서 전부 이어서 보여줄게♡</p>
  `, 'money-cut leopard-paper'))

  out.push(cut(26, `
    ${photo(gyaruReaderUrl, '마지막 리딩을 권하는 유이짱')}
    ${shade}
    <div class="final-panel">
      ${kicker('PRIVATE READING · ONLY 15')}
      ${bubble('여기까지 봤으면<br/><strong>느낌 왔잖아~?(¬‿¬)♡</strong><br/><small>근데 이건 겉만 본 거야☆</small>')}
      <h2>너 사주 속까지<br/>싹 다 뜯어봐주는 곳이 있어♡</h2>
      <div class="service-chips"><span>연애♡</span><span>진로♡</span><span>인간관계♡</span><span>돈♡</span></div>
      <p>전부 1:1로 분석해줘(°▽°)✨</p>
      <div class="review-box">
        <strong>해본 사람들? 다 소름 돋았다더라~</strong>
        <span>“내 얘기 그대로야”</span>
        <span>“왜 진작 안 했지?”</span>
      </div>
      <p class="limit-copy">근데 아무나 못 해☆<br/><strong>딱 15명만 가능하거든~(&gt;_&lt;)✋</strong></p>
      <a class="final-cta" href="${APPLY_URL}">지금 바로 신청하기 <span>→</span></a>
      <p class="last-nudge">안 하면~? 또 같은 하루 반복이야☆<br/><strong>나라면 안 참는데~?(¬‿¬)✨</strong></p>
    </div>
  `, 'final-cut dark-cut', 'apply'))

  return out.join('')
}
