import { useState } from 'react'

import Login from './components/Login'
import Register from './components/Register'
import Recover from './components/Recover'
import Home from './components/Home'

function App() {
  const [usuario, setUsuario] = useState(null)
  const [pantalla, setPantalla] = useState('login')

  const handleLogin = (usuarioAutenticado) => {
    setUsuario(usuarioAutenticado)
  }

  const handleRegister = (usuarioRegistrado) => {
    setUsuario(usuarioRegistrado)
  }

  const handleCerrarSesion = () => {
    setUsuario(null)
    setPantalla('login')
  }

  // Si hay usuario autenticado, mostramos Home
  if (usuario) {
    return (
      <Home
        usuario={usuario}
        onCerrarSesion={handleCerrarSesion}
      />
    )
  }

  // Pantalla de registro
  if (pantalla === 'register') {
    return (
      <Register
        onGoLogin={() => setPantalla('login')}
        onRegister={handleRegister}
      />
    )
  }

  // Pantalla de recuperación
  if (pantalla === 'recover') {
    return (
      <Recover
        onGoLogin={() => setPantalla('login')}
      />
    )
  }

  // Pantalla de login
  return (
    <Login
      onLogin={handleLogin}
      onGoRegister={() => setPantalla('register')}
      onGoRecover={() => setPantalla('recover')}
    />
  )
}

export default App