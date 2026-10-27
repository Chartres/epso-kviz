import type { Dispatch } from 'react'
import type { Action } from './store'
import type { ProgressData } from '@/domain/progress'
import type { Question } from '@/domain/types'
import { isCollected } from '@/domain/commonplace'
import { track } from '@/analytics'

/** Commonplace-book props for one question: which passages are collected, and a toggle. */
export function collectProps(question: Question, progress: ProgressData, dispatch: Dispatch<Action>) {
  const sources = question.sources ?? []
  return {
    collected: sources.map((_, i) => i).filter((i) => isCollected(progress, sources[i])),
    onCollect: (index: number) => {
      const citation = sources[index]
      const on = !isCollected(progress, citation)
      if (on) track('key_action', { action: 'commonplace_add', q: question.id })
      dispatch({ type: 'setCommonplace', citation, id: question.id, on, now: Date.now() })
    },
  }
}
