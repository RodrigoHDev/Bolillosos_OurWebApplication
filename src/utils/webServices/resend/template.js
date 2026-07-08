/*
Title: template.js
Author: R. Hurtado
Date: 07/07/2026 
Description: 
Function that contains the designed template for the email
Data used:
data{
  display_name
  date
  time
  description
  creator
}
*/

function appointmentEmail(data) {

    return `

<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" lang="en">
  <head>
    <meta content="width=device-width" name="viewport" />
    <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta content="IE=edge" http-equiv="X-UA-Compatible" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta content="telephone=no,address=no,email=no,date=no,url=no" name="format-detection" />
    <style>
      @media (prefers-color-scheme: dark){li::marker{color:#c4c4c4}}
    </style>
    <style>
      @media (prefers-color-scheme: dark){li::marker{color:#c4c4c4}}
    </style>
  </head>
  <body dir="ltr" lang="en" style="background-color:#ffffff">
    <!--$--><!--html--><!--head--><!--body-->
    <table border="0" width="100%" cellpadding="0" cellspacing="0" role="presentation" align="center">
      <tbody>
        <tr>
          <td dir="ltr" lang="en" style="background-color:#ffffff">
            <table
              align="left"
              width="100%"
              border="0"
              cellpadding="0"
              cellspacing="0"
              role="presentation"
              style="max-width:600px;align:left;width:100%;color:#000000;background-color:#ffffff;border-radius:0px;border-color:#000000"
            >
              <tbody>
                <tr style="width:100%">
                  <td style="padding-top:0px;padding-right:0px;padding-bottom:0px;padding-left:0px">
                    <table
                      align="center"
                      width="100%"
                      border="0"
                      cellpadding="0"
                      cellspacing="0"
                      role="presentation"
                      style="margin-top:0;margin-right:auto;margin-bottom:0;margin-left:auto;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0"
                    >
                      <tbody>
                        <tr style="margin:0;padding:0">
                          <td data-id="__react-email-column" style="margin:0;padding:0;background-color:#ffffff">
                            <table
                              align="left"
                              width="100%"
                              border="0"
                              cellpadding="0"
                              cellspacing="0"
                              role="presentation"
                              style="max-width:600px;align:left;width:100%;color:#000000;background-color:#ffffff;border-radius:0px;border-color:#000000"
                            >
                              <tbody>
                                <tr style="width:100%">
                                  <td style="padding-top:0px;padding-right:0px;padding-bottom:0px;padding-left:0px">
                                    <p style="margin:0;padding:0"><br /></p>
                                    <table
                                      width="100%"
                                      border="0"
                                      cellpadding="0"
                                      cellspacing="0"
                                      role="presentation"
                                      style="margin-top:0;margin-right:0;margin-bottom:0;margin-left:0;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0;background:#FFF8FD"
                                    >
                                      <tbody>
                                        <tr style="margin:0;padding:0">
                                          <td align="center" data-id="__react-email-column" style="margin:0;padding:0">
                                            <table
                                              width="620"
                                              border="0"
                                              cellpadding="0"
                                              cellspacing="0"
                                              role="presentation"
                                              style="margin-top:0;margin-right:0;margin-bottom:0;margin-left:0;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0;background:#ffffff;border-style:solid;border-width:4px;border-color:#FF8FD1;border-radius:20px;overflow:hidden;box-shadow:0 10px 25px rgba(0,0,0,.12)"
                                            >
                                              <tbody>
                                                <tr style="margin:0;padding:0">
                                                  <td
                                                    align="center"
                                                    data-id="__react-email-column"
                                                    style="margin:0;padding:35px;background:linear-gradient(90deg,#FFD94D,#8EE7FF,#A8F5A2,#FFA7D8)"
                                                  >
                                                    <div style="margin:0;padding:0;font-size:48px">
                                                      <p style="margin:0;padding:0">✨<!-- -->💖<!-- -->✨</p>
                                                    </div>
                                                    <h1
                                                      style="margin:10px 0 5px;padding:0;color:#ffffff;font-size:34px;text-shadow:2px 2px #FF6FB5"
                                                    >
                                                      ¡Nuestra cita está confirmada!
                                                    </h1>
                                                  </td>
                                                </tr>
                                                <tr style="margin:0;padding:0">
                                                  <td
                                                    data-id="__react-email-column"
                                                    style="margin:0;padding:35px 45px 20px 45px"
                                                  >
                                                    <p
                                                      style="margin:0;padding:0;font-size:16px;color:#555;line-height:1.8;margin-top:0"
                                                    >
                                                      Hola <strong>${data.display_name}</strong>,
                                                    </p>
                                                    <p
                                                      style="margin:0;padding:0;font-size:16px;color:#555;line-height:1.8"
                                                    >
                                                      Hemos registrado correctamente nuestra cita! Yuppiiiiii
                                                    </p>
                                                  </td>
                                                </tr>
                                                <tr style="margin:0;padding:0">
                                                  <td
                                                    data-id="__react-email-column"
                                                    style="margin:0;padding:0 45px 20px 45px"
                                                  >
                                                    <table
                                                      width="100%"
                                                      border="0"
                                                      cellpadding="0"
                                                      cellspacing="0"
                                                      role="presentation"
                                                      style="margin-top:0;margin-right:0;margin-bottom:0;margin-left:0;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0;border-radius:14px;background:#FFF7D6;border-style:dashed;border-width:2px;border-color:#FFC85A"
                                                    >
                                                      <tbody>
                                                        <tr style="margin:0;padding:0">
                                                          <td
                                                            data-id="__react-email-column"
                                                            style="margin:0;padding:0;font-weight:bold;color:#F05DA7"
                                                          >
                                                            <p style="margin:0;padding:0">
                                                              📅<!-- -->
                                                              Fecha
                                                            </p>
                                                          </td>
                                                          <td
                                                            data-id="__react-email-column"
                                                            style="margin:0;padding:0;color:#444"
                                                          >
                                                            <p style="margin:0;padding:0">${data.date}</p>
                                                          </td>
                                                        </tr>
                                                        <tr style="margin:0;padding:0">
                                                          <td
                                                            data-id="__react-email-column"
                                                            style="margin:0;padding:0;font-weight:bold;color:#5AA7FF"
                                                          >
                                                            <p style="margin:0;padding:0">
                                                              🕒<!-- -->
                                                              Hora
                                                            </p>
                                                          </td>
                                                          <td
                                                            data-id="__react-email-column"
                                                            style="margin:0;padding:0;color:#444"
                                                          >
                                                            <p style="margin:0;padding:0">${data.time}</p>
                                                          </td>
                                                        </tr>
                                                        <tr style="margin:0;padding:0">
                                                          <td
                                                            data-id="__react-email-column"
                                                            style="margin:0;padding:0;font-weight:bold;color:#FF8E54"
                                                          >
                                                            <p style="margin:0;padding:0">
                                                              💬<!-- -->
                                                              Descripción
                                                            </p>
                                                          </td>
                                                          <td
                                                            data-id="__react-email-column"
                                                            style="margin:0;padding:0;color:#444"
                                                          >
                                                            <p style="margin:0;padding:0">${data.description}</p>
                                                          </td>
                                                        </tr>
                                                        <tr style="margin:0;padding:0">
                                                          <td
                                                            data-id="__react-email-column"
                                                            style="margin:0;padding:0;font-weight:bold;color:#B15EFF"
                                                          >
                                                            <p style="margin:0;padding:0">
                                                              👤<!-- -->
                                                              Organizador
                                                            </p>
                                                          </td>
                                                          <td
                                                            data-id="__react-email-column"
                                                            style="margin:0;padding:0;color:#444"
                                                          >
                                                            <p style="margin:0;padding:0">${data.creator}</p>
                                                          </td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                  </td>
                                                </tr>
                                                <tr style="margin:0;padding:0">
                                                  <td
                                                    align="center"
                                                    data-id="__react-email-column"
                                                    style="margin:0;padding:25px 40px"
                                                  >
                                                    <table
                                                      width="100%"
                                                      border="0"
                                                      cellpadding="0"
                                                      cellspacing="0"
                                                      role="presentation"
                                                      style="margin-top:0;margin-right:0;margin-bottom:0;margin-left:0;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0;background:#EFFFFC;border-style:dashed;border-width:2px;border-color:#76DDB5;border-radius:16px"
                                                    >
                                                      <tbody>
                                                        <tr style="margin:0;padding:0">
                                                          <td
                                                            align="center"
                                                            data-id="__react-email-column"
                                                            style="margin:0;padding:0"
                                                          >
                                                            <div style="margin:0;padding:0;font-size:42px">
                                                              <p style="margin:0;padding:0">📆<!-- -->✨</p>
                                                            </div>
                                                            <h2 style="margin:10px 0;padding:0;color:#3B7DDD">
                                                              Añade la cita a tu calendario
                                                            </h2>
                                                            <p
                                                              style="margin:0;padding:0;margin-bottom:18px;color:#555;line-height:1.7"
                                                            >
                                                              Adjunto un archivo compatible con Google Calendar, Apple
                                                              Calendar, Outlook y otros calendarios si te gustaria
                                                              agregarlo.
                                                            </p>

                                                            <p
                                                              style="margin:0;padding:0;margin-top:18px;font-size:13px;color:#777"
                                                            >
                                                              También puedes abrir directamente el archivo
                                                              <strong>.ics</strong> que viene adjunto en este correo.
                                                            </p>
                                                          </td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                  </td>
                                                </tr>
                                                <tr style="margin:0;padding:0">
                                                  <td
                                                    align="center"
                                                    data-id="__react-email-column"
                                                    style="margin:0;padding:30px;background:#F9F3FF"
                                                  >
                                                    <div style="margin:0;padding:0;font-size:30px">
                                                      <p style="margin:0;padding:0">🌼</p>
                                                    </div>
                                                    <p
                                                      style="margin:0;padding:0;color:#666;line-height:1.8;margin-top:15px"
                                                    >
                                                      Si necesitas modificar o cancelar tu cita, simplemente vuelve a
                                                      ingresar a la plataforma.<br />¡Nos vemos pronto cariño!
                                                      <!-- -->✨
                                                    </p>
                                                  </td>
                                                </tr>
                                              </tbody>
                                            </table>
                                          </td>
                                        </tr>
                                      </tbody>
                                    </table>
                                    <p style="margin:0;padding:0"><br /></p>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    <p style="margin:0;padding:0"><br /></p>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
    <!--/$-->
  </body>
</html>
`;
}

module.exports = appointmentEmail;