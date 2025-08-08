// Date formatting for subtitle
(function setDate() {
  const dateEl = document.getElementById('dateText');
  if (!dateEl) return;
  const formatter = new Intl.DateTimeFormat(undefined, {
    weekday: 'long', month: 'long', day: 'numeric'
  });
  dateEl.textContent = formatter.format(new Date());
})();

// Chip toggle (visual only)
(function chipToggle() {
  const chips = Array.from(document.querySelectorAll('.chip'));
  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      chips.forEach(c => { c.classList.remove('active'); c.setAttribute('aria-pressed', 'false'); });
      chip.classList.add('active');
      chip.setAttribute('aria-pressed', 'true');
    });
  });
})();

// Card tilt + parallax depth
(function interactiveCards() {
  const rootCards = Array.from(document.querySelectorAll('[data-depth-root]'));
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  rootCards.forEach((card) => {
    if (prefersReduced) return;

    const onMove = (event) => {
      const rect = card.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width; // 0..1
      const py = (event.clientY - rect.top) / rect.height; // 0..1
      const tiltX = (py - 0.5) * -8; // degrees
      const tiltY = (px - 0.5) * 8;  // degrees
      card.style.transform = `rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;

      const depthChildren = card.querySelectorAll('[data-depth]');
      depthChildren.forEach((el) => {
        const depth = Number(el.getAttribute('data-depth')) || 1;
        const dx = (px - 0.5) * depth * 1.2;
        const dy = (py - 0.5) * depth * 1.2;
        el.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
      });
    };

    const onLeave = () => {
      card.style.transform = '';
      const depthChildren = card.querySelectorAll('[data-depth]');
      depthChildren.forEach((el) => { el.style.transform = ''; });
    };

    card.addEventListener('mousemove', onMove);
    card.addEventListener('mouseleave', onLeave);
  });
})();

// Tap interaction: gentle pulse + haptic (if supported)
(function tapPulse() {
  const taps = Array.from(document.querySelectorAll('.tap'));
  taps.forEach((btn) => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.weather-card');
      if (!card) return;
      card.animate([
        { transform: 'scale(1)' },
        { transform: 'scale(0.985)' },
        { transform: 'scale(1)' }
      ], { duration: 180, easing: 'ease-out' });

      if ('vibrate' in navigator) {
        try { navigator.vibrate(10); } catch (_) {}
      }
    });
  });
})();

// Auto subtle entrance animation
(function enterAnimation() {
  const cards = document.querySelectorAll('.weather-card');
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  cards.forEach((card, i) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(10px)';
    const delay = 80 * i;
    setTimeout(() => {
      card.animate([
        { opacity: 0, transform: 'translateY(10px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ], { duration: 500, easing: 'cubic-bezier(.2,.6,.2,1)' });
      card.style.opacity = '';
      card.style.transform = '';
    }, delay);
  });
})();