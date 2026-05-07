"use client"

import { PixelArt, PIXEL_ARTS } from "@/components/PixelArt"

const GHOSTS = [
  { art: "ghost-main", x: "5%", y: "20%", delay: "0s", speed: "25s", scale: 3 },
  { art: "special-ghost", x: "85%", y: "55%", delay: "8s", speed: "30s", scale: 2 },
  { art: "special-cat", x: "70%", y: "15%", delay: "14s", speed: "22s", scale: 2 },
  { art: "candle-white", x: "15%", y: "70%", delay: "5s", speed: "28s", scale: 2 },
  { art: "special-fairy", x: "90%", y: "80%", delay: "11s", speed: "26s", scale: 2 },
]

export function FloatingGhosts() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {GHOSTS.map((ghost, i) => (
        <div
          key={i}
          className="absolute ghost-wander"
          style={{
            left: ghost.x,
            top: ghost.y,
            animationDelay: ghost.delay,
            animationDuration: ghost.speed,
            opacity: 0.07,
          }}
        >
          <PixelArt
            grid={PIXEL_ARTS[ghost.art] || PIXEL_ARTS["ghost-main"]}
            scale={ghost.scale}
          />
        </div>
      ))}
    </div>
  )
}
