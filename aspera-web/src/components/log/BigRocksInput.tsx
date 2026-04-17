"use client";
import { useState, KeyboardEvent } from "react";

interface BigRocksInputProps {
  value: string[];
  onChange: (v: string[]) => void;
}

export function BigRocksInput({ value, onChange }: BigRocksInputProps) {
  const [draft, setDraft] = useState("");

  const add = () => {
    const trimmed = draft.trim();
    if (!trimmed || value.length >= 3) return;
    onChange([...value, trimmed]);
    setDraft("");
  };

  const remove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") { e.preventDefault(); add(); }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2">
        {value.map((rock, i) => (
          <div key={i} className="flex items-center gap-2 bg-elevated rounded-md px-3 py-2 border border-border group">
            <span className="text-accent text-sm font-bold w-4">{i + 1}.</span>
            <span className="flex-1 text-sm text-text">{rock}</span>
            <button
              type="button"
              onClick={() => remove(i)}
              className="text-text-muted hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity text-lg leading-none"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      {value.length < 3 && (
        <div className="flex gap-2">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKey}
            placeholder={value.length === 0 ? "Most important task today…" : "Add another…"}
            className="flex-1 bg-elevated border border-border rounded-md px-3 py-2 text-sm text-text placeholder-text-muted focus:outline-none focus:border-accent transition-colors"
          />
          <button
            type="button"
            onClick={add}
            disabled={!draft.trim()}
            className="px-4 py-2 rounded-md bg-accent/20 text-accent border border-accent/30 text-sm font-medium hover:bg-accent/30 disabled:opacity-40 transition-colors"
          >
            Add
          </button>
        </div>
      )}
      <p className="text-xs text-text-muted">{value.length}/3 big rocks</p>
    </div>
  );
}
