import { useState } from 'react'
import { feedback } from '@/analytics'

/**
 * Flywheel feedback widget. User-initiated → always sends (no consent gate).
 * Collapsed by default so it never crowds the results screen it sits on.
 * Mirrors datlino's FeedbackCard (Sean Ellis PMF question + free text).
 */
const ELLIS = {
  very: 'Very disappointed',
  somewhat: 'Somewhat disappointed',
  not: 'Not disappointed',
} as const
type Ellis = keyof typeof ELLIS

export function FeedbackCard({ context = 'results' }: { context?: string }) {
  const [open, setOpen] = useState(false)
  const [ellis, setEllis] = useState<Ellis | null>(null)
  const [text, setText] = useState('')
  const [sent, setSent] = useState(false)

  const canSend = !!text.trim() || !!ellis

  function submit() {
    if (!canSend) return
    feedback({
      sean_ellis: ellis ?? undefined,
      text: text.trim() ? `[${context}] ${text.trim()}` : undefined,
    })
    setSent(true)
  }

  return (
    <section className="mx-auto mt-8 max-w-2xl rounded-card border border-steel-700 bg-steel-800/40 px-5 py-4">
      {sent ? (
        <p className="text-sm text-steel-300">Thanks! We got your feedback.</p>
      ) : !open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-sm font-semibold text-verdigris-400 hover:underline"
        >
          Have an idea or found a bug? Write to the author
        </button>
      ) : (
        <div>
          <h3 className="font-display font-semibold text-brass-300">Your feedback</h3>
          <p className="mt-1 text-sm text-steel-400">
            What would help? What's not working? You're writing directly to the author.
          </p>
          <p className="mt-3 text-sm text-steel-400">If this app disappeared tomorrow…</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {(Object.keys(ELLIS) as Ellis[]).map((key) => (
              <button
                key={key}
                type="button"
                aria-pressed={ellis === key}
                onClick={() => setEllis(ellis === key ? null : key)}
                className={`rounded-full border px-3 py-1 text-sm ${
                  ellis === key
                    ? 'border-brass-500 bg-brass-500/20 text-brass-300'
                    : 'border-steel-600 text-steel-300 hover:border-steel-400'
                }`}
              >
                {ELLIS[key]}
              </button>
            ))}
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            placeholder="Write anything (optional)…"
            aria-label="Feedback"
            className="mt-3 w-full rounded-card border border-steel-600 bg-steel-900/50 p-2 text-sm text-steel-100 placeholder:text-steel-500"
          />
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-card border border-steel-600 px-4 py-1.5 text-sm font-semibold text-steel-200 hover:border-steel-400"
            >
              Close
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={!canSend}
              className="rounded-card bg-brass-500 px-4 py-1.5 text-sm font-semibold text-steel-950 hover:bg-brass-400 disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
