import { useCallback, useEffect, useMemo, useState } from "react";
import supabase from "../lib/supabaseClient";

const NOTE_LIMIT = 280;
const themeOptions = ["day", "night"];
const accents = ["#ff5d8f", "#14b8a6", "#f59e0b", "#8b5cf6", "#38bdf8"];

function formatDate(value) {
  if (!value) {
    return "Just now";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function getInitialTheme() {
  if (typeof window === "undefined") {
    return "day";
  }

  const savedTheme = window.localStorage.getItem("dropnote-theme");

  if (themeOptions.includes(savedTheme)) {
    return savedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "night" : "day";
}

export default function Home() {
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState("");
  const [theme, setTheme] = useState("day");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const remainingCharacters = NOTE_LIMIT - newNote.length;
  const canSave = newNote.trim().length > 0 && remainingCharacters >= 0 && !saving;
  const latestNote = useMemo(() => notes[0], [notes]);

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    setError("");

    if (!supabase) {
      setError("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
      setLoading(false);
      return;
    }

    const { data, error: notesError } = await supabase
      .from("notes")
      .select("id, content, created_at")
      .order("created_at", { ascending: false });

    if (notesError) {
      setError(`Unable to load notes. ${notesError.message}`);
      setNotes([]);
    } else {
      setNotes(data || []);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    const themeTimer = window.setTimeout(() => {
      setTheme(getInitialTheme());
    }, 0);
    const notesTimer = window.setTimeout(fetchNotes, 0);

    return () => {
      window.clearTimeout(themeTimer);
      window.clearTimeout(notesTimer);
    };
  }, [fetchNotes]);

  function toggleTheme() {
    setTheme((currentTheme) => {
      const nextTheme = currentTheme === "night" ? "day" : "night";
      window.localStorage.setItem("dropnote-theme", nextTheme);
      return nextTheme;
    });
  }

  async function addNote() {
    const content = newNote.trim();

    if (!canSave || !content) {
      return;
    }

    if (!supabase) {
      setError("Supabase is not configured. Cannot save this note.");
      return;
    }

    setSaving(true);
    setError("");

    const { error: insertError } = await supabase.from("notes").insert({ content });

    if (insertError) {
      setError(`Unable to add note. ${insertError.message}`);
    } else {
      setNewNote("");
      await fetchNotes();
    }

    setSaving(false);
  }

  async function deleteNote(id) {
    if (!supabase) {
      setError("Supabase is not configured. Cannot delete this note.");
      return;
    }

    const previousNotes = notes;
    setError("");
    setNotes((currentNotes) => currentNotes.filter((note) => note.id !== id));

    const { error: deleteError } = await supabase.from("notes").delete().eq("id", id);

    if (deleteError) {
      setError(`Unable to delete note. ${deleteError.message}`);
      setNotes(previousNotes);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    addNote();
  }

  return (
    <main className="dropnote-theme min-h-screen overflow-hidden" data-theme={theme}>
      <div className="theme-canvas min-h-screen px-4 py-5 text-[var(--ink)] sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-6xl flex-col">
          <nav className="fade-up flex items-center justify-between gap-4 border-b border-[color:var(--line)] py-4">
            <a className="group inline-flex min-w-0 items-center gap-3" href="#top" aria-label="DropNote home">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[var(--ink)] text-lg font-black text-[var(--reverse)] shadow-[4px_4px_0_var(--accent)] transition group-hover:-translate-y-0.5 group-hover:rotate-3">
                D
              </span>
              <span className="min-w-0">
                <span className="block text-lg font-black tracking-tight">DropNote</span>
                <span className="block text-xs font-bold uppercase text-[var(--muted)]">Anonymous note wall</span>
              </span>
            </a>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleTheme}
                className="group relative h-10 w-20 rounded-full border border-[color:var(--line)] bg-[var(--surface-soft)] p-1 shadow-sm transition hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-[var(--focus)]"
                aria-label={`Switch to ${theme === "night" ? "day" : "night"} mode`}
              >
                <span
                  className={`grid h-8 w-8 place-items-center rounded-full bg-[var(--ink)] text-xs font-black text-[var(--reverse)] shadow-sm transition ${theme === "night" ? "translate-x-10" : ""}`}
                  aria-hidden="true"
                >
                  {theme === "night" ? "N" : "D"}
                </span>
              </button>

              <button
                type="button"
                onClick={fetchNotes}
                className="hidden rounded-lg border border-[color:var(--line)] bg-[var(--surface)] px-4 py-2 text-sm font-bold text-[var(--ink)] shadow-sm transition hover:-translate-y-0.5 hover:bg-[var(--surface-strong)] focus:outline-none focus:ring-4 focus:ring-[var(--focus)] sm:inline-flex"
              >
                Refresh
              </button>
            </div>
          </nav>

          <section id="top" className="grid flex-1 items-center gap-8 py-9 lg:grid-cols-[0.95fr_1.05fr] lg:py-12">
            <div className="fade-up space-y-6">
              <div className="inline-flex rounded-full border border-[color:var(--line)] bg-[var(--surface)] px-4 py-2 text-xs font-black uppercase text-[var(--muted)] shadow-sm">
                Minimal notes. Maximum little sparks.
              </div>

              <div className="space-y-5">
                <h1 className="max-w-3xl text-5xl font-black leading-[0.96] tracking-tight sm:text-6xl lg:text-7xl">
                  A tiny wall for quick anonymous thoughts.
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-[var(--muted)]">
                  Drop a note, sync it with Supabase, and keep the board light, colorful, and quietly alive.
                </p>
              </div>

              <div className="grid max-w-xl grid-cols-3 gap-3">
                <div className="metric-card bg-[var(--surface)]">
                  <p className="text-3xl font-black">{notes.length}</p>
                  <p className="mt-1 text-xs font-bold uppercase text-[var(--muted)]">Drops</p>
                </div>
                <div className="metric-card bg-[var(--mint)]">
                  <p className="text-3xl font-black">{remainingCharacters}</p>
                  <p className="mt-1 text-xs font-bold uppercase text-[var(--muted)]">Chars</p>
                </div>
                <div className="metric-card bg-[var(--sun)]">
                  <p className="text-3xl font-black">{latestNote ? "Live" : "Open"}</p>
                  <p className="mt-1 text-xs font-bold uppercase text-[var(--muted)]">Mode</p>
                </div>
              </div>
            </div>

            <section className="fade-up rounded-2xl border border-[color:var(--line)] bg-[var(--surface)] p-4 shadow-[0_24px_80px_var(--shadow)] backdrop-blur md:p-6">
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="flex items-center justify-between gap-4">
                  <label className="text-sm font-black uppercase text-[var(--muted)]" htmlFor="note-input">
                    New anonymous drop
                  </label>
                  <span className={`text-sm font-bold ${remainingCharacters < 0 ? "text-red-500" : "text-[var(--muted)]"}`}>
                    {remainingCharacters} left
                  </span>
                </div>

                <textarea
                  id="note-input"
                  value={newNote}
                  onChange={(event) => setNewNote(event.target.value)}
                  placeholder="Type something short, useful, funny, or strangely specific..."
                  rows={5}
                  className="min-h-36 w-full resize-none rounded-xl border border-[color:var(--line)] bg-[var(--field)] px-4 py-4 text-lg font-semibold leading-7 text-[var(--ink)] outline-none transition placeholder:text-[var(--muted-soft)] focus:border-[var(--accent)] focus:bg-[var(--surface-strong)] focus:ring-4 focus:ring-[var(--focus)]"
                  disabled={saving}
                />

                {error ? (
                  <div className="rounded-xl border border-red-300/60 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                    {error}
                  </div>
                ) : null}

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm font-semibold text-[var(--muted)]">
                    Shared instantly. Anonymous by design.
                  </p>
                  <button
                    type="submit"
                    disabled={!canSave}
                    className="inline-flex h-12 items-center justify-center rounded-xl bg-[var(--ink)] px-6 text-sm font-black uppercase text-[var(--reverse)] shadow-[5px_5px_0_var(--accent)] transition hover:-translate-y-0.5 hover:shadow-[7px_7px_0_var(--accent-two)] focus:outline-none focus:ring-4 focus:ring-[var(--focus)] disabled:cursor-not-allowed disabled:bg-[var(--disabled)] disabled:shadow-none disabled:hover:translate-y-0"
                  >
                    {saving ? "Dropping..." : "Drop note"}
                  </button>
                </div>
              </form>
            </section>
          </section>

          <section className="pb-10">
            <div className="mb-5 flex flex-col gap-2 border-t border-[color:var(--line)] pt-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-black uppercase text-[var(--muted)]">The wall</p>
                <h2 className="mt-1 text-3xl font-black tracking-tight">Fresh drops</h2>
              </div>
              <p className="text-sm font-semibold text-[var(--muted)]">
                {loading ? "Syncing with Supabase..." : `${notes.length} anonymous notes showing`}
              </p>
            </div>

            {loading ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {[0, 1, 2].map((item) => (
                  <div key={item} className="h-44 animate-pulse rounded-2xl border border-[color:var(--line)] bg-[var(--surface)]" />
                ))}
              </div>
            ) : notes.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[color:var(--line-strong)] bg-[var(--surface)] p-8 text-center shadow-sm">
                <p className="text-2xl font-black">The wall is open.</p>
                <p className="mt-2 text-sm font-semibold text-[var(--muted)]">Start the first anonymous drop.</p>
              </div>
            ) : (
              <ul className="grid auto-rows-fr gap-4 md:grid-cols-2 xl:grid-cols-3">
                {notes.map((note, index) => (
                  <li
                    key={note.id}
                    className="note-card fade-up group flex min-h-52 flex-col rounded-2xl border border-[color:var(--line)] bg-[var(--surface)] p-5 shadow-sm transition hover:-translate-y-1 hover:border-[color:var(--line-strong)] hover:shadow-[0_18px_42px_var(--shadow)]"
                    style={{
                      animationDelay: `${Math.min(index, 8) * 60}ms`,
                      borderTopColor: accents[index % accents.length],
                      borderTopWidth: "5px",
                    }}
                  >
                    <div className="mb-5 flex items-start justify-between gap-4">
                      <span className="rounded-full bg-[var(--pill)] px-3 py-1 text-xs font-black uppercase text-[var(--pill-text)]">
                        Anonymous
                      </span>
                      <span className="text-xs font-bold uppercase text-[var(--muted)]">{formatDate(note.created_at)}</span>
                    </div>

                    <p className="min-h-20 flex-1 break-words text-lg font-semibold leading-7 text-[var(--ink)]">
                      {note.content}
                    </p>

                    <div className="mt-6 flex items-center justify-between border-t border-[color:var(--line)] pt-4">
                      <span className="text-xs font-bold uppercase text-[var(--muted)]">
                        #{String(index + 1).padStart(2, "0")}
                      </span>
                      <button
                        type="button"
                        onClick={() => deleteNote(note.id)}
                        className="rounded-full border border-red-300/50 bg-red-50 px-3 py-2 text-xs font-black uppercase text-red-700 transition hover:-translate-y-0.5 hover:bg-red-100 focus:outline-none focus:ring-4 focus:ring-red-200"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <footer className="mt-auto border-t border-[color:var(--line)] py-6 text-sm font-semibold text-[var(--muted)]">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p>DropNote is an anonymous app for quick shared notes.</p>
              <p>{theme === "night" ? "Night mode on." : "Day mode on."} No sign-in. No profiles.</p>
            </div>
          </footer>
        </div>
      </div>
    </main>
  );
}
