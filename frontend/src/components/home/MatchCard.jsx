import { useState } from 'react'


function MatchCard({
  match,
  selectedPick,
  onPick,
}) {
  const [expandido, setExpandido] =
    useState(false)


  // ============================================================
  // ESTADOS DEL PARTIDO
  // ============================================================

  const enVivo =
    match.status === 'live'

  const finalizado =
    match.status === 'finished'


  // ============================================================
  // TEXTO DEL ESTADO
  // ============================================================

  const obtenerTextoEstado = () => {
    if (finalizado) {
      return 'Finalizado'
    }

    if (enVivo) {
      return 'En vivo'
    }

    if (match.day === 'today') {
      return 'Hoy'
    }

    return 'Próximo'
  }


  // ============================================================
  // BOTÓN DE CUOTA
  // ============================================================

  const crearBotonCuota = (
    outcome,
    shortLabel,
    label
  ) => {
    const seleccionado =
      selectedPick?.outcome === outcome

    const cuota =
      Number(
        match.odds?.[outcome] || 0
      )

    const disponible =
      !finalizado &&
      cuota > 0 &&
      match.optionIds?.[outcome]


    return (
      <button
        className={
          seleccionado
            ? 'odd-button is-selected'
            : 'odd-button'
        }
        type="button"
        aria-pressed={seleccionado}
        disabled={!disponible}
        onClick={() => {
          if (!disponible) {
            return
          }

          onPick(
            match.id,
            outcome
          )
        }}
      >
        <span>
          {shortLabel}

          <small>
            {label}
          </small>
        </span>

        <strong>
          {disponible
            ? cuota.toFixed(2)
            : '—'}
        </strong>
      </button>
    )
  }


  return (
    <article
      className={
        expandido
          ? 'match-card is-expanded'
          : 'match-card'
      }
    >

      {/* ======================================================
          ENCABEZADO
         ====================================================== */}

      <header className="match-card__top">

        <span className="match-card__league">
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M8 4h8v5a4 4 0 0 1-8 0V4ZM8 6H4v2a4 4 0 0 0 4 4M16 6h4v2a4 4 0 0 1-4 4" />
          </svg>

          {match.leagueName}
        </span>


        <span
          className={
            enVivo
              ? 'match-status match-status--live'
              : 'match-status'
          }
        >
          {enVivo && (
            <i></i>
          )}

          {obtenerTextoEstado()}
        </span>

      </header>


      {/* ======================================================
          CUERPO
         ====================================================== */}

      <div className="match-card__body">

        <div className="match-teams">

          {/* EQUIPO LOCAL */}

          <div className="match-team">
            <span className="match-team__badge">
              <img
                src={`http://localhost:5000/api/postgres/equipos/${match.homeId}/logo`}
                alt={`Escudo de ${match.home}`}
              />
            </span>

            <strong>
              {match.home}
            </strong>
          </div>


          {/* EQUIPO VISITANTE */}

          <div className="match-team">
            <span className="match-team__badge">
              <img
                src={`http://localhost:5000/api/postgres/equipos/${match.awayId}/logo`}
                alt={`Escudo de ${match.away}`}
              />
            </span>

            <strong>
              {match.away}
            </strong>
          </div>


          {/* INFORMACIÓN DEL PARTIDO */}

          <div className="match-meta">

            <span>
              {enVivo
                ? `Minuto ${match.time}`
                : match.time}
            </span>


            <b>
              {!finalizado && (
                <b>
                  {enVivo
                    ? match.score
                    : '1 · X · 2'}
                </b>
              )}
            </b>

          </div>

        </div>


        {/* ====================================================
            PARTIDO FINALIZADO
           ==================================================== */}

        {finalizado ? (

          <div className="odds-grid">

            <button
              className="odd-button"
              type="button"
              disabled
            >
              <span>
                1

                <small>
                  Gana local
                </small>
              </span>

              <strong>
                Cerrado
              </strong>
            </button>


            <button
              className="odd-button"
              type="button"
              disabled
            >
              <span>
                Resultado

                <small>
                  Marcador final
                </small>
              </span>

              <strong>
                {match.score || '—'}
              </strong>
            </button>


            <button
              className="odd-button"
              type="button"
              disabled
            >
              <span>
                2

                <small>
                  Gana visitante
                </small>
              </span>

              <strong>
                Cerrado
              </strong>
            </button>

          </div>

        ) : (

          /* ==================================================
             PARTIDO DISPONIBLE PARA APUESTAS
             ================================================== */

          <div className="odds-grid">

            {crearBotonCuota(
              'home',
              '1',
              'Gana local'
            )}

            {crearBotonCuota(
              'draw',
              'X',
              'Empate'
            )}

            {crearBotonCuota(
              'away',
              '2',
              'Gana visitante'
            )}

          </div>

        )}

      </div>


      {/* ======================================================
          MERCADOS
         ====================================================== */}

      {match.markets.length > 0 && (

        <div className="match-card__markets">

          <div className="market-tags">

            {match.markets.map(
              (market, index) => (

                <span
                  key={market}
                  className={
                    index > 2
                      ? 'market-tag market-tag--extra'
                      : 'market-tag'
                  }
                >
                  {market}
                </span>

              )
            )}

          </div>


          <button
            type="button"
            aria-expanded={expandido}
            onClick={() =>
              setExpandido(
                !expandido
              )
            }
          >
            <span>
              {expandido
                ? 'Ver menos'
                : 'Ver más'}
            </span>

            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="m8 10 4 4 4-4" />
            </svg>
          </button>

        </div>

      )}

    </article>
  )
}


export default MatchCard