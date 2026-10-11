import { useEffect, useState } from "react";
import CustomSelect from '../common/CustomSelect'
import {
  obtenerPartidos,
  finalizarPartido,
  liquidarPartido,
  obtenerEstadoLiquidacionPartido,
  sincronizarJornadaDeportiva,
  obtenerEstadoSincronizacionDeportiva,
} from "../../services/authService";

function AdminPanel({ onNotify }) {
  const [temporadaSeleccionada, setTemporadaSeleccionada] = useState(1);

  const [jornadaSeleccionada, setJornadaSeleccionada] = useState(1);

  const cantidadJornadas = temporadaSeleccionada === 1 ? 19 : 1;

  const [partidos, setPartidos] = useState([]);

  const [marcadores, setMarcadores] = useState({});

  const [estadosLiquidacion, setEstadosLiquidacion] = useState({});

  const [cargando, setCargando] = useState(true);

  const [error, setError] = useState("");

  const [procesandoPartido, setProcesandoPartido] = useState(null);

  const [sincronizando, setSincronizando] = useState(false);

  const [estadoSincronizacion, setEstadoSincronizacion] = useState(null);

  const [cargandoEstadoSincronizacion, setCargandoEstadoSincronizacion] =
    useState(true);

    

  // ============================================================

  // FORMATEAR FECHA

  // ============================================================

  const formatearFecha = (fecha) => {
    if (!fecha) {
      return "";
    }

    return new Intl.DateTimeFormat(
      "es-CO",

      {
        day: "2-digit",

        month: "short",

        year: "numeric",

        hour: "2-digit",

        minute: "2-digit",

        timeZone: "America/Bogota",
      },
    ).format(new Date(fecha));
  };

  // ============================================================

  // CONSULTAR ESTADO DE LIQUIDACIÓN

  // ============================================================

  const consultarEstadoLiquidacion = async (partidoId) => {
    try {
      const respuesta = await obtenerEstadoLiquidacionPartido(partidoId);

      setEstadosLiquidacion((anteriores) => ({
        ...anteriores,

        [partidoId]: respuesta.datos,
      }));

      return respuesta.datos;
    } catch (error) {
      console.error(
        `Error consultando liquidación del partido ${partidoId}:`,

        error,
      );

      return null;
    }
  };

  // ============================================================

  // CARGAR PARTIDOS

  // ============================================================

  const cargarPartidos = async (
    temporadaId = temporadaSeleccionada,

    jornada = jornadaSeleccionada,
  ) => {
    try {
      setCargando(true);

      setError("");

      const respuesta = await obtenerPartidos(
        temporadaId,

        jornada,
      );

      const partidosCargados = respuesta.datos || [];

      setPartidos(partidosCargados);

      // Limpiamos estados de la jornada anterior.

      setEstadosLiquidacion({});

      // ======================================================

      // CONSULTAR LIQUIDACIÓN SOLO PARA FINALIZADOS

      // ======================================================

      const finalizados = partidosCargados.filter(
        (partido) =>
          Number(partido.estadopartidoid ?? partido.estadoPartidoId) === 3,
      );

      await Promise.all(
        finalizados.map(async (partido) => {
          const partidoId = Number(partido.partidoid ?? partido.partidoId);

          await consultarEstadoLiquidacion(partidoId);
        }),
      );
    } catch (error) {
      console.error(
        "Error cargando partidos administrativos:",

        error,
      );

      setError(error.message || "No fue posible cargar los partidos.");
    } finally {
      setCargando(false);
    }
  };

  // ============================================================

  // CONSULTAR ESTADO DE SINCRONIZACIÓN

  // ============================================================

  const cargarEstadoSincronizacion = async () => {
    try {
      setCargandoEstadoSincronizacion(true);

      const respuesta = await obtenerEstadoSincronizacionDeportiva();

      setEstadoSincronizacion(respuesta.datos);
    } catch (error) {
      console.error(
        "Error consultando estado de sincronización:",

        error,
      );

      setEstadoSincronizacion(null);
    } finally {
      setCargandoEstadoSincronizacion(false);
    }
  };

  // ============================================================

  // CAMBIO DE JORNADA

  // ============================================================

  useEffect(() => {
    cargarPartidos(
      temporadaSeleccionada,

      jornadaSeleccionada,
    );
  }, [temporadaSeleccionada, jornadaSeleccionada]);

  // ============================================================

  // CARGAR ESTADO DE SINCRONIZACIÓN AL ENTRAR

  // ============================================================

  useEffect(() => {
    cargarEstadoSincronizacion();
  }, []);

  // ============================================================

  // CAMBIAR MARCADOR

  // ============================================================

  const cambiarMarcador = (
    partidoId,

    campo,

    valor,
  ) => {
    setMarcadores((anteriores) => ({
      ...anteriores,

      [partidoId]: {
        ...anteriores[partidoId],

        [campo]: valor,
      },
    }));
  };

  // ============================================================

  // ACTUALIZAR PARTIDO LOCALMENTE

  // ============================================================

  const marcarComoFinalizado = (
    partidoId,

    golesLocal,

    golesVisitante,
  ) => {
    setPartidos((anteriores) =>
      anteriores.map((partido) => {
        const id = Number(partido.partidoid ?? partido.partidoId);

        if (id !== partidoId) {
          return partido;
        }

        return {
          ...partido,

          estadopartidoid: 3,

          estadopartido: "FINALIZADO",

          goleslocal: golesLocal,

          golesvisitante: golesVisitante,
        };
      }),
    );
  };

  // ============================================================

  // FINALIZAR Y LIQUIDAR

  // ============================================================

  const handleFinalizar = async (partido) => {
    const partidoId = Number(partido.partidoid ?? partido.partidoId);

    const marcador = marcadores[partidoId] || {};

    const golesLocal = Number(marcador.golesLocal);

    const golesVisitante = Number(marcador.golesVisitante);

    // ========================================================

    // VALIDACIONES

    // ========================================================

    if (
      marcador.golesLocal === undefined ||
      marcador.golesLocal === "" ||
      marcador.golesVisitante === undefined ||
      marcador.golesVisitante === ""
    ) {
      onNotify?.("Ingresa el marcador completo antes de finalizar el partido.");

      return;
    }

    if (
      !Number.isInteger(golesLocal) ||
      golesLocal < 0 ||
      !Number.isInteger(golesVisitante) ||
      golesVisitante < 0
    ) {
      onNotify?.(
        "Los goles deben ser números enteros iguales o mayores que cero.",
      );

      return;
    }

    let partidoFinalizado = false;

    try {
      setProcesandoPartido(partidoId);

      // ======================================================

      // 1. FINALIZAR EN POSTGRESQL

      // ======================================================

      await finalizarPartido(
        partidoId,

        golesLocal,

        golesVisitante,
      );

      partidoFinalizado = true;

      marcarComoFinalizado(
        partidoId,

        golesLocal,

        golesVisitante,
      );

      // ======================================================

      // 2. LIQUIDAR EN MYSQL

      // ======================================================

      const liquidacion = await liquidarPartido(partidoId);

      const cantidad = Number(liquidacion.datos?.apuestasAfectadas || 0);

      // ======================================================

      // 3. CONSULTAR ESTADO FINAL REAL

      // ======================================================

      const estadoLiquidacion = await consultarEstadoLiquidacion(partidoId);

      if (estadoLiquidacion?.estadoLiquidacion === "SIN_APUESTAS") {
        onNotify?.(
          "Partido finalizado correctamente. No había apuestas asociadas.",
        );
      } else {
        onNotify?.(
          `Partido finalizado y liquidado correctamente. ${cantidad} ${
            cantidad === 1 ? "apuesta afectada." : "apuestas afectadas."
          }`,
        );
      }

      setMarcadores((anteriores) => {
        const copia = {
          ...anteriores,
        };

        delete copia[partidoId];

        return copia;
      });
    } catch (error) {
      console.error(
        "Error procesando partido:",

        error,
      );

      if (partidoFinalizado) {
        onNotify?.(
          `El partido quedó finalizado, pero ocurrió un error liquidando las apuestas: ${error.message}`,
        );

        await cargarPartidos(
          temporadaSeleccionada,

          jornadaSeleccionada,
        );
      } else {
        onNotify?.(error.message || "No fue posible finalizar el partido.");
      }
    } finally {
      setProcesandoPartido(null);
    }
  };

  // ============================================================

  // LIQUIDAR PARTIDO FINALIZADO PENDIENTE

  // ============================================================

  const handleLiquidar = async (partido) => {
    const partidoId = Number(partido.partidoid ?? partido.partidoId);

    try {
      setProcesandoPartido(partidoId);

      const respuesta = await liquidarPartido(partidoId);

      const cantidad = Number(respuesta.datos?.apuestasAfectadas || 0);

      await consultarEstadoLiquidacion(partidoId);

      onNotify?.(
        `Liquidación completada. ${cantidad} ${
          cantidad === 1 ? "apuesta afectada." : "apuestas afectadas."
        }`,
      );
    } catch (error) {
      console.error(
        "Error liquidando partido:",

        error,
      );

      onNotify?.(error.message || "No fue posible liquidar las apuestas.");
    } finally {
      setProcesandoPartido(null);
    }
  };

  // ============================================================

  // SINCRONIZAR JORNADA DESDE API-FOOTBALL

  // ============================================================

  const handleSincronizar = async () => {
    if (sincronizando) {
      return;
    }

    // Por ahora la integración API real disponible

    // corresponde únicamente a:

    //

    // TemporadaId 2 = 2024

    // Apertura - 1 = Jornada interna 1

    if (temporadaSeleccionada !== 2 || jornadaSeleccionada !== 1) {
      onNotify?.(
        "La sincronización API está disponible actualmente para 2024 · Jornada 1.",
      );

      return;
    }

    try {
      setSincronizando(true);

      const respuesta = await sincronizarJornadaDeportiva({
        leagueId: 239,

        season: 2024,

        round: "Apertura - 1",

        numeroJornada: 1,
      });

      const datos = respuesta.datos;

      const recibidos = Number(datos?.partidos?.recibidos || 0);

      const insertados = Number(datos?.partidos?.insertados || 0);

      const actualizados = Number(datos?.partidos?.actualizados || 0);

      onNotify?.(
        `Sincronización completada. ${recibidos} partidos recibidos, ${insertados} insertados y ${actualizados} actualizados.`,
      );

      // Volvemos a consultar PostgreSQL para

      // reflejar inmediatamente los cambios.

      await cargarPartidos(
        temporadaSeleccionada,

        jornadaSeleccionada,
      );

      await cargarEstadoSincronizacion();
    } catch (error) {
      console.error(
        "Error sincronizando jornada:",

        error,
      );

      onNotify?.(error.message || "No fue posible sincronizar la jornada.");
    } finally {
      setSincronizando(false);
    }
  };

  // ============================================================

  // FORMATEAR FRECUENCIA DEL SCHEDULER

  // ============================================================

  const formatearFrecuenciaCron = (cron) => {
    if (!cron) {
      return "Sin información";
    }

    const partes = cron.trim().split(/\s+/);

    if (partes.length !== 5) {
      return cron;
    }

    const [minuto, hora, diaMes, mes, diaSemana] = partes;

    if (
      minuto === "0" &&
      hora.startsWith("*/") &&
      diaMes === "*" &&
      mes === "*" &&
      diaSemana === "*"
    ) {
      const horas = Number(hora.substring(2));

      if (Number.isInteger(horas) && horas > 0) {
        return horas === 1 ? "Cada hora" : `Cada ${horas} horas`;
      }
    }

    return cron;
  };

  // ============================================================

  // DATOS DERIVADOS DEL ESTADO DE SINCRONIZACIÓN

  // ============================================================

  const automatica = estadoSincronizacion?.automatica;

  const ejecucionSync = estadoSincronizacion?.ejecucion;

  const ultimaSync = ejecucionSync?.ultimaSincronizacion;

  const resultadoPartidos = ultimaSync?.resultado?.partidos;

  // ============================================================

  // RENDER

  // ============================================================

  return (
    <section className="admin-page">
      {/* ========================================================

          CABECERA

          ======================================================== */}

      <header className="admin-heading">
        <div>
          <span className="eyebrow">
            <i></i>
            ZONAGOL
          </span>

          <h1>Administración</h1>

          <p>
            Registra resultados y liquida automáticamente las apuestas asociadas
            a cada partido.
          </p>
        </div>

        <CustomSelect
          className="admin-season-custom-select"
          label="Temporada"
          value={temporadaSeleccionada}
          ariaLabel="Seleccionar temporada"
          options={[
            {
              value: 1,
              label: '2026 · Académica',
            },
            {
              value: 2,
              label: '2024 · API-Football',
            },
          ]}
          onChange={(nuevaTemporada) => {
            setTemporadaSeleccionada(
              Number(nuevaTemporada)
            )

            setJornadaSeleccionada(1)
          }}
        />


        <CustomSelect
          className="admin-round-custom-select"
          label="Jornada"
          value={jornadaSeleccionada}
          ariaLabel="Seleccionar jornada"
          options={
            Array.from(
              {
                length: cantidadJornadas,
              },
              (_, index) => ({
                value: index + 1,
                label: `Jornada ${index + 1}`,
              })
            )
          }
          onChange={(nuevaJornada) =>
            setJornadaSeleccionada(
              Number(nuevaJornada)
            )
          }
        />

        {/* BOTÓN DE SINCRONIZACIÓN */}

        {temporadaSeleccionada === 2 && (
          <button
            className="button button--gold"
            type="button"
            disabled={sincronizando}
            onClick={handleSincronizar}
          >
            {sincronizando ? "Sincronizando..." : "Sincronizar ahora"}
          </button>
        )}
      </header>

      {/* ========================================================

          ESTADO DE SINCRONIZACIÓN DEPORTIVA

          ======================================================== */}

      {temporadaSeleccionada === 2 && (
        <article className="admin-match-card admin-sync-card">
          <header className="admin-match-card__header">
            <div>
              <strong>Sincronización deportiva</strong>

              <small>API-Football · Colombia</small>
            </div>

            <div className="admin-status-group">
              {cargandoEstadoSincronizacion ? (
                <span className="admin-liquidation admin-liquidation--pending">
                  CONSULTANDO
                </span>
              ) : !estadoSincronizacion ? (
                <span className="admin-liquidation admin-liquidation--pending">
                  ESTADO NO DISPONIBLE
                </span>
              ) : (
                <>
                  <span
                    className={
                      automatica?.habilitada
                        ? "admin-status admin-status--3"
                        : "admin-status admin-status--5"
                    }
                  >
                    {automatica?.habilitada
                      ? "AUTOMÁTICA ACTIVA"
                      : "AUTOMÁTICA INACTIVA"}
                  </span>

                  {(sincronizando || ejecucionSync?.enCurso) && (
                    <span className="admin-liquidation admin-liquidation--pending">
                      EN CURSO
                    </span>
                  )}
                </>
              )}
            </div>
          </header>

          <div className="admin-result">
            <div>
              <small>Programación</small>

              <strong>{formatearFrecuenciaCron(automatica?.cron)}</strong>

              <small>{automatica?.timezone || "America/Bogota"}</small>
            </div>

            <div>
              <small>Datos configurados</small>

              <strong>
                {automatica
                  ? `${automatica.season} · ${automatica.round}`
                  : "Sin información"}
              </strong>

              {automatica && <small>Jornada {automatica.numeroJornada}</small>}
            </div>

            <div>
              <small>Última sincronización</small>

              {ultimaSync ? (
                <>
                  <strong>{ultimaSync.exito ? "Correcta" : "Con error"}</strong>

                  <small>
                    {ultimaSync.origen === "SCHEDULER"
                      ? "Automática"
                      : "Manual"}

                    {" · "}

                    {formatearFecha(ultimaSync.fin)}
                  </small>
                </>
              ) : (
                <strong>Sin ejecuciones desde el último inicio</strong>
              )}
            </div>

            {resultadoPartidos && (
              <div>
                <small>Último resultado</small>

                <strong>{resultadoPartidos.recibidos} recibidos</strong>

                <small>
                  {resultadoPartidos.insertados} insertados ·{" "}
                  {resultadoPartidos.actualizados} actualizados
                </small>
              </div>
            )}

            {ultimaSync && !ultimaSync.exito && ultimaSync.error && (
              <div>
                <small>Error</small>

                <strong>{ultimaSync.error}</strong>
              </div>
            )}
          </div>
        </article>
      )}

      {/* ========================================================

          CARGANDO

          ======================================================== */}

      {cargando && (
        <div className="my-bets-state">
          <strong>Cargando partidos...</strong>

          <p>Consultando la jornada seleccionada.</p>
        </div>
      )}

      {/* ========================================================

          ERROR

          ======================================================== */}

      {!cargando && error && (
        <div className="my-bets-state">
          <strong>No pudimos cargar los partidos</strong>

          <p>{error}</p>
        </div>
      )}

      {/* ========================================================

          PARTIDOS

          ======================================================== */}

      {!cargando && !error && (
        <div className="admin-match-list">
          {partidos.map((partido) => {
            const partidoId = Number(partido.partidoid ?? partido.partidoId);

            const estadoId = Number(
              partido.estadopartidoid ?? partido.estadoPartidoId,
            );

            const estado = partido.estadopartido ?? partido.estadoPartido ?? "";

           const equipoLocal =
              partido.equipolocal ??
              partido.equipoLocal ??
              'Local'

            const equipoVisitante =
              partido.equipovisitante ??
              partido.equipoVisitante ??
              'Visitante'

            const equipoLocalId =
              Number(
                partido.equipolocalid ??
                partido.equipoLocalId
              )

            const equipoVisitanteId =
              Number(
                partido.equipovisitanteid ??
                partido.equipoVisitanteId
              )

            const siglaLocal =
              partido.siglalocal ??
              partido.siglaLocal ??
              'LOC'

            const siglaVisitante =
              partido.siglavisitante ??
              partido.siglaVisitante ??
              'VIS'

            const fecha = partido.fechahorainicio ?? partido.fechaHoraInicio;

            const golesLocal = partido.goleslocal ?? partido.golesLocal;

            const golesVisitante =
              partido.golesvisitante ?? partido.golesVisitante;

            const finalizado = estadoId === 3;

            const cancelado = estadoId === 5;

            const procesando = procesandoPartido === partidoId;

            const marcador = marcadores[partidoId] || {};

            const liquidacion = estadosLiquidacion[partidoId];

            const estadoLiquidacion = liquidacion?.estadoLiquidacion;

            return (
              <article key={partidoId} className="admin-match-card">
                {/* ============================================

                      CABECERA

                      ============================================ */}

                <header className="admin-match-card__header">
                  <div>
                    <strong>PT{partidoId}</strong>

                    <small>{formatearFecha(fecha)}</small>
                  </div>

                  <div className="admin-status-group">
                    <span className={`admin-status admin-status--${estadoId}`}>
                      {estado}
                    </span>

                    {finalizado && estadoLiquidacion === "LIQUIDADO" && (
                      <span className="admin-liquidation admin-liquidation--done">
                        LIQUIDADO
                      </span>
                    )}

                    {finalizado && estadoLiquidacion === "SIN_APUESTAS" && (
                      <span className="admin-liquidation admin-liquidation--empty">
                        SIN APUESTAS
                      </span>
                    )}

                    {finalizado && estadoLiquidacion === "PENDIENTE" && (
                      <span className="admin-liquidation admin-liquidation--pending">
                        POR LIQUIDAR
                      </span>
                    )}
                  </div>
                </header>

                {/* ============================================

                      EQUIPOS

                      ============================================ */}

                <div className="admin-match-teams">

                  <div className="admin-team">

                    <span>
                      <img
                        src={`http://localhost:5000/api/postgres/equipos/${equipoLocalId}/logo`}
                        alt={`Escudo de ${equipoLocal}`}
                      />
                    </span>

                    <strong>
                      {equipoLocal}
                    </strong>

                  </div>

                  <div className="admin-versus">
                    VS
                  </div>

                  <div className="admin-team admin-team--away">

                    <span>
                      <img
                        src={`http://localhost:5000/api/postgres/equipos/${equipoVisitanteId}/logo`}
                        alt={`Escudo de ${equipoVisitante}`}
                      />
                    </span>

                    <strong>
                      {equipoVisitante}
                    </strong>

                  </div>

                </div>

                {/* ============================================

                      FINALIZADO

                      ============================================ */}

                {finalizado ? (
                  <div className="admin-result">
                    <div>
                      <small>Marcador final</small>

                      <strong>
                        {golesLocal}

                        {" - "}

                        {golesVisitante}
                      </strong>
                    </div>

                    {/* LIQUIDACIÓN PENDIENTE */}

                    {estadoLiquidacion === "PENDIENTE" && (
                      <button
                        className="button button--gold"
                        type="button"
                        disabled={procesando}
                        onClick={() => handleLiquidar(partido)}
                      >
                        {procesando ? "Procesando..." : "Liquidar apuestas"}
                      </button>
                    )}

                    {/* YA LIQUIDADO */}

                    {estadoLiquidacion === "LIQUIDADO" && (
                      <button
                        className="admin-complete-button"
                        type="button"
                        disabled
                      >
                        ✓ Liquidado
                      </button>
                    )}

                    {/* SIN APUESTAS */}

                    {estadoLiquidacion === "SIN_APUESTAS" && (
                      <span className="admin-no-bets">
                        No había apuestas asociadas
                      </span>
                    )}
                  </div>
                ) : cancelado ? (
                  <div className="admin-result">
                    <div>
                      <small>Estado</small>

                      <strong>Partido cancelado</strong>
                    </div>
                  </div>
                ) : (
                  /* ==========================================

                       INGRESAR RESULTADO

                       ========================================== */

                  <div className="admin-score-form">
                    <label>
                      <span>Goles local</span>

                      <input
                        type="number"
                        min="0"
                        step="1"
                        placeholder="0"
                        value={marcador.golesLocal ?? ""}
                        disabled={procesando}
                        onChange={(event) =>
                          cambiarMarcador(
                            partidoId,

                            "golesLocal",

                            event.target.value,
                          )
                        }
                      />
                    </label>

                    <span className="admin-score-separator">-</span>

                    <label>
                      <span>Goles visitante</span>

                      <input
                        type="number"
                        min="0"
                        step="1"
                        placeholder="0"
                        value={marcador.golesVisitante ?? ""}
                        disabled={procesando}
                        onChange={(event) =>
                          cambiarMarcador(
                            partidoId,

                            "golesVisitante",

                            event.target.value,
                          )
                        }
                      />
                    </label>

                    <button
                      className="button button--gold admin-liquidate-button"
                      type="button"
                      disabled={procesando}
                      onClick={() => handleFinalizar(partido)}
                    >
                      {procesando ? "Procesando..." : "Liquidar partido"}
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default AdminPanel;
