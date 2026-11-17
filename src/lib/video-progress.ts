/**
 * Percent of input duration represented by FFmpeg's output time. This is not
 * wall-clock or final-file progress. Only use for single-pass, full-duration
 * conversions with known duration. Sparse or implausible timestamps make the
 * indicator indeterminate instead of inventing a percentage.
 */
export function createVideoProgress(duration: number | null | undefined) {
  const validDuration = typeof duration === "number" && Number.isFinite(duration) && duration > 0;
  let unreliable = !validDuration;
  let last = 0;
  let observed = false;
  return (seconds: number): number | null => {
    if (unreliable || !validDuration || !Number.isFinite(seconds) || seconds <= 0) return null;
    const ratio = seconds / duration;
    // A first useful timestamp far into the input may be offset or too sparse.
    if ((!observed && ratio > 0.25) || ratio > 1.05 || (observed && ratio < last - 0.02)) {
      unreliable = true;
      return null;
    }
    observed = true;
    last = Math.max(last, ratio);
    return Math.min(0.99, last);
  };
}

/** Parse ffmpeg output time (not its potentially misleading progress ratio). */
export function parseVideoProgressSeconds(line: string): number | null {
  const match = /\btime=(\d+):(\d{2}):(\d{2})\.(\d+)/.exec(line);
  if (!match) return null;
  const [, hours, minutes, seconds, fraction] = match;
  return Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds) + Number(`0.${fraction ?? 0}`);
}
