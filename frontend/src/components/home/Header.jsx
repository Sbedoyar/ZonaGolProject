import {
  useEffect,
  useRef,
  useState,
} from 'react'

import logo from '../../assets/logo.svg'

import {
  prepararRecargaWompi,
  actualizarFotoPerfil,
  obtenerFotoPerfil,
  obtenerSaldo,
} from '../../services/authService'

function Header({
  usuario,
  onCerrarSesion,
  search,
  onSearchChange,
  onNotify,
  saldoDisponible,
  onSaldoActualizado,
  vista,
  onVerInicio,
  onVerMisApuestas,
  onVerAdministracion,
}) {
  const [
    perfilAbierto,
    setPerfilAbierto,
  ] = useState(false)

  const [
    recargando,
    setRecargando,
  ] = useState(false)

  const [
    recargaModalAbierto,
    setRecargaModalAbierto,
  ] = useState(false)

  const [
    montoRecarga,
    setMontoRecarga,
  ] = useState('')

  const [
    subiendoFoto,
    setSubiendoFoto,
  ] = useState(false)

  const fotoInputRef =
    useRef(null)

  const profileRef =
    useRef(null)

  const [
    fotoPerfilUrl,
    setFotoPerfilUrl,
  ] = useState(null)

  const [
    perfilModalAbierto,
    setPerfilModalAbierto,
  ] = useState(false)


  const saldoFormateado =
    saldoDisponible !== null &&
    saldoDisponible !== undefined
      ? `$${Number(
          saldoDisponible
        ).toLocaleString('es-CO')}`
      : '...'

  const rolNombre = {
    1: 'Administrador',
    2: 'Operador',
    3: 'Cliente',
  }[usuario?.rolId] || 'Usuario'

  const rolId =
    Number(usuario?.rolId)

  const esCliente =
    rolId === 3

  const puedeAdministrar =
    [1, 2].includes(rolId)

  useEffect(() => {

    const handleClickOutside = (
      event
    ) => {

      if (
        profileRef.current &&
        !profileRef.current.contains(
          event.target
        )
      ) {
        setPerfilAbierto(false)
      }
    }


    document.addEventListener(
      'click',
      handleClickOutside
    )


    return () => {

      document.removeEventListener(
        'click',
        handleClickOutside
      )
    }

  }, [])

  useEffect(() => {

    let urlTemporal = null
    let activo = true


    const cargarFotoPerfil = async () => {

      if (!usuario?.tieneFotoPerfil) {

        setFotoPerfilUrl(null)

        return
      }


      try {

        const blob =
          await obtenerFotoPerfil()


        if (!activo) {
          return
        }


        urlTemporal =
          URL.createObjectURL(blob)


        setFotoPerfilUrl(
          urlTemporal
        )

      } catch (error) {

        console.error(
          'No fue posible cargar la foto de perfil:',
          error
        )


        if (activo) {
          setFotoPerfilUrl(null)
        }
      }
    }


    cargarFotoPerfil()


    return () => {

      activo = false


      if (urlTemporal) {
        URL.revokeObjectURL(
          urlTemporal
        )
      }
    }

  }, [
    usuario?.id,
    usuario?.tieneFotoPerfil,
  ])

  const handleCambiarFoto = async (
    event
  ) => {

    const archivo =
      event.target.files?.[0]


    if (!archivo) {
      return
    }


    try {

      setSubiendoFoto(true)


      const resultado =
        await actualizarFotoPerfil(
          archivo
        )


      // Volver a obtener la foto recién actualizada.
      const nuevoBlob =
        await obtenerFotoPerfil()


      const nuevaUrl =
        URL.createObjectURL(
          nuevoBlob
        )


      // Liberar la URL anterior para evitar
      // mantener Blobs innecesarios en memoria.
      setFotoPerfilUrl(
        urlAnterior => {

          if (urlAnterior) {
            URL.revokeObjectURL(
              urlAnterior
            )
          }

          return nuevaUrl
        }
      )


      if (onNotify) {
        onNotify(
          resultado.message ||
            'Foto de perfil actualizada correctamente',
          'success'
        )
      }


    } catch (error) {

      if (onNotify) {
        onNotify(
          error.message ||
            'No fue posible actualizar la foto de perfil',
          'error'
        )
      }

    } finally {

      setSubiendoFoto(false)


      if (fotoInputRef.current) {
        fotoInputRef.current.value = ''
      }
    }
  }

  const handleRecargar = async () => {

    const monto =
      Number(montoRecarga)


    if (
      !Number.isFinite(monto) ||
      monto <= 0
    ) {

      onNotify?.(
        'Ingresa un monto de recarga válido.'
      )

      return
    }


    if (
      typeof window.WidgetCheckout !==
      'function'
    ) {

      onNotify?.(
        'No fue posible cargar el checkout de Wompi.'
      )

      return
    }


    try {

      setRecargando(true)


      const respuesta =
        await prepararRecargaWompi(
          monto
        )


      const datos =
        respuesta.datos

      setRecargaModalAbierto(false)

      const checkout =
        new window.WidgetCheckout({
          currency:
            datos.moneda,

          amountInCents:
            datos.montoEnCentavos,

          reference:
            datos.referencia,

          publicKey:
            datos.publicKey,

          signature: {
            integrity:
              datos.firmaIntegridad,
          },
        })


      checkout.open(
        (resultado) => {

          const transaccion =
            resultado?.transaction


          if (!transaccion) {

            onNotify?.(
              'El checkout de Wompi fue cerrado.'
            )

            return
          }


          console.log(
            'Wompi - transacción recibida:',
            {
              id:
                transaccion.id,

              status:
                transaccion.status,

              reference:
                transaccion.reference,
            }
          )


          onNotify?.(
            `Wompi respondió con estado: ${
              transaccion.status ||
              'desconocido'
            }`
          )
          if (
            transaccion.status ===
            'APPROVED'
          ) {

            setTimeout(
              async () => {

                try {

                  const respuestaSaldo =
                    await obtenerSaldo()


                  onSaldoActualizado?.(
                    respuestaSaldo.datos
                      .saldoDisponible
                  )

                } catch (error) {

                  console.error(
                    'Error actualizando saldo después de Wompi:',
                    error
                  )
                }

              },
              1500
            )
          }
        }
      )

    } catch (error) {

      console.error(
        'Error iniciando recarga Wompi:',
        error
      )


      onNotify?.(
        error.message ||
        'No fue posible iniciar la recarga.'
      )

    } finally {

      setRecargando(false)
    }
  }


  return (
    <>

      <div className="responsible-bar">

        <span>
          <strong>
            18+
          </strong>{' '}

          Juega con responsabilidad
        </span>

        <a href="#responsible">
          Conoce tus límites
        </a>

      </div>


      <header className="site-header">

        <button
          className="brand header-brand-button"
          type="button"
          aria-label="Zona Gol, inicio"
          onClick={
            onVerInicio
          }
        >
          <img
            src={logo}
            alt=""
          />

          <span>
            ZONA<b>GOL</b>
          </span>
        </button>


        <nav
          className="main-nav"
          aria-label="Navegación principal"
        >

          <button
            className={
              vista === 'inicio'
                ? 'active'
                : ''
            }
            type="button"
            onClick={
              onVerInicio
            }
          >
            Inicio
          </button>


          <a
            href="#partidos"
            onClick={
              onVerInicio
            }
          >
            Partidos
          </a>


          {esCliente && (
            <button
              className={
                vista === 'apuestas'
                  ? 'active'
                  : ''
              }
              type="button"
              onClick={
                onVerMisApuestas
              }
            >
              Mis apuestas
            </button>
          )}
          {puedeAdministrar && (
          <button
            className={
              vista === 'administracion'
                ? 'active'
                : ''
            }
            type="button"
            onClick={
              onVerAdministracion
            }
          >
            Administración
          </button>
        )}


          {esCliente && (
            <button
              type="button"
              onClick={() =>
                onNotify?.(
                  'Próximamente encontrarás aquí las promociones disponibles.'
                )
              }
            >
              Promociones
            </button>
          )}


          <a href="#responsible">
            Ayuda
          </a>

        </nav>


        <label className="header-search">

          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              cx="11"
              cy="11"
              r="7"
            />

            <path d="m20 20-4-4" />
          </svg>


          <input
            type="search"

            placeholder="Buscar equipo, liga o partido..."

            value={search}

            onChange={(event) =>
              onSearchChange(
                event.target.value
              )
            }
          />

        </label>


        <div className="header-actions">

          <button
            className="notification-button"
            type="button"
            aria-label="Ver notificaciones"

            onClick={() =>
              onNotify?.(
                'No tienes notificaciones nuevas.'
              )
            }
          >

            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
            </svg>

            <span
              aria-hidden="true"
            ></span>

          </button>


          {esCliente && (
            <>
              <div className="balance">

                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M4 6h14a2 2 0 0 1 2 2v11H4a2 2 0 0 1-2-2V6a3 3 0 0 1 3-3h12M16 12h6v4h-6a2 2 0 0 1 0-4Z" />
                </svg>


                <span>

                  <small>
                    Saldo disponible
                  </small>

                  <strong>
                    {saldoFormateado}
                  </strong>

                </span>

              </div>


              <button
                className="button button--gold button--small"
                type="button"

                disabled={recargando}

               onClick={() => {
                setMontoRecarga('')
                setRecargaModalAbierto(true)
              }}
              >
                {recargando
                  ? 'Cargando...'
                  : 'Recargar'}
              </button>
            </>
          )}


          <div
            className="profile-menu"
            ref={profileRef}
          >

            <button
              className="profile-trigger"
              type="button"

              aria-expanded={
                perfilAbierto
              }

              onClick={() =>
                setPerfilAbierto(
                  !perfilAbierto
                )
              }
            >

              <span>
                {fotoPerfilUrl ? (
                  <img
                    src={fotoPerfilUrl}
                    alt="Foto de perfil"
                  />
                ) : (
                  usuario?.correo
                    ?.substring(0, 2)
                    .toUpperCase() ||
                  'US'
                )}
              </span>


              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="m9 10 3 3 3-3" />
              </svg>

            </button>


            {perfilAbierto && (

              <div className="profile-dropdown">

                <div className="profile-dropdown-header">

                  <div className="profile-dropdown-avatar">
                    {fotoPerfilUrl ? (
                      <img
                        src={fotoPerfilUrl}
                        alt="Foto de perfil"
                      />
                    ) : (
                      usuario?.correo
                        ?.substring(0, 2)
                        .toUpperCase() ||
                      'US'
                    )}
                  </div>

                  <div className="profile-dropdown-info">

                    <span className="profile-dropdown-label">
                      MI CUENTA
                    </span>

                    <strong>
                      {usuario?.correo ||
                        'Usuario'}
                    </strong>

                    <small>
                      {rolNombre}
                    </small>

                  </div>

                </div>

                <button
                  type="button"
                  className="profile-view"
                  onClick={() => {
                    setPerfilAbierto(false)
                    setPerfilModalAbierto(true)
                  }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle
                      cx="12"
                      cy="8"
                      r="4"
                    />
                    <path d="M4 21a8 8 0 0 1 16 0" />
                  </svg>

                  <span>Ver perfil</span>
                </button>


                <button
                  type="button"
                  className="profile-action"
                  disabled={subiendoFoto}
                  onClick={() => {
                    fotoInputRef.current?.click()
                  }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M14.5 4l1.4 2H19a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3.1l1.4-2h5z" />
                    <circle
                      cx="12"
                      cy="12.5"
                      r="3.5"
                    />
                  </svg>

                  <span>
                    {subiendoFoto
                      ? 'Actualizando foto...'
                      : 'Cambiar foto'}
                  </span>
                </button>


                <div className="profile-dropdown-divider" />


                <button
                  className="profile-logout"
                  type="button"

                  onClick={() => {

                    setPerfilAbierto(
                      false
                    )

                    onCerrarSesion()
                  }}
                >

                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M10 17l5-5-5-5M15 12H3M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5" />
                  </svg>

                  <span>Cerrar sesión</span>

                </button>

              </div>
            )}

          </div>

        </div>

      </header>

      {perfilModalAbierto && (

        <div
          className="profile-modal-overlay"
          onMouseDown={(event) => {

            if (
              event.target ===
              event.currentTarget
            ) {
              setPerfilModalAbierto(false)
            }

          }}
        >

          <div
            className="profile-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Perfil de usuario"
          >

            <button
              type="button"
              className="profile-modal-close"
              aria-label="Cerrar perfil"
              onClick={() =>
                setPerfilModalAbierto(false)
              }
            >
              ×
            </button>


            <div className="profile-modal-avatar">

              {fotoPerfilUrl ? (

                <img
                  src={fotoPerfilUrl}
                  alt="Foto de perfil"
                />

              ) : (

                usuario?.correo
                  ?.substring(0, 2)
                  .toUpperCase() ||
                'US'

              )}

            </div>


            <span className="profile-modal-label">
              MI PERFIL
            </span>


            <h2>
              {usuario?.correo ||
                'Usuario'}
            </h2>


            <span className="profile-modal-role">
              {rolNombre}
            </span>


            <div className="profile-modal-info">

              <div>
                <span>Correo electrónico</span>

                <strong>
                  {usuario?.correo ||
                    'No registrado'}
                </strong>
              </div>


              <div>
                <span>Celular</span>

                <strong>
                  {usuario?.celular ||
                    'No registrado'}
                </strong>
              </div>


              <div>
                <span>Tipo de cuenta</span>

                <strong>
                  {rolNombre}
                </strong>
              </div>


              <div>
                <span>Miembro desde</span>

                <strong>
                  {usuario?.fechaRegistro
                    ? new Date(
                        usuario.fechaRegistro
                      ).toLocaleDateString(
                        'es-CO',
                        {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                        }
                      )
                    : 'No disponible'}
                </strong>
              </div>

            </div>


            <button
              type="button"
              className="profile-modal-photo-button"
              disabled={subiendoFoto}
              onClick={() => {
                fotoInputRef.current?.click()
              }}
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M14.5 4l1.4 2H19a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3.1l1.4-2h5z" />

                <circle
                  cx="12"
                  cy="12.5"
                  r="3.5"
                />
              </svg>

              <span>
                {subiendoFoto
                  ? 'Actualizando...'
                  : 'Cambiar foto'}
              </span>
            </button>

          </div>

        </div>

      )}

            {recargaModalAbierto && (
        <div
          className="recharge-modal-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !recargando) {
              setRecargaModalAbierto(false)
            }
          }}
        >
          <div
            className="recharge-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="recharge-modal-title"
          >
            <button
              type="button"
              className="recharge-modal-close"
              aria-label="Cerrar"
              disabled={recargando}
              onClick={() => {
                setRecargaModalAbierto(false)
              }}
            >
              ×
            </button>

            <div className="recharge-modal-icon">
              $
            </div>

            <div className="recharge-modal-heading">
              <span className="recharge-modal-eyebrow">
                ZONAGOL
              </span>

              <h2 id="recharge-modal-title">
                Recargar saldo
              </h2>

              <p>
                Elige cuánto quieres agregar a tu saldo.
                El pago se procesará de forma segura con Wompi.
              </p>
            </div>

            <div className="recharge-modal-field">
              <label htmlFor="monto-recarga">
                Monto a recargar
              </label>

              <div className="recharge-modal-input">
                <span>$</span>

                <input
                  id="monto-recarga"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="50.000"
                  value={
                    montoRecarga
                      ? Number(montoRecarga).toLocaleString('es-CO')
                      : ''
                  }
                  disabled={recargando}
                  onChange={(event) => {
                    const soloNumeros =
                      event.target.value.replace(/\D/g, '')

                    setMontoRecarga(soloNumeros)
                  }}
                />

                <strong>COP</strong>
              </div>
            </div>

            <div className="recharge-modal-quick">
              {[10000, 20000, 50000].map((monto) => (
                <button
                  key={monto}
                  type="button"
                  disabled={recargando}
                  className={
                    Number(montoRecarga) === monto
                      ? 'active'
                      : ''
                  }
                  onClick={() => {
                    setMontoRecarga(String(monto))
                  }}
                >
                  ${monto.toLocaleString('es-CO')}
                </button>
              ))}
            </div>

            <div className="recharge-modal-summary">
              <span>Valor de la recarga</span>

              <strong>
                {montoRecarga && Number(montoRecarga) > 0
                  ? `$${Number(montoRecarga).toLocaleString('es-CO')} COP`
                  : '$0 COP'}
              </strong>
            </div>

            <div className="recharge-modal-actions">
              <button
                type="button"
                className="recharge-modal-cancel"
                disabled={recargando}
                onClick={() => {
                  setRecargaModalAbierto(false)
                }}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="recharge-modal-continue"
                disabled={recargando}
                onClick={handleRecargar}
              >
                {recargando
                  ? 'Preparando pago...'
                  : 'Continuar con Wompi'}
              </button>
            </div>

            <p className="recharge-modal-security">
              Pago procesado de forma segura por Wompi
            </p>
          </div>
        </div>
      )}

      <input
        ref={fotoInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{
          display: 'none',
        }}
        onChange={
          handleCambiarFoto
        }
      />

    </>
  )
}

export default Header