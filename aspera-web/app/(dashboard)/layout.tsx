"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/log", label: "Log", icon: "📝" },
  { href: "/today", label: "Today", icon: "⚡" },
  { href: "/search", label: "Search", icon: "🔍" },
  { href: "/insights", label: "Insights", icon: "🧠" },
  { href: "/mood", label: "Mood", icon: "🌊" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar — desktop */}
      <aside className="hidden md:flex flex-col w-56 bg-surface border-r border-border flex-shrink-0">
        {/* Logo */}
        <div className="px-5 py-6 border-b border-border">
          <div className="text-xl font-black tracking-tight bg-gradient-focus bg-clip-text text-transparent">
            Aspera
          </div>
          <div className="text-xs text-text-muted mt-0.5">
            Personal Performance
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-accent/15 text-accent border border-accent/20"
                    : "text-text-secondary hover:text-text hover:bg-elevated"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-5 py-4 border-t border-border">
          <div className="text-xs text-text-muted">Local-first · Private</div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {children}

        {/* Bottom nav — mobile */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-border z-50">
          <div className="flex">
            {NAV_ITEMS.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex-1 flex flex-col items-center py-2.5 gap-0.5 text-xs font-medium transition-colors ${
                    isActive ? "text-accent" : "text-text-muted"
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </main>
    </div>
  );
}
