"use client";

import { useState } from "react";
import type { FormEvent } from "react";

const USERS: Record<string, string> = {
  Agustin: "Estefanell33",
  Rodrigo: "Surferogalactico33",
};

type Props = {
  onLogin: (username: string) => void;
};

export function LoginScreen({ onLogin }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (USERS[username] === password) {
      onLogin(username);
    } else {
      setError(true);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-base font-black text-ink">Aglir Propiedades</p>
          <h1 className="mt-3 text-2xl font-black text-ink">Gestión</h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid gap-4 rounded-xl border border-stone-200 bg-white p-6 shadow-sm"
        >
          <label className="grid gap-1.5 text-sm font-bold text-stone-700">
            Usuario
            <input
              type="text"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(false); }}
              autoComplete="username"
              required
              className="min-h-12 rounded-md border border-stone-300 px-4 py-3 text-base outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/20"
            />
          </label>

          <label className="grid gap-1.5 text-sm font-bold text-stone-700">
            Contraseña
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(false); }}
              autoComplete="current-password"
              required
              className="min-h-12 rounded-md border border-stone-300 px-4 py-3 text-base outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/20"
            />
          </label>

          {error && (
            <p className="text-sm font-semibold text-red-600">
              Credenciales incorrectas.
            </p>
          )}

          <button
            type="submit"
            className="min-h-12 rounded-md bg-leaf px-5 py-3 text-base font-bold text-white transition hover:bg-emerald-800"
          >
            Entrar
          </button>
        </form>
      </div>
    </main>
  );
}
