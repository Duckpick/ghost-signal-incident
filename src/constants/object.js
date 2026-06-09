import { IMG } from "./img"

export const OBJECT_CONFIG = {
  count: 36,

  size: 72,
  collisionRadius: 32,
  analyzeRadius: 55,

  spawnMargin: 120,
  minSpawnDistance: 120,

  totalSignalPercent: 150,
  minSignalPercent: 5,
  maxSignalPercent: 25,

  baseTotalSignalPercent: 150,
  minTotalSignalPercent: 100,

  baseMinSignalPercent: 5,
  baseMaxSignalPercent: 25,
}

const NORMAL_OBJECTS = Array.from(
  { length: OBJECT_CONFIG.count },
  (_, index) => {
    const number = String(index + 1).padStart(2, "0")
    const id = `object${number}`

    return {
      id,
      type: "normal",
      img: IMG.object[id],
    }
  }
)

const EVENT_OBJECTS = [
  {
    id: "duckpick_doll",
    type: "event",
    img: IMG.event.duckpickDoll,
  },
]

export const OBJECTS = [
  ...NORMAL_OBJECTS,
  ...EVENT_OBJECTS,
]