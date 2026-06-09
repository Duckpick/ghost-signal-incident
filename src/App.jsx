import { useEffect, useRef, useState } from "react"
import { IMG } from "./constants/img"
import { OBJECTS, OBJECT_CONFIG } from "./constants/object"
import { SOUND } from "./constants/sound"
import {
  playRandomSound,
  playSound,
} from "./utils/sound"

const STORAGE_KEY = "ghost_signal_incident_save_v1"
const SETTING_KEY = "ghost_signal_incident_setting_v1"
const LAST_SCREEN_KEY = "ghost_signal_incident_last_screen_v1"

const GAME_TITLE = "Ghost Signal Incident"
const GAME_CONFIG = {
  map: {
    width: 900,
    height: 900,
    viewWidth: 350,
    viewHeight: 412,
    sightXRate: 0.5,
    sightYRate: 0.455,
    ui: {
      analyzeMessageTop: -18,
      analyzeMessageFontSize: 14,
    },
  },

  player: {
    startX: 450,
    startY: 450,
    moveStep: 8,
    moveInterval: 55,
  },

  erosion: {
    idleGain: 0.08,
    analyzingGain: 0.45,
    ghostHitGain: 0.35,
    lanternOffRecover: -0.45,
    failDelay: 2500,
  },

  ghostStart: {
    minDistanceFromPlayer: 300,
  },
  difficulty: {
    baseMapSize: 900,
    maxMapSize: 2000,

    baseObjectCount: 8,
    maxObjectCount: 36,

    mapSizeIncreasePerStage: 35,
    objectIncreaseEveryStage: 1,

    ghostRangeIncreasePerStage: 2,
    ghostSpeedIncreasePerStage: 0,
    ghostDamageIncreasePerStage: 0.04,

    maxGhostRangeBonus: 45,
    maxGhostSpeedBonus: 0,
    maxGhostDamageBonus: 1.0,
  },
  duckPickEvent: {
    startStage: 1,
  },

  analyze: {
    range: 90,
  },
  ghost: {
    radius: 12,
    baseRange: 115,
    baseSpeed: 1.6,
    soundCooldown: 1,
    soundMaxDistance: 360,
  },

  ui: {
    analyzeMessageTop: -18,
    analyzeMessageFontSize: 14,
  },

}


const CONTACT_EMAIL = "gameduckman@gmail.com"

function loadJson(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function saveJson(key, data) {
  localStorage.setItem(key, JSON.stringify(data))
}

function getDefaultLanguage() {
  const saved = loadJson(SETTING_KEY)
  if (saved?.language) return saved.language
  return navigator.language.startsWith("ko") ? "ko" : "en"
}

const TEXT = {
  ko: {
    eventTimeBonus: "잠깐 정신을 잃은 것 같다...",
    best: "최고 점수",
    maxStage: "최고 사건",
    last: "최근 점수",
    failed: "실패",
    scan: "분석",
    noSignal: "신호 없음",
    resultEarned: "획득 점수",
    resultTotal: "누적 점수",
    nextCase: "다음 사건",
    caseLabel: "사건",
    erosionLabel: "침식",

    title: "기이한 사건 조사",
    subtitle: "이상 신호를 추적하고 흔적을 분석하세요.",
    start: "게임 시작",
    result: "결과",
    resultSuccess: "분석 완료",
    resultFail: "분석 실패",
    main: "메인",
    home: "메인",
    share: "공유",
    reset: "초기화",
    setting: "설정",
    rule: "게임 규칙",
    recordReset: "기록 초기화",
    sound: "사운드",
    bgm: "배경음",
    language: "언어",
    volume: "볼륨",
    close: "닫기",

    privacy: "개인정보",
    contact: "문의",
    support: "후원",
    aboutTitle: "게임 소개",

    aboutText:
      "기이한 사건 조사는 제한 시간 안에 이상 신호가 남은 물건을 찾아 분석하는 짧은 공포 생존 게임입니다. 랜턴을 켜면 이동과 분석이 가능하지만 침식이 쌓입니다. 랜턴을 끄면 침식은 줄어들지만 이동과 분석은 할 수 없습니다.",

    privacyText:
      "본 사이트는 사용자의 이름, 주소, 연락처 등 개인정보를 직접 수집하지 않습니다. 게임 기록, 설정, 언어 선택 등 일부 데이터는 사용자의 기기 브라우저 저장소에만 저장될 수 있습니다. 본 사이트는 Google AdSense를 사용할 수 있으며, 광고 제공 과정에서 쿠키가 사용될 수 있습니다.",

    contactText:
      "게임 관련 문의, 오류 제보, 광고 문의 또는 기타 요청은 아래 이메일로 연락할 수 있습니다.",

    supportText:
      "현재 별도의 결제나 후원 기능은 제공하지 않습니다. 게임을 즐기고 공유하거나 다시 방문해 주는 것만으로도 개발에 큰 도움이 됩니다.",

    googleAdsPolicy: "Google 광고 정책",
    contactEmailLabel: "이메일",
    resetConfirm: "저장된 기록을 초기화할까요?",

    rules: [
      "1. 이상 신호가 감지된 물건을 찾아 분석하세요.",
      "2. 분석 중에는 침식이 빠르게 증가합니다.",
      "3. 랜턴을 끄면 이동과 분석은 불가능하지만 침식이 감소합니다.",
      "4. 침식이 100%에 도달하면 분석에 실패합니다.",
      "5. 시간 내 분석률 100%를 달성하면 다음 사건으로 이동합니다.",
      "6. 일부 흔적은 현실 감각에 영향을 줄 수 있습니다.",
    ],

    signalNone: "반응이 없다...",
    signalWeak: "흔적이 약하게 느껴진다...",
    signalMedium: "흔적이 느껴진다...",
    signalStrong: "흔적이 강하다...",
  },

  en: {
    eventTimeBonus: "I lost track of time...",
    best: "Best Score",
    maxStage: "Best Case",
    last: "Last Score",
    failed: "FAILED",
    scan: "SCAN",
    noSignal: "NO SIGNAL",
    resultEarned: "Earned Score",
    resultTotal: "Total Score",
    nextCase: "Next Case",
    caseLabel: "Case",
    erosionLabel: "Erosion",

    title: "Ghost Signal Incident",
    subtitle: "Track abnormal signals and analyze hidden traces.",
    start: "Start Game",
    result: "Result",
    resultSuccess: "Analysis Complete",
    resultFail: "Analysis Failed",
    main: "Home",
    home: "Home",
    share: "Share",
    reset: "Reset",
    setting: "Settings",
    rule: "Rules",
    recordReset: "Reset Record",
    sound: "Sound",
    bgm: "BGM",
    language: "Language",
    volume: "Volume",
    close: "Close",

    privacy: "Privacy",
    contact: "Contact",
    support: "Support",
    aboutTitle: "About",

    aboutText:
      "Ghost Signal Incident is a short horror survival game where you search for objects with abnormal signals and analyze their traces before time runs out. Keeping the lantern on allows movement and analysis, but erosion builds up. Turning it off reduces erosion, but prevents movement and analysis.",

    privacyText:
      "This site does not directly collect personal information such as names, addresses, or phone numbers. Game records, settings, and language preferences may be stored only in the user's browser storage. This site may use Google AdSense, and cookies may be used during ad delivery.",

    contactText:
      "For game-related questions, bug reports, advertising inquiries, or other requests, please contact us by email.",

    supportText:
      "This site currently does not provide payment or donation features. Playing, sharing, or revisiting the game is a great way to support development.",

    googleAdsPolicy: "Google Ads Policy",
    contactEmailLabel: "Email",
    resetConfirm: "Reset saved data?",

    rules: [
      "1. Find and analyze objects emitting abnormal signals.",
      "2. Erosion increases quickly while analyzing.",
      "3. Turning off the lantern prevents movement and analysis, but reduces erosion.",
      "4. Analysis fails when erosion reaches 100%.",
      "5. Reach 100% analysis before time runs out to move to the next case.",
      "6. Some traces may affect your sense of reality.",
    ],

    signalNone: "No response...",
    signalWeak: "A weak trace is detected...",
    signalMedium: "A trace is detected...",
    signalStrong: "A strong trace is detected...",
  },
}

export default function App() {
  const savedData = loadJson(STORAGE_KEY, {})
  const savedSetting = loadJson(SETTING_KEY, {})

  const [page, setPage] = useState(window.location.pathname)
  const lastScreenData = loadJson(LAST_SCREEN_KEY, null)

  const [screen, setScreen] = useState(() => {
    if (lastScreenData?.screen === "failedByRefresh") {
      return "result"
    }

    return "main"
  })
  const [playerPos, setPlayerPos] = useState({
    x: GAME_CONFIG.player.startX,
    y: GAME_CONFIG.player.startY,
  })
  const [popup, setPopup] = useState(null)
  const [installPrompt, setInstallPrompt] = useState(null)

  const [language, setLanguage] = useState(savedSetting.language ?? getDefaultLanguage())
  const [soundOn, setSoundOn] = useState(savedSetting.soundOn ?? true)
  const [bgmOn, setBgmOn] = useState(savedSetting.bgmOn ?? true)
  const [volume, setVolume] = useState(savedSetting.volume ?? 0.3)

  const [nickname, setNickname] = useState(
    savedData.nickname || (language === "ko" ? "덕픽유저" : "DuckPlayer")
  )
  const [bestScore, setBestScore] = useState(savedData.bestScore ?? 0)
  const [lastScore, setLastScore] = useState(
    lastScreenData?.screen === "failedByRefresh"
      ? lastScreenData.analysisPercent ?? 0
      : savedData.lastScore ?? 0
  )
  const [resultType, setResultType] = useState(
    lastScreenData?.screen === "failedByRefresh"
      ? "fail"
      : "success"
  )
  const [totalScore, setTotalScore] = useState(
    savedData.totalScore ?? 0
  )
  const [resultTotalScore, setResultTotalScore] = useState(
    savedData.totalScore ?? 0
  )

  const [currentCase, setCurrentCase] = useState(
    savedData.currentCase ?? 1
  )
  const [resultCase, setResultCase] = useState(1)

  const [maxCase, setMaxCase] = useState(savedData.maxCase ?? 1)
  const [stageObjects, setStageObjects] = useState([])
  const [stageConfig, setStageConfig] = useState({
    mapSize: 900,
    objectCount: 6,
    ghostRangeBonus: 0,
    ghostSpeedBonus: 0,
    ghostDamageBonus: 0,
  })

  const [analyzeProgress, setAnalyzeProgress] = useState(0)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisPercent, setAnalysisPercent] = useState(0)
  const [lastAnalyzeMessage, setLastAnalyzeMessage] = useState("")
  const [objectSignals, setObjectSignals] = useState({})
  const [checkedObjectIds, setCheckedObjectIds] = useState([])
  const [analyzeMessageVisible, setAnalyzeMessageVisible] = useState(false)
  const [ending, setEnding] = useState(false)
  const [erosionPercent, setErosionPercent] = useState(0)
  const [remainTime, setRemainTime] = useState(180)
  const [lanternOn, setLanternOn] = useState(true)
  const [timeBonusEffect, setTimeBonusEffect] = useState(false)
  const [ghostPos, setGhostPos] = useState({ x: 120, y: 120 })
  const [ghostVel, setGhostVel] = useState({ x: 2.2, y: 1.6 })
  const resultLockedRef = useRef(false)

  const clickSoundRef = useRef(null)
  if (!clickSoundRef.current) {
    clickSoundRef.current = new Audio("/sound/ui/click.mp3")
  }
  const lanternSoundRef = useRef(null)

if (!lanternSoundRef.current) {
  lanternSoundRef.current =
    new Audio("/sound/ui/lantern.wav")
}

const successSoundRef = useRef(null)

if (!successSoundRef.current) {
  successSoundRef.current =
    new Audio("/sound/result/success.mp3")
}

const failSoundRef = useRef(null)
const bgmRef = useRef(null)
const heartbeatRef = useRef(null)
const randomAmbientTimeoutRef = useRef(null)

if (!failSoundRef.current) {
  failSoundRef.current =
    new Audio("/sound/result/fail.mp3")
}

if (!bgmRef.current) {
  bgmRef.current =
    new Audio("/sound/bgm/bgm_play.mp3")

  bgmRef.current.loop = true
}

if (!heartbeatRef.current) {
  heartbeatRef.current =
    new Audio("/sound/event/heartbeat.mp3")

  heartbeatRef.current.loop = true
}

  const t = TEXT[language]
  const isMobile = window.innerWidth <= 420
  const erosionLevel =

    erosionPercent >= 80
      ? 4
      : erosionPercent >= 60
        ? 3
        : erosionPercent >= 40
          ? 2
          : erosionPercent >= 20
            ? 1
            : 0

  const ghostRange =
    GAME_CONFIG.ghost.baseRange +
    stageConfig.ghostRangeBonus

  const ghostSpeed =
    GAME_CONFIG.ghost.baseSpeed +
    stageConfig.ghostSpeedBonus

  const ghostDamage =
    GAME_CONFIG.erosion.ghostHitGain +
    stageConfig.ghostDamageBonus
  const ghostDistance = Math.sqrt(
    (ghostPos.x - playerPos.x) ** 2 +
    (ghostPos.y - playerPos.y) ** 2
  )

  const ghostHit = ghostDistance <= ghostRange

  const scale = isMobile ? 1 : Math.min(1, window.innerHeight / 844)

  const getDuckPickBonusSeconds = (stage) => {
    if (stage < GAME_CONFIG.duckPickEvent.startStage) return 0

    if (stage <= 9) return 10
    if (stage <= 14) return 15
    if (stage <= 19) return 20
    if (stage <= 24) return 30
    if (stage <= 29) return 40
    if (stage <= 34) return 50

    return 60
  }

  const getStageConfig = (stage) => {
    const level = Math.max(0, stage - 1)
    const difficulty = GAME_CONFIG.difficulty

    return {
      mapSize: Math.min(
        difficulty.maxMapSize,
        difficulty.baseMapSize + level * difficulty.mapSizeIncreasePerStage
      ),

      objectCount: Math.min(
        difficulty.maxObjectCount,
        difficulty.baseObjectCount +
        Math.floor(level / difficulty.objectIncreaseEveryStage)
      ),

      ghostRangeBonus: Math.min(
        difficulty.maxGhostRangeBonus,
        level * difficulty.ghostRangeIncreasePerStage
      ),

      ghostSpeedBonus: Math.min(
        difficulty.maxGhostSpeedBonus,
        level * difficulty.ghostSpeedIncreasePerStage
      ),

      ghostDamageBonus: Math.min(
        difficulty.maxGhostDamageBonus,
        level * difficulty.ghostDamageIncreasePerStage
      ),
      totalSignalPercent: 100,

      minSignalPercent: Math.max(
        1,
        5 - Math.floor(level / 6)
      ),

      maxSignalPercent: Math.max(
        8,
        25 - level
      ),
    }
  }

  const getRandomPosition = (mapSize, placedItems, playerStart) => {
    const margin = OBJECT_CONFIG.spawnMargin
    const maxTry = 100
    const playerSafeRadius = 180

    for (let i = 0; i < maxTry; i++) {
      const nextPosition = {
        x: margin + Math.random() * (mapSize - margin * 2),
        y: margin + Math.random() * (mapSize - margin * 2),
      }

      const isTooCloseToObject = placedItems.some((item) => {
        const distance = Math.hypot(
          item.x - nextPosition.x,
          item.y - nextPosition.y
        )

        return distance < OBJECT_CONFIG.minSpawnDistance
      })

      const isTooCloseToPlayer =
        Math.hypot(
          nextPosition.x - playerStart.x,
          nextPosition.y - playerStart.y
        ) < playerSafeRadius

      if (!isTooCloseToObject && !isTooCloseToPlayer) {
        return nextPosition
      }
    }

    return {
      x: margin + Math.random() * (mapSize - margin * 2),
      y: margin + Math.random() * (mapSize - margin * 2),
    }
  }

  const getStageObjects = (count, mapSize, playerStart) => {
    const placedItems = []

    const normalObjects = OBJECTS.filter(
      (object) => object.type !== "event"
    )

    const shuffledObjects = [...normalObjects].sort(
      () => Math.random() - 0.5
    )

    const normalStageObjects = shuffledObjects
      .slice(0, count)
      .map((object, index) => {
        const position = getRandomPosition(
          mapSize,
          placedItems,
          playerStart
        )

        const nextObject = {
          ...object,
          id: `stage_object_${index}`,
          sourceId: object.id,
          x: position.x,
          y: position.y,
        }

        placedItems.push(nextObject)

        return nextObject
      })

    const eventObject = OBJECTS.find(
      (object) => object.id === "duckpick_doll"
    )

    if (
      !eventObject ||
      currentCase < GAME_CONFIG.duckPickEvent.startStage
    ) {
      return normalStageObjects
    }

    const eventPosition = getRandomPosition(
      mapSize,
      placedItems,
      playerStart
    )

    const duckPickObject = {
      ...eventObject,
      id: "stage_event_duckpick_doll",
      sourceId: eventObject.id,
      type: "event",
      eventType: "time_bonus",
      bonusSeconds: getDuckPickBonusSeconds(currentCase),
      x: eventPosition.x,
      y: eventPosition.y,
    }

    return [
      ...normalStageObjects,
      duckPickObject,
    ]
  }

  const createObjectSignals = (objects, config) => {
    const signals = {}
    let remainingSignal = config.totalSignalPercent

    const shuffledObjects = [...objects].sort(() => Math.random() - 0.5)

    shuffledObjects.forEach((object, index) => {
      const isLast = index === shuffledObjects.length - 1

      const randomSignal =
        config.minSignalPercent +
        Math.floor(
          Math.random() *
          (config.maxSignalPercent - config.minSignalPercent + 1)
        )

      let signalPower = isLast ? remainingSignal : randomSignal

      signalPower = Math.min(signalPower, remainingSignal)

      signals[object.id] = signalPower
      remainingSignal -= signalPower
    })

    return signals
  }

  const getFarGhostStart = (mapSize, playerStart) => {
    const candidates = [
      { x: 90, y: 90 },
      { x: mapSize - 90, y: 90 },
      { x: 90, y: mapSize - 90 },
      { x: mapSize - 90, y: mapSize - 90 },
    ]

    return candidates
      .filter((pos) => {
        const distance = Math.hypot(
          pos.x - playerStart.x,
          pos.y - playerStart.y
        )

        return distance >= GAME_CONFIG.ghostStart.minDistanceFromPlayer
      })
      .sort((a, b) => {
        const distanceA = Math.hypot(
          a.x - playerStart.x,
          a.y - playerStart.y
        )

        const distanceB = Math.hypot(
          b.x - playerStart.x,
          b.y - playerStart.y
        )

        return distanceB - distanceA
      })[0]
  }

  const playClick = () => {
    if (!soundOn) return
    const s = clickSoundRef.current.cloneNode()
    s.volume = volume
    s.play().catch(() => { })
  }
  const playLanternSound = () => {
    if (!soundOn) return
  
    const s =
      lanternSoundRef.current.cloneNode()
  
    s.volume = volume * 0.1
  
    s.play().catch(() => {})
  }
  
  const playSuccessSound = () => {
    if (!soundOn) return
  
    const s =
      successSoundRef.current.cloneNode()
  
    s.volume = volume * 0.1
  
    s.play().catch(() => {})
  }
  
  const playFailSound = () => {
    if (!soundOn) return
  
    const s =
      failSoundRef.current.cloneNode()
  
    s.volume = volume * 0.1
  
    s.play().catch(() => {})
  }

  const playRandomAmbientSound = () => {
    if (!soundOn) return
  
    const useGhost =
      Math.random() < 0.5
  
    const list = useGhost
      ? SOUND.ghost
      : SOUND.object
  
    const src =
      list[Math.floor(Math.random() * list.length)]
  
    const audio = new Audio(src)
  
    audio.volume =
      volume * (useGhost ? 0.5 : 0.38)
  
    audio.play().catch(() => {})
  }

  useEffect(() => {
    saveJson(STORAGE_KEY, {
      nickname,
      bestScore,
      lastScore,
      totalScore,
      currentCase,
      maxCase,
    })
  }, [
    nickname,
    bestScore,
    lastScore,
    totalScore,
    currentCase,
    maxCase,
  ])

  useEffect(() => {
    if (screen !== "play") return
    if (!soundOn) return
  
    const scheduleNext = () => {
      const delay =
        10000 + Math.random() * 20000
  
      randomAmbientTimeoutRef.current =
        setTimeout(() => {
          playRandomAmbientSound()
  
          scheduleNext()
        }, delay)
    }
  
    scheduleNext()
  
    return () => {
      clearTimeout(
        randomAmbientTimeoutRef.current
      )
    }
  }, [screen, soundOn, volume])

  useEffect(() => {
    if (!heartbeatRef.current) return
  
    if (
      screen === "play" &&
      erosionPercent >= 80 &&
      soundOn
    ) {
      heartbeatRef.current.volume =
        volume * 0.25
  
      heartbeatRef.current.play().catch(() => {})
    } else {
      heartbeatRef.current.pause()
      heartbeatRef.current.currentTime = 0
    }
  }, [
    erosionPercent,
    screen,
    soundOn,
    volume,
  ])

  useEffect(() => {
    if (screen !== "main") return

    saveJson(LAST_SCREEN_KEY, {
      screen: "main",
    })
  }, [screen])

  useEffect(() => {
    saveJson(SETTING_KEY, {
      language,
      soundOn,
      bgmOn,
      volume,
    })
  }, [language, soundOn, bgmOn, volume])

  useEffect(() => {
    if (!bgmRef.current) return
  
    if (
      screen === "play" &&
      soundOn
    ) {
      bgmRef.current.volume =
        volume * 0.6
  
      bgmRef.current.play().catch(() => {})
    } else {
      bgmRef.current.pause()
      bgmRef.current.currentTime = 0
    }
  }, [screen, soundOn, volume])

  useEffect(() => {
    const handlePopState = () => {
      setPage(window.location.pathname)
      window.scrollTo(0, 0)
    }

    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [])

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
    const handleBeforeUnload = () => {
      if (screen === "play" && !ending) {
        saveJson(LAST_SCREEN_KEY, {
          screen: "failedByRefresh",
          analysisPercent,
        })
        return
      }

      if (screen === "result") {
        saveJson(LAST_SCREEN_KEY, {
          screen: "resultSaved",
        })
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [screen, ending, analysisPercent])

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

  const changeNickname = () => {
    const next = prompt(t.nicknamePrompt, nickname)
    if (!next) return

    const hasKorean = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(next)
    const maxLen = hasKorean ? 8 : 12

    setNickname(next.slice(0, maxLen))
  }

  const resetData = () => {
    const ok = confirm(t.resetConfirm)
    if (!ok) return

    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(LAST_SCREEN_KEY)

    setNickname(language === "ko" ? "덕픽유저" : "DuckPlayer")
    setBestScore(0)
    setLastScore(0)
    setScreen("main")
    setTotalScore(0)

    setCurrentCase(1)

    setMaxCase(1)

    setStageObjects([])

    setStageConfig({
      mapSize: 900,
      objectCount: 6,
      ghostRangeBonus: 0,
      ghostSpeedBonus: 0,
      ghostDamageBonus: 0,
    })

    setAnalysisPercent(0)

    setAnalyzeProgress(0)

    setAnalyzing(false)

    setErosionPercent(0)

    setRemainTime(180)

    setCheckedObjectIds([])

    setObjectSignals({})

    setEnding(false)

    setLanternOn(true)
  }

  const startGame = () => {
    playClick()
    resultLockedRef.current = false

    const nextStageConfig = getStageConfig(currentCase)

    const playerStart = {
      x: nextStageConfig.mapSize / 2,
      y: nextStageConfig.mapSize / 2,
    }

    const nextStageObjects = getStageObjects(
      nextStageConfig.objectCount,
      nextStageConfig.mapSize,
      playerStart
    )

    setStageConfig(nextStageConfig)
    setStageObjects(nextStageObjects)

    setObjectSignals(
      createObjectSignals(
        nextStageObjects.filter((object) => object.type !== "event"),
        nextStageConfig
      )
    )
    setCheckedObjectIds([])
    setAnalyzeProgress(0)
    setAnalyzing(false)
    setAnalysisPercent(0)
    setErosionPercent(0)
    setRemainTime(180)
    setLastAnalyzeMessage("")
    setAnalyzeMessageVisible(false)
    setEnding(false)
    setLanternOn(true)
    setResultType("success")
    setResultCase(currentCase)

    setPlayerPos(playerStart)

    setGhostPos(
      getFarGhostStart(nextStageConfig.mapSize, playerStart)
    )

    saveJson(LAST_SCREEN_KEY, {
      screen: "play",
    })
    setScreen("play")
  }
  const movePlayer = (dx, dy) => {
    if (ending || !lanternOn) return
    setPlayerPos((prev) => {
      if (dx !== 0 && dy !== 0) {
        dx *= 0.707
        dy *= 0.707
      }
      const nextX = Math.min(
        stageConfig.mapSize,
        Math.max(0, prev.x + dx)
      )

      const nextY = Math.min(
        stageConfig.mapSize,
        Math.max(0, prev.y + dy)
      )

      const hitObject = stageObjects.find((object) => {
        const objectCenterX = object.x + OBJECT_CONFIG.size / 2
        const objectCenterY = object.y + OBJECT_CONFIG.size / 2

        const distance = Math.hypot(
          objectCenterX - nextX,
          objectCenterY - nextY
        )

        return distance <= OBJECT_CONFIG.collisionRadius
      })

      if (hitObject) {
        return prev
      }

      return {
        x: nextX,
        y: nextY,
      }
    })
  }

  const startTouchMove = (dx, dy) => {
    const nextKey = `${dx},${dy}`
  
    if (touchMoveRef.current?.key === nextKey) {
      return
    }
  
    if (touchMoveRef.current?.timer) {
      clearInterval(touchMoveRef.current.timer)
    }
  
    movePlayer(dx, dy)
  
    const timer = setInterval(() => {
      movePlayer(dx, dy)
    }, GAME_CONFIG.player.moveInterval)
  
    touchMoveRef.current = {
      key: nextKey,
      timer,
    }
  }
  
  const stopTouchMove = () => {
    if (!touchMoveRef.current?.timer) return
  
    clearInterval(touchMoveRef.current.timer)
    touchMoveRef.current = null
  }

  const handleJoystickMove = (clientX, clientY) => {
    const rect =
      joystickRef.current?.getBoundingClientRect()
  
    if (!rect) return
  
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
  
    const dx = clientX - centerX
    const dy = clientY - centerY
  
    const deadZone = 20
  
    if (
      Math.abs(dx) < deadZone &&
      Math.abs(dy) < deadZone
    ) {
      stopTouchMove()
      return
    }
  
    const moveX =
    Math.abs(dx) > deadZone
      ? dx > 0
        ? GAME_CONFIG.player.moveStep
        : -GAME_CONFIG.player.moveStep
      : 0
  
  const moveY =
    Math.abs(dy) > deadZone
      ? dy > 0
        ? GAME_CONFIG.player.moveStep
        : -GAME_CONFIG.player.moveStep
      : 0
  
  startTouchMove(moveX, moveY)
  }


  const getNearObject = () => {
    return stageObjects.find((object) => {
      const objectCenterX = object.x + OBJECT_CONFIG.size / 2
      const objectCenterY = object.y + OBJECT_CONFIG.size / 2

      const distance = Math.hypot(
        objectCenterX - playerPos.x,
        objectCenterY - playerPos.y
      )

      return distance <= OBJECT_CONFIG.analyzeRadius
    })
  }

  const nearObject = getNearObject()
  const canAnalyze =
    lanternOn &&
    nearObject &&
    !checkedObjectIds.includes(nearObject.id)

  useEffect(() => {
    if (!analyzing) return

    const timer = setInterval(() => {
      setAnalyzeProgress((prev) => {
        const next = prev + 4

        if (next >= 100) {
          if (!canAnalyze) {
            clearInterval(timer)
            return 0
          }

          clearInterval(timer)

          setAnalyzing(false)
          setAnalyzeProgress(0)

          if (nearObject) {
            setCheckedObjectIds((prev) => [...prev, nearObject.id])
          }

          if (nearObject?.eventType === "time_bonus") {
            setRemainTime((prev) => prev + nearObject.bonusSeconds)
            setTimeBonusEffect(true)

            setTimeout(() => {
              setTimeBonusEffect(false)
            }, 600)

            setLastAnalyzeMessage(t.eventTimeBonus)

            setAnalyzeMessageVisible(true)

            setTimeout(() => {
              setAnalyzeMessageVisible(false)
            }, 1500)

            return 100
          }

          const signalPower =
            objectSignals[nearObject?.id] || 0

          if (signalPower > 0) {
            setAnalysisPercent((prevPercent) =>
              Math.min(100, prevPercent + signalPower)
            )
          }

          let message = t.signalNone

          if (signalPower <= 0) {
            message = t.signalNone
          } else if (signalPower < 10) {
            message = t.signalWeak
          } else if (signalPower < 30) {
            message = t.signalMedium
          } else {
            message = t.signalStrong
          }

          setLastAnalyzeMessage(message)
          setAnalyzeMessageVisible(true)

          setTimeout(() => {
            setAnalyzeMessageVisible(false)
          }, 1500)

          return 100
        }

        return next
      })
    }, 100)

    return () => clearInterval(timer)
  }, [analyzing])

  useEffect(() => {
    if (screen !== "play") return
    if (analysisPercent < 100) return
    if (resultLockedRef.current) return

    resultLockedRef.current = true

    setAnalyzing(false)
    setAnalyzeProgress(0)
    setEnding(true)

    setTimeout(() => {
      const earnedScore =
        Math.max(0, Math.floor(100 * remainTime))

      const nextTotalScore =
        currentCase === 1
          ? earnedScore
          : totalScore + earnedScore

      const nextCase = currentCase + 1
      playSuccessSound()
      setResultType("success")
      setLastScore(earnedScore)
      setTotalScore(nextTotalScore)
      setResultTotalScore(nextTotalScore)
      setBestScore((prevBest) =>
        Math.max(prevBest, earnedScore)
      )
      setMaxCase((prevMax) =>
        Math.max(prevMax, nextCase)
      )
      setResultCase(currentCase)
      setCurrentCase(nextCase)

      saveJson(LAST_SCREEN_KEY, {
        screen: "resultSaved",
      })

      setScreen("result")
    }, 3000)
  }, [screen, analysisPercent])

  useEffect(() => {
    if (screen !== "play") return
    if (ending) return

    const timer = setInterval(() => {
      setErosionPercent((prev) => {
        const erosionChange = lanternOn
          ? analyzing
            ? GAME_CONFIG.erosion.analyzingGain
            : GAME_CONFIG.erosion.idleGain
          : GAME_CONFIG.erosion.lanternOffRecover

        const next =
          Math.max(
            0,
            Math.min(100, prev + erosionChange)
          )

        if (next >= 100) {
          setEnding(true)

          setAnalyzing(false)
          setAnalyzeProgress(0)

          setTimeout(() => {
            playFailSound()
            setResultType("fail")
            setResultCase(currentCase)
            setLastScore(analysisPercent)

            saveJson(LAST_SCREEN_KEY, {
              screen: "resultSaved",
            })

            setScreen("result")
          }, GAME_CONFIG.erosion.failDelay)

          return 100
        }

        return next
      })
    }, 200)

    return () => clearInterval(timer)
  }, [screen, ending, analyzing, lanternOn])

  useEffect(() => {
    if (screen !== "play") return
    if (ending) return

    const timer = setInterval(() => {
      setRemainTime((prev) => {
        if (prev <= 1) {
          if (resultLockedRef.current) {
            return 0
          }

          resultLockedRef.current = true
          setEnding(true)

          setTimeout(() => {
            playFailSound()
            setResultType("fail")
            setResultCase(currentCase)

            saveJson(LAST_SCREEN_KEY, {
              screen: "resultSaved",
            })

            setScreen("result")
          }, 2000)

          return 0
        }

        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [screen, ending])

  useEffect(() => {
    if (screen !== "play") return
    if (ending) return

    const timer = setInterval(() => {
      setGhostPos((prev) => {
        let nextX = prev.x + ghostVel.x * ghostSpeed
        let nextY = prev.y + ghostVel.y * ghostSpeed

        let nextVelX = ghostVel.x
        let nextVelY = ghostVel.y

        if (
          nextX <= GAME_CONFIG.ghost.radius ||
          nextX >= stageConfig.mapSize - GAME_CONFIG.ghost.radius
        ) {
          nextVelX *= -1
          nextX = Math.max(
            GAME_CONFIG.ghost.radius,
            Math.min(stageConfig.mapSize - GAME_CONFIG.ghost.radius, nextX)
          )
        }

        if (
          nextY <= GAME_CONFIG.ghost.radius ||
          nextY >= stageConfig.mapSize - GAME_CONFIG.ghost.radius
        ) {
          nextVelY *= -1
          nextY = Math.max(
            GAME_CONFIG.ghost.radius,
            Math.min(stageConfig.mapSize - GAME_CONFIG.ghost.radius, nextY)
          )
        }

        setGhostVel({ x: nextVelX, y: nextVelY })

        return {
          x: nextX,
          y: nextY,
        }
      })
    }, 60)

    return () => clearInterval(timer)
  }, [screen, ending, ghostVel, ghostSpeed])

  useEffect(() => {
    if (screen !== "play") return
    if (ending) return
    if (!lanternOn) return

    const dx = ghostPos.x - playerPos.x
    const dy = ghostPos.y - playerPos.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    const isGhostInRange = distance <= ghostRange

    if (!isGhostInRange) return

    setErosionPercent((prev) =>
      Math.min(
        100,
        prev + ghostDamage
      )
    )
  }, [
    screen,
    ending,
    lanternOn,
    ghostPos,
    playerPos,
    ghostRange,
  ])

  const pressedKeysRef = useRef({})
  const touchMoveRef = useRef(null)
  const joystickRef = useRef(null)

  useEffect(() => {
    const moveKeys = [
      "w",
      "a",
      "s",
      "d",
      "arrowup",
      "arrowdown",
      "arrowleft",
      "arrowright",
    ]
    const actionKeys = [" ", "shift"]

    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase()

      const isMoveKey = moveKeys.includes(key)
      const isActionKey = actionKeys.includes(key)

      if (!isMoveKey && !isActionKey) return

      e.preventDefault()
      pressedKeysRef.current[key] = true
      if (e.key === " " && canAnalyze && !ending) {
        setAnalyzing(true)
      }
      if (key === "shift" && !ending && !e.repeat) {
        playLanternSound()
        setLanternOn((prev) => !prev)
      }
    }

    const handleKeyUp = (e) => {
      const key = e.key.toLowerCase()
      pressedKeysRef.current[key] = false
      if (e.key === " ") {
        setAnalyzing(false)
        setAnalyzeProgress(0)
      }
    }

    const moveLoop = setInterval(() => {
      const keys = pressedKeysRef.current

      if (keys.w || keys.arrowup) {
        movePlayer(0, -GAME_CONFIG.player.moveStep)
      }

      if (keys.s || keys.arrowdown) {
        movePlayer(0, GAME_CONFIG.player.moveStep)
      }

      if (keys.a || keys.arrowleft) {
        movePlayer(-GAME_CONFIG.player.moveStep, 0)
      }

      if (keys.d || keys.arrowright) {
        movePlayer(GAME_CONFIG.player.moveStep, 0)
      }
    }, GAME_CONFIG.player.moveInterval)

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    return () => {
      clearInterval(moveLoop)
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [canAnalyze, ending])

  const shareTextResult = async () => {
    const shareUrl = window.location.origin
    const message =
      language === "ko"
        ? `${GAME_TITLE}\n닉네임: ${nickname}\n최고 기록: ${bestScore}\n지금 도전하기 👉\n${shareUrl}`
        : `${GAME_TITLE}\nNickname: ${nickname}\nBest Score: ${bestScore}\nTry it now 👉\n${shareUrl}`

    try {
      if (navigator.share && /Mobi|Android|iPhone/i.test(navigator.userAgent)) {
        await navigator.share({
          title: GAME_TITLE,
          text: message,
        })
        return
      }
    } catch {
      return
    }

    await navigator.clipboard.writeText(message)
    alert(language === "ko" ? "복사되었습니다." : "Copied!")
  }

  const PageNav = () => (
    <div style={styles.pageNav}>
      <button style={styles.pageNavBtn} onClick={() => goPage("/")}>
        {t.home}
      </button>
  
      <button style={styles.pageNavBtn} onClick={() => goPage("/privacy")}>
        {t.privacy}
      </button>
  
      <button style={styles.pageNavBtn} onClick={() => goPage("/contact")}>
        {t.contact}
      </button>
  
      <button style={styles.pageNavBtn} onClick={() => goPage("/support")}>
        {t.support}
      </button>
    </div>
  )
  
  const CommonFooter = () => (
    <div style={styles.siteFooter}>
      <div style={styles.footerTitle}>{t.aboutTitle}</div>
      <div style={styles.footerText}>{t.aboutText}</div>
  
      <PageNav />
    </div>
  )
  
  if (page === "/privacy") {
    return (
      <div style={styles.page}>
        <div style={styles.app}>
          <PageNav />
  
          <div style={styles.infoPage}>
            <div style={styles.infoPageTitle}>{t.privacy}</div>
  
            <p>{t.privacyText}</p>
  
            <p>
              {t.googleAdsPolicy}: https://policies.google.com/technologies/ads
            </p>
  
            <p>
              {t.contactEmailLabel}: {CONTACT_EMAIL}
            </p>
          </div>
        </div>
      </div>
    )
  }
  
  if (page === "/contact") {
    return (
      <div style={styles.page}>
        <div style={styles.app}>
          <PageNav />
  
          <div style={styles.infoPage}>
            <div style={styles.infoPageTitle}>{t.contact}</div>
  
            <p>{t.contactText}</p>
  
            <p>
              {t.contactEmailLabel}: {CONTACT_EMAIL}
            </p>
          </div>
        </div>
      </div>
    )
  }
  
  if (page === "/support") {
    return (
      <div style={styles.page}>
        <div style={styles.app}>
          <PageNav />
  
          <div style={styles.infoPage}>
            <div style={styles.infoPageTitle}>{t.support}</div>
  
            <p>{t.supportText}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <style>
        {`

@keyframes fadeUpPhone {
  0% {
    opacity: 0;
    transform: translateX(-50%) translateY(8px);
  }

  20% {
    opacity: 1;
  }

  100% {
    opacity: 0;
    transform: translateX(-50%) translateY(-18px);
  }
}

@keyframes endingFadeOut {
  0% {
    opacity: 1;
    filter: brightness(1);
  }

  100% {
    opacity: 0;
    filter: brightness(0);
  }
}
@keyframes flashlightShake {
  0% {
    transform: translate(-50%, -50%) translate(0px, 0px);
  }

  25% {
    transform: translate(-50%, -50%) translate(-2px, 1px);
  }

  50% {
    transform: translate(-50%, -50%) translate(2px, -1px);
  }

  75% {
    transform: translate(-50%, -50%) translate(-1px, 2px);
  }

  100% {
    transform: translate(-50%, -50%) translate(0px, 0px);
  }
}
  @keyframes criticalBlink {
  0% {
    opacity: 1;
  }

  50% {
    opacity: 0.35;
  }

  100% {
    opacity: 1;
  }
}
  @keyframes failedFlicker {
  0% {
    opacity: 0.5;
  }

  50% {
    opacity: 1;
  }

  100% {
    opacity: 0.65;
  }
}
@keyframes mapDangerShake {
  0% {
    transform: translate(0px, 0px);
  }

  25% {
    transform: translate(-0.5px, 0.5px);
  }

  50% {
    transform: translate(0.5px, -0.5px);
  }

  75% {
    transform: translate(-0.5px, -0.5px);
  }

  100% {
    transform: translate(0px, 0px);
  }
}
  @keyframes erosionNoiseFlicker {
  0% {
    opacity: 0.08;
    background-position: 0px 0px;
  }

  50% {
    opacity: 0.18;
    background-position: 0px 4px;
  }

  100% {
    opacity: 0.1;
    background-position: 0px -3px;
  }
}

@keyframes endingCorruption {
  0% {
    opacity: 0.25;
    transform: translate(0px, 0px);
    background-position: 0px 0px;
  }

  20% {
    opacity: 0.5;
    transform: translate(-2px, 1px);
    background-position: 0px 3px;
  }
  22% {
  opacity: 0.9;
  transform: translate(-6px, 2px);
  background-position: 0px 14px;
}  

  40% {
    opacity: 0.35;
    transform: translate(2px, -1px);
    background-position: 0px -2px;
  }

  60% {
    opacity: 0.55;
    transform: translate(-1px, 0px);
    background-position: 0px 5px;
  }
    63% {
  opacity: 1;
  transform: translate(5px, -2px);
  background-position: 0px -12px;
}

  80% {
    opacity: 0.4;
    transform: translate(1px, 1px);
    background-position: 0px -4px;
  }

  100% {
    opacity: 0.3;
    transform: translate(0px, 0px);
    background-position: 0px 0px;
  }
}
  
          button:active {
            transform: scale(0.94);
          }
        `}
      </style>

      <div style={styles.page}>

        <div style={{ ...styles.app, transform: `scale(${scale})` }}>
          {screen === "main" && (
            <>
              <div
                style={{
                  ...styles.mainVisual,
                  backgroundImage: `
          linear-gradient(
            180deg,
            rgba(0,0,0,0.58) 0%,
            rgba(0,0,0,0.28) 38%,
            rgba(0,0,0,0.78) 100%
          ),
          url(${IMG.main.background})
        `,
                }}
              >
                <div style={styles.mainTopBar}>
                  <div style={styles.brandRow}>
                    <div style={styles.logoBox}>
                    <img
  src={IMG.ui.duckpickLogo}
  alt=""
  style={styles.logoImg}
/>
                    </div>
                    <div style={styles.brandText}>DuckPick Studio</div>
                  </div>

                  <div style={styles.rightGroup}>
                    <button
                      style={styles.iconBtn}
                      onClick={() => {
                        playClick()
                        setPopup("rule")
                      }}
                    >
                      !
                    </button>

                    <button
                      style={styles.iconBtn}
                      onClick={() => {
                        playClick()
                        setPopup("setting")
                      }}
                    >
                      ⚙
                    </button>
                  </div>
                </div>

                <div style={styles.mainTitleArea}>
                  <div style={styles.gameTitle}>{t.title}</div>
                  <div style={styles.gameSubtitle}>{t.subtitle}</div>
                </div>

                <div style={styles.mainScoreBox}>
                  <div style={styles.mainScoreRow}>
                    <span>{t.maxStage}</span>
                    <strong>{maxCase}</strong>
                  </div>

                  <div style={styles.mainScoreRow}>
                    <span>{t.best}</span>
                    <strong>{bestScore}</strong>
                  </div>
                </div>

                <button style={styles.startBtn} onClick={startGame}>
                  {t.start}
                </button>
              </div>

              <CommonFooter />
            </>
          )}
          {screen === "play" && (
            <div style={styles.playScreen}>
              <div
                style={{
                  ...styles.mapArea,
                  ...(erosionLevel >= 4 ? styles.mapAreaDanger : null),
                }}
              >
                <div
                  style={{
                    ...styles.mapLayer,
                    width: `${stageConfig.mapSize}px`,
                    height: `${stageConfig.mapSize}px`,
                    transform: `translate(
${GAME_CONFIG.map.viewWidth * GAME_CONFIG.map.sightXRate - playerPos.x}px,
${GAME_CONFIG.map.viewHeight * GAME_CONFIG.map.sightYRate - playerPos.y}px
    )`,
                  }}
                >


                  {stageObjects.map((object) => (
                    <div
                      key={object.id}
                      style={{
                        ...styles.objectWrap,
                        width: `${OBJECT_CONFIG.size}px`,
                        height: `${OBJECT_CONFIG.size}px`,
                        left: `${object.x}px`,
                        top: `${object.y}px`,
                      }}
                    >
                      <div
                        style={{
                          ...styles.objectCollisionRange,
                          width: `${OBJECT_CONFIG.collisionRadius * 2}px`,
                          height: `${OBJECT_CONFIG.collisionRadius * 2}px`,
                        }}
                      ></div>

                      <div
                        style={{
                          ...styles.objectRange,
                          width: `${OBJECT_CONFIG.analyzeRadius * 2}px`,
                          height: `${OBJECT_CONFIG.analyzeRadius * 2}px`,
                        }}
                      ></div>

                      <img
                        src={object.img}
                        alt=""
                        style={{
                          ...styles.objectImg,
                          ...(object.type === "event" &&
                            !checkedObjectIds.includes(object.id)
                            ? styles.eventObjectImg
                            : null),
                        }}
                      />
                    </div>
                  ))}

                  <div
                    style={{
                      ...styles.ghostRange,
                      width: `${ghostRange * 2}px`,
                      height: `${ghostRange * 2}px`,
                      left: `${ghostPos.x}px`,
                      top: `${ghostPos.y}px`,
                    }}
                  ></div>

                  <div
                    style={{
                      ...styles.ghostCore,
                      width: `${GAME_CONFIG.ghost.radius * 2}px`,
                      height: `${GAME_CONFIG.ghost.radius * 2}px`,
                      left: `${ghostPos.x}px`,
                      top: `${ghostPos.y}px`,
                    }}
                  ></div>

                </div>
                <div style={styles.erosionHud}>
                  <div style={styles.erosionTopRow}>
                    <div style={styles.erosionLabel}>
                      {t.erosionLabel}
                    </div>

                    <div style={styles.erosionBarWrap}>
                      <div style={styles.erosionBar}>
                        <div
                          style={{
                            ...styles.erosionFill,
                            width: `${erosionPercent}%`,
                          }}
                        ></div>
                      </div>

                      <div style={styles.erosionGaugeText}>
                        {Math.floor(erosionPercent)}%
                      </div>
                    </div>
                  </div>
                </div>
                <div
  style={{
    ...styles.sightPoint,
    ...(canAnalyze
      ? styles.sightPointActive
      : null),
  }}
>
                  {analyzing && (
                    <svg
                      style={styles.sightProgressRing}
                      width="48"
                      height="48"
                    >
                      <circle
                        cx="24"
                        cy="24"
                        r="20"
                        stroke="rgba(255,255,255,0.14)"
                        strokeWidth="3"
                        fill="none"
                      />

                      <circle
                        cx="24"
                        cy="24"
                        r="20"
                        stroke="#3fa476"
                        strokeWidth="3"
                        fill="none"

                        strokeLinecap="round"

                        strokeDasharray={126}

                        strokeDashoffset={
                          126 -
                          (126 * analyzeProgress) / 100
                        }

                        transform="rotate(-90 24 24)"
                      />
                    </svg>
                  )}
                </div>
                {analyzeMessageVisible && (
                  <div style={styles.sightAnalyzeMessage}>
                    {lastAnalyzeMessage}
                  </div>
                )}
                <div
                  style={{
                    ...styles.flashlight,

                    ...(lanternOn
                      ? ghostHit
                        ? styles.flashlightGhostHit
                        : styles.flashlightOn
                      : styles.flashlightOff),

                    ...(erosionLevel >= 2
                      ? styles.flashlightShake
                      : null),
                  }}
                ></div>
                <div
                  style={{
                    ...styles.darkOverlay,
                    ...(lanternOn ? null : styles.darkOverlayLanternOff),
                  }}
                ></div>
                {erosionLevel >= 3 && !ending && (
                  <div style={styles.erosionNoise}></div>
                )}
                {ending && <div style={styles.endingNoise}></div>}
                {ending && erosionPercent >= 100 && (
                  <div style={styles.failedText}>
                    {t.failed}
                  </div>
                )}
              </div>

              <div style={styles.leftHandWrap}>
                <img src={IMG.ui.leftPhone} alt="" style={styles.leftPhone} />

                <div style={styles.phoneScreen}>
                  <div
                    style={{
                      ...styles.phoneTime,
                      ...(timeBonusEffect
                        ? styles.phoneTimeBonus
                        : null),

                      ...(remainTime <= 60
                        ? styles.phoneTimeDanger
                        : null),

                      ...(remainTime <= 30
                        ? styles.phoneTimeCritical
                        : null),
                    }}
                  >
                    {String(Math.floor(remainTime / 60)).padStart(2, "0")}:
                    {String(remainTime % 60).padStart(2, "0")}
                  </div>
                  <div style={styles.phonePercent}>{analysisPercent}%</div>


                  <button
                    style={{
                      ...styles.analyzeBtn,
                      ...(canAnalyze
                        ? styles.analyzeBtnActive
                        : styles.analyzeBtnDisabled),
                    }}
                    disabled={!canAnalyze}
                    onMouseDown={() => {
                      if (!canAnalyze || ending) return
                      setAnalyzing(true)
                    }}
                    onMouseUp={() => {
                      setAnalyzing(false)
                      setAnalyzeProgress(0)
                    }}
                    onMouseLeave={() => {
                      setAnalyzing(false)
                      setAnalyzeProgress(0)
                    }}
                    onTouchStart={() => {
                      if (!canAnalyze || ending) return
                      setAnalyzing(true)
                    }}
                    onTouchEnd={() => {
                      setAnalyzing(false)
                      setAnalyzeProgress(0)
                    }}
                  >
                    {canAnalyze
                      ? analyzing
                        ? t.scan
                        : t.scan
                      : t.noSignal}
                  </button>

                </div>
              </div>
              <div style={styles.rightLanternWrap}>
                <img
                  src={IMG.ui.rightLantern}
                  alt=""
                  style={styles.rightLantern}
                />

                <button
                  style={{
                    ...styles.lanternToggleBtn,
                    color: lanternOn ? "#6dff9f" : "#cfcfcf",
                  }}
                  onClick={() => {
                    playLanternSound()
                    setLanternOn((prev) => !prev)
                  }}
                >
                  {lanternOn ? "ON" : "OFF"}
                </button>
              </div>


<div style={styles.movePad}>
  <div
    ref={joystickRef}
    style={styles.moveRing}
    onTouchStart={(e) => {
      const touch = e.touches[0]

      handleJoystickMove(
        touch.clientX,
        touch.clientY
      )
    }}
    onTouchMove={(e) => {
      const touch = e.touches[0]

      handleJoystickMove(
        touch.clientX,
        touch.clientY
      )
    }}
    onTouchEnd={stopTouchMove}
    onTouchCancel={stopTouchMove}
  >
    <div style={styles.moveCenter}></div>
  </div>
</div>


              <div style={styles.caseHud}>
                {t.caseLabel} #{currentCase}
              </div>
            </div>
          )}

          {screen === "result" && (
            <>
              <div style={styles.resultWrap}>
                <div style={styles.resultPhone}>
                  <div style={styles.resultCase}>
                    {t.caseLabel} #{String(resultCase).padStart(2, "0")}
                  </div>

                  <div
                    style={{
                      ...styles.resultTitle,
                      color:
                        resultType === "fail"
                          ? "#ff5555"
                          : "#7dffe1",
                    }}
                  >
                    {resultType === "success"
                      ? t.resultSuccess
                      : t.resultFail}
                  </div>

                  <div style={styles.resultInfoBox}>
                    <div style={styles.resultInfoRow}>
                      <span>{t.resultEarned}</span>
                      <strong>{lastScore}</strong>
                    </div>

                    <div style={styles.resultInfoRow}>
                      <span>{t.resultTotal}</span>
                      <strong>{resultTotalScore}</strong>
                    </div>
                  </div>
                </div>

                <div style={styles.resultActionBox}>

                  <button
                    style={styles.nextBtn}
                    onClick={() => {
                      if (resultType === "fail") {
                        setLastScore(0)
                        setTotalScore(0)
                        setResultTotalScore(0)
                        setCurrentCase(1)
                        setAnalysisPercent(0)
                        setAnalyzeProgress(0)
                        setAnalyzing(false)
                        setErosionPercent(0)
                        setRemainTime(180)
                        setAnalyzeMessageVisible(false)
                        setEnding(false)
                        setLanternOn(true)
                        setStageObjects([])
                        setStageConfig({
                          mapSize: 900,
                          objectCount: 6,
                          ghostRangeBonus: 0,
                          ghostSpeedBonus: 0,
                          ghostDamageBonus: 0,
                        })
                        saveJson(LAST_SCREEN_KEY, {
                          screen: "main",
                        })

                        setScreen("main")
                        return
                      }

                      startGame()
                    }}
                  >
                    {resultType === "fail" ? t.main : t.nextCase}
                  </button>

                  <button style={styles.shareBtn} onClick={() => { playClick(); shareTextResult() }}>
                    {t.share}
                  </button>
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
                  ) : (
                    <>

                      <button style={styles.popupBtn} onClick={() => { playClick(); resetData() }}>
                        {t.recordReset}
                      </button>

                      <button
                        style={styles.popupBtn}
                        onClick={async () => {
                          playClick()
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
                          onClick={() => { playClick(); setSoundOn(!soundOn) }}
                          style={soundOn ? styles.onBtn : styles.offBtn}
                        >
                          {soundOn ? "ON" : "OFF"}
                        </button>
                      </div>

                      <div style={styles.settingRow}>
                        {t.bgm}
                        <button
                          onClick={() => { playClick(); setBgmOn(!bgmOn) }}
                          style={bgmOn ? styles.onBtn : styles.offBtn}
                        >
                          {bgmOn ? "ON" : "OFF"}
                        </button>
                      </div>

                      <div style={styles.settingRow}>
                        {t.language}
                        <button
                          onClick={() => { playClick(); setLanguage(language === "ko" ? "en" : "ko") }}
                          style={styles.langBtn}
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

                <button style={styles.popupCloseBtn} onClick={() => { playClick(); setPopup(null) }}>
                  {t.close}
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </>
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
    padding: "10px",
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

  logoBox: {
    width: "28px",
    height: "28px",
    borderRadius: "8px",
    background: "transparent",
    border: "none",
    color: "#111",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontWeight: "bold",
  },
  logoImg: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
  },

  nicknameText: {
    fontSize: "18px",
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
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    border: "1px solid #555",
    background: "#1a1a1a",
    color: "#fff",
    fontSize: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  row2: {
    display: "flex",
    alignItems: "center",
    marginTop: "10px",
    justifyContent: "space-between",
  },

  scoreText: {
    fontSize: "15px",
    color: "#f6c343",
    fontWeight: "bold",
  },

  resetBtn: {
    border: "1px solid #444",
    background: "#1a1a1a",
    color: "#f6c343",
    padding: "8px 12px",
    borderRadius: "12px",
    fontSize: "13px",
    fontWeight: "bold",
  },

  horrorHero: {
    marginTop: "18px",
    padding: "26px 16px",
    borderRadius: "18px",
    background:
      "radial-gradient(circle at 50% 0%, rgba(120,20,20,0.28), transparent 45%), linear-gradient(180deg, #15191f 0%, #050608 100%)",
    border: "1px solid rgba(180,40,40,0.45)",
    textAlign: "center",
    boxShadow: "0 0 28px rgba(120,0,0,0.25)",
  },

  horrorLabel: {
    display: "inline-block",
    marginBottom: "10px",
    padding: "5px 10px",
    borderRadius: "999px",
    border: "1px solid rgba(255,255,255,0.18)",
    color: "#b9b9b9",
    fontSize: "11px",
    letterSpacing: "2px",
    fontWeight: "bold",
  },

  horrorStatusBox: {
    marginTop: "18px",
    padding: "12px",
    borderRadius: "14px",
    background: "rgba(0,0,0,0.35)",
    border: "1px solid rgba(255,255,255,0.1)",
  },

  statusRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 2px",
    color: "#aaa",
    fontSize: "13px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },

  gameTitle: {
    fontSize: "40px",
    fontWeight: "900",
    color: "#f2f2f2",
    marginBottom: "8px",
    letterSpacing: "-0.8px",
    lineHeight: "1.05",
    textShadow: "0 2px 8px rgba(0,0,0,0.8)",
  },

  gameSubtitle: {
    fontSize: "15px",
    color: "#ccc",
  },

  startBtn: {
    width: "100%",
    marginTop: "auto",
    padding: "16px",
    borderRadius: "14px",
    background: "linear-gradient(180deg, #9c1f1f 0%, #4a0808 100%)",
    border: "1px solid rgba(255,255,255,0.18)",
    color: "#fff",
    fontSize: "21px",
    fontWeight: "bold",
    cursor: "pointer",
    boxShadow: "0 0 18px rgba(30,180,85,0.35)",
  },


  resultWrap: {
    textAlign: "center",
    paddingTop: "80px",
  },
  resultPhone: {
    width: "100%",
    boxSizing: "border-box",
    padding: "26px 18px",

    borderRadius: "24px",

    background:
      "linear-gradient(180deg, #0d1318 0%, #040506 100%)",

    border: "1px solid rgba(255,255,255,0.08)",

    boxShadow:
      "0 0 30px rgba(0,0,0,0.45)",
  },

  resultCase: {
    color: "#8aa0b2",

    fontSize: "13px",

    letterSpacing: "2px",

    marginBottom: "14px",
  },

  resultInfoBox: {
    marginTop: "26px",

    borderRadius: "16px",

    background: "rgba(255,255,255,0.04)",

    padding: "14px",
  },

  resultInfoRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",

    padding: "10px 0",

    borderBottom:
      "1px solid rgba(255,255,255,0.08)",

    color: "#d7e2ea",

    fontSize: "15px",
  },

  resultTitle: {
    fontSize: "30px",
    lineHeight: "1.15",
    wordBreak: "keep-all",
    color: "#f6c343",
    fontWeight: "bold",
  },

  resultScore: {
    fontSize: "72px",
    fontWeight: "bold",
    color: "#fff",
    marginTop: "20px",
  },

  resultSub: {
    color: "#aaa",
    fontSize: "16px",
    marginTop: "8px",
  },

  resultActionBox: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginTop: "30px",
  },

  nextBtn: {
    width: "100%",
    height: "52px",

    display: "flex",
    alignItems: "center",
    justifyContent: "center",

    marginTop: "18px",

    border: "none",
    borderRadius: "14px",

    background:
      "linear-gradient(180deg, #c93b3b 0%, #8e1f1f 100%)",
    boxShadow: "0 0 18px rgba(255,60,60,0.28)",

    color: "#ffffff",
    opacity: 1,

    fontSize: "16px",
    fontWeight: "bold",

    cursor: "pointer",
  },

  shareBtn: {
    width: "100%",
    height: "52px",

    display: "flex",
    alignItems: "center",
    justifyContent: "center",

    marginTop: "12px",

    borderRadius: "14px",

    border: "1px solid rgba(255,196,0,0.7)",

    background: "rgba(255,196,0,0.06)",

    color: "#ffcf3f",

    fontSize: "16px",
    fontWeight: "bold",

    cursor: "pointer",
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

  onBtn: {
    background: "#28a745",
    color: "#fff",
    border: "none",
    padding: "6px 12px",
    borderRadius: "6px",
    fontWeight: "bold",
  },

  offBtn: {
    background: "#222",
    color: "#fff",
    border: "none",
    padding: "6px 12px",
    borderRadius: "6px",
    fontWeight: "bold",
  },

  langBtn: {
    background: "#222",
    color: "#f6c343",
    border: "1px solid #444",
    padding: "6px 12px",
    borderRadius: "6px",
    fontWeight: "bold",
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
  playScreen: {
    position: "relative",
    width: "100%",
    minHeight: "824px",
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.04)",
    background: "#020304",
  },

  mapArea: {
    position: "absolute",
    left: "10px",
    top: "10px",
    right: "10px",
    height: `${GAME_CONFIG.map.viewHeight}px`,
    borderRadius: "3px",
    background:
      "radial-gradient(circle at 50% 62%, rgba(120,120,110,0.22), transparent 30%), linear-gradient(180deg, #101318 0%, #030405 100%)",
    border: "1px solid rgba(156, 34, 34, 0.08)",
    overflow: "hidden",
  },
  mapAreaDanger: {
    animation: "mapDangerShake 0.22s infinite",
  },
  signalText: {
    position: "absolute",
    top: "28px",
    left: 0,
    right: 0,
    textAlign: "center",
    color: "rgba(255,80,80,0.9)",
    fontSize: "13px",
    letterSpacing: "2px",
    fontWeight: "bold",
    zIndex: 6,
  },
  erosionHud: {
    position: "absolute",

    left: "14px",
    top: "1px",

    width: "150px",

    padding: 0,

    background: "transparent",

    border: "none",

    backdropFilter: "none",

    zIndex: 30,
  },
  erosionTopRow: {
    display: "flex",
    alignItems: "center",

    flexWrap: "nowrap",

    whiteSpace: "nowrap",

    gap: "6px",
  },

  erosionLabel: {
    fontSize: "14px",
    fontWeight: "bold",
    letterSpacing: "1px",
    color: "rgba(255,120,120,0.72)",
  },

  erosionBar: {
    width: "72px",
    height: "10px",

    borderRadius: "999px",

    overflow: "hidden",

    background: "rgba(255,255,255,0.14)",

    border: "1px solid rgba(255,255,255,0.08)",
  },

  erosionFill: {
    height: "100%",

    borderRadius: "999px",

    background:
      "linear-gradient(90deg, #ffcc66 0%, #ff8844 50%, #ff4444 100%)",

    boxShadow: "0 0 12px rgba(255,80,80,0.5)",
  },

  erosionBarWrap: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },

  erosionGaugeText: {
    fontSize: "12px",
    color: "#ff9b9b",
    fontWeight: "bold",
  },

  objectWrap: {
    position: "absolute",
    width: "100%",
    height: "100%",
    zIndex: 2,
  },

  objectRange: {
    position: "absolute",
    left: "50%",
    top: "50%",
    transform: "translate(-50%, -50%)",
    borderRadius: "50%",
    border: "none",
    pointerEvents: "none",
  },

  objectImg: {
    zIndex: 2,
    position: "absolute",
    left: 0,
    top: 0,
    width: "100%",
    height: "100%",
    objectFit: "contain",
    opacity: 0.92,
    filter: "none",
  },

  sightPoint: {
    position: "absolute",
    left: `${GAME_CONFIG.map.viewWidth * GAME_CONFIG.map.sightXRate}px`,
    top: `${GAME_CONFIG.map.viewHeight * GAME_CONFIG.map.sightYRate}px`,
    width: "42px",
    height: "42px",
    transform: "translate(-50%, -50%)",
    boxSizing: "border-box",
    borderRadius: "50%",
    border: "1px solid rgba(255,255,255,0.24)",
    background: "rgba(255,255,255,0.04)",
    boxShadow: "0 0 18px rgba(255,255,220,0.08)",
    zIndex: 5,
  },
  sightProgressRing: {
    position: "absolute",

    left: "50%",
    top: "50%",

    transform: "translate(-50%, -50%)",

    pointerEvents: "none",
  },
  sightProgressText: {
    position: "absolute",

    left: "50%",
    top: "50%",

    transform: "translate(-50%, -50%)",

    color: "#ffffff",

    fontSize: "13px",
    fontWeight: "bold",

    textShadow: "0 0 10px rgba(255,255,255,0.8)",

    pointerEvents: "none",
  },
  sightAnalyzeMessage: {
    position: "absolute",

    left: `${GAME_CONFIG.map.viewWidth * GAME_CONFIG.map.sightXRate}px`,
    top: `${GAME_CONFIG.map.viewHeight * GAME_CONFIG.map.sightYRate - 60}px`,

    transform: "translateX(-50%)",

    color: "#ff6b6b",

    fontSize: "15px",
    fontWeight: "bold",

    textShadow: "0 0 10px rgba(255,0,0,0.8)",

    whiteSpace: "nowrap",

    pointerEvents: "none",

    zIndex: 20,

    animation: "fadeUpPhone 1.5s ease-out forwards",
  },
  flashlight: {
    position: "absolute",
    left: `${GAME_CONFIG.map.viewWidth * GAME_CONFIG.map.sightXRate}px`,
    top: `${GAME_CONFIG.map.viewHeight * GAME_CONFIG.map.sightYRate}px`,
    width: "150px",
    height: "150px",
    transform: "translate(-50%, -50%)",
    borderRadius: "50%",

    background:
      "radial-gradient(circle, rgba(255,255,220,0.18) 0%, rgba(255,255,220,0.11) 20%, rgba(255,255,220,0.06) 38%, rgba(255,255,220,0.025) 56%, rgba(255,255,220,0.01) 70%, transparent 100%)",

    zIndex: 4,
    pointerEvents: "none",
  },
  flashlightOn: {
    opacity: 1,
  },

  flashlightOff: {
    opacity: 0,
  },
  flashlightShake: {
    animation: "flashlightShake 0.12s infinite",
  },

  darkOverlay: {
    position: "absolute",
    inset: 0,
    background: `radial-gradient(circle at ${GAME_CONFIG.map.viewWidth * GAME_CONFIG.map.sightXRate}px ${GAME_CONFIG.map.viewHeight * GAME_CONFIG.map.sightYRate}px, transparent 0%, rgba(0,0,0,0.18) 18%, rgba(0,0,0,0.72) 42%, rgba(0,0,0,0.94) 100%)`,
    pointerEvents: "none",
    zIndex: 3,
  },
  darkOverlayLanternOff: {
    background: "rgba(0,0,0,1)",
  },
  erosionNoise: {
    position: "absolute",
    inset: 0,

    background: `
      repeating-linear-gradient(
        0deg,
        rgba(255,255,255,0.025) 0px,
        rgba(255,255,255,0.025) 1px,
        transparent 1px,
        transparent 4px
      )
    `,

    backgroundSize: "100% 6px",

    pointerEvents: "none",

    zIndex: 80,

    mixBlendMode: "screen",

    animation: "erosionNoiseFlicker 0.16s infinite",
  },
  failedText: {
    position: "absolute",

    left: "50%",
    top: "50%",

    transform: "translate(-50%, -50%)",

    color: "#ff4444",

    fontSize: "42px",
    fontWeight: "bold",

    letterSpacing: "6px",

    textShadow: "0 0 18px rgba(255,0,0,0.8)",

    zIndex: 2000,

    animation: "failedFlicker 0.12s infinite",
  },
  endingNoise: {
    position: "absolute",
    inset: 0,

    background: `
      repeating-linear-gradient(
        0deg,
        rgba(255,255,255,0.035) 0px,
        rgba(255,255,255,0.035) 2px,
        transparent 2px,
        transparent 4px
      )
    `,

    backgroundSize: "100% 6px",

    pointerEvents: "none",

    zIndex: 999,

    mixBlendMode: "screen",

    animation: "endingCorruption 0.12s infinite",
  },
  leftHandWrap: {
    position: "absolute",
    left: "-120px",
    bottom: "30px",
    width: "430px",
    height: "420px",
    zIndex: 40,
    animation: "handWalk 1.8s ease-in-out infinite",
  },

  leftPhone: {
    width: "430px",
    pointerEvents: "none",
    filter: "brightness(0.72)",
  },

  rightLanternWrap: {
    position: "absolute",

    right: "-18px",
    bottom: "100px",

    width: "290px",

    zIndex: 40,

    animation: "handWalk 1.7s ease-in-out infinite reverse",
  },

  rightLantern: {
    width: "310px",

    pointerEvents: "none",
    filter: "brightness(0.68)",
  },
  caseHud: {
    position: "absolute",

    right: "16px",
    top: "12px",

    display: "flex",
    alignItems: "center",
    justifyContent: "center",

    color: "rgba(255,255,255,0.78)",

    fontSize: "13px",
    fontWeight: "bold",

    letterSpacing: "0.5px",

    zIndex: 30,

    pointerEvents: "none",
  },
  phoneScreen: {
    position: "absolute",
    left: "135px",
    bottom: "170px",

    width: "165px",
    height: "250px",
    zIndex: 60,

    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",

    color: "#e8fff4",
    fontFamily: "monospace",
    paddingTop: "12px",
    boxSizing: "border-box",
  },

  phoneTime: {
    marginTop: "1px",

    color: "#d7ffe0",

    fontSize: "18px",

    fontWeight: "bold",

    letterSpacing: "2px",

    fontFamily: "monospace",

    textShadow: "0 0 10px rgba(120,255,160,0.45)",
  },
  phoneTimeDanger: {
    color: "#ff7a7a",
  },

  phoneTimeCritical: {
    animation: "criticalBlink 0.7s infinite",
  },

  phonePercent: {
    marginTop: "18px",
    marginBottom: "10px",
    fontSize: "34px",
    fontWeight: "bold",
    color: "#ffffff",
    textShadow: "0 0 10px rgba(120,255,190,0.7)",
  },

  phoneLabel: {
    fontSize: "10px",
    letterSpacing: "1.5px",
    color: "#79d6a0",
    marginTop: "2px",
    marginBottom: "10px",
  },

  analyzeBtn: {
    marginTop: "26px",

    width: "68px",
    height: "68px",

    padding: "0",

    borderRadius: "50%",

    lineHeight: "1.1",

    border: "1px solid rgba(180,180,180,0.55)",

    background: "rgba(0,0,0,0.18)",

    color: "#b9ffe0",

    fontSize: "14px",
    fontWeight: "bold",

    letterSpacing: "0.5px",

    backdropFilter: "blur(2px)",
  },

  movePad: {
    position: "absolute",
    left: "50%",
    bottom: "58px",

    transform: "translateX(-50%)",

    width: "180px",
    height: "180px",

    zIndex: 90,

    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    touchAction: "none",
WebkitUserSelect: "none",
userSelect: "none",
  },


  moveBtn: {
    position: "absolute",

    width: "42px",
    height: "42px",

    borderRadius: "12px",

    border: "1px solid rgba(255,255,255,0.18)",

    background: "rgba(255,255,255,0.08)",

    color: "#ddd",

    fontSize: "20px",
    fontWeight: "bold",

    backdropFilter: "blur(4px)",
    WebkitTouchCallout: "none",
WebkitUserSelect: "none",
userSelect: "none",
touchAction: "none",
  },

  moveCenter: {
    position: "absolute",

    left: "50%",
    top: "50%",

    width: "58px",
    height: "58px",

    transform: "translate(-50%, -50%)",

    borderRadius: "50%",

    border: "2px solid rgba(255,255,255,0.2)",

    background: "rgba(255,255,255,0.05)",

    backdropFilter: "blur(4px)",
  },
  moveRing: {
    position: "relative",

    width: "180px",
    height: "180px",

    borderRadius: "50%",

    border: "2px solid rgba(255,255,255,0.18)",

    background: "rgba(255,255,255,0.03)",

    backdropFilter: "blur(4px)",
  },
  mapLayer: {
    position: "absolute",
    left: 0,
    top: 0,
    background:
      "linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)",
    backgroundSize: "90px 90px",
    outline: "4px solid rgba(0, 0, 0, 0.66)",
    outlineOffset: "-4px",
    transition: "transform 0.12s linear",
  },
  analyzeBtnActive: {
    opacity: 1,
    boxShadow: "0 0 14px rgba(120,255,190,0.55)",
  },


  analyzeBtnDisabled: {
    opacity: 0.35,
    color: "#777",
    border: "1px solid rgba(255,255,255,0.15)",
  },
  ghostRange: {
    position: "absolute",
    transform: "translate(-50%, -50%)",
    borderRadius: "50%",
    border: "1px solid rgba(255,60,60,0.28)",
    background: "rgba(255,0,0,0.04)",
    pointerEvents: "none",
    zIndex: 4,
  },

  ghostCore: {
    position: "absolute",
    transform: "translate(-50%, -50%)",
    borderRadius: "50%",
    border: "1px solid rgba(255,80,80,0.9)",
    background: "rgba(255,0,0,0.2)",
    boxShadow: "0 0 12px rgba(255,0,0,0.55)",
    pointerEvents: "none",
    zIndex: 8,
  },
  objectCollisionRange: {
    position: "absolute",
    left: "50%",
    top: "50%",
    transform: "translate(-50%, -50%)",
    borderRadius: "50%",
    border: "none",
    background: "transparent",
    pointerEvents: "none",
  },
  lanternToggleBtn: {
    position: "absolute",

    right: "80px",
    bottom: "210px",

    width: "68px",
    height: "68px",

    borderRadius: "50%",

    border: "1px solid rgba(180,180,180,0.55)",

    background: "rgba(0,0,0,0.12)",

    color: "#fff",

    fontSize: "15px",
    letterSpacing: "1px",
    fontWeight: "bold",

    zIndex: 120,

    backdropFilter: "blur(2px)",
  },

  lanternToggleOn: {
    boxShadow: "0 0 16px rgba(255,255,180,0.55)",
  },

  lanternToggleOff: {
    opacity: 0.55,
    boxShadow: "0 0 10px rgba(80,80,80,0.35)",
  },
  ghostHitText: {
    marginTop: "4px",
    fontSize: "9px",
    color: "#ff7777",
    fontWeight: "bold",
  },
  flashlightGhostHit: {
    background:
      "radial-gradient(circle, rgba(255,80,80,0.38) 0%, rgba(255,0,0,0.18) 22%, rgba(0,0,0,0.96) 72%)",

    animation: "criticalBlink 0.35s infinite",
  },
  mainVisual: {
    position: "relative",
    width: "100%",
    minHeight: "620px",
    padding: "12px",
    boxSizing: "border-box",
    borderRadius: "22px",
    backgroundSize: "cover",
    backgroundPosition: "center top",
    backgroundRepeat: "no-repeat",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 0 32px rgba(0,0,0,0.55)",
  },

  mainTopBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 8px",
    borderRadius: "16px",
    background: "rgba(0,0,0,0.35)",
    border: "1px solid rgba(255,255,255,0.08)",
    backdropFilter: "blur(6px)",
  },

  brandRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },

  brandText: {
    fontSize: "15px",
    fontWeight: "bold",
    color: "#f2f2f2",
    letterSpacing: "-0.2px",
  },

  mainTitleArea: {
    marginTop: "28px",
    textAlign: "center",
  },

  mainBottomArea: {
    marginTop: "150px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },

  mainScoreBox: {
    width: "52%",
    alignSelf: "center",

    marginTop: "40px",

    padding: "14px",

    borderRadius: "16px",
    background: "rgba(0,0,0,0.58)",
    border: "1px solid rgba(255,255,255,0.12)",
    backdropFilter: "blur(6px)",
  },

  mainScoreRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 2px",
    color: "#d8d8d8",
    fontSize: "15px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },
  eventObjectImg: {
    filter:
      "drop-shadow(0 0 5px rgba(120,255,170,0.45)) brightness(1.05)",
  },
  phoneTimeBonus: {
    color: "#8fffe0",
    textShadow: "0 0 10px rgba(120,255,220,0.75)",
  },
  pageNav: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "6px",
    marginBottom: "14px",
  },
  
  pageNavBtn: {
    height: "34px",
    borderRadius: "9px",
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.05)",
    color: "#f6c343",
    fontSize: "12px",
    fontWeight: "bold",
  },
  sightPointActive: {
    boxShadow:
      "0 0 12px rgba(80,255,140,0.45)",
    border:
      "1px solid rgba(80,255,140,0.6)",
  },
}