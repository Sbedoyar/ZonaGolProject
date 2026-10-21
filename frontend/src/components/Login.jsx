import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'

import logo from '../assets/logo.svg'
import '../styles/auth.css'

import {
  eliminarToken,
  iniciarSesion,
  iniciarSesionGoogle,
  vincularGoogle,
} from '../services/authService'


function Login({
  onLogin,
  onGoRegister,
  onGoRegisterGoogle,
  onGoRecover,
}) {
  const [correo, setCorreo] = useState('')
  const [password, setPassword] = useState('')
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [recordarme, setRecordarme] = useState(false)

  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [tituloMensaje, setTituloMensaje] = useState('')

  const [cargando, setCargando] = useState(false)
  const [cargandoGoogle, setCargandoGoogle] = useState(false)

  const [errorGoogle, setErrorGoogle] = useState('')

  const googleButtonRef = useRef(null)
  const [
    googleCredentialPendiente,
    setGoogleCredentialPendiente,
  ] = useState(null)

  // ==========================================================
  // LOGIN TRADICIONAL
  // ==========================================================

    const handleSubmit = async (event) => {
    event.preventDefault()

    setError('')
    setMensaje('')
    setTituloMensaje('')
    setCargando(true)

    try {
      // ========================================================
      // LOGIN TRADICIONAL
      //
      // Si existe una vinculación Google pendiente, este login
      // sirve para demostrar que el usuario controla la cuenta
      // ZonaGol existente.
      // ========================================================

      const data = await iniciarSesion(
        correo,
        password
      )


      // ========================================================
      // VINCULACIÓN GOOGLE PENDIENTE
      // ========================================================

      if (googleCredentialPendiente) {
        try {
          const vinculacion =
            await vincularGoogle(
              googleCredentialPendiente
            )


          setGoogleCredentialPendiente(null)

          setTituloMensaje(
            'Google vinculado correctamente'
          )

          setMensaje(
            vinculacion.message
          )


          // El JWT de iniciarSesion ya quedó guardado.
          onLogin(
            data.usuario
          )

          return

        } catch (vinculacionError) {

          // iniciarSesion() guarda el JWT antes de intentar
          // vincular. Si la vinculación falla, lo eliminamos
          // para no dejar una sesión parcial.
          eliminarToken()

          throw vinculacionError
        }
      }


      // ========================================================
      // LOGIN TRADICIONAL NORMAL
      // ========================================================

      setTituloMensaje(
        'Inicio de sesión correcto'
      )

      setMensaje(
        data.message
      )

      onLogin(
        data.usuario
      )

    } catch (error) {

      setError(
        error.message
      )

    } finally {

      setCargando(false)

    }
  }


  // ==========================================================
  // RESPUESTA DE GOOGLE IDENTITY SERVICES
  //
  // Google entrega:
  // response.credential
  //
  // Esa credencial se envía inmediatamente al backend.
  // NO se almacena en sessionStorage ni localStorage.
  // ==========================================================

  const handleGoogleCredential =
    useCallback(
      async (googleResponse) => {

        if (
          !googleResponse ||
          !googleResponse.credential
        ) {
          setError(
            'Google no devolvió una credencial válida'
          )

          return
        }


        setError('')
        setMensaje('')
        setTituloMensaje('')
        setCargandoGoogle(true)


        try {

          const data =
            await iniciarSesionGoogle(
              googleResponse.credential
            )


          // ================================================
          // IDENTIDAD GOOGLE YA VINCULADA
          // ================================================

          if (
            data.estado ===
            'AUTENTICADO'
          ) {

            setTituloMensaje(
              'Inicio de sesión correcto'
            )

            setMensaje(
              data.message
            )

            onLogin(
              data.usuario
            )

            return
          }


          // ================================================
          // CORREO YA EXISTE EN ZONAGOL
          //
          // Todavía NO vinculamos.
          // Solo confirmamos que el backend detectó el caso.
          // ================================================

          if (
            data.estado ===
            'VINCULACION_REQUERIDA'
          ) {

            // Guardamos temporalmente la credencial de Google
            // únicamente mientras Login.jsx está abierto.
            setGoogleCredentialPendiente(
              googleResponse.credential
            )


            // El backend ya confirmó que este correo
            // pertenece a una cuenta ZonaGol existente.
            if (data.correo) {
              setCorreo(
                data.correo
              )
            }


            setPassword('')


            setTituloMensaje(
              'Cuenta existente detectada'
            )

            setMensaje(
              'Ingresa tu contraseña de ZonaGol para vincular esta cuenta de Google.'
            )

            return
          }


          // ================================================
          // USUARIO NUEVO DE GOOGLE
          //
          // Todavía NO navegamos a Register.
          // Eso será el siguiente bloque después de probar.
          // ================================================

          if (
            data.estado ===
            'REGISTRO_REQUERIDO'
          ) {

            onGoRegisterGoogle({
              credential:
                googleResponse.credential,

              perfilGoogle:
                data.perfilGoogle,
            })

            return
          }


          setError(
            'ZonaGol recibió una respuesta de Google no reconocida'
          )

        } catch (error) {

          setError(
            error.message
          )

        } finally {

          setCargandoGoogle(false)

        }
      },
      [onLogin]
    )


  // ==========================================================
  // INICIALIZAR BOTÓN GOOGLE
  //
  // La librería fue cargada previamente desde index.html.
  //
  // Como el script de Google se carga de forma asíncrona,
  // esperamos brevemente hasta que window.google esté listo.
  // ==========================================================

  useEffect(() => {

    const googleClientId =
      import.meta.env.VITE_GOOGLE_CLIENT_ID


    if (!googleClientId) {

      setErrorGoogle(
        'Google SSO no está configurado en el frontend'
      )

      return undefined
    }


    let intervalId = null
    let timeoutId = null
    let inicializado = false
    let renderizarBoton = null


    const intentarInicializarGoogle = () => {

      if (
        inicializado ||
        !googleButtonRef.current ||
        !window.google?.accounts?.id
      ) {
        return
      }


      inicializado = true

      setErrorGoogle('')


      // ================================================
      // CONFIGURAR GOOGLE IDENTITY SERVICES
      // ================================================

      window.google.accounts.id.initialize({
        client_id:
          googleClientId,

        callback:
          handleGoogleCredential,
      })


      // ================================================
      // RENDERIZAR BOTÓN OFICIAL DE GOOGLE
      // ================================================

      renderizarBoton = () => {

        if (
          !googleButtonRef.current ||
          !window.google?.accounts?.id
        ) {
          return
        }


        const anchoContenedor =
          Math.floor(
            googleButtonRef.current
              .getBoundingClientRect()
              .width
          )


        const anchoBoton =
          Math.min(
            400,
            anchoContenedor || 400
          )


        googleButtonRef.current.innerHTML = ''


        window.google.accounts.id.renderButton(
          googleButtonRef.current,
          {
            type:
              'standard',

            theme:
              'filled_black',

            size:
              'large',

            text:
              'continue_with',

            shape:
              'pill',

            logo_alignment:
              'left',

            width:
              anchoBoton,
          }
        )
      }


      renderizarBoton()


      window.addEventListener(
        'resize',
        renderizarBoton
      )


      if (intervalId) {
        clearInterval(intervalId)
      }
    }


    // Puede que Google ya esté disponible.
    intentarInicializarGoogle()


    // Si todavía no cargó, esperamos.
    intervalId =
      setInterval(
        intentarInicializarGoogle,
        100
      )


    // Si después de unos segundos no apareció,
    // mostramos un error controlado.
    timeoutId =
      setTimeout(
        () => {

          if (!inicializado) {

            clearInterval(intervalId)

            setErrorGoogle(
              'No fue posible cargar el inicio de sesión con Google'
            )
          }
        },
        5000
      )


    return () => {

      clearInterval(intervalId)
      clearTimeout(timeoutId)


      if (renderizarBoton) {

        window.removeEventListener(
          'resize',
          renderizarBoton
        )
      }


      if (googleButtonRef.current) {

        googleButtonRef.current.innerHTML = ''

      }
    }

  }, [handleGoogleCredential])


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

            <small>
              APUESTAS DEPORTIVAS
            </small>
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
      <section className="auth-panel login-panel">

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

              <small>
                APUESTAS DEPORTIVAS
              </small>
            </div>
          </div>
        </div>


        <div className="auth-card">
          <div className="auth-heading">
            <div className="secure-pill">
              <span>✓</span>
              ACCESO SEGURO
            </div>

            <h2>
              Iniciar sesión
            </h2>

            <p>
              Ingresa tus credenciales para acceder a tu cuenta.
            </p>
          </div>


          <form
            className="login-form"
            onSubmit={handleSubmit}
          >

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
                    setCorreo(
                      event.target.value
                    )
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
                    setPassword(
                      event.target.value
                    )
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


            {/* MENSAJE INFORMATIVO */}
            {mensaje && (
              <div className="security-note">
                <span>✓</span>

                <div>
                  <strong>
                    {tituloMensaje}
                  </strong>

                  {mensaje}
                </div>
              </div>
            )}


            {/* LOGIN TRADICIONAL */}
            <button
              type="submit"
              className="primary"
              disabled={
                cargando ||
                cargandoGoogle
              }
            >
              {cargando && (
                <span className="spinner"></span>
              )}

              {cargando
                ? 'Validando...'
                : googleCredentialPendiente
                  ? 'Iniciar sesión y vincular Google'
                  : 'Iniciar sesión'}
            </button>


            {/* SEPARADOR GOOGLE */}
            <div className="login-divider">
              <span>
                o continúa con
              </span>
            </div>


            {/* BOTÓN OFICIAL DE GOOGLE */}
            <div className="login-google-button">
              <div
                ref={googleButtonRef}
                className="login-google-button__official"
              ></div>
            </div>


            {cargandoGoogle && (
              <p
                style={{
                  marginTop: '10px',
                  textAlign: 'center',
                  color: '#71838f',
                  fontSize: '9px',
                }}
              >
                Validando cuenta de Google...
              </p>
            )}


            {errorGoogle && (
              <p className="field-message">
                {errorGoogle}
              </p>
            )}


            {/* REGISTRO NORMAL */}
            <div className="login-divider">
              <span>
                ¿Aún no tienes una cuenta?
              </span>
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