import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import apiClient from "@/api/client";

interface SharedNote {
  id: string;
  title: string;
  content: string;
  color: string;
}

export default function SharedStickyNotes() {
  const { nanoid } = useParams<{ nanoid: string }>();
  const [note, setNote] = useState<SharedNote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!nanoid) return;
    setLoading(true);
    apiClient
      .get(`/sticky-notes/share/${nanoid}`)
      .then((res) => {
        const doc = res.data.data;
        setNote({
          id: doc._id,
          title: doc.title || "",
          content: doc.content || "",
          color: doc.color || "#ffffff",
        });
      })
      .catch(() => setError("Note not found or unavailable"))
      .finally(() => setLoading(false));
  }, [nanoid]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-6">
        <AlertCircle size={40} className="text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">{error || "Note not found"}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-8 py-16">
        <article
          className="rounded-xl p-8 shadow-sm"
          style={{ backgroundColor: note.color === "#ffffff" ? undefined : note.color }}
        >
          {note.title && (
            <h1 className="mb-6 text-3xl font-bold leading-tight text-foreground">
              {note.title}
            </h1>
          )}
          {note.content ? (
            <div
              className="prose prose-sm max-w-none text-foreground/85 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:mb-1 [&_p]:mb-2 [&_pre]:rounded-lg [&_pre]:bg-neutral-900 [&_pre]:p-4 [&_pre]:text-sm [&_pre]:overflow-x-auto [&_pre_code]:bg-transparent [&_pre_code]:p-0"
              dangerouslySetInnerHTML={{ __html: note.content }}
            />
          ) : (
            <p className="text-sm text-muted-foreground/60 italic">No content</p>
          )}
        </article>
      </div>
    </div>
  );
}
