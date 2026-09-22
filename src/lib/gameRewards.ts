export const GAME_REWARD_COOLDOWN_MS = 24 * 60 * 60 * 1000;

export type GameCompletions = Record<string, string>;

export function hasActiveGameCompletion(completions: GameCompletions | undefined, gameId: string, now = Date.now()) {
  const completedAt = completions?.[gameId];
  const timestamp = completedAt ? Date.parse(completedAt) : Number.NaN;
  return Number.isFinite(timestamp) && timestamp <= now && now - timestamp < GAME_REWARD_COOLDOWN_MS;
}

export function cleanGameCompletions(value: unknown): GameCompletions {
  if (!value || typeof value !== 'object') return {};
  return Object.fromEntries(Object.entries(value as Record<string, unknown>)
    .filter(([gameId, completedAt]) => {
      const timestamp = typeof completedAt === 'string' ? Date.parse(completedAt) : Number.NaN;
      return gameId.startsWith('game:') && gameId.length <= 160 && Number.isFinite(timestamp);
    })
    .slice(0, 20)) as GameCompletions;
}
