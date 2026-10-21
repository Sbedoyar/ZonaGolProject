function Toast({ mensaje }) {
  if (!mensaje) {
    return null
  }

  return (
    <div
      className="toast is-visible"
      role="status"
      aria-live="polite"
    >
      {mensaje}
    </div>
  )
}

export default Toast