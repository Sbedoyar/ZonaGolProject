import { useState } from 'react'

import logo from '../assets/logo.svg'

import '../styles/auth.css'

import {
  restablecerPassword,
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


function ResetPassword({
  token,
  onGoLogin,
}) {
  const [password, setPassword] =
    useState('')

  const [
    confirmarPassword,
    setConfirmarPassword,
  ] = useState('')

  const [error, setError] =
    useState('')

  const [cargando, setCargando] =
    useState(false)

  const [actualizada, setActualizada] =
    useState(false)

  const [
    mostrarPassword,
    setMostrarPassword,
  ] = useState(false)

  const [
    mostrarConfirmarPassword,
    setMostrarConfirmarPassword,
  ] = useState(false)


  const handleSubmit = async (event) => {
    event.preventDefault()

    setError('')


    // ==========================================
    // VALIDAR TOKEN
    // ==========================================

    if (!token) {
      setError(
        'El enlace de recuperación no es válido.'
      )

      return
    }


    // ==========================================
    // VALIDAR CONTRASEÑA
    // ==========================================

    if (password.length < 6) {
      setError(
        'La contraseña debe tener al menos 6 caracteres.'
      )

      return
    }


    // ==========================================
    // VALIDAR CONFIRMACIÓN
    // ==========================================

    if (password !== confirmarPassword) {
      setError(
        'Las contraseñas no coinciden.'
      )

      return
    }


    try {
      setCargando(true)

      await restablecerPassword(
        token,
        password
      )

      setActualizada(true)

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
      id="screen-reset-password"
      className="screen auth-layout active"
    >
      {/* =====================================
          PANEL VISUAL
          ===================================== */}

      <section className="auth-visual">

        <Brand inverse />


        <div className="visual-copy">

          <span className="eyebrow gold">
            <i></i>
            SEGURIDAD DE CUENTA
          </span>


          <h1>
            Crea una nueva contraseña.
          </h1>


          <p>
            Elige una nueva clave para volver
            a acceder a tu cuenta de ZonaGol.
          </p>


          <div className="trust-list">

            <div>
              <span>✓</span>
              Token temporal de recuperación
            </div>

            <div>
              <span>✓</span>
              Uso único por seguridad
            </div>

            <div>
              <span>✓</span>
              Vigencia limitada
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
          <strong>18+</strong>

          <span>
            Juega con responsabilidad
          </span>
        </div>

      </section>


      {/* =====================================
          PANEL FORMULARIO
          ===================================== */}

      <section className="auth-panel">

        <div className="mobile-brand">
          <Brand />
        </div>


        <form
          className="auth-card recover-card"
          noValidate
          onSubmit={handleSubmit}
        >

          {!actualizada ? (
            <div>

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

                  Nueva contraseña

                </span>


                <h2>
                  Restablece tu contraseña
                </h2>


                <p>
                  Ingresa una nueva contraseña
                  para tu cuenta.
                </p>

              </div>


              {/* NUEVA CONTRASEÑA */}

              <label
                className={
                  error
                    ? 'field error'
                    : 'field'
                }
              >

                <span className="field-label">
                  Nueva contraseña
                </span>


                <span className="field-control">

                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <rect
                      x="5"
                      y="10"
                      width="14"
                      height="10"
                      rx="2"
                    />

                    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                  </svg>


                  <input
                    type={
                      mostrarPassword
                        ? 'text'
                        : 'password'
                    }
                    value={password}
                    onChange={(event) => {
                      setPassword(
                        event.target.value
                      )

                      setError('')
                    }}
                    placeholder="Mínimo 6 caracteres"
                    autoComplete="new-password"
                  />

                  <button
                    type="button"
                    className="field-action"
                    onClick={() => {
                      setMostrarPassword(
                        !mostrarPassword
                      )
                    }}
                    aria-label={
                      mostrarPassword
                        ? 'Ocultar contraseña'
                        : 'Mostrar contraseña'
                    }
                  >
                    {mostrarPassword ? (
                      <svg
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    ) : (
                      <svg
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path d="M3 3l18 18" />
                        <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                        <path d="M9.9 4.2A10.8 10.8 0 0 1 12 4c5.5 0 9 8 9 8a16.8 16.8 0 0 1-2.1 3.2" />
                        <path d="M6.6 6.6C4.3 8.1 3 12 3 12s3.5 8 9 8a9.8 9.8 0 0 0 4.1-.9" />
                      </svg>
                    )}
                  </button>

                </span>

              </label>


              {/* CONFIRMAR CONTRASEÑA */}

              <label
                className={
                  error
                    ? 'field error'
                    : 'field'
                }
              >

                <span className="field-label">
                  Confirmar contraseña
                </span>


                <span className="field-control">

                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <rect
                      x="5"
                      y="10"
                      width="14"
                      height="10"
                      rx="2"
                    />

                    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                  </svg>


                  <input
                    type={
                      mostrarConfirmarPassword
                        ? 'text'
                        : 'password'
                    }
                    value={confirmarPassword}
                    onChange={(event) => {
                      setConfirmarPassword(
                        event.target.value
                      )

                      setError('')
                    }}
                    placeholder="Repite tu contraseña"
                    autoComplete="new-password"
                  />

                  <button
                    type="button"
                    className="field-action"
                    onClick={() => {
                      setMostrarConfirmarPassword(
                        !mostrarConfirmarPassword
                      )
                    }}
                    aria-label={
                      mostrarConfirmarPassword
                        ? 'Ocultar contraseña'
                        : 'Mostrar contraseña'
                    }
                  >
                    {mostrarConfirmarPassword ? (
                      <svg
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    ) : (
                      <svg
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path d="M3 3l18 18" />
                        <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                        <path d="M9.9 4.2A10.8 10.8 0 0 1 12 4c5.5 0 9 8 9 8a16.8 16.8 0 0 1-2.1 3.2" />
                        <path d="M6.6 6.6C4.3 8.1 3 12 3 12s3.5 8 9 8a9.8 9.8 0 0 0 4.1-.9" />
                      </svg>
                    )}
                  </button>

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
                    ? 'Actualizando...'
                    : 'Cambiar contraseña'
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

                  El enlace solamente puede
                  utilizarse una vez.

                </span>

              </div>

            </div>

          ) : (

            /* =====================================
               CONTRASEÑA ACTUALIZADA
               ===================================== */

            <div className="success-state">

              <div className="success-icon">

                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <rect
                    x="5"
                    y="10"
                    width="14"
                    height="10"
                    rx="2"
                  />

                  <path d="M8 10V7a4 4 0 0 1 8 0v3" />
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
                CONTRASEÑA ACTUALIZADA
              </span>


              <h2>
                Tu contraseña fue cambiada
              </h2>


              <p>
                Ya puedes iniciar sesión con
                tu nueva contraseña.
              </p>


              <button
                className="primary"
                type="button"
                onClick={onGoLogin}
              >
                Iniciar sesión
              </button>

            </div>
          )}

        </form>

      </section>
    </main>
  )
}


export default ResetPassword