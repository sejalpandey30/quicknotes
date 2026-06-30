import { useCallback, useEffect, useMemo, useState } from "react";
import supabase from "../lib/supabaseClient";

const NOTE_LIMIT = 280;
const accentClasses = [
  "border-l-rose-400",
  "border-l-cyan-400",
  "border-l-amber-400",
  "border-l-emerald-400",
  "border-l-violet-400",
];

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

export default function Home() {
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState("");
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
    const timeoutId = window.setTimeout(fetchNotes, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [fetchNotes]);

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
    <main className="min-h-screen overflow-hidden bg-[#f7f3ea] text-stone-950">
      <div className="animated-grid min-h-screen px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-6xl flex-col">
          <nav className="fade-up flex items-center justify-between border-b border-stone-950/10 py-4">
            <a className="group inline-flex items-center gap-3" href="#top" aria-label="DropNote home">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-stone-950 text-lg font-black text-white shadow-[4px_4px_0_#f59e0b] transition group-hover:-translate-y-0.5 group-hover:shadow-[6px_6px_0_#06b6d4]">
                D
              </span>
              <span>
                <span className="block text-lg font-black tracking-tight">DropNote</span>
                <span className="block text-xs font-semibold uppercase text-stone-500">Anonymous board</span>
              </span>
            </a>

            <button
              type="button"
              onClick={fetchNotes}
              className="rounded-lg border border-stone-950/15 bg-white/75 px-4 py-2 text-sm font-bold text-stone-800 shadow-sm transition hover:-translate-y-0.5 hover:border-stone-950/30 hover:bg-white focus:outline-none focus:ring-4 focus:ring-cyan-300/40"
            >
              Refresh
            </button>
          </nav>

          <section id="top" className="grid flex-1 items-center gap-8 py-10 lg:grid-cols-[1fr_0.9fr] lg:py-14">
            <div className="fade-up space-y-7">
              <div className="inline-flex rounded-lg border border-stone-950/10 bg-white/70 px-3 py-1 text-xs font-black uppercase text-stone-600 shadow-sm">
                No profiles. No feeds. Just notes.
              </div>

              <div className="space-y-5">
                <h1 className="max-w-3xl text-5xl font-black leading-[0.95] tracking-tight text-stone-950 sm:text-6xl lg:text-7xl">
                  Drop a thought. Watch the wall come alive.
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-stone-600">
                  A colorful shared note wall backed by Supabase, built for quick anonymous messages.
                </p>
              </div>

              <div className="grid max-w-xl grid-cols-3 gap-3">
                <div className="rounded-lg border border-stone-950/10 bg-white/80 p-4 shadow-sm">
                  <p className="text-3xl font-black">{notes.length}</p>
                  <p className="mt-1 text-xs font-bold uppercase text-stone-500">Notes</p>
                </div>
                <div className="rounded-lg border border-stone-950/10 bg-cyan-100 p-4 shadow-sm">
                  <p className="text-3xl font-black">{remainingCharacters}</p>
                  <p className="mt-1 text-xs font-bold uppercase text-stone-500">Left</p>
                </div>
                <div className="rounded-lg border border-stone-950/10 bg-amber-100 p-4 shadow-sm">
                  <p className="text-3xl font-black">{latestNote ? "Live" : "Ready"}</p>
                  <p className="mt-1 text-xs font-bold uppercase text-stone-500">Status</p>
                </div>
              </div>
            </div>

            <section className="fade-up rounded-lg border border-stone-950/10 bg-white/85 p-4 shadow-[0_24px_80px_rgba(41,37,36,0.18)] backdrop-blur md:p-6">
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="flex items-center justify-between gap-4">
                  <label className="text-sm font-black uppercase text-stone-600" htmlFor="note-input">
                    New drop
                  </label>
                  <span
                    className={`text-sm font-bold ${remainingCharacters < 0 ? "text-red-600" : "text-stone-500"}`}
                  >
                    {remainingCharacters} chars
                  </span>
                </div>

                <textarea
                  id="note-input"
                  value={newNote}
                  onChange={(event) => setNewNote(event.target.value)}
                  placeholder="Leave a note for the wall..."
                  rows={5}
                  className="min-h-36 w-full resize-none rounded-lg border border-stone-950/15 bg-[#fffaf0] px-4 py-4 text-lg font-semibold leading-7 text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-300/30"
                  disabled={saving}
                />

                {error ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                    {error}
                  </div>
                ) : null}

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm font-semibold text-stone-500">
                    Notes are saved instantly to the shared Supabase table.
                  </p>
                  <button
                    type="submit"
                    disabled={!canSave}
                    className="group inline-flex h-12 items-center justify-center rounded-lg bg-stone-950 px-6 text-sm font-black uppercase text-white shadow-[5px_5px_0_#f43f5e] transition hover:-translate-y-0.5 hover:shadow-[7px_7px_0_#06b6d4] focus:outline-none focus:ring-4 focus:ring-amber-300/50 disabled:cursor-not-allowed disabled:bg-stone-400 disabled:shadow-none disabled:hover:translate-y-0"
                  >
                    {saving ? "Dropping..." : "Drop note"}
                    <span className="ml-2 transition group-hover:translate-x-1" aria-hidden="true">
                      +
                    </span>
                  </button>
                </div>
              </form>
            </section>
          </section>

          <section className="pb-10">
            <div className="mb-5 flex flex-col gap-2 border-t border-stone-950/10 pt-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-black uppercase text-stone-500">The wall</p>
                <h2 className="mt-1 text-3xl font-black tracking-tight text-stone-950">Fresh drops</h2>
              </div>
              <p className="text-sm font-semibold text-stone-500">
                {loading ? "Syncing with Supabase..." : `${notes.length} anonymous notes showing`}
              </p>
            </div>

            {loading ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {[0, 1, 2].map((item) => (
                  <div key={item} className="h-40 animate-pulse rounded-lg border border-stone-950/10 bg-white/70" />
                ))}
              </div>
            ) : notes.length === 0 ? (
              <div className="rounded-lg border border-dashed border-stone-950/25 bg-white/70 p-8 text-center shadow-sm">
                <p className="text-2xl font-black text-stone-900">The wall is wide open.</p>
                <p className="mt-2 text-sm font-semibold text-stone-500">Be the first anonymous drop.</p>
              </div>
            ) : (
              <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {notes.map((note, index) => (
                  <li
                    key={note.id}
                    className={`note-card fade-up rounded-lg border border-stone-950/10 border-l-4 bg-white/90 p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${accentClasses[index % accentClasses.length]}`}
                    style={{ animationDelay: `${Math.min(index, 8) * 70}ms` }}
                  >
                    <div className="mb-5 flex items-start justify-between gap-4">
                      <span className="rounded-lg bg-stone-950 px-3 py-1 text-xs font-black uppercase text-white">
                        Anonymous
                      </span>
                      <span className="text-xs font-bold uppercase text-stone-400">{formatDate(note.created_at)}</span>
                    </div>

                    <p className="min-h-20 break-words text-lg font-semibold leading-7 text-stone-800">
                      {note.content}
                    </p>

                    <div className="mt-6 flex items-center justify-between border-t border-stone-950/10 pt-4">
                      <span className="text-xs font-bold uppercase text-stone-400">#{String(index + 1).padStart(2, "0")}</span>
                      <button
                        type="button"
                        onClick={() => deleteNote(note.id)}
                        className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-black uppercase text-red-700 transition hover:-translate-y-0.5 hover:border-red-300 hover:bg-red-100 focus:outline-none focus:ring-4 focus:ring-red-200"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <footer className="mt-auto border-t border-stone-950/10 py-6 text-sm font-semibold text-stone-500">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p>DropNote is an anonymous app for leaving quick shared notes.</p>
              <p>No sign-in. No profiles. Just the note wall.</p>
            </div>
          </footer>
        </div>
      </div>
    </main>
  );
}
