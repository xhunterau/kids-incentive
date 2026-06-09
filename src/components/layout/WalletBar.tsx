import { useAuth } from '../../hooks/useAuth'

export function WalletBar() {
  const { profile } = useAuth()
  if (!profile) return null

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white/90 backdrop-blur border-b border-violet-100 h-14">
      <div className="max-w-lg mx-auto h-full flex items-center justify-around px-4">
        <CurrencyChip icon="⭐" value={profile.stars} textColor="text-amber-500" bg="bg-amber-50" />
        <CurrencyChip icon="🌟" value={profile.magic_stars} textColor="text-violet-600" bg="bg-violet-50" />
        <CurrencyChip icon="🪙" value={profile.gold_beans} textColor="text-green-600" bg="bg-green-50" />
      </div>
    </header>
  )
}

function CurrencyChip({
  icon, value, textColor, bg,
}: {
  icon: string
  value: number
  textColor: string
  bg: string
}) {
  return (
    <div className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full ${bg}`}>
      <span className="text-xl leading-none">{icon}</span>
      <span className={`text-base font-black ${textColor}`}>{value}</span>
    </div>
  )
}
