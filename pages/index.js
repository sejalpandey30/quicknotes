import { useEffect, useState } from "react";
import supabase from "../lib/supabaseClient";

export default function Home() {
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);

  useEffect(() => {
    let authSubscription = null;

    async function initializeAuth() {
      const sessionFromUrl = await supabase.auth.getSessionFromUrl({ storeSession: true });
      const sessionResult = sessionFromUrl?.data?.session;

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const activeSession = sessionResult || session;
      setUser(activeSession?.user ?? null);
      setAuthLoading(false);

      if (activeSession?.user) {
        fetchNotes(activeSession.user.id);
      }
    }

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);

      if (session?.user) {
        await fetchNotes(session.user.id);
      } else {
        setNotes([]);
      }
    });

    authSubscription = subscription;

    return () => {
      authSubscription?.unsubscribe();
    };
  }, []);

  async function fetchNotes(userId) {
    setLoading(true);
    setError("");

    if (!userId) {
      setNotes([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("notes")
      .select("id, content, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      setError("Unable to load notes. Make sure your notes table has a user_id column.");
      console.error(error);
    } else {
      setNotes(data || []);
    }

    setLoading(false);
  }

  async function addNote() {
    if (!newNote.trim() || !user) {
      return;
    }

    setLoading(true);
    setError("");

    const { error } = await supabase.from("notes").insert({
      content: newNote.trim(),
      user_id: user.id,
    });

    if (error) {
      setError("Unable to add note.");
      console.error(error);
    } else {
      setNewNote("");
      fetchNotes(user.id);
    }

    setLoading(false);
  }

  async function deleteNote(id) {
    if (!user) {
      return;
    }

    setLoading(true);
    setError("");

    const { error } = await supabase.from("notes").delete().eq("id", id);

    if (error) {
      setError("Unable to delete note.");
      console.error(error);
    } else {
      setNotes(notes.filter((note) => note.id !== id));
    }

    setLoading(false);
  }

  async function signInWithGoogle() {
    setError("");

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      setError(error.message);
      console.error(error);
    }
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      setError(error.message);
      console.error(error);
    } else {
      setUser(null);
      setNotes([]);
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-12 text-slate-900">
        <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50 text-center">
          <p className="text-lg font-medium text-slate-700">Loading authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-12 text-slate-900">
      <div className="mx-auto w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50">
        <header className="mb-8 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Quick Notes</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">
            Notes by Google sign-in
          </h1>
          <p className="mt-3 text-slate-600">
            Sign in with Google to manage your personal notes.
          </p>
        </header>

        {error ? (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {!user ? (
          <div className="space-y-5 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-8 text-center">
            <p className="text-slate-700">To keep notes separated by user, please sign in with Google.</p>
            <button
              type="button"
              onClick={signInWithGoogle}
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-900 px-6 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Sign in with Google
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">Signed in as</p>
                <p className="text-sm text-slate-600">{user.email}</p>
              </div>
              <button
                type="button"
                onClick={signOut}
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                Sign out
              </button>
            </div>

            <section className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <label className="sr-only" htmlFor="note-input">
                  New note
                </label>
                <input
                  id="note-input"
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Write your note here"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition duration-150 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={addNote}
                  disabled={loading}
                  className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-900 px-6 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {loading ? "Saving..." : "Save note"}
                </button>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-900">Your notes</h2>
                  <span className="text-sm text-slate-500">{notes.length} items</span>
                </div>

                {loading && notes.length === 0 ? (
                  <p className="text-sm text-slate-500">Loading notes...</p>
                ) : notes.length === 0 ? (
                  <p className="text-sm text-slate-500">No notes yet. Add one to get started.</p>
                ) : (
                  <ul className="space-y-3">
                    {notes.map((note) => (
                      <li key={note.id} className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
                        <p className="max-w-[calc(100%-120px)] text-slate-700">{note.content}</p>
                        <button
                          type="button"
                          onClick={() => deleteNote(note.id)}
                          className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                        >
                          Delete
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
