import {
  useEffect,
  useState,
} from 'react'

import Login from './components/Login'
import Register from './components/Register'
import Recover from './components/Recover'
import ResetPassword from './components/ResetPassword'
import Home from './components/Home'

import {
  obtenerToken,
  eliminarToken,
  fetchAutenticado,
} from './services/authService'




function App() {

  // ==========================================================
  // TOKEN DE RECUPERACIÓN DESDE LA URL
  // ==========================================================

  const tokenURL =
    new URLSearchParams(
      window.location.search
    ).get('token')


  // ==========================================================
  // ESTADO
  // ==========================================================

  const [usuario, setUsuario] =
    useState(null)


  const [pantalla, setPantalla] =
    useState(
      tokenURL
        ? 'reset-password'
        : 'login'
    )


  const [
    tokenRecuperacion,
    setTokenRecuperacion,
  ] = useState(
    tokenURL
  )


  const [
    verificandoSesion,
    setVerificandoSesion,
  ] = useState(true)

  const [
    registroGooglePendiente,
    setRegistroGooglePendiente,
  ] = useState(null)


  // ==========================================================
  // RECUPERAR SESIÓN AL RECARGAR LA PÁGINA
  // ==========================================================

  useEffect(() => {

    async function recuperarSesion() {

      // Si estamos entrando mediante un enlace
      // de recuperación de contraseña, no intentamos
      // restaurar una sesión normal.
      if (tokenURL) {

        setVerificandoSesion(false)

        return
      }


      const token =
        obtenerToken()


      // No hay JWT guardado.
      if (!token) {

        setVerificandoSesion(false)

        return
      }


      try {

        // ================================================
        // COMPROBAR EL JWT CONTRA EL BACKEND
        // ================================================

        const response =
          await fetchAutenticado(
            '/perfil-protegido'
          )


        const data =
          await response.json()


        // ================================================
        // JWT INVÁLIDO O EXPIRADO
        // ================================================

        if (!response.ok) {

          eliminarToken()

          setUsuario(null)

          setPantalla('login')

          return
        }


        // ================================================
        // RESTAURAR USUARIO
        // ================================================

        setUsuario({
          id:
            data.usuario.usuarioId,

          correo:
            data.usuario.correo,

          rolId:
            data.usuario.rolId,

          celular:
            data.usuario.celular,

          fechaRegistro:
            data.usuario.fechaRegistro,

          tieneFotoPerfil:
            data.usuario.tieneFotoPerfil,
        })


      } catch (error) {

        console.error(
          'Error recuperando sesión:',
          error
        )


        eliminarToken()

        setUsuario(null)

        setPantalla('login')

      } finally {

        setVerificandoSesion(false)

      }
    }


    recuperarSesion()

  }, [])


  // ==========================================================
  // LOGIN
  // ==========================================================

  const handleLogin = (
    usuarioAutenticado
  ) => {

    setUsuario(
      usuarioAutenticado
    )
  }


  // ==========================================================
  // REGISTRO
  // ==========================================================

  const handleRegister = (
    usuarioRegistrado
  ) => {

    setUsuario(
      usuarioRegistrado
    )
  }

  // ==========================================================
  // INICIAR REGISTRO DESDE GOOGLE
  //
  // La credencial de Google queda únicamente
  // en memoria de React.
  // ==========================================================

  const handleGoRegisterGoogle = (
    datosGoogle
  ) => {

    setRegistroGooglePendiente(
      datosGoogle
    )

    setPantalla(
      'register'
    )
}


  // ==========================================================
  // CERRAR SESIÓN
  // ==========================================================

  const handleCerrarSesion = () => {

    eliminarToken()

    setUsuario(null)

    setTokenRecuperacion(null)

    setPantalla('login')


    window.history.replaceState(
      {},
      '',
      window.location.pathname
    )
  }


  // ==========================================================
  // VOLVER AL LOGIN
  // ==========================================================

  const handleGoLogin = () => {

    setTokenRecuperacion(null)

    setPantalla('login')

    setRegistroGooglePendiente(null)


    window.history.replaceState(
      {},
      '',
      window.location.pathname
    )
  }


  // ==========================================================
  // MIENTRAS VALIDAMOS LA SESIÓN
  //
  // Evita que aparezca el Login durante unas milésimas
  // antes de recuperar el usuario.
  // ==========================================================

  if (verificandoSesion) {
    return null
  }


  // ==========================================================
  // USUARIO AUTENTICADO
  // ==========================================================

  if (usuario) {

    return (
      <Home
        usuario={usuario}

        onCerrarSesion={
          handleCerrarSesion
        }
      />
    )
  }


  // ==========================================================
  // REGISTRO
  // ==========================================================

  if (
    pantalla === 'register'
  ) {

    return (
      <Register
        onGoLogin={
          handleGoLogin
        }

        onRegister={
          handleRegister
        }

          registroGoogle={
            registroGooglePendiente
          }
      />
    )
  }


  // ==========================================================
  // RECUPERACIÓN
  // ==========================================================

  if (
    pantalla === 'recover'
  ) {

    return (
      <Recover
        onGoLogin={
          handleGoLogin
        }
      />
    )
  }


  // ==========================================================
  // RESTABLECER CONTRASEÑA
  // ==========================================================

  if (
    pantalla ===
    'reset-password'
  ) {

    return (
      <ResetPassword
        token={
          tokenRecuperacion
        }

        onGoLogin={
          handleGoLogin
        }
      />
    )
  }


  // ==========================================================
  // LOGIN
  // ==========================================================

  return (
    <Login
      onLogin={
        handleLogin
      }

      onGoRegister={() =>
        setPantalla(
          'register'
        )
      }

      onGoRecover={() =>
        setPantalla(
          'recover'
        )
      }
      onGoRegisterGoogle={
        handleGoRegisterGoogle
      }
    />
  )
}


export default App