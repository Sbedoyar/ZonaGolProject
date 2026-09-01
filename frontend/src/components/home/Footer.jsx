import logo from '../../assets/logo.svg'

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        {/* MARCA */}
        <div className="footer-brand">
          <a
            className="brand brand--inverse"
            href="#inicio"
            aria-label="Zona Gol, inicio"
          >
            <img src={logo} alt="" />

            <span>
              ZONA<b>GOL</b>
            </span>
          </a>

          <p>
            Apuestas de fútbol nacional, claras y sin complicaciones.
            Cuotas de la Liga BetPlay y la Copa Colombia.
          </p>

          <div
            className="footer-social"
            aria-label="Redes sociales"
          >
            <button
              type="button"
              aria-label="Instagram"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <rect
                  x="3"
                  y="3"
                  width="18"
                  height="18"
                  rx="5"
                />
                <circle cx="12" cy="12" r="4" />
                <path d="M17.5 6.5h.01" />
              </svg>
            </button>

            <button
              type="button"
              aria-label="X"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m5 4 14 16M19 4 5 20" />
              </svg>
            </button>

            <button
              type="button"
              aria-label="YouTube"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M21 12c0 3.1-.4 5.2-.8 6-.3.6-.8 1-1.5 1.2-1.5.4-5.1.5-6.7.5s-5.2-.1-6.7-.5A2.2 2.2 0 0 1 3.8 18c-.4-.8-.8-2.9-.8-6s.4-5.2.8-6c.3-.6.8-1 1.5-1.2C6.8 4.4 10.4 4.3 12 4.3s5.2.1 6.7.5c.7.2 1.2.6 1.5 1.2.4.8.8 2.9.8 6Z" />
                <path d="m10 9 5 3-5 3V9Z" />
              </svg>
            </button>
          </div>
        </div>

        {/* LEGAL */}
        <nav
          className="footer-column"
          aria-label="Enlaces legales"
        >
          <h2>Legal</h2>

          <a href="#">
            Términos y condiciones
          </a>

          <a href="#">
            Política de privacidad
          </a>

          <a href="#responsible">
            Juego responsable
          </a>
        </nav>

        {/* SOPORTE */}
        <nav
          className="footer-column"
          aria-label="Enlaces de soporte"
        >
          <h2>Soporte</h2>

          <button type="button">
            Centro de ayuda
          </button>

          <button type="button">
            Contacto
          </button>

          <button type="button">
            Preguntas frecuentes
          </button>
        </nav>

        {/* ZONA GOL */}
        <nav
          className="footer-column"
          aria-label="Enlaces de Zona Gol"
        >
          <h2>Zona Gol</h2>

          <a href="#partidos">
            Partidos
          </a>

          <button type="button">
            Promociones
          </button>

          <button type="button">
            Mis apuestas
          </button>
        </nav>
      </div>

      <div className="footer-bottom">
        <p>
          © 2026 Zona Gol. Todos los derechos reservados.
        </p>

        <span>
          <i></i>
          Solo para mayores de <strong>18 años</strong>
          <b>·</b>
          Juega con responsabilidad.
        </span>
      </div>
    </footer>
  )
}

export default Footer