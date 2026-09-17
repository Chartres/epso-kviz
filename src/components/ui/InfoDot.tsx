/** A small "(i)" affordance that reveals an explanatory tooltip on hover/focus. */
export function InfoDot({ text }: { text: string }) {
  return (
    <span className="group relative ml-1 inline-flex align-middle">
      <span
        tabIndex={0}
        role="img"
        aria-label={text}
        className="flex h-3.5 w-3.5 cursor-help items-center justify-center rounded-full border border-steel-600 font-mono text-[0.6rem] font-bold lowercase text-steel-500 transition-colors hover:border-brass-400 hover:text-brass-400 focus:outline-none focus-visible:border-brass-400"
      >
        i
      </span>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-48 -translate-x-1/2 rounded-card border border-steel-600 bg-steel-900 px-3 py-2 text-left text-xs font-normal normal-case leading-snug tracking-normal text-steel-300 opacity-0 shadow-xl transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {text}
      </span>
    </span>
  )
}
