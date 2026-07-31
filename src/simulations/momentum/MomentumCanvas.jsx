import { useEffect, useRef } from 'react'

const BLOCK_WIDTH = 60
const BLOCK_HEIGHT = 60
const BLOCK_A_X = 150
const BLOCK_B_X = 500

function draw(ctx, width, height) {
  const styles = getComputedStyle(document.documentElement)
  const bgColor = styles.getPropertyValue('--instrument-bg').trim()
  const gridColor = styles.getPropertyValue('--instrument-grid').trim()
  const blockAColor = styles.getPropertyValue('--instrument-block-a').trim()
  const blockBColor = styles.getPropertyValue('--instrument-block-b').trim()

  ctx.clearRect(0, 0, width, height)

  ctx.fillStyle = bgColor
  ctx.fillRect(0, 0, width, height)

  const trackY = height / 2
  ctx.strokeStyle = gridColor
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(0, trackY)
  ctx.lineTo(width, trackY)
  ctx.stroke()

  ctx.fillStyle = blockAColor
  ctx.fillRect(BLOCK_A_X, trackY - BLOCK_HEIGHT, BLOCK_WIDTH, BLOCK_HEIGHT)

  ctx.fillStyle = blockBColor
  ctx.fillRect(BLOCK_B_X, trackY - BLOCK_HEIGHT, BLOCK_WIDTH, BLOCK_HEIGHT)
}

function MomentumCanvas() {
  const containerRef = useRef(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    const resize = () => {
      const { width, height } = container.getBoundingClientRect()
      canvas.width = width
      canvas.height = height
      draw(ctx, width, height)
    }

    resize()

    const observer = new ResizeObserver(resize)
    observer.observe(container)

    return () => observer.disconnect()
  }, [])

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
    </div>
  )
}

export default MomentumCanvas
