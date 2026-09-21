const API_URL = 'http://localhost:5000/api'

const TOKEN_KEY = 'zonagol_token'


// ============================================================
// TOKEN JWT
// ============================================================

export function guardarToken(token) {
  sessionStorage.setItem(
    TOKEN_KEY,
    token
  )
}


export function obtenerToken() {
  return sessionStorage.getItem(
    TOKEN_KEY
  )
}


export function eliminarToken() {
  sessionStorage.removeItem(
    TOKEN_KEY
  )
}


// ============================================================
// INICIAR SESIÓN
// ============================================================

export async function iniciarSesion(
  correo,
  password
) {
  const response = await fetch(
    `${API_URL}/login`,
    {
      method: 'POST',
      headers: {
        'Content-Type':
          'application/json',
      },
      body: JSON.stringify({
        correo,
        password,
      }),
    }
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(
      data.message ||
        'Error al iniciar sesión'
    )
  }


  // ==========================================================
  // GUARDAR JWT
  // ==========================================================

  if (data.token) {
    guardarToken(
      data.token
    )
  }


  return data
}


// ============================================================
// REGISTRAR USUARIO
// ============================================================

export async function registrarUsuario(
  usuario
) {
  const response = await fetch(
    `${API_URL}/registro`,
    {
      method: 'POST',
      headers: {
        'Content-Type':
          'application/json',
      },
      body: JSON.stringify(usuario),
    }
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(
      data.message ||
        'Error al crear la cuenta'
    )
  }


  // ==========================================================
  // GUARDAR JWT DEL USUARIO RECIÉN REGISTRADO
  // ==========================================================

  if (data.token) {
    guardarToken(
      data.token
    )
  }


  return data
}


// ============================================================
// SOLICITAR RECUPERACIÓN
// ============================================================

export async function solicitarRecuperacion(
  correo
) {
  const response = await fetch(
    `${API_URL}/recuperar-password`,
    {
      method: 'POST',
      headers: {
        'Content-Type':
          'application/json',
      },
      body: JSON.stringify({
        correo,
      }),
    }
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(
      data.message ||
        'Error al solicitar la recuperación'
    )
  }

  return data
}


// ============================================================
// RESTABLECER CONTRASEÑA
// ============================================================

export async function restablecerPassword(
  token,
  nuevaPassword
) {
  const response = await fetch(
    `${API_URL}/restablecer-password`,
    {
      method: 'POST',
      headers: {
        'Content-Type':
          'application/json',
      },
      body: JSON.stringify({
        token,
        nuevaPassword,
      }),
    }
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(
      data.message ||
        'Error al restablecer la contraseña'
    )
  }

  return data
}


// ============================================================
// OBTENER PARTIDOS
//
// Si enviamos jornada:
// /postgres/partidos?jornada=1
//
// Si no enviamos jornada:
// /postgres/partidos
// ============================================================

export async function obtenerPartidos(
  jornada = null
) {
  let url =
    `${API_URL}/postgres/partidos`

  if (jornada !== null) {
    url +=
      `?jornada=${encodeURIComponent(jornada)}`
  }

  const response =
    await fetch(url)

  const data =
    await response.json()

  if (!response.ok) {
    throw new Error(
      data.message ||
        'Error al consultar los partidos'
    )
  }

  return data
}


// ============================================================
// OBTENER DETALLE DE UN PARTIDO
//
// Incluye las opciones de apuesta y sus cuotas.
// ============================================================

export async function obtenerPartidoDetalle(
  partidoId
) {
  const response =
    await fetch(
      `${API_URL}/postgres/partidos/${partidoId}`
    )

  const data =
    await response.json()

  if (!response.ok) {
    throw new Error(
      data.message ||
        'Error al consultar el partido'
    )
  }

  return data
}


// ============================================================
// PETICIONES AUTENTICADAS
//
// Para rutas que exijan JWT.
// ============================================================

export async function fetchAutenticado(
  url,
  opciones = {}
) {
  const token =
    obtenerToken()


  const headers = {
    ...opciones.headers,

    Authorization:
      `Bearer ${token}`,
  }


  return fetch(
    `${API_URL}${url}`,
    {
      ...opciones,
      headers,
    }
  )
}

// ============================================================
// REALIZAR APUESTA
// ============================================================

export async function realizarApuesta(
  montoApostado,
  partidoReglaIds
) {
  const response =
    await fetchAutenticado(
      '/mysql/apuestas',
      {
        method: 'POST',

        headers: {
          'Content-Type':
            'application/json',
        },

        body: JSON.stringify({
          montoApostado,
          partidoReglaIds,
        }),
      }
    )

  const data =
    await response.json()

  if (!response.ok) {
    throw new Error(
      data.message ||
        'Error al realizar la apuesta'
    )
  }

  return data
}

// ============================================================
// CONSULTAR SALDO DEL USUARIO AUTENTICADO
// ============================================================

export async function obtenerSaldo() {
  const response =
    await fetchAutenticado(
      '/mysql/saldo'
    )

  const data =
    await response.json()

  if (!response.ok) {
    throw new Error(
      data.message ||
        'Error al consultar el saldo'
    )
  }

  return data
}

// ============================================================
// OBTENER MIS APUESTAS
// ============================================================

export async function obtenerMisApuestas() {
  const response =
    await fetchAutenticado(
      '/mysql/apuestas/mias'
    )

  const data =
    await response.json()

  if (!response.ok) {
    throw new Error(
      data.message ||
        'Error al consultar tus apuestas'
    )
  }

  return data
}

// ============================================================
// FINALIZAR PARTIDO
// ============================================================

export async function finalizarPartido(
  partidoId,
  golesLocal,
  golesVisitante
) {
  const response =
    await fetchAutenticado(
      `/postgres/partidos/${partidoId}/finalizar`,
      {
        method: 'POST',

        headers: {
          'Content-Type':
            'application/json',
        },

        body: JSON.stringify({
          golesLocal,
          golesVisitante,
        }),
      }
    )


  const data =
    await response.json()


  if (!response.ok) {
    throw new Error(
      data.message ||
        'Error al finalizar el partido'
    )
  }


  return data
}


// ============================================================
// LIQUIDAR APUESTAS DEL PARTIDO
// ============================================================

export async function liquidarPartido(
  partidoId
) {
  const response =
    await fetchAutenticado(
      `/mysql/apuestas/liquidar-partido/${partidoId}`,
      {
        method: 'POST',
      }
    )


  const data =
    await response.json()


  if (!response.ok) {
    throw new Error(
      data.message ||
        'Error al liquidar las apuestas'
    )
  }


  return data
}

// ============================================================
// CONSULTAR ESTADO DE LIQUIDACIÓN DE UN PARTIDO
// ============================================================

export async function obtenerEstadoLiquidacionPartido(
  partidoId
) {
  const response =
    await fetchAutenticado(
      `/mysql/apuestas/estado-liquidacion/${partidoId}`
    )

  const data =
    await response.json()

  if (!response.ok) {
    throw new Error(
      data.message ||
        'Error consultando el estado de liquidación'
    )
  }

  return data
}