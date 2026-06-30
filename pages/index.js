import { useCallback, useEffect, useState } from "react";
import supabase from "../lib/supabaseClient";

export default function Home() {
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    setError("");

    if (!supabase) {
      setError("Supabase is not configured. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
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

    if (!content || saving) {
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

    setError("");
    setNotes((currentNotes) => currentNotes.filter((note) => note.id !== id));

    const { error: deleteError } = await supabase.from("notes").delete().eq("id", id);

    if (deleteError) {
      setError(`Unable to delete note. ${deleteError.message}`);
      await fetchNotes();
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    addNote();
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12 text-slate-900">
      <div className="mx-auto w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50">
        <header className="mb-8 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Quick Notes</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">Save your notes</h1>
          <p className="mt-3 text-slate-600">Write a quick thought and keep it synced in Supabase.</p>
        </header>

        {error ? (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <form className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center" onSubmit={handleSubmit}>
          <label className="sr-only" htmlFor="note-input">
            New note
          </label>
          <input
            id="note-input"
            type="text"
            value={newNote}
            onChange={(event) => setNewNote(event.target.value)}
            placeholder="Write your note here"
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition duration-150 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            disabled={saving}
          />
          <button
            type="submit"
            disabled={saving || !newNote.trim()}
            className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-900 px-6 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {saving ? "Saving..." : "Save note"}
          </button>
        </form>

        <section className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Your notes</h2>
            <span className="text-sm text-slate-500">{notes.length} items</span>
          </div>

          {loading ? (
            <p className="text-sm text-slate-500">Loading notes...</p>
          ) : notes.length === 0 ? (
            <p className="text-sm text-slate-500">No notes yet. Add one to get started.</p>
          ) : (
            <ul className="space-y-3">
              {notes.map((note) => (
                <li
                  key={note.id}
                  className="flex items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white px-4 py-4 shadow-sm"
                >
                  <p className="min-w-0 flex-1 break-words text-slate-700">{note.content}</p>
                  <button
                    type="button"
                    onClick={() => deleteNote(note.id)}
                    className="shrink-0 rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
