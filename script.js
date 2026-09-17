/* NativeToEnglish landing page — theme, scroll state, reveals, and the live demo. */

(() => {
  const root = document.documentElement;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ---- Theme toggle ---------------------------------------------------- */

  const toggle = document.querySelector("#theme-toggle");
  const systemDark = window.matchMedia("(prefers-color-scheme: dark)");

  const activeTheme = () => root.dataset.theme || (systemDark.matches ? "dark" : "light");

  const syncToggleLabel = () => {
    if (!toggle) return;
    const dark = activeTheme() === "dark";
    toggle.setAttribute("aria-pressed", String(dark));
    toggle.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
  };

  toggle?.addEventListener("click", () => {
    const next = activeTheme() === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    try {
      localStorage.setItem("n2e-theme", next);
    } catch (error) {
      /* storage blocked: the choice simply does not persist */
    }
    syncToggleLabel();
  });

  systemDark.addEventListener("change", syncToggleLabel);
  syncToggleLabel();

  /* ---- In-page anchors ------------------------------------------------- */

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const hash = link.getAttribute("href");
      if (!hash || hash === "#") return;

      const target = document.querySelector(hash);
      if (!target) return;

      event.preventDefault();
      const behavior = reducedMotion.matches ? "auto" : "smooth";

      if (hash === "#top") {
        window.scrollTo({ top: 0, behavior });
      } else {
        target.scrollIntoView({ behavior, block: "start" });
      }

      // Keep the address bar honest without a second, instant jump.
      history.pushState(null, "", hash);

      // Anchors move the eye; they must move keyboard focus too.
      if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
    });
  });

  /* ---- Header background on scroll ------------------------------------- */

  const header = document.querySelector(".site-header");
  const syncHeader = () => header?.classList.toggle("is-stuck", window.scrollY > 8);
  window.addEventListener("scroll", syncHeader, { passive: true });
  syncHeader();

  /* ---- Scroll reveals --------------------------------------------------- */

  const revealable = document.querySelectorAll("[data-reveal]");

  if (reducedMotion.matches || !("IntersectionObserver" in window)) {
    revealable.forEach((element) => element.classList.add("is-visible"));
  } else {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.12 }
    );
    revealable.forEach((element) => observer.observe(element));
  }

  /* ---- Live demo -------------------------------------------------------- */

  const demo = document.querySelector(".demo-window");
  const draft = document.querySelector("#demo-draft");
  const result = document.querySelector("#demo-result");
  const status = document.querySelector("#demo-status");
  const pills = [...document.querySelectorAll(".pill")];
  if (!demo || !draft || !result || !status || !pills.length) return;

  const DRAFT = draft.textContent.trim();
  const REWRITES = {
    native: { text: "আমি কাল আপনার সাথে মিটিং করতে চাই।", lang: "bn" },
    english: { text: "I would like to meet with you tomorrow.", lang: "en" },
    formal: { text: "I would like to request a meeting with you tomorrow, if you are available.", lang: "en" },
    academic: { text: "I would like to arrange a meeting with you tomorrow.", lang: "en" }
  };

  // Clear the finished state synchronously so it never flashes before the intro runs.
  if (!reducedMotion.matches) {
    draft.textContent = "";
    result.classList.add("is-swapping");
    demo.classList.add("is-typing");
  }

  const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

  const paint = (mode) => {
    const rewrite = REWRITES[mode] || REWRITES.english;
    result.textContent = rewrite.text;
    result.lang = rewrite.lang;
  };

  const selectedMode = () => pills.find((pill) => pill.getAttribute("aria-selected") === "true")?.dataset.mode || "english";

  const select = async (pill) => {
    if (pill.getAttribute("aria-selected") === "true") return;
    pills.forEach((other) => {
      const isTarget = other === pill;
      other.setAttribute("aria-selected", String(isTarget));
      other.tabIndex = isTarget ? 0 : -1;
    });

    if (reducedMotion.matches) {
      paint(pill.dataset.mode);
      return;
    }

    result.classList.add("is-swapping");
    demo.classList.add("is-working");
    status.textContent = "Improving…";
    await wait(260);
    paint(pill.dataset.mode);
    result.classList.remove("is-swapping");
    await wait(220);
    demo.classList.remove("is-working");
    status.textContent = "Improve";
  };

  pills.forEach((pill, index) => {
    pill.addEventListener("click", () => select(pill));
    pill.addEventListener("keydown", (event) => {
      const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
      if (!step) return;
      event.preventDefault();
      const next = pills[(index + step + pills.length) % pills.length];
      next.focus();
      select(next);
    });
  });

  const runIntro = async () => {
    if (reducedMotion.matches) {
      paint(selectedMode());
      return;
    }

    await wait(520);

    for (const character of DRAFT) {
      draft.textContent += character;
      await wait(character === " " ? 52 : 34);
    }

    await wait(420);
    demo.classList.remove("is-typing");
    demo.classList.add("is-working");
    status.textContent = "Improving…";
    await wait(760);

    paint(selectedMode());
    result.classList.remove("is-swapping");
    await wait(260);
    demo.classList.remove("is-working");
    status.textContent = "Improve";
  };

  // Hold the finished state until the hero is actually on screen.
  if ("IntersectionObserver" in window) {
    const demoObserver = new IntersectionObserver(
      (entries, self) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        self.disconnect();
        runIntro();
      },
      { threshold: 0.35 }
    );
    demoObserver.observe(demo);
  } else {
    runIntro();
  }
})();
