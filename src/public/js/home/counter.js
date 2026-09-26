/*
Title: counter.js (home)
Author: R. Hurtado
Date: 09/26/2026
Description:
Anniversary counter of the home page.
Counts years, months, days, hours, minutes and seconds since
September 30th, 2025 12:00 PM in Mexico City, whatever the time zone of the
device that opens the page.
*/

//---------------------------------------------------------------------
// FUNCTIONS

/*homeGetZonedNow
Current date and time in HOME_TIME_ZONE, expressed as a UTC timestamp built
with the local fields. (Start and now are then compared field by field.)*/
function homeGetZonedNow() {
    const parts = homeZoneFormatter.formatToParts(new Date());
    const value = type => Number(parts.find(part => part.type === type).value);

    return Date.UTC(
        value("year"), value("month") - 1, value("day"),
        value("hour") % 24, value("minute"), value("second")
    );
}

/*homeAddMonths
Adds months to a timestamp. When the day does not exist in the target month
(e.g. 30th in February) the last day of that month is used.*/
function homeAddMonths(timestamp, months) {
    const date = new Date(timestamp);
    const target = new Date(Date.UTC(
        date.getUTCFullYear(), date.getUTCMonth() + months, 1,
        date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds()
    ));
    const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();

    target.setUTCDate(Math.min(date.getUTCDate(), lastDay));
    return target.getTime();
}

/*homeGetElapsed
Time between two timestamps split in calendar units.
Complete months are counted from the start (not accumulated) so the result
never drifts; the rest is split in days, hours, minutes and seconds.*/
function homeGetElapsed(startTimestamp, nowTimestamp) {
    if (nowTimestamp <= startTimestamp) {
        return { years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    const start = new Date(startTimestamp);
    const now = new Date(nowTimestamp);

    let totalMonths = (now.getUTCFullYear() - start.getUTCFullYear()) * 12
        + (now.getUTCMonth() - start.getUTCMonth());

    if (homeAddMonths(startTimestamp, totalMonths) > nowTimestamp) {
        totalMonths--;
    }

    let rest = Math.floor((nowTimestamp - homeAddMonths(startTimestamp, totalMonths)) / 1000);

    const days = Math.floor(rest / 86400);
    rest %= 86400;
    const hours = Math.floor(rest / 3600);
    rest %= 3600;
    const minutes = Math.floor(rest / 60);
    const seconds = rest % 60;

    return {
        years: Math.floor(totalMonths / 12),
        months: totalMonths % 12,
        days,
        hours,
        minutes,
        seconds
    };
}

/*homeUpdateCounter
Writes the elapsed time into the counter*/
function homeUpdateCounter() {
    const elapsed = homeGetElapsed(HOME_START, homeGetZonedNow());

    homeCounterValues.forEach(el => {
        const unit = el.dataset.counterUnit;
        const value = elapsed[unit];
        el.textContent = HOME_PADDED_UNITS.includes(unit) ? String(value).padStart(2, "0") : String(value);
    });
}


//---------------------------------------------------------------------
//VARIABLES DECLARATION

const HOME_TIME_ZONE = "America/Mexico_City";

// September 30th, 2025 12:00 PM (Mexico City). Month is 0-based (8 = September)
const HOME_START = Date.UTC(2025, 8, 30, 12, 0, 0);

const HOME_PADDED_UNITS = ["hours", "minutes", "seconds"];

const homeZoneFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: HOME_TIME_ZONE,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hourCycle: "h23"
});

const homeCounterValues = document.querySelectorAll("[data-counter-unit]");


//---------------------------------------------------------------------
//REACTIONS TO EVENTS

homeUpdateCounter();
setInterval(homeUpdateCounter, 1000);
