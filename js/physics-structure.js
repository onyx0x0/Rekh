const coursesData = [
    {
        id: 0,
        title: "Classical Mechanics",
        subtitle: "The Foundation of Motion",
        difficulty: "MEDIUM",
        progress: 75,
        lectures: [
            { id: "m1-01", title: "Kinematics", desc: "Analysis of position, velocity, and acceleration vectors in 3D space.", time: "45m" },
            { id: "m1-02", title: "Newton's Laws", desc: "The three fundamental laws governing force and motion.", time: "60m" },
            { id: "m1-03", title: "Work & Energy", desc: "Conservation of energy principles and mechanical work calculations.", time: "50m" },
            { id: "m1-04", title: "Momentum", desc: "Impulse, linear momentum, and collision dynamics.", time: "55m" },
            { id: "m1-05", title: "Rotational Motion", desc: "Angular velocity, torque, and moment of inertia.", time: "55m" },
            { id: "m1-06", title: "Equilibrium", desc: "Static equilibrium and center of mass calculations.", time: "40m" },
            { id: "m1-07", title: "Oscillations", desc: "Simple harmonic motion, springs, and pendulums.", time: "45m" },
            { id: "m1-08", title: "Gravitation", desc: "Newtonian gravity, orbits, and satellite motion.", time: "60m" },
            { id: "m1-09", title: "Non-Inertial Frames", desc: "Fictitious forces and rotating reference frames.", time: "50m" },
            { id: "m1-10", title: "Rigid Body Dynamics", desc: "Rolling motion and energy in extended bodies.", time: "55m" }
        ]
    },
    {
        id: 1,
        title: "Electromagnetism",
        subtitle: "Fields and Forces",
        difficulty: "HARD",
        progress: 40,
        lectures: [
            { id: "m2-01", title: "Electrostatics", desc: "Electric charges, Coulomb's Law, and field lines.", time: "50m" },
            { id: "m2-02", title: "Gauss's Law", desc: "Flux calculations and symmetry applications.", time: "65m" },
            { id: "m2-03", title: "Magnetic Fields", desc: "The Biot-Savart Law and Ampere's Law.", time: "60m" },
            { id: "m2-04", title: "Induction", desc: "Faraday's Law and Lenz's Law in circuit loops.", time: "55m" },
            { id: "m2-05", title: "Maxwell Eq.", desc: "The unification of electric and magnetic theories.", time: "80m" },
            { id: "m2-06", title: "Circuits I", desc: "DC circuits, resistors, and Kirchhoff's rules.", time: "40m" },
            { id: "m2-07", title: "Capacitance", desc: "Energy storage and dielectrics in capacitors.", time: "45m" },
            { id: "m2-08", title: "Inductance", desc: "Magnetic energy and coupled inductors.", time: "45m" },
            { id: "m2-09", title: "AC Circuits", desc: "Reactance, impedance, and resonance.", time: "55m" },
            { id: "m2-10", title: "Waves & Transmission", desc: "EM wave propagation and Poynting vector.", time: "60m" }
        ]
    },
    {
        id: 2,
        title: "Thermodynamics",
        subtitle: "Heat and Statistics",
        difficulty: "MEDIUM",
        progress: 10,
        lectures: [
            { id: "m3-01", title: "Ideal Gases", desc: "Equation of state and kinetic molecular theory.", time: "40m" },
            { id: "m3-02", title: "1st Law", desc: "Internal energy, heat transfer, and work done.", time: "50m" },
            { id: "m3-03", title: "Entropy", desc: "Understanding disorder and the Second Law.", time: "70m" }
        ]
    },
    {
        id: 3,
        title: "Quantum Physics I",
        subtitle: "Wave-Particle Duality",
        difficulty: "EXTREME",
        progress: 0,
        lectures: [
            { id: "m4-01", title: "Blackbody Rad.", desc: "The ultraviolet catastrophe and Planck's constant.", time: "45m" },
            { id: "m4-02", title: "Photoelectric", desc: "Einstein's explanation of light quanta.", time: "40m" },
            { id: "m4-03", title: "Schrodinger Eq.", desc: "Wavefunctions and probability density.", time: "90m" },
            { id: "m4-04", title: "Particle in Box", desc: "Infinite potential wells and energy quantization.", time: "60m" }
        ]
    },
    {
        id: 4,
        title: "Special Relativity",
        subtitle: "Spacetime Geometry",
        difficulty: "HARD",
        progress: 20,
        lectures: [
            { id: "m5-01", title: "Postulates", desc: "The speed of light and inertial frames.", time: "30m" },
            { id: "m5-02", title: "Time Dilation", desc: "Moving clocks run slower: The Twin Paradox.", time: "50m" },
            { id: "m5-03", title: "Length Contract.", desc: "Lorentz transformations and physical length.", time: "45m" }
        ]
    },
    {
        id: 5,
        title: "Fluid Dynamics",
        subtitle: "Flow and Pressure",
        difficulty: "MEDIUM",
        progress: 0,
        lectures: [
            { id: "m6-01", title: "Hydrostatics", desc: "Pressure in static fluids and Pascal's Principle.", time: "40m" },
            { id: "m6-02", title: "Bernoulli", desc: "Conservation of energy in flowing fluids.", time: "55m" }
        ]
    },
    {
        id: 6,
        title: "Optics",
        subtitle: "Light and Lenses",
        difficulty: "EASY",
        progress: 90,
        lectures: [
            { id: "m7-01", title: "Reflection", desc: "Mirrors and the law of reflection.", time: "35m" },
            { id: "m7-02", title: "Refraction", desc: "Snell's Law and total internal reflection.", time: "45m" },
            { id: "m7-03", title: "Lenses", desc: "Thin lens equation and image formation.", time: "50m" }
        ]
    },
    {
        id: 7,
        title: "Nuclear Physics",
        subtitle: "The Core of Matter",
        difficulty: "HARD",
        progress: 0,
        lectures: [
            { id: "m8-01", title: "Binding Energy", desc: "Mass defect and stability of the nucleus.", time: "50m" },
            { id: "m8-02", title: "Radioactivity", desc: "Alpha, Beta, and Gamma decay modes.", time: "60m" }
        ]
    },
    {
        id: 8,
        title: "Astrophysics",
        subtitle: "Stellar Dynamics",
        difficulty: "MEDIUM",
        progress: 5,
        lectures: [
            { id: "m9-01", title: "Stellar Evolution", desc: "From protostars to supernovae.", time: "70m" },
            { id: "m9-02", title: "Black Holes", desc: "Event horizons and singularities.", time: "65m" }
        ]
    },
    {
        id: 9,
        title: "Particle Physics",
        subtitle: "Standard Model",
        difficulty: "EXTREME",
        progress: 0,
        lectures: [
            { id: "m10-01", title: "Quarks & Leptons", desc: "Fundamental building blocks of matter.", time: "80m" },
            { id: "m10-02", title: "Bosons", desc: "Force carriers and the Higgs mechanism.", time: "75m" }
        ]
    }
];

let activeIndex = 0;
const MODULE_MODAL_ANIMATION_MS = 300;
let moduleModalRefs = null;
let moduleModalCloseTimer = null;
let moduleModalAction = null;

function ensureModuleModal() {
    if (moduleModalRefs) return moduleModalRefs;

    const overlay = document.createElement("div");
    overlay.className = "module-modal-overlay";
    overlay.setAttribute("aria-hidden", "true");

    overlay.innerHTML = `
        <div class="module-modal-card">
            <button class="module-modal-close" aria-label="Close module">&times;</button>
            <div class="module-modal-content">
                <div class="module-modal-media" aria-hidden="true">
                    <div class="module-media-placeholder"></div>
                </div>
                <div class="module-modal-info">
                    <div class="module-modal-difficulty">MEDIUM</div>
                    <div class="module-modal-title">Module Title</div>
                    <div class="module-modal-description">Module description placeholder.</div>
                    <div class="module-modal-actions">
                        <button type="button" class="module-initiate-btn">INITIATE</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    const card = overlay.querySelector(".module-modal-card");
    const closeButton = overlay.querySelector(".module-modal-close");
    const difficultyEl = overlay.querySelector(".module-modal-difficulty");
    const titleEl = overlay.querySelector(".module-modal-title");
    const descriptionEl = overlay.querySelector(".module-modal-description");
    const initiateBtn = overlay.querySelector(".module-initiate-btn");

    card.setAttribute("role", "dialog");
    card.setAttribute("aria-modal", "true");
    card.setAttribute("aria-label", "Module details");

    const closeModal = () => closeModuleModal();

    closeButton.addEventListener("click", closeModal);
    overlay.addEventListener("click", (event) => {
        if (event.target === overlay) {
            closeModal();
        }
    });

    const escHandler = (event) => {
        if (event.key === "Escape" && overlay.classList.contains("visible")) {
            closeModal();
        }
    };
    document.addEventListener("keydown", escHandler);

    initiateBtn.addEventListener("click", () => {
        if (typeof moduleModalAction === "function") {
            moduleModalAction();
        } else {
            closeModal();
        }
    });

    moduleModalRefs = { overlay, card, difficultyEl, titleEl, descriptionEl, initiateBtn };
    return moduleModalRefs;
}

function openModuleModal(course, lecture) {
    const modal = ensureModuleModal();

    if (moduleModalCloseTimer) {
        clearTimeout(moduleModalCloseTimer);
        moduleModalCloseTimer = null;
    }

    modal.difficultyEl.textContent = course.difficulty;
    modal.titleEl.textContent = lecture.title;
    modal.descriptionEl.textContent = lecture.desc;

  moduleModalAction = () => {
    const isKinematics =
      course.title === "Classical Mechanics" && lecture.title === "Kinematics";
    if (isKinematics) {
      closeModuleModal();
      // Prefer inline lecture view if available (home page SPA flow)
      if (typeof window.openInlineLecture === "function") {
        window.openInlineLecture({
          subject: "physics",
          topic: "kinematics",
          lecture: "1",
        });
      } else {
        window.location.href = "lecture.html?subject=physics&topic=kinematics&lecture=1";
      }
    } else {
      closeModuleModal();
    }
  };

    modal.overlay.classList.remove("closing");
    modal.overlay.classList.add("visible");
    modal.overlay.setAttribute("aria-hidden", "false");
}

function closeModuleModal() {
    if (!moduleModalRefs || !moduleModalRefs.overlay.classList.contains("visible")) return;

    const { overlay } = moduleModalRefs;
    overlay.classList.add("closing");
    overlay.setAttribute("aria-hidden", "true");
    moduleModalAction = null;

    if (moduleModalCloseTimer) {
        clearTimeout(moduleModalCloseTimer);
    }

    moduleModalCloseTimer = setTimeout(() => {
        overlay.classList.remove("visible", "closing");
        moduleModalCloseTimer = null;
    }, MODULE_MODAL_ANIMATION_MS);
}

function buildCourseRail(cardContainer) {
    cardContainer.innerHTML = "";

    const rail = document.createElement("div");
    rail.className = "course-rail";

    const deckWindow = document.createElement("div");
    deckWindow.className = "deck-window";

    const deck = document.createElement("div");
    deck.className = "course-deck";
    deckWindow.appendChild(deck);

    rail.append(deckWindow);
    cardContainer.appendChild(rail);

    return { deck, deckWindow };
}

function renderCourseCards(deck, deckWindow, lectureTrack) {
    deck.innerHTML = "";

    coursesData.forEach((course, index) => {
        const card = document.createElement("article");
        card.className = "course-card";
        card.dataset.index = index;

        card.innerHTML = `
            <div class="card-chip">MISSION ${String(index + 1).padStart(2, "0")}</div>
            <div class="card-heading">${course.title}</div>
            <div class="card-sub">${course.subtitle}</div>
            <div class="card-visual" aria-hidden="true"></div>
        `;

        card.addEventListener("click", () => {
            setActiveCourse(index, deck, deckWindow, lectureTrack);
        });

        deck.appendChild(card);
    });

    requestAnimationFrame(() => layoutDeck(deck, deckWindow));
}

function layoutDeck(deck, deckWindow) {
    const cards = Array.from(deck.querySelectorAll(".course-card"));
    if (!cards.length) return;

    const cardRect = cards[0].getBoundingClientRect();
    const step = Math.max(90, Math.min(cardRect.width * 0.55, 150));
    deck.style.transform = "none";

    cards.forEach((card, i) => {
        const delta = i - activeIndex;
        const absDelta = Math.abs(delta);
        const baseX = delta * step;
        const scale = Math.max(0.78, 1 - absDelta * 0.07);
        const yShift = absDelta * 0;
        const tilt = Math.max(-22, Math.min(22, -delta * 10)); // tilt toward center
        const spread = Math.max(-6, Math.min(6, delta * 0));
        const depth = Math.max(0, 40 - absDelta * 10);
        const depthFade = 1;

        card.classList.toggle("active", i === activeIndex);
        const pose = `translateX(calc(-50% + ${baseX}px)) translateY(${yShift}px) translateZ(${depth}px) scale(${scale}) rotateY(${tilt}deg) rotateZ(${spread}deg)`;
        card.style.setProperty("--pose", pose);
        card.style.transform = "var(--pose)";
        card.style.opacity = depthFade;
        card.style.zIndex = String(200 - absDelta * 5);
        card.style.pointerEvents = "auto";
    });
}

function setActiveCourse(index, deck, deckWindow, lectureTrack, refreshLectures = true) {
    if (index === activeIndex && refreshLectures) {
        return;
    }
    const total = coursesData.length;
    activeIndex = ((index % total) + total) % total;

    layoutDeck(deck, deckWindow);

    if (lectureTrack && refreshLectures) {
        lectureTrack.style.opacity = "0";
        setTimeout(() => {
            renderLectures(activeIndex, lectureTrack);
            lectureTrack.style.opacity = "1";
        }, 200);
    }
}

function stepCourse(direction, deck, deckWindow, lectureTrack) {
    setActiveCourse(activeIndex + direction, deck, deckWindow, lectureTrack);
}

function renderLectures(courseIndex, lectureTrack) {
    lectureTrack.innerHTML = "";
    const course = coursesData[courseIndex];
    if (!course) return;
    const lectures = course.lectures;

    lectures.forEach((lec, i) => {
        const node = document.createElement("div");
        node.className = "tech-module";
        node.style.animationDelay = `${i * 0.05}s`;

        node.innerHTML = `
            <div class="module-corner"></div>
            <div class="module-header">
                <span class="module-id">SEQ_0${i + 1}</span>
                <div class="status-dot"></div>
            </div>
            <div class="module-content">
                <span class="module-code">${lec.id}</span>
                <div class="module-title">${lec.title}</div>
            </div>
            <div class="module-footer">
                <span class="module-time">${lec.time}</span>
                <span class="module-action">LOAD ></span>
            </div>
        `;

        node.addEventListener("click", () => openModuleModal(course, lec));

        lectureTrack.appendChild(node);
        void node.offsetWidth;
        node.classList.add("visible");
    });
}

function initPhysicsStructure(scope = document) {
    const rootMarker = scope.querySelector("[data-physics-init]");
    if (rootMarker) return;

    const cardContainer = scope.querySelector("#card-container");
    const lectureTrack = scope.querySelector("#lecture-track");

    if (!cardContainer || !lectureTrack) return;

    const marker = document.createElement("div");
    marker.setAttribute("data-physics-init", "1");
    marker.style.display = "none";
    cardContainer.appendChild(marker);

    ensureModuleModal();

    const { deck, deckWindow } = buildCourseRail(cardContainer);
    activeIndex = 0;
    renderCourseCards(deck, deckWindow, lectureTrack);
    renderLectures(activeIndex, lectureTrack);
    setActiveCourse(activeIndex, deck, deckWindow, lectureTrack, false);

    let wheelLocked = false;
    deckWindow?.addEventListener(
        "wheel",
        (e) => {
            if (wheelLocked) return;
            const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
            if (delta === 0) return;
            wheelLocked = true;
            if (delta > 0) {
                setActiveCourse(activeIndex + 1, deck, deckWindow, lectureTrack);
            } else {
                setActiveCourse(activeIndex - 1, deck, deckWindow, lectureTrack);
            }
            setTimeout(() => {
                wheelLocked = false;
            }, 250);
            e.preventDefault();
        },
        { passive: false }
    );

    window.addEventListener("resize", () => layoutDeck(deck, deckWindow));
}

window.initPhysicsStructure = initPhysicsStructure;

document.addEventListener("DOMContentLoaded", () => {
    initPhysicsStructure(document);
});
