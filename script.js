const weddingDate = new Date("2027-06-27T16:30:00+08:00");
const header = document.querySelector(".site-header");
const menuToggle = document.querySelector(".menu-toggle");
const nav = document.querySelector(".site-nav");
const form = document.querySelector("#rsvp-form");
const message = document.querySelector(".form-message");
const calendarButton = document.querySelector("#add-calendar");

if (calendarButton) {
  const calendarEvent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Megan & Kenneth//Wedding Invitation//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    "UID:megan-kenneth-wedding-20270627@wedding",
    "DTSTAMP:20260705T000000Z",
    "DTSTART:20270627T083000Z",
    "DTEND:20270627T143000Z",
    "SUMMARY:Megan & Kenneth Wedding",
    "LOCATION:The Glam",
    "DESCRIPTION:Wedding ceremony at 4:30 PM and dinner at 7:00 PM.",
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");
  calendarButton.href = URL.createObjectURL(new Blob([calendarEvent], { type: "text/calendar;charset=utf-8" }));
}

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
      invalidateOnRefresh: true,
      onUpdate: (self) => header.classList.toggle("hero-photo-active", self.progress > 0.2 && self.progress < 0.9)
    }
  });

  heroTimeline
    .to(".hero-content", { y: -70, opacity: 0, duration: 0.22, ease: "power2.in" }, 0.02)
    .to(".scroll-cue", { opacity: 0, duration: 0.16, ease: "none" }, 0.04)
    .to(".hero-visual", {
      "--hero-inset-top": "0%",
      "--hero-inset-side": "0%",
      duration: 0.38,
      ease: "power2.inOut"
    }, 0.04)
    .to(".hero-photo", { scale: 1, yPercent: 0, duration: 0.46, ease: "none" }, 0.04)
    .to(".hero-veil", { opacity: 0.48, duration: 0.22, ease: "none" }, 0.2)
    .to(".hero-full-vow", { y: -10, opacity: 1, duration: 0.2, ease: "power2.out" }, 0.38)
    .to(".hero-date, .countdown, .hero-rsvp", { opacity: 1, duration: 0.2, ease: "power1.out" }, 0.46)
    .to(".hero-stage", { opacity: 1, duration: 0.34 }, 0.66);

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
  const hero = document.querySelector(".hero");
  const heroEnd = hero ? hero.offsetHeight - window.innerHeight * 0.25 : 24;
  header.classList.toggle("scrolled", window.scrollY > heroEnd);
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
