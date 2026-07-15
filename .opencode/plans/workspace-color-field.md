# Add `color` field to Workspace

## Files to change

### 1. Server — `workspace.interface.ts`

Add `color: string;` after `icon`:
```ts
export interface IWorkspace {
  name: string;
  icon: string;
  color: string;
  order: number;
  team: Types.ObjectId;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
```

### 2. Server — `workspace.model.ts`

Add `color` field after `icon` with default `"#6b7280"`:
```ts
color: {
  type: String,
  default: "#6b7280",
  trim: true,
},
```

### 3. Server — `workspace.validator.ts`

Add `color` as optional string to both validators:
```ts
const createWorkspaceValidator = z.object({
  name: workspaceName,
  icon: z.string().trim().max(40, "Workspace icon is too long").optional(),
  color: z.string().trim().max(7, "Workspace color is too long").optional(),
});

const updateWorkspaceValidator = z.object({
  name: workspaceName.optional(),
  icon: z.string().trim().max(40, "Workspace icon is too long").optional(),
  color: z.string().trim().max(7, "Workspace color is too long").optional(),
});
```

### 4. Server — `workspace.services.ts`

Update `createWorkspace` payload type and usage:
```ts
payload: { name: string; icon?: string; color?: string }
// in creation:
color: payload.color?.trim() || "#6b7280",
```

Update `updateWorkspace` payload type and usage:
```ts
payload: { name?: string; icon?: string; color?: string }
// in updatePayload:
...(payload.color ? { color: payload.color.trim() } : {}),
```

### 5. Client — `workspace-icons.tsx`

Replace `workspaceIconOptions` with reduced set:
```tsx
import {
  Bug,
  Briefcase,
  Code2,
  Folder,
  Lightbulb,
  Megaphone,
  Settings,
  Sparkles,
  TriangleAlert,
  Volume2,
  type LucideIcon,
} from "lucide-react";

export const workspaceIconOptions: WorkspaceIconOption[] = [
  { name: "bug", label: "Bugs", Icon: Bug },
  { name: "megaphone", label: "Marketing", Icon: Megaphone },
  { name: "speaker", label: "Mega Speaker", Icon: Volume2 },
  { name: "sparkles", label: "New", Icon: Sparkles },
  { name: "settings", label: "Settings", Icon: Settings },
  { name: "lightbulb", label: "Idea Bulb", Icon: Lightbulb },
  { name: "code", label: "Code", Icon: Code2 },
  { name: "alert-triangle", label: "Error", Icon: TriangleAlert },
  { name: "briefcase", label: "Business", Icon: Briefcase },
  { name: "folder", label: "Folder", Icon: Folder },
];
```

### 6. Client — `workspacesSlice.ts`

Update `Workspace` interface:
```ts
export interface Workspace {
  id: string;
  name: string;
  icon: string;
  color: string;
  order: number;
  teamId: string;
}
```

Update `ApiWorkspace` interface:
```ts
interface ApiWorkspace {
  _id: string;
  name: string;
  icon?: string;
  color?: string;
  order?: number;
  team: string;
}
```

Update `mapWorkspace`:
```ts
const mapWorkspace = (workspace: ApiWorkspace): Workspace => ({
  id: workspace._id,
  name: workspace.name,
  icon: workspace.icon || "briefcase",
  color: workspace.color || "#6b7280",
  order: workspace.order || 0,
  teamId: workspace.team,
});
```

Update `createWorkspace` thunk args:
```ts
{ teamId: string; name: string; icon?: string; color?: string }
```

Update `updateWorkspace` thunk args:
```ts
{ teamId: string; id: string; name: string; icon?: string; color?: string }
```

Update API calls in thunks to pass `color`.

Update `createWorkspace.pending` optimistic push to include `color`:
```ts
state.items.push({
  id: tempId,
  name: action.meta.arg.name,
  icon: action.meta.arg.icon || "briefcase",
  color: action.meta.arg.color || "#6b7280",
  order: state.items.length,
  teamId: action.meta.arg.teamId,
});
```

Update `updateWorkspace.fulfilled` to update `color`:
```ts
if (workspace && state.currentTeamId === action.payload.teamId) {
  workspace.name = action.payload.name;
  workspace.icon = action.payload.icon;
  workspace.color = action.payload.color;
}
```

### 7. Client — `workspace-modal.tsx`

- Add `initialColor` prop (default `"#6b7280"`)
- Add `color` state initialized from `initialColor`
- Add color picker row above the icon grid with circles like:
```tsx
const workspaceColors = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899",
  "#6b7280", "#1e293b",
];
```
- Each color renders as a clickable circle (`rounded-full`, `h-8 w-8`, `border-2` with selected ring)
- Update `onSave` call to include `color`
- Reduce icon grid columns to fit fewer icons (e.g., `grid-cols-5` stays fine)

### 8. Client — `sidebar.tsx`

Update `<WorkspaceModal>` usage:
- Pass `initialColor={editingWorkspace?.color || "#6b7280"}`
- Update `onSave` destructure `{ name, icon, color }`
- Update `updateWs` call: `updateWs(editingWorkspace.id, name, icon, color)`
- Update `addWs` call: `addWs(name, icon, color)`
- Store `color` in `editingWorkspace` state: `{ id: string; name: string; icon: string; color: string; }`
- Read `workspace.color` in `editWorkspace` handler

### 9. Client — `useWorkspaces` hook

Update `addWorkspace` signature:
```ts
addWorkspace: async (name: string, icon = "briefcase", color = "#6b7280") => {
  ...
  return dispatch(createWorkspaceAction({ teamId, name: cleanName, icon, color })).unwrap();
},
```

Update `updateWorkspace` signature:
```ts
updateWorkspace: async (id: string, name: string, icon?: string, color?: string) => {
  ...
  return dispatch(updateWorkspaceAction({ teamId, id, name: cleanName, icon, color })).unwrap();
},
```
