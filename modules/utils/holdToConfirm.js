const DEFAULT_HOLD_DURATION_MS = 3000;
const HOLD_KEYS = new Set([" ", "Enter"]);

export function attachHoldToConfirm(button, onConfirm, options = {}) {
  if (!button || typeof onConfirm !== "function") return null;

  const duration = options.durationMs || DEFAULT_HOLD_DURATION_MS;
  let holdStart = 0;
  let animationFrame = 0;
  let isHolding = false;
  let confirmed = false;

  const resetProgress = () => {
    button.classList.remove("is-holding");
    button.style.setProperty("--hold-progress", "0");
  };

  const stop = () => {
    isHolding = false;
    confirmed = false;
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
      animationFrame = 0;
    }
    resetProgress();
  };

  const tick = (timestamp) => {
    if (!isHolding) return;

    const progress = Math.min((timestamp - holdStart) / duration, 1);
    button.style.setProperty("--hold-progress", String(progress));
    if (progress >= 1 && !confirmed) {
      confirmed = true;
      onConfirm();
      stop();
      return;
    }

    animationFrame = requestAnimationFrame(tick);
  };

  const start = (event) => {
    if (button.disabled || isHolding) return;

    event.preventDefault();
    isHolding = true;
    confirmed = false;
    holdStart = performance.now();
    button.classList.add("is-holding");
    button.style.setProperty("--hold-progress", "0");
    animationFrame = requestAnimationFrame(tick);
  };

  const handleKeyDown = (event) => {
    if (!HOLD_KEYS.has(event.key) || event.repeat) return;
    start(event);
  };

  const handleKeyUp = (event) => {
    if (!HOLD_KEYS.has(event.key)) return;
    stop();
  };

  button.addEventListener("pointerdown", start);
  button.addEventListener("pointerup", stop);
  button.addEventListener("pointerleave", stop);
  button.addEventListener("pointercancel", stop);
  button.addEventListener("keydown", handleKeyDown);
  button.addEventListener("keyup", handleKeyUp);
  button.addEventListener("blur", stop);

  resetProgress();
  return stop;
}
