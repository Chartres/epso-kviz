import type { Question } from '@/domain/types'
import { citationLabel, citationUrl } from '@/domain/citations'

/**
 * The primary-source passages behind the correct answer, shown after the rationale. Only for
 * verified questions: an unverified question may carry partial quotes that don't settle the key.
 */
export function SourceNote({ question }: { question: Question }) {
  if (!question.verified || !question.sources?.length) return null
  return (
    <div className="mt-3 border-t border-steel-700 pt-3">
      {question.sources.map((c, i) => (
        <figure key={i} className="mb-2 last:mb-0">
          <blockquote className="border-l-2 border-steel-600 pl-3 text-sm italic leading-relaxed text-steel-400">
            {c.quote}
          </blockquote>
          <figcaption className="mt-1 pl-3 font-mono text-xs">
            <a
              href={citationUrl(c)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brass-400 underline-offset-2 hover:underline"
            >
              {citationLabel(c)} ↗
            </a>
          </figcaption>
        </figure>
      ))}
      <p className="mt-2 font-mono text-xs text-steel-500">
        Checked against the official text on {question.verified}
      </p>
    </div>
  )
}
