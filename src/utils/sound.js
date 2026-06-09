export function playSound(src, volume = 1) {
    const audio = new Audio(src)
  
    audio.volume = volume
  
    audio.play().catch(() => {})
  
    return audio
  }
  
  export function playRandomSound(list, volume = 1) {
    const src =
      list[Math.floor(Math.random() * list.length)]
  
    return playSound(src, volume)
  }