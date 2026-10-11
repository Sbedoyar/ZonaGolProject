import { useMemo, useState } from 'react'
import logo from '../assets/logo.svg'
import '../styles/auth.css'
import CustomSelect from './common/CustomSelect'

import {
  registrarUsuario,
  registrarUsuarioGoogle,
} from '../services/authService'


function Brand() {
  return (
    <div className="brand" aria-label="Zona Gol">
      <img src={logo} alt="" />

      <span>
        ZONA<b>GOL</b>
      </span>
    </div>
  )
}


function Register({
  onGoLogin,
  onRegister,
  registroGoogle = null,
}) {

  // ==========================================================
  // DETERMINAR TIPO DE REGISTRO
  // ==========================================================

  const esRegistroGoogle =
    Boolean(
      registroGoogle?.credential
    )


  const perfilGoogle =
    registroGoogle?.perfilGoogle || {}


  // ==========================================================
  // FORMULARIO
  // ==========================================================

  const [form, setForm] = useState({
    names:
      perfilGoogle.nombre || '',

    lastNames:
      perfilGoogle.apellido || '',

    tipoDocumento:
      'CC',

    document:
      '',

    birth:
      '',

    phone:
      '',

    email:
      perfilGoogle.correo || '',

    password:
      '',

    confirm:
      '',

    terms:
      false,

    adult:
      false,
  })


  const [errors, setErrors] =
    useState({})


  const [
    mostrarPassword,
    setMostrarPassword,
  ] = useState(false)


  const [
    cargando,
    setCargando,
  ] = useState(false)


  // ==========================================================
  // FECHA MÁXIMA - MAYORÍA DE EDAD
  // ==========================================================

  const maxBirth =
    useMemo(() => {

      const fecha =
        new Date()


      fecha.setFullYear(
        fecha.getFullYear() - 18
      )


      return fecha
        .toISOString()
        .slice(0, 10)

    }, [])


  // ==========================================================
  // SEGURIDAD DE CONTRASEÑA
  // ==========================================================

  const passwordStrength = (
    value
  ) => {

    return [
      value.length >= 8,
      /[A-Z]/.test(value),
      /\d/.test(value),
      /[^A-Za-z0-9]/.test(value),
    ].filter(Boolean).length
  }


  const strength =
    esRegistroGoogle
      ? 0
      : passwordStrength(
          form.password
        )


  const strengthLabels = [
    'Sin contraseña',
    'Débil',
    'Aceptable',
    'Buena',
    'Segura',
  ]


  // ==========================================================
  // CAMBIOS DEL FORMULARIO
  // ==========================================================

  const handleChange = (
    event
  ) => {

    const {
      name,
      value,
      type,
      checked,
    } = event.target


    // El correo de Google fue verificado
    // por el backend y no debe cambiarse.
    if (
      esRegistroGoogle &&
      name === 'email'
    ) {
      return
    }


    setForm((prev) => ({
      ...prev,

      [name]:
        type === 'checkbox'
          ? checked
          : value,
    }))


    setErrors((prev) => ({
      ...prev,

      [name]:
        '',

      general:
        '',
    }))
  }


  // ==========================================================
  // VALIDACIONES
  // ==========================================================

  const validar = () => {

    const nuevosErrores = {}


    if (
      form.names
        .trim()
        .length < 2
    ) {

      nuevosErrores.names =
        'Ingresa tus nombres.'
    }


    if (
      form.lastNames
        .trim()
        .length < 2
    ) {

      nuevosErrores.lastNames =
        'Ingresa tus apellidos.'
    }


    if (
      !/^\d{6,12}$/.test(
        form.document.trim()
      )
    ) {

      nuevosErrores.document =
        'Ingresa una cédula válida, sin puntos.'
    }


    if (!form.birth) {

      nuevosErrores.birth =
        'Selecciona tu fecha de nacimiento.'
    }


    if (
      !/^3\d{9}$/.test(
        form.phone.trim()
      )
    ) {

      nuevosErrores.phone =
        'Ingresa un celular colombiano de 10 dígitos.'
    }


    if (
      !/^\S+@\S+\.\S+$/.test(
        form.email.trim()
      )
    ) {

      nuevosErrores.email =
        'Ingresa un correo válido.'
    }


    // ========================================================
    // CONTRASEÑA SOLO EN REGISTRO TRADICIONAL
    // ========================================================

    if (!esRegistroGoogle) {

      if (
        passwordStrength(
          form.password
        ) < 3
      ) {

        nuevosErrores.password =
          'Usa 8 caracteres, una mayúscula y un número.'
      }


      if (
        form.confirm !==
          form.password ||
        !form.confirm
      ) {

        nuevosErrores.confirm =
          'Las contraseñas no coinciden.'
      }
    }


    if (!form.terms) {

      nuevosErrores.terms =
        'Debes aceptar los términos.'
    }


    if (!form.adult) {

      nuevosErrores.adult =
        'Confirma que eres mayor de edad.'
    }


    setErrors(
      nuevosErrores
    )


    return (
      Object.keys(
        nuevosErrores
      ).length === 0
    )
  }


  // ==========================================================
  // ENVIAR REGISTRO
  // ==========================================================

  const handleSubmit =
    async (event) => {

      event.preventDefault()


      if (!validar()) {
        return
      }


      setCargando(true)


      try {

        let data


        // ====================================================
        // REGISTRO CON GOOGLE
        // ====================================================

        if (
          esRegistroGoogle
        ) {

          data =
            await registrarUsuarioGoogle({
              credential:
                registroGoogle.credential,

              nombres:
                form.names.trim(),

              apellidos:
                form.lastNames.trim(),

              tipoDocumento:
                form.tipoDocumento,

              documento:
                form.document.trim(),

              fechaNacimiento:
                form.birth,

              celular:
                form.phone.trim(),
            })

        } else {

          // ==================================================
          // REGISTRO TRADICIONAL
          // ==================================================

          data =
            await registrarUsuario({
              nombres:
                form.names.trim(),

              apellidos:
                form.lastNames.trim(),

              tipoDocumento:
                form.tipoDocumento,

              documento:
                form.document.trim(),

              fechaNacimiento:
                form.birth,

              celular:
                form.phone.trim(),

              correo:
                form.email
                  .trim()
                  .toLowerCase(),

              password:
                form.password,
            })
        }


        onRegister(
          data.usuario
        )

      } catch (error) {

        setErrors(
          (prev) => ({
            ...prev,

            general:
              error.message,
          })
        )

      } finally {

        setCargando(false)

      }
    }


  return (
    <main
      id="screen-register"
      className="screen register-page active"
    >

      {/* ================================================ */}
      {/* HEADER */}
      {/* ================================================ */}

      <header className="register-header">

        <Brand />


        <div>

          <span>

            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M12 3 4.5 6v5.8c0 4.6 3.1 7.7 7.5 9.2 4.4-1.5 7.5-4.6 7.5-9.2V6L12 3Z" />
              <path d="m8.5 12 2.2 2.2 4.8-5" />
            </svg>

            Registro protegido

          </span>


          <button
            type="button"
            onClick={
              onGoLogin
            }
          >
            Ya tengo cuenta
          </button>

        </div>

      </header>


      <section className="register-shell">

        {/* ============================================== */}
        {/* INTRO */}
        {/* ============================================== */}

        <aside className="register-intro">

          <span className="eyebrow gold">
            <i></i>
            ÚNETE A LA PASIÓN
          </span>


          <h1>
            Tu cuenta, lista antes del próximo pitazo.
          </h1>


          <p>
            Crea tu perfil de forma clara y segura.
            Solo pedimos los datos necesarios para
            proteger tu identidad.
          </p>


          <ol className="register-progress">

            <li className="active">

              <b>1</b>

              <span>

                <strong>
                  Datos personales
                </strong>

                <small>
                  Identidad y mayoría de edad
                </small>

              </span>

            </li>


            <li>

              <b>2</b>

              <span>

                <strong>
                  {esRegistroGoogle
                    ? 'Acceso con Google'
                    : 'Datos de acceso'}
                </strong>

                <small>
                  {esRegistroGoogle
                    ? 'Identidad Google verificada'
                    : 'Correo y contraseña segura'}
                </small>

              </span>

            </li>


            <li>

              <b>3</b>

              <span>

                <strong>
                  Confirmación
                </strong>

                <small>
                  Términos y juego responsable
                </small>

              </span>

            </li>

          </ol>


          <div className="intro-shield">

            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M12 3 4.5 6v5.8c0 4.6 3.1 7.7 7.5 9.2 4.4-1.5 7.5-4.6 7.5-9.2V6L12 3Z" />
              <path d="m8.5 12 2.2 2.2 4.8-5" />
            </svg>


            <span>

              <strong>
                Tu privacidad importa
              </strong>

              Tus datos se usan para validar y
              proteger tu cuenta.

            </span>

          </div>

        </aside>


        {/* ============================================== */}
        {/* FORMULARIO */}
        {/* ============================================== */}

        <form
          className="register-form"
          noValidate
          onSubmit={
            handleSubmit
          }
        >

          <div className="register-title">

            <span>
              {esRegistroGoogle
                ? 'COMPLETA TU CUENTA'
                : 'CREA TU CUENTA'}
            </span>


            <h2>
              Empecemos con tus datos
            </h2>


            <p>
              Los campos marcados con * son obligatorios.
            </p>

          </div>


          {/* ============================================ */}
          {/* INFORMACIÓN PERSONAL */}
          {/* ============================================ */}

          <div className="form-section">

            <div className="form-section-head">

              <b>01</b>


              <div>

                <h3>
                  Información personal
                </h3>

              </div>

            </div>


            <div className="form-grid">

              {/* NOMBRES */}

              <label
                className={
                  errors.names
                    ? 'field error'
                    : 'field'
                }
              >

                <span className="field-label">
                  Nombres *
                </span>


                <span className="field-control">

                  <input
                    name="names"
                    value={
                      form.names
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Ej. Santiago"
                    autoComplete="given-name"
                  />

                </span>


                <span className="field-message">
                  {errors.names}
                </span>

              </label>


              {/* APELLIDOS */}

              <label
                className={
                  errors.lastNames
                    ? 'field error'
                    : 'field'
                }
              >

                <span className="field-label">
                  Apellidos *
                </span>


                <span className="field-control">

                  <input
                    name="lastNames"
                    value={
                      form.lastNames
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Ej. Bedoya"
                    autoComplete="family-name"
                  />

                </span>


                <span className="field-message">
                  {errors.lastNames}
                </span>

              </label>


              {/* TIPO DOCUMENTO */}

              <label className="field">

                <span className="field-label">
                  Tipo de documento *
                </span>


                <CustomSelect
                  className="document-type-custom-select"
                  value={form.tipoDocumento}
                  ariaLabel="Seleccionar tipo de documento"
                  options={[
                    {
                      value: 'CC',
                      label: 'Cédula de ciudadanía (CC)',
                    },
                    {
                      value: 'CE',
                      label: 'Cédula de extranjería (CE)',
                    },
                    {
                      value: 'PAS',
                      label: 'Pasaporte',
                    },
                  ]}
                  onChange={(nuevoTipoDocumento) => {

                    setForm((formActual) => ({
                      ...formActual,

                      tipoDocumento:
                        nuevoTipoDocumento,
                    }))

                  }}
                />

              </label>


              {/* NÚMERO DOCUMENTO */}

              <label
                className={
                  errors.document
                    ? 'field error'
                    : 'field'
                }
              >

                <span className="field-label">
                  Número de documento *
                </span>


                <span className="field-control">

                  <input
                    name="document"
                    value={
                      form.document
                    }
                    onChange={
                      handleChange
                    }
                    inputMode="numeric"
                    placeholder="Sin puntos ni espacios"
                  />

                </span>


                <span className="field-message">
                  {errors.document}
                </span>

              </label>


              {/* NACIMIENTO */}

              <label
                className={
                  errors.birth
                    ? 'field error'
                    : 'field'
                }
              >

                <span className="field-label">
                  Fecha de nacimiento *
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
                      height="16"
                      rx="2"
                    />

                    <path d="M16 3v4M8 3v4M3 11h18" />
                  </svg>


                  <input
                    name="birth"
                    type="date"
                    value={
                      form.birth
                    }
                    max={
                      maxBirth
                    }
                    onChange={
                      handleChange
                    }
                  />

                </span>


                <span className="field-message">
                  {errors.birth}
                </span>

              </label>


              {/* CELULAR */}

              <label
                className={
                  errors.phone
                    ? 'field error'
                    : 'field'
                }
              >

                <span className="field-label">
                  Número de celular *
                </span>


                <span className="field-control">

                  <input
                    name="phone"
                    value={
                      form.phone
                    }
                    onChange={
                      handleChange
                    }
                    inputMode="tel"
                    placeholder="Ej. 3001234567"
                    autoComplete="tel"
                  />

                </span>


                <span className="field-message">
                  {errors.phone}
                </span>

              </label>

            </div>

          </div>


          {/* ============================================ */}
          {/* DATOS DE ACCESO */}
          {/* ============================================ */}

          <div className="form-section">

            <div className="form-section-head">

              <b>02</b>


              <div>

                <h3>
                  {esRegistroGoogle
                    ? 'Acceso con Google'
                    : 'Datos de acceso'}
                </h3>


                <p>
                  {esRegistroGoogle
                    ? 'Tu correo fue verificado por Google.'
                    : 'Los usarás para ingresar a Zona Gol.'}
                </p>

              </div>

            </div>


            <div className="form-grid">

              {/* CORREO */}

              <label
                className={
                  errors.email
                    ? 'field error'
                    : 'field'
                }
              >

                <span className="field-label">
                  Correo electrónico *
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
                    name="email"
                    type="email"
                    value={
                      form.email
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="nombre@correo.com"
                    autoComplete="email"
                    readOnly={
                      esRegistroGoogle
                    }
                    aria-readonly={
                      esRegistroGoogle
                    }
                  />

                </span>


                <span className="field-message">
                  {errors.email}
                </span>

              </label>


              <div className="placeholder-field">
              </div>


              {/* ======================================== */}
              {/* GOOGLE: SIN CONTRASEÑA */}
              {/* ======================================== */}

              {esRegistroGoogle ? (

                <div
                  className="security-note"
                  style={{
                    gridColumn:
                      '1 / -1',

                    marginTop:
                      0,

                    marginBottom:
                      '10px',
                  }}
                >

                  <span>
                    ✓
                  </span>


                  <div>

                    <strong>
                      Acceso protegido por Google
                    </strong>

                    No necesitas crear una contraseña de
                    ZonaGol. Iniciarás sesión con tu
                    cuenta de Google.

                  </div>

                </div>

              ) : (

                <>
                  {/* ==================================== */}
                  {/* CONTRASEÑA TRADICIONAL */}
                  {/* ==================================== */}

                  <label
                    className={
                      errors.password
                        ? 'field error'
                        : 'field'
                    }
                  >

                    <span className="field-label">
                      Contraseña *
                    </span>


                    <span className="field-control">

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


                      <input
                        name="password"
                        type={
                          mostrarPassword
                            ? 'text'
                            : 'password'
                        }
                        value={
                          form.password
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="Mínimo 8 caracteres"
                        autoComplete="new-password"
                      />


                      <button
                        className="field-action"
                        type="button"
                        aria-label={
                          mostrarPassword
                            ? 'Ocultar contraseña'
                            : 'Mostrar contraseña'
                        }
                        onClick={() =>
                          setMostrarPassword(
                            !mostrarPassword
                          )
                        }
                      >

                        <svg
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >

                          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />

                          <circle
                            cx="12"
                            cy="12"
                            r="3"
                          />

                        </svg>

                      </button>

                    </span>


                    <span className="field-message">
                      {errors.password}
                    </span>

                  </label>


                  {/* CONFIRMAR CONTRASEÑA */}

                  <label
                    className={
                      errors.confirm
                        ? 'field error'
                        : 'field'
                    }
                  >

                    <span className="field-label">
                      Confirmar contraseña *
                    </span>


                    <span className="field-control">

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


                      <input
                        name="confirm"
                        type="password"
                        value={
                          form.confirm
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="Repite tu contraseña"
                        autoComplete="new-password"
                      />

                    </span>


                    <span className="field-message">
                      {errors.confirm}
                    </span>

                  </label>


                  {/* MEDIDOR */}

                  <div
                    className="password-meter"
                    data-strength={
                      strength
                    }
                  >

                    <div>

                      {[0, 1, 2, 3].map(
                        (index) => (

                          <span
                            key={
                              index
                            }
                            className={
                              index < strength
                                ? `active level-${strength}`
                                : ''
                            }
                          >
                          </span>

                        )
                      )}

                    </div>


                    <small>

                      Seguridad:{' '}

                      <strong>
                        {
                          strengthLabels[
                            strength
                          ]
                        }
                      </strong>

                    </small>

                  </div>

                </>

              )}

            </div>

          </div>


          {/* ============================================ */}
          {/* CONSENTIMIENTOS */}
          {/* ============================================ */}

          <div className="consents">

            <label className="check">

              <input
                name="terms"
                type="checkbox"
                checked={
                  form.terms
                }
                onChange={
                  handleChange
                }
              />


              <span>

                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="m5 12 4 4L19 6" />
                </svg>

              </span>


              <em>

                Acepto los{' '}

                <a href="#terminos">
                  términos y condiciones
                </a>{' '}

                y el tratamiento de datos.

              </em>

            </label>


            <small>
              {errors.terms}
            </small>


            <label className="check">

              <input
                name="adult"
                type="checkbox"
                checked={
                  form.adult
                }
                onChange={
                  handleChange
                }
              />


              <span>

                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="m5 12 4 4L19 6" />
                </svg>

              </span>


              <em>
                Confirmo que soy mayor de 18 años
                y jugaré responsablemente.
              </em>

            </label>


            <small>
              {errors.adult}
            </small>

          </div>


          {/* ============================================ */}
          {/* ERROR GENERAL */}
          {/* ============================================ */}

          {errors.general && (

            <p className="field-message">
              {errors.general}
            </p>

          )}


          {/* ============================================ */}
          {/* CREAR CUENTA */}
          {/* ============================================ */}

          <button
            className="primary wide"
            type="submit"
            disabled={
              cargando
            }
          >

            {cargando
              ? 'Creando tu cuenta...'
              : esRegistroGoogle
                ? 'Completar registro con Google'
                : 'Crear mi cuenta'}


            {!cargando && (

              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>

            )}

          </button>


          <p className="register-login">

            ¿Ya tienes una cuenta?{' '}


            <button
              type="button"
              onClick={
                onGoLogin
              }
            >
              Inicia sesión
            </button>

          </p>

        </form>

      </section>

    </main>
  )
}


export default Register