import { useEffect, useRef, useState } from 'react'
import logo from '../../assets/logo.svg'

function Header({
  usuario,
  onCerrarSesion,
  search,
  onSearchChange,
  onNotify,
}) {
  const [perfilAbierto, setPerfilAbierto] = useState(false)

  const profileRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setPerfilAbierto(false)
      }
    }

    document.addEventListener('click', handleClickOutside)

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
          <strong>18+</strong> Juega con responsabilidad
        </span>

        <a href="#responsible">
          Conoce tus límites
        </a>
      </div>

      <header className="site-header">
        <a
          className="brand"
          href="#inicio"
          aria-label="Zona Gol, inicio"
        >
          <img src={logo} alt="" />

          <span>
            ZONA<b>GOL</b>
          </span>
        </a>

        <nav
          className="main-nav"
          aria-label="Navegación principal"
        >
          <a
            className="active"
            href="#inicio"
          >
            Inicio
          </a>

          <a href="#partidos">
            Partidos
          </a>

          <button
            type="button"
            onClick={() =>
              onNotify?.(
                'Aún no tienes apuestas activas.'
              )
            }
          >
            Mis apuestas
          </button>

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
              onSearchChange(event.target.value)
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

            <span aria-hidden="true"></span>
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
                $125.000
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
              aria-expanded={perfilAbierto}
              onClick={() =>
                setPerfilAbierto(
                  !perfilAbierto
                )
              }
            >
              <span>
                {usuario?.correo
                  ?.substring(0, 2)
                  .toUpperCase() || 'US'}
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
                  {usuario?.correo || 'Usuario'}
                </strong>

                <small>
                  Cuenta de demostración
                </small>

                <button
                  type="button"
                  onClick={() => {
                    setPerfilAbierto(false)
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