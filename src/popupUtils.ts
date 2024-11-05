import type { TPopupPosition } from './types'

export function calculatePopupPosition(popupWidth = 600, popupHeight = 600): TPopupPosition {
  // Calculate the screen dimensions and position the popup at the center
  const screenLeft = window.screenLeft
  const screenTop = window.screenTop
  const screenWidth = window.innerWidth
  const screenHeight = window.innerHeight

  // Calculate the position to center the popup
  const defaultLeft = screenLeft + (screenWidth - popupWidth) / 2
  const defaultTop = screenTop + (screenHeight - popupHeight) / 2

  // Ensure the bottom-right corner does not go off the screen
  // Adjust the left and top positions if necessary
  const maxLeft = screenLeft + (screenWidth - popupWidth)
  const maxTop = screenTop + (screenHeight - popupHeight)

  return {
    width: Math.min(popupWidth, screenWidth),
    height: Math.min(popupHeight, screenHeight),
    left: Math.max(0, Math.min(defaultLeft, maxLeft)),
    top: Math.max(0, Math.min(defaultTop, maxTop)),
  }
}
