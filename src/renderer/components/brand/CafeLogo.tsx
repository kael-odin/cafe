import type { CSSProperties } from 'react'

import brandLogo from '../../../../resources/icon.png'

interface CafeLogoProps {
  size?: 'sm' | 'md' | 'lg' | number
  className?: string
  animated?: boolean
}

const SIZE_PRESETS = {
  sm: 28,
  md: 48,
  lg: 96,
} as const

function getScaledStyles(size: number): {
  padding: number
  radius: number
} {
  return {
    padding: size <= 32 ? 5 : size <= 56 ? 7 : 11,
    radius: Math.max(10, Math.round(size * 0.28)),
  }
}

export function CafeLogo({ size = 'md', className = '', animated = false }: CafeLogoProps): JSX.Element {
  const pixelSize = typeof size === 'number' ? size : SIZE_PRESETS[size]
  const styles = getScaledStyles(pixelSize)

  return (
    <div
      className={`relative no-select ${className}`.trim()}
      style={{ width: pixelSize, height: pixelSize }}
    >
      <div
        className="absolute inset-0 z-10 brand-logo-shell"
        style={{ borderRadius: styles.radius }}
      />

      <div
        className="relative z-20 h-full w-full"
        style={{ padding: styles.padding }}
      >
        <img
          src={brandLogo}
          alt="Cafe logo"
          className="h-full w-full object-contain brand-logo-image"
          style={{ '--brand-logo-shadow': 'none' } as CSSProperties}
        />
      </div>
    </div>
  )
}
