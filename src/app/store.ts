import type { CategoryName, Choice, Citation, Question } from '@/domain/types'
import type { Rng } from '@/domain/rng'
import {
  createSession,
  answerCurrent,
  advance,
  currentQuestion,
  isFinished,
  type SessionState,
} from '@/domain/session'
import {
  buildPractice,
  reviewQuestions,
  bookmarkedQuestions,
} from '@/domain/selection'
import { getQuestion } from '@/domain/questions'
import { buildExam, evaluateExam, EXAM, type ExamResult } from '@/domain/exam'
import {
  emptyProgress,
  recordAnswer,
  recordLessonComplete,
  toggleBookmark,
  type ProgressData,
} from '@/domain/progress'
import { buildLesson } from '@/domain/lesson'
import { setCollected } from '@/domain/commonplace'
import { shuffle } from '@/domain/rng'

// Bottom-tab destinations (persistent nav) + focused full-screen flows.
export type TabView = 'home' | 'practice' | 'stats' | 'guide'
export type View = TabView | 'quiz' | 'exam' | 'results' | 'numerical'
export type Mode = 'practice' | 'review' | 'bookmarks' | 'exam' | 'lesson'

export const TAB_VIEWS: TabView[] = ['home', 'practice', 'stats', 'guide']
export function isTabView(v: View): v is TabView {
  return (TAB_VIEWS as string[]).includes(v)
}

export interface AppState {
  view: View
  mode: Mode | null
  session: SessionState | null
  examResult: ExamResult | null
  examEndsAt: number | null
  progress: ProgressData
  selectedCategories: Set<CategoryName>
  search: string
}

export function initialState(): AppState {
  return {
    view: 'home',
    mode: null,
    session: null,
    examResult: null,
    examEndsAt: null,
    progress: emptyProgress(),
    selectedCategories: new Set(),
    search: '',
  }
}

export type Action =
  | { type: 'hydrate'; progress: ProgressData }
  | { type: 'setCategories'; categories: Set<CategoryName> }
  | { type: 'setSearch'; search: string }
  | { type: 'startLesson'; rng: Rng }
  | { type: 'startPractice'; rng: Rng }
  | { type: 'startReview'; rng: Rng; ids?: number[] }
  | { type: 'startBookmarks'; rng: Rng }
  | { type: 'startExam'; rng: Rng; now: number }
  | { type: 'answer'; choice: Choice; now: number }
  | { type: 'next'; today?: string }
  | { type: 'finishExam' }
  | { type: 'toggleBookmark'; id: number }
  | { type: 'setCommonplace'; citation: Citation; id: number; on: boolean; now: number }
  | { type: 'goMenu' }
  | { type: 'navigate'; view: TabView }
  | { type: 'openNumerical' }

function begin(state: AppState, mode: Mode, questions: SessionState): AppState {
  return {
    ...state,
    mode,
    session: questions,
    examResult: null,
    view: mode === 'exam' ? 'exam' : 'quiz',
  }
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'hydrate':
      return { ...state, progress: action.progress }

    case 'setCategories':
      return { ...state, selectedCategories: action.categories }

    case 'setSearch':
      return { ...state, search: action.search }

    case 'startLesson':
      return begin(
        state,
        'lesson',
        createSession(buildLesson(state.progress, action.rng)),
      )

    case 'startPractice': {
      const qs = buildPractice(
        { categories: state.selectedCategories, search: state.search },
        action.rng,
      )
      return begin(state, 'practice', createSession(qs))
    }

    case 'startReview': {
      // When explicit ids are provided (e.g. session's wrong answers) use those;
      // otherwise fall back to the global weak-spots queue.
      const qs = action.ids
        ? action.ids.map(getQuestion).filter((q): q is Question => q !== undefined)
        : reviewQuestions(state.progress)
      return begin(state, 'review', createSession(qs))
    }

    case 'startBookmarks':
      return begin(
        state,
        'bookmarks',
        createSession(shuffle(bookmarkedQuestions(state.progress), action.rng)),
      )

    case 'startExam':
      return {
        ...begin(state, 'exam', createSession(buildExam(action.rng))),
        examEndsAt: action.now + EXAM.timeLimitMinutes * 60 * 1000,
      }

    case 'answer': {
      if (!state.session) return state
      const cur = currentQuestion(state.session)
      if (!cur || state.session.chosen[cur.id] !== undefined) return state
      const session = answerCurrent(state.session, action.choice)
      const correct = action.choice === cur.correct
      return {
        ...state,
        session,
        progress: recordAnswer(state.progress, cur.id, correct, action.now),
      }
    }

    case 'next': {
      if (!state.session) return state
      const session = advance(state.session)
      if (isFinished(session)) {
        return {
          ...state,
          session,
          view: 'results',
          examResult: state.mode === 'exam' ? evaluateExam(session) : null,
          progress:
            state.mode === 'lesson' && action.today
              ? recordLessonComplete(state.progress, action.today)
              : state.progress,
        }
      }
      return { ...state, session }
    }

    case 'finishExam': {
      if (!state.session) return state
      return {
        ...state,
        view: 'results',
        examResult: evaluateExam(state.session),
        examEndsAt: null,
      }
    }

    case 'toggleBookmark':
      return { ...state, progress: toggleBookmark(state.progress, action.id) }

    case 'setCommonplace':
      return {
        ...state,
        progress: setCollected(state.progress, action.citation, action.id, action.on, action.now),
      }

    case 'goMenu':
      return {
        ...state,
        view: 'home',
        mode: null,
        session: null,
        examResult: null,
        examEndsAt: null,
      }

    case 'navigate':
      return { ...state, view: action.view }

    case 'openNumerical':
      return { ...state, view: 'numerical' }

    default:
      return state
  }
}
