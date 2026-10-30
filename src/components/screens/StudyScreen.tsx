import { useMemo, useState } from 'react'
import { META } from '@/domain/questions'
import { LESSONS } from '@/content/studyGuide'
import { imageUrl } from '@/lib/assets'
import { useApp } from '@/app/AppContext'
import { Commonplace } from '@/components/Commonplace'
import { commonplaceEntries } from '@/domain/commonplace'

export function StudyScreen() {
  const { state, dispatch } = useApp()
  // The guide comes first; the commonplace book follows the lessons, folded (Pavol, 2026-10-30).
  const [bookOpen, setBookOpen] = useState(false)
  const passages = useMemo(
    () => commonplaceEntries(state.progress).reduce((n, g) => n + g.entries.length, 0),
    [state.progress],
  )
  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-2">
      <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-steel-50">
        Study guide
      </h1>
      <p className="mt-1 text-sm text-steel-400">
        Lessons progressively cover the material behind all {META.totalQuestions} questions.
        Source:{' '}
        <a
          href={META.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="text-brass-400 underline"
        >
          the Notice of Competition (OJ C/2026/4668)
        </a>
        .
      </p>

      {/* Table of contents */}
      <nav aria-label="Contents" className="mt-5 rounded-card border border-steel-700 bg-steel-800/40 p-4">
        <h2 className="mb-2 font-mono text-xs font-medium uppercase tracking-[0.2em] text-steel-400">
          Contents
        </h2>
        <ol className="space-y-1">
          {LESSONS.map((l) => (
            <li key={l.id}>
              <a href={`#${l.id}`} className="text-sm text-steel-300 hover:text-brass-400">
                {l.title}
              </a>
            </li>
          ))}
        </ol>
        <a
          href="#commonplace"
          onClick={() => setBookOpen(true)}
          className="mt-3 block border-t border-steel-700 pt-2 text-sm text-steel-300 hover:text-brass-400"
        >
          My commonplace book{passages > 0 && ` · ${passages} ${passages === 1 ? 'passage' : 'passages'}`}
        </a>
      </nav>

      {LESSONS.map((l) => (
        <section key={l.id} id={l.id} className="mt-8 scroll-mt-4">
          <h2 className="mb-3 font-display text-xl font-bold uppercase tracking-tight text-brass-300">
            {l.title}
          </h2>
          <article className="study-prose" dangerouslySetInnerHTML={{ __html: l.html }} />
          {l.figures && (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {l.figures.map((f) => (
                <figure
                  key={f.img}
                  className="overflow-hidden rounded-card border border-steel-700 bg-steel-800/40"
                >
                  <img
                    src={imageUrl(f.img)}
                    alt={f.caption}
                    loading="lazy"
                    className="h-28 w-full bg-steel-50 object-contain p-2"
                  />
                  <figcaption className="px-2 py-1.5 text-xs leading-snug text-steel-300">
                    {f.caption}
                  </figcaption>
                </figure>
              ))}
            </div>
          )}
          <p className="mt-3 border-t border-steel-800 pt-2 text-xs text-steel-500">
            Source and more information:{' '}
            <a
              href={l.source.url}
              target="_blank"
              rel="noreferrer"
              className="text-brass-400 underline"
            >
              {l.source.label}
            </a>
          </p>
        </section>
      ))}

      <Commonplace
        progress={state.progress}
        open={bookOpen}
        onToggle={() => setBookOpen((o) => !o)}
        onRemove={(citation) =>
          dispatch({ type: 'setCommonplace', citation, id: 0, on: false, now: Date.now() })
        }
      />
    </div>
  )
}
