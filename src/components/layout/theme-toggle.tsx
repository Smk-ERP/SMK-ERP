"use client";

import { useState, useRef, useEffect } from "react";
import { Sun, Moon, Monitor, Check } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { theme, resolved, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const Icon = resolved === "dark" ? Moon : Sun;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="h-10 w-10 rounded-lg border hover:bg-accent flex items-center justify-center transition-colors"
        aria-label="Theme"
        title="Toggle theme"
      >
        <Icon className="h-5 w-5" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-popover text-popover-foreground rounded-lg border shadow-lg z-40 overflow-hidden">
          <Item icon={<Sun className="h-4 w-4" />} label="Light" active={theme === "light"} onClick={() => { setTheme("light"); setOpen(false); }} />
          <Item icon={<Moon className="h-4 w-4" />} label="Dark" active={theme === "dark"} onClick={() => { setTheme("dark"); setOpen(false); }} />
          <Item icon={<Monitor className="h-4 w-4" />} label="System" active={theme === "system"} onClick={() => { setTheme("system"); setOpen(false); }} />
        </div>
      )}
    </div>
  );
}

function Item({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors",
        active && "font-medium"
      )}
    >
      {icon}
      <span className="flex-1 text-left">{label}</span>
      {active && <Check className="h-4 w-4 text-cyan-600" />}
    </button>
  );
}
