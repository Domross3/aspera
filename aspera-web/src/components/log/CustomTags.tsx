"use client";
import { useState, KeyboardEvent } from "react";

const PRESET_TAGS = ["Cold Shower", "Sunlight", "Meditation", "Journaling", "No Phone AM", "Social", "Alcohol", "Poor Sleep", "Nap"];

interface CustomTagsProps {
  tags: string[];
  onChange: (tags: string[]) => void;
}

export function CustomTags({ tags, onChange }: CustomTagsProps) {
  const [draft, setDraft] = useState("");

  const toggle = (tag: string) => {
    onChange(tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag]);
  };

  const addCustom = () => {
    const trimmed = draft.trim();
    if (!trimmed || tags.includes(trimmed)) return;
    onChange([...tags, trimmed]);
    setDraft("");
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") { e.preventDefault(); addCustom(); }
  };

  const customTags = tags.filter((t) => !PRESET_TAGS.includes(t));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {PRESET_TAGS.map((tag) => {
          const active = tags.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              onClick={() => toggle(tag)}
              className={`px-3 py-1.5 rounded-pill text-sm font-medium transition-all duration-150 ${
                active
                  ? "bg-accent text-white shadow-glow-sm"
                  : "bg-elevated text-text-secondary border border-border hover:border-border-accent hover:text-text"
              }`}
            >
              {tag}
            </button>
          );
        })}
        {customTags.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-pill text-sm font-medium bg-accent text-white">
            {tag}
            <button type="button" onClick={() => toggle(tag)} className="hover:text-white/70 ml-1">×</button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Custom tag…"
          className="flex-1 bg-elevated border border-border rounded-md px-3 py-2 text-sm text-text placeholder-text-muted focus:outline-none focus:border-accent transition-colors"
        />
        <button
          type="button"
          onClick={addCustom}
          disabled={!draft.trim()}
          className="px-3 py-2 rounded-md bg-elevated border border-border text-text-secondary text-sm hover:border-accent hover:text-accent disabled:opacity-40 transition-colors"
        >
          + Add
        </button>
      </div>
    </div>
  );
}
