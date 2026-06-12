const AVATARS = [
  '🐼', '🦊', '🐻', '🐱', '🐶', '🐸',
  '🦁', '🐧', '🦄', '🐨', '🐯', '🐰',
  '🐮', '🐷', '🐹', '🐭', '🦋', '🐢',
  '🦉', '🦚', '🦜', '🐬', '🐙', '🐺',
]

interface AvatarPickerProps {
  value: string
  onChange: (emoji: string) => void
  disabled?: boolean
}

export function AvatarPicker({ value, onChange, disabled }: AvatarPickerProps) {
  return (
    <div className="grid grid-cols-6 gap-2">
      {AVATARS.map(emoji => (
        <button
          key={emoji}
          onClick={() => onChange(emoji)}
          disabled={disabled}
          className={`
            aspect-square rounded-2xl text-2xl flex items-center justify-center
            transition-all active:scale-90
            ${value === emoji
              ? 'bg-violet-100 ring-2 ring-violet-500 scale-105'
              : 'bg-gray-50 hover:bg-violet-50'
            }
          `}
        >
          {emoji}
        </button>
      ))}
    </div>
  )
}
