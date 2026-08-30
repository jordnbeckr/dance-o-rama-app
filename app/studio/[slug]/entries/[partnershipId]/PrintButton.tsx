'use client'

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="no-print px-3 py-1.5 text-sm font-medium text-white"
      style={{ backgroundColor: 'var(--accent)', borderRadius: 4 }}
    >
      Print / Save as PDF
    </button>
  )
}
