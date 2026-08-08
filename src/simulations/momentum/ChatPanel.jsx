import { useEffect, useRef, useState } from 'react'

// Phase 3.4 — the tutor UI. The backend endpoint it talks to is still the Phase
// 3.1 placeholder: it returns a fixed JSON string rather than a streamed reply.
// The request payload and the response reader here are both written to the final
// contract, so wiring the Anthropic call in Phase 3.3 needs no change in this file.

const DISCLAIMER = 'AI responses are grounded in reviewed content. Always verify against your syllabus.'

// Key names match IMPLEMENTATION_PLAN 3.1 and the ChatRequest docstring in
// backend/main.py — subscript notation, not the frontend's massA/velocityA.
// v1/v2 are the velocities the student dialled in; post_v1/post_v2 are what the
// blocks are actually moving at, and are only meaningful once they have collided.
function buildSimState(simState, frame) {
  return {
    m1: simState.massA,
    v1: simState.velocityA,
    m2: simState.massB,
    v2: simState.velocityB,
    mode: simState.mode,
    collided: frame?.collided ?? false,
    post_v1: frame?.collided ? frame.v1 : null,
    post_v2: frame?.collided ? frame.v2 : null,
  }
}

function Message({ role, content, isError }) {
  const isStudent = role === 'student'
  let color = 'var(--instrument-text)'
  if (isError) color = 'var(--instrument-warning)'
  else if (isStudent) color = 'var(--instrument-block-a)'

  return (
    <div style={{ marginBottom: '14px' }}>
      <div
        style={{
          fontFamily: 'var(--instrument-body-font)',
          fontSize: '10px',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--instrument-text)',
          opacity: 0.5,
          marginBottom: '4px',
        }}
      >
        {isStudent ? 'You' : 'Tutor'}
      </div>
      <div
        style={{
          fontFamily: 'var(--instrument-body-font)',
          fontSize: '13px',
          lineHeight: 1.55,
          color,
          whiteSpace: 'pre-wrap', // replies render as plain text — KaTeX deferred, see plan
        }}
      >
        {content}
      </div>
    </div>
  )
}

function ChatPanel({ simState, frameRef }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [status, setStatus] = useState('idle') // idle | waiting | streaming
  const logRef = useRef(null)

  // pin the log to the newest content as it arrives
  useEffect(() => {
    const log = logRef.current
    if (log) log.scrollTop = log.scrollHeight
  }, [messages, status])

  // Appends to the reply currently being written, which is always the last entry.
  const appendToReply = (text) => {
    setMessages((prev) => {
      const next = prev.slice()
      const last = next[next.length - 1]
      next[next.length - 1] = { ...last, content: last.content + text }
      return next
    })
  }

  const send = async () => {
    const message = input.trim()
    if (!message || status !== 'idle') return

    setInput('')
    setMessages((prev) => [
      ...prev,
      { role: 'student', content: message },
      { role: 'tutor', content: '' }, // placeholder the reply is written into
    ])
    setStatus('waiting')

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          sim_state: buildSimState(simState, frameRef.current),
          simulation: 'momentum',
        }),
      })

      if (!res.ok) {
        setMessages((prev) => {
          const next = prev.slice()
          next[next.length - 1] = {
            role: 'tutor',
            content: `Tutor unavailable (${res.status}). Check that the backend is running.`,
            isError: true,
          }
          return next
        })
        return
      }

      const contentType = res.headers.get('content-type') ?? ''

      if (contentType.includes('application/json')) {
        // Phase 3.1 placeholder path: one JSON body, no streaming.
        const body = await res.json()
        appendToReply(body.response ?? '')
      } else {
        // Phase 3.3 path: StreamingResponse, appended as it arrives.
        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        setStatus('streaming')
        for (;;) {
          const { value, done } = await reader.read()
          if (done) break
          appendToReply(decoder.decode(value, { stream: true }))
        }
      }
    } catch {
      setMessages((prev) => {
        const next = prev.slice()
        next[next.length - 1] = {
          role: 'tutor',
          content: 'Could not reach the tutor. Check that the backend is running on port 8000.',
          isError: true,
        }
        return next
      })
    } finally {
      setStatus('idle')
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const canSend = status === 'idle' && input.trim().length > 0

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <div ref={logRef} style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '16px' }}>
        {messages.length === 0 && (
          <div
            style={{
              fontFamily: 'var(--instrument-body-font)',
              fontSize: '13px',
              lineHeight: 1.55,
              color: 'var(--instrument-text)',
              opacity: 0.5,
            }}
          >
            Ask about the collision you are running — the tutor can see your current setup.
          </div>
        )}

        {messages.map((m, i) => (
          <Message key={i} role={m.role} content={m.content} isError={m.isError} />
        ))}

        {status === 'waiting' && (
          <div
            style={{
              fontFamily: 'var(--instrument-data-font)',
              fontSize: '13px',
              color: 'var(--instrument-phosphor-green)',
            }}
          >
            ···
          </div>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: '8px',
          padding: '12px 16px',
          borderTop: '1px solid var(--instrument-grid)',
        }}
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
          placeholder="Ask a question…"
          style={{
            flex: 1,
            minWidth: 0,
            resize: 'none',
            fontFamily: 'var(--instrument-body-font)',
            fontSize: '13px',
            lineHeight: 1.5,
            padding: '8px',
            color: 'var(--instrument-text)',
            background: 'var(--instrument-bg)',
            border: '1px solid var(--instrument-grid)',
            borderRadius: 'var(--radius-max)',
            outline: 'none',
          }}
        />
        <button
          type="button"
          onClick={send}
          disabled={!canSend}
          style={{
            fontFamily: 'var(--instrument-body-font)',
            fontSize: '13px',
            padding: '8px 16px',
            border: 'none',
            borderRadius: 'var(--radius-max)',
            background: 'var(--instrument-phosphor-green)',
            color: 'var(--instrument-bg)',
            cursor: canSend ? 'pointer' : 'default',
            opacity: canSend ? 1 : 0.4,
          }}
        >
          Send
        </button>
      </div>

      <div
        style={{
          padding: '0 16px 12px',
          fontFamily: 'var(--instrument-body-font)',
          fontSize: '11px',
          lineHeight: 1.4,
          color: 'var(--instrument-text)',
          opacity: 0.5,
        }}
      >
        {DISCLAIMER}
      </div>
    </div>
  )
}

export default ChatPanel
