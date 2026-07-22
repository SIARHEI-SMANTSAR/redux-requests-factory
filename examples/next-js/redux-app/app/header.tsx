import Link from 'next/link';

const links = [
  { href: '/', label: 'Client loading' },
  { href: '/server-redux', label: 'Async component' },
  { href: '/server-redux-batch', label: 'Batched loading' },
  { href: '/server-redux-streams', label: 'Independent streams' },
];

export default function Header() {
  return (
    <header className="border-b border-black/10 bg-white dark:border-white/15 dark:bg-zinc-950">
      <nav
        aria-label="Example pages"
        className="mx-auto flex w-full max-w-4xl flex-wrap items-center justify-between gap-4 px-6 py-4"
      >
        <Link className="font-semibold" href="/">
          Redux requests factory
        </Link>
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              className="text-zinc-600 transition-colors hover:text-foreground dark:text-zinc-300"
              href={href}
            >
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
