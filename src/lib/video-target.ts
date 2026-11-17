/** A one-pass approximate bitrate budget, not a file-size guarantee. */
export function videoBitrateBudget(inputBytes: number, durationSeconds: number, percent: number) {
  if (!Number.isFinite(inputBytes) || inputBytes <= 0 || !Number.isFinite(durationSeconds) || durationSeconds <= 0 || !Number.isFinite(percent) || percent < 1 || percent > 100) {
    throw new Error('Invalid video budget');
  }
  const targetBytes = inputBytes * percent / 100;
  // Reserve 4% for MP4 overhead. Audio gets up to 96 kbps, with low-rate floor.
  const totalKbps = Math.floor(targetBytes * 8 * 0.96 / durationSeconds / 1000);
  const audioKbps = Math.max(16, Math.min(96, Math.floor(totalKbps * 0.18)));
  const videoKbps = Math.max(40, totalKbps - audioKbps);
  return { targetBytes, totalKbps, audioKbps, videoKbps, belowMinimum: totalKbps < videoKbps + audioKbps };
}
