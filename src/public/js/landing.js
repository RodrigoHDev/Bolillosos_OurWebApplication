(function () {

  /* ── Nav: turn semi-opaque on scroll ── */
  const nav = document.getElementById('landNav');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });

  /* ── About: expand toggle — works on both desktop and mobile ── */
  const toggle = document.getElementById('aboutToggle');
  const panel  = document.getElementById('aboutPanel');
  const icon   = toggle.querySelector('.about-pill-icon');
  const label  = toggle.querySelector('.about-pill-label');

  const isMobile = () => window.innerWidth <= 600;

  toggle.addEventListener('click', () => {
    const isOpen = panel.classList.contains('open');
    panel.classList.toggle('open', !isOpen);
    toggle.setAttribute('aria-expanded', String(!isOpen));

    if (isMobile()) {
      // Vertical: arrow points down when open
      icon.textContent = !isOpen ? '▼' : '▶';
    } else {
      // Horizontal: arrow points left when open (panel is to the right)
      icon.textContent = !isOpen ? '◀' : '▶';
    }

    label.textContent = !isOpen ? 'Cerrar' : 'Leer más';
  });

  // Re-sync icon if window is resized across the breakpoint while open
  window.addEventListener('resize', () => {
    if (!panel.classList.contains('open')) return;
    icon.textContent = isMobile() ? '▼' : '◀';
  });

})();