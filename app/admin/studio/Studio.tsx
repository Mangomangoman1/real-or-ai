"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Draft, Status } from "@/lib/studio/types";

const TABS: (Status | "all")[] = ["drafted", "approved", "rejected", "all"];
const WORK: Status[] = ["new", "picked", "made"];

export default function Studio() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [tab, setTab] = useState<Status | "all">("drafted");
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const runRef = useRef(false);

  const refresh = useCallback(async () => {
    const r = await fetch("/api/admin/studio/list", { cache: "no-store" });
    if (r.ok) setDrafts(await r.json());
  }, []);
  useEffect(() => {
    refresh();
  }, [refresh]);

  async function run() {
    if (runRef.current) {
      runRef.current = false;
      setRunning(false);
      return;
    }
    runRef.current = true;
    setRunning(true);
    const fails: Record<string, number> = {};
    while (runRef.current) {
      const r = await fetch("/api/admin/studio/list?brief=1", { cache: "no-store" });
      const { drafts: brief } = (await r.json()) as { drafts: { id: string; status: Status }[] };
      const todo = brief.filter((d) => WORK.includes(d.status) && (fails[d.id] ?? 0) < 3).slice(0, 4);
      if (!todo.length) break;
      await Promise.all(
        todo.map(async (d) => {
          const res = await fetch(`/api/admin/studio/step?id=${d.id}`, { cache: "no-store" }).catch(() => null);
          const j = res ? await res.json().catch(() => ({ error: `http ${res.status}` })) : { error: "network" };
          if (j.error) fails[d.id] = (fails[d.id] ?? 0) + 1;
          setLog((l) => [`${new Date().toLocaleTimeString()} ${d.id} ${j.from ?? d.status} → ${j.to ?? "✗"} ${j.error ?? j.note ?? ""}`, ...l].slice(0, 200));
        }),
      );
    }
    runRef.current = false;
    setRunning(false);
    setLog((l) => ["done", ...l]);
    refresh();
  }

  async function edit(id: string, params: Record<string, string | number>) {
    const q = new URLSearchParams({ id, ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])) });
    const r = await fetch(`/api/admin/studio/edit?${q}`, { cache: "no-store" });
    if (r.ok) {
      const d = (await r.json()) as Draft;
      setDrafts((all) => all.map((x) => (x.id === id ? d : x)));
    }
  }

  const counts = drafts.reduce<Record<string, number>>((m, d) => ((m[d.status] = (m[d.status] ?? 0) + 1), m), {});
  const shown = drafts.filter((d) => tab === "all" || d.status === tab);

  return (
    <main className="studio">
      <header>
        <b>Studio</b>
        {TABS.map((t) => (
          <button key={t} className={t === tab ? "on" : ""} onClick={() => setTab(t)}>
            {t} {t === "all" ? drafts.length : counts[t] ?? 0}
          </button>
        ))}
        <span className="muted">
          in progress {WORK.reduce((n, s) => n + (counts[s] ?? 0), 0)}
        </span>
        <button onClick={run} className="run">{running ? "Stop" : "Run pipeline"}</button>
        <button onClick={refresh}>Refresh</button>
      </header>
      {log.length > 0 && <pre className="log">{log.slice(0, 8).join("\n")}</pre>}
      {shown.map((d) => (
        <Card key={d.id} d={d} edit={edit} />
      ))}
    </main>
  );
}

function Card({ d, edit }: { d: Draft; edit: (id: string, p: Record<string, string | number>) => void }) {
  const [text, setText] = useState(d.tell?.text ?? "");
  const [place, setPlace] = useState(false);
  useEffect(() => setText(d.tell?.text ?? ""), [d.tell?.text]);
  const bust = encodeURIComponent(d.updatedAt);
  return (
    <section className={`card ${d.status}`}>
      <div className="meta">
        <b>{d.id}</b> {d.subject ?? d.query} · {d.ai?.model?.split("/")[1] ?? "-"} · diff {d.difficulty ?? "-"} · {d.status}
        {d.day ? ` · day ${d.day}` : ""}
        {d.note && <em> · {d.note}</em>}
        {d.photo && (
          <a href={d.photo.credit.sourceUrl} target="_blank" rel="noreferrer"> · {d.photo.credit.license}</a>
        )}
      </div>
      {d.realSrc && d.ai?.src ? (
        <div className="pair">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${d.realSrc}?v=${bust}`} alt="real" />
          <div className="ai">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${d.ai.src}?v=${bust}`} alt="ai" />
            {d.tell && <i className="ring" style={{ left: `${d.tell.x * 100}%`, top: `${d.tell.y * 100}%` }} />}
            {place && (
              <div className="cells">
                {Array.from({ length: 100 }, (_, i) => (
                  <button
                    key={i}
                    aria-label={`cell ${"ABCDEFGHIJ"[i % 10]}${Math.floor(i / 10) + 1}`}
                    onClick={() => {
                      edit(d.id, { x: ((i % 10) + 0.5) / 10, y: (Math.floor(i / 10) + 0.5) / 10 });
                      setPlace(false);
                    }}
                  >
                    {"ABCDEFGHIJ"[i % 10]}
                    {Math.floor(i / 10) + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        d.description && <p className="desc">{d.description}</p>
      )}
      {d.tell && (
        <div className="row">
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} aria-label="tell" />
          <button onClick={() => edit(d.id, { tell: text })} disabled={text === d.tell.text}>Save tell</button>
        </div>
      )}
      <div className="row">
        <button onClick={() => edit(d.id, { status: "approved" })}>Approve</button>
        <button onClick={() => edit(d.id, { status: "rejected" })}>Reject</button>
        <button onClick={() => setPlace((p) => !p)}>{place ? "Cancel place" : "Place ring"}</button>
        <button onClick={() => edit(d.id, { status: "made" })}>Redo tell</button>
        <button onClick={() => edit(d.id, { status: "picked" })}>Redo twin</button>
        <button onClick={() => edit(d.id, { status: "new" })}>Re-pick photo</button>
      </div>
    </section>
  );
}
