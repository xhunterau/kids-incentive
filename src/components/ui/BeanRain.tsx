import { useEffect, useState } from 'react'

interface Drop {
  id: number
  x: number
  duration: number
  delay: number
  size: number
}

interface BeanRainProps {
  active: boolean
  gained: number
  onDone?: () => void
}

export function BeanRain({ active, gained, onDone }: BeanRainProps) {
  const [drops, setDrops] = useState<Drop[]>([])
  const [showResult, setShowResult] = useState(false)

  useEffect(() => {
    if (!active) { setDrops([]); setShowResult(false); return }

    const items: Drop[] = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      duration: 0.8 + Math.random() * 0.8,
      delay: Math.random() * 0.5,
      size: 16 + Math.random() * 10,
    }))
    setDrops(items)

    const t1 = setTimeout(() => setShowResult(true), 500)
    const t2 = setTimeout(() => {
      setDrops([])
      setShowResult(false)
      onDone?.()
    }, 1800)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [active])

  if (drops.length === 0 && !showResult) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
      {drops.map(d => (
        <div
          key={d.id}
          className="absolute animate-bean-rain"
          style={{
            left: `${d.x}%`,
            top: '-20px',
            fontSize: d.size,
            animationDuration: `${d.duration}s`,
            animationDelay: `${d.delay}s`,
          }}
        >
          🪙
        </div>
      ))}
      {showResult && (
        <div className="absolute inset-0 flex items-center justify-center animate-bounce-in">
          <div className="bg-white rounded-2xl px-6 py-4 shadow-xl border border-green-100 flex items-center gap-2">
            <span className="text-3xl">🪙</span>
            <span className="text-2xl font-black text-green-600">+{gained}</span>
          </div>
        </div>
      )}
    </div>
  )
}
