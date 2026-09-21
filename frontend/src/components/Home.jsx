import {
  useEffect,
  useRef,
  useState,
} from 'react'

import '../styles/styles.css'

import Header from './home/Header'
import Hero from './home/Hero'
import MatchesSection from './home/MatchesSection'
import MyBets from './home/MyBets'
import ResponsibleNote from './home/ResponsibleNote'
import Footer from './home/Footer'
import Toast from './home/Toast'
import AdminPanel from './home/AdminPanel'

import {
  obtenerSaldo,
} from '../services/authService'


function Home({
  usuario,
  onCerrarSesion,
}) {
  const [search, setSearch] =
    useState('')

  const [
    toastMessage,
    setToastMessage,
  ] = useState('')

  const [
    saldoDisponible,
    setSaldoDisponible,
  ] = useState(null)

  const [vista, setVista] =
    useState('inicio')

  const toastTimerRef =
    useRef(null)


  // ============================================================
  // TOAST
  // ============================================================

  const showToast = (mensaje) => {

    setToastMessage(mensaje)


    if (toastTimerRef.current) {

      clearTimeout(
        toastTimerRef.current
      )
    }


    toastTimerRef.current =
      setTimeout(() => {

        setToastMessage('')

        toastTimerRef.current = null

      }, 3300)
  }


  // ============================================================
  // SALDO REAL
  // ============================================================

  useEffect(() => {

    let activo = true


    const cargarSaldo =
      async () => {

        try {

          const respuesta =
            await obtenerSaldo()


          if (activo) {

            setSaldoDisponible(
              respuesta.datos
                .saldoDisponible
            )
          }

        } catch (error) {

          console.error(
            'Error cargando saldo:',
            error
          )


          if (activo) {

            setSaldoDisponible(
              null
            )
          }
        }
      }


    cargarSaldo()


    return () => {

      activo = false
    }

  }, [])


  // ============================================================
  // LIMPIAR TOAST
  // ============================================================

  useEffect(() => {

    return () => {

      if (
        toastTimerRef.current
      ) {

        clearTimeout(
          toastTimerRef.current
        )
      }
    }

  }, [])


  // ============================================================
  // VER INICIO
  // ============================================================

  const verInicio = () => {

    setVista('inicio')


    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }


  // ============================================================
  // VER MIS APUESTAS
  // ============================================================

  const verMisApuestas = () => {

    setVista('apuestas')


    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }


  // ============================================================
  // VER ADMINISTRACIÓN
  // ============================================================

  const verAdministracion = () => {

    setVista(
      'administracion'
    )


    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }


  // ============================================================
  // RENDER
  // ============================================================

  return (

    <div className="home-page">

      {/* ========================================================
          HEADER
          ======================================================== */}

      <Header

        usuario={
          usuario
        }

        onCerrarSesion={
          onCerrarSesion
        }

        search={
          search
        }

        onSearchChange={
          setSearch
        }

        onNotify={
          showToast
        }

        saldoDisponible={
          saldoDisponible
        }

        vista={
          vista
        }

        onVerInicio={
          verInicio
        }

        onVerMisApuestas={
          verMisApuestas
        }

        onVerAdministracion={
          verAdministracion
        }

      />


      {/* ========================================================
          CONTENIDO
          ======================================================== */}

      <main>

        {/* ======================================================
            INICIO
            ====================================================== */}

        {vista === 'inicio' && (

          <>

            <Hero />


            <MatchesSection

              search={
                search
              }

              onClearSearch={() =>
                setSearch('')
              }

              onNotify={
                showToast
              }

              onSaldoActualizado={
                setSaldoDisponible
              }

            />


            <ResponsibleNote />

          </>
        )}


        {/* ======================================================
            MIS APUESTAS
            ====================================================== */}

        {vista === 'apuestas' && (

          <MyBets

            onNotify={
              showToast
            }

          />
        )}


        {/* ======================================================
            ADMINISTRACIÓN
            ====================================================== */}

        {vista ===
          'administracion' && (

          <AdminPanel
            onNotify={
              showToast
            }
          />
        )}

      </main>


      {/* ========================================================
          FOOTER
          ======================================================== */}

      <Footer />


      {/* ========================================================
          TOAST
          ======================================================== */}

      <Toast

        mensaje={
          toastMessage
        }

      />

    </div>
  )
}


export default Home