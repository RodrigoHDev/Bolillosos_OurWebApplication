/*
Title: calendar.js (home)
Author: R. Hurtado
Date: 09/26/2026
Description:
"Futuras citas" calendar of the home page.
- Marks the days with a future date (window.upcomingDates).
- Hovering (or tapping) a marked day enlarges it showing category, activity
  and hour. It hides when the pointer leaves the enlarged day.

Note: the schedule page sends the chosen day and hour without time zone and
the database stores them as UTC, so the UTC fields ARE the chosen day and hour.
*/

//---------------------------------------------------------------------
// FUNCTIONS

//=====================================
// UTILIDADES DE FECHA

function homeToDayKey(year, month, day) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/*homeUtcDayKey
Day of a stored date (UTC fields, see note above)*/
function homeUtcDayKey(date) {
    return homeToDayKey(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function homeFormatHour(date) {
    const hours = date.getUTCHours();
    const minutes = String(date.getUTCMinutes()).padStart(2, "0");
    const period = hours < 12 ? "AM" : "PM";
    const displayHour = hours % 12 === 0 ? 12 : hours % 12;
    return `${displayHour}:${minutes} ${period}`;
}

//=====================================
// DATOS: citas agrupadas por día

/*homeBuildDatesByDay
Map dayKey → [{ category, activity, timeText }]
- Single day: the chosen hour.
- Range of days: every day of the range, "Todo el día".*/
function homeBuildDatesByDay(upcomingDates) {
    const map = new Map();

    const add = (key, item) => {
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(item);
    };

    upcomingDates.forEach(entry => {
        const start = new Date(entry.start);
        const end = new Date(entry.end);
        const isRange = homeUtcDayKey(start) !== homeUtcDayKey(end);

        if (!isRange) {
            add(homeUtcDayKey(start), {
                category: entry.category,
                activity: entry.activity,
                timeText: homeFormatHour(start)
            });
            return;
        }

        const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
        while (cursor <= end) {
            add(homeUtcDayKey(cursor), {
                category: entry.category,
                activity: entry.activity,
                timeText: "Todo el día"
            });
            cursor.setUTCDate(cursor.getUTCDate() + 1);
        }
    });

    return map;
}

//=====================================
// RENDERIZADO DEL CALENDARIO

function homeRenderCalendar() {
    homeHideDayCard();

    homeCalendarLabel.textContent = `${HOME_MONTH_NAMES[homeBaseMonth.getMonth()]} ${homeBaseMonth.getFullYear()}`;
    homeCalendarGrid.innerHTML = "";

    const weekdayRow = document.createElement("div");
    weekdayRow.className = "calendar-weekdays";
    HOME_WEEKDAY_LABELS.forEach(label => {
        const el = document.createElement("div");
        el.textContent = label;
        weekdayRow.appendChild(el);
    });
    homeCalendarGrid.appendChild(weekdayRow);

    const dayGrid = document.createElement("div");
    dayGrid.className = "calendar-days";

    const year = homeBaseMonth.getFullYear();
    const month = homeBaseMonth.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const todayKey = homeToDayKey(homeToday.getFullYear(), homeToday.getMonth(), homeToday.getDate());

    for (let i = 0; i < firstWeekday; i++) {
        const empty = document.createElement("div");
        empty.className = "calendar-day empty";
        dayGrid.appendChild(empty);
    }

    for (let day = 1; day <= totalDays; day++) {
        const key = homeToDayKey(year, month, day);
        const items = homeDatesByDay.get(key) || [];
        const isPast = new Date(year, month, day) < homeToday;

        // Days with a date are buttons (focus / tap also shows the details)
        const el = document.createElement(items.length > 0 ? "button" : "div");
        el.className = "calendar-day";
        el.textContent = String(day);

        if (isPast) el.classList.add("past");
        if (key === todayKey) el.classList.add("is-today");

        if (items.length > 0) {
            el.type = "button";
            el.classList.add("has-date");
            el.classList.add(items.length === 1 ? "busy-1" : items.length === 2 ? "busy-2" : "busy-3");
            el.setAttribute("aria-label", `${day}: ${items.length} cita(s)`);

            el.addEventListener("pointerenter", () => homeShowDayCard(el, key));
            el.addEventListener("focus", () => homeShowDayCard(el, key));
            el.addEventListener("click", () => homeShowDayCard(el, key));

            // Leaving the day to anything that is not the enlarged day hides it
            el.addEventListener("pointerleave", (event) => {
                if (!homeDayCard.contains(event.relatedTarget)) homeHideDayCard();
            });
            el.addEventListener("blur", homeHideDayCard);
        }

        dayGrid.appendChild(el);
    }

    homeCalendarGrid.appendChild(dayGrid);
}

//=====================================
// DÍA AMPLIADO

/*homeShowDayCard
Places the enlarged day over the hovered day (centered, kept inside the
calendar) and grows it from the day position*/
function homeShowDayCard(dayEl, key) {
    if (homeActiveDayKey === key && !homeDayCard.hidden) return;

    const items = homeDatesByDay.get(key) || [];
    const [year, month, day] = key.split("-").map(Number);
    const dateText = new Date(year, month - 1, day).toLocaleDateString("es-MX", {
        weekday: "long", day: "numeric", month: "long"
    });

    homeDayCard.replaceChildren();

    const title = document.createElement("p");
    title.className = "home-day-card-date";
    title.textContent = dateText;
    homeDayCard.appendChild(title);

    items.forEach(item => {
        const row = document.createElement("div");
        row.className = "home-day-card-item";

        if (item.category) {
            const category = document.createElement("span");
            category.className = "rc-badge rc-badge--pink";
            category.textContent = item.category;
            row.appendChild(category);
        }

        const activity = document.createElement("span");
        activity.className = "home-day-card-activity";
        activity.textContent = item.activity;
        row.appendChild(activity);

        const time = document.createElement("span");
        time.className = "home-day-card-time";
        time.textContent = `🕒 ${item.timeText}`;
        row.appendChild(time);

        homeDayCard.appendChild(row);
    });

    // Measure once visible, then center it on the day inside the calendar
    homeDayCard.hidden = false;

    const calendarRect = homeCalendar.getBoundingClientRect();
    const dayRect = dayEl.getBoundingClientRect();
    const cardWidth = homeDayCard.offsetWidth;
    const cardHeight = homeDayCard.offsetHeight;

    const dayCenterX = dayRect.left - calendarRect.left + dayRect.width / 2;
    const dayCenterY = dayRect.top - calendarRect.top + dayRect.height / 2;

    const left = Math.min(Math.max(dayCenterX - cardWidth / 2, 0), calendarRect.width - cardWidth);
    const top = Math.max(dayCenterY - cardHeight / 2, 0);

    homeDayCard.style.left = `${left}px`;
    homeDayCard.style.top = `${top}px`;
    homeDayCard.style.transformOrigin = `${dayCenterX - left}px ${dayCenterY - top}px`;

    // Restart the grow animation
    homeDayCard.classList.remove("is-open");
    homeDayCard.getBoundingClientRect();
    homeDayCard.classList.add("is-open");

    homeActiveDayKey = key;
}

function homeHideDayCard() {
    homeDayCard.hidden = true;
    homeDayCard.classList.remove("is-open");
    homeActiveDayKey = null;
}


//---------------------------------------------------------------------
//VARIABLES DECLARATION

const HOME_WEEKDAY_LABELS = ["D", "L", "M", "M", "J", "V", "S"];
const HOME_MONTH_NAMES = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const homeDatesByDay = homeBuildDatesByDay(window.upcomingDates || []);

const homeNow = new Date();
const homeToday = new Date(homeNow.getFullYear(), homeNow.getMonth(), homeNow.getDate());
const homeFirstMonth = new Date(homeNow.getFullYear(), homeNow.getMonth(), 1);
let homeBaseMonth = homeFirstMonth;
let homeActiveDayKey = null;

const homeCalendar = document.querySelector("[data-home-calendar]");
const homeCalendarGrid = homeCalendar.querySelector("[data-calendar-month]");
const homeCalendarLabel = homeCalendar.querySelector("[data-calendar-label]");
const homeCalendarNav = homeCalendar.querySelectorAll("[data-calendar-nav]");
const homeDayCard = document.getElementById("homeDayCard");


//---------------------------------------------------------------------
//REACTIONS TO EVENTS

homeRenderCalendar();

// Only future dates are shown, so the calendar does not go before this month
homeCalendarNav.forEach(btn => {
    btn.addEventListener("click", () => {
        const direction = btn.dataset.calendarNav === "prev" ? -1 : 1;
        const nextMonth = new Date(homeBaseMonth.getFullYear(), homeBaseMonth.getMonth() + direction, 1);
        if (nextMonth < homeFirstMonth) return;
        homeBaseMonth = nextMonth;
        homeRenderCalendar();
    });
});

// Leaving the enlarged day hides it
homeDayCard.addEventListener("pointerleave", homeHideDayCard);

// Touch / click outside the calendar hides it
document.addEventListener("click", (event) => {
    if (!homeCalendar.contains(event.target)) homeHideDayCard();
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") homeHideDayCard();
});
