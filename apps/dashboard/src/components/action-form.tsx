"use client";

import { useActionState, type ReactNode } from "react";

import type { ActionState } from "@/app/(clinic)/actions";

/** A <form> bound to a server action that returns { error, ok }, with inline feedback. */
export function ActionForm({
  action,
  children,
  submitLabel,
  className = "space-y-4",
  variant = "btn",
}: {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  children: ReactNode;
  submitLabel: string;
  className?: string;
  variant?: "btn" | "btn-ghost" | "btn-gold";
}) {
  const [state, formAction, pending] = useActionState(action, { error: null, ok: null });
  return (
    <form action={formAction} className={className}>
      {children}
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className={variant} disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </button>
        {state.error ? (
          <p role="alert" className="text-sm text-danger">
            {state.error}
          </p>
        ) : state.ok ? (
          <p role="status" className="text-sm text-ok">
            {state.ok}
          </p>
        ) : null}
      </div>
    </form>
  );
}
