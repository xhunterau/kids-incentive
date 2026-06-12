import { useEffect, useState } from 'react'

interface Particle {
  id: number
  x: number
  y: number
  delay: number
}

interface StarBurstProps {
  active: boolean
  gained: number
  onDone?: () => void
}

export function StarBurst({ active, gained, onDone }: StarBurstProps) {
  const [particles, setParticles] = useState<Particle[]>([])
  const [showResult, setShowResult] = useState(false)

  useEffect(() => {
    if (!active) { setParticles([]); setShowResult(false); return }

    const items: Particle[] = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: 30 + Math.random() * 40,
      y: 30 + Math.random() * 40,
      delay: i * 0.05,
    }))
    setParticles(items)
    setShowResult(false)

    const t1 = setTimeout(() => setShowResult(true), 600)
    const t2 = setTimeout(() => {
      setParticles([])
      setShowResult(false)
      onDone?.()
    }, 1800)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [active])

  if (particles.length === 0 && !showResult) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute text-2xl animate-star-burst"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            animationDelay: `${p.delay}s`,
          }}
        >
          ⭐
        </div>
      ))}
      {showResult && (
        <div className="absolute inset-0 flex items-center justify-center animate-bounce-in">
          <div className="bg-white rounded-2xl px-6 py-4 shadow-xl border border-violet-100 flex items-center gap-2">
            <span className="text-3xl">🌟</span>
            <span className="text-2xl font-black text-violet-600">+{gained}</span>
          </div>
        </div>
      )}
    </div>
  )
}
