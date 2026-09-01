import { useState } from 'react'
import BetSlip from './BetSlip'

function MobileBetSlip({
  picks,
  stake,
  onStakeChange,
  onRemovePick,
  onPlaceBet,
}) {
  const [abierto, setAbierto] = useState(false)

  const cantidad = Object.keys(picks).length

  const handlePlaceBetMobile = () => {
    onPlaceBet()

    if (stake >= 1000) {
      setAbierto(false)
    }
  }

  return (
    <>
      <button
        id="mobile-slip-button"
        className="mobile-slip-button"
        type="button"
        aria-controls="mobile-slip-panel"
        aria-expanded={abierto}
        onClick={() => setAbierto(true)}
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M3 9a3 3 0 0 0 0 6v3h18v-3a3 3 0 0 0 0-6V6H3v3Z" />
          <path d="M13 8v2M13 14v2" />
        </svg>

        Mi cupón

        <span>
          {cantidad}
        </span>
      </button>

      {abierto && (
        <div
          id="mobile-slip-backdrop"
          className="mobile-slip-backdrop"
          onClick={() => setAbierto(false)}
        >
          <aside
            id="mobile-slip-panel"
            className="mobile-slip-panel"
            aria-label="Cupón de apuestas móvil"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="mobile-slip-panel__handle">
            </div>

            <button
              id="mobile-slip-close"
              className="mobile-slip-panel__close"
              type="button"
              aria-label="Cerrar cupón"
              onClick={() => setAbierto(false)}
            >
              ×
            </button>

            <div id="mobile-slip">
              <BetSlip
                picks={picks}
                stake={stake}
                onStakeChange={onStakeChange}
                onRemovePick={onRemovePick}
                onPlaceBet={handlePlaceBetMobile}
              />
            </div>
          </aside>
        </div>
      )}
    </>
  )
}

export default MobileBetSlip