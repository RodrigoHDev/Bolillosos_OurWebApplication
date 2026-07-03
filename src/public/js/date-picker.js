// public/js/date-picker.js
// app.js / server.js

//---------------------------------------------------------------------
// UTILIDADES DE FECHA

function createDayDate(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function toIsoDateOnly(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

function isSameDay(a, b) {
    return a && b && toIsoDateOnly(a) === toIsoDateOnly(b);
}

function addMonths(date, delta) {
    return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

function getToday() {
    return createDayDate(new Date());
}

//---------------------------------------------------------------------
// HEATMAP DE OCUPACIÓN (a partir de window.existingDates)

function buildOverlapMap(existingDates) {
    const map = new Map();

    existingDates.forEach(entry => {
        const start = createDayDate(new Date(entry.start_date));
        const end = createDayDate(new Date(entry.end_date));

        let cursor = start;
        while (cursor <= end) {
            const key = toIsoDateOnly(cursor);
            map.set(key, (map.get(key) || 0) + 1);
            cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1);
        }
    });

    return map;
}

const overlapMap = buildOverlapMap(window.existingDates || []);

//---------------------------------------------------------------------
// ESTADO GLOBAL

const weekdayLabels = ["D", "L", "M", "M", "J", "V", "S"];
const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

let baseMonth = createDayDate(new Date());
baseMonth = new Date(baseMonth.getFullYear(), baseMonth.getMonth(), 1);

let selectedStart = null; // Date | null
let selectedEnd = null;   // Date | null
let selectedHour = null;  // number (0-23) | null

//---------------------------------------------------------------------
// REFERENCIAS AL DOM

const calendarGrid = document.querySelector("[data-calendar-month]");
const calendarLabel = document.querySelector("[data-calendar-label]");
const navButtons = document.querySelectorAll("[data-calendar-nav]");

const selectionSummary = document.getElementById("selectionSummary");
const selectionText = document.getElementById("selectionText");

const formStartDate = document.getElementById("formStartDate");
const formEndDate = document.getElementById("formEndDate");
const btnFinish = document.getElementById("btnFinish");

const hourModal = document.getElementById("hourModal");
const hourModalDate = document.getElementById("hourModalDate");
const hourGrid = document.getElementById("hourGrid");
const closeHourModal = document.getElementById("closeHourModal");
const btnConfirmHour = document.getElementById("btnConfirmHour");

const calendarContainer = document.querySelector("[data-date-picker]");

const dateForm = document.getElementById("dateForm");
const confirmModal = document.getElementById("confirmModal");

//---------------------------------------------------------------------
// RENDERIZADO DEL CALENDARIO

function renderCalendar() {
    calendarLabel.textContent = `${monthNames[baseMonth.getMonth()]} ${baseMonth.getFullYear()}`;
    calendarGrid.innerHTML = "";

    const weekdayRow = document.createElement("div");
    weekdayRow.className = "calendar-weekdays";
    weekdayLabels.forEach(label => {
        const el = document.createElement("div");
        el.textContent = label;
        weekdayRow.appendChild(el);
    });
    calendarGrid.appendChild(weekdayRow);

    const dayGrid = document.createElement("div");
    dayGrid.className = "calendar-days";

    const year = baseMonth.getFullYear();
    const month = baseMonth.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const today = getToday();

    for (let i = 0; i < firstWeekday; i++) {
        const empty = document.createElement("div");
        empty.className = "calendar-day empty";
        dayGrid.appendChild(empty);
    }

    for (let day = 1; day <= totalDays; day++) {
        const date = new Date(year, month, day);
        const isPast = date < today;

        const btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = String(day);
        btn.className = "calendar-day";

        // Heatmap de ocupación
        const count = overlapMap.get(toIsoDateOnly(date)) || 0;
        if (count === 1) btn.classList.add("busy-1");
        else if (count === 2) btn.classList.add("busy-2");
        else if (count >= 3) btn.classList.add("busy-3");

        if (isPast) {
            btn.classList.add("past");
            btn.disabled = true;
        } else {
            // Estados de selección
            if (isSameDay(date, selectedStart)) btn.classList.add("is-start");
            if (isSameDay(date, selectedEnd)) btn.classList.add("is-end");
            if (selectedStart && selectedEnd && date > selectedStart && date < selectedEnd) {
                btn.classList.add("in-range");
            }

            btn.addEventListener("click", () => handleDayClick(date));
        }

        dayGrid.appendChild(btn);
    }

    calendarGrid.appendChild(dayGrid);
}

navButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        const direction = btn.dataset.calendarNav === "prev" ? -1 : 1;
        baseMonth = addMonths(baseMonth, direction);
        renderCalendar();
    });
});

//---------------------------------------------------------------------
// LÓGICA DE SELECCIÓN (día único vs. rango)

function handleDayClick(date) {
    const startingFresh = !selectedStart || (selectedStart && selectedEnd);

    if (startingFresh) {
        selectedStart = date;
        selectedEnd = null;
        selectedHour = null;
        openHourModalFor(date);
    } else if (isSameDay(date, selectedStart)) {
        // Reabre el modal de horas para el mismo día (permite cambiar hora)
        openHourModalFor(date);
    } else {
        // Segundo día distinto → se convierte en rango, ya no requiere hora
        if (date < selectedStart) {
            selectedEnd = selectedStart;
            selectedStart = date;
        } else {
            selectedEnd = date;
        }
        selectedHour = null;
        closeModal();
    }

    renderCalendar();
    updateSummaryAndButton();
}

//---------------------------------------------------------------------
// MODAL DE HORAS

function buildHourOptions() {
    // 6am a 12am (medianoche): horas 6-23, más la opción de medianoche (24 → se muestra como 12:00 AM)
    const hours = [];
    for (let h = 6; h <= 23; h++) hours.push(h);
    hours.push(24); // representa medianoche (12:00 AM)
    return hours;
}

function formatHourLabel(hour) {
    if (hour === 24) return "12:00 AM";
    if (hour === 12) return "12:00 PM";
    const period = hour < 12 ? "AM" : "PM";
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    return `${displayHour}:00 ${period}`;
}

function openHourModalFor(date) {
    hourModalDate.textContent = date.toLocaleDateString("es-MX", {
        weekday: "long", day: "numeric", month: "long"
    });

    hourGrid.innerHTML = buildHourOptions().map(hour => `
        <button type="button" class="hour-option ${hour === selectedHour ? "selected" : ""}" data-hour="${hour}">
            ${formatHourLabel(hour)}
        </button>
    `).join("");

    document.querySelectorAll(".hour-option").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".hour-option").forEach(b => b.classList.remove("selected"));
            btn.classList.add("selected");
            selectedHour = Number(btn.dataset.hour);
            btnConfirmHour.disabled = false;
        });
    });

    btnConfirmHour.disabled = selectedHour === null;
    hourModal.classList.add("active");
}

function closeModal() {
    hourModal.classList.remove("active");
}

closeHourModal.addEventListener("click", closeModal);
hourModal.addEventListener("click", (e) => {
    if (e.target === hourModal) closeModal();
});

btnConfirmHour.addEventListener("click", () => {
    if (btnConfirmHour.disabled) return;
    closeModal();
    updateSummaryAndButton();
});

//---------------------------------------------------------------------
// RESUMEN + FORM OCULTO + BOTÓN FINALIZAR

function buildIsoWithHour(date, hour) {
    const dayPart = toIsoDateOnly(date);
    if (hour === 24) {
        // Medianoche = 00:00 del día siguiente
        const nextDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
        return `${toIsoDateOnly(nextDay)}T00:00:00`;
    }
    const hourPart = String(hour).padStart(2, "0");
    return `${dayPart}T${hourPart}:00:00`;
}

function updateSummaryAndButton() {
    const isRange = selectedStart && selectedEnd && !isSameDay(selectedStart, selectedEnd);
    const isSingleDayComplete = selectedStart && !selectedEnd && selectedHour !== null;

    if (isRange) {
        formStartDate.value = `${toIsoDateOnly(selectedStart)}T00:00:00`;
        formEndDate.value = `${toIsoDateOnly(selectedEnd)}T00:00:00`;

        selectionText.textContent =
            `Del ${selectedStart.toLocaleDateString("es-MX", { day: "numeric", month: "long" })} ` +
            `al ${selectedEnd.toLocaleDateString("es-MX", { day: "numeric", month: "long" })}`;
        selectionSummary.style.display = "block";
        btnFinish.disabled = false;

    } else if (isSingleDayComplete) {
        const isoValue = buildIsoWithHour(selectedStart, selectedHour);
        formStartDate.value = isoValue;
        formEndDate.value = isoValue;

        selectionText.textContent =
            `${selectedStart.toLocaleDateString("es-MX", { day: "numeric", month: "long" })} a las ${formatHourLabel(selectedHour)}`;
        selectionSummary.style.display = "block";
        btnFinish.disabled = false;

    } else {
        formStartDate.value = "";
        formEndDate.value = "";
        selectionSummary.style.display = "none";
        btnFinish.disabled = true;
    }
}

document.addEventListener("click", (e) => {
    const path = e.composedPath();
    const clickedInsideCalendar = path.includes(calendarContainer);
    const clickedInsideHourModal = path.includes(hourModal);

    if (clickedInsideCalendar || clickedInsideHourModal) return;

    const isIncomplete = selectedStart && !selectedEnd && selectedHour === null;

    if (isIncomplete) {
        selectedStart = null;
        closeModal();
        renderCalendar();
        updateSummaryAndButton();
    }
});

dateForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    btnFinish.disabled = true;
    btnFinish.textContent = "Guardando...";

    const payload = {
        _csrf: dateForm.querySelector('[name="_csrf"]').value,
        activityId: dateForm.querySelector('[name="activityId"]').value,
        startDate: formStartDate.value,
        endDate: formEndDate.value
    };

    try {
        const response = await fetch(dateForm.action, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error("Request failed");

        confirmModal.classList.add("active");

    } catch (err) {
        btnFinish.disabled = false;
        btnFinish.textContent = "¡Finalizar!";
        selectionText.textContent = "Hubo un error al guardar la cita, intenta de nuevo 💔";
        selectionSummary.style.display = "block";
    }
});

//---------------------------------------------------------------------
// INIT

renderCalendar();