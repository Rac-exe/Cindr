// ── Scroll-reveal ────────────────────────────────────────────────────────────

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
      }
    });
  },
  { threshold: 0.15 }
);

document.querySelectorAll("[data-animate]").forEach((el) => observer.observe(el));

// ── Demo card swipe animation ─────────────────────────────────────────────────

const card = document.getElementById("demo-card");
const stampLike = document.getElementById("stamp-like");
const stampSkip = document.getElementById("stamp-skip");
const stampTrailer = document.getElementById("stamp-trailer");
const btnLike = document.getElementById("btn-like");
const btnSkip = document.getElementById("btn-skip");
const btnTrailer = document.getElementById("btn-trailer");

if (card) {
  const phases = [
    { label: "like", dx: 120, dy: 0, rotation: 15 },
    { label: "skip", dx: -120, dy: 0, rotation: -15 },
    { label: "trailer", dx: 0, dy: -100, rotation: 0 },
  ];

  let phase = 0;
  let animating = false;

  function resetCard() {
    card.style.transition = "none";
    card.style.transform = "translate(0,0) rotate(0deg)";
    stampLike.style.opacity = "0";
    stampSkip.style.opacity = "0";
    stampTrailer.style.opacity = "0";
    btnLike.style.transform = "";
    btnSkip.style.transform = "";
    btnTrailer.style.transform = "";
    btnLike.style.boxShadow = "";
    btnSkip.style.boxShadow = "";
    btnTrailer.style.boxShadow = "";
  }

  function animatePhase() {
    if (animating) return;
    animating = true;

    const p = phases[phase % phases.length];

    // Drag out
    card.style.transition = "transform 0.6s cubic-bezier(0.16,1,0.3,1)";
    card.style.transform = `translate(${p.dx}px, ${p.dy}px) rotate(${p.rotation}deg)`;

    if (p.label === "like") {
      stampLike.style.opacity = "1";
      btnLike.style.transform = "scale(1.25)";
      btnLike.style.boxShadow = "0 0 24px rgba(34,197,94,0.6)";
    } else if (p.label === "skip") {
      stampSkip.style.opacity = "1";
      btnSkip.style.transform = "scale(1.25)";
      btnSkip.style.boxShadow = "0 0 24px rgba(239,68,68,0.6)";
    } else {
      stampTrailer.style.opacity = "1";
      btnTrailer.style.transform = "scale(1.15)";
      btnTrailer.style.boxShadow = "0 0 20px rgba(216,90,48,0.6)";
    }

    setTimeout(() => {
      resetCard();
      phase++;
      animating = false;
    }, 1400);
  }

  // Auto-play loop
  setInterval(animatePhase, 2400);

  // Manual trigger on button click
  btnLike.addEventListener("click", () => {
    phase = 0; animatePhase();
  });
  btnSkip.addEventListener("click", () => {
    phase = 1; animatePhase();
  });
  btnTrailer.addEventListener("click", () => {
    phase = 2; animatePhase();
  });
}

// ── Nav scroll shadow ─────────────────────────────────────────────────────────

const nav = document.getElementById("nav");
window.addEventListener("scroll", () => {
  if (window.scrollY > 20) {
    nav.style.background = "rgba(10,10,10,0.95)";
    nav.style.borderBottomColor = "rgba(255,255,255,0.1)";
  } else {
    nav.style.background = "rgba(10,10,10,0.8)";
    nav.style.borderBottomColor = "rgba(255,255,255,0.08)";
  }
});
