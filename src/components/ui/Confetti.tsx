import { useEffect, useState } from 'react'

interface Particle {
  id: number
  x: number
  color: string
  size: number
  duration: number
  delay: number
  rotate: number
}

const COLORS = ['#FFD700', '#FF6B6B', '#4ECDC4', '#A855F7', '#22C55E', '#F97316', '#60A5FA', '#F472B6']

interface ConfettiProps {
  active: boolean
  onDone?: () => void
}

export function Confetti({ active, onDone }: ConfettiProps) {
  const [particles, setParticles] = useState<Particle[]>([])

  useEffect(() => {
    if (!active) { setParticles([]); return }

    const items: Particle[] = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: 6 + Math.random() * 8,
      duration: 1.2 + Math.random() * 1.2,
      delay: Math.random() * 0.4,
      rotate: Math.random() * 360,
    }))
    setParticles(items)

    const maxDuration = Math.max(...items.map(p => (p.duration + p.delay) * 1000))
    const t = setTimeout(() => {
      setParticles([])
      onDone?.()
    }, maxDuration + 100)
    return () => clearTimeout(t)
  }, [active])

  if (particles.length === 0) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute animate-confetti-fall"
          style={{
            left: `${p.x}%`,
            top: '-10px',
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            transform: `rotate(${p.rotate}deg)`,
          }}
        />
      ))}
    </div>
  )
}
