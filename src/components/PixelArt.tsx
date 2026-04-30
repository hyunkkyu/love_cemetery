"use client"

/**
 * 픽셀아트 렌더러
 * grid: 2D 배열, 각 셀은 색상 문자열 또는 "" (투명)
 * scale: 픽셀 크기 (기본 4px)
 */
interface PixelArtProps {
  grid: string[][]
  scale?: number
  className?: string
  animated?: boolean
}

export function PixelArt({ grid, scale = 4, className = "", animated = false }: PixelArtProps) {
  const height = grid.length
  const width = grid[0]?.length || 0

  return (
    <div
      className={`inline-block ${animated ? "ghost-float" : ""} ${className}`}
      style={{
        width: width * scale,
        height: height * scale,
        imageRendering: "pixelated",
      }}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width={width * scale}
        height={height * scale}
        style={{ imageRendering: "pixelated" }}
      >
        {grid.map((row, y) =>
          row.map((color, x) =>
            color ? (
              <rect
                key={`${x}-${y}`}
                x={x}
                y={y}
                width={1}
                height={1}
                fill={color}
              />
            ) : null
          )
        )}
      </svg>
    </div>
  )
}

// 색상 단축
const W = "#ffffff"
const B = "#000000"
const G = "#888899"  // ghost gray
const P = "#b088f0"  // purple
const PD = "#8060c0" // dark purple
const R = "#ff5555"  // red
const RD = "#cc3333"  // dark red
const PK = "#ffaacc" // pink
const Y = "#ffdd44"  // yellow
const YD = "#ddaa22" // dark yellow
const O = "#ff9933"  // orange
const GR = "#55cc55" // green
const GRD = "#338833" // dark green
const BL = "#5588ff" // blue
const BLD = "#3366cc" // dark blue
const SK = "#ffddbb" // skin
const BR = "#8b6914" // brown
const BRD = "#5a4410" // dark brown
const _ = ""         // transparent

// ===== 아이템 픽셀아트 정의 =====

export const PIXEL_ARTS: Record<string, string[][]> = {
  // 수호 유령 (메인 캐릭터 - 찰리 스타일)
  "ghost-main": [
    [_,_,_,_,W,W,W,W,W,W,_,_,_,_],
    [_,_,_,W,W,W,W,W,W,W,W,_,_,_],
    [_,_,W,W,W,W,W,W,W,W,W,W,_,_],
    [_,W,W,W,W,W,W,W,W,W,W,W,W,_],
    [_,W,W,B,B,W,W,W,B,B,W,W,W,_],
    [_,W,W,B,B,W,W,W,B,B,W,W,W,_],
    [_,W,W,W,W,W,W,W,W,W,W,W,W,_],
    [_,W,W,W,W,W,B,W,W,W,W,W,W,_],
    [_,W,W,W,W,W,W,W,W,W,W,W,W,_],
    [W,W,W,W,W,W,W,W,W,W,W,W,W,W],
    [W,W,W,W,W,W,W,W,W,W,W,W,W,W],
    [W,W,_,W,W,W,W,W,W,W,W,_,W,W],
    [W,_,_,_,W,W,W,W,W,W,_,_,_,W],
  ],

  // 빨간 장미
  "flower-rose": [
    [_,_,_,_,R,R,_,_,_,_],
    [_,_,_,R,RD,R,R,_,_,_],
    [_,_,R,RD,RD,RD,R,_,_,_],
    [_,R,RD,R,RD,R,RD,R,_,_],
    [_,_,R,RD,RD,RD,R,_,_,_],
    [_,_,_,R,R,R,_,_,_,_],
    [_,_,_,_,GR,_,_,_,_,_],
    [_,_,_,GR,GR,_,_,_,_,_],
    [_,_,GR,_,GR,_,_,_,_,_],
    [_,_,_,_,GR,_,_,_,_,_],
  ],

  // 튤립
  "flower-tulip": [
    [_,_,_,PK,PK,PK,_,_,_,_],
    [_,_,PK,PK,PK,PK,PK,_,_,_],
    [_,PK,PK,PK,PK,PK,PK,PK,_,_],
    [_,PK,PK,W,PK,W,PK,PK,_,_],
    [_,_,PK,PK,PK,PK,PK,_,_,_],
    [_,_,_,GR,GR,GR,_,_,_,_],
    [_,_,_,_,GR,_,_,_,_,_],
    [_,_,GRD,_,GR,_,_,_,_,_],
    [_,_,_,GRD,GR,_,_,_,_,_],
    [_,_,_,_,GR,_,_,_,_,_],
  ],

  // 해바라기
  "flower-sunflower": [
    [_,_,Y,_,Y,Y,_,Y,_,_],
    [_,Y,Y,Y,Y,Y,Y,Y,Y,_],
    [Y,Y,Y,BR,BR,BR,Y,Y,Y,_],
    [_,Y,BR,BR,BRD,BR,BR,Y,_],
    [Y,Y,BR,BRD,BRD,BRD,BR,Y,Y],
    [_,Y,BR,BR,BRD,BR,BR,Y,_],
    [Y,Y,Y,BR,BR,BR,Y,Y,Y,_],
    [_,Y,Y,Y,Y,Y,Y,Y,Y,_],
    [_,_,_,_,GR,_,_,_,_,_],
    [_,_,_,_,GR,_,_,_,_,_],
  ],

  // 벚꽃
  "flower-cherry": [
    [_,_,PK,_,_,_,PK,_,_,_],
    [_,PK,PK,PK,_,PK,PK,PK,_,_],
    [PK,PK,W,PK,PK,PK,W,PK,_,_],
    [_,PK,PK,PK,PK,PK,PK,_,_,_],
    [_,_,PK,PK,PK,PK,_,_,_,_],
    [_,_,_,BR,_,BR,_,_,_,_],
    [_,_,BR,_,_,_,BR,_,_,_],
    [_,_,_,_,_,_,_,_,_,_],
  ],

  // 꽃다발
  "flower-bouquet": [
    [_,_,R,_,PK,_,Y,_,_,_],
    [_,R,RD,R,PK,Y,YD,Y,_,_],
    [R,RD,R,PK,PK,Y,YD,Y,PK,_],
    [_,R,PK,PK,W,PK,Y,PK,PK,_],
    [_,_,GR,GR,GR,GR,GR,_,_,_],
    [_,_,_,BR,GR,BR,_,_,_,_],
    [_,_,BR,_,GR,_,BR,_,_,_],
    [_,_,BR,_,GR,_,BR,_,_,_],
    [_,_,_,BR,BR,BR,_,_,_,_],
  ],

  // 흰 초
  "candle-white": [
    [_,_,_,_,O,_,_,_,_],
    [_,_,_,Y,Y,Y,_,_,_],
    [_,_,_,_,Y,_,_,_,_],
    [_,_,_,W,W,W,_,_,_],
    [_,_,_,W,W,W,_,_,_],
    [_,_,_,W,W,W,_,_,_],
    [_,_,_,W,W,W,_,_,_],
    [_,_,_,W,W,W,_,_,_],
    [_,_,G,G,G,G,G,_,_],
  ],

  // 향초
  "candle-scented": [
    [_,_,_,_,O,_,_,_,_],
    [_,_,_,Y,Y,Y,_,_,_],
    [_,_,_,_,Y,_,_,_,_],
    [_,_,P,P,P,P,P,_,_],
    [_,_,P,PD,P,PD,P,_,_],
    [_,_,P,P,P,P,P,_,_],
    [_,_,P,PD,P,PD,P,_,_],
    [_,_,P,P,P,P,P,_,_],
    [_,G,G,G,G,G,G,G,_],
  ],

  // 영원의 불꽃
  "candle-eternal": [
    [_,_,_,Y,_,_,_,_,_],
    [_,_,Y,O,Y,_,_,_,_],
    [_,Y,O,R,O,Y,_,_,_],
    [Y,O,R,RD,R,O,Y,_,_],
    [_,Y,O,R,O,Y,_,_,_],
    [_,_,Y,O,Y,_,_,_,_],
    [_,_,_,Y,_,_,_,_,_],
    [_,_,_,G,_,_,_,_,_],
    [_,_,G,G,G,_,_,_,_],
  ],

  // 소원 등불
  "candle-lantern": [
    [_,_,R,R,R,R,R,_,_],
    [_,R,R,Y,Y,Y,R,R,_],
    [R,R,Y,O,Y,O,Y,R,R],
    [R,Y,O,Y,O,Y,O,Y,R],
    [R,R,Y,O,Y,O,Y,R,R],
    [_,R,R,Y,Y,Y,R,R,_],
    [_,_,R,R,R,R,R,_,_],
    [_,_,_,Y,Y,Y,_,_,_],
    [_,_,_,_,G,_,_,_,_],
  ],

  // 검은 리본
  "deco-ribbon": [
    [_,_,B,B,_,B,B,_,_],
    [_,B,B,B,_,B,B,B,_],
    [B,B,B,_,_,_,B,B,B],
    [_,B,B,B,B,B,B,B,_],
    [_,_,_,B,B,B,_,_,_],
    [_,_,B,B,_,B,B,_,_],
    [_,B,B,_,_,_,B,B,_],
    [B,B,_,_,_,_,_,B,B],
  ],

  // 폴라로이드
  "deco-photo": [
    [W,W,W,W,W,W,W,W,W,W],
    [W,G,G,G,G,G,G,G,G,W],
    [W,G,BL,BL,BL,BL,BL,G,G,W],
    [W,G,BL,Y,BL,BL,GR,G,G,W],
    [W,G,BL,BL,BL,GR,GR,G,G,W],
    [W,G,GR,GR,GR,GR,GR,G,G,W],
    [W,G,G,G,G,G,G,G,G,W],
    [W,W,W,W,W,W,W,W,W,W],
    [W,W,W,W,W,W,W,W,W,W],
  ],

  // 오르골
  "deco-music": [
    [_,_,_,Y,_,_,_,_,_,_],
    [_,_,Y,Y,Y,_,_,_,_,_],
    [_,BR,BR,BR,BR,BR,BR,BR,_,_],
    [_,BR,BRD,Y,BRD,Y,BRD,BR,_,_],
    [_,BR,Y,BRD,Y,BRD,Y,BR,_,_],
    [_,BR,BRD,Y,BRD,Y,BRD,BR,_,_],
    [_,BR,BR,BR,BR,BR,BR,BR,_,_],
    [_,_,BR,_,_,_,BR,_,_,_],
  ],

  // 하트 자물쇠
  "deco-heart-lock": [
    [_,_,G,G,G,G,G,_,_],
    [_,G,_,_,_,_,_,G,_],
    [_,G,_,_,_,_,_,G,_],
    [G,G,G,G,G,G,G,G,G],
    [G,R,R,G,R,R,G,G,G],
    [G,R,R,R,R,R,G,G,G],
    [G,G,R,R,R,G,G,G,G],
    [G,G,G,R,G,G,G,G,G],
    [G,G,G,G,G,G,G,G,G],
  ],

  // 우산
  "deco-umbrella": [
    [_,_,_,_,BL,_,_,_,_],
    [_,_,BL,BL,BL,BL,BL,_,_],
    [_,BL,BL,BL,BL,BL,BL,BL,_],
    [BL,BL,BL,BL,BL,BL,BL,BL,BL],
    [_,_,_,_,BR,_,_,_,_],
    [_,_,_,_,BR,_,_,_,_],
    [_,_,_,_,BR,_,_,_,_],
    [_,_,_,_,BR,_,_,_,_],
    [_,_,_,BR,BR,_,_,_,_],
  ],

  // 꽃 왕관
  "deco-crown": [
    [_,Y,_,R,_,PK,_,Y,_],
    [Y,Y,Y,R,R,PK,Y,Y,Y],
    [_,Y,Y,Y,Y,Y,Y,Y,_],
    [_,_,Y,YD,Y,YD,Y,_,_],
    [_,_,Y,Y,Y,Y,Y,_,_],
  ],

  // 대리석 묘비
  "stone-marble": [
    [_,_,_,W,W,W,W,W,_,_,_],
    [_,_,W,W,W,W,W,W,W,_,_],
    [_,W,W,W,W,W,W,W,W,W,_],
    [_,W,W,W,W,W,W,W,W,W,_],
    [_,W,W,G,G,G,G,W,W,W,_],
    [_,W,W,G,W,G,W,W,W,W,_],
    [_,W,W,G,G,G,G,W,W,W,_],
    [_,W,W,W,W,W,W,W,W,W,_],
    [_,W,W,W,W,W,W,W,W,W,_],
    [G,G,G,G,G,G,G,G,G,G,G],
  ],

  // 크리스탈 묘비
  "stone-crystal": [
    [_,_,_,_,BL,_,_,_,_],
    [_,_,_,BL,BL,BL,_,_,_],
    [_,_,BL,BL,W,BL,BL,_,_],
    [_,BL,BL,W,BL,BL,BL,BL,_],
    [_,BL,W,BL,BL,BL,BL,BL,_],
    [_,BL,BL,BL,BL,BL,W,BL,_],
    [_,BL,BL,BL,W,BL,BL,BL,_],
    [_,_,BL,BL,BL,BL,BL,_,_],
    [G,G,G,G,G,G,G,G,G],
  ],

  // 황금 묘비
  "stone-gold": [
    [_,_,_,Y,Y,Y,Y,Y,_,_,_],
    [_,_,Y,Y,YD,Y,YD,Y,Y,_,_],
    [_,Y,Y,YD,Y,Y,Y,YD,Y,Y,_],
    [_,Y,Y,Y,Y,Y,Y,Y,Y,Y,_],
    [_,Y,Y,YD,YD,YD,YD,Y,Y,Y,_],
    [_,Y,Y,YD,Y,YD,Y,Y,Y,Y,_],
    [_,Y,Y,YD,YD,YD,YD,Y,Y,Y,_],
    [_,Y,Y,Y,Y,Y,Y,Y,Y,Y,_],
    [_,Y,Y,YD,Y,Y,Y,YD,Y,Y,_],
    [Y,Y,Y,Y,Y,Y,Y,Y,Y,Y,Y],
  ],

  // 수호 유령
  "special-ghost": [
    [_,_,_,W,W,W,W,_,_,_],
    [_,_,W,W,W,W,W,W,_,_],
    [_,W,W,W,W,W,W,W,W,_],
    [_,W,B,B,W,W,B,B,W,_],
    [_,W,B,B,W,W,B,B,W,_],
    [_,W,W,W,W,W,W,W,W,_],
    [_,W,W,W,B,W,W,W,W,_],
    [W,W,W,W,W,W,W,W,W,W],
    [W,W,_,W,W,W,W,_,W,W],
    [W,_,_,_,W,W,_,_,_,W],
  ],

  // 묘지 고양이
  "special-cat": [
    [_,B,B,_,_,_,_,B,B,_],
    [_,B,B,B,_,_,B,B,B,_],
    [_,B,B,B,B,B,B,B,B,_],
    [_,B,GR,B,B,B,GR,B,B,_],
    [_,B,GR,B,B,B,GR,B,B,_],
    [_,B,B,B,PK,B,B,B,B,_],
    [_,B,B,B,B,B,B,B,B,_],
    [_,_,B,B,B,B,B,B,_,_],
    [_,_,_,B,_,_,B,_,_,_],
    [B,B,_,B,_,_,B,_,B,B],
  ],

  // 추억 요정
  "special-fairy": [
    [_,_,_,Y,Y,Y,_,_,_],
    [_,_,Y,Y,Y,Y,Y,_,_],
    [_,_,_,PK,PK,PK,_,_,_],
    [_,_,PK,B,PK,B,PK,_,_],
    [_,_,PK,PK,PK,PK,PK,_,_],
    [_,BL,PK,PK,PK,PK,PK,BL,_],
    [BL,BL,_,PK,PK,PK,_,BL,BL],
    [_,BL,_,_,PK,_,_,BL,_],
    [_,_,_,PK,_,PK,_,_,_],
  ],

  // 저주인형
  "special-voodoo": [
    [_,_,_,BR,BR,BR,_,_,_],
    [_,_,BR,BR,BR,BR,BR,_,_],
    [_,_,BR,R,BR,R,BR,_,_],
    [_,_,BR,BR,BR,BR,BR,_,_],
    [_,_,BR,BR,RD,BR,BR,_,_],
    [_,G,BR,BR,BR,BR,BR,G,_],
    [G,_,_,BR,BR,BR,_,_,G],
    [_,_,_,BR,_,BR,_,_,_],
    [_,_,BR,BR,_,BR,BR,_,_],
  ],

  // 핏자국
  "special-blood": [
    [_,_,_,_,R,_,_,_,_],
    [_,_,_,R,R,_,_,_,_],
    [_,_,R,R,RD,R,_,_,_],
    [_,_,R,RD,RD,R,_,_,_],
    [_,R,RD,RD,RD,RD,R,_,_],
    [_,R,RD,RD,RD,R,_,_,_],
    [_,_,R,RD,R,_,_,_,_],
    [_,_,_,R,R,_,_,R,_],
    [_,_,_,_,R,_,R,R,_],
    [_,_,_,_,_,_,_,R,_],
  ],

  // 부적
  "special-talisman": [
    [_,Y,Y,Y,Y,Y,Y,Y,_],
    [_,Y,R,R,R,R,R,Y,_],
    [_,Y,R,B,R,B,R,Y,_],
    [_,Y,R,R,B,R,R,Y,_],
    [_,Y,R,B,B,B,R,Y,_],
    [_,Y,R,R,B,R,R,Y,_],
    [_,Y,R,R,R,R,R,Y,_],
    [_,Y,Y,Y,Y,Y,Y,Y,_],
    [_,_,_,R,R,R,_,_,_],
    [_,_,_,_,R,_,_,_,_],
  ],

  // 무지개 다리
  "special-rainbow": [
    [_,R,R,R,R,R,R,R,R,R,R,_],
    [R,O,O,O,O,O,O,O,O,O,O,R],
    [_,O,Y,Y,Y,Y,Y,Y,Y,Y,O,_],
    [_,_,Y,GR,GR,GR,GR,GR,Y,_,_,_],
    [_,_,_,GR,BL,BL,BL,GR,_,_,_,_],
    [_,_,_,_,BL,P,BL,_,_,_,_,_],
    [_,_,_,_,_,P,_,_,_,_,_,_],
    [G,G,_,_,_,_,_,_,_,G,G,_],
    [G,G,G,_,_,_,_,_,G,G,G,_],
  ],
}
