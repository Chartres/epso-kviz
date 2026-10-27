import { useMemo } from 'react'
import type { ProgressData } from '@/domain/progress'
import { CATEGORY_NAMES, META } from '@/domain/questions'
import { readiness, MIN_FIRST_ATTEMPTS } from '@/domain/readiness'

/** Places and essay-marking multiple from the Notice of Competition, §1 and §4.3.3(c). */
const PLACES = 240
const ESSAYS_MARKED = Math.round(PLACES * 1.5)

/**
 * The honest replacement for "pass at 15/30": a likely-score range on a fresh paper,
 * from first tries only, next to the competition's real ranking rule.
 */
export function ReadinessCard({ progress }: { progress: ProgressData }) {
  const r = useMemo(() => readiness(progress), [progress])
  const pass = META.exam.passThreshold

  return (
    <section className="rounded-card border border-steel-700 bg-steel-800/40 p-5">
      <h2 className="font-display text-lg font-semibold uppercase tracking-wide text-steel-50">
        Your likely score on a fresh paper
      </h2>

      {r.enough ? (
        <>
          <p className="mt-3 flex items-baseline gap-3">
            <span
              data-testid="readiness-range"
              className="font-mono text-4xl font-semibold tabular-nums text-brass-300"
            >
              {r.low}–{r.high}
            </span>
            <span className="text-sm text-steel-400">
              of {r.total} · most likely about {Math.round(r.expected)}
            </span>
          </p>
          <p className="mt-2 text-sm text-steel-300">
            Chance of reaching {pass}/{r.total}:{' '}
            <span className="font-mono tabular-nums text-steel-100">
              {Math.round(r.atLeast(pass) * 100)}%
            </span>
            . The range covers 8 in 10 likely outcomes.
          </p>
        </>
      ) : (
        <p className="mt-3 text-sm text-steel-300">
          Not enough evidence yet. Answer new questions until each category has{' '}
          {MIN_FIRST_ATTEMPTS} first tries.
        </p>
      )}

      <ul className="mt-4 space-y-1 text-sm">
        {CATEGORY_NAMES.map((cat) => {
          const e = r.byCategory[cat]
          return (
            <li key={cat} className="flex justify-between gap-3">
              <span className="text-steel-300">{cat}</span>
              <span className="shrink-0 whitespace-nowrap font-mono text-xs tabular-nums text-steel-400">
                {r.missing[cat] > 0
                  ? `${r.missing[cat]} more new`
                  : `${e.correct} of ${e.n} first tries`}
              </span>
            </li>
          )
        })}
      </ul>

      <p className="mt-4 text-sm leading-relaxed text-steel-400">
        Only first tries count: a question you have met before shows what you remember, not
        what you would score on the day. {pass}/{r.total} only keeps you in the ranking. In
        AD/430/26 the essays of about {ESSAYS_MARKED} top scorers are marked for {PLACES}{' '}
        places, and EPSO does not publish the cut-off score.
      </p>
    </section>
  )
}
