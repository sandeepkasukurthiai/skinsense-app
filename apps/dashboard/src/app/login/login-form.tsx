"use client";

import { useSearchParams } from "next/navigation";
import { useActionState } from "react";

import { signIn } from "./actions";

export function LoginForm() {
  const params = useSearchParams();
  const [state, action, pending] = useActionState(signIn, {
    error: params.get("error") === "not-staff" ? "This account isn’t set up as clinic staff." : null,
  });

  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="email" className="label">
          Email
        </label>
        <input id="email" name="email" type="email" autoComplete="email" required className="field" />
      </div>
      <div>
        <label htmlFor="password" className="label">
          Password
        </label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="field" />
      </div>
      {state.error ? (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      ) : null}
      <button type="submit" className="btn w-full" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
