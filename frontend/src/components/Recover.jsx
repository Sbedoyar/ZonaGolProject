import { useState } from 'react'

import logo from '../assets/logo.svg'

import '../styles/auth.css'

import {
  solicitarRecuperacion,
} from '../services/authService'


function Brand({ inverse = false }) {
  return (
    <div
      className={
        inverse
          ? 'brand inverse'
          : 'brand'
      }
      aria-label="Zona Gol"
    >
      <img src={logo} alt="" />

      <span>
        ZONA<b>GOL</b>
      </span>
    </div>
  )
}


function Recover({
  onGoLogin,
}) {
  const [email, setEmail] =
    useState('')

  const [error, setError] =
    useState('')

  const [enviado, setEnviado] =
    useState(false)

  const [cargando, setCargando] =
    useState(false)


  const handleSubmit = async (event) => {
    event.preventDefault()

    const correo =
      email.trim()


    // ========================================================
    // VALIDAR CORREO
    // ========================================================

    if (!/^\S+@\S+\.\S+$/.test(correo)) {
      setError(
        'Revisa el correo. Debe tener un formato como nombre@correo.com.'
      )

      return
    }


    setError('')
    setCargando(true)


    try {

      // ======================================================
      // SOLICITAR RECUPERACIÓN
      //
      // El backend genera el token y envía el enlace
      // directamente al correo registrado.
      // ======================================================

      await solicitarRecuperacion(
        correo.toLowerCase()
      )


      setEnviado(true)

    } catch (error) {

      setError(
        error.message
      )

    } finally {

      setCargando(false)

    }
  }


  return (
    <main
      id="screen-recover"
      className="screen auth-layout active"
    >

      {/* ======================================================
          PANEL VISUAL
          ====================================================== */}

      <section className="auth-visual">

        <Brand inverse />


        <div className="visual-copy">

          <span className="eyebrow gold">
            <i></i>
            FÚTBOL NACIONAL
          </span>


          <h1>
            Recupera el acceso. Vuelve al partido.
          </h1>


          <p>
            Te acompañamos paso a paso para que
            restablezcas tu contraseña de forma
            rápida y segura.
          </p>


          <div className="trust-list">

            <div>
              <span>✓</span>
              Enlace temporal de un solo uso
            </div>

            <div>
              <span>✓</span>
              Vigencia limitada por seguridad
            </div>

            <div>
              <span>✓</span>
              Nunca pediremos tu contraseña por correo
            </div>

          </div>

        </div>


        <div className="stadium">

          <div className="stadium-light">
          </div>

          <div className="stands left">
          </div>

          <div className="stands right">
          </div>

          <div className="pitch">
            <span></span>
            <i></i>
            <b className="box-left"></b>
            <b className="box-right"></b>
          </div>

        </div>


        <div className="age-note">

          <strong>
            18+
          </strong>

          <span>
            Juega con responsabilidad
          </span>

        </div>

      </section>


      {/* ======================================================
          PANEL DERECHO
          ====================================================== */}

      <section className="auth-panel">

        <div className="mobile-brand">
          <Brand />
        </div>


        <form
          className="auth-card recover-card"
          noValidate
          onSubmit={handleSubmit}
        >

          <button
            className="back"
            type="button"
            onClick={onGoLogin}
          >

            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>

            Volver al inicio

          </button>


          {!enviado ? (

            // ==================================================
            // SOLICITAR RECUPERACIÓN
            // ==================================================

            <div>

              <div className="auth-heading">

                <span className="secure-pill blue">

                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <rect
                      x="4"
                      y="10"
                      width="16"
                      height="11"
                      rx="2"
                    />

                    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                  </svg>

                  Recuperación segura

                </span>


                <h2>
                  Recupera tu contraseña
                </h2>


                <p>
                  Escribe el correo registrado y
                  te enviaremos un enlace para
                  crear una nueva contraseña.
                </p>

              </div>


              <label
                className={
                  error
                    ? 'field error'
                    : 'field'
                }
              >

                <span className="field-label">
                  Correo electrónico registrado
                </span>


                <span className="field-control">

                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <rect
                      x="3"
                      y="5"
                      width="18"
                      height="14"
                      rx="2"
                    />

                    <path d="m3 7 9 6 9-6" />
                  </svg>


                  <input
                    type="email"
                    value={email}
                    onChange={(event) => {

                      setEmail(
                        event.target.value
                      )

                      setError('')

                    }}
                    placeholder="nombre@correo.com"
                    autoComplete="email"
                  />

                </span>


                <span className="field-message">
                  {error}
                </span>

              </label>


              <button
                className="primary"
                type="submit"
                disabled={cargando}
              >

                {
                  cargando
                    ? 'Enviando...'
                    : 'Enviar instrucciones'
                }


                {!cargando && (

                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="m9 18 6-6-6-6" />
                  </svg>

                )}

              </button>


              <div className="info-box">

                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M12 3 4.5 6v5.8c0 4.6 3.1 7.7 7.5 9.2 4.4-1.5 7.5-4.6 7.5-9.2V6L12 3Z" />

                  <path d="m8.5 12 2.2 2.2 4.8-5" />
                </svg>


                <span>

                  <strong>
                    Por tu seguridad
                  </strong>

                  El enlace tendrá una vigencia
                  limitada y podrá utilizarse
                  una sola vez.

                </span>

              </div>

            </div>

          ) : (

            // ==================================================
            // CORREO SOLICITADO
            // ==================================================

            <div className="success-state">

              <div className="success-icon">

                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <rect
                    x="3"
                    y="5"
                    width="18"
                    height="14"
                    rx="2"
                  />

                  <path d="m3 7 9 6 9-6" />
                </svg>


                <span>

                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="m5 12 4 4L19 6" />
                  </svg>

                </span>

              </div>


              <span className="eyebrow centered">
                SOLICITUD REGISTRADA
              </span>


              <h2>
                Revisa tu correo
              </h2>


              <p>
                Si{' '}

                <strong>
                  {email}
                </strong>{' '}

                está registrado en ZonaGol,
                recibirás un enlace para
                restablecer tu contraseña.
              </p>


              <div className="steps">

                <div className="step-line">
                </div>


                <div>
                  <b>1</b>

                  <span>
                    Revisa tu correo
                  </span>
                </div>


                <div>
                  <b>2</b>

                  <span>
                    Abre el enlace
                  </span>
                </div>


                <div>
                  <b>3</b>

                  <span>
                    Crea tu nueva clave
                  </span>
                </div>

              </div>


              <button
                className="primary"
                type="button"
                onClick={onGoLogin}
              >
                Volver a iniciar sesión
              </button>


              <button
                className="text-link resend"
                type="button"
                onClick={() => {

                  setEnviado(false)

                  setEmail('')

                  setError('')

                }}
              >
                Enviar a otro correo
              </button>

            </div>

          )}

        </form>

      </section>

    </main>
  )
}


export default Recover