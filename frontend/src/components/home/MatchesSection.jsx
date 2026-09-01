import { useState } from 'react'
import MatchCard from './MatchCard'
import BetSlip from './BetSlip'
import MobileBetSlip from './MobileBetSlip'

const MATCHES = [
  {
    id: 'p1',
    league: 'liga',
    leagueName: 'Liga BetPlay',
    home: 'Atlético Nacional',
    away: 'Millonarios F. C.',
    homeCode: 'NAL',
    awayCode: 'MIL',
    day: 'today',
    status: 'scheduled',
    time: '20:10',
    odds: {
      home: 2.05,
      draw: 3.25,
      away: 3.60,
    },
    markets: [
      '+2.5 goles',
      'Ambos marcan',
      'Doble oportunidad',
      '+8.5 córners',
      '+3.5 tarjetas',
    ],
  },
  {
    id: 'p2',
    league: 'liga',
    leagueName: 'Liga BetPlay',
    home: 'Junior F. C.',
    away: 'América de Cali',
    homeCode: 'JUN',
    awayCode: 'AME',
    day: 'today',
    status: 'live',
    time: "63'",
    score: '1 - 1',
    odds: {
      home: 2.40,
      draw: 2.85,
      away: 3.15,
    },
    markets: [
      'Próximo gol',
      'Ambos marcan',
      '+2.5 goles',
      '+9.5 córners',
      'Resultado final',
    ],
  },
  {
    id: 'p3',
    league: 'liga',
    leagueName: 'Liga BetPlay',
    home: 'Independiente Santa Fe',
    away: 'Deportes Tolima',
    homeCode: 'SFE',
    awayCode: 'TOL',
    day: 'upcoming',
    status: 'scheduled',
    time: 'Mañana · 18:30',
    odds: {
      home: 1.95,
      draw: 3.20,
      away: 3.95,
    },
    markets: [
      '-2.5 goles',
      'Ambos marcan',
      'Doble oportunidad',
      '+7.5 córners',
      '+4.5 tarjetas',
    ],
  },
  {
    id: 'p4',
    league: 'copa',
    leagueName: 'Copa BetPlay',
    home: 'Once Caldas',
    away: 'Independiente Medellín',
    homeCode: 'ONC',
    awayCode: 'DIM',
    day: 'upcoming',
    status: 'scheduled',
    time: 'Sáb · 16:00',
    odds: {
      home: 2.30,
      draw: 3.05,
      away: 3.05,
    },
    markets: [
      '+1.5 goles',
      'Ambos marcan',
      'Doble oportunidad',
      '+8.5 córners',
      'Primer goleador',
    ],
  },
  {
    id: 'p5',
    league: 'copa',
    leagueName: 'Copa BetPlay',
    home: 'Deportivo Cali',
    away: 'La Equidad',
    homeCode: 'CAL',
    awayCode: 'EQU',
    day: 'upcoming',
    status: 'scheduled',
    time: 'Dom · 19:20',
    odds: {
      home: 2.15,
      draw: 3.10,
      away: 3.35,
    },
    markets: [
      '+2.5 goles',
      'Ambos marcan',
      'Doble oportunidad',
      '+10.5 córners',
      '+3.5 tarjetas',
    ],
  },
]

function MatchesSection({
  search,
  onClearSearch,
  onNotify,
}) {
  const [picks, setPicks] = useState({})
  const [stake, setStake] = useState(0)

  const [league, setLeague] = useState('all')
  const [timeFilter, setTimeFilter] = useState('all')
  const [sort, setSort] = useState('time')

  const handlePick = (matchId, outcome) => {
    const match = MATCHES.find(
      (item) => item.id === matchId
    )

    if (!match) return

    setPicks((prevPicks) => {
      const currentPick = prevPicks[matchId]

      // Si toca nuevamente la misma cuota,
      // se elimina del cupón.
      if (currentPick?.outcome === outcome) {
        const nuevosPicks = {
          ...prevPicks,
        }

        delete nuevosPicks[matchId]

        return nuevosPicks
      }

      const labels = {
        home: `Gana ${match.home}`,
        draw: 'Empate',
        away: `Gana ${match.away}`,
      }

      return {
        ...prevPicks,

        [matchId]: {
          matchId,
          outcome,
          match: `${match.home} vs ${match.away}`,
          label: labels[outcome],
          odd: match.odds[outcome],
        },
      }
    })
  }

  const handleRemovePick = (matchId) => {
    setPicks((prevPicks) => {
      const nuevosPicks = {
        ...prevPicks,
      }

      delete nuevosPicks[matchId]

      return nuevosPicks
    })
  }

  const handleStakeChange = (value) => {
    const nuevoValor = Math.max(
      0,
      Number(value) || 0
    )

    setStake(nuevoValor)
  }

  const handlePlaceBet = () => {
    if (stake < 1000) {
      onNotify?.(
        'Ingresa un valor mínimo de $1.000 para continuar.'
      )

      return false
    }

    onNotify?.(
      'Apuesta simulada correctamente. No se realizó ningún cobro real.'
    )

    setPicks({})
    setStake(0)

    return true
  }

  const filteredMatches = MATCHES
    .filter((match) => {
      const query = search
        ?.trim()
        .toLowerCase()

      if (query) {
        const textoPartido = `
          ${match.home}
          ${match.away}
          ${match.leagueName}
        `.toLowerCase()

        if (!textoPartido.includes(query)) {
          return false
        }
      }

      if (
        league !== 'all' &&
        match.league !== league
      ) {
        return false
      }

      if (
        timeFilter === 'today' &&
        match.day !== 'today'
      ) {
        return false
      }

      if (
        timeFilter === 'live' &&
        match.status !== 'live'
      ) {
        return false
      }

      if (
        timeFilter === 'upcoming' &&
        match.day !== 'upcoming'
      ) {
        return false
      }

      return true
    })
    .sort((a, b) => {
      if (sort === 'highest') {
        const mayorA = Math.max(
          a.odds.home,
          a.odds.draw,
          a.odds.away
        )

        const mayorB = Math.max(
          b.odds.home,
          b.odds.draw,
          b.odds.away
        )

        return mayorB - mayorA
      }

      return 0
    })

  const limpiarFiltros = () => {
    setLeague('all')
    setTimeFilter('all')
    setSort('time')
    onClearSearch?.()
  }

  return (
    <section
      id="partidos"
      className="betting-layout"
    >
      <div className="matches-column">

        <header className="section-heading">
          <div>
            <span className="eyebrow">
              <i></i>
              FÚTBOL NACIONAL
            </span>

            <h2>
              Partidos y apuestas
            </h2>

            <p>
              Selecciona una cuota para agregarla a tu cupón.
            </p>
          </div>

          <span className="date-label">
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

            Hoy, 13 ago
          </span>
        </header>

        <div className="filters-panel">

          <label className="filter-select">
            <small>
              LIGA
            </small>

            <span>
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M8 4h8v5a4 4 0 0 1-8 0V4ZM8 6H4v2a4 4 0 0 0 4 4M16 6h4v2a4 4 0 0 1-4 4M12 13v4M8 21h8M9 17h6" />
              </svg>

              <select
                value={league}
                onChange={(event) =>
                  setLeague(event.target.value)
                }
              >
                <option value="all">
                  Todas las ligas
                </option>

                <option value="liga">
                  Liga BetPlay
                </option>

                <option value="copa">
                  Copa BetPlay
                </option>
              </select>
            </span>
          </label>

          <div
            className="filter-chips"
            role="group"
            aria-label="Filtrar partidos por fecha"
          >
            <button
              className={
                timeFilter === 'all'
                  ? 'active'
                  : ''
              }
              type="button"
              onClick={() =>
                setTimeFilter('all')
              }
            >
              Todos
            </button>

            <button
              className={
                timeFilter === 'today'
                  ? 'active'
                  : ''
              }
              type="button"
              onClick={() =>
                setTimeFilter('today')
              }
            >
              Hoy
            </button>

            <button
              className={
                timeFilter === 'live'
                  ? 'active'
                  : ''
              }
              type="button"
              onClick={() =>
                setTimeFilter('live')
              }
            >
              <i></i>
              En vivo
            </button>

            <button
              className={
                timeFilter === 'upcoming'
                  ? 'active'
                  : ''
              }
              type="button"
              onClick={() =>
                setTimeFilter('upcoming')
              }
            >
              Próximos
            </button>
          </div>

          <label className="sort-select">
            <span>
              Ordenar por
            </span>

            <select
              value={sort}
              onChange={(event) =>
                setSort(event.target.value)
              }
            >
              <option value="time">
                Hora
              </option>

              <option value="highest">
                Cuota más alta
              </option>
            </select>
          </label>

        </div>

        <div className="results-row">
          <span>
            {filteredMatches.length}{' '}

            {filteredMatches.length === 1
              ? 'partido disponible'
              : 'partidos disponibles'}
          </span>

          <button
            type="button"
            onClick={limpiarFiltros}
          >
            Limpiar filtros
          </button>
        </div>

        <div
          className="match-list"
          aria-live="polite"
        >
          {filteredMatches.length > 0 ? (
            filteredMatches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                selectedPick={
                  picks[match.id]
                }
                onPick={handlePick}
              />
            ))
          ) : (
            <div className="empty-results">
              <strong>
                No encontramos partidos
              </strong>

              <p>
                Prueba con otra liga, fecha o búsqueda.
              </p>
            </div>
          )}
        </div>

      </div>

      <aside
        className="slip-slot"
        aria-label="Cupón de apuestas"
      >
        <BetSlip
          picks={picks}
          stake={stake}
          onStakeChange={handleStakeChange}
          onRemovePick={handleRemovePick}
          onPlaceBet={handlePlaceBet}
        />
      </aside>

      <MobileBetSlip
        picks={picks}
        stake={stake}
        onStakeChange={handleStakeChange}
        onRemovePick={handleRemovePick}
        onPlaceBet={handlePlaceBet}
      />

    </section>
  )
}

export default MatchesSection