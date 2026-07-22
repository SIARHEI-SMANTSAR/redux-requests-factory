import Counter from '@/app/counter';
import Users from '@/app/users';

export default function Home() {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-6 font-sans dark:bg-black">
      <main className="flex w-full max-w-2xl flex-col items-center gap-10 py-24 text-center">
        <div className="space-y-3">
          <h1 className="text-4xl font-semibold tracking-tight">
            Next.js + Redux
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            This page demonstrates client-side requests with
            redux-requests-factory.
          </p>
        </div>
        <Counter />
        <Users />
      </main>
    </div>
  );
}
