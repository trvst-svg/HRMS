const PREFIX = "hrms_avatar";

export function getAvatar(role, email) {
  if (!email) return null;
  try {
    return localStorage.getItem(`${PREFIX}:${role}:${email.toLowerCase()}`);
  } catch {
    return null;
  }
}

export function setAvatar(role, email, dataUrl) {
  if (!email) return;
  try {
    localStorage.setItem(`${PREFIX}:${role}:${email.toLowerCase()}`, dataUrl);
    window.dispatchEvent(
      new CustomEvent("hrms-avatar-updated", { detail: { role, email } }),
    );
  } catch {
    /* ignore */
  }
}

export function clearAvatar(role, email) {
  if (!email) return;
  try {
    localStorage.removeItem(`${PREFIX}:${role}:${email.toLowerCase()}`);
    window.dispatchEvent(
      new CustomEvent("hrms-avatar-updated", { detail: { role, email } }),
    );
  } catch {
    /* ignore */
  }
}
