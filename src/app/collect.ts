import type { Dispatch } from 'react'
import type { Action } from './store'
import type { ProgressData } from '@/domain/progress'
import type { Question } from '@/domain/types'
import { isCollected } from '@/domain/commonplace'
import { track } from '@/analytics'

/** Commonplace-book props for one question: which passages are collected, and a toggle. */
export function collectProps(question: Question, progress: ProgressData, dispatch: Dispatch<Action>) {
  return {
    collected: (question.sources ?? [])
      .map((_, i) => i)
      .filter((i) => isCollected(progress, question.id, i)),
    onCollect: (index: number) => {
      if (!isCollected(progress, question.id, index))
        track('key_action', { action: 'commonplace_add', q: question.id })
      dispatch({ type: 'toggleCommonplace', id: question.id, index, now: Date.now() })
    },
  }
}
