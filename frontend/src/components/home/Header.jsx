import {
  useEffect,
  useRef,
  useState,
} from 'react'

import logo from '../../assets/logo.svg'


function Header({
  usuario,
  onCerrarSesion,
  search,
  onSearchChange,
  onNotify,
  saldoDisponible,
  vista,
  onVerInicio,
  onVerMisApuestas,
  onVerAdministracion,
}) {
  const [
    perfilAbierto,
    setPerfilAbierto,
  ] = useState(false)

  const profileRef =
    useRef(null)


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

  const puedeAdministrar =
  [1, 2].includes(
    Number(usuario?.rolId)
  )

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

            onClick={() =>
              onNotify?.(
                'La recarga está lista para conectarse a un sistema de pagos.'
              )
            }
          >
            Recargar
          </button>


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
                {usuario?.correo
                  ?.substring(0, 2)
                  .toUpperCase() ||
                  'US'}
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

                <strong>
                  {usuario?.correo ||
                    'Usuario'}
                </strong>


                <small>
                  {rolNombre}
                </small>


                <button
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

                  Cerrar sesión

                </button>

              </div>
            )}

          </div>

        </div>

      </header>

    </>
  )
}

export default Header