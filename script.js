const weddingDate = new Date("2027-06-27T16:30:00+08:00");
const header = document.querySelector(".site-header");
const menuToggle = document.querySelector(".menu-toggle");
const nav = document.querySelector(".site-nav");
const form = document.querySelector("#rsvp-form");
const message = document.querySelector(".form-message");

function initHeroMotion() {
  if (!window.gsap || !window.ScrollTrigger) return;

  gsap.registerPlugin(ScrollTrigger);
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) return;

  const heroTimeline = gsap.timeline({
    scrollTrigger: {
      trigger: ".hero",
      start: "top top",
      end: "bottom bottom",
      scrub: 1.1,
      invalidateOnRefresh: true
    }
  });

  heroTimeline
    .to(".hero-photo", { scale: 1, yPercent: 4, ease: "none" }, 0)
    .to(".hero-visual", { clipPath: "inset(7% 9% 9% 9%)", ease: "power2.inOut" }, 0.08)
    .to(".hero-name:first-child", { xPercent: -32, opacity: 0, ease: "power2.in" }, 0.05)
    .to(".hero-name:last-child", { xPercent: 32, opacity: 0, ease: "power2.in" }, 0.05)
    .to("#hero-title i", { scale: 0.5, opacity: 0, ease: "power2.in" }, 0.05)
    .to(".hero-kicker, .hero-vow", { y: -24, opacity: 0, ease: "power2.in" }, 0.08)
    .to(".scroll-cue", { opacity: 0, ease: "none" }, 0.1)
    .fromTo(".hero-date, .countdown, .hero-rsvp", { opacity: 0.55 }, { opacity: 1, ease: "none" }, 0.32)
    .to(".hero-veil", { opacity: 0.62, ease: "none" }, 0.2)
    .to(".hero-visual, .hero-date, .countdown, .hero-rsvp", { opacity: 0, ease: "power2.in" }, 0.82);

  const albumTrack = document.querySelector(".album-track");
  const albumPin = document.querySelector(".album-pin");

  if (albumTrack && albumPin && window.matchMedia("(min-width: 761px)").matches) {
    const albumScroll = gsap.to(albumTrack, {
      x: () => -(albumTrack.scrollWidth - window.innerWidth),
      ease: "none",
      scrollTrigger: {
        trigger: ".album-section",
        start: "top top",
        end: () => `+=${albumTrack.scrollWidth - window.innerWidth}`,
        pin: albumPin,
        scrub: 0.8,
        invalidateOnRefresh: true
      }
    });

    gsap.to(".album-progress span", {
      scaleX: 1,
      ease: "none",
      scrollTrigger: {
        trigger: ".album-section",
        start: "top top",
        end: () => `+=${albumTrack.scrollWidth - window.innerWidth}`,
        scrub: true
      }
    });

    document.querySelectorAll(".album-slide img").forEach((image) => {
      gsap.fromTo(image, { xPercent: -4 }, {
        xPercent: 4,
        ease: "none",
        scrollTrigger: {
          trigger: image.closest(".album-slide"),
          containerAnimation: albumScroll,
          start: "left right",
          end: "right left",
          scrub: true
        }
      });
    });
  }

  window.addEventListener("load", () => ScrollTrigger.refresh(), { once: true });
}

function updateHeader() {
  header.classList.toggle("scrolled", window.scrollY > 24);
}

function updateCountdown() {
  const now = new Date();
  const diff = Math.max(0, weddingDate.getTime() - now.getTime());
  const minutesTotal = Math.floor(diff / 60000);
  const days = Math.floor(minutesTotal / 1440);
  const hours = Math.floor((minutesTotal % 1440) / 60);
  const minutes = minutesTotal % 60;

  document.querySelector('[data-count="days"]').textContent = String(days).padStart(2, "0");
  document.querySelector('[data-count="hours"]').textContent = String(hours).padStart(2, "0");
  document.querySelector('[data-count="minutes"]').textContent = String(minutes).padStart(2, "0");
}

function closeMenu() {
  document.body.classList.remove("menu-open");
  header.classList.remove("open");
  menuToggle.setAttribute("aria-expanded", "false");
}

menuToggle.addEventListener("click", () => {
  const isOpen = header.classList.toggle("open");
  document.body.classList.toggle("menu-open", isOpen);
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});

nav.addEventListener("click", (event) => {
  if (event.target.matches("a")) {
    closeMenu();
  }
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const submitButton = form.querySelector("button[type='submit']");
  const payload = {
    name: data.get("name")?.toString().trim() || "",
    status: data.get("status")?.toString() || "",
    number: Number(data.get("number")),
    remarks: data.get("remarks")?.toString().trim() || ""
  };

  submitButton.disabled = true;
  submitButton.textContent = "傳送中...";
  message.textContent = "正在送出你的回覆。";

  try {
    const response = await fetch("https://n8n-1306.zeabur.app/webhook/wedding-rsvp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`RSVP request failed with status ${response.status}`);
    }

    message.textContent = payload.status === "yes"
      ? `${payload.name}，謝謝你的回覆，我們在 The Glam 等你。`
      : `${payload.name}，收到你的回覆，謝謝你的祝福。`;
    form.reset();
  } catch (error) {
    console.error("Unable to submit RSVP", error);
    message.textContent = "暫時未能送出，請稍後再試。你填寫的資料仍然保留。";
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "送出回覆";
  }
});

const revealItems = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.16 }
  );

  revealItems.forEach((item, index) => {
    item.style.transitionDelay = `${Math.min(index * 60, 240)}ms`;
    observer.observe(item);
  });
} else {
  revealItems.forEach((item) => item.classList.add("visible"));
}

window.addEventListener("scroll", updateHeader, { passive: true });
initHeroMotion();
updateHeader();
updateCountdown();
setInterval(updateCountdown, 60000);
