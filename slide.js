/**
 * 快速滑动卡片
 * @param {*} options 
 */
const rem2px = window.kadaRemLayout && window.kadaRemLayout.rem2px ? window.kadaRemLayout.rem2px : (rem) => rem * 50
export function slideCard(options) {
  const { containerEle, listEle, space } = options
  if (!containerEle || !listEle) {
    return
  }

  // 滑动标志
  let isMoving = false

  // 滑动开始位置
  let startX = 0
  let startY = 0
  let posX = 0

  // 快速滑屏
  let lastTime = 0
  let lastX = 0
  let nowTime = 0
  let nowX = 0
  let disTime = 0
  let disX = 0

  // 滑动范围
  let min = 0
  let max = 0

  const touchmoveFn = e => {
    if (!isMoving) {
      return
    }

    const x = e.changedTouches[0].clientX
    const y = e.changedTouches[0].clientY
    const contrainerRect = containerEle.getBoundingClientRect()
    const { left, top, bottom, right } = contrainerRect
    // 移出滑动区域
    if (y < top || y > bottom || x < left || x > right) {
      console.log('移出滑动区域')
      isMoving = false
      return
    }

    let disX = x - startX
    let disY = y - startY

    if (Math.abs(disX) < Math.abs(disY)) {
      e.preventDefault()
      return
    }

    let dis = posX + disX
    if (dis >= max) {
      dis = max
    }
    if (dis <= min) {
      dis = min
    }

    nowTime = Date.now()
    nowX = x

    disTime = nowTime - lastTime
    disX = nowX - lastX
    lastTime = nowTime
    lastX = nowX

    requestAnimationFrame(() => {
      listEle.style.left = `${dis}px`
    })
  }
  const touchendFn = (e) => {
    // e.preventDefault()
    // 快速滑屏
    if (disX !== 0 && disTime !== 0) {
      requestAnimationFrame(() => {
        let speed = disX / disTime
        if (Math.abs(speed) < 1) {
          return
        }
        const rect = listEle.getBoundingClientRect()
        let dis = rect.left + speed * 200
        if (dis >= max) {
          dis = max
        }
        if (dis <= min) {
          dis = min
        }
        listEle.style.left = `${dis}px`
        listEle.style.transition = `left 0.5s`
      })
    }

    isMoving = false

    document.removeEventListener('touchmove', touchmoveFn)
    document.removeEventListener('touchend', touchendFn)
  }
  const touchstartFn = e => {
    isMoving = true
    // e.preventDefault()
    const listRect = listEle.getBoundingClientRect()
    const padding = rem2px(space)

    // 滑动范围
    const contrainerRect = containerEle.getBoundingClientRect()
    min = contrainerRect.width - listRect.width - padding
    max = padding

    posX = listRect.left
    startX = e.changedTouches[0].clientX
    startY = e.changedTouches[0].clientY

    lastTime = Date.now()
    lastX = startX

    listEle.style.transition = 'left 0s'

    document.addEventListener('touchmove', touchmoveFn)
    document.addEventListener('touchend', touchendFn)
  }

  listEle.addEventListener('touchstart', touchstartFn)

  return () => {
    listEle.removeEventListener('touchstart', touchstartFn)
  }
}