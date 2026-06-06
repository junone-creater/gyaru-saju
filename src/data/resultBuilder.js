import { GUIIN, SSINSAL, DAEUN_TXT, YEAR_GRADES, SAMJAE_ADVICE } from './data.js'
import { calcAll, STEM_EL, BRANCH_EL, EL_HJ, EL_KR, pick } from './saju.js'

function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}

// ── 빌더 헬퍼 ──

const atmo = (inner = '', cls = '') =>
  `<div class="atmo-panel ${cls}">
    <div class="atmo-bg"></div><div class="atmo-bg-glow"></div>
    ${inner}
  </div>`

const bubL = txt => `<div class="bubble-sec"><div class="bubble">${txt}</div></div>`
const bubR = txt => `<div class="bubble-sec br"><div class="bubble">${txt}</div></div>`

const stmt = (main, sub = '') =>
  `<div class="stmt-sec">
    <div class="stmt-main">${main}</div>
    ${sub ? `<div class="stmt-sub">${sub}</div>` : ''}
  </div>`

const hanjaHdr = (hanja, kr, comment = '') =>
  `<div class="hanja-hdr">
    <div class="hanja-orn">❖ ─ ❖ ─ ❖</div>
    <div class="hanja-box">
      <span class="hanja-char">${hanja}</span>
      <span class="hanja-kr">${kr}</span>
    </div>
    ${comment ? `<div class="hanja-comment">${comment}</div>` : ''}
  </div>`

const card = (title, body) =>
  `<div class="a-card">
    <div class="a-title">${title}</div>
    <div class="a-body">${body}</div>
  </div>`

const hr = () =>
  `<div class="hr-deco">
    <div class="hr-inner">
      <div class="hr-l"></div><div class="hr-d">❖</div><div class="hr-l"></div>
    </div>
  </div>`

export function buildPanels(year, month, day, hour, name, gender) {
  const { rng, pillars, ec, dom, char, daeun, sj, vs, dateUnknown } =
    calcAll(year, month, day, hour, name, gender)
  const N = esc(name)

  // 사주 타일
  const P_LBL = ['년주', '월주', '일주', '시주']
  const tiles = pillars.map((p, i) => `
    <div class="s-tile ${p.unknown ? 'metal' : STEM_EL[p.si]}">
      <span class="s-lbl">${P_LBL[i]}</span>
      <span class="s-s ${p.unknown ? 'metal' : STEM_EL[p.si]}">${p.stem}</span>
      <span class="s-b ${p.unknown ? 'metal' : BRANCH_EL[p.bi]}">${p.branch}</span>
    </div>`).join('')

  const grades = [...YEAR_GRADES].sort(() => rng() - .5)
  const years  = [2026, 2027, 2028, 2029, 2030]
  const sjMap  = {}
  for (const s of sj) sjMap[s.year] = s.type
  const sal  = pick(rng, SSINSAL)
  const sal2 = pick(rng, SSINSAL.filter(s => s !== sal))
  const gi   = pick(rng, GUIIN)

  const out = []

  // ══ 인트로 ══
  out.push(atmo(`
    <span class="atmo-label">GYARU FORTUNE</span>
    <div class="atmo-title">너의 사주를 보는<br/>갸루야</div>
    <div class="atmo-deco">사주</div>
  `, 'atmo-big'))

  out.push(bubL('오~! 왔어?<br/>기다렸어~ 앉아봐.'))

  // ══ 이름 + 사주 타일 ══
  const siNames = ['자','축','인','묘','진','사','오','미','신','유','술','해']
  const siLabel = hour >= 0 ? ` · ${siNames[Math.floor(((hour+1)%24)/2)]}시` : ''
  out.push(`<div class="name-section">
    ${!dateUnknown
      ? `<div class="ns-info">${year}년 ${month}월 ${day}일${siLabel}</div>`
      : ''}
    <div class="ns-label">사주의 주인공</div>
    <div class="ns-name">${N}</div>
  </div>`)
  out.push(`<div class="saju-tiles">${tiles}</div>`)

  // ══ 첫 인상 ══
  out.push(bubR('흠...<br/>잠깐만 봐봐~'))
  out.push(atmo(`<div class="atmo-deco">氣</div>`, 'atmo-sm'))
  out.push(stmt(
    `기운이 꽤 강하군<br/><span class="red">보통 팔자가 아닌데?</span>`,
    `${EL_HJ[dom]}(${EL_KR[dom]}) 기운이 지배적인 사주야. 이게 바로 너를 너답게 만드는 핵심 에너지거든.`
  ))

  // ══ 너는 어떤 사람? ══
  out.push(atmo(`<div class="atmo-deco">人</div>`, 'atmo-sm'))
  out.push(stmt(
    `넌 이게 고민이어서<br/>여기까지 온 것이로군`,
    `지금 느끼는 그 막막함, 다 이유가 있어. 네 사주에 다 적혀 있거든.`
  ))
  out.push(bubL(`${char.name}이잖아~!<br/>딱 봐도 느껴졌어.`))
  out.push(card(
    '── 너는 이런 사람이야 ──',
    `${char.intro}<br/><br/>` +
    char.traits.slice(0, 3).map(t => `· ${t}`).join('<br/>')
  ))
  out.push(card(
    '── 네 팔자의 신살 ──',
    `<strong class="red">${sal.n}</strong> — ${sal.d}<br/><br/>` +
    `<strong class="red">${sal2.n}</strong> — ${sal2.d}`
  ))
  out.push(bubR(`그래서 넌 이걸 고민해서<br/>여기까지 온 것이로군...`))

  // ══ 大運 ══
  out.push(hr())
  out.push(hanjaHdr('大運', '대   운', '잠깐, 네 사주 보고 있으니까'))
  out.push(atmo(`<div class="atmo-deco">運</div>`, 'atmo-sm'))
  out.push(bubL('나는 좋은 말만<br/>해주지는 않아...'))
  out.push(stmt(
    `이제 하나씩<br/>이야기 해볼까?`,
    `대운은 10년마다 찾아오는 인생의 큰 기운이야. 이 흐름을 알면 언제 달리고 언제 쉬어야 할지 보여.`
  ))
  out.push(`<div class="de-list">
    ${daeun.slice(0, 6).map(de => `
      <div class="de-item">
        <div class="de-age">${de.age}~${de.end}세</div>
        <div class="de-gz">
          <span class="${STEM_EL[de.si]}">${de.stem}</span><span class="${BRANCH_EL[de.bi]}">${de.branch}</span>
        </div>
        <div class="de-txt">${pick(rng, DAEUN_TXT[STEM_EL[de.si]])}</div>
      </div>`).join('')}
  </div>`)
  out.push(stmt(
    `어떻게 흐름을<br/>잘 탈 수 있는지<br/><span class="gold">모조리 다 알려줬어</span>`
  ))

  // ══ 財物 ══
  out.push(hr())
  out.push(hanjaHdr('財物', '재   물', '어차피... 돈 때문에 왔지?'))
  out.push(atmo(`<div class="atmo-deco">財</div>`, 'atmo-sm'))
  out.push(bubL('잠깐 손 좀 줘봐~'))
  out.push(stmt(
    `네 팔자에 돈이<br/>있나 없나<br/><span class="red">그게 제일 궁금하잖아</span>`
  ))
  out.push(card(
    '── 재물운 분석 ──',
    pick(rng, [
      `<strong>재물운이 보통 사주가 아니야.</strong><br/><br/>` +
      `${EL_HJ[dom]} 기운을 잘 활용하면 큰 돈이 모여. 수입 스타일은 <strong class="red">${pick(rng,['꾸준한 안정형','대박 기회형','다양한 부업형','실력 기반형'])}</strong>이야.<br/><br/>` +
      `단, <span class="em">${vs.g} 기운 강한 날</span>은 큰 지출 피해봐. 행운 아이템은 ${vs.y} 계열 색상.`,

      `<strong>재물운의 파동이 있어.</strong><br/><br/>` +
      `기회는 주기적으로 와. 올 때 확실히 잡는 게 핵심. 재테크는 <strong class="red">${pick(rng,['안정형 예·적금','부동산 관심형','주식·펀드 분산형'])} 추천</strong>.<br/><br/>` +
      `행운 아이템: <span class="em">${pick(rng,['금색 지갑','자수정 악세사리','옥 소품','나무 소품'])}</span>.`
    ])
  ))
  out.push(bubR(`시기와 방법은<br/>이미 정해져 있어.<br/>그 기회를 잡으면 돼.`))

  // ══ 緣愛 ══
  out.push(hr())
  out.push(hanjaHdr('緣愛', '연   애', '네가 다음에 만날 이성?'))
  out.push(atmo(`<div class="atmo-deco">愛</div>`, 'atmo-sm'))
  out.push(bubL('화궁으로 한 번 보자~'))
  out.push(stmt(
    `보통 인물은 아나군<br/><span class="red">화궁으로 어떤 게 보어</span>`
  ))
  out.push(card(
    '── 연애 스타일 ──',
    `${char.couple}<br/><br/>` +
    `<strong>좋은 인연 만나는 장소:</strong> <span class="em">${pick(rng,['취미 모임이나 클래스','친구 소개 자리','일 관련 만남','여행지 우연한 만남'])}</span><br/><br/>` +
    `귀인 유형: <strong class="red">${gi.t}</strong> — ${gi.d}`
  ))
  out.push(card(
    '── 결혼·인연운 ──',
    pick(rng, [
      `인연운이 꽤 강해. <strong>연애보다 결혼으로 연결될 확률이 높은 사주야.</strong> 진지하게 만나는 편이 맞아.`,
      `자유로운 연애를 즐기는 사주야. <strong>억지로 서두를 필요 없어.</strong> 때가 되면 자연스럽게 와.`,
      `인연은 <strong>예상치 못한 타이밍</strong>에 와. 준비된 사람한테 좋은 인연이 오는 법이야.`,
    ])
  ))
  out.push(bubR(`이거 말고도<br/>할 얘기가 산더미라고`))

  // ══ 5년 운세 ══
  out.push(hr())
  out.push(stmt(
    `앞으로 5년<br/><span class="gold">스포일러</span>`,
    '매년 찾아오는 운의 흐름이야. 알고 가면 훨씬 유리해.'
  ))
  out.push(`<div class="yr-list">
    ${years.map((yr, i) => {
      const g = grades[i % grades.length]
      const sjType = sjMap[yr]
      return `<div class="yr-item">
        <div class="yr-yr">${yr}년</div>
        <div class="yr-grade">${g.g}</div>
        <div class="yr-desc">${g.d}</div>
        ${sjType ? `<div class="yr-sj">⚠️ ${yr}년 ${sjType}삼재 — 조심해</div>` : ''}
      </div>`
    }).join('')}
    ${sj.length === 0
      ? `<div class="yr-item">
          <div class="yr-grade" style="color:#4a9a4a">✅ 2026~2030년 삼재 없음</div>
          <div class="yr-desc">앞으로 5년 삼재 걱정 없이 달려도 돼! 완전 럭키야~</div>
        </div>`
      : ''}
  </div>`)

  // ══ 아웃트로 ══
  out.push(atmo(`
    <div class="atmo-title">오직 ${N},<br/>너를 위한 이야기들</div>
    <div class="atmo-deco">갸루</div>
  `, 'atmo-big'))

  return out.join('')
}
