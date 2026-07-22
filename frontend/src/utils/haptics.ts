// Utility for providing Haptic Feedback on supported devices (Android primarily)

export function vibrate(pattern: number | number[] = 50) {
  try {
    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(pattern);
    }
  } catch (e) {
    // Ignore errors on unsupported platforms
  }
}

export const hapticTap = () => vibrate(40); // Short tap
export const hapticSuccess = () => vibrate([50, 50, 50]); // Triple tap
export const hapticError = () => vibrate([100, 50, 100, 50, 100]); // Long vibrations
export const hapticPop = () => vibrate(15); // Tiny tick
