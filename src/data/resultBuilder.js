import { GUIIN, SSINSAL, DAEUN_TXT, YEAR_GRADES, SAMJAE_ADVICE } from './data.js'
import { calcAll, STEM_EL, BRANCH_EL, EL_HJ, EL_KR, pick } from './saju.js'
import gyaruReaderUrl from '../assets/gyaru-fortune-reader.jpg'
import gyaruOpeningUrl from '../assets/gyaru-opening.jpg'
import gyaruTimingUrl from '../assets/gyaru-timing.jpg'
import gyaruLoveUrl from '../assets/gyaru-love.jpg'
import gyaruSelfcareUrl from '../assets/gyaru-selfcare.jpg'

function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}

// ── 빌더 헬퍼 ──

const atmo = (inner = '', cls = '') =>
  `<section class="toon-cut toon-reveal atmo-panel ${cls}">
    <div class="atmo-bg"></div><div class="atmo-bg-glow"></div>
    <div class="scene-speedlines" aria-hidden="true"></div>
    ${inner}
  </section>`

const bubble = (txt, side) =>
  `<section class="toon-cut toon-reveal bubble-sec ${side}">
    <div class="toon-speaker" aria-hidden="true"><span>GY</span></div>
    <div class="bubble">${txt}</div>
  </section>`

const bubL = txt => bubble(txt, 'bl')
const bubR = txt => bubble(txt, 'br')

const stmt = (main, sub = '') =>
  `<section class="toon-cut toon-reveal stmt-sec">
    <div class="stmt-kicker">갸루 코멘트</div>
    <div class="stmt-main">${main}</div>
    ${sub ? `<div class="stmt-sub">${sub}</div>` : ''}
  </section>`

const hanjaHdr = (hanja, kr, comment = '') =>
  `<section class="toon-cut toon-reveal hanja-hdr">
    <div class="chapter-label">NEW CHAPTER</div>
    <div class="hanja-orn">❖ ─ ❖ ─ ❖</div>
    <div class="hanja-box">
      <span class="hanja-char">${hanja}</span>
      <span class="hanja-kr">${kr}</span>
    </div>
    ${comment ? `<div class="hanja-comment">${comment}</div>` : ''}
  </section>`

const card = (title, body) =>
  `<article class="toon-cut toon-reveal a-card">
    <div class="a-title">${title}</div>
    <div class="a-body">${body}</div>
  </article>`

const APPLY_URL = import.meta.env.VITE_APPLY_URL || '#apply'

const ctaCut = (title, body, label = '딥 리딩 신청하기', cls = '') =>
  `<section class="toon-cut toon-reveal cta-cut ${cls}">
    <div class="cta-kicker">LOCKED READING</div>
    <div class="cta-title">${title}</div>
    <p class="cta-body">${body}</p>
    <a class="apply-btn" href="${APPLY_URL}">${label}</a>
  </section>`

const teaserCard = (title, body, locked = '나머지는 1:1 리딩에서 더 반짝하게 열려') =>
  card(title, `${body}<br/><br/><span class="locked-line">${locked}</span>`)

const photoCut = (caption, cls = '', src = gyaruReaderUrl) =>
  `<section class="toon-cut toon-reveal photo-cut ${cls}">
    <img class="photo-img" src="${src}" alt="" loading="lazy" />
    <div class="photo-shade"></div>
    <div class="photo-sticker">GAL PHOTO</div>
    <div class="photo-caption">${caption}</div>
  </section>`

const bridge = txt =>
  `<section class="toon-cut toon-reveal bridge-cut">
    <div class="bridge-mark">그리고</div>
    <p>${txt}</p>
  </section>`

const hr = () =>
  `<div class="episode-gap" aria-hidden="true">
    <div class="hr-inner">
      <div class="hr-l"></div><div class="hr-d">다음 리딩</div><div class="hr-l"></div>
    </div>
  </div>`

export function buildPanels(year, month, day, hour, name, gender, originalDate) {
  const forecastStartYear = new Date().getFullYear()
  const { rng, pillars, ec, dom, char, daeun, sj, vs, dateUnknown } =
    calcAll(year, month, day, hour, name, gender, forecastStartYear)
  const N = esc(name)

  // 사주 타일
  const P_LBL = ['년주', '월주', '일주', '시주']
  const tiles = pillars.map((p, i) => `
    <div class="s-tile ${p.unknown ? 'metal' : STEM_EL[p.si]}">
      <span class="s-lbl">${P_LBL[i]}</span>
      <span class="s-s ${p.unknown ? 'metal' : STEM_EL[p.si]}">${p.stem}</span>
      <span class="s-b ${p.unknown ? 'metal' : BRANCH_EL[p.bi]}">${p.branch}</span>
    </div>`).join('')

  const grades = [...YEAR_GRADES]
  for (let i = grades.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[grades[i], grades[j]] = [grades[j], grades[i]]
  }
  const years = Array.from({ length: 5 }, (_, index) => forecastStartYear + index)
  const sjMap  = {}
  for (const s of sj) sjMap[s.year] = s.type
  const sal  = pick(rng, SSINSAL)
  const sal2 = pick(rng, SSINSAL.filter(s => s !== sal))
  const gi   = pick(rng, GUIIN)
  const shownDate = originalDate || { year, month, day, isLunar: false }
  const calendarLabel = shownDate.isLunar ? '음력(평달)' : '양력'
  const luckyPlace = pick(rng, ['거울 있는 카페', '햇빛 잘 드는 산책길', '음악 나오는 작업 공간', '향 좋은 편집숍', '물가 근처 조용한 자리'])
  const luckyAction = pick(rng, ['아침에 일정 3개만 고르기', '지갑 영수증 비우기', '친구에게 먼저 연락하기', '미뤄둔 예약 잡기', '책상 위 반짝템 하나 두기'])
  const stressCare = pick(rng, ['수면 리듬', '어깨와 목 긴장', '소화 컨디션', '눈 피로', '감정 소모'])

  const out = []

  // ══ 인트로 ══
  out.push(atmo(`
    <span class="atmo-label">GAL FORTUNE SALON</span>
    <div class="atmo-title">네 팔자<br/><strong>살짝만 열게</strong></div>
    <div class="atmo-deco">GAL</div>
    <div class="opening-scroll">SCROLL TO READ <span>↓</span></div>
  `, 'atmo-big opening-cut'))

  out.push(bubL('오~ 왔어?<br/>완전 반가움. 일단 자리 잡아봐~'))
  out.push(photoCut('카드 펼쳤고, 오늘 네 무드 반짝하게 한 장씩 넘겨볼게.', 'photo-opening', gyaruOpeningUrl))
  out.push(ctaCut(
    '일단 맛보기부터 갈게',
    '무료 리딩은 핵심만 톡 찍어줄게. 읽다가 “헐 이거 나잖아?” 싶으면 거기가 딥하게 볼 포인트야.',
    '내 사주 더 열어보기',
    'cta-early'
  ))

  // ══ 이름 + 사주 타일 ══
  const siNames = ['자','축','인','묘','진','사','오','미','신','유','술','해']
  const birthTimeLabel = shownDate.birthTime ? ` ${shownDate.birthTime}` : ''
  const siLabel = hour >= 0 ? `${birthTimeLabel} · ${siNames[Math.floor(((hour+1)%24)/2)]}시` : ''
  out.push(`<section class="toon-cut toon-reveal profile-cut">
    <div class="profile-sfx" aria-hidden="true">야호!</div>
    <div class="name-section">
      ${!dateUnknown
        ? `<div class="ns-info">${calendarLabel} ${shownDate.year}년 ${shownDate.month}월 ${shownDate.day}일${siLabel}</div>`
        : ''}
      <div class="ns-label">사주의 주인공</div>
      <div class="ns-name">${N}</div>
    </div>
    <div class="saju-tiles">${tiles}</div>
  </section>`)
  out.push(photoCut('네 사주판 열렸어. 이름 옆에 붙은 기운부터 야무지게 체크 들어간다~', 'photo-profile', gyaruReaderUrl))

  // ══ 첫 인상 ══
  out.push(bubR('흠...<br/>첫 느낌부터 완전 선명한데?'))
  out.push(atmo(`<div class="atmo-deco">氣</div>`, 'atmo-sm gal-flash'))
  out.push(stmt(
    `핵심 기운이 딱 보여<br/><span class="red">${EL_HJ[dom]}(${EL_KR[dom]}) 무드 강함!</span>`,
    `이 무드는 말투, 선택, 끌리는 사람까지 은근히 밀어. 그래서 성격 파트 보면 더 찰떡으로 보여.`
  ))

  // ══ 너는 어떤 사람? ══
  out.push(bridge('이렇게 기운이 잡히면, 그냥 성격보다 “왜 자꾸 그런 선택을 하는지”가 더 잘 보여. 완전 포인트야.'))
  out.push(atmo(`<div class="atmo-deco">人</div>`, 'atmo-sm gal-flash'))
  out.push(stmt(
    `네 캐릭터<br/>생각보다 뚜렷해`,
    `막막했던 거, 네가 이상해서가 아니라 무드 타이밍이 안 맞았던 걸 수도 있어.`
  ))
  out.push(bubL(`${char.name} 무드잖아~!<br/>그래서 숨겨도 결국 존재감이 톡 튀어나와.`))
  out.push(teaserCard(
    '── 너의 갸루 프로필 ──',
    `${char.intro}<br/><br/>` +
    char.traits.slice(0, 2).map(t => `· ${t}`).join('<br/>'),
    '근데 성격만 알면 아쉬워. 이 무드를 언제 써야 반짝 터지는지가 진짜야.'
  ))
  out.push(teaserCard(
    '── 반짝 포인트 신살 ──',
    `<strong class="red">${sal.n}</strong>이 먼저 떠. 이건 그냥 매력 포인트가 아니라, 사람을 끌어오는 방식이야.<br/><br/>` +
    `숨은 보조 신살은 <strong class="red">${sal2.n}</strong>.`,
    '두 신살이 같이 뜰 때 사람도 오고, 기회도 오고, 사건도 같이 반짝 움직여.'
  ))
  out.push(photoCut('성격 무드는 봤고~ 이제 이 매력이 언제 잘 먹히는지 봐야지.', 'photo-character', gyaruReaderUrl))
  out.push(bubR(`그러니까 다음은 타이밍!<br/>좋은 무드도 때가 안 맞으면 괜히 답답하거든.`))

  // ══ 大運 ══
  out.push(hr())
  out.push(hanjaHdr('大運', '대   운', '네 무드가 언제 버프 받는지 볼게'))
  out.push(atmo(`<div class="atmo-deco">運</div>`, 'atmo-sm gal-flash'))
  out.push(bubL('무조건 좋은 말만 하진 않을게.<br/>대신 쓸모 있게 말해줄게, 오케이?'))
  out.push(stmt(
    `네 인생 큰 흐름<br/>타이밍이 중요해`,
    `대운은 10년짜리 배경음악 같은 거야. 같은 사람도 어떤 무드가 깔리냐에 따라 선택이 달라져.`
  ))
  out.push(`<section class="toon-cut toon-reveal list-cut">
    <div class="list-caption">인생 무드 타임라인</div>
    <div class="de-list">
    ${daeun.slice(0, 3).map(de => `
      <div class="de-item">
        <div class="de-age">${de.age}~${de.end}세</div>
        <div class="de-gz">
          <span class="${STEM_EL[de.si]}">${de.stem}</span><span class="${BRANCH_EL[de.bi]}">${de.branch}</span>
        </div>
        <div class="de-txt">${pick(rng, DAEUN_TXT[STEM_EL[de.si]])}</div>
      </div>`).join('')}
      <div class="de-item locked-item">
        <div class="de-age">다음 흐름</div>
        <div class="de-gz">LOCK</div>
        <div class="de-txt">여기부터는 돈, 관계, 일 무드까지 같이 엮어야 진짜 선명해져.</div>
      </div>
    </div>
  </section>`)
  out.push(stmt(
    `타이밍만 알아도<br/>선택이 훨씬<br/><span class="gold">덜 흔들려</span>`
  ))
  out.push(photoCut('대운은 분위기야. 그리고 그 분위기, 돈 쓰는 스타일에도 바로 묻어나.', 'photo-deep', gyaruTimingUrl))
  out.push(ctaCut(
    '지금 대운, 그냥 넘기면 아깝잖아',
    `${N}님은 좋은 때만 기다리기보다, 지금 무드를 어디에 써야 하는지가 더 중요해.`,
    '내 대운 자세히 보기'
  ))

  // ══ 財物 ══
  out.push(hr())
  out.push(hanjaHdr('財物', '재   물', '타이밍 봤으면 현실템도 봐야지'))
  out.push(atmo(`<div class="atmo-deco">財</div>`, 'atmo-sm gal-flash'))
  out.push(bubL('자, 이제 지갑 얘기~<br/>운 좋아도 돈이 새면 체감 안 오거든.'))
  out.push(stmt(
    `돈이 들어오는 방식<br/><span class="red">네 스타일이 따로 있어</span>`
  ))
  out.push(teaserCard(
    '── 재물운 갸루 리딩 ──',
    `<strong>돈 감각이 없는 타입은 아니야.</strong><br/><br/>` +
    `수입 스타일은 <strong class="red">${pick(rng,['꾸준한 안정형','대박 기회형','다양한 부업형','실력 기반형'])}</strong>. 단, ${vs.g} 기운 강한 날은 새는 돈이 생기기 쉬워.`,
    '그래서 재물운은 금액보다 리듬이 중요해. 언제 묶고 언제 풀지, 이게 완전 갈려.'
  ))
  out.push(bubR(`돈운은 감으로만 가면 아쉬워.<br/>근데 신기하게 이 흐름, 관계에서도 반복돼.`))
  out.push(photoCut('돈이 새는 방식이랑 마음이 흔들리는 방식, 은근 닮아 있어서 소름.', 'photo-money', gyaruOpeningUrl))
  out.push(ctaCut(
    '재물운은 여기서 살짝 잠금',
    '돈 들어오는 말보다 중요한 건 새는 지점이야. 이건 대운이랑 같이 봐야 더 정확해.',
    '재물운 신청하기'
  ))

  // ══ 緣愛 ══
  out.push(hr())
  out.push(hanjaHdr('緣愛', '연   애', '지갑 봤으니 이제 심장 쪽 가자'))
  out.push(atmo(`<div class="atmo-deco">愛</div>`, 'atmo-sm gal-flash'))
  out.push(bubL('자, 이제 사람 얘기~<br/>여기 은근 제일 재밌는 파트야.'))
  out.push(stmt(
    `끌리는 사람도<br/><span class="red">패턴이 보여</span>`
  ))
  out.push(teaserCard(
    '── 러브 무드 리딩 ──',
    `${char.couple}<br/><br/>` +
    `귀인 유형은 <strong class="red">${gi.t}</strong>. 지금 인연은 “누가 오느냐”보다 “어떤 태도로 오느냐”가 중요해.`,
    '상대 성향도 중요하지만, 먼저 봐야 하는 건 네가 반복해서 끌리는 패턴이야.'
  ))
  out.push(bubR(`연애도 결국 타이밍이야.<br/>근데 그 타이밍 타려면 네 컨디션이 먼저 반짝해야 해.`))
  out.push(photoCut('연애운에서 제일 중요한 건 상대보다 먼저, 네가 반짝이는 상태인지야.', 'photo-love', gyaruLoveUrl))
  out.push(ctaCut(
    '방금 그 사람 생각났지?',
    '좋아하는 사람, 애매한 관계, 다시 연락 올 사람. 이런 건 네 무드랑 상대 무드를 같이 봐야 해.',
    '연애운 깊게 보기'
  ))

  // ══ SELF CARE ══
  out.push(hr())
  out.push(hanjaHdr('美氣', '미   기', '반짝 운 받으려면 컨디션도 필수'))
  out.push(stmt(
    `컨디션 관리도<br/><span class="red">운 관리야</span>`,
    `네 사주에서 약해지기 쉬운 포인트는 ${char.weak} 쪽으로 보여. 생활 리듬 힌트로만 가볍게 봐줘.`
  ))
  out.push(teaserCard(
    '── 셀프케어 리딩 ──',
    `스트레스가 쌓이면 <strong class="red">${stressCare}</strong>부터 티가 날 수 있어.<br/><br/>` +
    `오늘의 작은 스위치는 <span class="em">${luckyAction}</span>.`,
    '컨디션이 무너지는 타이밍을 알면, 중요한 선택 앞에서 훨씬 덜 흔들려.'
  ))
  out.push(photoCut('셀프케어도 운 관리야. 잘 쉬어야 다음 반짝 무드를 제대로 받지.', 'photo-selfcare', gyaruSelfcareUrl))

  // ══ 5년 운세 ══
  out.push(hr())
  out.push(stmt(
    `앞으로 5년<br/><span class="gold">운세 스포</span>`,
    '지금까지 본 성격, 돈, 관계, 컨디션이 결국 시간 위에서 움직여. 그래서 마지막은 가까운 무드 스포!'
  ))
  out.push(`<section class="toon-cut toon-reveal list-cut year-cut">
    <div class="list-caption">미래 무드 스포</div>
    <div class="yr-list">
    ${years.slice(0, 3).map((yr, i) => {
      const g = grades[i % grades.length]
      const sjType = sjMap[yr]
      return `<div class="yr-item">
        <div class="yr-yr">${yr}년</div>
        <div class="yr-grade">${g.g}</div>
        <div class="yr-desc">${g.d}</div>
        ${sjType ? `<div class="yr-sj">⚠️ ${yr}년 ${sjType}삼재 — ${SAMJAE_ADVICE[sjType]}</div>` : ''}
      </div>`
    }).join('')}
    ${sj.length === 0
      ? `<div class="yr-item">
          <div class="yr-grade" style="color:#F4E3C1">✅ ${years[0]}~${years.at(-1)}년 삼재 없음</div>
          <div class="yr-desc">앞으로 5년은 삼재 걱정 덜고 움직여도 돼. 완전 럭키 무드야~</div>
        </div>`
      : ''}
      <div class="yr-item locked-item">
        <div class="yr-yr">${years[3]}년 이후</div>
        <div class="yr-grade">LOCK</div>
        <div class="yr-desc">진짜 분기점은 뒤에 숨어 있어. 돈이랑 관계 무드까지 같이 엮어야 보여.</div>
      </div>
    </div>
  </section>`)
  out.push(photoCut('여기까지가 무료 맛보기야. 이제 남은 건 네 질문에 맞춰 더 딥하게 보는 것.', 'photo-future', gyaruTimingUrl))
  out.push(ctaCut(
    `${N}님 리딩, 여기서 더 열 수 있어`,
    '지금 고민 중인 돈, 연애, 일, 시기까지 한 번에 묶어보면 훨씬 선명해져. 완전 답답함 풀리는 쪽.',
    '지금 리딩 신청하기',
    'cta-final',
  ))

  // ══ 아웃트로 ══
  out.push(atmo(`
    <span class="atmo-label">READING COMPLETE</span>
    <div class="atmo-title">더 궁금하면<br/><strong>딥하게 가자</strong></div>
    <div class="atmo-deco">♡</div>
  `, 'atmo-big closing-cut'))

  return out.join('')
}
