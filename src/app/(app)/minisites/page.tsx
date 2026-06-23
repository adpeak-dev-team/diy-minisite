"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Land = {
  ld_id?: number | string;
  ld_domain: string;
  ld_name?: string | null;
  ld_db_input_subject?: string | null;
  ld_description?: string | null;
  ld_visit_count?: number | null;
  ld_created_at?: string | null;
};

type ListState =
  | { status: "loading" }
  | { status: "success"; items: Land[] }
  | { status: "error"; message: string };

const LIST_URL = "/api/test";

async function readResponse(res: Response): Promise<unknown> {
  const contentType = res.headers.get("content-type") ?? "";
  return contentType.includes("application/json")
    ? await res.json()
    : await res.text();
}

function normalizeList(payload: unknown): Land[] {
  if (Array.isArray(payload)) return payload as Land[];
  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    for (const key of ["data", "items", "lands", "rows", "list"]) {
      const v = obj[key];
      if (Array.isArray(v)) return v as Land[];
    }
  }
  return [];
}

export default function MinisitesPage() {
  const [state, setState] = useState<ListState>({ status: "loading" });

  const load = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const res = await fetch(LIST_URL, { cache: "no-store" });
      const body = await readResponse(res);
      if (!res.ok) {
        throw new Error(
          typeof body === "string" ? body : JSON.stringify(body),
        );
      }
      setState({ status: "success", items: normalizeList(body) });
    } catch (err) {
      setState({
        status: "error",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <main className="min-h-screen bg-zinc-50 p-8 font-sans dark:bg-black">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <header className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
              Minisite 목록
            </h1>
            <p className="text-sm text-zinc-500">
              수정 클릭 시 /setting 편집 페이지로 이동합니다.
            </p>
          </div>
          <button
            type="button"
            onClick={load}
            disabled={state.status === "loading"}
            className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-800 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            새로고침
          </button>
        </header>

        {state.status === "loading" && (
          <div className="rounded-md border border-zinc-200 bg-white p-6 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
            로딩 중…
          </div>
        )}

        {state.status === "error" && (
          <div className="rounded-md border border-rose-300 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-700 dark:bg-rose-950 dark:text-rose-200">
            <div className="font-medium">불러오기 실패</div>
            <pre className="mt-1 whitespace-pre-wrap wrap-break-word">
              {state.message}
            </pre>
          </div>
        )}

        {state.status === "success" && (
          <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                <tr>
                  <th className="px-4 py-2">Domain</th>
                  <th className="px-4 py-2">사이트명</th>
                  <th className="px-4 py-2 w-20 text-right">방문</th>
                  <th className="px-4 py-2">생성일</th>
                  <th className="px-4 py-2 w-32"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {state.items.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-6 text-center text-zinc-500"
                    >
                      항목이 없습니다.
                    </td>
                  </tr>
                )}
                {state.items.map((land) => (
                  <tr
                    key={land.ld_domain}
                    className="text-zinc-800 dark:text-zinc-200"
                  >
                    <td className="px-4 py-3 font-mono">{land.ld_domain}</td>
                    <td className="px-4 py-3">{land.ld_name ?? "—"}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {land.ld_visit_count ?? 0}
                    </td>
                    <td className="px-4 py-3 text-zinc-500">
                      {land.ld_created_at
                        ? land.ld_created_at.slice(0, 10)
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/setting?domain=${encodeURIComponent(land.ld_domain)}`}
                        className="inline-block rounded border border-zinc-300 px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      >
                        수정
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
