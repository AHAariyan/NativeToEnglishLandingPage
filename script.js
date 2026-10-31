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
  // Every answer below is a real NativeToEnglish answer from the live API, saved once.

  const demo = document.querySelector(".demo-window");
  const draft = document.querySelector("#demo-draft");
  const result = document.querySelector("#demo-result");
  const status = document.querySelector("#demo-status");
  const pills = [...document.querySelectorAll(".pill")];
  const tabs = [...document.querySelectorAll(".lang-tab")];
  const nativePill = pills.find((pill) => pill.dataset.mode === "native");
  if (!demo || !draft || !result || !status || !pills.length || !tabs.length || !nativePill) return;

  const LANGS = [
    {"lang": "bn", "label": "বাংলা", "draft": "Ma, aj raat e bari firte deri hobe, tumi kheye nio", "native": "মা, আজ রাতে বাড়ি ফিরতে দেরি হবে, তুমি খেয়ে নিও।", "english": "Mom, I will be late coming home tonight, please eat."},
    {"lang": "hi", "label": "हिन्दी", "draft": "Papa, aaj raat der ho jayegi, aap khana kha lena", "native": "पापा, आज रात देर हो जाएगी, आप खाना खा लेना।", "english": "Dad, I'll be late tonight, please have your dinner."},
    {"lang": "ur", "rtl": true, "label": "اردو", "draft": "Ammi, aaj raat der ho jaye gi, aap khana kha lijiye ga", "native": "امی، آج رات دیر ہو جائے گی، آپ کھانا کھا لیجیے گا۔", "english": "Mom, I will be late tonight; please have your dinner."},
    {"lang": "ar", "rtl": true, "label": "العربية", "draft": "mama, ana hat2akhar el naharda, et3asho enty w baba", "native": "ماما، أنا هأتأخر النهاردة، اتعشوا إنتي وبابا", "english": "Mom, I will be late today. You and Dad have dinner without me."},
    {"lang": "tl", "label": "Tagalog", "draft": "Ma, gagabihin ako ngayong gabi, kumain na po kayo", "native": "Ma, gagabiin ako ngayong gabi, kumain na po kayo.", "english": "Mom, I'll be late tonight. Please eat already."}
  ];

  let lang = 0;
  let mode = "english";
  let run = 0; // bumps on every new animation so an older one stops where it is

  // Clear the finished state synchronously so it never flashes before the intro runs.
  if (!reducedMotion.matches) {
    draft.textContent = "";
    result.classList.add("is-swapping");
    demo.classList.add("is-typing");
  }

  const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

  const mark = (list, target) => list.forEach((item) => {
    const on = item === target;
    item.setAttribute("aria-selected", String(on));
    item.tabIndex = on ? 0 : -1;
  });

  const paint = () => {
    const entry = LANGS[lang];
    const native = mode === "native";
    result.textContent = native ? entry.native : entry.english;
    result.lang = native ? entry.lang : "en";
    result.dir = native && entry.rtl ? "rtl" : "ltr";
  };

  const showLang = () => {
    const entry = LANGS[lang];
    mark(tabs, tabs[lang]);
    nativePill.textContent = entry.label;
    nativePill.lang = entry.lang;
    mark(pills, pills.find((pill) => pill.dataset.mode === mode));
  };

  const convert = async (id, pause) => {
    demo.classList.add("is-working");
    status.textContent = "Converting…";
    await wait(pause);
    if (id !== run) return false;
    paint();
    result.classList.remove("is-swapping");
    await wait(240);
    if (id !== run) return false;
    demo.classList.remove("is-working");
    status.textContent = "Convert";
    return true;
  };

  // Types the draft for the current language, then converts it.
  const write = async (id) => {
    showLang();
    if (reducedMotion.matches) {
      draft.textContent = LANGS[lang].draft;
      paint();
      return true;
    }
    result.classList.add("is-swapping");
    demo.classList.add("is-typing");
    demo.classList.remove("is-working");
    status.textContent = "Convert";
    draft.textContent = "";
    await wait(320);
    for (const character of LANGS[lang].draft) {
      if (id !== run) return false;
      draft.textContent += character;
      await wait(character === " " ? 44 : 28);
    }
    await wait(360);
    if (id !== run) return false;
    demo.classList.remove("is-typing");
    return convert(id, 700);
  };

  const switchMode = async (id, next) => {
    mode = next;
    showLang();
    if (reducedMotion.matches) { paint(); return true; }
    result.classList.add("is-swapping");
    return convert(id, 260);
  };

  // After the intro, walk through every language (English, then its own script)
  // so a visitor sees them all without hunting. Any tap hands control back for good.
  let touring = true;
  const stopTour = () => { touring = false; run += 1; };
  const tour = async () => {
    const id = run;
    while (touring && id === run) {
      await wait(2400);
      if (!touring || id !== run) return;
      if (!(await switchMode(id, "native"))) return;
      await wait(2600);
      if (!touring || id !== run) return;
      lang = (lang + 1) % LANGS.length;
      mode = "english";
      if (!(await write(id))) return;
    }
  };

  const arrow = (event) => event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;

  tabs.forEach((tab, index) => {
    const pick = () => {
      stopTour();
      if (index === lang) return;
      lang = index;
      write(run);
    };
    tab.addEventListener("click", pick);
    tab.addEventListener("keydown", (event) => {
      const step = arrow(event);
      if (!step) return;
      event.preventDefault();
      const next = tabs[(index + step + tabs.length) % tabs.length];
      next.focus();
      next.click();
    });
  });

  pills.forEach((pill, index) => {
    const pick = () => {
      stopTour();
      if (pill.dataset.mode === mode) return;
      switchMode(run, pill.dataset.mode);
    };
    pill.addEventListener("click", pick);
    pill.addEventListener("keydown", (event) => {
      const step = arrow(event);
      if (!step) return;
      event.preventDefault();
      const next = pills[(index + step + pills.length) % pills.length];
      next.focus();
      next.click();
    });
  });

  const runIntro = async () => {
    if (reducedMotion.matches) { showLang(); paint(); return; }
    await wait(300);
    if (await write(run)) tour();
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

/* ---- Email signup --------------------------------------------------------
   The block stays hidden until data-endpoint on #signup holds the provider's
   form URL. The form posts into a hidden iframe: no backend, no CORS. */
(() => {
  const box = document.getElementById("signup");
  const url = (box?.getAttribute("data-endpoint") || "").trim();
  if (!url.startsWith("https://")) return;
  const form = box.querySelector("form");
  const email = form.querySelector('input[type="email"]');
  const trap = form.querySelector(".su-trap input");
  const note = box.querySelector(".su-status");
  const btn = form.querySelector("button");
  form.action = url;
  email.name = box.getAttribute("data-field") || "email_address";
  box.hidden = false;
  form.addEventListener("submit", (event) => {
    if (trap.value) { event.preventDefault(); return; }
    window.track?.("email_signup_submit", {});
    setTimeout(() => {
      form.reset();
      btn.disabled = true;
      note.textContent = "Almost there. Check your inbox and tap the link to confirm.";
      setTimeout(() => { btn.disabled = false; }, 4000);
    }, 0);
  });
})();
