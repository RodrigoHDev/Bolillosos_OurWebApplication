// public/js/category.js

//---------------------------------------------------------------------
// FUNCTIONS

function updateItemHeight() {
    // Solo actualiza si no hay un giro en curso (evita desalinear una animación activa)
    if (!isSpinning) {
        ITEM_HEIGHT = reels[0].stripEl.parentElement.getBoundingClientRect().height;
    }
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ── Utilidad: mezclar un array (Fisher-Yates) ──
function shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}


// ── Paso 2: Construcción de los carretes ──
function buildReel(reel) {
    // Genera un orden mezclado propio para este carrete
    const shuffledOnce = shuffle(categories);
    reel.order = shuffledOnce;

    // Repite el set mezclado REPEATS veces para dar sensación de scroll largo
    const fullSequence = [];
    for (let r = 0; r < REPEATS; r++) {
        fullSequence.push(...shuffledOnce);
    }

    // Renderiza las imágenes dentro del strip
    reel.stripEl.innerHTML = fullSequence
        .map(cat => `<img src="${cat.image}" alt="${cat.name}" data-name="${cat.name}">`)
        .join("");

    // Guarda la secuencia completa para poder calcular offsets después
    console.log(reel.fullSequence);
    reel.fullSequence = fullSequence;
}



// ── Reset silencioso: evita que el offset crezca sin límite ──
function resetReelPosition(reel) {
    const setLength = reel.order.length;
    // "Estaciona" el carrete en la repetición 1 (misma imagen, offset bajo)
    const parkedIndex = (reel.currentIndex % setLength) + setLength;

    reel.stripEl.style.transition = "none";
    reel.stripEl.style.transform = `translateY(-${parkedIndex * ITEM_HEIGHT}px)`;

    // Fuerza al navegador a aplicar el salto ANTES de reactivar la transición
    reel.stripEl.getBoundingClientRect();
}


// ── Paso 4: Selección del resultado (elige a dónde debe "aterrizar" cada carrete) ──
// Calcula el índice de aterrizaje para UNA categoría específica ya elegida
function pickLandingIndexForCategory(reel, category) {
    const matchingIndexes = reel.fullSequence
        .map((cat, idx) => cat.name === category.name ? idx : -1)
        .filter(idx => idx !== -1);

    const setLength = reel.order.length;
    const minRepeatIndex = 3;
    const maxRepeatIndex = REPEATS - 2;
    const candidateIndexes = matchingIndexes.filter(idx => {
        const repeatNumber = Math.floor(idx / setLength);
        return repeatNumber >= minRepeatIndex && repeatNumber <= maxRepeatIndex;
    });

    const chosenIndex = candidateIndexes.length > 0
        ? candidateIndexes[Math.floor(Math.random() * candidateIndexes.length)]
        : matchingIndexes[matchingIndexes.length - 1];

    return { category, index: chosenIndex };
}

// Modo normal: elige una categoría aleatoria para ESTE carrete
function pickLandingIndex(reel) {
    const randomCategory = reel.order[Math.floor(Math.random() * reel.order.length)];
    return pickLandingIndexForCategory(reel, randomCategory);
}

// Modo forzado: los 3 carretes reciben la MISMA categoría
function forceMatchLandings() {
    const forcedCategory = categories[Math.floor(Math.random() * categories.length)];
    return reels.map(reel => pickLandingIndexForCategory(reel, forcedCategory));
}


// ── Paso 3: Motor de giro ──
function spinReel(reel, landing, delay, duration) {
    return new Promise(resolve => {
        // Offset final: alinea la imagen elegida en el centro del carrete visible
        const targetOffset = landing.index * ITEM_HEIGHT;

        setTimeout(() => {
            reel.stripEl.style.transition = `transform ${duration}ms cubic-bezier(0.15, 0.85, 0.35, 1)`;
            reel.stripEl.style.transform = `translateY(-${targetOffset}px)`;

            // Resuelve la promesa cuando termina la transición de ESTE carrete
            const onEnd = () => {
                reel.stripEl.removeEventListener("transitionend", onEnd);
                resolve(landing.category);
            };
            reel.stripEl.addEventListener("transitionend", onEnd);
        }, delay);
    });
}


async function spinAll() {
    if (isSpinning) return;
    isSpinning = true;
    lever.classList.add("pulled");
    lever.disabled = true;
    
    trapOptionButtons.forEach(btn => btn.disabled = true);

    reels.forEach(r => r.stripEl.parentElement.classList.remove("win"));

    spinCount++;
    const shouldForce = !hasMatched && spinCount >= forcedSpinTarget;

    const landings = shouldForce
        ? forceMatchLandings()
        : reels.map(reel => pickLandingIndex(reel));

    reels.forEach(reel => {
        if (reel.currentIndex !== undefined) {
            resetReelPosition(reel);
        }
    });

    const results = await Promise.all([
        spinReel(reels[0], landings[0], 0,    2200),
        spinReel(reels[1], landings[1], 300,  2600),
        spinReel(reels[2], landings[2], 600,  3000),
    ]);

    reels.forEach((reel, i) => { reel.currentIndex = landings[i].index; });

    lever.classList.remove("pulled");
    lever.disabled = false;
    
    trapOptionButtons.forEach(btn => btn.disabled = false);
    isSpinning = false;

    checkResult(results);
}


// ── Paso 5: Comparación y guardado del resultado del slot ──
function checkResult(results) {
    const allMatch = results.every(cat => cat.name === results[0].name);

    if (allMatch) {
        slotSelection = results[0];
        slotResultInput.value = slotSelection.name;
        reels.forEach(r => r.stripEl.parentElement.classList.add("win"));
        hasMatched = true; 
    }

    trapSelection = null;
    trapOptionButtons.forEach(b => b.classList.remove("selected"));

    updateFinalSelection();
}


function updateFinalSelection() {
    const finalSelection = trapSelection || slotSelection;

    if (finalSelection) {
        finalCategoryInput.value = finalSelection.name;
        continueBtn.disabled = false;

        resultImage.src = `${finalSelection.image}`;
        resultImage.alt = finalSelection.name;
        resultName.textContent = finalSelection.name;
        resultCard.classList.add("visible");

        // Solo lanza confetti si es una selección NUEVA (evita spam en cada click repetido)
        if (lastDisplayedCategory !== finalSelection.name) {
            launchConfetti(resultCard);
            lastDisplayedCategory = finalSelection.name;
        }
    } else {
        finalCategoryInput.value = "";
        continueBtn.disabled = true;
        resultCard.classList.remove("visible");
        lastDisplayedCategory = null;
    }
}


/*Confetti Animation and Mechanism*/

function launchConfetti(anchorEl) {
    const colors = ["#f87171", "#fbbf24", "#34d399", "#60a5fa", "#c084fc", "#f472b6"];
    const rect = anchorEl.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;

    for (let i = 0; i < 120; i++) {
        const piece = document.createElement("span");
        piece.className = "confetti-piece";
        piece.style.left = `${centerX + (Math.random() * 220 - 110)}px`;
        piece.style.top = `-20px`;
        piece.style.background = colors[Math.floor(Math.random() * colors.length)];
        piece.style.animationDelay = `${Math.random() * 0.25}s`;
        piece.style.setProperty("--rotate", `${Math.random() * 720 - 360}deg`);
        document.body.appendChild(piece);
        setTimeout(() => piece.remove(), 2200);
    }
}


//---------------- FUNCTIONS OF ACTIVITY SELECTION ----------------

async function openActivitiesModal(categoryName) {
    activitiesGrid.innerHTML = `<p class="activities-loading">Cargando actividades...</p>`;
    btnConfirmActivity.disabled = true;
    selectedActivity = null;
    activitiesModal.classList.add("active");

    try {
        const response = await fetch(`/date/topics?category=${encodeURIComponent(categoryName)}`);
        if (!response.ok) throw new Error("Request failed");
        const data = await response.json();
        renderActivities(data.topics);
    } catch (error) {
        activitiesGrid.innerHTML = `<p class="activities-error">No se pudieron cargar las actividades. Intenta de nuevo.</p>`;
    }
}

function renderActivities(topics) {
    if (!topics || topics.length === 0) {
        activitiesGrid.innerHTML = `<p class="activities-error">No hay actividades para esta categoría todavía.</p>`;
        return;
    }

    activitiesGrid.innerHTML = topics.map((t, i) => `
        <button type="button" class="activity-option" data-activity-id="${t.id}" data-activity-name="${t.name}">
            <span class="activity-dot">${activityIcons[i % activityIcons.length]}</span>
            <span class="activity-name">${t.name}</span>
        </button>
    `).join("");

    document.querySelectorAll(".activity-option").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".activity-option").forEach(b => b.classList.remove("selected"));
            btn.classList.add("selected");
            selectedActivity = {
                id: btn.dataset.activityId,
                name: btn.dataset.activityName
            };
            console.log(selectedActivity);
            btnConfirmActivity.disabled = false;
        });
    });
}

function closeModal() {
    activitiesModal.classList.remove("active");
}

//---------------------------------------------------------------------
//VARIABLES DECLARATION


// ── Paso 1: Setup inicial ──

let spinCount = 0;
let forcedSpinTarget = randomInt(10, 15);
let hasMatched = false;

const REPEATS = 8; // cuántas veces se repite el set completo por carrete (scroll largo)

const reels = [
    { stripEl: document.getElementById("reelStrip1"), order: [] },
    { stripEl: document.getElementById("reelStrip2"), order: [] },
    { stripEl: document.getElementById("reelStrip3"), order: [] },
];

let ITEM_HEIGHT = reels[0].stripEl.parentElement.getBoundingClientRect().height;

const slotResultInput = document.getElementById("slotResult");
const lever = document.getElementById("slotLever");

// Estado en memoria de la selección actual
let slotSelection = null; // { name, image } | null
let trapSelection = null; // { name, image } | null
let isSpinning = false;

const resultCard = document.getElementById("resultCard");
const resultImage = document.getElementById("resultImage");
const resultName = document.getElementById("resultName");
const trapToggle = document.getElementById("trapToggle");
const trapCollapse = document.getElementById("trapCollapse");

let lastDisplayedCategory = null;

const activitiesModal = document.getElementById("activitiesModal");
const activitiesGrid = document.getElementById("activitiesGrid");
const closeActivitiesModal = document.getElementById("closeActivitiesModal");
const btnConfirmActivity = document.getElementById("btnConfirmActivity");

let selectedActivity = null;

// Pequeño set de íconos para dar variedad visual, ya que la DB solo da el nombre
const activityIcons = ["✦", "♡", "☆", "✧", "❀", "◆"];


//---------------------------------------------------------------------
//REACTIONS TO EVENTS



document.addEventListener("DOMContentLoaded", () => {
    reels.forEach(buildReel);
});

lever.addEventListener("click", spinAll);

// ── Paso 6: Lógica de la trampa ──
const trapOptionButtons = document.querySelectorAll(".trap-option");

trapOptionButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        const categoryName = btn.dataset.category;
        trapSelection = categories.find(c => c.name === categoryName);

        // Marca visualmente solo la opción elegida
        trapOptionButtons.forEach(b => b.classList.remove("selected"));
        btn.classList.add("selected");

        updateFinalSelection();
    });
});

// ── Paso 7: Combinar slot + trampa, habilitar Continuar ──
const continueBtn = document.getElementById("btnContinue");
const finalCategoryInput = document.getElementById("finalCategory");


continueBtn.addEventListener("click", () => {
    if (continueBtn.disabled) return;
    openActivitiesModal(finalCategoryInput.value);
});

window.addEventListener("resize", updateItemHeight);

trapToggle.addEventListener("click", () => {
    const isOpen = trapCollapse.classList.toggle("open");
    trapToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
});


closeActivitiesModal.addEventListener("click", closeModal);

// Click fuera del modal-window (en el fondo oscuro) también cierra
activitiesModal.addEventListener("click", (e) => {
    if (e.target === activitiesModal) closeModal();
});

btnConfirmActivity.addEventListener("click", () => {
    if (btnConfirmActivity.disabled) return;
    const category = finalCategoryInput.value;
    window.location.href = `/date/date?category=${encodeURIComponent(category)}&activity=${encodeURIComponent(selectedActivity.id)}`;
});