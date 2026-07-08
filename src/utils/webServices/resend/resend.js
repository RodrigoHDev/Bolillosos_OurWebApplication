/*
Title: resend.js
Author: R. Hurtado
Date: 07/07/2026 
Description: 
Declaration of functions to send emails through Resend*/

const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_API_KEY);

//------------------------------------------------------
/*sendResetEmail
Function that allows to send an email based on the given parameters*/

const sendResetEmail = async function sendResetEmail(email, subject, html) {
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

//------------------------------------------------------
/*sendAppointmentEmail
Specialized function to send an email with attachments*/

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