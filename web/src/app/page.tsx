import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 p-16">
      <h1 className="text-3xl font-semibold tracking-tight">Attendance Platform</h1>
      <div className="flex gap-4">
        <Link
          href="/login"
          className="rounded-md bg-foreground px-5 py-2.5 text-background transition-colors hover:bg-foreground/85"
        >
          Sign in
        </Link>
        <Link
          href="/employer/dashboard"
          className="rounded-md border border-border px-5 py-2.5 transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          Dashboard
        </Link>
      </div>
    </div>
  );
}
