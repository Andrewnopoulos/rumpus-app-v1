// All timestamps in RumpusRoom are Unix epoch seconds (integer), UTC.

export const MINUTE = 60;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;

/** Current time as Unix epoch seconds (integer). */
export function nowSec(): number {
  return Math.floor(Date.now() / 1000);
}
