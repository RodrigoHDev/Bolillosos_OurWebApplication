// utils/mailer.js
const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_API_KEY);

const sendResetEmail = async function sendResetEmail(email, date, subject, html) {
    const fromEmail = 'Bolillosos <onboarding@resend.dev>';
    const { error } = await resend.emails.send({
        from: fromEmail,
        to: [email],
        subject: subject,
        html: html,
    });
    if (error) {
        throw new Error(error.message || 'Resend could not send the reset email.');
    }
};

const sendAppointmentEmail = async function sendAppointmentEmail(email, subject, html, attachments = []) {
    const fromEmail = 'Bolillosos <onboarding@resend.dev>';
    const { error } = await resend.emails.send({
        from: fromEmail,
        to: [email],
        subject,
        html,
        attachments, // [{ filename, content }]
    });
    if (error) {
        throw new Error(error.message || 'Resend could not send the appointment email.');
    }
};

module.exports = {
    sendResetEmail,
    sendAppointmentEmail,
};