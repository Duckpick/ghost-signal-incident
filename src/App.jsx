import { useEffect, useRef, useState } from "react"
import html2canvas from "html2canvas"

const START_MONEY = 1000000
const RACE_DURATION = 5000
const STORAGE_KEY = "horse_racing_save_v1"
const SETTING_KEY = "horse_racing_setting_v1"
const CURRENT_CARDS_KEY = "horse_racing_current_cards_v1"
const ACTIVE_RACE_KEY = "horse_racing_active_race_v1"
const LAST_SCREEN_KEY = "horse_racing_last_screen_v1"
const F5_LOSE_RESULT_KEY = "horse_racing_f5_lose_result_v1"
const COIN_ICON = "/img/tier/duckpick_coin.png"
function getDefaultLanguage() {
  const savedSetting = loadSetting()

  if (savedSetting?.language) {
    return savedSetting.language
  }

  return navigator.language.startsWith("ko") ? "ko" : "en"
}

const HORSES = [
  { id: 1, nameKo: "서아", nameEn: "Seoa", image: "/img/horses/horse1.png" },
  { id: 2, nameKo: "하린", nameEn: "Harin", image: "/img/horses/horse2.png" },
  { id: 3, nameKo: "유나", nameEn: "Yuna", image: "/img/horses/horse3.png" },
  { id: 4, nameKo: "태윤", nameEn: "Taeyun", image: "/img/horses/horse4.png" },
  { id: 5, nameKo: "아린", nameEn: "Arin", image: "/img/horses/horse5.png" },
  { id: 6, nameKo: "준서", nameEn: "Junseo", image: "/img/horses/horse6.png" },
  { id: 7, nameKo: "세린", nameEn: "Serin", image: "/img/horses/horse7.png" },
  { id: 8, nameKo: "다은", nameEn: "Daeun", image: "/img/horses/horse8.png" },
  { id: 9, nameKo: "현우", nameEn: "Hyunwoo", image: "/img/horses/horse9.png" },
  { id: 10, nameKo: "소희", nameEn: "Sohee", image: "/img/horses/horse10.png" },
  { id: 11, nameKo: "지안", nameEn: "Jian", image: "/img/horses/horse11.png" },
  { id: 12, nameKo: "유리", nameEn: "Yuri", image: "/img/horses/horse12.png" },
  { id: 13, nameKo: "지유", nameEn: "Jiyu", image: "/img/horses/horse13.png" },
  { id: 14, nameKo: "수아", nameEn: "Sua", image: "/img/horses/horse14.png" },
  { id: 15, nameKo: "민지", nameEn: "Minji", image: "/img/horses/horse15.png" },
  { id: 16, nameKo: "예린", nameEn: "Yerin", image: "/img/horses/horse16.png" },
  { id: 17, nameKo: "레아", nameEn: "Rea", image: "/img/horses/horse17.png" },
  { id: 18, nameKo: "지은", nameEn: "Jieun", image: "/img/horses/horse18.png" },
  { id: 19, nameKo: "세아", nameEn: "Seah", image: "/img/horses/horse19.png" },
  { id: 20, nameKo: "시아", nameEn: "Sia", image: "/img/horses/horse20.png" },
]
function formatMoney(value, language = "ko") {
  const v = Math.floor(value)

  if (language === "en") {
    if (v >= 1e12) return (v / 1e12).toFixed(1) + "T"
    if (v >= 1e9) return (v / 1e9).toFixed(1) + "B"
    if (v >= 1e6) return (v / 1e6).toFixed(1) + "M"
    if (v >= 1e3) return (v / 1e3).toFixed(1) + "K"
    return v.toLocaleString("en-US")
  }

  const EOK = 100_000_000
  const JO = 1_000_000_000_000
  const GYEONG = 10_000_000_000_000_000

  let result = ""

  if (v >= GYEONG) {
    const gyeong = Math.floor(v / GYEONG)
    result += `${gyeong.toLocaleString()}경 `
  }

  if (v >= JO) {
    const jo = Math.floor((v % GYEONG) / JO)
    if (jo > 0) {
      result += `${jo.toLocaleString()}조 `
    }
  }

  if (v >= EOK) {
    const eok = Math.floor((v % JO) / EOK)
    if (eok > 0) {
      result += `${eok.toLocaleString()}억 `
    }
  }

  const rest = v % EOK

  if (rest > 0 || result === "") {
    result += rest.toLocaleString("ko-KR")
  }

  return result.trim()
}
function makeStars(value) {
  return "★".repeat(value) + "☆".repeat(5 - value)
}

function createRandomStatSet() {
  const speed = Math.floor(Math.random() * 5) + 1

  let maxCurveLuck = 15 - speed * 2
  maxCurveLuck = Math.max(4, maxCurveLuck)

  while (true) {
    const curve = Math.floor(Math.random() * 5) + 1
    const luck = Math.floor(Math.random() * 5) + 1

    if (curve + luck <= maxCurveLuck) {
      return { speed, curve, luck }
    }
  }
}

function generateCards() {
  const shuffled = [...HORSES].sort(() => Math.random() - 0.5)
  const selected = shuffled.slice(0, 2)

  // ⭐ 1. 먼저 카드 생성
  const result = selected.map((horse) => {
    const stat = createRandomStatSet()

    const power =
      stat.speed * 0.5 +
      stat.curve * 0.3 +
      stat.luck * 0.2

    return {
      ...horse,
      speed: stat.speed,
      curve: stat.curve,
      luck: stat.luck,
      power,
    }
  })

  // ⭐ 2. power 기반 승률 계산
  const totalPower = result[0].power + result[1].power

  result[0].winRate = result[0].power / totalPower
  result[1].winRate = result[1].power / totalPower

// ⭐ 3. 3라운드 기준 최종 승률 최대 약 75% 제한
result.forEach((c) => {
  c.winRate = Math.min(0.8, Math.max(0.2, c.winRate))
})

  // ⭐ 4. 배당 계산 (차이 크게)
  result.forEach((c) => {
    c.odds = Number((1.25 / Math.pow(c.winRate, 1.25)).toFixed(2))
  })

  return result
}

function pickWinner(cards) {
  const random = Math.random()
  let sum = 0

  for (const card of cards) {
    sum += card.winRate
    if (random <= sum) {
      return card
    }
  }

  return cards[cards.length - 1]
}

const TRACKS = [
  {
    name: "verticalOval",
    path: "M180 45 C255 45 315 105 315 180 C315 255 255 315 180 315 C105 315 45 255 45 180 C45 105 105 45 180 45 Z",
  },
]

function getRandomTrack() {
  return TRACKS[0]
}

function getHorsePoint(card, winner, progress, pathEl) {
  if (!pathEl) return { x: 180, y: 40 }

// 능력 기반 속도 차이
const speedFactor = 0.85 + card.speed * 0.06

let raceProgress = progress * speedFactor

const shake =
  progress < 0.05 ? 0 : Math.sin(progress * 18 + card.id * 2) * 0.01
  raceProgress += shake

  if (progress > 0.7) {
    const finishPower = (progress - 0.7) / 0.3

    if (card.id === winner.id) {
      raceProgress += finishPower * 0.08
    } else {
      raceProgress -= finishPower * 0.04
    }
  }

  raceProgress = Math.min(1, Math.max(0, raceProgress))

  const total = pathEl.getTotalLength()
  const point = pathEl.getPointAtLength(total * raceProgress)

  return { x: point.x, y: point.y }
}
function loadSaveData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)

    if (!raw) {
      return null
    }

    return JSON.parse(raw)
  } catch {
    return null
  }
}
function loadSetting() {
  try {
    const raw = localStorage.getItem(SETTING_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveSetting(data) {
  localStorage.setItem(SETTING_KEY, JSON.stringify(data))
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}
function loadCurrentCards() {
  try {
    const raw = localStorage.getItem(CURRENT_CARDS_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveCurrentCards(cards) {
  localStorage.setItem(CURRENT_CARDS_KEY, JSON.stringify(cards))
}
function getTier(maxMoney) {
  if (maxMoney >= 100000000000) {
    return { name: "Legend 3", image: "Legend3.png", color: "#ff4df0" }
  }

  if (maxMoney >= 50000000000) {
    return { name: "Legend 2", image: "Legend2.png", color: "#ff4df0" }
  }

  if (maxMoney >= 10000000000) {
    return { name: "Legend 1", image: "Legend1.png", color: "#ff4df0" }
  }

  if (maxMoney >= 5000000000) {
    return { name: "Epic 3", image: "Epic3.png", color: "#b84dff" }
  }

  if (maxMoney >= 3000000000) {
    return { name: "Epic 2", image: "Epic2.png", color: "#b84dff" }
  }

  if (maxMoney >= 2000000000) {
    return { name: "Epic 1", image: "Epic1.png", color: "#b84dff" }
  }

  if (maxMoney >= 1000000000) {
    return { name: "Platinum 3", image: "Platinum3.png", color: "#d6f3ff" }
  }

  if (maxMoney >= 500000000) {
    return { name: "Platinum 2", image: "Platinum2.png", color: "#d6f3ff" }
  }

  if (maxMoney >= 300000000) {
    return { name: "Platinum 1", image: "Platinum1.png", color: "#d6f3ff" }
  }

  if (maxMoney >= 100000000) {
    return { name: "Gold 3", image: "Gold3.png", color: "#f6c343" }
  }

  if (maxMoney >= 80000000) {
    return { name: "Gold 2", image: "Gold2.png", color: "#f6c343" }
  }

  if (maxMoney >= 50000000) {
    return { name: "Gold 1", image: "Gold1.png", color: "#f6c343" }
  }

  if (maxMoney >= 40000000) {
    return { name: "Silver 3", image: "Silver3.png", color: "#bfc7d5" }
  }

  if (maxMoney >= 25000000) {
    return { name: "Silver 2", image: "Silver2.png", color: "#bfc7d5" }
  }

  if (maxMoney >= 15000000) {
    return { name: "Silver 1", image: "Silver1.png", color: "#bfc7d5" }
  }

  if (maxMoney >= 10000000) {
    return { name: "Bronze ★", image: "Bronze3.png", color: "#b87333" }
  }

  if (maxMoney >= 5000000) {
    return { name: "Bronze 2", image: "Bronze2.png", color: "#b87333" }
  }

  return { name: "Bronze 1", image: "Bronze1.png", color: "#b87333" }
}

const TEXT = {
  ko: {
    nicknamePrompt: "닉네임을 입력하세요.",
    startRace: "레이스 시작",
    bettingAmount: "배팅 금액",
    raceRunning: "레이스 진행중",
    selectedRider: "선택 기수",
    win: "🎉 승리!",
    lose: "💀 패배",
    next: "다음판",
    share: "공유",
    setting: "설정",
    rule: "게임 규칙",
    reset: "초기화",
    change: "교체",
    winStreak: "연승",
winBonus: "연승 보너스",
currentAsset: "자산",
bankrupt: "💥 파산! 100만원으로 재시작",
saveImage: "이미지 저장",
main: "메인으로",
myRecordCard: "나의 기록 카드",
bestStreak: "최고 연승",
winRate: "승률",
totalWin: "총 승리",
nicknameChange: "닉네임 변경",
recordReset: "기록 초기화",
sound: "사운드",
bgm: "배경음",
language: "언어",
volume: "볼륨",
close: "닫기",
rules: [
  "1. 기수를 선택하고 배팅 비율을 정합니다.",
  "2. 레이스에서 선택한 기수가 우승하면 가상 재화를 얻습니다.",
  "3. 패배하면 배팅한 가상 재화를 잃습니다.",
  "4. 자산이 10만원 미만이면 100만원으로 재시작됩니다.",
  "5. 본 게임은 실제 현금 거래가 없는 엔터테인먼트용 시뮬레이션입니다.",
],
speed: "속도",
curve: "커브",
luck: "운",
ad: "광고 영역",
newRecord: "신기록",
selectRider: "기수를 선택하세요.",
resetConfirm: "저장된 기록을 초기화할까요?",
subscribe: "구독",
subDesc: "X2배속 · 광고 제거",
revive: "🎬 부활하기 (광고보기)",
aboutTitle: "게임 소개",
aboutText:
  "Horse Betting Simulator는 확률 기반 레이싱 웹게임으로, 각 기수의 능력치와 승률에 따라 결과가 결정됩니다. 플레이어는 기수를 선택하고 배팅을 진행하며, 연승과 보너스를 통해 자산을 늘릴 수 있습니다. 본 게임은 실제 금전이 아닌 가상 재화를 사용하는 엔터테인먼트 목적의 시뮬레이션 게임입니다.",
privacy: "개인정보처리방침",
contact: "문의",
support: "후원",
  },

  en: {
    nicknamePrompt: "Enter nickname",
    startRace: "Start Race",
    bettingAmount: "Bet Amount",
    raceRunning: "Racing",
    selectedRider: "Selected Rider",
    win: "🎉 Win!",
    lose: "💀 Lose",
    next: "Next",
    share: "Share",
    setting: "Settings",
    rule: "Rules",
    reset: "Reset",
    change: "Change",
    winStreak: "Win Streak",
winBonus: "Streak Bonus",
currentAsset: "Asset",
bankrupt: "💥 Bankrupt! Restart with 1,000,000",
saveImage: "Save Image",
main: "Main",
myRecordCard: "My Record Card",
bestStreak: "Best Streak",
winRate: "Win Rate",
totalWin: "Total Wins",
nicknameChange: "Change Nickname",
recordReset: "Reset Record",
sound: "Sound",
bgm: "BGM",
language: "Language",
volume: "Volume",
close: "Close",
rules: [
  "1. Choose a rider and set your bet rate.",
  "2. Win the race to earn virtual currency rewards.",
  "3. Lose the race and your virtual bet is lost.",
  "4. If assets drop below 100,000, restart with 1,000,000.",
  "5. This is an entertainment simulation with no real-money transactions.",
],
speed: "Speed",
curve: "Curve",
luck: "Luck",
ad: "Ad Area",
newRecord: "New Record",
selectRider: "Please select a rider.",
resetConfirm: "Reset saved data?",
subscribe: "Subscribe",
subDesc: "X2 Speed · No Ads",
revive: "🎬 Revive (Watch Ad)",
aboutTitle: "About",
aboutText:
  "Horse Betting Simulator is a probability-based racing web game where results are determined by each rider’s stats and win rate. Players select riders, place bets, and grow their assets through wins and streak bonuses. This game uses virtual currency only and is intended purely for entertainment purposes.",
privacy: "Privacy Policy",
contact: "Contact",
support: "Support",
  },
}

export default function App() {

  const soundsRef = useRef(null)

  if (!soundsRef.current) {
    soundsRef.current = {
      start: new Audio("/sound/start.wav"),
      run: new Audio("/sound/run_loop.mp3"),
      win: new Audio("/sound/win.wav"),
      lose: new Audio("/sound/lose.wav"),
      click: new Audio("/sound/click.wav"),
    }

    soundsRef.current.run.loop = true
    soundsRef.current.run.volume = 0.3
  }
  const sounds = soundsRef.current

  const playSound = (name, loop = false) => {
    if (!soundOn && name !== "run") return
    if (name === "run" && !bgmOn) return
  
    const base = sounds[name]
    if (!base) return
  
    if (loop) {
      base.pause()
      base.currentTime = 0
      base.loop = true
      base.volume = volume
      base.play().catch(() => {})
      return
    }
  
    const s = base.cloneNode()
    s.volume = volume
    s.play().catch(() => {})
  }
  
  const stopSound = (name) => {
    const s = sounds[name]
    if (!s) return
    s.pause()
    s.currentTime = 0
  }
  
  const isMobile = window.innerWidth <= 420

  const scale = isMobile
    ? 1
    : Math.min(1, window.innerHeight / 844)

  const [displayProfit, setDisplayProfit] = useState(0)
  const savedData = loadSaveData()
  const racePathRef = useRef(null)
  const shareCardRef = useRef(null)
  const [screen, setScreen] = useState("main")
  const [page, setPage] = useState(window.location.pathname)
  const [popup, setPopup] = useState(null)
  const [installPrompt, setInstallPrompt] = useState(null)
  const setting = loadSetting()

  const [soundOn, setSoundOn] = useState(
    setting?.soundOn ?? true
  )
  const [bgmOn, setBgmOn] = useState(
    setting?.bgmOn ?? true
  )
  const [volume, setVolume] = useState(
    setting?.volume ?? 0.3
  )
  const [language, setLanguage] = useState(
    setting?.language ?? getDefaultLanguage()
  )

  const [nickname, setNickname] = useState(
    savedData?.nickname || (language === "ko" ? "질주본능" : "Racer")
  )

  const [money, setMoney] = useState(
    savedData?.money || START_MONEY
  )

  const [maxMoney, setMaxMoney] = useState(
    savedData?.maxMoney || START_MONEY
  )

  const [cards, setCards] = useState(() => {
    const savedCards = loadCurrentCards()
  
    if (savedCards && savedCards.length === 2) {
      return savedCards
    }
  
    const newCards = generateCards()
    saveCurrentCards(newCards)
    return newCards
  })
  const [selectedCard, setSelectedCard] = useState(null)
  const [betRate, setBetRate] = useState(0.1)

  const [currentWinStreak, setCurrentWinStreak] = useState(
    savedData?.currentWinStreak || 0
  )

  const [maxWinStreak, setMaxWinStreak] = useState(
    savedData?.maxWinStreak || 0
  )

  const [winCount, setWinCount] = useState(savedData?.winCount || 0)
  const [totalGame, setTotalGame] = useState(savedData?.totalGame || 0)

  const [raceWinner, setRaceWinner] = useState(null)
  const [round, setRound] = useState(1)
const [score, setScore] = useState({ a: 0, b: 0 })
const [roundWinner, setRoundWinner] = useState(null)
  const [raceTrack, setRaceTrack] = useState(() => getRandomTrack())
  const [raceProgress, setRaceProgress] = useState(0)
  const [countdown, setCountdown] = useState(null)
  const [result, setResult] = useState(null)
  const [isNewRecord, setIsNewRecord] = useState(false)
  const [reviveUsed, setReviveUsed] = useState(
    savedData?.reviveUsed || false
  )

  const betAmount = Math.floor(money * betRate)

  useEffect(() => {
    if (!result) return
  
    let start = 0
    const end = Math.abs(result.profit)
    const duration = 800
    const stepTime = 16
    const totalSteps = duration / stepTime
    const increment = end / totalSteps
  
    const timer = setInterval(() => {
      start += increment
  
      if (start >= end) {
        start = end
        clearInterval(timer)
      }
  
      setDisplayProfit(Math.floor(start))
    }, stepTime)
  
    return () => clearInterval(timer)
  }, [result])

  useEffect(() => {
    saveData({
      nickname,
      money,
      maxMoney,
      currentWinStreak,
      maxWinStreak,
      winCount,
      totalGame,
      reviveUsed,
    })
  }, [
    nickname,
    money,
    maxMoney,
    currentWinStreak,
    maxWinStreak,
    winCount,
    totalGame,
    reviveUsed,
  ])
  useEffect(() => {
    const raw = localStorage.getItem(ACTIVE_RACE_KEY)
    const f5LoseResult = localStorage.getItem(F5_LOSE_RESULT_KEY)
    const lastScreen = localStorage.getItem(LAST_SCREEN_KEY)
  
    // 레이스중 F5 직후 결과 유지
    if (f5LoseResult) {
      const savedResult = JSON.parse(f5LoseResult)
  
      setMoney(savedResult.money)
      setCurrentWinStreak(0)
      setTotalGame(savedResult.totalGame)
  
      setResult({
        isWin: false,
        winner: null,
        selectedCard: savedResult.selectedCard,
        profit: savedResult.profit,
        money: savedResult.money,
        restarted: savedResult.restarted,
      })
  
      localStorage.removeItem(F5_LOSE_RESULT_KEY)
      localStorage.setItem(LAST_SCREEN_KEY, "result")
      setScreen("result")
      return
    }
  
    // 레이스중 F5 = 패배 처리
    if (raw) {
      const activeRace = JSON.parse(raw)
  
      let nextMoney = activeRace.money - activeRace.betAmount
      let restarted = false
  
      if (nextMoney < 100000) {
        nextMoney = START_MONEY
        restarted = true
      }
  
      const savedResult = {
        selectedCard: activeRace.selectedCard,
        profit: -activeRace.betAmount,
        money: nextMoney,
        restarted,
        totalGame: activeRace.totalGame + 1,
      }
  
      localStorage.removeItem(ACTIVE_RACE_KEY)
      localStorage.setItem(F5_LOSE_RESULT_KEY, JSON.stringify(savedResult))
  
      setMoney(nextMoney)
      setCurrentWinStreak(0)
      setTotalGame(activeRace.totalGame + 1)
  
      setResult({
        isWin: false,
        winner: null,
        selectedCard: activeRace.selectedCard,
        profit: -activeRace.betAmount,
        money: nextMoney,
        restarted,
      })
  
      setScreen("result")
      return
    }
  
    // 결과창/공유창 F5 = 메인 + 새 기수
    if (lastScreen === "result" || lastScreen === "share") {
      const newCards = generateCards()
  
      saveCurrentCards(newCards)
      setCards(newCards)
      setSelectedCard(null)
      setRaceWinner(null)
      setRaceProgress(0)
      setCountdown(null)
      setRound(1)
      setScore({ a: 0, b: 0 })
      setRoundWinner(null)
      setResult(null)
  
      localStorage.setItem(LAST_SCREEN_KEY, "main")
      setScreen("main")
      return
    }
  
    localStorage.setItem(LAST_SCREEN_KEY, "main")
  }, [])

  useEffect(() => {
    const handlePopState = () => {
      setPage(window.location.pathname)
      window.scrollTo(0, 0)
    }
  
    window.addEventListener("popstate", handlePopState)
  
    return () => {
      window.removeEventListener("popstate", handlePopState)
    }
  }, [])

  useEffect(() => {
    saveSetting({
      soundOn,
      bgmOn,
      volume,
      language,
    })
  }, [soundOn, bgmOn, volume, language])

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault()
      setInstallPrompt(e)
    }

    window.addEventListener("beforeinstallprompt", handler)

    return () => {
      window.removeEventListener("beforeinstallprompt", handler)
    }
  }, [])

  useEffect(() => {
    if (screen !== "race" || !raceWinner) return
  
    setRaceProgress(0)
    setCountdown("READY")
  
    let count = 0

    const countdownTimer = setInterval(() => {
      count += 1
    
      if (count === 1) {
        setCountdown("GO!")
        return
      }
    
      clearInterval(countdownTimer)
      setCountdown(null)
      playSound("run", true)
      const startTime = Date.now()
  
      const raceTimer = setInterval(() => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / RACE_DURATION, 1)
  
        setRaceProgress(progress)
  
        if (progress >= 1) {
          clearInterval(raceTimer)
        
          stopSound("run")
        
          setTimeout(() => {
            finishRace(raceWinner)
          }, 500)
        }
      }, 16)
    }, 1000)
  
    return () => clearInterval(countdownTimer)
  }, [screen, raceWinner, round])

  const refreshCards = () => {
    setCards(generateCards())
    setSelectedCard(null)
  }

  const changeNickname = () => {
    const nextNickname = prompt(t.nicknamePrompt, nickname)
  
    if (!nextNickname) return
  
    const hasKorean = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(nextNickname)
    const maxLen = hasKorean ? 8 : 12
    
    setNickname(nextNickname.slice(0, maxLen))
  }
  const goPage = (path) => {
    window.history.pushState({}, "", path)
    setPage(path)
    window.scrollTo(0, 0)
  }
  
  const goHome = () => {
    window.history.pushState({}, "", "/")
    setPage("/")
    window.scrollTo(0, 0)
  }

  const resetData = () => {
    const ok = confirm(t.resetConfirm)
    if (!ok) return
  
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(CURRENT_CARDS_KEY)
  
    setNickname(language === "ko" ? "질주본능" : "Racer")
    setMoney(START_MONEY)
    setMaxMoney(START_MONEY)
    setCurrentWinStreak(0)
    setMaxWinStreak(0)
    setWinCount(0)
    setTotalGame(0)
    setReviveUsed(false)
  
    const newCards = generateCards()
    setCards(newCards)
    saveCurrentCards(newCards)
  
    setSelectedCard(null)
    setScreen("main")
  }
  const changeCards = () => {
    const cost = Math.floor(money * 0.05)
  
    if (money <= cost) return
  
    const newMoney = money - cost
    const newCards = generateCards()
  
    setMoney(newMoney)
    setCards(newCards)
    saveCurrentCards(newCards)
    setSelectedCard(null)
  }

  const startRace = () => {
    if (!selectedCard) {
      alert(t.selectRider)
      return
    }
  
    playSound("start")
  
    const winner = pickWinner(cards)
    localStorage.setItem(
      ACTIVE_RACE_KEY,
      JSON.stringify({
        selectedCard,
        betAmount,
        money,
        currentWinStreak,
        winCount,
        totalGame,
      })
    )
  
    setTimeout(() => {
      setRaceWinner(winner)
      setRaceTrack(getRandomTrack())
      setRaceProgress(0)
      setCountdown("READY")
      setRound(1)
      setScore({ a: 0, b: 0 })
      localStorage.setItem(LAST_SCREEN_KEY, "race")
      setScreen("race")
    }, 300)
  }
  const finishRace = (winner) => {
    stopSound("run")
  
    const idx = cards.findIndex((c) => c.id === winner.id)
  
    let newScore = { ...score }
  
    if (idx === 0) {
      newScore.a += 1
    } else {
      newScore.b += 1
    }
  
    setScore(newScore)
    setRoundWinner(winner)
  
    const isMatchEnd =
      newScore.a === 2 ||
      newScore.b === 2 ||
      round === 3
  
    // 아직 3판 승부 안 끝났으면 다음 라운드
    if (!isMatchEnd) {
      setTimeout(() => {
        const nextWinner = pickWinner(cards)
  
        setRound((r) => r + 1)
        setRaceWinner(nextWinner)
        setRaceProgress(0)
        setCountdown("READY")
      }, 1200)
  
      return
    }
  
    // 최종 승자
    const finalWinner =
      newScore.a > newScore.b ? cards[0] : cards[1]
  
    const isWin = finalWinner.id === selectedCard.id
  
    let nextMoney = money
    let profit = 0
    let nextCurrentStreak = currentWinStreak
    let nextWinCount = winCount
  
    if (isWin) {
      playSound("win")
  
      const bonusRate = Math.min(currentWinStreak * 0.05, 0.5)
  
      const baseReturn = Math.floor(betAmount * selectedCard.odds)
      const pureProfit = baseReturn - betAmount
      const bonusProfit = Math.floor(pureProfit * bonusRate)
  
      profit = baseReturn + bonusProfit
      nextMoney = money + profit
      nextCurrentStreak = currentWinStreak + 1
      nextWinCount = winCount + 1
    } else {
      playSound("lose")
  
      profit = -betAmount
      nextMoney = money - betAmount
      nextCurrentStreak = 0
    }
  
    const restarted = nextMoney < 100000
  
    if (restarted) {
      nextMoney = START_MONEY
      nextCurrentStreak = 0
    }
  
    const nextMaxMoney = Math.max(maxMoney, nextMoney)
    const nextMaxStreak = Math.max(maxWinStreak, nextCurrentStreak)
    const isRecord = nextMoney > maxMoney
  
    setIsNewRecord(isRecord)
  
    setMoney(nextMoney)
    setMaxMoney(nextMaxMoney)
    setCurrentWinStreak(nextCurrentStreak)
    setMaxWinStreak(nextMaxStreak)
    setWinCount(nextWinCount)
    setTotalGame(totalGame + 1)
  
    setResult({
      isWin,
      winner: finalWinner,
      selectedCard,
      profit,
      money: nextMoney,
      restarted,
    })
  
    localStorage.removeItem(ACTIVE_RACE_KEY)
    localStorage.setItem(LAST_SCREEN_KEY, "result")
    setScreen("result")
  }

const shareTextResult = async () => {
  const shareUrl = window.location.origin

  const message = language === "ko"
  ? `티어: ${tier.name}
닉네임: ${nickname}
최대 자산: ${formatMoney(maxMoney, language)}

🆚 지금 도전해보기 👉
${shareUrl}`
  : `Tier: ${tier.name}
Nickname: ${nickname}
Max Asset: ${formatMoney(maxMoney, language)}

🆚 Try now 👉
${shareUrl}`

try {
  // 모바일에서만 공유창
  if (navigator.share && /Mobi|Android|iPhone/i.test(navigator.userAgent)) {
    await navigator.share({
      title: "Duckpick",
      text: message,
    })
    return
  }
} catch (e) {
  // 공유 취소시 무시
}

// 웹/PC fallback
await navigator.clipboard.writeText(message)
alert(
  language === "ko"
    ? "복사되었습니다.\n카카오톡 등에 붙여넣기 하세요."
    : "Copied!\nPaste it to share."
)
}

  const saveShareImage = async () => {
    if (!shareCardRef.current) return
  
    const canvas = await html2canvas(shareCardRef.current, {
      backgroundColor: null,
      scale: 2,
    })
  
    const image = canvas.toDataURL("image/png")
    const link = document.createElement("a")
  
    link.href = image
    link.download = `horse-record-${Date.now()}.png`
    link.click()
  }
  const handleRevive = () => {
    if (!result) return
    if (reviveUsed) return
  
    setReviveUsed(true)
  
    const recoveredMoney = result.money + Math.abs(result.profit)
  
    setMoney(recoveredMoney)
    setCurrentWinStreak(0)
  
    const newCards = generateCards()
    setCards(newCards)
    saveCurrentCards(newCards)
  
    setSelectedCard(null)
    setRaceWinner(null)
    setRaceTrack(getRandomTrack())
    setRaceProgress(0)
    setCountdown(null)
    setRound(1)
    setScore({ a: 0, b: 0 })
    setRoundWinner(null)
    setResult(null)
  
    localStorage.setItem(LAST_SCREEN_KEY, "main")
    setScreen("main")
  }
  const nextRound = () => {
    setIsNewRecord(false)
  
    const newCards = generateCards()
    setCards(newCards)
    saveCurrentCards(newCards)
  
    setSelectedCard(null)
    setRaceWinner(null)
    setRaceTrack(getRandomTrack())
    setRaceProgress(0)
    setScreen("main")
  }
  const getHorseName = (card) => {
    return language === "ko" ? card.nameKo : card.nameEn
  }
  const getTierImage = (tier) => {
    return `/img/tier/${tier.image}`
  }
  const getTierEffect = (tier) => {
    if (tier.name.includes("Legend")) {
      return {
        border: "2px solid #ff4df0",
        boxShadow: "0 0 14px rgba(255,77,240,0.9)",
      }
    }
  
    if (tier.name.includes("Epic")) {
      return {
        border: "2px solid #b84dff",
        boxShadow: "0 0 12px rgba(184,77,255,0.75)",
      }
    }
  
    if (tier.name.includes("Platinum")) {
      return {
        border: "2px solid #d6f3ff",
        boxShadow: "0 0 10px rgba(214,243,255,0.7)",
      }
    }
  
    if (tier.name.includes("Gold")) {
      return {
        border: "2px solid #f6c343",
        boxShadow: "0 0 10px rgba(246,195,67,0.65)",
      }
    }
  
    if (tier.name.includes("Silver")) {
      return {
        border: "2px solid #bfc7d5",
        boxShadow: "0 0 8px rgba(191,199,213,0.55)",
      }
    }
  
    return {
      border: "2px solid #b87333",
      boxShadow: "0 0 6px rgba(184,115,51,0.45)",
    }
  }

  const winRate =
    totalGame === 0 ? 0 : ((winCount / totalGame) * 100).toFixed(1)
    const tier = getTier(maxMoney)
    const t = TEXT[language]
    if (page === "/privacy") {
      return (
        <div style={styles.page}>
          <div style={{ ...styles.app, minHeight: "844px" }}>
            <button style={styles.backBtn} onClick={goHome}>
              ← Home
            </button>
    
            <div style={styles.infoPage}>
  <div style={styles.infoPageTitle}>
    {language === "ko" ? "개인정보처리방침" : "Privacy Policy"}
  </div>

  <p>
  {language === "ko"
    ? "본 사이트는 사용자의 개인정보를 직접 수집하지 않습니다."
    : "This site does not directly collect personal information."}
</p>

<p>
  {language === "ko"
    ? "본 사이트는 Google AdSense를 사용하며, 광고 제공을 위해 쿠키 및 웹 비콘과 같은 기술이 사용될 수 있습니다."
    : "This site uses Google AdSense, which may use cookies and web beacons to serve ads."}
</p>

<p>
  {language === "ko"
    ? "Google은 사용자의 이전 방문 기록을 기반으로 맞춤 광고를 제공할 수 있습니다."
    : "Google may use users' previous visits to provide personalized ads."}
</p>

<p>
  {language === "ko"
    ? "사용자는 광고 설정에서 맞춤 광고를 비활성화할 수 있습니다."
    : "Users may opt out of personalized advertising by visiting Ads Settings."}
</p>

<p>
  {language === "ko"
    ? "또한 제3자 광고 공급업체가 쿠키를 사용하여 광고를 제공할 수 있습니다."
    : "Third-party vendors may also use cookies to serve ads."}
</p>

<p>
  {language === "ko"
    ? "사용자는 브라우저 설정을 통해 쿠키 저장을 거부할 수 있습니다."
    : "Users can disable cookies through their browser settings."}
</p>

<p>
  Google Ads Policy: https://policies.google.com/technologies/ads
</p>

<p>
  Contact: playicd01@gmail.com
</p>
  <div style={styles.footerLinks}>
  <button
    style={styles.footerLinkBtn}
    onClick={() => goPage("/privacy")}
  >
    {t.privacy}
  </button>

  <button
    style={styles.footerLinkBtn}
    onClick={() => goPage("/contact")}
  >
    {t.contact}
  </button>

  <button
    style={styles.footerLinkBtn}
    onClick={() => goPage("/support")}
  >
    {t.support}
  </button>
</div>
</div>
          </div>
        </div>
      )
    }
    
    if (page === "/contact") {
      return (
        <div style={styles.page}>
          <div style={{ ...styles.app, minHeight: "844px" }}>
            <button style={styles.backBtn} onClick={goHome}>
              ← Home
            </button>
    
            <div style={styles.infoPage}>
            <div style={styles.infoPageTitle}>
  {language === "ko" ? "문의" : "Contact"}
</div>

<p>
  {language === "ko"
    ? "Duckpick Horse Betting Simulator 관련 문의, 오류 제보, 광고 및 기타 요청은 아래 이메일로 연락할 수 있습니다."
    : "For questions, bug reports, advertising inquiries, or other requests related to Duckpick Horse Betting Simulator, please contact us by email."}
</p>

<p>
  {language === "ko"
    ? "문의 시 확인 후 가능한 범위 내에서 답변드립니다."
    : "We will review your inquiry and respond where possible."}
</p>

<p>Email: playicd01@gmail.com</p>
  <div style={styles.footerLinks}>
  <button style={styles.footerLinkBtn} onClick={() => goPage("/privacy")}>
    {t.privacy}
  </button>

  <button style={styles.footerLinkBtn} onClick={() => goPage("/contact")}>
    {t.contact}
  </button>

  <button style={styles.footerLinkBtn} onClick={() => goPage("/support")}>
    {t.support}
  </button>
</div>
</div>
          </div>
        </div>
      )
    }
    
    if (page === "/support") {
      return (
        <div style={styles.page}>
          <div style={{ ...styles.app, minHeight: "844px" }}>
            <button style={styles.backBtn} onClick={goHome}>
              ← Home
            </button>
    
            <div style={styles.infoPage}>
            <div style={styles.infoPageTitle}>
  {language === "ko" ? "후원" : "Support"}
</div>

  <p>
    {language === "ko"
      ? "이 게임이 마음에 드셨다면 후원을 통해 개발을 지원할 수 있습니다."
      : "If you enjoy this game, you can support future updates."}
  </p>

  <p>
  {language === "ko"
    ? "현재 별도의 결제나 후원 기능은 제공하지 않습니다."
    : "This site currently does not provide payment or donation features."}
</p>
  <div style={styles.footerLinks}>
  <button style={styles.footerLinkBtn} onClick={() => goPage("/privacy")}>
    {t.privacy}
  </button>

  <button style={styles.footerLinkBtn} onClick={() => goPage("/contact")}>
    {t.contact}
  </button>

  <button style={styles.footerLinkBtn} onClick={() => goPage("/support")}>
    {t.support}
  </button>
</div>
</div>
          </div>
        </div>
      )
    }
    return (
      <div style={styles.page}>
        {!isMobile && <div style={styles.sideAd}>{t.ad}</div>}
    
        <div
          style={{
            ...styles.app,
            transform: `scale(${scale})`,
          }}
        >
      {screen === "main" && (
  <>
    {/* 상단 정보 */}
    <div style={styles.mainHeader}>
  <div style={styles.row1}>
    <div style={styles.profileRow}>
    <div
  style={{
    ...styles.tierBadge,
    ...getTierEffect(tier),
  }}
>
  <img
   src={getTierImage(tier)}
   style={{
    width: "80%",
    height: "80%",
    objectFit: "contain",
  }}
  />
</div>
      <div style={styles.nicknameText}>{nickname}</div>
      <button style={styles.editNameBtn} onClick={changeNickname}>
        ✎
      </button>
    </div>

    <div style={styles.rightGroup}>
    <button style={styles.iconBtn} onClick={() => {
  playSound("click")
  setPopup("rule")
}}>
  !
</button>
<button style={styles.iconBtn} onClick={() => {
  playSound("click")
  setPopup("setting")
}}>
  ⚙
</button>
    </div>
  </div>

  <div style={styles.row2}>
  <div
    style={{
      ...styles.moneyValue,
      fontSize: getFontSizeByLength(formatMoney(money, language), 0.8),
    }}
  >
<div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
  <img src={COIN_ICON} style={{ width: "18px" }} />
  {formatMoney(money, language)}
</div>
  </div>

  <button style={styles.resetBtn} onClick={resetData}>
  ↻ {t.reset}
  </button>
</div>

<div style={styles.row3}>
  <div>
  🔥 {currentWinStreak}{t.winStreak} · {t.winBonus}{" "}
    <span style={styles.bonusHighlight}>
      {Math.min(currentWinStreak * 5, 50)}%
    </span>
  </div>

  <button style={styles.changeCardBtn} onClick={changeCards}>
  {t.change} -5%
  </button>
</div>
</div>

    {/* 카드 영역 */}
{/* 카드 영역 */}
<div style={styles.cardGrid}>
  {cards.map((card) => (
    <button
      key={card.id}
      onClick={() => {
        playSound("click")
        setSelectedCard(card)
      }}
      style={{
        ...styles.riderCard,
        border: selectedCard?.id === card.id
          ? "2px solid red"
          : "2px solid transparent",
        boxShadow: "none",
        boxSizing: "border-box",
      }}
    >
<div style={styles.cardProfile}>
<img
  src={card.image}
  style={{
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  }}
/>

  <div style={styles.cardOddsOverlay}>x{card.odds}</div>
  <div style={styles.cardNameOverlay}>{getHorseName(card)}</div>
</div>

      <div style={styles.statLine}>{t.speed} {makeStars(card.speed)}</div>
      <div style={styles.statLine}>{t.curve} {makeStars(card.curve)}</div>
      <div style={styles.statLine}>{t.luck} {makeStars(card.luck)}</div>
    </button>
  ))}
</div>

    {/* 배팅 선택 */}
    <div style={styles.betBox}>
      {[10, 20, 30, 50].map((p) => (
        <button
          key={p}
          onClick={() => {
            playSound("click")
            setBetRate(p / 100)
          }}
          style={{
            ...styles.betBtn,
            background:
            betRate === p / 100
              ? "linear-gradient(180deg, #f6c343 0%, #c89b2b 100%)"
              : "#1a1a1a",
          
          color:
            betRate === p / 100 ? "#111" : "#fff",
          
          boxShadow:
            betRate === p / 100
              ? "0 0 12px rgba(246,195,67,0.6)"
              : "none",
          }}
        >
          {p}%
        </button>
      ))}
    </div>

    {/* 금액 */}
    <div
  style={{
    ...styles.betAmount,
    fontSize: getFontSizeByLength(formatMoney(betAmount, language)).replace("px", "") * 0.6 + "px",
  }}
>
<div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "6px" }}>
  {t.bettingAmount}:
  <img src={COIN_ICON} style={{ width: "14px" }} />
  {formatMoney(betAmount, language)}
</div>
</div>

    {/* 시작 버튼 */}
    <button style={styles.startBtn} onClick={startRace}>
      {t.startRace}
    </button>


    {/* 하단 배너 광고 영역 */}
    <div style={styles.adBox}>
      {t.ad}
    </div>

    {/* 승인용 하단 정보 */}
    <div style={styles.siteFooter}>
      <div style={styles.footerTitle}>
        {t.aboutTitle}
      </div>

      <div style={styles.footerText}>
        {t.aboutText}
      </div>

      <div style={styles.footerLinks}>
      <button
  style={styles.footerLinkBtn}
  onClick={() => goPage("/privacy")}
>
  {t.privacy}
</button>

<button
  style={styles.footerLinkBtn}
  onClick={() => goPage("/contact")}
>
  {t.contact}
</button>

<button
  style={styles.footerLinkBtn}
  onClick={() => goPage("/support")}
>
  {t.support}
</button>
      </div>
    </div>
  </>
)}

{screen === "race" && (
  <>
    {/* 상단 */}
    <div style={styles.raceHeader}>
      <div style={styles.raceTitle}>{t.raceRunning}</div>
      <div style={styles.roundTitle}>
      {language === "ko" ? "라운드" : "ROUND"} {round} / 3
</div>

    </div>

    {/* 🔥 트랙 박스 크게 */}
    <div style={styles.trackContainer}>

    {countdown && (
  <div style={styles.countdownOverlay}>
    {countdown}
  </div>
)}
      {cards.map((card, index) => {
const speedPower = (card.speed - 3) * 0.025
const curveStable = (card.curve - 3) * 0.012
const luckPower = (card.luck - 3) * 0.01

let progress = raceProgress

// 기본 속도 차이
progress += raceProgress * speedPower

// 앞뒤 흔들림
const wave =
  raceProgress < 0.05
    ? 0
    : Math.sin(raceProgress * 22 + card.id * 1.7) * (0.018 - card.curve * 0.002)

progress += wave

// 중반 커브 안정성
if (raceProgress > 0.25 && raceProgress < 0.65) {
  progress += curveStable
}

// 운 기반 순간 스퍼트
const luckyBurst =
  Math.sin(raceProgress * 38 + card.id * 4.3) > 0.82
    ? 0.018 + luckPower
    : 0

progress += luckyBurst

// 순간 감속
const stumble =
  Math.sin(raceProgress * 31 + card.id * 5.1) < -0.88
    ? 0.012 - card.curve * 0.0015
    : 0

progress -= stumble

// 마지막은 결과에 맞게 자연 보정
if (raceProgress > 0.72) {
  const finishPower = (raceProgress - 0.72) / 0.28

  if (card.id === raceWinner.id) {
    progress += finishPower * 0.12
  } else {
    progress -= finishPower * 0.04
  }
}

progress = Math.min(1, Math.max(0, progress))
if (countdown) {
  progress = 0
}

        return (
          <div key={card.id} style={styles.trackLane}>

<div
style={{
  ...styles.horse,
  left: `calc(5px + ${progress * 100}% - ${progress * 68}px)`,
  transform: "translate(0%, -50%)",

  border: "2px solid transparent",
  outline:
    selectedCard?.id === card.id
      ? "2px solid red"
      : "none",
}}
>
<img
  src={card.image}
  style={{
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  }}
/>

</div>
          </div>
        )
      })}
    </div>
    <div
style={{
  marginTop: "16px",
  padding: "18px 12px",
  borderRadius: "16px",
  background: "linear-gradient(180deg, #202938 0%, #0d1118 100%)",
  border: "1px solid #f6c343",
  textAlign: "center",
  fontWeight: "bold",
  fontSize: "20px",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  gap: "16px",
}}
>
<span
  style={{
    ...styles.scoreName,
    animation:
      roundWinner?.id === cards[0].id ? "scorePop 0.45s ease" : "none",
  }}
>
<span style={styles.scoreName}>
  {getHorseName(cards[0])}{" "}
  <span style={{ color: "#ff4d4d" }}>{score.a}</span>
</span>
</span>

<span style={styles.vsText}>VS</span>

<span
  style={{
    ...styles.scoreName,
    animation:
      roundWinner?.id === cards[1].id ? "scorePop 0.45s ease" : "none",
  }}
>
<span style={styles.scoreName}>
  <span style={{ color: "#ff4d4d" }}>{score.b}</span>{" "}
  {getHorseName(cards[1])}
</span>
</span>
</div>

    {/* 하단 정보 */}
    <div style={styles.raceInfoBox}>
      <div>{t.selectedRider}: {selectedCard ? getHorseName(selectedCard) : ""}</div>
      <div>{t.bettingAmount}:{" "}
<img src={COIN_ICON} style={{ width: "14px", marginRight: "4px" }} />
{formatMoney(betAmount, language)}</div>
    </div>

    {/* 광고 */}
    <div style={styles.adBox}>
    {t.ad}
    </div>
  </>
)}
{screen === "share" && (
  <>
    <div style={styles.shareWrap}>
      <div style={styles.shareTitle}>{t.myRecordCard}</div>

      <div
  ref={shareCardRef}
  style={{
    ...styles.shareCard,
    ...getTierEffect(tier),
  }}
>
        <div style={{ ...styles.shareTier, color: tier.color }}>
          {tier.name}
        </div>

        <div
  style={{
    ...styles.shareHorse,
    borderRadius: "18px",
    padding: "10px",
  }}
>
  <img
  src={getTierImage(tier)}
    style={{
      width: "100px",
      height: "100px",
      objectFit: "contain",
    }}
  />
</div>

        <div style={styles.shareNickname}>{nickname}</div>

        <div
  style={{
    ...styles.shareBigMoney,
    fontSize: getFontSizeByLength(formatMoney(money, language)),
  }}
>
<div
  style={{
    display: "flex",
    alignItems: "center",
    justifyContent: "center", // ⭐ 추가
    gap: "6px",
  }}
>
  <img src={COIN_ICON} style={{ width: "18px" }} />
  {formatMoney(money, language)}
</div>
</div>

        <div style={styles.shareStats}>
          <div>{t.bestStreak}: {maxWinStreak}</div>
          <div>{t.winRate}: {winRate}%</div>
          <div>{t.totalWin}: {winCount}</div>
        </div>

        <div style={styles.shareFooter}>
          Horse Betting Simulator
        </div>
      </div>

      <div style={styles.resultButtonRow}>
      <button
  style={styles.shareBtn}
  onClick={() => {
    playSound("click")
    saveShareImage()
  }}
>
{t.saveImage}
  </button>

  <button
  style={styles.shareBtn}
  onClick={() => {
    playSound("click")
    shareTextResult()
  }}
>
  {language === "ko" ? "링크 공유" : "Share Link"}
</button>

  <button
  style={styles.nextBtn}
  onClick={() => {
    playSound("click")
  
    const newCards = generateCards()
    setCards(newCards)
    saveCurrentCards(newCards)
  
    setSelectedCard(null)
    setScreen("main")
  }}
>
{t.main}
  </button>
</div>
    </div>
  </>
)}

{screen === "result" && result && (
  <>
    <div style={styles.resultWrap}>
      
      {/* 결과 타이틀 */}
      <div
        style={
          result.isWin ? styles.winBigTitle : styles.loseBigTitle
        }
      >
       {result.isWin ? t.win : t.lose}

      </div>

      {/* 말 */}
      <div
  style={{
    ...styles.resultHorse,
    animation: result.isWin ? "pop 0.4s ease" : "none",
    border: result.isWin ? "3px solid #f6c343" : "none",
    borderRadius: "12px",
    display: "inline-block",
    padding: "0",          // 🔥 여백 제거
    width: "160px",        // 🔥 고정 크기
    height: "160px",
    overflow: "hidden",
    background: "#fff",    // 🔥 흰 배경
  }}
>
  <img
    src={result.selectedCard.image}
    style={{
      width: "100%",
      height: "100%",
      objectFit: "cover",  // 🔥 꽉 채우기
      display: "block",
    }}
  />
  {isNewRecord && (
  <div
    style={{
      position: "absolute",
      top: "6px",
      right: "6px",
      background: "rgba(255,0,0,0.85)",
      color: "#fff",
      padding: "4px 8px",
      borderRadius: "8px",
      fontSize: "12px",
      fontWeight: "bold",
      zIndex: 10,
      boxShadow: "0 0 10px rgba(255,0,0,0.6)"
    }}
  >
{t.newRecord}
  </div>
)}
</div>

      {/* 우승 말 */}
      <div style={styles.resultName}>
      {getHorseName(result.selectedCard)}
      </div>

      {/* 금액 */}
      <div
  style={{
    ...(result.isWin ? styles.winMoney : styles.loseMoney),
    fontSize: getFontSizeByLength(
      formatMoney(displayProfit, language)
    ),
  }}
>
<img src={COIN_ICON} style={{ width: "20px", marginRight: "6px" }} />
{result.isWin ? "+" : "-"}
{formatMoney(displayProfit, language)}
</div>

{/* 현재 자산 */}
<div
  style={{
    ...styles.resultSub,
    marginTop: "8px"
  }}
>
{t.currentAsset}: {formatMoney(result.money, language)}
</div>

      {/* 파산 */}
      {result.restarted && (
        <div style={styles.restartBox}>
       {t.bankrupt}
        </div>
      )}

{/* 버튼 */}
<div style={styles.resultActionBox}>
  {!result.isWin && !reviveUsed && (
    <button
      style={{
        ...styles.nextBtn,
        background: "#f6c343",
        color: "#111",
        fontWeight: "bold",
      }}
      onClick={() => {
        playSound("click")
        handleRevive()
      }}
    >
    {t.revive}
    </button>
  )}

  <button
    style={{
      ...styles.nextBtn,
      fontSize: "18px",
      fontWeight: "bold",
    }}
    onClick={() => {
      playSound("click")
      nextRound()
    }}
  >
    {t.next}
  </button>

  <button
    style={styles.shareBtn}
    onClick={() => {
      playSound("click")
      localStorage.setItem(LAST_SCREEN_KEY, "share")
      setScreen("share")
    }}
  >
    {t.share}
  </button>
</div>
  {/* 하단 배너 광고 */}
<div style={styles.adBox}>
  {t.ad}
</div>

    </div>
  </>
  
)}

{popup && (
  <div style={styles.popupDim}>
    <div style={styles.popupBox}>
      <div style={styles.popupTitle}>
      {popup === "rule" ? t.rule : t.setting}
      </div>

      <div style={styles.popupText}>
      {popup === "rule" ? (
  <>
    {t.rules.map((rule) => (
      <div key={rule}>{rule}</div>
    ))}
  </>
) : popup === "privacy" ? (
  <>
    <div>
      본 사이트는 사용자 데이터를 직접 수집하지 않습니다.
    </div>
    <div>
      Google AdSense를 사용하며 쿠키가 사용될 수 있습니다.
    </div>
    <div>
      https://policies.google.com/technologies/ads
    </div>
    <div>
      문의: playicd01@gmail.com
    </div>
  </>
) : popup === "contact" ? (
  <>
    <div>Email: playicd01@gmail.com</div>
  </>
) : popup === "support" ? (
  <>
    <div>Support this game</div>
    <div>Buy me a coffee</div>
  </>
) : (
<>
<button
  style={styles.popupBtn}
  onClick={() => {
    playSound("click")
    changeNickname()
  }}
>
{t.nicknameChange}
  </button>

  <button
  style={styles.popupBtn}
  onClick={() => {
    playSound("click")
    resetData()
  }}
>
{t.recordReset}
  </button>

  <button
    style={styles.popupBtn}
    onClick={async () => {
      playSound("click")

      if (installPrompt) {
        installPrompt.prompt()
        await installPrompt.userChoice
        setInstallPrompt(null)
        return
      }

      alert(
        language === "ko"
          ? "브라우저 메뉴에서 '홈 화면에 추가'를 선택하세요."
          : "Use your browser menu and choose 'Add to Home Screen'."
      )
    }}
  >
    {language === "ko" ? "홈화면 추가" : "Add to Home"}
  </button>

  <div style={styles.settingRow}>
  {t.sound}
    <button
  onClick={() => {
    playSound("click")
    setSoundOn(!soundOn)
  }}
  style={{
    background: soundOn ? "#28a745" : "#222",
    color: "#fff",
    border: "none",
    padding: "6px 12px",
    borderRadius: "6px",
    fontWeight: "bold",
  }}
>
  {soundOn ? "ON" : "OFF"}
</button>
  </div>

  <div style={styles.settingRow}>
  {t.bgm}
    <button
  onClick={() => {
    playSound("click")
    setBgmOn(!bgmOn)
  }}
  style={{
    background: bgmOn ? "#28a745" : "#222",
    color: "#fff",
    border: "none",
    padding: "6px 12px",
    borderRadius: "6px",
    fontWeight: "bold",
  }}
>
  {bgmOn ? "ON" : "OFF"}
</button>
  </div>

  <div style={styles.settingRow}>
  {t.language}
  <button
  onClick={() => {
    playSound("click")
    setLanguage(language === "ko" ? "en" : "ko")
  }}
  style={{
    background: "#222",
    color: "#f6c343",
    border: "1px solid #444",
    padding: "6px 12px",
    borderRadius: "6px",
    fontWeight: "bold",
  }}
>
{language === "ko" ? "한국어 🇰🇷" : "English 🇺🇸"}
</button>
</div>
  <div style={styles.settingRow}>
  {t.volume}
    <input
      type="range"
      min="0"
      max="1"
      step="0.1"
      value={volume}
      onChange={(e) => setVolume(Number(e.target.value))}
    />
  </div>
</>
        )}
      </div>

      <button
  style={styles.popupCloseBtn}
  onClick={() => {
    playSound("click")
    setPopup(null)
  }}
>
{t.close}
</button>
    </div>
  </div>
)}
    </div>

{!isMobile && <div style={styles.sideAd}>{t.ad}</div>}
</div>
)
}

const styles = {
  page: {
    width: "100vw",
    minHeight: "100vh",
    background: "#111",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    color: "white",
    fontFamily: "Arial, sans-serif",
  },

  app: {
    position: "relative",
    width: "390px",
    minWidth: "390px",
    flexShrink: 0,
    minHeight: "844px",
    transformOrigin: "top center",
    background: "linear-gradient(180deg, #111820 0%, #050608 100%)",
    padding: "10px",
    boxSizing: "border-box",
  },
  mainHeader: {
    marginBottom: "10px",
    padding: "12px",
    borderRadius: "18px",
    background: "linear-gradient(180deg, #182230 0%, #0b1018 100%)",
    border: "1px solid #2f3a4a",
  },

  row1: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid rgba(255,255,255,0.14)",
    paddingBottom: "8px",
  },

  profileRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },

  tierBadge: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    color: "#111",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "10px",
    fontWeight: "bold",
    flexShrink: 0,
  },

  nicknameText: {
    fontSize: "20px",
    fontWeight: "bold",
    color: "#fff",
  },

  editNameBtn: {
    width: "26px",
    height: "26px",
    borderRadius: "50%",
    border: "1px solid #555",
    background: "#1a1a1a",
    color: "#fff",
    fontSize: "14px",
  },

  rightGroup: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },

  iconBtn: {
    width: "26px",
    height: "26px",
    borderRadius: "50%",
    border: "1px solid #555",
    background: "#1a1a1a",
    color: "#fff",
    fontSize: "14px",
    display: "flex",              // 추가
    alignItems: "center",         // 추가
    justifyContent: "center",     // 추가
  },

  row2: {
    display: "flex",
    alignItems: "center",
    marginTop: "10px",
    justifyContent: "flex-start", // 🔥 왼쪽 정렬
  },

  moneyLabel: {
    fontSize: "13px",
    color: "#aaa",
  },

  moneyValue: {
    fontSize: "24px",
    flex: 1,
    minWidth: 0,
    textAlign: "left", // 🔥 추가
    fontWeight: "bold",
    color: "#f6c343",
    whiteSpace: "nowrap",
  },

  resetBtn: {
    flexShrink: 0,
    marginLeft: "10px",
    border: "1px solid #444",
    background: "#1a1a1a",
    color: "#f6c343",
    padding: "8px 12px",
    borderRadius: "12px",
    fontSize: "13px",
    fontWeight: "bold",
  },
  row3: {
    marginTop: "6px",
    fontSize: "14px",
    color: "#fff",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  bonusHighlight: {
    color: "#f6c343",
  },

  cardGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
    marginTop: "10px",
  },

  riderCard: {
    position: "relative",
    background: "linear-gradient(180deg, #202938 0%, #0d1118 100%)",
    color: "white",
    borderRadius: "14px",
    padding: "10px",
    textAlign: "left",
    transform: "none",
  },

  cardProfile: {
    position: "relative",
    height: "150px",

    borderRadius: "12px",
    overflow: "hidden",
    marginBottom: "8px",
    background: "#fff", // 🔥 전부 흰색
  },



  cardNameOverlay: {
    zIndex: 5,
    position: "absolute",
    left: "6px",
    bottom: "6px",
    padding: "4px 8px",
    borderRadius: "8px",
    background: "rgba(0,0,0,0.65)",
    color: "#fff",
    fontSize: "13px",
    fontWeight: "bold",
  },



  statLine: {
    fontSize: "12px",
    color: "#f6c343",
    marginTop: "3px",
  },

  betBox: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "10px",
  },

  betBtn: {
    flex: 1,
    margin: "0 4px",
    padding: "10px 0",
    borderRadius: "10px",
    border: "1px solid #444",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "16px", // 🔥 추가
    background: "#1a1a1a",
  },

  betAmount: {
    textAlign: "center",
    marginTop: "10px",
    fontSize: "clamp(10px, 3vw, 16px)", // ↓ 줄임
    fontWeight: "bold",
    color: "#f6c343",
    whiteSpace: "nowrap",
  },

  startBtn: {
    width: "100%",
    marginTop: "10px",
    padding: "16px",
    borderRadius: "14px",
    background: "linear-gradient(180deg, #38d85a 0%, #138528 100%)",
    border: "1px solid rgba(255,255,255,0.18)",
    color: "#fff",
    fontSize: "20px",
    fontWeight: "bold",
    cursor: "pointer",
    boxShadow: "0 0 18px rgba(40,167,69,0.45)",
    textShadow: "0 2px 8px rgba(0,0,0,0.9)",
  },

  raceHeader: {
    textAlign: "center",
    paddingTop: "12px",
    marginBottom: "18px",
  },

  raceTitle: {
    fontSize: "22px",
    fontWeight: "bold",
  },

  raceTime: {
    fontSize: "32px",
    fontWeight: "bold",
    marginTop: "8px",
  },

  trackContainer: {
    position: "relative",
    marginTop: "10px",
    padding: "0px",
    height: "200px",
  
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",   // 🔥 이거 추가 (핵심)
  
    borderRadius: "16px",
    overflow: "hidden",
  
    backgroundImage: "url('/img/track/track1.png')",
    backgroundSize: "100% 100%",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
  
    border: "2px solid #f6c343",
  },


  trackLane: {
    position: "relative",
    height: "50px",   // 🔥 60 → 50
    margin: "7px 0",  // 🔥 5 → 3
  },

  trackLine: {
    position: "absolute",
    left: "54px",
    right: "12px",
    top: "50%",
    height: "5px",
    background: "rgba(255,255,255,0.2)",
    borderRadius: "10px",
    transform: "translateY(-50%)",
  },

  horse: {
    zIndex: 2,
    position: "absolute",
    top: "50%",
    transform: "translate(-50%, -50%)",
    width: "54px",
    height: "54px",
    overflow: "hidden",
    borderRadius: "10px",
    background: "#fff",
    transition: "left 0.05s linear",
  },


  raceInfoBox: {
    marginTop: "14px",
    border: "1px solid #333",
    borderRadius: "12px",
    padding: "14px",
    textAlign: "center",
    color: "#ccc",
    lineHeight: "1.8",
  },

  adBox: {
    marginTop: "80px",
    height: "100px",
    background: "#222",
    borderRadius: "10px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    color: "#777",
    fontSize: "14px",
  },
  sideAd: {
    width: "160px",
    height: "600px",
    margin: "20px 16px",
    background: "#222",
    borderRadius: "12px",
    border: "1px solid #333",
    color: "#777",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    flexShrink: 0,
  },

  resultWrap: {
    textAlign: "center",
    paddingTop: "40px",
    background:
      "linear-gradient(180deg, #111 0%, #050505 100%)",
  },
  winBigTitle: {
    fontSize: "42px",
    color: "#ffd84d",
    fontWeight: "bold",
    textShadow: "0 0 18px rgba(255,216,77,0.8)",
  },

  loseBigTitle: {
    fontSize: "42px",
    color: "#ff4d4d",
    fontWeight: "bold",
    textShadow: "0 0 18px rgba(255,77,77,0.8)",
  },

  resultHorse: {
    position: "relative",
    margin: "20px 0",
  },

  resultName: {
    fontSize: "22px",
    marginTop: "-10px", 
    marginBottom: "6px",
  },

  winMoney: {
    fontSize: "clamp(14px, 5vw, 34px)", // 🔥 자동 축소
    color: "#ffd84d",
    fontWeight: "bold",
    textShadow: "0 0 16px rgba(255,216,77,0.8)",
    whiteSpace: "nowrap",
    marginTop: "10px",   // ← 추가
  },

  loseMoney: {
    fontSize: "34px",
    color: "#ff4d4d",
    fontWeight: "bold",
    textShadow: "0 0 16px rgba(255,77,77,0.8)",
    marginTop: "10px",   // ← 추가
  },

  resultSub: {
    color: "#aaa",
    fontSize: "14px",
    marginBottom: "6px",
  },

  restartBox: {
    marginTop: "12px",
    padding: "10px",
    border: "1px solid #f6c343",
    borderRadius: "8px",
    color: "#f6c343",
  },
  resultActionBox: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginTop: "16px",
  },

  resultButtonRow: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "8px",        // ⭐ 부활 간격과 동일하게
    marginTop: "8px",  // ⭐ 다음판과 동일하게
  },

  shareBtn: {
    width: "100%",
    padding: "14px",
    borderRadius: "10px",
    background: "#222",
    border: "1px solid #f6c343",
    color: "#f6c343",
    fontSize: "16px",
    fontWeight: "bold",
  },
  subscribeBtn: {
    width: "100%",
    padding: "10px",          // ↓ 줄임
    borderRadius: "12px",
    border: "none",
    background: "linear-gradient(180deg, #ffcc00 0%, #ff9900 100%)",
    color: "#111",
    fontWeight: "bold",
    textAlign: "center",
    boxShadow: "0 0 12px rgba(255, 200, 0, 0.5)", // ↓ 약하게
  },
  
  subTitle: {
    fontSize: "12px",
    fontWeight: "bold",
  },
  
  subPrice: {
    fontSize: "16px",
    fontWeight: "bold",
    lineHeight: "1.2",
  },
  
  subDesc: {
    fontSize: "12px",
    fontWeight: "600",
    marginTop: "2px",
    color: "#333",
  },

  nextBtn: {
    width: "100%",
    padding: "14px",
    borderRadius: "10px",
    background: "#28a745",
    border: "none",
    color: "#fff",
    fontSize: "16px",
  },

  shareWrap: {
    textAlign: "center",
    paddingTop: "30px",
  },

  shareTitle: {
    fontSize: "24px",
    fontWeight: "bold",
    marginBottom: "16px",
  },

  shareCard: {
    width: "280px",
margin: "0 auto",
    padding: "22px",
    borderRadius: "18px",
    background: "linear-gradient(180deg, #1f2937 0%, #080b10 100%)",
    marginBottom: "20px",
  },

  shareTier: {
    fontSize: "28px",
    fontWeight: "bold",
    marginBottom: "12px",
  },

  shareHorse: {
    marginBottom: "10px",
    display: "flex",
    justifyContent: "center",
  },

  shareNickname: {
    fontSize: "18px",
    color: "#ccc",
    marginBottom: "8px",
  },

  shareBigMoney: {
    fontSize: "28px",
    color: "#f6c343",
    fontWeight: "bold",
    marginBottom: "14px",
  },

  shareStats: {
    color: "#ddd",
    lineHeight: "1.8",
    fontSize: "15px",
  },

  shareFooter: {
    marginTop: "16px",
    color: "#777",
    fontSize: "12px",
  },

  cardWinRateOverlay: {
    position: "absolute",
    top: "6px",
    left: "6px",
    zIndex: 5,
    padding: "4px 8px",
    borderRadius: "8px",
    background: "rgba(0,0,0,0.75)",
    color: "#4ddcff",
    fontWeight: "bold",
    fontSize: "15px",
  },


  cardOddsOverlay: {
    position: "absolute",
    top: "6px",
    right: "6px",
    zIndex: 5,
    padding: "4px 8px",
    borderRadius: "8px",
    background: "rgba(0,0,0,0.75)",
    color: "#f6c343",
    fontWeight: "bold",
    fontSize: "15px",
  },
  countdownOverlay: {
    position: "absolute",
    left: "50%",
    top: "50%",
    transform: "translate(-50%, -50%)",
    zIndex: 20,
    fontSize: "52px",
    fontWeight: "bold",
    color: "#f6c343",
    textShadow: "0 0 18px rgba(246,195,67,0.9)",
  },
  finishFlag: {
    position: "absolute",
    right: "6px",
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: "11px",
    fontWeight: "bold",
    color: "#f6c343",
    writingMode: "vertical-rl",
    letterSpacing: "1px",
  },
  popupDim: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.65)",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    paddingTop: "60px",
    zIndex: 999999,
    overflowY: "auto",
  },
  
  popupBox: {
    width: "320px",
    padding: "18px",
    borderRadius: "16px",
    background: "linear-gradient(180deg, #182230 0%, #080b10 100%)",
    border: "1px solid #f6c343",
    color: "#fff",
    boxSizing: "border-box",
    margin: "12px auto 24px",
    maxHeight: "calc(100vh - 40px)",
    overflowY: "auto",
  },

  popupTitle: {
    fontSize: "22px",
    fontWeight: "bold",
    color: "#f6c343",
    marginBottom: "14px",
    textAlign: "center",
  },
  
  popupText: {
    fontSize: "15px",
    lineHeight: "1.8",
    color: "#ddd",
  },
  
  popupBtn: {
    width: "100%",
    padding: "13px",
    marginBottom: "10px",
    borderRadius: "10px",
    border: "1px solid #444",
    background: "#1a1a1a",
    color: "#f6c343",
    fontSize: "15px",
    fontWeight: "bold",
  },
  settingRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "12px",
    fontSize: "14px",
  },
  
  popupCloseBtn: {
    width: "100%",
    marginTop: "16px",
    padding: "13px",
    borderRadius: "10px",
    border: "none",
    background: "#28a745",
    color: "#fff",
    fontSize: "16px",
    fontWeight: "bold",
  },
  changeCardBtn: {
    flexShrink: 0,
    border: "1px solid #444",
    background: "#1a1a1a",
    color: "#ff6b6b",
    padding: "8px 12px",
    borderRadius: "12px",
    fontSize: "13px",
    fontWeight: "bold",
  },
  siteFooter: {
    marginTop: "80px",
    padding: "16px 12px",
    borderRadius: "14px",
    background: "#0b1018",
    border: "1px solid #2f3a4a",
    textAlign: "center",
  },
  
  footerTitle: {
    fontSize: "16px",
    fontWeight: "bold",
    color: "#f6c343",
    marginBottom: "8px",
  },
  
  footerText: {
    fontSize: "12px",
    lineHeight: "1.6",
    color: "#bbb",
    marginBottom: "12px",
  },
  
  footerLinks: {
    marginTop: "16px",
    display: "flex",
    justifyContent: "center",
    gap: "8px",
    flexWrap: "wrap",
  },
  
  footerLinkBtn: {
    marginTop: "4px",
    border: "1px solid #444",
    background: "#1a1a1a",
    color: "#f6c343",
    padding: "7px 10px",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: "bold",
  },
  backBtn: {
    marginBottom: "18px",
    border: "1px solid #444",
    background: "#1a1a1a",
    color: "#f6c343",
    padding: "10px 14px",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "bold",
  },
  
  infoPage: {
    padding: "18px",
    borderRadius: "16px",
    background: "#0b1018",
    border: "1px solid #2f3a4a",
    color: "#ddd",
    lineHeight: "1.7",
    fontSize: "14px",
  },
  
  infoPageTitle: {
    color: "#f6c343",
    fontSize: "24px",
    marginBottom: "16px",
  },
  installBtn: {
    width: "100%",
    marginTop: "8px",
    padding: "10px",
    borderRadius: "12px",
    border: "1px solid #f6c343",
    background: "#1a1a1a",
    color: "#f6c343",
    fontWeight: "bold",
  },

}
const styleTag = document.createElement("style")
styleTag.innerHTML = `
@keyframes pop {
  0% { transform: scale(0.8); }
  50% { transform: scale(1.15); }
  100% { transform: scale(1); }
}
`
document.head.appendChild(styleTag)

function getFontSizeByLength(text, scale = 1) {
  const len = text.length

  let size = 14

  if (len < 10) size = 32
  else if (len < 15) size = 26
  else if (len < 20) size = 22
  else if (len < 25) size = 18

  return size * scale + "px"
}