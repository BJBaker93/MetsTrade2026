(() => {
  'use strict';
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  // Leave the native cursor visible and let the dot follow its tip.
  const cursor = document.querySelector('.cursor-dot');
  if (!cursor) return;
  const mouse = matchMedia('(hover: hover) and (pointer: fine)');
  let cursorFrame = 0;
  let cursorTime = 0;
  let cursorX = 0;
  let cursorY = 0;
  let pointerX = 0;
  let pointerY = 0;
  let cursorVisible = false;

  function hideCursor() {
    document.documentElement.classList.remove('has-cursor-dot');
    cursorVisible = false;
    if (cursorFrame) cancelAnimationFrame(cursorFrame);
    cursorFrame = cursorTime = 0;
  }

  function drawCursor(time) {
    cursorFrame = 0;
    if (!cursorVisible) return;
    const elapsed = cursorTime ? Math.min(time - cursorTime, 48) : 16;
    cursorTime = time;
    const follow = reduceMotion.matches ? 1 : 1 - Math.exp(-elapsed / 45);
    cursorX += (pointerX - cursorX) * follow;
    cursorY += (pointerY - cursorY) * follow;
    const moving = Math.abs(pointerX - cursorX) + Math.abs(pointerY - cursorY) > 0.1;
    if (!moving) { cursorX = pointerX; cursorY = pointerY; cursorTime = 0; }
    cursor.style.transform = `translate3d(${cursorX}px,${cursorY}px,0) translate(-50%,-50%)`;
    if (moving) cursorFrame = requestAnimationFrame(drawCursor);
  }

  document.addEventListener('pointermove', event => {
    if (!mouse.matches || event.pointerType !== 'mouse') { hideCursor(); return; }
    pointerX = event.clientX;
    pointerY = event.clientY;
    if (!cursorVisible) {
      cursorX = pointerX;
      cursorY = pointerY;
      cursorVisible = true;
      document.documentElement.classList.add('has-cursor-dot');
    }
    if (!cursorFrame) cursorFrame = requestAnimationFrame(drawCursor);
  }, { passive: true });
  document.addEventListener('pointerleave', hideCursor);
  window.addEventListener('blur', hideCursor);
  document.addEventListener('visibilitychange', () => { if (document.hidden) hideCursor(); });
  mouse.addEventListener('change', hideCursor);
})();
