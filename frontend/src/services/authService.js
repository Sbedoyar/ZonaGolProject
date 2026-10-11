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
// INICIAR SESIÓN CON GOOGLE
//
// Recibe únicamente la credencial temporal entregada por
// Google Identity Services.
//
// Posibles estados devueltos por el backend:
//
// AUTENTICADO
// VINCULACION_REQUERIDA
// REGISTRO_REQUERIDO
//
// Solo se guarda un JWT cuando ZonaGol realmente autentica
// al usuario.
// ============================================================

export async function iniciarSesionGoogle(
  credential
) {
  const response = await fetch(
    `${API_URL}/login/google`,
    {
      method: 'POST',
      headers: {
        'Content-Type':
          'application/json',
      },
      body: JSON.stringify({
        credential,
      }),
    }
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(
      data.message ||
        'Error al iniciar sesión con Google'
    )
  }


  // ==========================================================
  // GUARDAR ÚNICAMENTE EL JWT PROPIO DE ZONAGOL
  //
  // La credencial de Google NO se almacena.
  // ==========================================================

  if (
    data.estado === 'AUTENTICADO' &&
    data.token
  ) {
    guardarToken(
      data.token
    )
  }


  return data
}

// ============================================================
// VINCULAR GOOGLE A UNA CUENTA ZONAGOL EXISTENTE
//
// Requiere:
// - JWT ZonaGol válido
// - credential temporal de Google
//
// La credential NO se almacena.
// ============================================================

export async function vincularGoogle(
  credential
) {
  const response =
    await fetchAutenticado(
      '/google/vincular',
      {
        method: 'POST',

        headers: {
          'Content-Type':
            'application/json',
        },

        body: JSON.stringify({
          credential,
        }),
      }
    )


  const data =
    await response.json()


  if (!response.ok) {
    throw new Error(
      data.message ||
        'Error al vincular la cuenta de Google'
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
// REGISTRAR USUARIO CON GOOGLE
//
// El backend obtiene el correo y el identificador estable
// directamente desde la credencial verificada de Google.
//
// NO enviamos:
// - contraseña
// - rolId
// - correo editable
//
// La credential de Google NO se guarda.
// ============================================================

export async function registrarUsuarioGoogle(
  datos
) {
  const response = await fetch(
    `${API_URL}/registro/google`,
    {
      method: 'POST',

      headers: {
        'Content-Type':
          'application/json',
      },

      body: JSON.stringify(datos),
    }
  )


  const data =
    await response.json()


  if (!response.ok) {
    throw new Error(
      data.message ||
        'Error al crear la cuenta con Google'
    )
  }


  // ==========================================================
  // GUARDAR ÚNICAMENTE EL JWT PROPIO DE ZONAGOL
  // ==========================================================

  if (
    data.estado === 'AUTENTICADO' &&
    data.token
  ) {
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

// ============================================================
// OBTENER PARTIDOS
//
// Permite filtrar por temporada y jornada.
//
// Ejemplo:
// /postgres/partidos?temporadaId=2&jornada=1
// ============================================================

export async function obtenerPartidos(
  temporadaId = 1,
  jornada = null
) {
  const params =
    new URLSearchParams()

  params.set(
    'temporadaId',
    temporadaId
  )

  if (jornada !== null) {
    params.set(
      'jornada',
      jornada
    )
  }

  const response =
    await fetch(
      `${API_URL}/postgres/partidos?${params.toString()}`
    )

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
// ACTUALIZAR FOTO DE PERFIL
//
// Envía la imagen como multipart/form-data.
// fetchAutenticado agrega automáticamente el JWT.
// ============================================================

export async function actualizarFotoPerfil(
  archivo
) {

  if (!(archivo instanceof File)) {
    throw new Error(
      'Debes seleccionar una imagen válida'
    )
  }


  const formData =
    new FormData()


  formData.append(
    'fotoPerfil',
    archivo
  )


  const response =
    await fetchAutenticado(
      '/perfil/foto',
      {
        method: 'POST',
        body: formData,
      }
    )


  const data =
    await response.json()


  if (!response.ok) {
    throw new Error(
      data.message ||
        'No fue posible actualizar la foto de perfil'
    )
  }


  return data
}

// ============================================================
// OBTENER FOTO DE PERFIL
//
// Solicita la imagen privada al backend usando el JWT.
// Devuelve un Blob que después React podrá mostrar.
// ============================================================

export async function obtenerFotoPerfil() {

  const response =
    await fetchAutenticado(
      '/perfil/foto'
    )


  if (!response.ok) {

    let mensaje =
      'No fue posible obtener la foto de perfil'


    try {

      const data =
        await response.json()

      mensaje =
        data.message ||
        mensaje

    } catch {
      // La respuesta no contenía JSON.
    }


    throw new Error(
      mensaje
    )
  }


  const blob =
    await response.blob()


  return blob
}
// ============================================================
// SINCRONIZAR JORNADA DEPORTIVA DESDE API-FOOTBALL
//
// Requiere JWT.
// El backend permite únicamente:
// 1 = ADMINISTRADOR
// 2 = OPERADOR
// ============================================================

export async function sincronizarJornadaDeportiva({
  leagueId,
  season,
  round,
  numeroJornada,
}) {
  const response =
    await fetchAutenticado(
      '/sports-sync/jornada',
      {
        method: 'POST',

        headers: {
          'Content-Type':
            'application/json',
        },

        body: JSON.stringify({
          leagueId,
          season,
          round,
          numeroJornada,
        }),
      }
    )

  const data =
    await response.json()

  if (!response.ok) {
    throw new Error(
      data.message ||
        'No fue posible sincronizar la jornada'
    )
  }

  return data
}

// ============================================================
// CONSULTAR ESTADO DE SINCRONIZACIÓN DEPORTIVA
//
// Requiere JWT.
// Disponible para:
// 1 = ADMINISTRADOR
// 2 = OPERADOR
// ============================================================

export async function obtenerEstadoSincronizacionDeportiva() {

  const response =
    await fetchAutenticado(
      '/sports-sync/estado'
    )

  const data =
    await response.json()

  if (!response.ok) {
    throw new Error(
      data.message ||
        'No fue posible consultar el estado de sincronización'
    )
  }

  return data
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

// ============================================================
// PREPARAR RECARGA CON WOMPI
//
// Requiere JWT.
// Solo disponible para CLIENTE.
// ============================================================

export async function prepararRecargaWompi(
  monto
) {

  const response =
    await fetchAutenticado(
      '/pagos/wompi/checkout',
      {
        method: 'POST',

        headers: {
          'Content-Type':
            'application/json',
        },

        body: JSON.stringify({
          monto,
        }),
      }
    )


  const data =
    await response.json()


  if (!response.ok) {

    throw new Error(
      data.message ||
        'No fue posible preparar la recarga'
    )
  }


  return data
}