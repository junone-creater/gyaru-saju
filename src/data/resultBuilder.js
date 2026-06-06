import { GUIIN, SSINSAL, DAEUN_TXT, YEAR_GRADES, SAMJAE_ADVICE } from './data.js'
import { calcAll, STEM_EL, BRANCH_EL, EL_HJ, EL_KR, EL_COL, EL_ORD, pick } from './saju.js'

function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}

const wt      = html => `<div class="wt">${html}</div>`
const imgPh   = (label, size = '480×300') =>
  wt(`<div class="wt-img"><div class="wt-img-ph"><span>🖼️</span><p>${label}</p><small>권장: ${size}px</small></div></div>`)
const narr    = txt  => wt(`<div class="wt-narr"><p>${txt}</p></div>`)
const speech  = (spkr, txt) => wt(`<div class="wt-speech"><div class="wt-speech-name">${spkr}</div><div class="wt-speech-txt">${txt}</div></div>`)
const secHdr  = (num, title, sub) => wt(`<div class="wt-sec-hdr"><div class="wt-sec-num">${num}</div><div class="wt-sec-title">${title}</div><div class="wt-sec-sub">${sub}</div></div>`)
const dp      = html => wt(`<div class="wt-data">${html}</div>`)
const trait   = (t, b) => `<div class="trait"><div class="trait-t">${t}</div><div class="trait-b">${b}</div></div>`

export function buildPanels(year, month, day, hour, name, gender) {
  const { rng, pillars, ec, dom, char, daeun, sj, vs, dateUnknown } = calcAll(year, month, day, hour, name, gender)
  const safeName = esc(name)

  const P_LABELS = ['년주','월주','일주','시주']
  const pillarsHtml = pillars.map((p, i) => `
    <div class="pillar-cell${p.unknown ? ' unknown' : ''}">
      <div class="p-lbl">${P_LABELS[i]}</div>
      <div class="p-s ${p.unknown ? 'unknown-gz' : STEM_EL[p.si]}">${p.stem}</div>
      <div class="p-b ${p.unknown ? 'unknown-gz' : BRANCH_EL[p.bi]}">${p.branch}</div>
    </div>`).join('')

  const elHtml = EL_ORD.map(el => `
    <div class="el-row">
      <span class="el-nm ${el}">${EL_HJ[el]}</span>
      <div class="el-track">
        <div class="el-fill" style="width:${Math.round(ec[el]/8*100)}%;background:${EL_COL[el]}"></div>
      </div>
      <span class="el-cnt">${ec[el]}</span>
    </div>`).join('')

  const grades = [...YEAR_GRADES].sort(() => rng() - .5)
  const years  = [2026, 2027, 2028, 2029, 2030]
  const sjMap  = {}
  for (const s of sj) sjMap[s.year] = s.type

  const sal  = pick(rng, SSINSAL)
  const sal2 = pick(rng, SSINSAL.filter(s => s !== sal))
  const gi   = pick(rng, GUIIN)

  const panels = []

  // COVER
  panels.push(`<div class="wt result-cover">
    <p class="rc-label">GYARU FORTUNE REPORT</p>
    <h1 class="rc-title">헐~ 이게 바로<br/>너의 사주야!</h1>
    <p class="rc-name">${safeName} · ${dateUnknown ? '생년월일 미상' : `${year}.${String(month).padStart(2,'0')}.${String(day).padStart(2,'0')}`}</p>
    <div class="rc-type-badge">${char.name}</div>
    <div class="pillars-row">${pillarsHtml}</div>
  </div>`)

  // 01 운명 프로필
  panels.push(secHdr('01', '🔮 갸루 운명 프로필', '오마이갓~ 태어날 때부터 이미 정해진 갸루력!'))
  panels.push(imgPh('루루가 사주를 펼치는 장면', '480×300'))
  panels.push(dp(`
    <div style="margin-bottom:8px;font-size:.72rem;color:#4a1020;letter-spacing:1px">오행 밸런스</div>
    ${elHtml}
    <div style="margin-top:14px;padding-top:14px;border-top:1px solid rgba(100,0,20,.15)">
      ${trait('용신(用神) — 행운 에너지!', vs.y + ' — ' + vs.yd)}
      ${trait('희신(喜神) — 든든한 서포터', vs.h)}
      ${trait('기신(忌神) — 조심조심~', vs.g + ' — 이 기운 강한 날엔 무리하지 말고 쉬어가봐!')}
    </div>`))
  panels.push(narr(`${EL_HJ[dom]}(${EL_KR[dom]}) 기운이 완전 강한 사주거든?! 그게 바로 지금의 너를 만든 에너지야~`))

  // 02 갸루 캐릭터
  panels.push(secHdr('02', '🎀 나의 갸루 캐릭터', '잠깐만~ 나 원래 이런 갸루였어?! 대박'))
  panels.push(imgPh('갸루 캐릭터 일러스트 (일주 기반)', '400×500'))
  panels.push(speech('루루', `${safeName} 일주 보니까 완전 나왔다~!<br/><strong>${char.name}</strong>이잖아!!<br/>${char.intro}`))
  const traitLabels = ['💖 기본 성격','💅 행동 스타일','🌿 생활 패턴','🔮 속마음','✨ 숨겨진 매력']
  panels.push(dp(char.traits.map((t, i) => trait(traitLabels[i], t)).join('')))
  panels.push(dp(`
    ${trait('⭐ 특별한 신살', `<strong>${sal.n}</strong> — ${sal.d}`)}
    ${trait('🌸 두 번째 신살', `<strong>${sal2.n}</strong> — ${sal2.d}`)}`))

  // 03 인간관계
  panels.push(secHdr('03', '👑 인간관계 갸루력', '사람들이 나 어떻게 보는지 완전 궁금하지~?'))
  panels.push(imgPh('인간관계 컷 (루루 + 주변 인물)', '480×260'))
  panels.push(dp([
    ['💖 친구 관계', pick(rng, ['솔직함에 끌리는 친구들이 찾아와. 친해지면 완전 편한 사이가 되거든!', '감성이 맞는 친구들이랑 진짜 깊은 우정 만들어. 귀한 인연이야~', '밝은 에너지로 사람을 끌어당기는 타입! 주변에 항상 사람이 있어.'])],
    ['👨‍👩‍👧 가족 관계', pick(rng, ['가족한테 든든한 버팀목이야. 말보다 행동으로 사랑 표현하는 타입!', '가족 행사나 함께하는 시간 진짜 소중히 여겨. 따뜻한 사람이야~', '독립적이지만 위기 때는 누구보다 빨리 달려가는 사람이잖아!'])],
    ['💼 사회생활', pick(rng, ['결과로 신뢰 쌓는 타입! 믿을 수 있는 사람으로 인정받아~', '어떤 조직에서도 자기 자리 딱 만들어내. 적응력 갑이야!', '독창적인 아이디어로 빛나! 있는 곳마다 분위기가 달라져.'])],
    ['💕 연애할 때 나', char.couple],
  ].map(([t, b]) => trait(t, b)).join('')))
  panels.push(dp(`<div class="trait-t" style="margin-bottom:6px">🌟 나의 귀인은?!</div>
    <div class="trait-b"><strong style="color:#c0b0b8">${gi.t}</strong><br/>${gi.d}</div>`))

  // 04 성장 스토리
  panels.push(secHdr('04', '🌺 성장 스토리', '갸루 인생 전체 스포 들어갑니다~ 준비됐어?!'))
  const stages = [
    ['👶 초년기 (1~20세)', '초년기 갸루 이미지', '480×260', pick(rng, ['호기심 폭발하는 유년기야! 지금 배우는 것들이 나중에 진짜 큰 자산이 돼.', '어른들 영향 많이 받는 시기야~ 좋은 어른 만나면 완전 인생 바뀌거든!'])],
    ['🌸 청년기 (21~40세)', '청년기 갸루 이미지', '480×260', pick(rng, ['나를 찾아가는 설레는 시기야! 연애도 커리어도 완전 활활 피어나~', '도전하고 넘어지고 다시 일어나면서 진짜 나를 발견하는 시기야!'])],
    ['💎 중년기 (41~60세)', '중년기 갸루 이미지', '480×260', pick(rng, ['갸루력 만렙 찍는 구간이야!! 지금까지 쌓아온 것들이 드디어 꽃피워~', '인생 황금기야! 경험과 지혜가 쌓여서 판단력이 완전 최고조야!'])],
    ['👑 말년기 (61세~)', '말년기 갸루 이미지', '480×260', pick(rng, ['인생 완성형 갸루 모드 ON!! 주변 사람들한테 진짜 존경받는 시기야~', '쌓아온 지혜를 나누면서 주변에 좋은 영향 팍팍 미치는 시기야!'])],
  ]
  stages.forEach(([lbl, imgLbl, sz, txt]) => {
    panels.push(wt(`<div class="wt-data" style="padding-bottom:4px"><div class="trait-t">${lbl}</div></div>`))
    panels.push(imgPh(imgLbl, sz))
    panels.push(narr(`"${txt}"`))
  })

  // 05 행운 이벤트
  panels.push(secHdr('05', '✨ 행운 & 이벤트', '헐~ 이런 일이 생긴다고?! 미리 알아두자!'))
  panels.push(imgPh('행운 컷 (루루 + 신비로운 빛)', '480×240'))
  panels.push(dp([
    ['💖 놓치면 안 되는 기회!', pick(rng, ['재물운 터지는 시기가 반드시 와! 미리 준비해두면 절대 놓치지 않아~', '귀인 만나는 운이 있어! 새로운 모임이나 장소에 나가봐 진짜로~', '크리에이티브한 기회 찾아와! 재능 마음껏 표현하는 시기야!!'])],
    ['⚠️ 이건 조심해~', pick(rng, ['친한 사람이랑 금전 거래는 조심! 사이 나빠지기 딱 좋거든.', '서명이나 계약할 때 꼼꼼히 확인해. 귀찮아도 꼭 읽어봐!', '건강에 무리 오기 전에 쉬어가봐. 몸이 신호 보내면 들어줘~'])],
    ['💫 운의 흐름 포인트', `${EL_HJ[dom]}(${EL_KR[dom]}) 기운 강한 계절이나 연도에 빅 이벤트 터지기 쉬워! 이 시기에 집중해서 도전해봐~`],
  ].map(([t, b]) => trait(t, b)).join('')))

  // 06 귀인
  panels.push(secHdr('06', '🌟 귀인 찾기', '어머~ 내 귀인이 진짜 있었네?! 완전 설레잖아!'))
  panels.push(imgPh('귀인 컷', '480×220'))
  panels.push(dp(['👶 초년 귀인','🌸 청년 귀인','💎 중년 귀인','👑 말년 귀인'].map(lbl => {
    const g = pick(rng, GUIIN)
    return trait(lbl + ' · ' + g.t, g.d)
  }).join('')))

  // 07 재물운
  panels.push(secHdr('07', '💰 돈복 갸루력', '나 진짜 돈복 있는 갸루야~?! 두근두근'))
  panels.push(imgPh('재물 컷', '480×220'))
  panels.push(speech('루루', pick(rng, [
    '꾸준히 모으는 탄탄한 재물운이야! 한방 대박보다 꾸준한 저축이 훨씬 맞아~',
    '재물운이 파도처럼 주기적으로 와! 오를 때 확실히 잡는 게 핵심이거든?',
    '사람을 통해 돈이 들어오는 운이야~ 인맥 관리가 곧 재물 관리인 갸루야!',
  ])))
  panels.push(dp(`
    <div class="card-grid">
      ${[
        ['📈','수입 스타일', pick(rng,['꾸준한 월급형','대박 사업형','다양한 부업형','프리랜서형'])],
        ['💸','소비 습관',  pick(rng,['균형 소비형','즉흥 소비형','실용 소비형','취미 집중형'])],
        ['🏦','재테크',     pick(rng,['예금·적금파','부동산 투자형','주식·코인형','절약파'])],
        ['🕳️','돈 새는 곳', pick(rng,['충동구매','음식비','의리비용','취미 과소비'])],
      ].map(([ic,lb,vl]) => `<div class="card-item">
        <div class="ci-icon">${ic}</div>
        <div class="ci-lbl">${lb}</div>
        <div class="ci-val" style="font-size:.75rem">${vl}</div>
      </div>`).join('')}
    </div>
    <div class="chips" style="margin-top:12px">
      <span class="chip g">${vs.y} 계열 아이템</span>
      <span class="chip g">황금색 지갑</span>
      <span class="chip">${pick(rng,['🔮 자수정','💎 호박','🌿 옥','⭐ 사파이어'])}</span>
    </div>`))

  // 08 연애
  panels.push(secHdr('08', '💕 연애 & 결혼운', '내 운명의 짝 진짜 있는 거야~?! 헐'))
  panels.push(imgPh('배우자·파트너 이미지', '400×400'))
  panels.push(dp(`
    <div class="card-grid">
      ${[
        ['👀','이상형 외모', pick(rng,['키 크고 단아한 스타일','귀엽고 동글동글한 스타일','날카롭고 세련된 스타일','자연스럽고 편안한 스타일'])],
        ['💼','이상형 직업', pick(rng,['안정적인 직장인','프리랜서·아티스트','전문직 종사자','자기 사업 하는 사람'])],
      ].map(([ic,lb,vl]) => `<div class="card-item">
        <div class="ci-icon">${ic}</div><div class="ci-lbl">${lb}</div>
        <div class="ci-val" style="font-size:.75rem">${vl}</div>
      </div>`).join('')}
    </div>
    ${[
      ['💋 연애할 때 나는~', char.couple],
      ['💖 상대방이 느끼는 내 매력', pick(rng,['한 번 보면 잊혀지지 않는 독특한 분위기야!','자연스럽게 사람 편안하게 만드는 에너지가 있어~','말 한마디에 진심이 담긴 솔직함이 매력이야!','무심한 듯하지만 디테일 챙기는 섬세함에 빠져!'])],
      ['💕 인연 만나는 장소', pick(rng,['카페나 독서 모임','취미 동호회·클래스','친구 소개 자리','여행지에서의 우연한 만남']) + ' — 여기서 좋은 인연 만날 가능성 완전 높아!!'],
    ].map(([t,b]) => trait(t,b)).join('')}`))

  // 09 커리어
  panels.push(secHdr('09', '💼 커리어 갸루력', '나 진짜 뭐가 잘 맞는 갸루야~?! 알려줘!'))
  panels.push(imgPh('커리어 컷', '480×220'))
  panels.push(dp(`
    <div class="trait-t" style="margin-bottom:6px">✨ 찰떡 직업 추천!</div>
    <div class="chips" style="margin-bottom:14px">
      ${char.job.map(j => `<span class="chip g">${j}</span>`).join('')}
    </div>
    ${[
      ['📚 학업·시험 공략법', pick(rng,['집중력 강한 시기에 몰아서 하는 게 완전 효율적이야~','꾸준히 반복하는 루틴 학습이 딱 맞아. 매일 조금씩!','비주얼 자료나 영상으로 배우는 게 훨씬 효과적이야!'])],
      ['💡 나한테 숨겨진 재능',  pick(rng,['언어 감각과 스토리텔링 능력 진짜 있어~','뛰어난 공간 감각과 미적 센스 완전 타고났어!','분석력과 논리적 사고력이 남달라~','사람 이끄는 리더십이 있어! 리더 해봐~'])],
      ['💎 사업은 어때?',       pick(rng,['나만의 브랜드 아이템이 완전 잘 맞아! 작게 시작해서 안정되면 확장해봐~','사업보다 전문직으로 실력 키우다가 독립하는 루트가 더 안전해!'])],
    ].map(([t,b]) => trait(t,b)).join('')}`))

  // 10 건강
  panels.push(secHdr('10', '🍀 건강 갸루력', '예쁜 갸루가 되려면 건강이 먼저잖아~!'))
  panels.push(imgPh('건강 컷', '480×200'))
  panels.push(dp(`
    ${[
      ['⚠️ 이 부위 특히 챙겨!', `<strong style="color:#c0001a">${char.weak}</strong> 계열이 약점이야! 정기 검진 꼭 챙겨봐~`],
      ['🏃 찰떡 운동 추천',   pick(rng,['요가·필라테스 — 완전 갸루 감성이잖아~','수영·아쿠아 — 몸매 관리에 최고야!','걷기·등산 — 생각보다 진짜 좋아!','춤·댄스 피트니스 — 즐겁게 운동!'])],
      ['💊 챙겨먹으면 좋은 영양제', pick(rng,['비타민 B+마그네슘 — 피로 회복 필수!','오메가3+비타민D — 뇌건강 피부건강 둘 다!','프로바이오틱스 — 장 건강이 다 건강이야!','콜라겐+아연 — 피부 갸루력 챙기자~'])],
      ['🌙 생활 루틴 추천',   pick(rng,['일정한 수면 시간 유지 — 수면이 최고 미용이야!','명상이나 호흡 운동 습관화 — 멘탈 갸루도 중요해~','디지털 디톡스 시간 만들기 — 폰 좀 내려놔봐!','계절별 검진 규칙적으로 챙기기!'])],
    ].map(([t,b]) => trait(t,b)).join('')}`))

  // 11 대운
  panels.push(secHdr('11', '🔥 인생 대운 캘린더', '언제 갸루력 완전 떡상하는지 스포 해줄게~!!'))
  panels.push(imgPh('대운 컷 (루루 + 타임라인)', '480×240'))
  panels.push(wt(`<div class="wt-data">
    ${daeun.map(de => `<div class="daeun-item">
      <div class="di-age">${de.age}~${de.end}세</div>
      <div class="di-gz">
        <span class="${STEM_EL[de.si]}">${de.stem}</span>
        <span class="${BRANCH_EL[de.bi]}">${de.branch}</span>
      </div>
      <div class="di-txt">${pick(rng, DAEUN_TXT[STEM_EL[de.si]])}</div>
    </div>`).join('')}
  </div>`))

  // 12 5년 운세
  panels.push(secHdr('12', '🌈 앞으로 5년 운세', '미래 스포일러 대방출~ 진짜 알고 싶어?!'))
  panels.push(imgPh('미래 컷 (루루 + 달력)', '480×240'))
  panels.push(wt(`<div class="wt-data">
    ${years.map((yr, i) => {
      const g = grades[i % grades.length]
      return `<div class="year-item">
        <div class="yi-num">${yr}년</div>
        <div class="yi-grade">${g.g}</div>
        <div class="yi-desc">${g.d}</div>
        ${sjMap[yr] ? `<div class="chips"><span class="chip" style="border-color:rgba(180,0,30,.4);color:#8b0015">⚠️ ${yr}년 ${sjMap[yr]}삼재</span></div>` : ''}
      </div>`
    }).join('')}
    ${sj.length > 0
      ? sj.map(s => `<div class="sj-box"><div class="sj-t">${s.year}년 — ${s.type}삼재</div><div class="sj-d">${SAMJAE_ADVICE[s.type]}</div></div>`).join('')
      : `<div class="sj-box sj-safe"><div class="sj-t">✅ 2026~2030년 삼재 없음! 대박~</div><div class="sj-d">앞으로 5년은 삼재 걱정 없이 마음껏 달려도 돼!! 완전 좋은 거 아니야~?!</div></div>`}
  </div>`))

  // 엔딩
  panels.push(imgPh('루루 엔딩 컷 (마지막 장면)', '480×340'))
  panels.push(speech('루루', `${safeName}~!<br/><br/>들어봐, 진짜야.<br/>갸루는 그냥 스타일이 아니거든?!<br/>자기만의 매력을 당당하게 세상에 던지는 사람이야.<br/><br/>앞으로도 너답게~ 완전 반짝여 알겠지?! ✨`))

  return panels.join('')
}
