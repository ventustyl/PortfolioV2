(() => {
  const storageKey = "portfolio-theme";

  const readStoredTheme = () => {
    try {
      const value = window.localStorage.getItem(storageKey);
      return value === "light" || value === "dark" ? value : null;
    } catch {
      return null;
    }
  };

  const preferredTheme = () =>
    readStoredTheme() ||
    (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");

  const applyDocumentTheme = (theme) => {
    document.documentElement.dataset.theme = theme;
    const themeColor = document.querySelector("[data-theme-color]");
    themeColor?.setAttribute("content", theme === "light" ? "#f2f1ea" : "#080b0d");
  };

  applyDocumentTheme(preferredTheme());

  const initPortfolio = () => {
    window.__portfolioCleanup?.();

    const root = document.querySelector("[data-portfolio-root]");
    if (!root) {
      document.body.classList.remove("reveal-ready", "menu-open");
      window.__portfolioCleanup = null;
      return;
    }

    const controller = new AbortController();
    const { signal } = controller;
    const observers = [];
    const header = root.querySelector("[data-site-header]");
    const menuButton = root.querySelector("[data-menu-toggle]");
    const themeButton = root.querySelector("[data-theme-toggle]");
    const backToTop = root.querySelector("[data-back-to-top]");
    const heroVisual = root.querySelector("[data-hero-visual]");
    const navigationLinks = Array.from(root.querySelectorAll("[data-nav-link]"));
    let menuFocusTimer = 0;

    const syncThemeButton = () => {
      const light = document.documentElement.dataset.theme === "light";
      themeButton?.setAttribute("aria-pressed", String(light));
      themeButton?.setAttribute(
        "aria-label",
        light ? "Activer le thème sombre" : "Activer le thème clair"
      );
    };

    const setTheme = (theme, persist = true) => {
      applyDocumentTheme(theme);
      syncThemeButton();

      if (persist) {
        try {
          window.localStorage.setItem(storageKey, theme);
        } catch {
          // The theme still works when storage is unavailable.
        }
      }
    };

    syncThemeButton();

    themeButton?.addEventListener(
      "click",
      () => {
        const nextTheme = document.documentElement.dataset.theme === "light" ? "dark" : "light";
        setTheme(nextTheme);
      },
      { signal }
    );

    const systemTheme = window.matchMedia("(prefers-color-scheme: light)");
    systemTheme.addEventListener(
      "change",
      (event) => {
        if (!readStoredTheme()) {
          setTheme(event.matches ? "light" : "dark", false);
        }
      },
      { signal }
    );

    const closeMenu = (returnFocus = false) => {
      window.clearTimeout(menuFocusTimer);
      root.classList.remove("is-menu-open");
      document.body.classList.remove("menu-open");
      menuButton?.setAttribute("aria-expanded", "false");
      menuButton?.setAttribute("aria-label", "Ouvrir le menu");
      if (returnFocus) menuButton?.focus();
    };

    const openMenu = () => {
      root.classList.add("is-menu-open");
      document.body.classList.add("menu-open");
      menuButton?.setAttribute("aria-expanded", "true");
      menuButton?.setAttribute("aria-label", "Fermer le menu");
      menuFocusTimer = window.setTimeout(() => {
        root.querySelector("[data-site-nav] a")?.focus();
      }, 230);
    };

    menuButton?.addEventListener(
      "click",
      () => {
        root.classList.contains("is-menu-open") ? closeMenu() : openMenu();
      },
      { signal }
    );

    root.querySelectorAll('[data-site-nav] a[href^="#"]').forEach((link) => {
      link.addEventListener("click", () => closeMenu(), { signal });
    });

    document.addEventListener(
      "keydown",
      (event) => {
        if (event.key === "Escape" && root.classList.contains("is-menu-open")) {
          closeMenu(true);
        }
      },
      { signal }
    );

    window.addEventListener(
      "resize",
      () => {
        if (window.innerWidth > 960) closeMenu();
      },
      { signal, passive: true }
    );

    const updateChrome = () => {
      const scrolled = window.scrollY > 24;
      header?.classList.toggle("is-scrolled", scrolled);
      backToTop?.classList.toggle("is-visible", window.scrollY > 700);
    };

    updateChrome();
    window.addEventListener("scroll", updateChrome, { signal, passive: true });

    const revealNodes = Array.from(root.querySelectorAll("[data-reveal]"));
    if ("IntersectionObserver" in window) {
      document.body.classList.add("reveal-ready");
      const revealObserver = new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              observer.unobserve(entry.target);
            }
          });
        },
        { rootMargin: "0px 0px -8%", threshold: 0.08 }
      );
      revealNodes.forEach((node) => revealObserver.observe(node));
      observers.push(revealObserver);
    } else {
      revealNodes.forEach((node) => node.classList.add("is-visible"));
    }

    const sections = Array.from(root.querySelectorAll("[data-section]"));
    if ("IntersectionObserver" in window && sections.length) {
      const sectionObserver = new IntersectionObserver(
        (entries) => {
          const visible = entries
            .filter((entry) => entry.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

          if (!visible?.target.id) return;

          navigationLinks.forEach((link) => {
            const active = link.getAttribute("href") === `#${visible.target.id}`;
            link.classList.toggle("is-active", active);
            active ? link.setAttribute("aria-current", "location") : link.removeAttribute("aria-current");
          });
        },
        { rootMargin: "-24% 0px -58%", threshold: [0, 0.08, 0.2] }
      );
      sections.forEach((section) => sectionObserver.observe(section));
      observers.push(sectionObserver);
    }

    const canParallax =
      heroVisual &&
      window.matchMedia("(pointer: fine)").matches &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (canParallax) {
      window.addEventListener(
        "pointermove",
        (event) => {
          const x = (event.clientX / window.innerWidth - 0.5) * 12;
          const y = (event.clientY / window.innerHeight - 0.5) * 10;
          heroVisual.style.setProperty("--parallax-x", `${x}px`);
          heroVisual.style.setProperty("--parallax-y", `${y}px`);
        },
        { signal, passive: true }
      );
    }

    window.__portfolioCleanup = () => {
      controller.abort();
      window.clearTimeout(menuFocusTimer);
      observers.forEach((observer) => observer.disconnect());
      document.body.classList.remove("reveal-ready", "menu-open");
      root.classList.remove("is-menu-open");
    };
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPortfolio, { once: true });
  } else {
    initPortfolio();
  }

  document.addEventListener("enhancedload", initPortfolio);
})();
