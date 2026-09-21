import { useEffect, useState } from 'react'

import {
  obtenerMisApuestas,
} from '../../services/authService'


function MyBets({
  onNotify,
}) {
  const [apuestas, setApuestas] =
    useState([])

  const [cargando, setCargando] =
    useState(true)

  const [error, setError] =
    useState('')


  // ============================================================
  // FORMATO MONEDA
  // ============================================================

  const formatoCOP =
    new Intl.NumberFormat(
      'es-CO',
      {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0,
      }
    )


  // ============================================================
  // FORMATO FECHA
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
  // CARGAR APUESTAS
  // ============================================================

  useEffect(() => {
    let activo = true


    const cargarApuestas =
      async () => {

        try {
          setCargando(true)
          setError('')


          const respuesta =
            await obtenerMisApuestas()


          if (activo) {
            setApuestas(
              respuesta.datos || []
            )
          }

        } catch (error) {

          console.error(
            'Error cargando apuestas:',
            error
          )


          if (activo) {
            setError(
              error.message ||
                'No fue posible cargar tus apuestas.'
            )
          }

        } finally {

          if (activo) {
            setCargando(false)
          }
        }
      }


    cargarApuestas()


    return () => {
      activo = false
    }

  }, [])


  // ============================================================
  // CLASE SEGÚN ESTADO
  // ============================================================

  const obtenerClaseEstado = (
    estado
  ) => {

    switch (estado) {

      case 'GANADA':
        return 'bet-status bet-status--won'

      case 'PERDIDA':
        return 'bet-status bet-status--lost'

      case 'ANULADA':
        return 'bet-status bet-status--cancelled'

      default:
        return 'bet-status bet-status--pending'
    }
  }


  // ============================================================
  // RENDER
  // ============================================================

  return (
    <section className="my-bets-page">

      <header className="my-bets-heading">

        <div>
          <span className="eyebrow">
            <i></i>

            ZONAGOL
          </span>

          <h1>
            Mis apuestas
          </h1>

          <p>
            Consulta tus apuestas realizadas,
            selecciones, cuotas y posibles retornos.
          </p>
        </div>


        {!cargando && !error && (
          <span className="my-bets-total">
            {apuestas.length}{' '}

            {apuestas.length === 1
              ? 'apuesta'
              : 'apuestas'}
          </span>
        )}

      </header>


      {cargando ? (

        <div className="my-bets-state">

          <strong>
            Cargando tus apuestas...
          </strong>

          <p>
            Estamos consultando tu historial en ZonaGol.
          </p>

        </div>

      ) : error ? (

        <div className="my-bets-state">

          <strong>
            No pudimos cargar tus apuestas
          </strong>

          <p>
            {error}
          </p>

        </div>

      ) : apuestas.length === 0 ? (

        <div className="my-bets-state">

          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M3 9a3 3 0 0 0 0 6v3h18v-3a3 3 0 0 0 0-6V6H3v3Z" />
            <path d="M13 8v2M13 14v2" />
          </svg>

          <strong>
            Aún no tienes apuestas
          </strong>

          <p>
            Cuando realices una apuesta aparecerá aquí.
          </p>

        </div>

      ) : (

        <div className="my-bets-list">

          {apuestas.map(
            (apuesta) => (

              <article
                key={
                  apuesta.apuestaId
                }
                className="my-bet-card"
              >

                {/* ==============================================
                    CABECERA
                   ============================================== */}

                <header className="my-bet-card__header">

                  <div>

                    <span className="my-bet-code">
                      {
                        apuesta.codigoApuesta
                      }
                    </span>

                    <small>
                      {
                        formatearFecha(
                          apuesta.fechaApuesta
                        )
                      }
                    </small>

                  </div>


                  <span
                    className={
                      obtenerClaseEstado(
                        apuesta.estado
                      )
                    }
                  >
                    {apuesta.estado}
                  </span>

                </header>


                {/* ==============================================
                    RESUMEN
                   ============================================== */}

                <div className="my-bet-summary">

                  <div>
                    <small>
                      Apostado
                    </small>

                    <strong>
                      {
                        formatoCOP.format(
                          apuesta.montoApostado
                        )
                      }
                    </strong>
                  </div>


                  <div>
                    <small>
                      Cuota total
                    </small>

                    <strong>
                      {
                        Number(
                          apuesta.cuotaTotal
                        ).toFixed(2)
                      }
                    </strong>
                  </div>


                  <div>
                    <small>
                      Selecciones
                    </small>

                    <strong>
                      {
                        apuesta
                          .cantidadSelecciones
                      }
                    </strong>
                  </div>


                  <div>
                    <small>
                      Retorno potencial
                    </small>

                    <strong className="my-bet-potential">
                      {
                        formatoCOP.format(
                          apuesta
                            .retornoPotencial
                        )
                      }
                    </strong>
                  </div>

                </div>


                {/* ==============================================
                    SELECCIONES
                   ============================================== */}

                <div className="my-bet-selections">

                  {apuesta.selecciones.map(
                    (seleccion) => (

                      <div
                        key={
                          seleccion
                            .detalleApuestaId
                        }
                        className="my-bet-selection"
                      >

                        <div className="my-bet-selection__match">

                          <span className="my-bet-team">

                            <b>
                              {
                                seleccion
                                  .siglaLocal
                              }
                            </b>

                            {
                              seleccion
                                .equipoLocal
                            }

                          </span>


                          <span className="my-bet-vs">
                            vs
                          </span>


                          <span className="my-bet-team">

                            <b>
                              {
                                seleccion
                                  .siglaVisitante
                              }
                            </b>

                            {
                              seleccion
                                .equipoVisitante
                            }

                          </span>

                        </div>


                        <div className="my-bet-selection__info">

                          <div>
                            <small>
                              Selección
                            </small>

                            <strong>
                              {
                                seleccion
                                  .opcionApuesta
                              }
                            </strong>
                          </div>


                          <div>
                            <small>
                              Cuota aceptada
                            </small>

                            <strong>
                              {
                                Number(
                                  seleccion
                                    .cuotaAceptada
                                ).toFixed(2)
                              }
                            </strong>
                          </div>


                          <div>
                            <small>
                              Jornada
                            </small>

                            <strong>
                              {
                                seleccion
                                  .jornada
                              }
                            </strong>
                          </div>


                          <div>
                            <small>
                              Estado
                            </small>

                            <strong>
                              {
                                seleccion
                                  .estadoDetalle
                              }
                            </strong>
                          </div>

                        </div>

                      </div>
                    )
                  )}

                </div>


                <footer className="my-bet-card__footer">

                  <span>
                    {apuesta.estado ===
                    'PENDIENTE'
                      ? 'La apuesta se liquidará cuando finalicen sus selecciones.'
                      : `Apuesta ${apuesta.estado.toLowerCase()}.`}
                  </span>

                </footer>

              </article>
            )
          )}

        </div>
      )}

    </section>
  )
}

export default MyBets