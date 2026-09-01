const API_URL = 'http://localhost:5000/api'

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

  return data
}

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

  return data
}

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