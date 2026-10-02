(() => {
  'use strict';

  const deck = document.querySelector('.deck');
  const hero = document.querySelector('.hero');
  const cue = document.querySelector('.scroll-cue');
  const stack = document.querySelector('.card-stack');
  const cards = [...document.querySelectorAll('.business-card')];
  // Shuffle once per page load, then use the same order for DOM, scrolling and navigation.
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  cards.forEach((card, index) => {
    card.dataset.index = String(index);
    const image = card.querySelector('img');
    if (image) image.fetchPriority = index === 0 ? 'high' : 'auto';
    stack.append(card);
  });
  const resources = document.querySelector('.resources-panel');
  const carouselCards = [hero, ...cards, resources];
  const navigation = document.querySelector('.deck-nav');
  const name = document.querySelector('#active-business');
  const previous = document.querySelector('#previous-card');
  const next = document.querySelector('#next-card');
  const announcement = document.querySelector('#deck-announcement');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const phone = matchMedia('(max-width: 700px)');
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const smoothstep = value => value * value * (3 - 2 * value);

  let enabled = false;
  let step = 0;
  let start = 0;
  let viewport = 0;
  let cardWidth = 0;
  let target = 0;
  let current = 0;
  let active = -1;
  let raf = 0;
  let lastTime = 0;
  let releaseTimer = 0;
  let mobile = false;
  let mobileIndex = 0;
  let mobileAnimating = false;
  let mobileTimer = 0;
  let swipe = null;
  let suppressClick = false;
  const wrap = index => (index + carouselCards.length) % carouselCards.length;

  function mobileName(index) {
    if (index === 0) return 'Gold Coast, Australia';
    if (index === carouselCards.length - 1) return 'Resources';
    return carouselCards[index].dataset.name;
  }

  function setMobileAccess() {
    carouselCards.forEach((card, index) => {
      card.inert = index !== mobileIndex;
      card.setAttribute('aria-hidden', String(index !== mobileIndex));
    });
    previous.disabled = next.disabled = false;
    navigation.inert = false;
    navigation.style.opacity = '1';
    navigation.style.pointerEvents = '';
    name.textContent = mobileName(mobileIndex);
    announcement.textContent = mobileName(mobileIndex);
  }

  function paintMobile(offset = 0, direction = 1) {
    const neighbor = wrap(mobileIndex + direction);
    const progress = clamp(Math.abs(offset) / cardWidth);
    carouselCards.forEach((card, index) => {
      card.style.transition = 'none';
      card.style.visibility = index === mobileIndex || index === neighbor ? 'visible' : 'hidden';
      card.style.pointerEvents = index === mobileIndex ? 'auto' : 'none';
      card.style.zIndex = index === mobileIndex ? '2' : '1';
      const pill = card.querySelector('.website-pill');
      if (pill) pill.style.opacity = index === mobileIndex ? '1' : '0';
      if (index === mobileIndex) card.style.transform = `translate3d(${offset}px,0,0) rotate(${offset / cardWidth * 7}deg)`;
      else card.style.transform = `translate3d(0,${8 * (1 - progress)}px,0) scale(${0.978 + 0.022 * progress})`;
    });
  }

  function settleMobile(index) {
    clearTimeout(mobileTimer);
    mobileIndex = wrap(index);
    mobileAnimating = false;
    paintMobile();
    setMobileAccess();
  }

  function moveMobile(index, animate = true, direction = 1, offset = 0) {
    if (!mobile || mobileAnimating) return;
    const destination = wrap(index);
    if (!animate || reduceMotion.matches) {
      settleMobile(destination);
      return;
    }
    paintMobile(offset, direction);
    mobileAnimating = true;
    const leaving = carouselCards[mobileIndex];
    const arriving = carouselCards[destination];
    // Commit the dragged position before continuing its departure.
    void leaving.offsetWidth;
    leaving.style.transition = arriving.style.transition = 'transform 360ms cubic-bezier(.22,.8,.2,1)';
    leaving.style.transform = `translate3d(${-direction * (viewport + cardWidth + 100)}px,0,0) rotate(${-direction * 9}deg)`;
    arriving.style.visibility = 'visible';
    arriving.style.transform = 'translate3d(0,0,0) scale(1)';
    mobileTimer = setTimeout(() => settleMobile(destination), 370);
  }

  function cancelSwipe(offset, direction) {
    if (reduceMotion.matches) { settleMobile(mobileIndex); return; }
    paintMobile(offset, direction);
    mobileAnimating = true;
    const card = carouselCards[mobileIndex];
    void card.offsetWidth;
    card.style.transition = 'transform 220ms cubic-bezier(.22,.8,.2,1)';
    card.style.transform = 'translate3d(0,0,0)';
    mobileTimer = setTimeout(() => settleMobile(mobileIndex), 230);
  }

  function measureMobile() {
    viewport = window.innerWidth;
    deck.style.setProperty('--stage-height', `${window.innerHeight}px`);
    cardWidth = stack.getBoundingClientRect().width;
    // Fit the copy to each phone's available card height without vertical scrolling.
    cards.forEach(card => {
      const copy = card.querySelector('.card-copy');
      let scale = 1;
      card.style.setProperty('--copy-fit', '1');
      for (let attempt = 0; attempt < 5 && copy.scrollHeight > copy.clientHeight + 1; attempt++) {
        scale *= (copy.clientHeight - 2) / copy.scrollHeight;
        card.style.setProperty('--copy-fit', Math.max(.5, scale).toFixed(3));
      }
    });
    settleMobile(mobileIndex);
  }

  function desiredProgress() {
    return clamp((window.scrollY - start) / step, 0, cards.length + 0.75);
  }

  function setActive(index) {
    if (index === active) return;
    const focused = document.activeElement;
    // Keep keyboard focus on a visible control if its card has peeled away.
    if (cards.some(card => card !== cards[index] && card.contains(focused))) next.focus({ preventScroll: true });
    active = index;
    cards.forEach((card, i) => {
      card.inert = i !== index;
      card.setAttribute('aria-hidden', String(i !== index));
    });
    const finished = index === cards.length;
    resources.inert = !finished;
    resources.setAttribute('aria-hidden', String(!finished));
    name.textContent = finished ? 'Resources' : cards[index].dataset.name;
    previous.disabled = index <= 0;
    next.disabled = finished;
    announcement.textContent = finished ? 'Resources' : `${index + 1} of ${cards.length}: ${name.textContent}`;
    navigation.style.opacity = finished ? '0' : '1';
    navigation.style.pointerEvents = finished ? 'none' : '';
    navigation.inert = finished;
  }

  function render() {
    // Each card rests for the first 30% of its scroll interval, then leaves.
    const index = Math.min(cards.length, Math.floor(current + 0.001));
    const leaveDistance = (viewport + cardWidth) / 2 + 110;
    resources.style.opacity = String(smoothstep(clamp((current - cards.length + 0.8) / 0.6)));
    cards.forEach((card, i) => {
      const local = current - i;
      if (local >= 1 || i > index + 3) {
        card.style.visibility = 'hidden';
        card.style.pointerEvents = 'none';
        return;
      }
      card.style.visibility = 'visible';
      card.style.zIndex = String(cards.length - i);
      card.style.pointerEvents = i === index ? 'auto' : 'none';
      const peel = smoothstep(clamp((local - 0.30) / 0.70));
      const depth = clamp(i - current, 0, 3);
      card.querySelector('.website-pill').style.opacity = depth < 0.1 ? '1' : '0';
      const x = -leaveDistance * peel;
      const y = depth * 10 - 24 * Math.sin(peel * Math.PI);
      const rotation = -9 * peel;
      const scale = 1 - depth * 0.014;
      card.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) rotate(${rotation.toFixed(3)}deg) scale(${scale.toFixed(4)})`;
    });
    setActive(index);
    const navigationOpacity = String(1 - smoothstep(clamp((current - cards.length + 0.3) / 0.3)));
    navigation.style.opacity = navigationOpacity;
  }

  function tick(time) {
    raf = 0;
    if (!enabled) return;
    const elapsed = lastTime ? Math.min(time - lastTime, 48) : 16;
    lastTime = time;
    // A small time-based follow-through smooths trackpad and mouse wheel steps.
    current += (target - current) * (1 - Math.exp(-elapsed / 62));
    if (Math.abs(target - current) < 0.0005) current = target;
    render();
    if (current !== target) raf = requestAnimationFrame(tick);
    else lastTime = 0;
  }

  function requestRender() {
    if (!enabled) return;
    target = desiredProgress();
    if (!raf) raf = requestAnimationFrame(tick);
  }

  function measure() {
    if (!enabled) return;
    const oldStep = step;
    const oldStart = start;
    const oldProgress = oldStep ? (window.scrollY - oldStart) / oldStep : -1;
    const stageHeight = window.innerHeight;
    viewport = window.innerWidth;
    step = Math.max(480, stageHeight * 0.95);
    deck.style.setProperty('--stage-height', `${stageHeight}px`);
    // The last interval lets the final card leave; the extra hold keeps resources in view.
    deck.style.setProperty('--deck-height', `${stageHeight + step * (cards.length + 0.6)}px`);
    start = deck.getBoundingClientRect().top + window.scrollY;
    cardWidth = stack.getBoundingClientRect().width;
    if (oldProgress >= 0 && oldProgress <= cards.length + 0.6 && oldStep !== step) {
      window.scrollTo({ top: start + clamp(oldProgress, 0, cards.length + 0.6) * step, behavior: 'instant' });
    }
    target = desiredProgress();
    current = target;
    active = -1;
    render();
  }

  function configure() {
    if (phone.matches) {
      enabled = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      document.documentElement.classList.remove('has-deck-motion');
      document.documentElement.classList.add('mobile-carousel');
      if (!mobile) {
        mobile = true;
        mobileIndex = 0;
        stack.prepend(hero);
        stack.append(resources);
        carouselCards.forEach(card => {
          card.removeAttribute('style');
          card.classList.add('carousel-card');
        });
        cue.firstChild.nodeValue = 'Swipe to meet the businesses ';
        cue.querySelector('span').textContent = '→';
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
      measureMobile();
      return;
    }
    if (mobile) {
      mobile = false;
      clearTimeout(mobileTimer);
      swipe = null;
      document.documentElement.classList.remove('mobile-carousel');
      deck.before(hero);
      announcement.before(resources);
      carouselCards.forEach(card => {
        card.classList.remove('carousel-card');
        card.removeAttribute('style');
        card.inert = false;
        card.removeAttribute('aria-hidden');
      });
      cue.firstChild.nodeValue = 'Scroll to meet the businesses ';
      cue.querySelector('span').textContent = '↓';
      active = -1;
      step = 0;
    }
    const shouldEnable = !reduceMotion.matches;
    if (shouldEnable === enabled) {
      if (enabled) measure();
      return;
    }
    enabled = shouldEnable;
    document.documentElement.classList.toggle('has-deck-motion', enabled);
    if (enabled) measure();
    else {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      cards.forEach(card => {
        card.removeAttribute('style');
        card.querySelector('.website-pill').style.removeProperty('opacity');
        card.inert = false;
        card.removeAttribute('aria-hidden');
      });
      resources.inert = false;
      resources.removeAttribute('aria-hidden');
      resources.style.removeProperty('opacity');
      navigation.inert = false;
      active = -1;
    }
  }

  function goTo(index) {
    if (!enabled) return;
    window.scrollTo({ top: start + clamp(index, 0, cards.length) * step + 2, behavior: 'smooth' });
  }

  previous.addEventListener('click', () => mobile ? moveMobile(mobileIndex - 1, true, -1) : goTo(active - 1));
  next.addEventListener('click', () => mobile ? moveMobile(mobileIndex + 1) : goTo(active + 1));
  cue.addEventListener('click', event => {
    if (mobile) {
      event.preventDefault();
      moveMobile(1);
      return;
    }
    if (!enabled) return;
    event.preventDefault();
    goTo(0);
  });
  document.querySelector('.skip-link').addEventListener('click', event => {
    if (mobile) {
      event.preventDefault();
      moveMobile(carouselCards.length - 1, false);
      resources.setAttribute('tabindex', '-1');
      resources.focus({ preventScroll: true });
      return;
    }
    if (!enabled) return;
    event.preventDefault();
    window.scrollTo({ top: start + cards.length * step + 2, behavior: 'instant' });
    target = current = desiredProgress();
    render();
    resources.setAttribute('tabindex', '-1');
    resources.focus({ preventScroll: true });
  });
  document.addEventListener('keydown', event => {
    if ((!enabled && !mobile) || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (!mobile && (window.scrollY < start - 30 || window.scrollY > start + step * cards.length)) return;
    if (/INPUT|TEXTAREA|SELECT/.test(event.target.tagName) || event.target.isContentEditable) return;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      const direction = event.key === 'ArrowRight' ? 1 : -1;
      if (mobile) moveMobile(mobileIndex + direction, true, direction);
      else goTo(active + direction);
    }
  });

  stack.addEventListener('pointerdown', event => {
    if (!mobile || mobileAnimating || event.button !== 0) return;
    swipe = { id: event.pointerId, x: event.clientX, y: event.clientY, time: performance.now(), offset: 0, horizontal: false };
  });
  stack.addEventListener('pointermove', event => {
    if (!swipe || event.pointerId !== swipe.id) return;
    const dx = event.clientX - swipe.x;
    const dy = event.clientY - swipe.y;
    if (!swipe.horizontal) {
      if (Math.abs(dx) + Math.abs(dy) < 9) return;
      if (Math.abs(dy) >= Math.abs(dx)) { swipe = null; return; }
      swipe.horizontal = true;
      stack.setPointerCapture(event.pointerId);
    }
    event.preventDefault();
    swipe.offset = clamp(dx, -cardWidth * 1.2, cardWidth * 1.2);
    paintMobile(swipe.offset, dx < 0 ? 1 : -1);
  });
  function finishPointer(event, canceled = false) {
    if (!swipe || event.pointerId !== swipe.id) return;
    const gesture = swipe;
    swipe = null;
    if (!gesture.horizontal) return;
    suppressClick = true;
    setTimeout(() => { suppressClick = false; }, 400);
    const distance = Math.abs(gesture.offset);
    const velocity = distance / Math.max(1, performance.now() - gesture.time);
    const direction = gesture.offset < 0 ? 1 : -1;
    if (!canceled && (distance > Math.min(85, cardWidth * .18) || (distance > 25 && velocity > .45))) {
      moveMobile(mobileIndex + direction, true, direction, gesture.offset);
    } else cancelSwipe(gesture.offset, direction);
  }
  stack.addEventListener('pointerup', finishPointer);
  stack.addEventListener('pointercancel', event => finishPointer(event, true));
  stack.addEventListener('click', event => {
    if (suppressClick) { event.preventDefault(); event.stopPropagation(); }
  }, true);
  window.addEventListener('scroll', requestRender, { passive: true });
  window.addEventListener('resize', () => {
    clearTimeout(releaseTimer);
    releaseTimer = setTimeout(configure, 120);
  });
  window.addEventListener('pageshow', requestRender);
  reduceMotion.addEventListener('change', configure);
  phone.addEventListener('change', configure);

  // For later image-to-video swaps, play only the active card's muted video.
  const observer = new MutationObserver(() => {
    document.querySelectorAll('.card-media video').forEach(video => {
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      if (!reduceMotion.matches && !video.closest('.business-card').inert) video.play().catch(() => {});
      else video.pause();
    });
  });
  observer.observe(stack, { attributes: true, attributeFilter: ['inert'], subtree: true });
  configure();
  document.fonts.ready.then(() => { if (mobile) measureMobile(); else if (enabled) measure(); });
})();
