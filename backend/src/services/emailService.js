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

        subject: 'Recuperación de contraseña - ZonaGol',

        text: `
    Hola.

    Recibimos una solicitud para restablecer la contraseña de tu cuenta de ZonaGol.

    Abre el siguiente enlace:

    ${enlaceRecuperacion}

    Este enlace tiene una vigencia de 30 minutos y solo puede utilizarse una vez.

    Si no solicitaste este cambio, puedes ignorar este correo.

    ZonaGol
        `.trim(),

        html: `
            <div style="
                font-family: Arial, sans-serif;
                max-width: 600px;
                margin: 0 auto;
                padding: 30px;
                color: #10263d;
            ">

                <h1>ZonaGol</h1>

                <h2>
                    Recuperación de contraseña
                </h2>

                <p>
                    Recibimos una solicitud para
                    restablecer la contraseña de tu cuenta.
                </p>

                <p>
                    Haz clic en el siguiente botón:
                </p>

                <p style="margin: 30px 0;">
                    <a
                        href="${enlaceRecuperacion}"
                        style="
                            background: #098b5b;
                            color: white;
                            padding: 14px 24px;
                            text-decoration: none;
                            border-radius: 8px;
                            display: inline-block;
                            font-weight: bold;
                        "
                    >
                        Restablecer contraseña
                    </a>
                </p>

                <p>
                    Este enlace tiene una vigencia de
                    <strong>30 minutos</strong>
                    y solo puede utilizarse una vez.
                </p>

                <p>
                    Si no solicitaste este cambio,
                    puedes ignorar este correo.
                </p>

            </div>
        `
    })


    console.log(
        'Correo de recuperación enviado:'
    )

    console.log(
        'Destinatario:',
        destinatario
    )

    console.log(
        'Message ID:',
        resultado.messageId
    )

    console.log(
        'Aceptados:',
        resultado.accepted
    )

    console.log(
        'Rechazados:',
        resultado.rejected
    )


    return resultado
}


module.exports = {
    enviarCorreoRecuperacion
}