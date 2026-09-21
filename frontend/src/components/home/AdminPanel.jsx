import {
  useEffect,
  useState,
} from 'react'

import {
  obtenerPartidos,
  finalizarPartido,
  liquidarPartido,
  obtenerEstadoLiquidacionPartido,
} from '../../services/authService'


function AdminPanel({
  onNotify,
}) {
  const [
    jornadaSeleccionada,
    setJornadaSeleccionada,
  ] = useState(1)

  const [
    partidos,
    setPartidos,
  ] = useState([])

  const [
    marcadores,
    setMarcadores,
  ] = useState({})

  const [
    estadosLiquidacion,
    setEstadosLiquidacion,
  ] = useState({})

  const [
    cargando,
    setCargando,
  ] = useState(true)

  const [
    error,
    setError,
  ] = useState('')

  const [
    procesandoPartido,
    setProcesandoPartido,
  ] = useState(null)


  // ============================================================
  // FORMATEAR FECHA
  // ============================================================

  const formatearFecha = (fecha) => {

    if (!fecha) {
      return ''
    }

    return new Intl.DateTimeFormat(
      'es-CO',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone:
          'America/Bogota',
      }
    ).format(
      new Date(fecha)
    )
  }


  // ============================================================
  // CONSULTAR ESTADO DE LIQUIDACIÓN
  // ============================================================

  const consultarEstadoLiquidacion =
    async (partidoId) => {

      try {

        const respuesta =
          await obtenerEstadoLiquidacionPartido(
            partidoId
          )

        setEstadosLiquidacion(
          (anteriores) => ({
            ...anteriores,

            [partidoId]:
              respuesta.datos,
          })
        )

        return respuesta.datos

      } catch (error) {

        console.error(
          `Error consultando liquidación del partido ${partidoId}:`,
          error
        )

        return null
      }
    }


  // ============================================================
  // CARGAR PARTIDOS
  // ============================================================

  const cargarPartidos =
    async (
      jornada =
        jornadaSeleccionada
    ) => {

      try {

        setCargando(true)
        setError('')

        const respuesta =
          await obtenerPartidos(
            jornada
          )

        const partidosCargados =
          respuesta.datos || []

        setPartidos(
          partidosCargados
        )

        // Limpiamos estados de la jornada anterior.
        setEstadosLiquidacion({})


        // ======================================================
        // CONSULTAR LIQUIDACIÓN SOLO PARA FINALIZADOS
        // ======================================================

        const finalizados =
          partidosCargados.filter(
            (partido) =>
              Number(
                partido.estadopartidoid ??
                partido.estadoPartidoId
              ) === 3
          )


        await Promise.all(
          finalizados.map(
            async (partido) => {

              const partidoId =
                Number(
                  partido.partidoid ??
                  partido.partidoId
                )

              await consultarEstadoLiquidacion(
                partidoId
              )
            }
          )
        )

      } catch (error) {

        console.error(
          'Error cargando partidos administrativos:',
          error
        )

        setError(
          error.message ||
            'No fue posible cargar los partidos.'
        )

      } finally {

        setCargando(false)
      }
    }


  // ============================================================
  // CAMBIO DE JORNADA
  // ============================================================

  useEffect(() => {

    cargarPartidos(
      jornadaSeleccionada
    )

  }, [jornadaSeleccionada])


  // ============================================================
  // CAMBIAR MARCADOR
  // ============================================================

  const cambiarMarcador = (
    partidoId,
    campo,
    valor
  ) => {

    setMarcadores(
      (anteriores) => ({

        ...anteriores,

        [partidoId]: {

          ...anteriores[
            partidoId
          ],

          [campo]:
            valor,
        },
      })
    )
  }


  // ============================================================
  // ACTUALIZAR PARTIDO LOCALMENTE
  // ============================================================

  const marcarComoFinalizado = (
    partidoId,
    golesLocal,
    golesVisitante
  ) => {

    setPartidos(
      (anteriores) =>
        anteriores.map(
          (partido) => {

            const id =
              Number(
                partido.partidoid ??
                partido.partidoId
              )

            if (
              id !== partidoId
            ) {
              return partido
            }

            return {

              ...partido,

              estadopartidoid: 3,

              estadopartido:
                'FINALIZADO',

              goleslocal:
                golesLocal,

              golesvisitante:
                golesVisitante,
            }
          }
        )
    )
  }


  // ============================================================
  // FINALIZAR Y LIQUIDAR
  // ============================================================

  const handleFinalizar =
    async (partido) => {

      const partidoId =
        Number(
          partido.partidoid ??
          partido.partidoId
        )

      const marcador =
        marcadores[
          partidoId
        ] || {}

      const golesLocal =
        Number(
          marcador.golesLocal
        )

      const golesVisitante =
        Number(
          marcador.golesVisitante
        )


      // ========================================================
      // VALIDACIONES
      // ========================================================

      if (
        marcador.golesLocal ===
          undefined ||
        marcador.golesLocal ===
          '' ||
        marcador.golesVisitante ===
          undefined ||
        marcador.golesVisitante ===
          ''
      ) {

        onNotify?.(
          'Ingresa el marcador completo antes de finalizar el partido.'
        )

        return
      }


      if (
        !Number.isInteger(
          golesLocal
        ) ||
        golesLocal < 0 ||
        !Number.isInteger(
          golesVisitante
        ) ||
        golesVisitante < 0
      ) {

        onNotify?.(
          'Los goles deben ser números enteros iguales o mayores que cero.'
        )

        return
      }


      let partidoFinalizado =
        false


      try {

        setProcesandoPartido(
          partidoId
        )


        // ======================================================
        // 1. FINALIZAR EN POSTGRESQL
        // ======================================================

        await finalizarPartido(
          partidoId,
          golesLocal,
          golesVisitante
        )

        partidoFinalizado =
          true


        marcarComoFinalizado(
          partidoId,
          golesLocal,
          golesVisitante
        )


        // ======================================================
        // 2. LIQUIDAR EN MYSQL
        // ======================================================

        const liquidacion =
          await liquidarPartido(
            partidoId
          )


        const cantidad =
          Number(
            liquidacion.datos
              ?.apuestasAfectadas || 0
          )


        // ======================================================
        // 3. CONSULTAR ESTADO FINAL REAL
        // ======================================================

        const estadoLiquidacion =
          await consultarEstadoLiquidacion(
            partidoId
          )


        if (
          estadoLiquidacion
            ?.estadoLiquidacion ===
          'SIN_APUESTAS'
        ) {

          onNotify?.(
            'Partido finalizado correctamente. No había apuestas asociadas.'
          )

        } else {

          onNotify?.(
            `Partido finalizado y liquidado correctamente. ${cantidad} ${
              cantidad === 1
                ? 'apuesta afectada.'
                : 'apuestas afectadas.'
            }`
          )
        }


        setMarcadores(
          (anteriores) => {

            const copia = {
              ...anteriores,
            }

            delete copia[
              partidoId
            ]

            return copia
          }
        )


      } catch (error) {

        console.error(
          'Error procesando partido:',
          error
        )


        if (
          partidoFinalizado
        ) {

          onNotify?.(
            `El partido quedó finalizado, pero ocurrió un error liquidando las apuestas: ${error.message}`
          )

          await cargarPartidos(
            jornadaSeleccionada
          )

        } else {

          onNotify?.(
            error.message ||
              'No fue posible finalizar el partido.'
          )
        }

      } finally {

        setProcesandoPartido(
          null
        )
      }
    }


  // ============================================================
  // LIQUIDAR PARTIDO FINALIZADO PENDIENTE
  // ============================================================

  const handleLiquidar =
    async (partido) => {

      const partidoId =
        Number(
          partido.partidoid ??
          partido.partidoId
        )


      try {

        setProcesandoPartido(
          partidoId
        )


        const respuesta =
          await liquidarPartido(
            partidoId
          )


        const cantidad =
          Number(
            respuesta.datos
              ?.apuestasAfectadas || 0
          )


        await consultarEstadoLiquidacion(
          partidoId
        )


        onNotify?.(
          `Liquidación completada. ${cantidad} ${
            cantidad === 1
              ? 'apuesta afectada.'
              : 'apuestas afectadas.'
          }`
        )


      } catch (error) {

        console.error(
          'Error liquidando partido:',
          error
        )


        onNotify?.(
          error.message ||
            'No fue posible liquidar las apuestas.'
        )

      } finally {

        setProcesandoPartido(
          null
        )
      }
    }


  // ============================================================
  // RENDER
  // ============================================================

  return (

    <section
      className="admin-page"
    >

      {/* ========================================================
          CABECERA
          ======================================================== */}

      <header
        className="admin-heading"
      >

        <div>

          <span className="eyebrow">
            <i></i>
            ZONAGOL
          </span>

          <h1>
            Administración
          </h1>

          <p>
            Registra resultados y
            liquida automáticamente las
            apuestas asociadas a cada
            partido.
          </p>

        </div>


        <label
          className="admin-jornada"
        >

          <span>
            Jornada
          </span>

          <select
            value={
              jornadaSeleccionada
            }

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
                length: 19,
              },
              (_, index) =>
                index + 1
            ).map(
              (jornada) => (

                <option
                  key={
                    jornada
                  }
                  value={
                    jornada
                  }
                >
                  Jornada {jornada}
                </option>
              )
            )}

          </select>

        </label>

      </header>


      {/* ========================================================
          CARGANDO
          ======================================================== */}

      {cargando && (

        <div
          className="my-bets-state"
        >

          <strong>
            Cargando partidos...
          </strong>

          <p>
            Consultando la jornada
            seleccionada.
          </p>

        </div>
      )}


      {/* ========================================================
          ERROR
          ======================================================== */}

      {!cargando &&
        error && (

        <div
          className="my-bets-state"
        >

          <strong>
            No pudimos cargar los
            partidos
          </strong>

          <p>
            {error}
          </p>

        </div>
      )}


      {/* ========================================================
          PARTIDOS
          ======================================================== */}

      {!cargando &&
        !error && (

        <div
          className="admin-match-list"
        >

          {partidos.map(
            (partido) => {

              const partidoId =
                Number(
                  partido.partidoid ??
                  partido.partidoId
                )


              const estadoId =
                Number(
                  partido.estadopartidoid ??
                  partido.estadoPartidoId
                )


              const estado =
                partido.estadopartido ??
                partido.estadoPartido ??
                ''


              const equipoLocal =
                partido.equipolocal ??
                partido.equipoLocal ??
                'Local'


              const equipoVisitante =
                partido.equipovisitante ??
                partido.equipoVisitante ??
                'Visitante'


              const siglaLocal =
                partido.siglalocal ??
                partido.siglaLocal ??
                'LOC'


              const siglaVisitante =
                partido.siglavisitante ??
                partido.siglaVisitante ??
                'VIS'


              const fecha =
                partido.fechahorainicio ??
                partido.fechaHoraInicio


              const golesLocal =
                partido.goleslocal ??
                partido.golesLocal


              const golesVisitante =
                partido.golesvisitante ??
                partido.golesVisitante


              const finalizado =
                estadoId === 3


              const cancelado =
                estadoId === 5


              const procesando =
                procesandoPartido ===
                partidoId


              const marcador =
                marcadores[
                  partidoId
                ] || {}


              const liquidacion =
                estadosLiquidacion[
                  partidoId
                ]


              const estadoLiquidacion =
                liquidacion
                  ?.estadoLiquidacion


              return (

                <article
                  key={
                    partidoId
                  }
                  className="admin-match-card"
                >

                  {/* ============================================
                      CABECERA
                      ============================================ */}

                  <header
                    className="admin-match-card__header"
                  >

                    <div>

                      <strong>
                        PT{partidoId}
                      </strong>

                      <small>
                        {
                          formatearFecha(
                            fecha
                          )
                        }
                      </small>

                    </div>


                    <div
                      className="admin-status-group"
                    >

                      <span
                        className={`admin-status admin-status--${estadoId}`}
                      >
                        {estado}
                      </span>


                      {finalizado &&
                        estadoLiquidacion ===
                          'LIQUIDADO' && (

                        <span
                          className="admin-liquidation admin-liquidation--done"
                        >
                          LIQUIDADO
                        </span>
                      )}


                      {finalizado &&
                        estadoLiquidacion ===
                          'SIN_APUESTAS' && (

                        <span
                          className="admin-liquidation admin-liquidation--empty"
                        >
                          SIN APUESTAS
                        </span>
                      )}


                      {finalizado &&
                        estadoLiquidacion ===
                          'PENDIENTE' && (

                        <span
                          className="admin-liquidation admin-liquidation--pending"
                        >
                          POR LIQUIDAR
                        </span>
                      )}

                    </div>

                  </header>


                  {/* ============================================
                      EQUIPOS
                      ============================================ */}

                  <div
                    className="admin-match-teams"
                  >

                    <div
                      className="admin-team"
                    >

                      <span>
                        {siglaLocal}
                      </span>

                      <strong>
                        {equipoLocal}
                      </strong>

                    </div>


                    <div
                      className="admin-versus"
                    >
                      VS
                    </div>


                    <div
                      className="admin-team admin-team--away"
                    >

                      <span>
                        {
                          siglaVisitante
                        }
                      </span>

                      <strong>
                        {
                          equipoVisitante
                        }
                      </strong>

                    </div>

                  </div>


                  {/* ============================================
                      FINALIZADO
                      ============================================ */}

                  {finalizado ? (

                    <div
                      className="admin-result"
                    >

                      <div>

                        <small>
                          Marcador final
                        </small>

                        <strong>
                          {
                            golesLocal
                          }
                          {' - '}
                          {
                            golesVisitante
                          }
                        </strong>

                      </div>


                      {/* LIQUIDACIÓN PENDIENTE */}

                      {estadoLiquidacion ===
                        'PENDIENTE' && (

                        <button
                          className="button button--gold"
                          type="button"

                          disabled={
                            procesando
                          }

                          onClick={() =>
                            handleLiquidar(
                              partido
                            )
                          }
                        >
                          {procesando
                            ? 'Procesando...'
                            : 'Liquidar apuestas'}
                        </button>
                      )}


                      {/* YA LIQUIDADO */}

                      {estadoLiquidacion ===
                        'LIQUIDADO' && (

                        <button
                          className="admin-complete-button"
                          type="button"
                          disabled
                        >
                          ✓ Liquidado
                        </button>
                      )}


                      {/* SIN APUESTAS */}

                      {estadoLiquidacion ===
                        'SIN_APUESTAS' && (

                        <span
                          className="admin-no-bets"
                        >
                          No había apuestas
                          asociadas
                        </span>
                      )}

                    </div>

                  ) : cancelado ? (

                    <div
                      className="admin-result"
                    >

                      <div>

                        <small>
                          Estado
                        </small>

                        <strong>
                          Partido cancelado
                        </strong>

                      </div>

                    </div>

                  ) : (

                    /* ==========================================
                       INGRESAR RESULTADO
                       ========================================== */

                    <div
                      className="admin-score-form"
                    >

                      <label>

                        <span>
                          Goles local
                        </span>

                        <input
                          type="number"
                          min="0"
                          step="1"
                          placeholder="0"

                          value={
                            marcador
                              .golesLocal ??
                            ''
                          }

                          disabled={
                            procesando
                          }

                          onChange={(
                            event
                          ) =>
                            cambiarMarcador(
                              partidoId,
                              'golesLocal',
                              event.target
                                .value
                            )
                          }
                        />

                      </label>


                      <span
                        className="admin-score-separator"
                      >
                        -
                      </span>


                      <label>

                        <span>
                          Goles visitante
                        </span>

                        <input
                          type="number"
                          min="0"
                          step="1"
                          placeholder="0"

                          value={
                            marcador
                              .golesVisitante ??
                            ''
                          }

                          disabled={
                            procesando
                          }

                          onChange={(
                            event
                          ) =>
                            cambiarMarcador(
                              partidoId,
                              'golesVisitante',
                              event.target
                                .value
                            )
                          }
                        />

                      </label>


                      <button
                        className="button button--gold"
                        type="button"

                        disabled={
                          procesando
                        }

                        onClick={() =>
                          handleFinalizar(
                            partido
                          )
                        }
                      >
                        {procesando
                          ? 'Procesando...'
                          : 'Finalizar y liquidar'}
                      </button>

                    </div>
                  )}

                </article>
              )
            }
          )}

        </div>
      )}

    </section>
  )
}


export default AdminPanel