"use client";

import { useEffect, useState } from "react";

type State =
  | { status: "loading" }
  | { status: "success"; data: unknown }
  | { status: "error"; message: string };

export default function TestPage() {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/test", { signal: controller.signal })
      .then(async (res) => {
        const contentType = res.headers.get("content-type") ?? "";
        const body = contentType.includes("application/json")
          ? await res.json()
          : await res.text();
        if (!res.ok) {
          throw new Error(
            typeof body === "string" ? body : JSON.stringify(body),
          );
        }
        setState({ status: "success", data: body });
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setState({
          status: "error",
          message: err instanceof Error ? err.message : String(err),
        });
      });

    return () => controller.abort();
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-50 p-8 font-sans dark:bg-black">
      <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
        Backend Connection Test
      </h1>
      <p className="text-sm text-zinc-500">
        GET /api/test → http://localhost:4000/api/test
      </p>

      <pre className="w-full max-w-3xl overflow-auto rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
        {state.status === "loading" && "Loading..."}
        {state.status === "success" &&
          (typeof state.data === "string"
            ? state.data
            : JSON.stringify(state.data, null, 2))}
        {state.status === "error" && `Error: ${state.message}`}
      </pre>
    </main>
  );
}
