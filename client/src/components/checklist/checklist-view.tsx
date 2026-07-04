import { useState } from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Circle, CheckCircle2, Plus, Trash2, Pen } from "lucide-react";
import { useChecklist, type ChecklistGroup } from "@/hooks/useChecklist";

interface ChecklistViewProps {
  group: ChecklistGroup;
}

function ChecklistItemRow({
  groupId,
  item,
}: {
  groupId: string;
  item: { id: string; title: string; checked: boolean; order: number };
}) {
  const { toggleItem, deleteItem, editItem } = useChecklist();
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(item.title);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-white/[0.03] ${
        isDragging ? "z-30 opacity-70" : ""
      }`}
    >
      <span
        {...attributes}
        {...listeners}
        className="flex h-5 w-4 cursor-grab items-center justify-center text-muted-foreground/30 opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
      >
        <GripVertical size={13} />
      </span>

      <button
        onClick={() => toggleItem(groupId, item.id)}
        className="flex shrink-0 cursor-pointer items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
      >
        {item.checked ? (
          <CheckCircle2 size={18} className="text-green-500" />
        ) : (
          <Circle size={18} />
        )}
      </button>

      {editing ? (
        <input
          autoFocus
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={() => {
            if (editValue.trim() && editValue.trim() !== item.title) {
              editItem(groupId, item.id, editValue);
            }
            setEditing(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              if (editValue.trim() && editValue.trim() !== item.title) {
                editItem(groupId, item.id, editValue);
              }
              setEditing(false);
            }
            if (e.key === "Escape") {
              setEditValue(item.title);
              setEditing(false);
            }
          }}
          className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none"
        />
      ) : (
        <span
          className={`min-w-0 flex-1 cursor-text text-sm ${
            item.checked
              ? "text-muted-foreground line-through"
              : "text-foreground"
          }`}
          onClick={() => {
            setEditValue(item.title);
            setEditing(true);
          }}
        >
          {item.title}
        </span>
      )}

      <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          onClick={() => {
            setEditValue(item.title);
            setEditing(true);
          }}
          className="flex h-6 w-6 cursor-pointer items-center justify-center rounded text-muted-foreground hover:bg-white/[0.06] hover:text-foreground"
        >
          <Pen size={12} />
        </button>
        <button
          onClick={() => deleteItem(groupId, item.id)}
          className="flex h-6 w-6 cursor-pointer items-center justify-center rounded text-muted-foreground hover:bg-white/[0.06] hover:text-red-400"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}

export default function ChecklistView({ group }: ChecklistViewProps) {
  const { renameGroup, addItem, reorderItems } = useChecklist();
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(group.title);
  const [newItemValue, setNewItemValue] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const items = group.items;
    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(items, oldIndex, newIndex);
    reorderItems(
      group.id,
      reordered.map((i) => i.id),
    );
  };

  const handleAddItem = () => {
    if (!newItemValue.trim()) return;
    addItem(group.id, newItemValue.trim());
    setNewItemValue("");
  };

  const handleSaveTitle = () => {
    if (titleValue.trim() && titleValue.trim() !== group.title) {
      renameGroup(group.id, titleValue.trim());
    }
    setEditingTitle(false);
  };

  return (
    <div className="px-12 py-8">
      <div className="mb-1 text-xs text-muted-foreground">
        Personal Checklist
      </div>

      <div className="mb-8">
        {editingTitle ? (
          <input
            autoFocus
            value={titleValue}
            onChange={(e) => setTitleValue(e.target.value)}
            onBlur={handleSaveTitle}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSaveTitle();
              if (e.key === "Escape") {
                setTitleValue(group.title);
                setEditingTitle(false);
              }
            }}
            className="text-3xl font-bold text-foreground bg-transparent outline-none border-b-2 border-foreground/20 focus:border-foreground/50 w-full"
          />
        ) : (
          <h1
            className="text-3xl font-bold text-foreground cursor-pointer"
            onClick={() => {
              setTitleValue(group.title);
              setEditingTitle(true);
            }}
          >
            {group.title}
          </h1>
        )}
      </div>

      {group.items.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={group.items.map((i) => i.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <ChecklistItemRow key={item.id} groupId={group.id} item={item} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <p className="text-sm text-muted-foreground py-2">No items yet</p>
      )}

      <div className="flex items-center gap-2 mt-3 px-2">
        <Plus size={14} className="text-muted-foreground shrink-0" />
        <input
          value={newItemValue}
          onChange={(e) => setNewItemValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAddItem();
          }}
          placeholder="Add an item..."
          className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/50"
        />
      </div>
    </div>
  );
}
