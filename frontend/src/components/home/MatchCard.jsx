import { useState } from 'react'

function MatchCard({
  match,
  selectedPick,
  onPick,
}) {
  const [expandido, setExpandido] = useState(false)

  const enVivo = match.status === 'live'

  const crearBotonCuota = (
    outcome,
    shortLabel,
    label
  ) => {
    const seleccionado =
      selectedPick?.outcome === outcome

    return (
      <button
        className={
          seleccionado
            ? 'odd-button is-selected'
            : 'odd-button'
        }
        type="button"
        aria-pressed={seleccionado}
        onClick={() => onPick(match.id, outcome)}
      >
        <span>
          {shortLabel}
          <small>{label}</small>
        </span>

        <strong>
          {match.odds[outcome].toFixed(2)}
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
          {enVivo && <i></i>}

          {enVivo
            ? 'En vivo'
            : match.day === 'today'
              ? 'Hoy'
              : 'Próximo'}
        </span>
      </header>

      <div className="match-card__body">
        <div className="match-teams">
          <div className="match-team">
            <span className="match-team__badge">
              {match.homeCode}
            </span>

            <strong>
              {match.home}
            </strong>
          </div>

          <div className="match-team">
            <span className="match-team__badge">
              {match.awayCode}
            </span>

            <strong>
              {match.away}
            </strong>
          </div>

          <div className="match-meta">
            <span>
              {enVivo
                ? `Minuto ${match.time}`
                : match.time}
            </span>

            <b>
              {enVivo
                ? match.score
                : '1 · X · 2'}
            </b>
          </div>
        </div>

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
      </div>

      <div className="match-card__markets">
        <div className="market-tags">
          {match.markets.map((market, index) => (
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
          ))}
        </div>

        <button
          type="button"
          aria-expanded={expandido}
          onClick={() =>
            setExpandido(!expandido)
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
    </article>
  )
}

export default MatchCard