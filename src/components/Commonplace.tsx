import { useEffect, useMemo, useState } from 'react'
import type { ProgressData } from '@/domain/progress'
import type { Citation } from '@/domain/types'
import { commonplaceEntries, commonplaceText } from '@/domain/commonplace'
import { citationUrl } from '@/domain/citations'
import { track } from '@/analytics'

/**
 * The learner's commonplace book: verbatim passages they collected while practising,
 * filed by act and article, each with the case it came from.
 *
 * It sits below the study guide and is folded by default, so a full book never pushes the
 * guide down (Pavol, 2026-10-30). The Contents list links to it.
 */
export function Commonplace({
  progress,
  onRemove,
  open,
  onToggle,
}: {
  progress: ProgressData
  onRemove: (citation: Citation) => void
  open: boolean
  onToggle: () => void
}) {
  const groups = useMemo(() => commonplaceEntries(progress), [progress])
  const count = groups.reduce((n, g) => n + g.entries.length, 0)
  const [copy, setCopy] = useState<'idle' | 'done' | 'failed'>('idle')
  useEffect(() => setCopy('idle'), [groups])

  async function copyAll() {
    try {
      await navigator.clipboard.writeText(commonplaceText(groups))
      setCopy('done')
    } catch {
      setCopy('failed')
    }
  }

  return (
    <section
      id="commonplace"
      aria-labelledby="commonplace-title"
      className="mt-10 scroll-mt-4 rounded-card border border-steel-700 bg-steel-800/40 p-4"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <h2 id="commonplace-title" className="font-display text-lg font-semibold uppercase tracking-wide text-steel-50">
          {count === 0 ? (
            'My commonplace book'
          ) : (
            <button
              type="button"
              onClick={onToggle}
              aria-expanded={open}
              aria-controls="commonplace-passages"
              className="flex min-h-11 flex-wrap items-baseline gap-x-2 text-left uppercase hover:text-brass-300"
            >
              <span aria-hidden="true" className="font-mono text-xs text-brass-400">
                {open ? '▾' : '▸'}
              </span>
              My commonplace book
              <span className="whitespace-nowrap font-mono text-xs font-normal normal-case tracking-normal text-steel-400">
                {count} {count === 1 ? 'passage' : 'passages'}
              </span>
            </button>
          )}
        </h2>
        {count > 0 && open && (
          <button type="button" onClick={copyAll} className="min-h-11 font-mono text-xs text-brass-400 hover:underline">
            {copy === 'done' ? 'Copied' : copy === 'failed' ? 'Copy failed — select and copy by hand' : 'Copy all as text'}
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
        // Always in the page so aria-controls has a target; the passages render only when open.
        <div id="commonplace-passages" hidden={!open} className="mt-3 space-y-6">
          {open && groups.map((g) => (
            <section key={g.doc} aria-label={g.title}>
              <h3 className="font-mono text-xs uppercase tracking-[0.15em] text-steel-400">{g.title}</h3>
              <ul className="mt-2 space-y-4">
                {g.entries.map((e) => (
                  <li key={`${e.ref}-${e.at}`}>
                    <blockquote className="border-l-2 border-steel-600 pl-3 text-sm italic leading-relaxed text-steel-300">
                      {e.quote}
                    </blockquote>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 pl-3 font-mono text-xs">
                      <a
                        href={citationUrl(e)}
                        onClick={() => track('key_action', { action: 'source_open', doc: e.doc, ref: e.ref, from: 'commonplace' })}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brass-400 hover:underline"
                      >
                        {e.ref} ↗
                      </a>
                      <button
                        type="button"
                        onClick={() => onRemove(e)}
                        className="min-h-11 text-steel-500 hover:text-rust-400"
                      >
                        Remove
                      </button>
                    </div>
                    {e.question && (
                      <p className="mt-1 pl-3 text-xs text-steel-500">
                        Case: <span className="text-steel-400">{e.question}</span>
                      </p>
                    )}
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
