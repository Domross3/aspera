"use client";
import { MusicGenre } from "../../types";
import { ChipGroup } from "../ui/ChipGroup";

const MUSIC_OPTIONS: MusicGenre[] = [
  "none",
  "lofi",
  "classical",
  "hiphop",
  "edm",
  "rock",
  "ambient",
  "jazz",
  "podcast",
];

interface MusicChipsProps {
  selected: MusicGenre[];
  onChange: (selected: MusicGenre[]) => void;
}

export function MusicChips({ selected, onChange }: MusicChipsProps) {
  return (
    <ChipGroup
      options={MUSIC_OPTIONS}
      selected={selected}
      onChange={(s) => onChange(s as MusicGenre[])}
      multi={true}
    />
  );
}
