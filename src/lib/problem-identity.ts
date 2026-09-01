import { createHash } from "node:crypto";

/**
 * Stable Postgres UUID for a curated problem provenance pair.
 *
 * This deliberately derives identity from source + sourceProblemId rather than the
 * local display id. That lets offline problem ingestion and attempt persistence
 * independently arrive at the same `problems.id` without changing the schema.
 *
 * The UUID uses the RFC 4122 variant with version 8 (application-defined payload).
 */
export function problemDbIdFromProvenance(source: string, sourceProblemId: string) {
  const normalizedSource = source.trim();
  const normalizedSourceProblemId = sourceProblemId.trim();

  if (!normalizedSource) throw new Error("Problem source is required for persistent identity.");
  if (!normalizedSourceProblemId) {
    throw new Error("sourceProblemId is required for persistent identity.");
  }

  const digest = createHash("sha256")
    .update("relearn/problem/v1\0", "utf8")
    .update(normalizedSource, "utf8")
    .update("\0", "utf8")
    .update(normalizedSourceProblemId, "utf8")
    .digest();

  const bytes = Buffer.from(digest.subarray(0, 16));
  bytes[6] = (bytes[6] & 0x0f) | 0x80; // UUID version 8: application-defined.
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // RFC 4122 variant.

  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
