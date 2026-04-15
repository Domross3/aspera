import React from "react";
import { View, Text, StyleSheet } from "react-native";
import GradientCard from "../common/GradientCard";
import SectionLabel from "../common/SectionLabel";
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from "../../constants/theme";
import { SPOTIFY_TRACKS, SpotifyTrack } from "../../lib/mockData";

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function TrackRow({ track }: { track: SpotifyTrack }) {
  return (
    <View style={styles.trackRow}>
      <View style={styles.albumArt}>
        <Text style={styles.albumEmoji}>
          {track.artist.includes("Nirvana")
            ? "🎸"
            : track.artist.includes("Alice")
              ? "⛓️"
              : track.artist.includes("Chili")
                ? "🌶️"
                : track.artist.includes("Soundgarden")
                  ? "☀️"
                  : track.artist.includes("Satie")
                    ? "🎹"
                    : "🎵"}
        </Text>
      </View>
      <View style={styles.trackInfo}>
        <Text style={styles.trackName} numberOfLines={1}>
          {track.name}
        </Text>
        <Text style={styles.trackArtist} numberOfLines={1}>
          {track.artist}
        </Text>
      </View>
      <Text style={styles.trackTime}>{formatTime(track.played_at)}</Text>
    </View>
  );
}

export default function SpotifyRecent() {
  const todayTracks = SPOTIFY_TRACKS.filter((t) => {
    const played = new Date(t.played_at).toISOString().split("T")[0];
    const today = new Date().toISOString().split("T")[0];
    return played === today;
  });

  const displayTracks =
    todayTracks.length > 0 ? todayTracks : SPOTIFY_TRACKS.slice(0, 4);

  return (
    <View>
      <SectionLabel label="Recently Played" />
      <GradientCard>
        <View style={styles.header}>
          <Text style={styles.spotifyIcon}>🟢</Text>
          <Text style={styles.headerText}>Spotify</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>MOCK</Text>
          </View>
        </View>
        {displayTracks.map((track, i) => (
          <TrackRow key={`${track.name}-${i}`} track={track} />
        ))}
      </GradientCard>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.md,
    gap: SPACING.xs,
  },
  spotifyIcon: { fontSize: 14 },
  headerText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    flex: 1,
  } as object,
  badge: {
    backgroundColor: "rgba(108,99,255,0.2)",
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
  },
  badgeText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.accent,
    fontSize: 9,
  } as object,
  trackRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.xs + 2,
    gap: SPACING.sm,
  },
  albumArt: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  albumEmoji: { fontSize: 16 },
  trackInfo: {
    flex: 1,
  },
  trackName: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "600",
  } as object,
  trackArtist: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    fontSize: 11,
  } as object,
  trackTime: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    fontSize: 10,
  } as object,
});
