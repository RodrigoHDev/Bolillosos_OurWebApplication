// utils/icsBuilder.js

function pad(n) {
    return String(n).padStart(2, "0");
}

function toIcsDateTimeUTC(date) {
    return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
           `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
}

function toIcsDateOnly(date) {
    return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}`;
}

function addDays(date, days) {
    const d = new Date(date);
    d.setUTCDate(d.getUTCDate() + days);
    return d;
}

function escapeIcs(text) {
    return String(text).replace(/[,;]/g, "\\$&").replace(/\n/g, "\\n");
}

function buildIcsContent({ summary, description, startIso, endIso, isRange }) {
    const start = new Date(startIso);
    const end = new Date(endIso);
    const uid = `${Date.now()}-${Math.random().toString(36).slice(2)}@bolillosos.app`;

    const lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Bolillosos//Date App//ES",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        "BEGIN:VEVENT",
        `UID:${uid}`,
        `DTSTAMP:${toIcsDateTimeUTC(new Date())}`,
    ];

    if (isRange) {
        // Eventos "todo el día": DTEND es EXCLUSIVO según el estándar iCal, por eso +1 día
        lines.push(`DTSTART;VALUE=DATE:${toIcsDateOnly(start)}`);
        lines.push(`DTEND;VALUE=DATE:${toIcsDateOnly(addDays(end, 1))}`);
    } else {
        lines.push(`DTSTART:${toIcsDateTimeUTC(start)}`);
        lines.push(`DTEND:${toIcsDateTimeUTC(end)}`);
    }

    lines.push(
        `SUMMARY:${escapeIcs(summary)}`,
        `DESCRIPTION:${escapeIcs(description)}`,
        "END:VEVENT",
        "END:VCALENDAR"
    );

    return lines.join("\r\n");
}

module.exports = { buildIcsContent };