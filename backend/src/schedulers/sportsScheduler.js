const cron = require("node-cron");

const {
  sincronizarJornadaCompleta,
} = require("../services/sportsFullSyncService");

// ============================================================
// ESTADO INTERNO
//
// Evita ejecutar dos sincronizaciones simultáneamente.
// ============================================================

let sincronizacionEnCurso = false;

// ============================================================
// CONFIGURACIÓN
// ============================================================

function obtenerConfiguracion() {
  return {
    enabled:
      String(process.env.SPORTS_SYNC_ENABLED || "")
        .trim()
        .toLowerCase() === "true",

    cronExpression: process.env.SPORTS_SYNC_CRON || "0 */2 * * *",

    leagueId: Number(process.env.SPORTS_SYNC_LEAGUE_ID || 239),

    season: Number(process.env.SPORTS_SYNC_SEASON || 2024),

    round: process.env.SPORTS_SYNC_ROUND || "Apertura - 1",

    numeroJornada: Number(process.env.SPORTS_SYNC_NUMERO_JORNADA || 1),
  };
}

// ============================================================
// EJECUTAR SINCRONIZACIÓN
// ============================================================

async function ejecutarSincronizacionProgramada() {
  if (sincronizacionEnCurso) {
    console.log(
      "[SPORTS SYNC] Se omitió una ejecución porque otra sincronización sigue en curso.",
    );

    return null;
  }

  const config = obtenerConfiguracion();

  sincronizacionEnCurso = true;

  const inicio = new Date();

  try {
    console.log(`[SPORTS SYNC] Inicio: ${inicio.toISOString()}`);

    const resultado = await sincronizarJornadaCompleta({
      leagueId: config.leagueId,

      season: config.season,

      round: config.round,
      numeroJornada: config.numeroJornada,
      origen: "SCHEDULER",
    });
    console.log(
      "[SPORTS SYNC] Sincronización completada:",
      JSON.stringify(resultado),
    );

    return resultado;
  } catch (error) {
    console.error("[SPORTS SYNC] Error:", error.message);

    throw error;
  } finally {
    sincronizacionEnCurso = false;
  }
}

// ============================================================
// INICIAR SCHEDULER
// ============================================================

function iniciarSportsScheduler() {
  const config = obtenerConfiguracion();

  if (!config.enabled) {
    console.log("[SPORTS SYNC] Scheduler desactivado");

    return null;
  }

  if (!cron.validate(config.cronExpression)) {
    throw new Error(`SPORTS_SYNC_CRON inválido: ${config.cronExpression}`);
  }

  console.log(
    `[SPORTS SYNC] Scheduler activo: ${config.cronExpression} - America/Bogota`,
  );

  const tarea = cron.schedule(
    config.cronExpression,

    async () => {
        try {
        await ejecutarSincronizacionProgramada();
      } catch (error) {
        // El error ya fue registrado arriba.
        // Lo capturamos para evitar que una ejecución
        // programada afecte el proceso principal.
      }
    },

    {
      timezone: "America/Bogota",
    },
  );

  return tarea;
}

// ============================================================
// EXPORTACIONES
// ============================================================

module.exports = {
  iniciarSportsScheduler,
  ejecutarSincronizacionProgramada,
};
