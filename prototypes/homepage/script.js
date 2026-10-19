(() => {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Navbar opacity on scroll
  const nav = document.getElementById("nav");
  const updateNav = () => nav.classList.toggle("is-scrolled", window.scrollY > 20);
  updateNav();
  window.addEventListener("scroll", updateNav, { passive: true });

  // Footer year
  document.getElementById("year").textContent = new Date().getFullYear();

  // Scroll reveal
  const aiTags = document.getElementById("ai-tags");
  Array.from(aiTags.children).forEach((tag, i) => tag.style.setProperty("--i", i));

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        if (entry.target.contains(aiTags)) aiTags.classList.add("is-animating");
        revealObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
  );
  document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));

  // Pricing toggle
  const toggle = document.getElementById("billing-toggle");
  const proAmount = document.getElementById("pro-amount");
  const proPeriod = document.getElementById("pro-period");
  const proNote = document.getElementById("pro-note");
  const periodLabels = document.querySelectorAll("[data-period-label]");

  const setYearly = (yearly) => {
    toggle.setAttribute("aria-checked", String(yearly));
    proAmount.textContent = yearly ? "$72" : "$8";
    proPeriod.textContent = yearly ? "/year" : "/month";
    proNote.textContent = yearly ? "Just $6/month, billed yearly." : "Billed monthly. Cancel anytime.";
    periodLabels.forEach((label) => {
      label.classList.toggle("is-active", (label.dataset.periodLabel === "yearly") === yearly);
    });
  };

  toggle.addEventListener("click", () => setYearly(toggle.getAttribute("aria-checked") !== "true"));
  periodLabels.forEach((label) => {
    label.style.cursor = "pointer";
    label.addEventListener("click", () => setYearly(label.dataset.periodLabel === "yearly"));
  });

  // Chaos icons
  const box = document.getElementById("chaos-box");
  const iconEls = Array.from(box.querySelectorAll(".chaos-icon"));
  const ICON_SIZE = 52;
  const MAX_SPEED = 1.6;
  const REPEL_RADIUS = 110;
  const REPEL_FORCE = 0.9;

  let bounds = { width: box.clientWidth, height: box.clientHeight };
  const mouse = { x: 0, y: 0, active: false };

  const rand = (min, max) => Math.random() * (max - min) + min;

  const icons = iconEls.map((el) => {
    const angle = rand(0, Math.PI * 2);
    const speed = rand(0.4, 0.9);
    return {
      el,
      x: rand(0, Math.max(0, bounds.width - ICON_SIZE)),
      y: rand(0, Math.max(0, bounds.height - ICON_SIZE)),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      rotation: rand(-20, 20),
      spin: rand(-0.3, 0.3),
      phase: rand(0, Math.PI * 2),
      cruise: speed,
    };
  });

  const render = (icon, time) => {
    const scale = 1 + Math.sin(time / 900 + icon.phase) * 0.06;
    icon.el.style.transform = `translate(${icon.x}px, ${icon.y}px) rotate(${icon.rotation}deg) scale(${scale})`;
  };

  const step = (icon) => {
    if (mouse.active) {
      const dx = icon.x + ICON_SIZE / 2 - mouse.x;
      const dy = icon.y + ICON_SIZE / 2 - mouse.y;
      const dist = Math.hypot(dx, dy) || 1;
      if (dist < REPEL_RADIUS) {
        const force = ((REPEL_RADIUS - dist) / REPEL_RADIUS) * REPEL_FORCE;
        icon.vx += (dx / dist) * force;
        icon.vy += (dy / dist) * force;
      }
    }

    // Ease back toward cruising speed after being pushed
    const speed = Math.hypot(icon.vx, icon.vy) || 1;
    const target = Math.min(speed, MAX_SPEED) * 0.97 + icon.cruise * 0.03;
    icon.vx = (icon.vx / speed) * target;
    icon.vy = (icon.vy / speed) * target;

    icon.x += icon.vx;
    icon.y += icon.vy;
    icon.rotation += icon.spin;

    const maxX = bounds.width - ICON_SIZE;
    const maxY = bounds.height - ICON_SIZE;
    if (icon.x <= 0 || icon.x >= maxX) {
      icon.x = Math.min(Math.max(icon.x, 0), maxX);
      icon.vx *= -1;
      icon.spin *= -1;
    }
    if (icon.y <= 0 || icon.y >= maxY) {
      icon.y = Math.min(Math.max(icon.y, 0), maxY);
      icon.vy *= -1;
    }
  };

  let running = false;
  const tick = (time) => {
    icons.forEach((icon) => {
      step(icon);
      render(icon, time);
    });
    if (running) requestAnimationFrame(tick);
  };

  icons.forEach((icon) => render(icon, 0));

  if (!prefersReducedMotion) {
    // Only animate while the hero is on screen
    new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !running) {
        running = true;
        requestAnimationFrame(tick);
      } else if (!entry.isIntersecting) {
        running = false;
      }
    }).observe(box);
  }

  box.addEventListener("pointermove", (event) => {
    const rect = box.getBoundingClientRect();
    mouse.x = event.clientX - rect.left;
    mouse.y = event.clientY - rect.top;
    mouse.active = true;
  });
  box.addEventListener("pointerleave", () => {
    mouse.active = false;
  });

  window.addEventListener("resize", () => {
    bounds = { width: box.clientWidth, height: box.clientHeight };
  });
})();
