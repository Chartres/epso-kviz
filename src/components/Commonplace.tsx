import { useMemo, useState } from 'react'
import type { ProgressData } from '@/domain/progress'
import { commonplaceEntries, commonplaceText } from '@/domain/commonplace'
import { citationUrl } from '@/domain/citations'

/**
 * The learner's commonplace book: verbatim passages they collected while practising,
 * filed by act and article, each with the case it came from.
 */
export function Commonplace({
  progress,
  onRemove,
}: {
  progress: ProgressData
  onRemove: (questionId: number, index: number) => void
}) {
  const groups = useMemo(() => commonplaceEntries(progress), [progress])
  const count = groups.reduce((n, g) => n + g.entries.length, 0)
  const [copied, setCopied] = useState(false)

  async function copyAll() {
    try {
      await navigator.clipboard.writeText(commonplaceText(progress))
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <section aria-labelledby="commonplace-title" className="mt-6 rounded-card border border-steel-700 bg-steel-800/40 p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="commonplace-title" className="font-display text-lg font-semibold uppercase tracking-wide text-steel-50">
          My commonplace book
        </h2>
        {count > 0 && (
          <button type="button" onClick={copyAll} className="min-h-11 font-mono text-xs text-brass-400 hover:underline">
            {copied ? 'Copied' : 'Copy all as text'}
          </button>
        )}
      </div>

      {count === 0 ? (
        <p className="mt-2 text-sm leading-relaxed text-steel-400">
          The humanists kept a commonplace book: passages copied from the sources, filed under
          headings, reread before an argument. Build yours from the law itself. After a verified
          question, tap “Copy to my commonplace book” under the passage that settled it.
        </p>
      ) : (
        <div className="mt-3 space-y-6">
          {groups.map((g) => (
            <section key={g.doc} aria-label={g.title}>
              <h3 className="font-mono text-xs uppercase tracking-[0.15em] text-steel-400">{g.title}</h3>
              <ul className="mt-2 space-y-4">
                {g.entries.map((e) => (
                  <li key={`${e.questionId}-${e.index}`}>
                    <blockquote className="border-l-2 border-steel-600 pl-3 text-sm italic leading-relaxed text-steel-300">
                      {e.quote}
                    </blockquote>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 pl-3 font-mono text-xs">
                      <a href={citationUrl(e)} target="_blank" rel="noopener noreferrer" className="text-brass-400 hover:underline">
                        {e.ref} ↗
                      </a>
                      <button
                        type="button"
                        onClick={() => onRemove(e.questionId, e.index)}
                        className="min-h-11 text-steel-500 hover:text-rust-400"
                      >
                        Remove
                      </button>
                    </div>
                    <p className="mt-1 pl-3 text-xs text-steel-500">
                      Case: <span className="text-steel-400">{e.question}</span>
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </section>
  )
}
