import {
  useEffect,
  useRef,
  useState,
} from 'react'


function CustomSelect({
  value,
  options = [],
  onChange,
  label,
  icon,
  className = '',
  ariaLabel,
}) {
  const [
    abierto,
    setAbierto,
  ] = useState(false)

  const contenedorRef =
    useRef(null)


  const opcionSeleccionada =
    options.find(
      (option) =>
        String(option.value) ===
        String(value)
    ) || options[0]


  useEffect(() => {
    function cerrarAlHacerClickFuera(event) {
      if (
        contenedorRef.current &&
        !contenedorRef.current.contains(
          event.target
        )
      ) {
        setAbierto(false)
      }
    }

    function cerrarConEscape(event) {
      if (event.key === 'Escape') {
        setAbierto(false)
      }
    }

    document.addEventListener(
      'mousedown',
      cerrarAlHacerClickFuera
    )

    document.addEventListener(
      'keydown',
      cerrarConEscape
    )

    return () => {
      document.removeEventListener(
        'mousedown',
        cerrarAlHacerClickFuera
      )

      document.removeEventListener(
        'keydown',
        cerrarConEscape
      )
    }
  }, [])


  function seleccionar(option) {
    onChange(option.value)
    setAbierto(false)
  }


  return (
    <div
      className={
        `custom-select ${className} ${
          abierto
            ? 'is-open'
            : ''
        }`
      }
      ref={contenedorRef}
    >

      {label && (
        <span className="custom-select__label">
          {label}
        </span>
      )}


      <button
        className="custom-select__trigger"
        type="button"
        aria-haspopup="listbox"
        aria-expanded={abierto}
        aria-label={ariaLabel}
        onClick={() =>
          setAbierto(
            (estadoActual) =>
              !estadoActual
          )
        }
      >

        {icon && (
          <span className="custom-select__icon">
            {icon}
          </span>
        )}


        <span className="custom-select__value">
          {opcionSeleccionada?.label ||
            'Seleccionar'}
        </span>


        <svg
          className="custom-select__chevron"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="m7 9 5 5 5-5" />
        </svg>

      </button>


      {abierto && (

        <div
          className="custom-select__menu"
          role="listbox"
        >

          {label && (
            <span className="custom-select__menu-label">
              {label}
            </span>
          )}


          <div className="custom-select__options">

            {options.map((option) => {

              const seleccionada =
                String(option.value) ===
                String(value)

              return (
                <button
                  key={option.value}
                  className={
                    `custom-select__option ${
                      seleccionada
                        ? 'is-selected'
                        : ''
                    }`
                  }
                  type="button"
                  role="option"
                  aria-selected={
                    seleccionada
                  }
                  onClick={() =>
                    seleccionar(option)
                  }
                >

                  <span>
                    {option.label}
                  </span>


                  {seleccionada && (
                    <svg
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path d="m5 12 4 4L19 6" />
                    </svg>
                  )}

                </button>
              )
            })}

          </div>

        </div>
      )}

    </div>
  )
}


export default CustomSelect