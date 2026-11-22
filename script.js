/* ============================================================
   الذكاء الاصطناعي في حياتنا — Presentation Controller
   ============================================================ */

(function () {
  "use strict";

  const slides = Array.from(document.querySelectorAll(".slide"));
  const totalSlides = slides.length;

  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const currentEl = document.getElementById("currentSlide");
  const totalEl = document.getElementById("totalSlides");
  const progressFill = document.getElementById("progressFill");
  const progressTrack = document.getElementById("progressTrack");
  const progressDots = document.getElementById("progressDots");
  const announcer = document.getElementById("slideAnnouncer");
  const stage = document.getElementById("stage");
  const fullscreenBtn = document.getElementById("fullscreenBtn");

  let currentIndex = 0;
  let transitionTimer = null;

  totalEl.textContent = String(totalSlides);
  progressTrack.setAttribute("aria-valuemax", String(totalSlides));

  // Build one direct-navigation dot per slide.
  const dots = slides.map(function (slide, index) {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "progress-dot";
    dot.setAttribute("aria-label", "الانتقال إلى الشريحة " + (index + 1) + " من " + totalSlides);
    dot.setAttribute("title", "الشريحة " + (index + 1));
    dot.addEventListener("click", function () {
      goTo(index);
    });
    progressDots.appendChild(dot);
    return dot;
  });

  function updateUI() {
    currentEl.textContent = String(currentIndex + 1);

    prevBtn.disabled = currentIndex === 0;
    nextBtn.disabled = currentIndex === totalSlides - 1;

    const percent = ((currentIndex + 1) / totalSlides) * 100;
    progressFill.style.width = percent + "%";
    progressTrack.setAttribute("aria-valuenow", String(currentIndex + 1));

    dots.forEach(function (dot, index) {
      const active = index === currentIndex;
      dot.classList.toggle("is-active", active);
      if (active) {
        dot.setAttribute("aria-current", "step");
      } else {
        dot.removeAttribute("aria-current");
      }
    });

    const title = slides[currentIndex].dataset.title || "";
    announcer.textContent = "الشريحة " + (currentIndex + 1) + " من " + totalSlides + ": " + title;
  }

  function goTo(index) {
    const target = Math.max(0, Math.min(totalSlides - 1, index));
    if (target === currentIndex) return;

    // Forward in RTL moves visually left; backward moves visually right.
    const direction = target > currentIndex ? 1 : -1;
    const oldSlide = slides[currentIndex];
    const newSlide = slides[target];

    window.clearTimeout(transitionTimer);
    slides.forEach(function (slide) {
      slide.classList.remove(
        "enter-from-left",
        "enter-from-right",
        "leave-to-left",
        "leave-to-right"
      );
    });

    const enterClass = direction === 1 ? "enter-from-left" : "enter-from-right";
    const leaveClass = direction === 1 ? "leave-to-right" : "leave-to-left";

    newSlide.classList.add(enterClass);
    void newSlide.offsetWidth; // Apply the starting transform before activating.

    oldSlide.classList.add(leaveClass);
    oldSlide.classList.remove("is-active");
    newSlide.classList.add("is-active");

    currentIndex = target;
    updateUI();

    transitionTimer = window.setTimeout(function () {
      oldSlide.classList.remove(leaveClass);
      newSlide.classList.remove(enterClass);
    }, 650);
  }

  function next() {
    goTo(currentIndex + 1);
  }

  function previous() {
    goTo(currentIndex - 1);
  }

  // Buttons: physical left arrow advances, physical right arrow goes back.
  nextBtn.addEventListener("click", next);
  prevBtn.addEventListener("click", previous);

  // Keyboard navigation (also mirrored to the physical arrow direction).
  document.addEventListener("keydown", function (event) {
    if (event.altKey || event.ctrlKey || event.metaKey) return;

    switch (event.key) {
      case "ArrowLeft":
        event.preventDefault();
        next();
        break;
      case "ArrowRight":
        event.preventDefault();
        previous();
        break;
      case "Home":
        event.preventDefault();
        goTo(0);
        break;
      case "End":
        event.preventDefault();
        goTo(totalSlides - 1);
        break;
      default:
        break;
    }
  });

  // Touch navigation: swipe left = next, swipe right = previous.
  let touchStartX = 0;
  let touchStartY = 0;
  let touchTracking = false;

  stage.addEventListener("touchstart", function (event) {
    if (event.touches.length !== 1) {
      touchTracking = false;
      return;
    }
    touchTracking = true;
    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
  }, { passive: true });

  stage.addEventListener("touchend", function (event) {
    if (!touchTracking) return;
    touchTracking = false;
    if (!event.changedTouches.length) return;

    const deltaX = event.changedTouches[0].clientX - touchStartX;
    const deltaY = event.changedTouches[0].clientY - touchStartY;

    if (Math.abs(deltaX) < 55 || Math.abs(deltaX) < Math.abs(deltaY) * 1.2) return;

    if (deltaX < 0) {
      next();
    } else {
      previous();
    }
  }, { passive: true });

  stage.addEventListener("touchcancel", function () {
    touchTracking = false;
  }, { passive: true });

  // Fullscreen presentation mode with vendor-prefix support.
  const docEl = document.documentElement;
  const requestFS =
    docEl.requestFullscreen ||
    docEl.webkitRequestFullscreen ||
    docEl.msRequestFullscreen ||
    docEl.mozRequestFullScreen;
  const exitFS =
    document.exitFullscreen ||
    document.webkitExitFullscreen ||
    document.msExitFullscreen ||
    document.mozCancelFullScreen;

  function getFullscreenElement() {
    return (
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.msFullscreenElement ||
      document.mozFullScreenElement ||
      null
    );
  }

  function safelyCall(fn, context) {
    if (typeof fn !== "function") return;
    try {
      const result = fn.call(context);
      if (result && typeof result.catch === "function") {
        result.catch(function () {
          // Browsers may deny fullscreen; fail silently.
        });
      }
    } catch (error) {
      // Ignore unsupported or blocked fullscreen environments.
    }
  }

  function syncFullscreenUI() {
    const active = Boolean(getFullscreenElement());
    const label = active ? "إنهاء وضع العرض الكامل" : "تفعيل وضع العرض الكامل";
    fullscreenBtn.classList.toggle("is-active", active);
    fullscreenBtn.setAttribute("aria-pressed", String(active));
    fullscreenBtn.setAttribute("aria-label", label);
    fullscreenBtn.title = label;
  }

  if (typeof requestFS === "function") {
    fullscreenBtn.addEventListener("click", function () {
      if (getFullscreenElement()) {
        safelyCall(exitFS, document);
      } else {
        safelyCall(requestFS, docEl);
      }
    });

    [
      "fullscreenchange",
      "webkitfullscreenchange",
      "MSFullscreenChange",
      "mozfullscreenchange"
    ].forEach(function (eventName) {
      document.addEventListener(eventName, syncFullscreenUI);
    });

    syncFullscreenUI();
  } else {
    fullscreenBtn.hidden = true;
  }

  updateUI();
})();
