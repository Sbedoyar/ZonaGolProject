import { useEffect, useRef, useState } from 'react'
import '../styles/styles.css'

import Header from './home/Header'
import Hero from './home/Hero'
import MatchesSection from './home/MatchesSection'
import ResponsibleNote from './home/ResponsibleNote'
import Footer from './home/Footer'
import Toast from './home/Toast'

function Home({ usuario, onCerrarSesion }) {
  const [search, setSearch] = useState('')
  const [toastMessage, setToastMessage] = useState('')

  const toastTimerRef = useRef(null)

  const showToast = (mensaje) => {
    setToastMessage(mensaje)

    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current)
    }

    toastTimerRef.current = setTimeout(() => {
      setToastMessage('')
      toastTimerRef.current = null
    }, 3300)
  }

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current)
      }
    }
  }, [])

  return (
    <div className="home-page">
      <Header
        usuario={usuario}
        onCerrarSesion={onCerrarSesion}
        search={search}
        onSearchChange={setSearch}
        onNotify={showToast}
      />

      <main>
        <Hero />

        <MatchesSection
          search={search}
          onClearSearch={() => setSearch('')}
          onNotify={showToast}
        />

        <ResponsibleNote />
      </main>

      <Footer />

      <Toast mensaje={toastMessage} />
    </div>
  )
}

export default Home