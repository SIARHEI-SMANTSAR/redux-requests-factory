"use client";

import { decrement, increment } from "@/lib/features/counter/counter-slice";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";

export default function Counter() {
  const count = useAppSelector((state) => state.counter.value);
  const dispatch = useAppDispatch();

  return (
    <section className="flex flex-col items-center gap-6 rounded-2xl border border-black/10 bg-white p-8 shadow-sm dark:border-white/15 dark:bg-zinc-900">
      <p className="text-sm font-medium uppercase tracking-widest text-zinc-500">
        Redux state
      </p>
      <output className="text-6xl font-semibold tabular-nums">{count}</output>
      <div className="flex gap-3">
        <button
          type="button"
          className="h-11 min-w-28 rounded-full border border-black/15 px-5 font-medium transition-colors hover:bg-zinc-100 dark:border-white/20 dark:hover:bg-zinc-800"
          onClick={() => dispatch(decrement())}
        >
          Decrement
        </button>
        <button
          type="button"
          className="h-11 min-w-28 rounded-full bg-foreground px-5 font-medium text-background transition-opacity hover:opacity-80"
          onClick={() => dispatch(increment())}
        >
          Increment
        </button>
      </div>
    </section>
  );
}
