(function () {
  "use strict";

  const STORAGE_KEY = "portfolio-theme";
  const TYPEWRITER_TEXT = "Bowen 用程式與設計，\n把想法變成可觸及的體驗。";
  const TAIPEI_101 = [25.0339, 121.5645];
  const VISIT_API =
    "https://countapi.mileshilliard.com/api/v1/hit/bowen_portfolio_pageviews_2026";

  const header = document.querySelector(".site-header");
  const navToggle = document.getElementById("nav-toggle");
  const themeToggle = document.getElementById("theme-toggle");
  const yearEl = document.getElementById("year");
  const typewriterEl = document.getElementById("typewriter");
  const typewriterCursor = document.querySelector(".typewriter-cursor");
  const backToTopBtn = document.getElementById("back-to-top");
  const visitCountEl = document.getElementById("visit-count");

  let mapInstance = null;

  function getStoredTheme() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  }

  function setStoredTheme(value) {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      /* ignore */
    }
  }

  function getPreferredTheme() {
    if (window.matchMedia("(prefers-color-scheme: light)").matches) {
      return "light";
    }
    return "dark";
  }

  function getCurrentTheme() {
    return document.documentElement.getAttribute("data-theme") === "light"
      ? "light"
      : "dark";
  }

  function applyTheme(theme) {
    const root = document.documentElement;
    if (theme === "light") {
      root.setAttribute("data-theme", "light");
    } else {
      root.removeAttribute("data-theme");
    }
    if (themeToggle) {
      themeToggle.setAttribute(
        "aria-label",
        theme === "light" ? "切換為深色主題" : "切換為淺色主題"
      );
    }
    updateMapTiles(theme);
  }

  function initTheme() {
    const stored = getStoredTheme();
    const theme =
      stored === "light" || stored === "dark" ? stored : getPreferredTheme();
    applyTheme(theme);
  }

  function toggleTheme() {
    const isLight = getCurrentTheme() === "light";
    const next = isLight ? "dark" : "light";
    applyTheme(next);
    setStoredTheme(next);
  }

  function closeNav() {
    if (!header || !navToggle) return;
    header.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "開啟選單");
  }

  function openNav() {
    if (!header || !navToggle) return;
    header.classList.add("is-open");
    navToggle.setAttribute("aria-expanded", "true");
    navToggle.setAttribute("aria-label", "關閉選單");
  }

  function toggleNav() {
    if (!header || !navToggle) return;
    if (header.classList.contains("is-open")) {
      closeNav();
    } else {
      openNav();
    }
  }

  function initNavToggle() {
    if (!navToggle || !header) return;
    navToggle.addEventListener("click", toggleNav);

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeNav();
    });

    siteNavLinksCloseOnClick();

    window.addEventListener("resize", function () {
      if (window.matchMedia("(min-width: 768px)").matches) {
        closeNav();
      }
    });
  }

  function siteNavLinksCloseOnClick() {
    const navLinks = document.querySelectorAll(".site-nav a");
    navLinks.forEach(function (link) {
      link.addEventListener("click", closeNav);
    });
  }

  function initSmoothScroll() {
    const links = document.querySelectorAll('a[href^="#"]:not(.skip-link)');
    links.forEach(function (anchor) {
      anchor.addEventListener("click", function (e) {
        const id = anchor.getAttribute("href");
        if (!id || id === "#") return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        closeNav();
        if (history.replaceState) {
          history.replaceState(null, "", id);
        }
      });
    });
  }

  function initReveal() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      document.querySelectorAll(".reveal").forEach(function (el) {
        el.classList.add("is-visible");
      });
      return;
    }

    const elements = document.querySelectorAll(".reveal");
    if (!elements.length) return;

    const observer = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { root: null, rootMargin: "0px 0px -8% 0px", threshold: 0.1 }
    );

    elements.forEach(function (el) {
      observer.observe(el);
    });
  }

  function initTypewriter() {
    if (!typewriterEl) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      typewriterEl.textContent = TYPEWRITER_TEXT.replace("\n", " ");
      if (typewriterCursor) typewriterCursor.classList.add("is-done");
      return;
    }

    let index = 0;
    const speed = 80;

    function typeNext() {
      if (index >= TYPEWRITER_TEXT.length) {
        if (typewriterCursor) typewriterCursor.classList.add("is-done");
        return;
      }

      const char = TYPEWRITER_TEXT.charAt(index);
      if (char === "\n") {
        typewriterEl.appendChild(document.createElement("br"));
      } else {
        typewriterEl.appendChild(document.createTextNode(char));
      }

      index += 1;
      window.setTimeout(typeNext, speed);
    }

    typeNext();
  }

  function getMapTileUrl(theme) {
    if (theme === "light") {
      return "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
    }
    return "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
  }

  function updateMapTiles(theme) {
    if (!mapInstance || !window.L) return;

    mapInstance.eachLayer(function (layer) {
      if (layer instanceof L.TileLayer) {
        mapInstance.removeLayer(layer);
      }
    });

    L.tileLayer(getMapTileUrl(theme), {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 19,
    }).addTo(mapInstance);
  }

  function initMap() {
    const container = document.getElementById("map-container");
    if (!container || !window.L) return;

    mapInstance = L.map(container, {
      scrollWheelZoom: false,
    }).setView(TAIPEI_101, 14);

    updateMapTiles(getCurrentTheme());

    const markerIcon = L.divIcon({
      className: "map-custom-marker",
      html:
        '<span class="map-custom-marker__pin" aria-hidden="true"></span>',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    });

    L.marker(TAIPEI_101, { icon: markerIcon })
      .addTo(mapInstance)
      .bindPopup("台北 101", { className: "map-marker-popup" });

    container.addEventListener("click", function enableScrollZoom() {
      mapInstance.scrollWheelZoom.enable();
    });

    window.addEventListener("resize", function () {
      mapInstance.invalidateSize();
    });
  }

  function initVisitorCount() {
    if (!visitCountEl) return;

    fetch(VISIT_API)
      .then(function (res) {
        if (!res.ok) throw new Error("API error");
        return res.json();
      })
      .then(function (data) {
        const count = data && (data.value ?? data.count);
        if (typeof count === "number") {
          visitCountEl.textContent = count.toLocaleString("zh-TW");
        } else if (typeof count === "string" && count !== "") {
          visitCountEl.textContent = Number(count).toLocaleString("zh-TW");
        } else {
          visitCountEl.textContent = "—";
        }
      })
      .catch(function () {
        visitCountEl.textContent = "—";
      });
  }

  function initBackToTop() {
    if (!backToTopBtn) return;

    const showThreshold = 400;

    function updateVisibility() {
      const shouldShow = window.scrollY > showThreshold;
      backToTopBtn.hidden = !shouldShow;
      backToTopBtn.classList.toggle("is-visible", shouldShow);
    }

    window.addEventListener("scroll", updateVisibility, { passive: true });
    updateVisibility();

    backToTopBtn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  function initYear() {
    if (yearEl) {
      yearEl.textContent = String(new Date().getFullYear());
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    initTheme();
    if (themeToggle) {
      themeToggle.addEventListener("click", toggleTheme);
    }
    initNavToggle();
    initSmoothScroll();
    initReveal();
    initTypewriter();
    initMap();
    initVisitorCount();
    initBackToTop();
    initYear();
  });
})();
