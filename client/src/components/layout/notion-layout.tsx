import type { ReactNode } from "react";
import Sidebar from "./sidebar";

interface NotionLayoutProps {
  children: ReactNode;
}

export default function NotionLayout({ children }: NotionLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-background">
        {children}
      </main>
    </div>
  );
}
