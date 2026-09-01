import { useState } from 'react'
import logo from '../assets/logo.svg'
import '../styles/auth.css'
import { iniciarSesion } from '../services/authService'

function Login({
  onLogin,
  onGoRegister,
  onGoRecover,
}) {
  const [correo, setCorreo] = useState('')
  const [password, setPassword] = useState('')
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [recordarme, setRecordarme] = useState(false)

  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [cargando, setCargando] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()

    setError('')
    setMensaje('')
    setCargando(true)

    try {
      const data = await iniciarSesion(correo, password)

      setMensaje(data.message)

      onLogin(data.usuario)
    } catch (error) {
      setError(error.message)
    } finally {
      setCargando(false)
    }
  }

  return (
    <main className="auth-layout">
      {/* LADO IZQUIERDO */}
      <section className="auth-visual">
        <div className="brand inverse">
          <img
            src={logo}
            className="brand-mark"
            alt="Logo ZonaGol"
          />

          <div className="brand-word">
            <span>
              <strong>Zona</strong>
              <b>Gol</b>
            </span>

            <small>APUESTAS DEPORTIVAS</small>
          </div>
        </div>

        <div className="visual-copy">
          <div className="eyebrow gold">
            <i></i>
            FÚTBOL COLOMBIANO
          </div>

          <h1>
            Vive la emoción
            <br />
            de cada partido.
          </h1>

          <p>
            Disfruta del fútbol colombiano y realiza tus apuestas
            en una plataforma segura, rápida y responsable.
          </p>

          <div className="trust-list">
            <div>
              <span>✓</span>
              Plataforma segura
            </div>

            <div>
              <span>✓</span>
              Juego responsable
            </div>

            <div>
              <span>✓</span>
              Información protegida
            </div>
          </div>
        </div>

        {/* Decoración de estadio */}
        <div className="stadium">
          <div className="stadium-light"></div>

          <div className="stands left"></div>
          <div className="stands right"></div>

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
            Juega con responsabilidad.
            <br />
            Solo para mayores de edad.
          </span>
        </div>
      </section>

      {/* LADO DERECHO */}
      <section className="auth-panel">
        {/* Logo visible principalmente en celular */}
        <div className="mobile-brand">
          <div className="brand">
            <img
              src={logo}
              className="brand-mark"
              alt="Logo ZonaGol"
            />

            <div className="brand-word">
              <span>
                <strong>Zona</strong>
                <b>Gol</b>
              </span>

              <small>APUESTAS DEPORTIVAS</small>
            </div>
          </div>
        </div>

        <div className="auth-card">
          <div className="auth-heading">
            <div className="secure-pill">
              <span>✓</span>
              ACCESO SEGURO
            </div>

            <h2>Iniciar sesión</h2>

            <p>
              Ingresa tus credenciales para acceder a tu cuenta.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* CORREO */}
            <label className="field">
              <span className="field-label">
                Correo electrónico
              </span>

              <div className="field-control">
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M4 6h16v12H4z" />
                  <path d="m4 7 8 6 8-6" />
                </svg>

                <input
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={correo}
                  onChange={(event) =>
                    setCorreo(event.target.value)
                  }
                  autoComplete="email"
                  required
                />
              </div>
            </label>

            {/* CONTRASEÑA */}
            <label className="field">
              <span className="field-label">
                Contraseña
              </span>

              <div className="field-control">
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
                  placeholder="Ingresa tu contraseña"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  className="field-action"
                  onClick={() =>
                    setMostrarPassword(
                      !mostrarPassword
                    )
                  }
                  aria-label="Mostrar u ocultar contraseña"
                >
                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z" />
                    <circle
                      cx="12"
                      cy="12"
                      r="2.5"
                    />
                  </svg>
                </button>
              </div>
            </label>

            {/* OPCIONES */}
            <div className="form-between">
              <label className="check">
                <input
                  type="checkbox"
                  checked={recordarme}
                  onChange={(event) =>
                    setRecordarme(
                      event.target.checked
                    )
                  }
                />

                <span>
                  {recordarme ? '✓' : ''}
                </span>

                Recordarme
              </label>

              <button
                className="text-link"
                type="button"
                onClick={onGoRecover}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            {/* MENSAJE DE ERROR */}
            {error && (
              <p className="field-message">
                {error}
              </p>
            )}

            {/* MENSAJE CORRECTO */}
            {mensaje && (
              <div className="security-note">
                <span>✓</span>

                <div>
                  <strong>
                    Inicio de sesión correcto
                  </strong>

                  {mensaje}
                </div>
              </div>
            )}

            {/* BOTÓN */}
            <button
              type="submit"
              className="primary"
              disabled={cargando}
            >
              {cargando && (
                <span className="spinner"></span>
              )}

              {cargando
                ? 'Validando...'
                : 'Iniciar sesión'}
            </button>

            <div className="divider">
              <span>¿Aún no tienes una cuenta?</span>
            </div>

            <button
              className="secondary"
              type="button"
              onClick={onGoRegister}
            >
              Crear cuenta
            </button>

            <div className="security-note">
              <span>🔒</span>

              <div>
                <strong>
                  Tu información está protegida
                </strong>

                Nunca compartas tu contraseña con
                otras personas.
              </div>
            </div>

            <p className="legal">
              Al ingresar aceptas nuestros{' '}
              <a href="#">
                Términos y condiciones
              </a>{' '}
              y la{' '}
              <a href="#">
                Política de privacidad
              </a>.
            </p>
          </form>
        </div>
      </section>
    </main>
  )
}

export default Login