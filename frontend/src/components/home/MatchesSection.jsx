import { useEffect, useState } from 'react'

import MatchCard from './MatchCard'
import BetSlip from './BetSlip'
import MobileBetSlip from './MobileBetSlip'

import {
  obtenerPartidos,
  obtenerPartidoDetalle,
  realizarApuesta,
} from '../../services/authService'


function MatchesSection({
  search,
  onClearSearch,
  onNotify,
  onSaldoActualizado,
}) {
  const [matches, setMatches] = useState([])
  const [apostando, setApostando] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const [picks, setPicks] = useState({})
  const [stake, setStake] = useState(0)

  const [league, setLeague] = useState('all')

  const [timeFilter, setTimeFilter] =
    useState('all')

  const [sort, setSort] =
    useState('time')


  // ============================================================
  // TEMPORADA SELECCIONADA
  // ============================================================

  const [
    temporadaSeleccionada,
    setTemporadaSeleccionada,
  ] = useState(1)


  // ============================================================
  // JORNADA SELECCIONADA
  // ============================================================

  const [
    jornadaSeleccionada,
    setJornadaSeleccionada,
  ] = useState(1)


  // ============================================================
  // CANTIDAD DE JORNADAS DISPONIBLES
  //
  // Temporada 1 = 2026 académica
  // Temporada 2 = 2024 API-Football
  //
  // De 2024 por ahora únicamente sincronizamos Jornada 1.
  // ============================================================

  const cantidadJornadas =
    temporadaSeleccionada === 1
      ? 19
      : 1


  // ============================================================
  // FORMATEAR FECHA DEL PARTIDO
  // ============================================================

  const formatearFechaPartido = (fecha) => {
    if (!fecha) {
      return ''
    }

    const fechaPartido =
      new Date(fecha)

    return new Intl.DateTimeFormat(
      'es-CO',
      {
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'America/Bogota',
      }
    ).format(fechaPartido)
  }


  // ============================================================
  // OBTENER FECHA COLOMBIA
  // ============================================================

  const obtenerFechaColombia = (fecha) => {
    return new Intl.DateTimeFormat(
      'en-CA',
      {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: 'America/Bogota',
      }
    ).format(fecha)
  }


  // ============================================================
  // DETERMINAR SI EL PARTIDO ES HOY O PRÓXIMO
  // ============================================================

  const obtenerDiaPartido = (fecha) => {
    if (!fecha) {
      return 'upcoming'
    }

    const hoy =
      obtenerFechaColombia(
        new Date()
      )

    const fechaPartido =
      obtenerFechaColombia(
        new Date(fecha)
      )

    if (fechaPartido === hoy) {
      return 'today'
    }

    if (fechaPartido > hoy) {
      return 'upcoming'
    }

    return 'past'
  }


  // ============================================================
  // CARGAR PARTIDOS DE LA TEMPORADA Y JORNADA SELECCIONADAS
  // ============================================================

  useEffect(() => {
    let activo = true

    const cargarPartidos = async () => {
      try {
        setCargando(true)
        setError('')

        const respuesta =
          await obtenerPartidos(
            temporadaSeleccionada,
            jornadaSeleccionada
          )

        const partidosBase =
          respuesta.datos || []


        // ======================================================
        // CONSULTAR DETALLE Y CUOTAS DE LOS PARTIDOS
        // ======================================================

        const respuestasDetalle =
          await Promise.all(
            partidosBase.map(
              (partido) =>
                obtenerPartidoDetalle(
                  partido.partidoid
                )
            )
          )


        // ======================================================
        // ADAPTAR API AL FORMATO DE MATCHCARD
        // ======================================================

        const partidosAdaptados =
          respuestasDetalle.map(
            (respuestaDetalle) => {
              const partido =
                respuestaDetalle.datos

              const opciones =
                partido.opcionesApuesta || []


              const ganadorLocal =
                opciones.find(
                  (opcion) =>
                    opcion.reglaid === 1
                )

              const empate =
                opciones.find(
                  (opcion) =>
                    opcion.reglaid === 2
                )

              const ganadorVisitante =
                opciones.find(
                  (opcion) =>
                    opcion.reglaid === 3
                )


              const markets =
                opciones
                  .filter(
                    (opcion) =>
                      ![1, 2, 3].includes(
                        opcion.reglaid
                      )
                  )
                  .map(
                    (opcion) =>
                      opcion.opcionapuesta
                  )


              let status = 'scheduled'

              if (
                partido.estadopartido ===
                'EN_CURSO'
              ) {
                status = 'live'
              }

              if (
                partido.estadopartido ===
                'FINALIZADO'
              ) {
                status = 'finished'
              }


              return {
                id:
                  partido.partidoid,

                codigo:
                  partido.codigopartido,

                jornada:
                  partido.numerojornada,

                league:
                  'liga',

                leagueName:
                  'Liga BetPlay',

                home:
                  partido.equipolocal,

                away:
                  partido.equipovisitante,

                homeCode:
                  partido.siglalocal,

                awayCode:
                  partido.siglavisitante,

                day:
                  obtenerDiaPartido(
                    partido.fechahorainicio
                  ),

                status,

                time:
                  formatearFechaPartido(
                    partido.fechahorainicio
                  ),

                fechaHoraInicio:
                  partido.fechahorainicio,

                stadium:
                  partido.estadio,

                score:
                  partido.goleslocal !== null &&
                  partido.golesvisitante !== null
                    ? `${partido.goleslocal} - ${partido.golesvisitante}`
                    : null,

                odds: {
                  home:
                    Number(
                      ganadorLocal?.cuota || 0
                    ),

                  draw:
                    Number(
                      empate?.cuota || 0
                    ),

                  away:
                    Number(
                      ganadorVisitante?.cuota || 0
                    ),
                },

                optionIds: {
                  home:
                    ganadorLocal
                      ?.partidoreglaid,

                  draw:
                    empate
                      ?.partidoreglaid,

                  away:
                    ganadorVisitante
                      ?.partidoreglaid,
                },

                markets,
              }
            }
          )


        if (activo) {
          setMatches(
            partidosAdaptados
          )
        }

      } catch (error) {
        console.error(
          'Error cargando partidos:',
          error
        )

        if (activo) {
          setError(
            error.message ||
              'No fue posible cargar los partidos.'
          )
        }

      } finally {
        if (activo) {
          setCargando(false)
        }
      }
    }


    cargarPartidos()


    return () => {
      activo = false
    }

  }, [
    temporadaSeleccionada,
    jornadaSeleccionada,
  ])


  // ============================================================
  // SELECCIONAR CUOTA
  // ============================================================

  const handlePick = (
    matchId,
    outcome
  ) => {
    const match =
      matches.find(
        (item) =>
          item.id === matchId
      )

    if (!match) {
      return
    }


    setPicks((prevPicks) => {
      const currentPick =
        prevPicks[matchId]


      if (
        currentPick?.outcome === outcome
      ) {
        const nuevosPicks = {
          ...prevPicks,
        }

        delete nuevosPicks[matchId]

        return nuevosPicks
      }


      const labels = {
        home:
          `Gana ${match.home}`,

        draw:
          'Empate',

        away:
          `Gana ${match.away}`,
      }


      return {
        ...prevPicks,

        [matchId]: {
          matchId,

          partidoReglaId:
            match.optionIds[outcome],

          outcome,

          match:
            `${match.home} vs ${match.away}`,

          label:
            labels[outcome],

          odd:
            match.odds[outcome],
        },
      }
    })
  }


  // ============================================================
  // QUITAR SELECCIÓN
  // ============================================================

  const handleRemovePick = (
    matchId
  ) => {
    setPicks((prevPicks) => {
      const nuevosPicks = {
        ...prevPicks,
      }

      delete nuevosPicks[matchId]

      return nuevosPicks
    })
  }


  // ============================================================
  // CAMBIAR VALOR DE APUESTA
  // ============================================================

  const handleStakeChange = (
    value
  ) => {
    const nuevoValor =
      Math.max(
        0,
        Number(value) || 0
      )

    setStake(
      nuevoValor
    )
  }


  // ============================================================
  // REALIZAR APUESTA REAL EN MYSQL
  // ============================================================

  const handlePlaceBet = async () => {
    if (apostando) {
      return false
    }


    const selecciones =
      Object.values(picks)


    if (selecciones.length === 0) {
      onNotify?.(
        'Selecciona al menos una cuota.'
      )

      return false
    }


    if (stake < 1000) {
      onNotify?.(
        'Ingresa un valor mínimo de $1.000 para continuar.'
      )

      return false
    }


    const partidoReglaIds =
      selecciones.map(
        (pick) =>
          pick.partidoReglaId
      )


    if (
      partidoReglaIds.some(
        (id) => !id
      )
    ) {
      onNotify?.(
        'Una de las selecciones no es válida.'
      )

      return false
    }


    try {
      setApostando(true)


      const respuesta =
        await realizarApuesta(
          stake,
          partidoReglaIds
        )


      onSaldoActualizado?.(
        respuesta.datos
          .saldoDisponible
      )


      onNotify?.(
        `${respuesta.datos.codigoApuesta} realizada correctamente. Saldo disponible: $${Number(
          respuesta.datos.saldoDisponible
        ).toLocaleString('es-CO')}`
      )


      setPicks({})
      setStake(0)


      return true

    } catch (error) {
      console.error(
        'Error realizando apuesta:',
        error
      )


      onNotify?.(
        error.message ||
          'No fue posible realizar la apuesta.'
      )


      return false

    } finally {
      setApostando(false)
    }
  }


  // ============================================================
  // FILTROS
  // ============================================================

  const filteredMatches =
    matches
      .filter((match) => {
        const query =
          search
            ?.trim()
            .toLowerCase()


        if (query) {
          const textoPartido = `
            ${match.home}
            ${match.away}
            ${match.leagueName}
          `.toLowerCase()

          if (
            !textoPartido.includes(
              query
            )
          ) {
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
          (
            match.day !== 'upcoming' ||
            match.status !== 'scheduled'
          )
        ) {
          return false
        }


        return true
      })
      .sort((a, b) => {
        if (sort === 'highest') {
          const mayorA =
            Math.max(
              a.odds.home,
              a.odds.draw,
              a.odds.away
            )

          const mayorB =
            Math.max(
              b.odds.home,
              b.odds.draw,
              b.odds.away
            )

          return mayorB - mayorA
        }


        return (
          new Date(
            a.fechaHoraInicio
          ) -
          new Date(
            b.fechaHoraInicio
          )
        )
      })


  // ============================================================
  // LIMPIAR FILTROS
  // ============================================================

  const limpiarFiltros = () => {
    setLeague('all')
    setTimeFilter('all')
    setSort('time')

    onClearSearch?.()
  }


  // ============================================================
  // RENDER
  // ============================================================

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


          {/* ===================================================
              SELECTOR DE TEMPORADA
             =================================================== */}

          <label className="date-label jornada-selector">
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M8 4h8v5a4 4 0 0 1-8 0V4ZM8 6H4v2a4 4 0 0 0 4 4M16 6h4v2a4 4 0 0 1-4 4" />

              <path d="M12 13v4M8 21h8M9 17h6" />
            </svg>

            <select
              value={temporadaSeleccionada}
              onChange={(event) => {
                const nuevaTemporada =
                  Number(
                    event.target.value
                  )

                setTemporadaSeleccionada(
                  nuevaTemporada
                )

                setJornadaSeleccionada(1)

                setPicks({})
                setStake(0)
              }}
            >
              <option value={1}>
                2026 · Académica
              </option>

              <option value={2}>
                2024 · API-Football
              </option>
            </select>
          </label>


          {/* ===================================================
              SELECTOR DE JORNADAS
             =================================================== */}

          <label className="date-label jornada-selector">
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

            <select
              value={jornadaSeleccionada}
              onChange={(event) =>
                setJornadaSeleccionada(
                  Number(
                    event.target.value
                  )
                )
              }
            >
              {Array.from(
                {
                  length:
                    cantidadJornadas,
                },
                (_, index) =>
                  index + 1
              ).map((jornada) => (
                <option
                  key={jornada}
                  value={jornada}
                >
                  Jornada {jornada}
                </option>
              ))}
            </select>
          </label>
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
                  setLeague(
                    event.target.value
                  )
                }
              >
                <option value="all">
                  Todas las ligas
                </option>

                <option value="liga">
                  Liga BetPlay
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
                setTimeFilter(
                  'upcoming'
                )
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
                setSort(
                  event.target.value
                )
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

            {' · '}

            Jornada {jornadaSeleccionada}
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
          {cargando ? (
            <div className="empty-results">
              <strong>
                Cargando Jornada {jornadaSeleccionada}...
              </strong>

              <p>
                Estamos consultando los partidos de ZonaGol.
              </p>
            </div>

          ) : error ? (
            <div className="empty-results">
              <strong>
                No pudimos cargar los partidos
              </strong>

              <p>
                {error}
              </p>
            </div>

          ) : filteredMatches.length > 0 ? (

            filteredMatches.map(
              (match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  selectedPick={
                    picks[match.id]
                  }
                  onPick={handlePick}
                />
              )
            )

          ) : (
            <div className="empty-results">
              <strong>
                No encontramos partidos
              </strong>

              <p>
                Prueba con otra fecha o búsqueda.
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
          onStakeChange={
            handleStakeChange
          }
          onRemovePick={
            handleRemovePick
          }
          onPlaceBet={
            handlePlaceBet
          }
        />
      </aside>


      <MobileBetSlip
        picks={picks}
        stake={stake}
        onStakeChange={
          handleStakeChange
        }
        onRemovePick={
          handleRemovePick
        }
        onPlaceBet={
          handlePlaceBet
        }
      />
    </section>
  )
}


export default MatchesSection