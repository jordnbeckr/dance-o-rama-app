'use client'

import { useRef, useState, useTransition, useEffect } from 'react'
import { saveSignature, clearSignature } from '@/app/actions/signature'

const CANVAS_WIDTH = 600
const CANVAS_HEIGHT = 160

export default function SignaturePad({
  slug,
  partnershipId,
  studentName,
  signatureData,
  signedAt,
}: {
  slug: string
  partnershipId: number
  studentName: string
  signatureData: string | null
  signedAt: string | null
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const drawingRef = useRef(false)
  const [, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [hasDrawn, setHasDrawn] = useState(false)
  const [resigning, setResigning] = useState(false)

  useEffect(() => {
    if (signatureData && !resigning) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#0f1923'
  }, [signatureData, resigning])

  function getPos(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    }
  }

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    drawingRef.current = true
    const { x, y } = getPos(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const { x, y } = getPos(e)
    ctx.lineTo(x, y)
    ctx.stroke()
    if (!hasDrawn) setHasDrawn(true)
  }

  function handlePointerUp() {
    drawingRef.current = false
  }

  function handleClear() {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasDrawn(false)
  }

  function handleSave() {
    const canvas = canvasRef.current
    if (!canvas) return
    const dataUrl = canvas.toDataURL('image/png')
    setError(null)
    startTransition(async () => {
      const result = await saveSignature(slug, partnershipId, dataUrl)
      if (result?.error) setError(result.error)
      else setResigning(false)
    })
  }

  function handleRequestResign() {
    setError(null)
    startTransition(async () => {
      const result = await clearSignature(slug, partnershipId)
      if (result?.error) setError(result.error)
      else {
        setResigning(true)
        setHasDrawn(false)
      }
    })
  }

  const showSaved = signatureData && !resigning

  return (
    <div className="card p-4 space-y-3">
      <h2 className="font-bold text-base">Signature</h2>
      <p className="text-xs" style={{ color: 'var(--muted)' }}>
        {studentName} signs below to confirm everything checked on this sheet is accurate.
      </p>

      {error && (
        <div className="banner-error flex justify-between">
          {error}
          <button onClick={() => setError(null)} className="font-bold">×</button>
        </div>
      )}

      {showSaved ? (
        <div className="space-y-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={signatureData}
            alt={`${studentName}'s signature`}
            style={{ maxWidth: CANVAS_WIDTH, width: '100%', border: '1px solid var(--border)', borderRadius: 4, backgroundColor: '#fff' }}
          />
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            Signed {signedAt ? new Date(signedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : ''}
          </p>
          <button onClick={handleRequestResign} className="text-xs" style={{ color: 'var(--accent)' }}>
            Clear &amp; re-sign
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            style={{ width: '100%', maxWidth: CANVAS_WIDTH, height: CANVAS_HEIGHT, touchAction: 'none', border: '1px solid var(--border-dark)', borderRadius: 4, backgroundColor: '#fff', cursor: 'crosshair' }}
          />
          <div className="flex gap-2">
            <button onClick={handleClear} className="px-3 py-1.5 text-sm" style={{ color: 'var(--muted)' }}>
              Clear
            </button>
            <button
              onClick={handleSave}
              disabled={!hasDrawn}
              className="px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50"
              style={{ backgroundColor: 'var(--accent)', borderRadius: 4 }}
            >
              Save signature
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
