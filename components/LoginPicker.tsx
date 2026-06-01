"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { signIn } from "@/app/login/actions";
import { Avatar } from "./Avatar";
import { Icon } from "./icons";

type StaffTile = { username: string; name: string; avatar: string | null };

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full" disabled={pending}>
      {pending ? "Signing in…" : label}
    </button>
  );
}

function ErrorNote({ error }: { error?: string }) {
  if (!error) return null;
  return (
    <p className="flex items-center gap-2 rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
      <Icon name="alert" className="h-4 w-4 shrink-0" />
      {error}
    </p>
  );
}

export function LoginPicker({ staff }: { staff: StaffTile[] }) {
  const [error, formAction] = useFormState(signIn, undefined);
  const [selected, setSelected] = useState<StaffTile | null>(null);
  const [manual, setManual] = useState(staff.length === 0);

  // Manager / manual username + password
  if (manual) {
    return (
      <form action={formAction} className="space-y-4">
        <div>
          <label className="label" htmlFor="username">
            Username
          </label>
          <input
            id="username"
            name="username"
            autoComplete="username"
            autoCapitalize="none"
            autoFocus
            required
            className="input"
            placeholder="e.g. Admin"
          />
        </div>
        <div>
          <label className="label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="input"
            placeholder="••••••••"
          />
        </div>
        <ErrorNote error={error} />
        <SubmitButton label="Sign in" />
        {staff.length > 0 && (
          <button
            type="button"
            onClick={() => setManual(false)}
            className="w-full text-center text-sm text-ink-muted hover:text-ink"
          >
            ← Back to staff sign-in
          </button>
        )}
      </form>
    );
  }

  // Password step for a chosen staff member
  if (selected) {
    return (
      <form action={formAction} className="space-y-4">
        <div className="flex flex-col items-center gap-2 text-center">
          <Avatar name={selected.name} src={selected.avatar} size={88} />
          <p className="text-lg font-semibold text-ink">{selected.name}</p>
        </div>
        <input type="hidden" name="username" value={selected.username} />
        <div>
          <label className="label" htmlFor="password">
            Your password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            autoFocus
            required
            className="input text-center"
            placeholder="••••••••"
          />
        </div>
        <ErrorNote error={error} />
        <SubmitButton label="Sign in" />
        <button
          type="button"
          onClick={() => setSelected(null)}
          className="w-full text-center text-sm text-ink-muted hover:text-ink"
        >
          ← Choose someone else
        </button>
      </form>
    );
  }

  // Tile grid — tap your photo
  return (
    <div className="space-y-4">
      <p className="text-center text-sm text-ink-muted">Tap your photo to sign in</p>
      <div className="grid grid-cols-3 gap-3">
        {staff.map((s) => (
          <button
            key={s.username}
            type="button"
            onClick={() => setSelected(s)}
            className="flex flex-col items-center gap-2 rounded-2xl border border-border-soft bg-canvas/40 p-3 transition hover:border-forest-500/50 hover:bg-elevated active:scale-95"
          >
            <Avatar name={s.name} src={s.avatar} size={64} />
            <span className="line-clamp-1 text-xs font-medium text-ink">
              {s.name.split(" ")[0]}
            </span>
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setManual(true)}
        className="btn-secondary w-full"
      >
        <Icon name="user" className="h-4 w-4" />
        Manager / username sign-in
      </button>
    </div>
  );
}
