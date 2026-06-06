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
  const { rng, pillars, ec, dom, char, daeun, sj, vs } = calcAll(year, month, day, hour, name, gender)
  const safeName = esc(name)

  const P_LABELS = ['년주','월주','일주','시주']
  const pillarsHtml = pillars.map((p, i) => `
    <div class="pillar-cell">
      <div class="p-lbl">${P_LABELS[i]}</div>
      <div class="p-s ${STEM_EL[p.si]}">${p.stem}</div>
      <div class="p-b ${BRANCH_EL[p.bi]}">${p.branch}</div>
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
    <h1 class="rc-title">갸루 사주<br/>결과지</h1>
    <p class="rc-name">${safeName} · ${year}.${String(month).padStart(2,'0')}.${String(day).padStart(2,'0')}</p>
    <div class="rc-type-badge">${char.name}</div>
    <div class="pillars-row">${pillarsHtml}</div>
  </div>`)

  // 01 운명 프로필
  panels.push(secHdr('01', '🔮 갸루 운명 프로필', '태어날 때부터 정해진 갸루력 체크~!'))
  panels.push(imgPh('루루가 사주를 펼치는 장면', '480×300'))
  panels.push(dp(`
    <div style="margin-bottom:8px;font-size:.72rem;color:#4a1020;letter-spacing:1px">오행 밸런스</div>
    ${elHtml}
    <div style="margin-top:14px;padding-top:14px;border-top:1px solid rgba(100,0,20,.15)">
      ${trait('용신(用神)', vs.y + ' — ' + vs.yd)}
      ${trait('희신(喜神)', vs.h)}
      ${trait('기신(忌神)', vs.g + ' — 이 기운이 강한 날엔 조심하고 쉬어가봐!')}
    </div>`))
  panels.push(narr(`${EL_HJ[dom]}(${EL_KR[dom]})의 기운이 가장 강한 사주야. 그 에너지가 너의 모든 것을 만들고 있어.`))

  // 02 갸루 캐릭터
  panels.push(secHdr('02', '🎀 나의 갸루 캐릭터', '헐~! 나 원래 이런 갸루였어!?'))
  panels.push(imgPh('갸루 캐릭터 일러스트 (일주 기반)', '400×500'))
  panels.push(speech('루루', `${safeName}의 일주를 보니까<br/><strong>${char.name}</strong>이야.<br/>${char.intro}`))
  const traitLabels = ['💖 기본 성격','💅 행동 스타일','🌿 생활 패턴','🔮 속마음','✨ 숨겨진 매력']
  panels.push(dp(char.traits.map((t, i) => trait(traitLabels[i], t)).join('')))
  panels.push(dp(`
    ${trait('⭐ 특별한 신살', `<strong>${sal.n}</strong> — ${sal.d}`)}
    ${trait('🌸 두 번째 신살', `<strong>${sal2.n}</strong> — ${sal2.d}`)}`))

  // 03 인간관계
  panels.push(secHdr('03', '👑 인간관계 갸루력', '사람들이 나를 보는 진짜 모습은~?'))
  panels.push(imgPh('인간관계 컷 (루루 + 주변 인물)', '480×260'))
  panels.push(dp([
    ['💖 친구 관계', pick(rng, ['솔직함에 끌리는 친구들이 많아. 가까워지면 엄청 편한 관계가 돼.', '감성적으로 잘 맞는 친구들과 깊은 관계를 형성해.', '밝은 매력으로 사람들을 끌어당겨.'])],
    ['👨‍👩‍👧 가족 관계', pick(rng, ['가족에게 든든한 버팀목 역할을 해. 행동으로 사랑을 보여주는 타입이야.', '가족 행사나 함께하는 시간을 소중히 생각해.', '독립심이 강하지만 위기 때는 누구보다 빠르게 달려와.'])],
    ['💼 사회생활', pick(rng, ['신뢰할 수 있는 사람으로 인정받아. 결과로 보여주는 스타일이야.', '적응력이 좋아서 어떤 조직에서도 자기 자리를 만들어내.', '독창적인 아이디어로 조직에서 빛을 발해.'])],
    ['💕 연애 스타일', char.couple],
  ].map(([t, b]) => trait(t, b)).join('')))
  panels.push(dp(`<div class="trait-t" style="margin-bottom:6px">🌟 나의 귀인</div>
    <div class="trait-b"><strong style="color:#c0b0b8">${gi.t}</strong><br/>${gi.d}</div>`))

  // 04 성장 스토리
  panels.push(secHdr('04', '🌺 성장 스토리', '갸루 인생 성장기 대공개~!'))
  const stages = [
    ['👶 초년기 (1~20세)', '초년기 갸루 이미지', '480×260', pick(rng, ['호기심이 왕성한 유년기야. 배우는 것들이 나중에 큰 자산이 돼.', '주변 어른들의 영향을 많이 받는 시기야. 좋은 멘토를 만나는 운이 있어.'])],
    ['🌸 청년기 (21~40세)', '청년기 갸루 이미지', '480×260', pick(rng, ['자신을 찾아가는 설레는 시기야! 연애, 커리어 모두 활발하게 펼쳐져.', '도전과 실패를 반복하며 진짜 자신을 발견하는 시기야.'])],
    ['💎 중년기 (41~60세)', '중년기 갸루 이미지', '480×260', pick(rng, ['갸루력 만렙 찍는 구간이야! 그동안의 노력이 꽃을 피우는 시기.', '인생의 황금기야! 경험과 지혜가 쌓이면서 판단력이 최고조에 달해.'])],
    ['👑 말년기 (61세~)', '말년기 갸루 이미지', '480×260', pick(rng, ['인생 완성형 갸루 모드 ON! 주변 사람들의 존경을 받는 시기야.', '삶의 지혜를 나누고 주변에 좋은 영향을 미치는 시기야.'])],
  ]
  stages.forEach(([lbl, imgLbl, sz, txt]) => {
    panels.push(wt(`<div class="wt-data" style="padding-bottom:4px"><div class="trait-t">${lbl}</div></div>`))
    panels.push(imgPh(imgLbl, sz))
    panels.push(narr(`"${txt}"`))
  })

  // 05 행운 이벤트
  panels.push(secHdr('05', '✨ 행운 & 이벤트', '이 시기에 이런 일이 생길 수도~?'))
  panels.push(imgPh('행운 컷 (루루 + 신비로운 빛)', '480×240'))
  panels.push(dp([
    ['💖 찾아오는 좋은 기회', pick(rng, ['재물운이 터지는 시기가 분명히 와. 준비하고 있으면 놓치지 않아!', '귀인을 만나는 운이 있어. 새로운 모임이나 장소에 나가봐.', '크리에이티브한 기회가 찾아와. 재능을 마음껏 표현해봐!'])],
    ['⚠️ 주의할 일', pick(rng, ['가까운 사람과 금전 거래는 조심해.', '서명이나 계약할 때 꼼꼼히 확인해.', '건강에 무리가 오기 전에 미리 쉬어가봐.'])],
    ['💫 특별한 운의 흐름', `${EL_HJ[dom]}(${EL_KR[dom]}) 기운이 강한 계절이나 연도에 큰 이벤트가 생기기 쉬워. 이 시기에 집중해서 도전해봐!`],
  ].map(([t, b]) => trait(t, b)).join('')))

  // 06 귀인
  panels.push(secHdr('06', '🌟 귀인 찾기', '어머~! 귀인이 여기 있었네?'))
  panels.push(imgPh('귀인 컷', '480×220'))
  panels.push(dp(['👶 초년 귀인','🌸 청년 귀인','💎 중년 귀인','👑 말년 귀인'].map(lbl => {
    const g = pick(rng, GUIIN)
    return trait(lbl + ' · ' + g.t, g.d)
  }).join('')))

  // 07 재물운
  panels.push(secHdr('07', '💰 돈복 갸루력', '나 돈 잘 버는 갸루야~?'))
  panels.push(imgPh('재물 컷', '480×220'))
  panels.push(speech('루루', pick(rng, [
    '재물을 꾸준히 모으는 탄탄한 운이야. 한방보다 꾸준한 저축과 투자가 맞아.',
    '재물운이 시기마다 파도처럼 와. 오를 때 확실히 잡는 게 관건이야!',
    '사람을 통해 재물이 들어오는 운이야. 인맥 관리가 곧 재물 관리야.',
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
  panels.push(secHdr('08', '💕 연애 & 결혼운', '내 운명의 짝은 누구야~?'))
  panels.push(imgPh('배우자·파트너 이미지', '400×400'))
  panels.push(dp(`
    <div class="card-grid">
      ${[
        ['👀','상대 외모', pick(rng,['키 크고 단아함','귀엽고 동글동글','날카롭고 세련됨','자연스럽고 편안함'])],
        ['💼','상대 직업', pick(rng,['안정적인 직장인','프리랜서·아티스트','전문직','사업가'])],
      ].map(([ic,lb,vl]) => `<div class="card-item">
        <div class="ci-icon">${ic}</div><div class="ci-lbl">${lb}</div>
        <div class="ci-val" style="font-size:.75rem">${vl}</div>
      </div>`).join('')}
    </div>
    ${[
      ['💋 연애할 때의 나', char.couple],
      ['💖 이성이 느끼는 내 매력', pick(rng,['한 번 보면 잊혀지지 않는 독특한 분위기','자연스럽게 사람을 편안하게 만드는 에너지','말 한마디에 진심이 담긴 솔직함','무심한 듯하지만 디테일을 챙기는 섬세함'])],
      ['💕 만남 장소', pick(rng,['카페나 독서 모임','취미 동호회·클래스','친구 소개 자리','여행지에서의 우연한 만남']) + '에서 좋은 인연을 만날 가능성이 높아!'],
    ].map(([t,b]) => trait(t,b)).join('')}`))

  // 09 커리어
  panels.push(secHdr('09', '💼 커리어 갸루력', '나 회사 다녀야 돼? 사업해야 돼~?'))
  panels.push(imgPh('커리어 컷', '480×220'))
  panels.push(dp(`
    <div class="trait-t" style="margin-bottom:6px">✨ 추천 직업</div>
    <div class="chips" style="margin-bottom:14px">
      ${char.job.map(j => `<span class="chip g">${j}</span>`).join('')}
    </div>
    ${[
      ['📚 학업·시험운', pick(rng,['집중력이 강한 시기에 몰아서 하는 게 효율적','꾸준히 반복하는 루틴 학습이 잘 맞아','비주얼 자료나 영상으로 배우는 게 효과적'])],
      ['💡 숨겨진 재능',  pick(rng,['언어 감각과 스토리텔링 능력','뛰어난 공간 감각과 미적 센스','분석력과 논리적 사고력','사람을 이끄는 리더십'])],
      ['💎 사업운',       pick(rng,['나만의 브랜드 아이템이 잘 맞아. 작게 시작해서 안정성 확인 후 확장해!','사업보다는 전문직으로 실력을 키우다가 독립하는 게 안전해.'])],
    ].map(([t,b]) => trait(t,b)).join('')}`))

  // 10 건강
  panels.push(secHdr('10', '🍀 건강 갸루력', '갸루도 건강이 최고라구~!'))
  panels.push(imgPh('건강 컷', '480×200'))
  panels.push(dp(`
    ${[
      ['⚠️ 특히 관리할 부위', `<strong style="color:#c0001a">${char.weak}</strong> 계열을 중점적으로 관리해. 정기 검진을 꾸준히 받아봐.`],
      ['🏃 추천 운동',        pick(rng,['요가·필라테스','수영·아쿠아','걷기·등산','춤·댄스 피트니스'])],
      ['💊 추천 영양제',      pick(rng,['비타민 B+마그네슘','오메가3+비타민D','프로바이오틱스','콜라겐+아연'])],
      ['🌙 생활 패턴',        pick(rng,['일정한 수면 시간 유지','명상 또는 호흡 운동 습관화','디지털 디톡스 시간 만들기','규칙적인 계절별 검진 챙기기'])],
    ].map(([t,b]) => trait(t,b)).join('')}`))

  // 11 대운
  panels.push(secHdr('11', '🔥 인생 대운 캘린더', '언제 갸루력 떡상하는지 알려줄게~!'))
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
  panels.push(secHdr('12', '🌈 앞으로 5년 운세', '미래 스포일러 들어갑니다~!'))
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
      : `<div class="sj-box sj-safe"><div class="sj-t">✅ 2026~2030년 삼재 없음!</div><div class="sj-d">앞으로 5년은 삼재 걱정 없이 마음껏 달려도 돼!</div></div>`}
  </div>`))

  // 엔딩
  panels.push(imgPh('루루 엔딩 컷 (마지막 장면)', '480×340'))
  panels.push(speech('루루', `${safeName},<br/><br/>갸루는 단순한 스타일이 아니야.<br/>자기만의 매력을 당당하게 보여주는 사람이야.<br/><br/>앞으로도 너답게 반짝여.`))

  return panels.join('')
}
