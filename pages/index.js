import { useEffect, useState } from "react";
import supabase from "../lib/supabaseClient";

export default function Home() {
  const AUTH_ENABLED = process.env.NEXT_PUBLIC_AUTH_ENABLED === "true";
  const FALLBACK_USER_ID = "public";

  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);

  useEffect(() => {
    let authSubscription = null;

    async function initializeAuth() {
      try {
        if (!AUTH_ENABLED) {
          // Provide a shared fallback user for cloud-only deployments
          setUser({ id: FALLBACK_USER_ID, email: "public@local" });
          await fetchNotes(FALLBACK_USER_ID);
          setAuthLoading(false);
          return;
        }
        if (!supabase) {
          throw new Error("Supabase client is not initialized. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
        }

        const urlParams = new URLSearchParams(window.location.search);
        const hasAuthParams = urlParams.has("code") || urlParams.has("error") || urlParams.has("state") || urlParams.has("sb");

        const { error: initError } = await supabase.auth.initialize();
        if (initError) {
          throw initError;
        }

        if (hasAuthParams) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        setUser(session?.user ?? null);

        if (session?.user) {
          await fetchNotes(session.user.id);
        }
      } catch (initializationError) {
        console.error("Authentication initialization failed:", initializationError);
        setError(
          initializationError?.message ||
          (initializationError?.error && initializationError.error.message) ||
          "Unable to initialize authentication."
        );
      } finally {
        setAuthLoading(false);
      }
    }

    initializeAuth();

    if (supabase) {
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
    }

    return () => {
      authSubscription?.unsubscribe();
    };
  }, []);

  async function fetchNotes(userId) {
    setLoading(true);
    setError("");

    if (!supabase) {
      setError("Supabase client is not initialized. Cannot load notes.");
      setLoading(false);
      return;
    }

    const query = supabase.from("notes").select("id, content, created_at").order("created_at", { ascending: false });

    if (AUTH_ENABLED) {
      if (!userId) {
        setNotes([]);
        setLoading(false);
        return;
      }
      query.eq("user_id", userId);
    }

    const { data, error } = await query;

    if (error) {
      setError(`Unable to load notes. ${error.message}`);
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

    const notePayload = {
      content: newNote.trim(),
    };

    if (AUTH_ENABLED) {
      notePayload.user_id = user.id;
    }

    if (!supabase) {
      setError("Supabase client is not initialized. Cannot add note.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("notes").insert(notePayload);

    if (error) {
      setError("Unable to add note.");
      console.error(error);
    } else {
      setNewNote("");
      fetchNotes(AUTH_ENABLED ? user.id : FALLBACK_USER_ID);
    }

    setLoading(false);
  }

  async function deleteNote(id) {
    if (!user) {
      return;
    }

    setLoading(true);
    setError("");

    if (!supabase) {
      setError("Supabase client is not initialized. Cannot delete note.");
      setLoading(false);
      return;
    }

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
    if (!supabase) {
      setError("Supabase client is not initialized. Cannot start Google sign-in.");
      return;
    }

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
            {AUTH_ENABLED ? "Notes by Google sign-in" : "Notes (authentication disabled)"}
          </h1>
          <p className="mt-3 text-slate-600">
            {AUTH_ENABLED
              ? "Sign in with Google to manage your personal notes."
              : "Authentication is disabled — notes are shared for this deployment."}
          </p>
        </header>

        {error ? (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {!user && AUTH_ENABLED ? (
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
        ) : user ? (
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
