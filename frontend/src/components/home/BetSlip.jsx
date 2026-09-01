function BetSlip({
  picks,
  stake,
  onStakeChange,
  onRemovePick,
  onPlaceBet,
}) {
  const selecciones = Object.values(picks)

  const cuotaTotal =
    selecciones.length > 0
      ? selecciones.reduce(
          (total, pick) => total * pick.odd,
          1
        )
      : 0

  const gananciaPotencial = stake * cuotaTotal

  const formatoCOP = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  })

  if (selecciones.length === 0) {
    return (
      <div className="bet-slip">
        <header className="slip-header">
          <h3>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 9a3 3 0 0 0 0 6v3h18v-3a3 3 0 0 0 0-6V6H3v3Z" />
              <path d="M13 8v2M13 14v2" />
            </svg>

            Mi cupón
          </h3>

          <span className="slip-count">
            0
          </span>
        </header>

        <div className="slip-empty">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 9a3 3 0 0 0 0 6v3h18v-3a3 3 0 0 0 0-6V6H3v3Z" />
            <path d="M13 8v2M13 14v2" />
          </svg>

          <strong>
            Tu cupón está vacío
          </strong>

          <p>
            Selecciona una cuota para añadir tu primera apuesta.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bet-slip">
      <header className="slip-header">
        <h3>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 9a3 3 0 0 0 0 6v3h18v-3a3 3 0 0 0 0-6V6H3v3Z" />
            <path d="M13 8v2M13 14v2" />
          </svg>

          Mi cupón
        </h3>

        <span className="slip-count">
          {selecciones.length}
        </span>
      </header>

      <div className="slip-items">
        {selecciones.map((pick) => (
          <div
            key={pick.matchId}
            className="slip-item"
          >
            <strong>
              {pick.label}
            </strong>

            <button
              type="button"
              onClick={() =>
                onRemovePick(pick.matchId)
              }
              aria-label="Quitar selección"
            >
              ×
            </button>

            <small>
              {pick.match}
            </small>

            <em>
              {pick.odd.toFixed(2)}
            </em>
          </div>
        ))}
      </div>

      <div className="slip-body">
        <label>
          Valor a apostar
        </label>

        <div className="stake-input">
          <span>$</span>

          <input
            type="number"
            min="0"
            step="1000"
            inputMode="numeric"
            value={stake || ''}
            placeholder="0"
            onChange={(event) =>
              onStakeChange(event.target.value)
            }
          />
        </div>

        <div className="quick-stakes">
          <button
            type="button"
            onClick={() => onStakeChange(10000)}
          >
            $10.000
          </button>

          <button
            type="button"
            onClick={() => onStakeChange(20000)}
          >
            $20.000
          </button>

          <button
            type="button"
            onClick={() => onStakeChange(50000)}
          >
            $50.000
          </button>
        </div>

        <div className="slip-summary">
          <div>
            <span>
              Cuota total
            </span>

            <strong>
              {cuotaTotal.toFixed(2)}
            </strong>
          </div>

          <div>
            <span>
              Ganancia potencial
            </span>

            <strong>
              {formatoCOP.format(
                Math.round(gananciaPotencial)
              )}
            </strong>
          </div>
        </div>

        <button
        className="button button--primary button--block"
        type="button"
        onClick={onPlaceBet}
        >
        Realizar apuesta
        </button>
      </div>
    </div>
  )
}

export default BetSlip