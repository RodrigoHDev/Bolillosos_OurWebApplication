/*
Title: category.js
Author: R. Hurtado
Date: 07/07/2026
Description:
Behavior of the category page of the Dates module. (Step 2)
- Slot machine to pick a category.
- Trap list to pick a category directly.
- Activities modal (AJAX to /dates/activities).
- New category modal (AJAX multipart to POST /dates/category).
- New activity modal (AJAX to POST /dates/activities).

Slot machine mechanism (works for any number of categories):
1. The result of a spin (win or not, and which category each reel shows) is
   planned BEFORE the reels move, so the odds never depend on the total of
   categories.
2. A win is guaranteed after a random number of spins (FORCED_SPINS_MIN..MAX)
   and can also happen earlier with NATURAL_WIN_CHANCE.
3. Every new win is a different category than the previous win. After each
   win the counter and the guaranteed spin are recalculated.
4. The strip length and the travel distance of each reel adapt to the total
   of categories.
*/

//---------------------------------------------------------------------
// FUNCTIONS

/*measureItemHeight
Height of a single image inside a reel (the reel window shows one image)*/
function measureItemHeight() {
    return reels[0].stripEl.parentElement.getBoundingClientRect().height;
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom(array) {
    return array[Math.floor(Math.random() * array.length)];
}

/*escapeHtml
Escapes a text before placing it inside innerHTML (names are created by users)*/
function escapeHtml(text) {
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
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

/*calculateRepeats
Cuántas veces se repite el set de categorías en cada carrete.
Debe alcanzar para: posición estacionada (repetición 1, índice < 2N) +
MIN_TRAVEL_ITEMS + hasta N-1 imágenes para encontrar la categoría destino.*/
function calculateRepeats(total) {
    return Math.ceil(MIN_TRAVEL_ITEMS / total) + 3;
}

function buildReel(reel) {
    // Genera un orden mezclado propio para este carrete
    const shuffledOnce = shuffle(categories);
    reel.order = shuffledOnce;

    // Repite el set mezclado para dar sensación de scroll largo
    const fullSequence = [];
    for (let r = 0; r < REPEATS; r++) {
        fullSequence.push(...shuffledOnce);
    }

    // Renderiza las imágenes dentro del strip
    const fragment = document.createDocumentFragment();
    fullSequence.forEach(cat => {
        const img = document.createElement("img");
        img.src = cat.image;
        img.alt = cat.name;
        img.dataset.name = cat.name;
        fragment.appendChild(img);
    });
    reel.stripEl.replaceChildren(fragment);

    // Guarda la secuencia completa para poder calcular offsets después
    reel.fullSequence = fullSequence;
    reel.currentIndex = 0;
}


// ── Posicionamiento de los carretes ──

/*setReelPosition
Coloca el carrete en un índice sin animación*/
function setReelPosition(reel, index) {
    reel.currentIndex = index;
    reel.stripEl.style.transition = "none";
    reel.stripEl.style.transform = `translateY(-${index * ITEM_HEIGHT}px)`;
}

/*resetReelPosition
Reset silencioso: "estaciona" el carrete en la repetición 1 mostrando la
misma imagen, para que el offset no crezca sin límite entre giros*/
function resetReelPosition(reel) {
    const setLength = reel.order.length;
    setReelPosition(reel, (reel.currentIndex % setLength) + setLength);

    // Fuerza al navegador a aplicar el salto ANTES de reactivar la transición
    reel.stripEl.getBoundingClientRect();
}

/*updateItemHeight
Recalcula el alto de imagen (resize) y realinea los carretes*/
function updateItemHeight() {
    // Solo actualiza si no hay un giro en curso (evita desalinear una animación activa)
    if (isSpinning || categories.length === 0) return;
    ITEM_HEIGHT = measureItemHeight();
    reels.forEach(reel => setReelPosition(reel, reel.currentIndex));
}


// ── Paso 3: Planeación del resultado (antes de girar) ──

/*isWinningSpin
Decide si este giro será una solución. No depende del total de categorías:
- Con una sola categoría todo giro coincide.
- Al llegar al giro garantizado se fuerza la solución.
- Antes de eso existe una probabilidad fija de solución natural.*/
function isWinningSpin() {
    if (categories.length === 1) return true;
    if (spinsSinceLastWin >= forcedSpinTarget) return true;
    return Math.random() < NATURAL_WIN_CHANCE;
}

/*getWinnerCandidates
Una nueva solución nunca repite la anterior (si existe otra categoría)*/
function getWinnerCandidates() {
    if (!lastSlotWinner) return categories;
    const others = categories.filter(cat => cat.name !== lastSlotWinner.name);
    return others.length > 0 ? others : categories;
}

/*planLosingSpin
Cada carrete muestra una categoría al azar, garantizando que NO coincidan
los tres (si coincidieran contaría como solución sin haberlo decidido)*/
function planLosingSpin() {
    const picks = reels.map(() => pickRandom(categories));
    const allEqual = picks.every(cat => cat.name === picks[0].name);

    if (allEqual) {
        const others = categories.filter(cat => cat.name !== picks[0].name);
        picks[picks.length - 1] = pickRandom(others);
    }
    return picks;
}

/*planSpin
Devuelve la categoría en la que aterrizará cada carrete*/
function planSpin() {
    if (isWinningSpin()) {
        const winner = pickRandom(getWinnerCandidates());
        return reels.map(() => winner);
    }
    return planLosingSpin();
}

/*pickLandingIndex
Primer índice del strip, a partir de MIN_TRAVEL_ITEMS imágenes de la posición
actual, que contiene la categoría destino. Como cada categoría aparece una vez
por set, el recorrido es siempre MIN_TRAVEL_ITEMS .. MIN_TRAVEL_ITEMS + N - 1*/
function pickLandingIndex(reel, category) {
    let index = reel.currentIndex + MIN_TRAVEL_ITEMS;
    while (reel.fullSequence[index].name !== category.name) {
        index++;
    }
    return { category, index };
}


// ── Paso 4: Motor de giro ──
function spinReel(reel, landing, delay, duration) {
    return new Promise(resolve => {
        // Offset final: alinea la imagen elegida en el centro del carrete visible
        const targetOffset = landing.index * ITEM_HEIGHT;

        setTimeout(() => {
            let finished = false;

            const finish = () => {
                if (finished) return;
                finished = true;
                clearTimeout(fallbackTimer);
                reel.stripEl.removeEventListener("transitionend", onEnd);
                resolve(landing.category);
            };

            // Resuelve la promesa cuando termina la transición de ESTE carrete
            const onEnd = (event) => {
                if (event.target === reel.stripEl && event.propertyName === "transform") finish();
            };

            // Respaldo: si el navegador no emite transitionend (pestaña oculta,
            // animaciones desactivadas) el giro no se queda bloqueado
            const fallbackTimer = setTimeout(finish, duration + 250);

            reel.stripEl.addEventListener("transitionend", onEnd);
            reel.stripEl.style.transition = `transform ${duration}ms cubic-bezier(0.15, 0.85, 0.35, 1)`;
            reel.stripEl.style.transform = `translateY(-${targetOffset}px)`;
        }, delay);
    });
}


async function spinAll() {
    if (isSpinning || categories.length === 0) return;
    isSpinning = true;
    lever.classList.add("pulled");
    lever.disabled = true;

    trapOptionButtons.forEach(btn => btn.disabled = true);

    reels.forEach(r => r.stripEl.parentElement.classList.remove("win"));

    ITEM_HEIGHT = measureItemHeight();
    spinsSinceLastWin++;

    const plannedCategories = planSpin();

    // Primero se estacionan los carretes: el aterrizaje se calcula desde ahí
    reels.forEach(resetReelPosition);
    const landings = reels.map((reel, i) => pickLandingIndex(reel, plannedCategories[i]));

    const results = await Promise.all(
        reels.map((reel, i) => spinReel(reel, landings[i], SPIN_TIMINGS[i].delay, SPIN_TIMINGS[i].duration))
    );

    reels.forEach((reel, i) => { reel.currentIndex = landings[i].index; });

    lever.classList.remove("pulled");
    lever.disabled = false;

    trapOptionButtons.forEach(btn => btn.disabled = false);
    isSpinning = false;

    // Si la ventana cambió de tamaño durante el giro, realinea
    updateItemHeight();

    checkResult(results);
}


// ── Paso 5: Comparación y guardado del resultado del slot ──
function checkResult(results) {
    const allMatch = results.every(cat => cat.name === results[0].name);

    if (allMatch) {
        slotSelection = results[0];
        slotResultInput.value = slotSelection.name;
        reels.forEach(r => r.stripEl.parentElement.classList.add("win"));

        // Nueva solución: se recalcula el siguiente giro garantizado y se
        // guarda la ganadora para que la próxima solución sea distinta
        lastSlotWinner = slotSelection;
        spinsSinceLastWin = 0;
        forcedSpinTarget = randomInt(FORCED_SPINS_MIN, FORCED_SPINS_MAX);
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
    // Categoría del modal (su UUID se usa para crear nuevas actividades)
    activitiesCategory = categories.find(c => c.name === categoryName) || null;

    activitiesGrid.innerHTML = `<p class="activities-loading">Cargando actividades...</p>`;
    btnConfirmActivity.disabled = true;
    selectedActivity = null;
    activitiesModal.classList.add("active");

    try {
        const response = await fetch(`/dates/activities?category=${encodeURIComponent(categoryName)}`);
        if (!response.ok) throw new Error("Request failed");
        const data = await response.json();
        renderActivities(data.activities);
    } catch (error) {
        activitiesGrid.innerHTML = `<p class="activities-error">No se pudieron cargar las actividades. Intenta de nuevo.</p>`;
    }
}

function renderActivities(activities) {
    // Botón para añadir una actividad: siempre al final (también sin actividades)
    const newActivityButton = `
        <button type="button" class="activity-option activity-option--new" id="btnNewActivity">
            <span class="activity-dot">+</span>
            <span class="activity-name">Añadir nueva actividad</span>
        </button>
    `;

    if (!activities || activities.length === 0) {
        activitiesGrid.innerHTML = `<p class="activities-error">No hay actividades para esta categoría todavía.</p>` + newActivityButton;
    } else {
        activitiesGrid.innerHTML = activities.map((a, i) => `
            <button type="button" class="activity-option" data-activity-id="${escapeHtml(a.id)}" data-activity-name="${escapeHtml(a.name)}">
                <span class="activity-dot">${activityIcons[i % activityIcons.length]}</span>
                <span class="activity-name">${escapeHtml(a.name)}</span>
            </button>
        `).join("") + newActivityButton;
    }

    document.getElementById("btnNewActivity").addEventListener("click", openNewActivityModal);

    const activityButtons = document.querySelectorAll(".activity-option[data-activity-id]");

    activityButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            activityButtons.forEach(b => b.classList.remove("selected"));
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


//---------------- FUNCTIONS OF NEW CATEGORY / NEW ACTIVITY ----------------

/*showModalError
Shows (or hides with an empty text) the message under the title of a modal*/
function showModalError(errorEl, message) {
    errorEl.textContent = message || "";
    errorEl.hidden = !message;
}

/*readJsonResponse
Reads the JSON answer of the server. If the session or the form expired the
server answers with a redirect (HTML), so an empty object is returned*/
async function readJsonResponse(response) {
    try {
        return await response.json();
    } catch (error) {
        return {};
    }
}

function openNewCategoryModal() {
    newCategoryForm.reset();
    showModalError(newCategoryError, "");
    newCategoryModal.classList.add("active");
    newCategoryName.focus();
}

function closeNewCategoryModal() {
    newCategoryModal.classList.remove("active");
}

/*createCategory
Sends the name and the image. multer reads the multipart body AFTER csurf,
so the token travels in the CSRF-Token header*/
async function createCategory(event) {
    event.preventDefault();

    if (!newCategoryName.value.trim()) {
        return showModalError(newCategoryError, "El nombre es requerido.");
    }
    if (newCategoryImage.files.length === 0) {
        return showModalError(newCategoryError, "La imagen es requerida.");
    }

    showModalError(newCategoryError, "");
    btnCreateCategory.disabled = true;
    btnCreateCategory.textContent = "Creando...";

    try {
        const response = await fetch(newCategoryForm.action, {
            method: "POST",
            headers: { "CSRF-Token": newCategoryForm.querySelector('[name="_csrf"]').value },
            body: new FormData(newCategoryForm)
        });
        const data = await readJsonResponse(response);

        if (!response.ok || !data.success) {
            throw new Error(data.error || "No se pudo crear la categoría. Recarga la página e intenta de nuevo.");
        }

        // Recarga: la nueva categoría entra a la ruleta y a la trampa, y el
        // aviso "Nueva Categoria: {nombre} creada!" se muestra como toast
        closeNewCategoryModal();
        window.location.reload();

    } catch (error) {
        showModalError(newCategoryError, error.message);
        btnCreateCategory.disabled = false;
        btnCreateCategory.textContent = "Crear";
    }
}

function openNewActivityModal() {
    if (!activitiesCategory) return;

    // Se cierra el modal de actividades y se abre el de nueva actividad
    closeModal();

    newActivityForm.reset();
    newActivityCategory.value = activitiesCategory.name;
    newActivityCategoryId.value = activitiesCategory.id;
    showModalError(newActivityError, "");
    newActivityModal.classList.add("active");
    newActivityName.focus();
}

function closeNewActivityModal() {
    newActivityModal.classList.remove("active");
}

/*createActivity
Sends the activity text and the UUID of the category. When created, the
activities modal is opened again showing the new activity*/
async function createActivity(event) {
    event.preventDefault();

    if (!newActivityName.value.trim()) {
        return showModalError(newActivityError, "La actividad es requerida.");
    }

    showModalError(newActivityError, "");
    btnCreateActivity.disabled = true;
    btnCreateActivity.textContent = "Creando...";

    const payload = {
        _csrf: newActivityForm.querySelector('[name="_csrf"]').value,
        name: newActivityName.value,
        categoryId: newActivityCategoryId.value
    };

    try {
        const response = await fetch(newActivityForm.action, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const data = await readJsonResponse(response);

        if (!response.ok || !data.success) {
            throw new Error(data.error || "No se pudo crear la actividad. Recarga la página e intenta de nuevo.");
        }

        closeNewActivityModal();
        openActivitiesModal(activitiesCategory.name);

    } catch (error) {
        showModalError(newActivityError, error.message);
    } finally {
        btnCreateActivity.disabled = false;
        btnCreateActivity.textContent = "Crear";
    }
}

//---------------------------------------------------------------------
//VARIABLES DECLARATION


// ── Paso 1: Setup inicial ──

// Ajustes del mecanismo (independientes del total de categorías)
const FORCED_SPINS_MIN = 10;       // giro mínimo en el que se garantiza una solución
const FORCED_SPINS_MAX = 15;       // giro máximo en el que se garantiza una solución
const NATURAL_WIN_CHANCE = 0.05;   // probabilidad de solución antes del giro garantizado
const MIN_TRAVEL_ITEMS = 40;       // imágenes mínimas que recorre cada carrete por giro

// Retraso y duración de cada carrete (efecto cascada)
const SPIN_TIMINGS = [
    { delay: 0,   duration: 2200 },
    { delay: 300, duration: 2600 },
    { delay: 600, duration: 3000 },
];

// Cuántas veces se repite el set completo por carrete, según el total de categorías
const REPEATS = categories.length > 0 ? calculateRepeats(categories.length) : 0;

let spinsSinceLastWin = 0;
let forcedSpinTarget = randomInt(FORCED_SPINS_MIN, FORCED_SPINS_MAX);
let lastSlotWinner = null; // { name, image } | null

const reels = [
    { stripEl: document.getElementById("reelStrip1"), order: [], fullSequence: [], currentIndex: 0 },
    { stripEl: document.getElementById("reelStrip2"), order: [], fullSequence: [], currentIndex: 0 },
    { stripEl: document.getElementById("reelStrip3"), order: [], fullSequence: [], currentIndex: 0 },
];

let ITEM_HEIGHT = measureItemHeight();

const slotResultInput = document.getElementById("slotResult");
const lever = document.getElementById("slotLever");
const leverMobile = document.querySelector(".slot-lever-mobile");
const leverLabel = document.querySelector(".lever-label");

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
let activitiesCategory = null; // { id, name, image } | null

const newCategoryModal = document.getElementById("newCategoryModal");
const newCategoryForm = document.getElementById("newCategoryForm");
const newCategoryName = document.getElementById("newCategoryName");
const newCategoryImage = document.getElementById("newCategoryImage");
const newCategoryError = document.getElementById("newCategoryError");
const btnNewCategory = document.getElementById("btnNewCategory");
const btnCreateCategory = document.getElementById("btnCreateCategory");
const closeNewCategoryBtn = document.getElementById("closeNewCategoryModal");

const newActivityModal = document.getElementById("newActivityModal");
const newActivityForm = document.getElementById("newActivityForm");
const newActivityCategory = document.getElementById("newActivityCategory");
const newActivityCategoryId = document.getElementById("newActivityCategoryId");
const newActivityName = document.getElementById("newActivityName");
const newActivityError = document.getElementById("newActivityError");
const btnCreateActivity = document.getElementById("btnCreateActivity");
const closeNewActivityBtn = document.getElementById("closeNewActivityModal");

// Pequeño set de íconos para dar variedad visual, ya que la DB solo da el nombre
const activityIcons = ["✦", "♡", "☆", "✧", "❀", "◆"];


//---------------------------------------------------------------------
//REACTIONS TO EVENTS

if (categories.length > 0) {
    reels.forEach(buildReel);
} else {
    // Sin categorías no hay nada que girar
    lever.disabled = true;
    if (leverMobile) leverMobile.disabled = true;
    if (leverLabel) leverLabel.textContent = "Sin categorías todavía";
}

lever.addEventListener("click", spinAll);

// ── Paso 6: Lógica de la trampa ──
// Solo las categorías (la tarjeta "Nueva categoría" no tiene data-category)
const trapOptionButtons = document.querySelectorAll(".trap-option[data-category]");

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

// ── Paso 8: Nueva categoría ──
btnNewCategory.addEventListener("click", openNewCategoryModal);
closeNewCategoryBtn.addEventListener("click", closeNewCategoryModal);
newCategoryModal.addEventListener("click", (e) => {
    if (e.target === newCategoryModal) closeNewCategoryModal();
});
newCategoryForm.addEventListener("submit", createCategory);

// ── Paso 9: Nueva actividad ──
closeNewActivityBtn.addEventListener("click", closeNewActivityModal);
newActivityModal.addEventListener("click", (e) => {
    if (e.target === newActivityModal) closeNewActivityModal();
});
newActivityForm.addEventListener("submit", createActivity);

btnConfirmActivity.addEventListener("click", () => {
    if (btnConfirmActivity.disabled) return;
    const category = finalCategoryInput.value;
    window.location.href = `/dates/schedule?category=${encodeURIComponent(category)}&activity=${encodeURIComponent(selectedActivity.id)}`;
});
