interface PinPadProps {
  value: string
  onChange: (pin: string) => void
  disabled?: boolean
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫']

export default function PinPad({ value, onChange, disabled }: PinPadProps) {
  function handleKey(key: string) {
    if (disabled) return
    if (key === '⌫') {
      onChange(value.slice(0, -1))
    } else if (key && value.length < 4) {
      onChange(value + key)
    }
  }

  return (
    <div className="w-full max-w-xs mx-auto space-y-3">
      {/* Dot indicators */}
      <div className="flex justify-center gap-4 py-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full transition-all duration-150 ${
              i < value.length ? 'bg-violet-500 scale-110' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>

      {/* Number grid */}
      <div className="grid grid-cols-3 gap-3">
        {KEYS.map((key, idx) => (
          <button
            key={idx}
            onClick={() => handleKey(key)}
            disabled={disabled || key === ''}
            className={`h-[72px] rounded-2xl text-2xl font-black transition-all active:scale-95 ${
              key === ''
                ? 'invisible'
                : key === '⌫'
                ? 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                : 'bg-white shadow-sm text-slate-700 hover:bg-violet-50 active:bg-violet-100'
            } disabled:opacity-40`}
          >
            {key}
          </button>
        ))}
      </div>
    </div>
  )
}
