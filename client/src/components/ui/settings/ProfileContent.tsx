import { Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import type { User } from "./types";
import { getUserInitials } from "./utils";

interface ProfileContentProps {
  user: User | null;
}

export default function ProfileContent({ user }: ProfileContentProps) {
  const initials = user ? getUserInitials(user.name) : "U";
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "";

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-[28px] font-bold text-white">Profile</h1>
        <p className="mt-1 text-sm text-[#9B9B9B]">
          Manage your personal information and preferences
        </p>
      </div>

      <div className="mb-8 flex items-center gap-6">
        <div className="relative">
          <div
            className={cn(
              "flex h-20 w-20 items-center justify-center rounded-full text-2xl font-medium overflow-hidden",
              user?.avatar ? "" : "bg-[#333] text-white"
            )}
          >
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <button
            type="button"
            className="absolute bottom-0 right-0 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-[#3b3b3b] bg-[#252525] text-[#858585] transition-colors hover:text-white"
          >
            <Camera size={13} />
          </button>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">{user?.name || "Guest"}</h2>
          <p className="text-sm text-[#858585]">{user?.email || ""}</p>
          {memberSince && <p className="text-xs text-[#666]">Member since {memberSince}</p>}
        </div>
      </div>

      <div className="mb-8 rounded-md border border-[#2F2F2F] p-5">
        <h2 className="mb-4 text-sm font-medium text-white">Personal Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs text-[#858585]">Full name</label>
            <input
              defaultValue={user?.name || ""}
              className="w-full rounded-md border border-[#333] bg-[#252525] px-3 py-2 text-sm text-white outline-none transition-colors focus:border-[#555]"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-[#858585]">Email</label>
            <input
              defaultValue={user?.email || ""}
              className="w-full rounded-md border border-[#333] bg-[#252525] px-3 py-2 text-sm text-white outline-none transition-colors focus:border-[#555]"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-[#858585]">Phone</label>
            <input
              defaultValue={user?.phone || ""}
              className="w-full rounded-md border border-[#333] bg-[#252525] px-3 py-2 text-sm text-white outline-none transition-colors focus:border-[#555]"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-[#858585]">Location</label>
            <input
              defaultValue=""
              className="w-full rounded-md border border-[#333] bg-[#252525] px-3 py-2 text-sm text-white outline-none transition-colors focus:border-[#555]"
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            className="cursor-pointer rounded-md bg-[#2383E2] px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#1a6bbf]"
          >
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}
