import { Suspense } from "react";
import { signIn } from "./actions";

async function LoginForm({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const from = typeof params.from === "string" ? params.from : "/";

  return (
    <form action={signIn} className="px-5 pb-5">
      <input type="hidden" name="from" value={from} />
      <p className="font-mono text-xs text-muted-foreground mb-1">
        <span className="text-primary">&gt;</span> athena auth --request-access
      </p>
      <label className="block mt-4 mb-3">
        <span className="block mb-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Operator call sign
        </span>
        <input
          name="callsign"
          type="text"
          placeholder="OPERATOR-01"
          autoFocus
          className="w-full h-9 bg-input/20 border border-border px-2.5 font-mono text-sm outline-none focus:border-ring focus:shadow-[0_0_0_3px_var(--ring)] transition-all rounded-md"
          style={{ boxShadow: "none" }}
        />
      </label>
      <button
        type="submit"
        className="w-full h-9 bg-primary text-primary-foreground font-mono text-xs uppercase tracking-wider rounded-md hover:bg-primary/85 transition-colors"
      >
        Authorize
      </button>
      <p className="mt-4 text-[11px] text-muted-foreground/70 leading-relaxed">
        Demo access gate — any input (or none) signs you in. This is a portfolio project; no real
        authentication, no call sign sent or stored.
      </p>
    </form>
  );
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return (
    <main className="flex-1 flex items-center justify-center px-6">
      <div className="w-full max-w-sm border border-primary/20 rounded-lg bg-card/60 backdrop-blur-sm shadow-[0_0_40px_-12px_var(--primary)]">
        <div className="flex items-center gap-2 border-b border-primary/15 px-4 py-3">
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-primary" />
          </span>
          <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            Athena — mission control
          </span>
        </div>
        <Suspense fallback={<div className="h-48" />}>
          <LoginForm searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}
