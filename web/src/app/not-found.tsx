import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-16">
      <p className="text-4xl font-semibold tracking-tight">404</p>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">This page could not be found.</p>
      <Link href="/" className="text-sm font-medium underline underline-offset-4">
        Back home
      </Link>
    </div>
  );
}
