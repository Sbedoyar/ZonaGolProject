const nodemailer = require('nodemailer')

require('dotenv').config()


// ============================================================
// TRANSPORTADOR DE CORREO
// ============================================================

const transporter = nodemailer.createTransport({
    service: 'gmail',

    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD
    }
})


// ============================================================
// ENVIAR CORREO DE RECUPERACIÓN
// ============================================================

async function enviarCorreoRecuperacion(
    destinatario,
    enlaceRecuperacion
) {

    const resultado = await transporter.sendMail({
        from: `"ZonaGol Soporte" <${process.env.EMAIL_USER}>`,

        to: destinatario,

        subject:
            'Restablece tu contraseña | ZonaGol',

        // ====================================================
        // VERSIÓN TEXTO PLANO
        // ====================================================

        text: `
Hola.

Recibimos una solicitud para restablecer la contraseña de tu cuenta de ZonaGol.

Puedes crear una nueva contraseña ingresando al siguiente enlace:

${enlaceRecuperacion}

El enlace estará disponible durante 30 minutos y solo puede utilizarse una vez.

Si no solicitaste este cambio, puedes ignorar este correo. Tu contraseña actual no será modificada.

ZonaGol
Tu pasión, tu juego.
        `.trim(),

        // ====================================================
        // VERSIÓN HTML
        // ====================================================

        html: `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >
    <title>Restablecer contraseña - ZonaGol</title>
</head>

<body
    style="
        margin: 0;
        padding: 0;
        background-color: #f2f5f7;
        font-family: Arial, Helvetica, sans-serif;
        color: #17324d;
    "
>

    <table
        role="presentation"
        width="100%"
        cellspacing="0"
        cellpadding="0"
        border="0"
        style="
            width: 100%;
            background-color: #f2f5f7;
            padding: 40px 16px;
        "
    >
        <tr>
            <td align="center">

                <table
                    role="presentation"
                    width="100%"
                    cellspacing="0"
                    cellpadding="0"
                    border="0"
                    style="
                        width: 100%;
                        max-width: 600px;
                        background-color: #ffffff;
                        border-radius: 16px;
                        overflow: hidden;
                        box-shadow:
                            0 8px 30px rgba(15, 38, 61, 0.10);
                    "
                >

                    <!-- ===================================== -->
                    <!-- ENCABEZADO -->
                    <!-- ===================================== -->

                    <tr>
                        <td
                            align="center"
                            style="
                                background-color: #10263d;
                                padding: 34px 30px 30px;
                                border-bottom: 5px solid #f5c518;
                            "
                        >

                            <div
                                style="
                                    font-size: 32px;
                                    line-height: 38px;
                                    font-weight: 800;
                                    color: #ffffff;
                                    letter-spacing: -1px;
                                "
                            >
                                Zona<span style="color: #f5c518;">Gol</span>
                            </div>

                            <div
                                style="
                                    margin-top: 8px;
                                    font-size: 12px;
                                    line-height: 18px;
                                    font-weight: 700;
                                    color: #b9c7d5;
                                    letter-spacing: 2px;
                                    text-transform: uppercase;
                                "
                            >
                                Seguridad de tu cuenta
                            </div>

                        </td>
                    </tr>


                    <!-- ===================================== -->
                    <!-- CONTENIDO -->
                    <!-- ===================================== -->

                    <tr>
                        <td
                            style="
                                padding: 42px 42px 34px;
                            "
                        >

                            <h1
                                style="
                                    margin: 0 0 18px;
                                    color: #10263d;
                                    font-size: 27px;
                                    line-height: 35px;
                                    text-align: center;
                                "
                            >
                                Restablece tu contraseña
                            </h1>

                            <p
                                style="
                                    margin: 0 auto 28px;
                                    max-width: 480px;
                                    color: #526579;
                                    font-size: 16px;
                                    line-height: 26px;
                                    text-align: center;
                                "
                            >
                                Recibimos una solicitud para
                                restablecer la contraseña de tu
                                cuenta de ZonaGol.
                            </p>


                            <!-- BOTÓN -->

                            <table
                                role="presentation"
                                cellspacing="0"
                                cellpadding="0"
                                border="0"
                                align="center"
                                style="
                                    margin: 0 auto 32px;
                                "
                            >
                                <tr>
                                    <td
                                        align="center"
                                        bgcolor="#098b5b"
                                        style="
                                            border-radius: 9px;
                                        "
                                    >
                                        <a
                                            href="${enlaceRecuperacion}"
                                            target="_blank"
                                            style="
                                                display: inline-block;
                                                padding: 15px 30px;
                                                color: #ffffff;
                                                font-size: 16px;
                                                line-height: 20px;
                                                font-weight: 700;
                                                text-decoration: none;
                                                border-radius: 9px;
                                            "
                                        >
                                            Restablecer contraseña
                                        </a>
                                    </td>
                                </tr>
                            </table>


                            <!-- VIGENCIA -->

                            <table
                                role="presentation"
                                width="100%"
                                cellspacing="0"
                                cellpadding="0"
                                border="0"
                                style="
                                    margin: 0 0 28px;
                                    background-color: #f7f9fa;
                                    border: 1px solid #e2e8ed;
                                    border-radius: 10px;
                                "
                            >
                                <tr>
                                    <td
                                        style="
                                            padding: 18px 20px;
                                            color: #526579;
                                            font-size: 14px;
                                            line-height: 22px;
                                            text-align: center;
                                        "
                                    >
                                        Este enlace estará disponible
                                        durante
                                        <strong style="color: #10263d;">
                                            30 minutos
                                        </strong>
                                        y solo puede utilizarse
                                        <strong style="color: #10263d;">
                                            una vez.
                                        </strong>
                                    </td>
                                </tr>
                            </table>


                            <!-- ENLACE ALTERNATIVO -->

                            <p
                                style="
                                    margin: 0 0 8px;
                                    color: #526579;
                                    font-size: 13px;
                                    line-height: 20px;
                                "
                            >
                                Si el botón no funciona, copia y pega
                                este enlace en tu navegador:
                            </p>

                            <p
                                style="
                                    margin: 0 0 30px;
                                    padding: 12px 14px;
                                    background-color: #f7f9fa;
                                    border-radius: 7px;
                                    color: #098b5b;
                                    font-size: 12px;
                                    line-height: 19px;
                                    word-break: break-all;
                                "
                            >
                                ${enlaceRecuperacion}
                            </p>


                            <!-- SEGURIDAD -->

                            <div
                                style="
                                    border-top: 1px solid #e2e8ed;
                                    padding-top: 25px;
                                "
                            >

                                <p
                                    style="
                                        margin: 0 0 7px;
                                        color: #10263d;
                                        font-size: 14px;
                                        line-height: 22px;
                                        font-weight: 700;
                                    "
                                >
                                    ¿No solicitaste este cambio?
                                </p>

                                <p
                                    style="
                                        margin: 0;
                                        color: #718092;
                                        font-size: 13px;
                                        line-height: 21px;
                                    "
                                >
                                    Puedes ignorar este correo.
                                    Tu contraseña actual no será
                                    modificada mientras no utilices
                                    el enlace de recuperación.
                                </p>

                            </div>

                        </td>
                    </tr>


                    <!-- ===================================== -->
                    <!-- PIE -->
                    <!-- ===================================== -->

                    <tr>
                        <td
                            align="center"
                            style="
                                background-color: #f7f9fa;
                                border-top: 1px solid #e2e8ed;
                                padding: 24px 30px;
                            "
                        >

                            <p
                                style="
                                    margin: 0 0 5px;
                                    color: #10263d;
                                    font-size: 14px;
                                    line-height: 20px;
                                    font-weight: 700;
                                "
                            >
                                ZonaGol
                            </p>

                            <p
                                style="
                                    margin: 0;
                                    color: #8794a2;
                                    font-size: 12px;
                                    line-height: 18px;
                                "
                            >
                                Tu pasión, tu juego.
                            </p>

                        </td>
                    </tr>

                </table>


                <!-- TEXTO EXTERIOR -->

                <p
                    style="
                        margin: 20px 0 0;
                        color: #98a3ad;
                        font-size: 11px;
                        line-height: 17px;
                        text-align: center;
                    "
                >
                    Este es un mensaje automático de ZonaGol.
                    Por favor, no respondas a este correo.
                </p>

            </td>
        </tr>
    </table>

</body>
</html>
        `.trim()
    })


    console.log(
        'Correo de recuperación enviado:'
    )


    return resultado
}


module.exports = {
    enviarCorreoRecuperacion
}