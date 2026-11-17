/** A UI preference, not a guarantee that a browser still has the engine cached. */
const KEY = "abzaro-video-engine-ready";
let readyThisSession = false;

export function hasUsedVideoEngine(): boolean {
  if (readyThisSession) return true;
  try { return typeof window !== "undefined" && window.localStorage.getItem(KEY) === "1"; }
  catch { return false; }
}

export function rememberVideoEngineReady(): void {
  readyThisSession = true;
  try { if (typeof window !== "undefined") window.localStorage.setItem(KEY, "1"); }
  catch { /* private browsing/storage restrictions: retain the in-memory flag */ }
}
