/**
 * SPEC v2 §9.5 — Datums- und Fristenlogik.
 *
 * 1. Alle Datumsfelder im Domänenmodell sind ISO-8601-Datumsangaben
 *    (`YYYY-MM-DD`) ohne Uhrzeitkomponente.
 * 2. Alle Fristenvergleiche laufen gegen das aktuelle Datum in der Zeitzone
 *    `Europe/Berlin`.
 *
 * Der `Clock` ist injizierbar, damit Engines deterministisch testbar sind.
 */
export const REFERENCE_TIME_ZONE = "Europe/Berlin";

export interface Clock {
  /** Aktuelles Datum in `Europe/Berlin` als `YYYY-MM-DD`. */
  today(): string;
  /** Aktueller Zeitstempel als ISO-8601 (UTC, mit Uhrzeit). */
  now(): string;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

export function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string" || !ISO_DATE.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

/** Zeitstempelfelder dürfen Datum oder Datum+Uhrzeit sein. */
export function isIsoTimestamp(value: unknown): value is string {
  if (typeof value !== "string") return false;
  return isIsoDate(value) || (ISO_TIMESTAMP.test(value) && !Number.isNaN(Date.parse(value)));
}

/** Projiziert einen Zeitpunkt auf das Kalenderdatum in `Europe/Berlin`. */
export function toBerlinDate(instant: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: REFERENCE_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instant);
  return parts;
}

export const systemClock: Clock = {
  today: () => toBerlinDate(new Date()),
  now: () => new Date().toISOString(),
};

/** Deterministischer Clock für Tests, Seeds und reproduzierbare Reports. */
export function fixedClock(date: string, timestamp = `${date}T00:00:00.000Z`): Clock {
  if (!isIsoDate(date)) {
    throw new TypeError(`fixedClock erwartet ein ISO-Datum YYYY-MM-DD, erhalten: ${date}`);
  }
  return { today: () => date, now: () => timestamp };
}

function epochDay(isoDate: string): number {
  return Date.parse(`${isoDate}T00:00:00Z`) / 86_400_000;
}

/**
 * Ganze Kalendertage von `from` bis `to`. Negativ, wenn `to` in der
 * Vergangenheit liegt (überfällige Frist).
 */
export function daysBetween(from: string, to: string): number {
  if (!isIsoDate(from) || !isIsoDate(to)) {
    throw new TypeError(`daysBetween erwartet ISO-Daten, erhalten: ${from} / ${to}`);
  }
  return epochDay(to) - epochDay(from);
}

/**
 * Tage bis zur Frist, gemessen ab `clock.today()` in `Europe/Berlin`.
 * `undefined`, wenn keine Frist bekannt ist — §9.4.1 verbietet das Raten.
 */
export function daysUntil(deadline: string | undefined, clock: Clock): number | undefined {
  if (deadline === undefined) return undefined;
  return daysBetween(clock.today(), deadline);
}

/** Frist liegt weniger als `days` Tage in der Zukunft (überfällig zählt mit). */
export function isWithinDays(
  deadline: string | undefined,
  days: number,
  clock: Clock,
): boolean {
  const remaining = daysUntil(deadline, clock);
  return remaining !== undefined && remaining < days;
}
