/**
 * PDF password operations, entirely in the browser.
 *
 * `pdf-lib` 1.x silently ignores `userPassword` when saving, so encryption here
 * uses `@cantoo/pdf-lib`, which implements the real standard security handler
 * (AES-128 / RC4 depending on the encryption options). Decryption of a
 * password-protected file is done by loading it with the password.
 */

import { PDFDocument } from "@cantoo/pdf-lib";

export interface EncryptResult {
  bytes: Uint8Array;
  /** Bytes of the input file, for the size delta in the UI. */
  inputBytes: number;
}

/** Why a password is rejected before we even touch the file. */
export const MIN_PASSWORD_LENGTH = 4;

export function passwordProblem(password: string): string | null {
  if (password.length === 0) return "رمز را وارد کنید.";
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `رمز باید حداقل ${MIN_PASSWORD_LENGTH} نویسه باشد.`;
  }
  if (password.length > 128) return "رمز بیش از ۱۲۸ نویسه است؛ کوتاه‌ترش کنید.";
  return null;
}

/**
 * Encrypt a PDF with a user password (the password required to open it).
 * Permissions are left at "allow printing, no copying/modifying", which is what
 * a user asking for a locked PDF normally expects.
 */
export async function encryptPdf(
  bytes: Uint8Array,
  password: string,
): Promise<EncryptResult> {
  const problem = passwordProblem(password);
  if (problem) throw new Error(problem);

  const doc = await PDFDocument.load(bytes, { updateMetadata: false });
  doc.encrypt({
    userPassword: password,
    ownerPassword: password,
    permissions: {
      printing: "highResolution",
      modifying: false,
      copying: false,
      annotating: false,
      fillingForms: false,
      contentAccessibility: true,
      documentAssembly: false,
    },
  });
  const out = await doc.save({ useObjectStreams: false });
  return { bytes: out, inputBytes: bytes.byteLength };
}

/**
 * Remove the password from a PDF you can already open. The password is required
 * because a PDF cannot be decrypted without it (that is the point of the format);
 * we never claim to "crack" anything.
 */
export async function decryptPdf(
  bytes: Uint8Array,
  password: string,
): Promise<EncryptResult> {
  const doc = await PDFDocument.load(bytes, { password, updateMetadata: false });
  const out = await doc.save({ useObjectStreams: false });
  return { bytes: out, inputBytes: bytes.byteLength };
}

/** True when the file is encrypted (a password will be required to open it). */
export async function isEncrypted(bytes: Uint8Array): Promise<boolean> {
  try {
    await PDFDocument.load(bytes, { updateMetadata: false });
    return false;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return /encrypted/i.test(message);
  }
}

/** Page count of a PDF, or null when it cannot be opened without a password. */
export async function pageCount(bytes: Uint8Array, password?: string): Promise<number | null> {
  try {
    const doc = await PDFDocument.load(bytes, { password, updateMetadata: false });
    return doc.getPageCount();
  } catch {
    return null;
  }
}
