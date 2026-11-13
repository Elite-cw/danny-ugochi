(function () {
  "use strict";

  const body = document.body;
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;

  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const timeEl = document.getElementById("localTime");
  function updateTime() {
    if (!timeEl) return;
    const time = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Lisbon",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).format(new Date());
    timeEl.textContent = "Lisbon " + time;
  }
  updateTime();
  setInterval(updateTime, 30000);

  const header = document.getElementById("siteHeader");
  function onScroll() {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 32);
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const toggle = document.getElementById("menuToggle");
  const menu = document.getElementById("mobileMenu");
  let menuOpen = false;

  function setMenu(open) {
    menuOpen = open;
    body.classList.toggle("menu-open", open);
    if (toggle) {
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    }
    if (menu) menu.setAttribute("aria-hidden", String(!open));

    if (open && menu) {
      const firstLink = menu.querySelector("a");
      if (firstLink) window.setTimeout(() => firstLink.focus(), 350);
    } else if (toggle) {
      toggle.focus({ preventScroll: true });
    }
  }

  if (toggle) {
    toggle.addEventListener("click", function () {
      setMenu(!menuOpen);
    });
  }

  if (menu) {
    menu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        setMenu(false);
      });
    });
  }

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && menuOpen) setMenu(false);
  });

  const revealTargets = document.querySelectorAll(".reveal, .contact-title");
  if ("IntersectionObserver" in window && !prefersReduced) {
    const revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    revealTargets.forEach(function (el) {
      revealObserver.observe(el);
    });
  } else {
    revealTargets.forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  if (!finePointer || prefersReduced) return;

  const ring = document.querySelector(".cursor");
  const dot = document.querySelector(".cursor-dot");
  const label = document.querySelector(".cursor-label");
  if (!ring || !dot) return;

  body.classList.add("has-cursor");

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let ringX = mouseX;
  let ringY = mouseY;

  window.addEventListener(
    "pointermove",
    function (event) {
      mouseX = event.clientX;
      mouseY = event.clientY;
      dot.style.left = mouseX + "px";
      dot.style.top = mouseY + "px";
      ring.classList.remove("is-hidden");
    },
    { passive: true }
  );

  document.addEventListener("pointerleave", function () {
    ring.classList.add("is-hidden");
    dot.style.opacity = "0";
  });

  document.addEventListener("pointerenter", function () {
    dot.style.opacity = "1";
  });

  function renderCursor() {
    ringX += (mouseX - ringX) * 0.18;
    ringY += (mouseY - ringY) * 0.18;
    ring.style.left = ringX + "px";
    ring.style.top = ringY + "px";
    window.requestAnimationFrame(renderCursor);
  }
  window.requestAnimationFrame(renderCursor);

  document.querySelectorAll("[data-cursor]").forEach(function (el) {
    el.addEventListener("pointerenter", function () {
      if (label) label.textContent = el.getAttribute("data-cursor") || "View";
      ring.classList.add("is-active");
    });
    el.addEventListener("pointerleave", function () {
      ring.classList.remove("is-active");
    });
  });

  document.querySelectorAll(".magnetic").forEach(function (el) {
    el.addEventListener("pointermove", function (event) {
      const rect = el.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      el.style.transform =
        "translate(" + x * 0.16 + "px, " + y * 0.22 + "px)";
    });
    el.addEventListener("pointerleave", function () {
      el.style.transform = "";
    });
  });

  const portrait = document.getElementById("portrait");
  const visual = document.querySelector(".hero-visual");
  if (portrait && visual) {
    visual.addEventListener("pointermove", function (event) {
      const rect = visual.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      portrait.style.transform =
        "perspective(1000px) rotateY(" +
        x * 5 +
        "deg) rotateX(" +
        -y * 5 +
        "deg)";
    });
    visual.addEventListener("pointerleave", function () {
      portrait.style.transform = "";
    });
  }
})();
