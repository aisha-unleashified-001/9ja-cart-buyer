/** Session flags for the post-login BNPL welcome popup (Layout). */

const PENDING_KEY = "9ja_bnpl_welcome_popup_pending";
const SEEN_KEY = "9ja_bnpl_welcome_popup_seen";

export function markBnplWelcomePending(): void {
  try {
    // Fresh login should always be eligible to show the popup again.
    sessionStorage.setItem(PENDING_KEY, "1");
    sessionStorage.removeItem(SEEN_KEY);
  } catch {
    // ignore
  }
}

export function clearBnplWelcomePending(): void {
  try {
    sessionStorage.removeItem(PENDING_KEY);
  } catch {
    // ignore
  }
}

export function isBnplWelcomePending(): boolean {
  try {
    return sessionStorage.getItem(PENDING_KEY) === "1";
  } catch {
    return false;
  }
}

export function markBnplWelcomeSeen(): void {
  try {
    sessionStorage.setItem(SEEN_KEY, "1");
    sessionStorage.removeItem(PENDING_KEY);
  } catch {
    // ignore
  }
}

export function hasBnplWelcomeBeenSeen(): boolean {
  try {
    return sessionStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

export function resetBnplWelcomePopup(): void {
  try {
    sessionStorage.removeItem(PENDING_KEY);
    sessionStorage.removeItem(SEEN_KEY);
  } catch {
    // ignore
  }
}
