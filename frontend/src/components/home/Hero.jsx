function Hero() {
  return (
    <section
      id="inicio"
      className="home-hero"
      aria-labelledby="featured-title"
    >
      <div className="hero-field" aria-hidden="true">
        <span></span>
        <i></i>
        <b></b>
        <em></em>
      </div>

      <div className="hero-copy">
        <span className="hero-kicker">
          <i></i>
          PARTIDO DESTACADO · HOY 8:10 P. M.
        </span>

        <h1 id="featured-title">
          La rivalidad que
          <br />
          <em>mueve al país</em>
        </h1>

        <p>
          Atlético Nacional y Millonarios se enfrentan
          por una noche inolvidable.
        </p>

        <button
          id="hero-bet"
          className="button button--gold"
          type="button"
            onClick={() => {
                document
                    .getElementById('partidos')
                    ?.scrollIntoView({ behavior: 'smooth' })
            }}
        >
          Ver cuotas

          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      </div>

      <div
        className="hero-match"
        aria-label="Atlético Nacional contra Millonarios"
      >
        <div className="hero-team">
          <span className="team-crest team-crest--green">
            NAL
          </span>

          <strong>
            Atlético
            <br />
            Nacional
          </strong>
        </div>

        <div className="hero-time">
          <small>Comienza en</small>
          <strong id="countdown">
            01 : 24 : 38
          </strong>
          <span>8:10 P. M.</span>
        </div>

        <div className="hero-team">
          <span className="team-crest team-crest--blue">
            MIL
          </span>

          <strong>
            Millonarios
            <br />
            F. C.
          </strong>
        </div>
      </div>

      <div className="hero-bonus">
        <span>BONO DE BIENVENIDA</span>
        <strong>Hasta $50.000</strong>
        <small>en apuesta gratis*</small>
      </div>
    </section>
  )
}

export default Hero