import { useNavigate, Navigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  BarChart3,
  GripVertical,
  Moon,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const features = [
  {
    icon: LayoutDashboard,
    title: "Task Management",
    description: "Create, organize, and track tasks with an intuitive board interface. Drag and drop to prioritize.",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description: "Invite team members, assign tasks, and collaborate in real-time with shared workspaces.",
  },
  {
    icon: BarChart3,
    title: "Analytics & Reports",
    description: "Track progress with visual charts and detailed reports. Know exactly where your team stands.",
  },
  {
    icon: GripVertical,
    title: "Drag & Drop",
    description: "Intuitive drag-and-drop interface makes organizing tasks as natural as moving cards on a table.",
  },
  {
    icon: Moon,
    title: "Dark Mode",
    description: "Easy on the eyes with a beautiful dark theme. Work comfortably day or night.",
  },
];

const steps = [
  { step: 1, title: "Create Your Workspace", description: "Set up your project workspace in seconds. Invite your team and define your workflow." },
  { step: 2, title: "Add & Organize Tasks", description: "Create tasks, set deadlines, assign members, and organize with labels and priorities." },
  { step: 3, title: "Track & Ship", description: "Monitor progress with live updates, move tasks through stages, and celebrate completions." },
];

export default function Landing() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e5e5e5]">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] bg-[#0a0a0a]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md border border-white/[0.15] text-xs font-bold text-white">V</div>
            <span className="text-sm font-semibold">ocabo</span>
          </div>
          <div className="hidden items-center gap-6 sm:flex">
            <a href="#features" className="text-sm text-[#a1a1a1] transition-colors hover:text-white">Features</a>
            <a href="#how-it-works" className="text-sm text-[#a1a1a1] transition-colors hover:text-white">How it Works</a>
            <button onClick={() => navigate("/login")} className="rounded-md border border-white/[0.15] px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white hover:text-black cursor-pointer">Get Started</button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center px-4 pt-32 pb-20">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-5xl font-bold leading-tight tracking-tight text-white sm:text-6xl lg:text-7xl">
            Manage Your Tasks<br />with Ease
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base text-[#a1a1a1] leading-relaxed">
            A modern task management platform for teams and individuals. Organize, prioritize, and ship work faster than ever.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <button onClick={() => navigate("/login")} className="flex items-center gap-2 rounded-md border border-white/[0.15] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white hover:text-black cursor-pointer">
              Get Started Free <ArrowRight size={16} />
            </button>
            <a href="#features" className="rounded-md border border-white/[0.08] px-6 py-2.5 text-sm font-medium text-[#a1a1a1] transition-colors hover:border-white/[0.15] hover:text-white">Learn More</a>
          </div>

          {/* Dashboard mockup */}
          <div className="mt-16 mx-auto max-w-4xl rounded-xl border border-white/[0.08] bg-[#121212] overflow-hidden">
            <div className="flex items-center gap-1.5 border-b border-white/[0.06] px-4 py-2.5">
              <div className="h-2.5 w-2.5 rounded-full bg-white/[0.2]" />
              <div className="h-2.5 w-2.5 rounded-full bg-white/[0.2]" />
              <div className="h-2.5 w-2.5 rounded-full bg-white/[0.2]" />
              <span className="ml-3 text-xs text-[#666]">Vocabo Dashboard</span>
            </div>
            <div className="flex">
              <div className="hidden w-48 border-r border-white/[0.06] p-3 sm:block">
                <div className="mb-3 h-6 rounded bg-white/[0.04]" />
                <div className="mb-2 h-4 rounded bg-white/[0.04]" />
                <div className="mb-2 h-4 rounded bg-white/[0.04]" />
                <div className="mb-2 h-4 rounded bg-white/[0.04]" />
              </div>
              <div className="flex-1 p-4">
                <div className="mb-3 h-6 w-1/3 rounded bg-white/[0.04]" />
                <div className="mb-2 h-4 rounded bg-white/[0.04]" />
                <div className="mb-2 h-4 w-3/4 rounded bg-white/[0.04]" />
                <div className="mb-2 h-4 w-1/2 rounded bg-white/[0.04]" />
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div className="h-16 rounded bg-white/[0.04]" />
                  <div className="h-16 rounded bg-white/[0.04]" />
                  <div className="h-16 rounded bg-white/[0.04]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-4 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Everything you need to ship faster
            </h2>
            <p className="mt-3 text-[#a1a1a1]">Powerful features to keep your team organized and productive.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="group rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 transition-all hover:border-white/[0.15] hover:bg-white/[0.04]">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] group-hover:border-white/[0.15]">
                  <f.icon size={18} className="text-[#a1a1a1] group-hover:text-white" />
                </div>
                <h3 className="text-sm font-medium text-white">{f.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-[#666]">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="px-4 py-24">
        <div className="mx-auto max-w-4xl">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">How it works</h2>
            <p className="mt-3 text-[#a1a1a1]">Get started in three simple steps.</p>
          </div>
          <div className="relative grid gap-8 sm:grid-cols-3">
            <div className="absolute left-[16px] top-12 hidden h-[calc(100%-3rem)] w-px bg-white/[0.08] sm:left-1/2 sm:block" />
            {steps.map((s) => (
              <div key={s.step} className="relative flex flex-col items-center text-center">
                <div className="relative z-10 mb-4 flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.15] text-xs font-bold text-white">{s.step}</div>
                <h3 className="text-sm font-medium text-white">{s.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-[#666]">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-24">
        <div className="mx-auto max-w-3xl rounded-2xl border border-white/[0.06] bg-white/[0.02] p-12 text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">Ready to get started?</h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-[#a1a1a1]">
            Join thousands of teams already using Vocabo to manage their tasks and ship work faster.
          </p>
          <button onClick={() => navigate("/login")} className="mt-8 inline-flex items-center gap-2 rounded-md border border-white/[0.15] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white hover:text-black cursor-pointer">
            Get Started Free <ArrowRight size={16} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] px-4 py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md border border-white/[0.15] text-[10px] font-bold text-white">V</div>
            <span className="text-xs text-[#666]">ocabo</span>
          </div>
          <p className="text-xs text-[#555]">&copy; {new Date().getFullYear()} Vocabo. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
