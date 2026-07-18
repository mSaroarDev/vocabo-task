import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Plus, StickyNote } from "lucide-react";
import { useStickyNotes } from "@/hooks/useStickyNotes";
import StickyNoteCard from "@/components/sticky-notes/sticky-note-card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function StickyNotes() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const groupId = searchParams.get("group");
  const {
    groups,
    getGroupById,
    getNotesByGroup,
    createNote,
    removeNote,
    togglePin,
    changeNoteColor,
  } = useStickyNotes();

  const group = groupId ? getGroupById(groupId) : undefined;

  const [titleDialogOpen, setTitleDialogOpen] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState("");

  const notes = groupId ? getNotesByGroup(groupId) : [];

  const openAddDialog = () => {
    setNewNoteTitle("");
    setTitleDialogOpen(true);
  };

  const handleCreate = () => {
    const title = newNoteTitle.trim();
    if (!title || !groupId) return;
    const id = createNote(groupId, title, "");
    setTitleDialogOpen(false);
    setNewNoteTitle("");
    navigate(`/sticky-notes/note/${id}`);
  };

  const openEditor = (noteId: string) => {
    navigate(`/sticky-notes/note/${noteId}`);
  };

  if (!groupId || !group) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 py-12">
        <StickyNote size={48} className="text-muted-foreground/40 mb-4" />
        <h2 className="text-lg font-semibold text-foreground mb-2">Sticky Notes</h2>
        <p className="text-sm text-muted-foreground mb-6">Select a group from the sidebar or create one</p>
        <div className="flex flex-wrap gap-2 justify-center">
          {groups.length === 0 && (
            <p className="text-xs text-muted-foreground">No groups yet. Add one in the sidebar.</p>
          )}
          {groups.map((g) => (
            <button
              key={g.id}
              onClick={() => navigate(`/sticky-notes?group=${g.id}`)}
              className="rounded-lg border border-border/50 bg-card px-4 py-2 text-sm text-foreground transition-colors hover:bg-accent cursor-pointer"
            >
              {g.name}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto px-6 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{group.name}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {notes.length} {notes.length === 1 ? "note" : "notes"}
          </p>
        </div>
      </div>

      {notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <StickyNote size={40} className="text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground mb-4">No notes yet</p>
          <button
            onClick={openAddDialog}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus size={15} />
            Add note
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {notes.map((note) => (
            <StickyNoteCard
              key={note.id}
              note={note}
              onClick={openEditor}
              onDelete={removeNote}
              onTogglePin={togglePin}
              onChangeColor={changeNoteColor}
            />
          ))}

          <button
            onClick={openAddDialog}
            className="flex min-h-[100px] cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border/50 text-sm text-muted-foreground transition-colors hover:border-border hover:text-foreground hover:bg-accent/30"
          >
            <Plus size={18} />
            Add note
          </button>
        </div>
      )}

      <Dialog open={titleDialogOpen} onOpenChange={setTitleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New note</DialogTitle>
          </DialogHeader>
          <div className="mt-2">
            <input
              value={newNoteTitle}
              onChange={(e) => setNewNoteTitle(e.target.value)}
              placeholder="Note title"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleCreate();
                }
                if (e.key === "Escape") setTitleDialogOpen(false);
              }}
              className="w-full rounded-lg border border-[#3b3b3b] bg-[#2b2b2b] px-3 py-2 text-sm text-[#e5e5e5] placeholder:text-[#666] outline-none transition-colors focus:border-[#5b5b5b]"
            />
          </div>
          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              onClick={() => setTitleDialogOpen(false)}
              className="cursor-pointer rounded-lg px-4 py-1.5 text-sm font-medium text-[#a1a1a1] transition-colors hover:bg-[#2b2b2b] hover:text-[#e5e5e5]"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              className="cursor-pointer rounded-lg bg-[#e5e5e5] px-4 py-1.5 text-sm font-medium text-[#1e1e1e] transition-colors hover:bg-white"
            >
              Create
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
