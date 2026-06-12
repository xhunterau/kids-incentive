interface EmptyStateProps {
  emoji?: string
  title: string
  subtitle?: string
}

export function EmptyState({ emoji, title, subtitle }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 animate-fade-in">
      {emoji && <span className="text-5xl leading-none">{emoji}</span>}
      <p className="font-black text-gray-500 text-base text-center">{title}</p>
      {subtitle && <p className="text-sm text-gray-400 text-center">{subtitle}</p>}
    </div>
  )
}
