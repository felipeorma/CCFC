// src/utils/helpers.ts
// Helper functions for the application

// ===== Types =====
export interface TeamRankingsRecord {
  id: string;
  data: { teams?: any[]; [k: string]: any };
  year?: number | null;
  created_at: string;
  updated_at?: string;
}

export interface TeamRow {
  date?: string;
  match: string;
  ppda?: number;
  round?: string;
  isHome?: boolean;
  opponent?: string;
  [k: string]: any;
}

export interface TeamBlob {
  name: string;
  data: Record<string, any>;
  rows?: TeamRow[];
}

// ===== Season utils =====
export const seasonFromRanking = (r: TeamRankingsRecord): string => {
  return (r.year ? String(r.year) : null) || String(new Date(r.created_at).getFullYear());
};

// ===== Fixture parser (robusto y tolerante a nulos) =====
/**
 * Soporta (entre otros):
 *  - "Cavalry FC - Forge FC 2-1"
 *  - "Cavalry - Forge (2:1)"
 *  - "Forge FC - Cavalry 1 : 0"
 *  - "Cavalry FC - Forge FC" (sin marcador)
 */
export const parseFixture = (
  matchRaw: string,
  teamNameRaw: string
): { isHome: boolean; opponent: string; teamGoals: number; oppGoals: number } | null => {
  const matchStr = String(matchRaw ?? "").trim();
  const teamStr = String(teamNameRaw ?? "").trim();
  if (!matchStr) return null;

  const m = matchStr.match(
    /^(.*?)\s*-\s*(.*?)(?:\s*\(?\s*(\d+)\s*[-:]\s*(\d+)\s*\)?)?\s*$/i
  );
  if (!m) return null;

  const homeRaw = (m[1] || "").trim();
  const awayRaw = (m[2] || "").trim();
  const gHome = m[3] !== undefined ? parseInt(m[3], 10) : NaN;
  const gAway = m[4] !== undefined ? parseInt(m[4], 10) : NaN;

  const norm = (s: string) =>
    String(s ?? "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\b(football club|club|fc)\b/g, "")
      .replace(/\s+/g, " ")
      .trim();

  const homeN = norm(homeRaw);
  const awayN = norm(awayRaw);
  const teamN = norm(teamStr);

  const isHome =
    !!teamN && (homeN === teamN || homeN.includes(teamN) || teamN.includes(homeN));
  const isAway =
    !!teamN && (awayN === teamN || awayN.includes(teamN) || teamN.includes(awayN));

  const isHomeFinal = isHome ? true : isAway ? false : false;
  const opponent = isHome ? awayRaw : isAway ? homeRaw : awayRaw || homeRaw || "Unknown";

  let teamGoals = 0;
  let oppGoals = 0;
  if (!Number.isNaN(gHome) && !Number.isNaN(gAway)) {
    teamGoals = isHome ? gHome : isAway ? gAway : 0;
    oppGoals = isHome ? gAway : isAway ? gHome : 0;
  }

  return { isHome: isHomeFinal, opponent, teamGoals, oppGoals };
};

// ===== Fecha / rounds =====
const normalize = (s: string) =>
  String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quita acentos
    .trim();

const MONTHS_MAP: Record<string, number> = {
  // English full/abbr
  january: 0,
  jan: 0,
  february: 1,
  feb: 1,
  march: 2,
  mar: 2,
  april: 3,
  apr: 3,
  june: 5,
  jun: 5,
  july: 6,
  jul: 6,
  august: 7,
  aug: 7,
  september: 8,
  october: 9,
  oct: 9,
  november: 10,
  nov: 10,
  december: 11,
  dec: 11,

  // Spanish full/abbr (sin acentos porque normalizamos)
  enero: 0,
  ene: 0,
  febrero: 1,
  marzo: 2,
  abril: 3,
  abr: 3,
  mayo: 4,
  junio: 5,
  julio: 6,
  agosto: 7,
  ago: 7,
  septiembre: 8,
  set: 8,
  octubre: 9,
  noviembre: 10,
  diciembre: 11,
  dic: 11,
};

const tryParseNamedMonth = (trimmed: string): string | null => {
  // Formatos tipo: "Abril 10, 2025" | "April 10 2025" | "10 Abril 2025"
  const t = normalize(trimmed).replace(/,/g, " ");

  // 1) Mes Día Año
  let m = t.match(/^([a-z]+)\s+(\d{1,2})\s+(\d{4})$/);
  if (m) {
    const monthNum = MONTHS_MAP[m[1]];
    if (monthNum !== undefined) {
      const day = parseInt(m[2], 10);
      const year = parseInt(m[3], 10);
      const iso = new Date(year, monthNum, day).toISOString().split("T")[0];
      return iso;
    }
  }

  // 2) Día Mes Año
  m = t.match(/^(\d{1,2})\s+([a-z]+)\s+(\d{4})$/);
  if (m) {
    const monthNum = MONTHS_MAP[m[2]];
    if (monthNum !== undefined) {
      const day = parseInt(m[1], 10);
      const year = parseInt(m[3], 10);
      const iso = new Date(year, monthNum, day).toISOString().split("T")[0];
      return iso;
    }
  }

  return null;
};

// Convert date to ISO format with fallback
export const toISODateOrFallback = (dateStr?: string, season?: string, index?: number): string => {
  if (!dateStr) {
    // Fallback: generate a date based on season and index
    const year = season ? parseInt(season, 10) : new Date().getFullYear();
    const month = Math.floor((index || 0) / 4) + 4; // Start from April
    const day = ((index || 0) % 4) * 7 + 1; // Spread matches across the month
    return new Date(year, month - 1, day).toISOString().split("T")[0];
  }

  const trimmed = String(dateStr).trim();

  // Try ISO format first (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  // Try DD/MM/YYYY or DD-MM-YYYY
  const ddmmyyyy = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (ddmmyyyy) {
    const [, day, month, year] = ddmmyyyy;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  // Try month name formats (EN/ES, con o sin acento, full o abrev)
  const named = tryParseNamedMonth(trimmed);
  if (named) return named;

  // Try Date.parse as last resort (funciona con EN)
  const parsed = Date.parse(trimmed);
  if (!isNaN(parsed)) {
    return new Date(parsed).toISOString().split("T")[0];
  }

  // Fallback to current date (último recurso)
  return new Date().toISOString().split("T")[0];
};

/**
 * Assign rounds based on chronological order (oldest = Round 1).
 * Mantiene pares únicos por (match + fecha) y asigna:
 *  - Round 1: idx 0–6
 *  - Round 2: idx 7–13
 *  - Round 3: idx 14–20
 *  - Round 4: idx 21–27
 *  - Playoffs: idx >= 28
 */
export const assignRoundsByDate = (matches: any[]): any[] => {
  if (!Array.isArray(matches) || !matches.length) return [];

  // 1) Orden cronológico (más antiguo primero)
  const chronologicallySorted = matches.slice().sort((a, b) => {
    const rawDateA = a?.date ?? a?.Date ?? "";
    const rawDateB = b?.date ?? b?.Date ?? "";

    const isoDateA = toISODateOrFallback(rawDateA, a?.season, 0);
    const isoDateB = toISODateOrFallback(rawDateB, b?.season, 0);

    const dateA = new Date(isoDateA).getTime();
    const dateB = new Date(isoDateB).getTime();

    if (!Number.isNaN(dateA) && !Number.isNaN(dateB)) {
      return dateA - dateB; // más antiguo primero
    }
    return isoDateA.localeCompare(isoDateB);
  });

  // 2) Enrich con ISO date e índice
  const enrichedSorted = chronologicallySorted.map((m: any, idx: number) => {
    const rawDate = m?.date ?? m?.Date ?? "";
    const isoDate = toISODateOrFallback(rawDate, m?.season, idx);
    return { ...m, _isoDate: isoDate, _rawDate: rawDate, chronologicalIndex: idx };
  });

  // 3) Deduplicar por (match normalizado + fecha ISO)
  const seen = new Set<string>();
  const unique: any[] = [];
  enrichedSorted.forEach((m) => {
    const matchKey = String(m?.match ?? "").replace(/\s+/g, " ").trim();
    const key = `${matchKey}|${m._isoDate}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(m);
    }
  });

  // 4) Asignar rounds por posición cronológica
  return unique.map((m, idx) => {
    const roundNumber = Math.floor(idx / 7) + 1;
    const round = roundNumber <= 4 ? `Round ${roundNumber}` : "Playoffs";
    return { ...m, round, chronologicalIndex: idx, dateISO: m._isoDate };
  });
};
