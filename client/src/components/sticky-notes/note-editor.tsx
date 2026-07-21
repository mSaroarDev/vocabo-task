import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Trash2, Share2, Copy, Check, Bold, Italic, Underline, Heading1, Heading2, List, ListOrdered, Code, SmilePlus } from "lucide-react";
import { useStickyNotes } from "@/hooks/useStickyNotes";
import { useCallback, useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import UnderlineExt from "@tiptap/extension-underline";
import { cn } from "@/lib/utils";
import apiClient from "@/api/client";

const EMOJIS = [
  "😀","😊","😂","🤔","😎","🙌","👍","👎","💡","🎉","🔥","⭐",
  "❤️","💯","✅","❌","📝","🎯","🚀","💪","🤝","🧠","👀","💻",
  "📁","📂","📌","🎨","🌈","🍕","☕","🏆","⚡","💎","🔧","📊",
];

function ToolbarButton({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent",
        active && "bg-accent text-foreground"
      )}
    >
      {children}
    </button>
  );
}

function EmojiPicker({
  onSelect,
  onClose,
}: {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}) {
  return (
    <>
      <div className="fixed inset-0 z-30" onClick={onClose} />
      <div className="absolute top-full left-0 z-40 mt-1 w-[240px] rounded-lg border border-border bg-popover p-2 shadow-lg">
        <div className="grid grid-cols-8 gap-0.5">
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                onSelect(emoji);
                onClose();
              }}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded text-lg transition-colors hover:bg-accent"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

function EditorToolbar({ editor }: { editor: NonNullable<ReturnType<typeof useEditor>> }) {
  const [emojiOpen, setEmojiOpen] = useState(false);

  return (
    <div className="relative flex items-center gap-0.5 rounded-lg border border-border bg-card p-1 shadow-sm">
      <ToolbarButton
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold size={14} />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic size={14} />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <Underline size={14} />
      </ToolbarButton>
      <span className="mx-1 h-5 w-px bg-border" />
      <ToolbarButton
        active={editor.isActive("heading", { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        <Heading1 size={14} />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 size={14} />
      </ToolbarButton>
      <span className="mx-1 h-5 w-px bg-border" />
      <ToolbarButton
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List size={14} />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered size={14} />
      </ToolbarButton>
      <span className="mx-1 h-5 w-px bg-border" />
      <ToolbarButton
        active={editor.isActive("codeBlock")}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      >
        <Code size={14} />
      </ToolbarButton>
      <div className="relative">
        <ToolbarButton
          active={emojiOpen}
          onClick={() => setEmojiOpen(!emojiOpen)}
        >
          <SmilePlus size={14} />
        </ToolbarButton>
        {emojiOpen && (
          <EmojiPicker
            onSelect={(emoji) => {
              editor.chain().focus().insertContent(emoji).run();
            }}
            onClose={() => setEmojiOpen(false)}
          />
        )}
      </div>
    </div>
  );
}

export default function NoteEditor() {
  const { noteId } = useParams<{ noteId: string }>();
  const navigate = useNavigate();
  const { notes, editNote, removeNote, getGroupById } = useStickyNotes();

  const note = notes.find((n) => n.id === noteId);
  const group = note ? getGroupById(note.groupId) : undefined;

  const titleRef = useRef<HTMLTextAreaElement>(null);

  const [title, setTitle] = useState(note?.title ?? "");
  const [saveTimer, setSaveTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [shareCopied, setShareCopied] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);

  const editor = useEditor({
    extensions: [StarterKit, UnderlineExt],
    content: note?.content || "",
    onBlur: ({ editor }) => {
      const html = editor.getHTML();
      if (note) editNote(note.id, title, html);
    },
    onUpdate: ({ editor }) => {
      if (saveTimer) clearTimeout(saveTimer);
      const timer = setTimeout(() => {
        if (note) editNote(note.id, title, editor.getHTML());
      }, 800);
      setSaveTimer(timer);
    },
    editorProps: {
      attributes: {
        class: "focus:outline-none min-h-[60vh] text-foreground/85 text-base leading-7 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:mb-1 [&_p]:mb-2 [&_p:empty]:mb-0 [&_pre]:rounded-lg [&_pre]:bg-neutral-900 [&_pre]:p-4 [&_pre]:text-sm [&_pre]:leading-relaxed [&_pre]:overflow-x-auto [&_pre]:border-l-2 [&_pre]:border-neutral-600 [&_pre_code]:bg-transparent [&_pre_code]:p-0",
      },
    },
  });

  useEffect(() => {
    return () => {
      if (saveTimer) clearTimeout(saveTimer);
    };
  }, [saveTimer]);

  useEffect(() => {
    if (note && editor) {
      setTitle(note.title);
      if (editor.getHTML() !== note.content) {
        editor.commands.setContent(note.content || "", { emitUpdate: false });
      }
    }
  }, [note?.id]);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  const handleTitleSave = useCallback(() => {
    if (note) {
      const html = editor?.getHTML() || note.content;
      editNote(note.id, title, html);
    }
  }, [note, title, editor, editNote]);

  if (!note) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">Note not found</p>
      </div>
    );
  }

  const backPath = group
    ? `/sticky-notes?group=${group.id}`
    : "/sticky-notes";

  const handleDelete = () => {
    removeNote(note.id);
    navigate(backPath, { replace: true });
  };

  const handleShare = async () => {
    if (!note) return;
    if (note.nanoid) {
      setShareLink(`${window.location.origin}/sticky-notes/shared/${note.nanoid}`);
      setShareOpen(true);
      return;
    }
    setShareLoading(true);
    try {
      const res = await apiClient.post(`/sticky-notes/notes/${note.id}/share`);
      const nanoid = res.data.data.nanoid;
      setShareLink(`${window.location.origin}/sticky-notes/shared/${nanoid}`);
      setShareOpen(true);
    } catch {
      setShareLink("");
    } finally {
      setShareLoading(false);
    }
  };

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch {
      //
    }
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <style>{`.note-editor code { font-family: 'Operator Mono', 'Fira Code', monospace !important; }`}</style>
      <div className="flex items-center justify-between px-8 py-3">
        <button
          onClick={() => navigate(backPath)}
          className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft size={14} />
          Back to notes
        </button>
        <div className="relative flex items-center gap-2">
          <button
            onClick={handleShare}
            disabled={shareLoading}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <Share2 size={13} />
            Share
          </button>
          <button
            onClick={handleDelete}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-red-400"
          >
            <Trash2 size={13} />
            Delete
          </button>

          {shareOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShareOpen(false)} />
              <div className="absolute right-0 top-full z-40 mt-1.5 w-80 rounded-xl border border-border bg-popover p-4 shadow-lg">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">Share this note</h3>
                  <button
                    onClick={() => setShareOpen(false)}
                    className="flex h-5 w-5 cursor-pointer items-center justify-center rounded text-muted-foreground hover:bg-accent"
                  >
                    <span className="text-xs">&times;</span>
                  </button>
                </div>
                <label className="mb-1 block text-xs text-muted-foreground">Share link</label>
                <div className="flex items-center gap-1.5">
                  <input
                    readOnly
                    value={shareLink}
                    className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground outline-none"
                  />
                  <button
                    onClick={copyShareLink}
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                    {shareCopied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1080px] px-8 pb-24 pt-8">
        <textarea
          ref={titleRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleTitleSave}
          placeholder="Untitled"
          rows={1}
          className="w-full resize-none border-0 bg-transparent p-0 text-4xl font-bold leading-tight text-foreground placeholder:text-muted-foreground/20 outline-none"
        />
        <div className="mt-4">
          {editor && <EditorToolbar editor={editor} />}
        </div>
        <div className="mt-6 note-editor">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
}
