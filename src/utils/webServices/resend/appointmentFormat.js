/*
Title: appointmentFormat.js
Author: R. Hurtado
Date: 07/07/2026 
Description: 
Declared function that formats two given dates into the same or different ones in format to be sent.
*/

function formatAppointmentDateTime(startIso, endIso) {
    const start = new Date(startIso);
    const end = new Date(endIso);

    const startDayKey = start.toISOString().split("T")[0];
    const endDayKey = end.toISOString().split("T")[0];

    const dateOptions = { day: "numeric", month: "long", year: "numeric" };

    //Range. Only date
    if (startDayKey !== endDayKey) {
        const dateText = `Del ${start.toLocaleDateString("es-MX", dateOptions)} al ${end.toLocaleDateString("es-MX", dateOptions)}`;
        return { dateText, timeText: "Por definir (rango de días)", isRange: true };
    }

    //Only one day. Include time.
    const dateText = start.toLocaleDateString("es-MX", { weekday: "long", ...dateOptions });
    const timeText = start.toLocaleTimeString("es-MX", { hour: "numeric", minute: "2-digit", hour12: true });

    return { dateText, timeText, isRange: false };
}

module.exports = { formatAppointmentDateTime };