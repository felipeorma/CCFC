import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import * as helpers from '../utils/helpers';
import { TrendingUp, BarChart3, TriangleAlert as AlertTriangle, RefreshCw, Calendar, Bug, Filter, X, Home, MapPin, Trophy, Minus, Equal } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);
// Fuerza color de texto (títulos, ticks, tooltips y LEYENDA) a blanco
ChartJS.defaults.color = 'rgba(255,255,255,0.85)';

type ResultType = 'win' | 'draw' | 'loss';

type TeamRow = {
  Date?: string;
  date?: string;
  Match?: string;
  match?: string;
  PPDA?: number;
  ppda?: number;
  isHome?: boolean;
  opponent?: string;
  round?: string;
  row_type?: string;
  [key: string]: any;
};

type TeamData = {
  name: string;
  data: Record<string, any>;
  rows?: TeamRow[];
};

type TeamRankingsRecord = {
  id: string;
  data: { teams?: TeamData[]; [k: string]: any };
  year?: string | null;
  created_at: string;
};

type MatchData = {
  match: string;
  date: string;
  round: string;
  opponent: string;
  isHome: boolean;
  ppda: number;
  ppda_against?: number | null;
  result: string;
  result_type: ResultType;
  season: string;
  chronologicalIndex?: number; // agregado por helpers.assignRoundsByDate
  dateISO?: string;            // opcional si tu helper lo añade
};

const CPL_TEAMS = [
  'Cavalry',
  'Atlético Ottawa',
  'Forge',
  'HFX Wanderers FC',
  'Pacific FC',
  'Valour FC',
  'Vancouver FC',
  'York United FC'
];

const safeSeason = (r: TeamRankingsRecord) => {
  if (r.year) {
    const yearStr = String(r.year).trim();
    if (yearStr) return yearStr;
  }
  return String(new Date(r.created_at).getFullYear());
};

const parseResult = (
  match: string,
  teamName: string
): { isHome: boolean; opponent: string; result: string; result_type: ResultType } | null => {
  if (!match.includes(' - ') || !match.includes(':')) return null;
  const parts = match.split(' - ');
  if (parts.length !== 2) return null;
  const left = parts[0].trim();
  const rightTokens = parts[1].trim().split(' ');
  const score = rightTokens.pop();
  const rightTeam = rightTokens.join(' ').trim();
  if (!score || !score.includes(':')) return null;

  const [sL, sR] = score.split(':').map((x) => parseInt(x, 10) || 0);
  const isHome = left.toLowerCase().includes(teamName.toLowerCase());
  const opponent = isHome ? rightTeam : left;
  const teamGoals = isHome ? sL : sR;
  const oppGoals = isHome ? sR : sL;

  let result_type: ResultType = 'draw';
  if (teamGoals > oppGoals) result_type = 'win';
  else if (teamGoals < oppGoals) result_type = 'loss';
  return { isHome, opponent, result: `${teamGoals}-${oppGoals}`, result_type };
};

const PPDAEvolution: React.FC = () => {
  const findOpponentPPDA = (match: string, teamName: string, allTeams: any[]): number | null => {
    const parsed = parseResult(match, teamName);
    if (!parsed) return null;
    const opponentTeam = allTeams.find(
      (team) => team?.name && team.name.toLowerCase().includes(parsed.opponent.toLowerCase())
    );
    if (!opponentTeam?.rows) return null;
    const opponentRow = opponentTeam.rows.find((row: any) => {
      const rowMatch = row?.Match || row?.match;
      return rowMatch === match;
    });
    return opponentRow?.PPDA || opponentRow?.ppda || null;
  };

  const [teamRankings, setTeamRankings] = useState<TeamRankingsRecord[]>([]);
  const [matchesData, setMatchesData] = useState<MatchData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedTeam, setSelectedTeam] = useState<string>('Cavalry');
  const [selectedSeason, setSelectedSeason] = useState<string>('');
  const [ppdaEntries, setPpdaEntries] = useState<any[]>([]);

  // Filtros
  const [filters, setFilters] = useState<{ round: string; venue: '' | 'home' | 'away'; result: '' | ResultType }>({
    round: '',
    venue: '',
    result: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [debugMode, setDebugMode] = useState(false);

  // Overlays: temporadas previas con PPDA promedio
  const [overlaySeasons, setOverlaySeasons] = useState<Record<string, boolean>>({});

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // PPDA por mitades (si existe) con FK a team y match
      const { data: ppdaData, error: ppdaError } = await supabase
        .from('ppda_stats')
        .select('*')
        .order('created_at', { ascending: false });

      if (ppdaError) {
        console.warn('Error fetching PPDA entries:', ppdaError);
        setPpdaEntries([]);
      } else {
        setPpdaEntries(ppdaData || []);
      }

      // Rankings y datos por temporada
      const { data, error } = await supabase
        .from('team_rankings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const rankings = (data || []) as TeamRankingsRecord[];
      setTeamRankings(rankings);

      // Construir matches por equipo/temporada
      const all: MatchData[] = [];
      rankings.forEach((rec) => {
        const season = safeSeason(rec);
        const allTeamsInSeason = rec.data?.teams || [];
        const team = rec.data?.teams?.find(
          (t) => t?.name && t.name.toLowerCase().includes(selectedTeam.toLowerCase())
        );
        if (!team) return;

        const rows = Array.isArray(team.rows) ? team.rows : [];
        rows.forEach((row) => {
          if (row.row_type === 'average_team' || row.row_type === 'average_opponent') return;

          const teamPPDA = row.PPDA || row.ppda || row['PPDA'];
          const matchStr = row.Match || row.match;
          const dateStr = row.Date || row.date || '';

          if (typeof teamPPDA !== 'number' || !matchStr) return;

          const parsed = parseResult(matchStr, team.name);
          if (!parsed) return;

          const opponentPPDA = findOpponentPPDA(matchStr, team.name, allTeamsInSeason);

          all.push({
            match: matchStr,
            date: dateStr,
            round: row.round || '',
            opponent: row.opponent || parsed.opponent,
            isHome: typeof row.isHome === 'boolean' ? row.isHome : parsed.isHome,
            ppda: teamPPDA,
            ppda_against: opponentPPDA,
            result: parsed.result,
            result_type: parsed.result_type,
            season,
          });
        });
      });

      // ✅ Agrupar por temporada, deduplicar dentro de cada temporada y luego asignar rounds
      const bySeason: Record<string, MatchData[]> = {};
      all.forEach((m) => {
        (bySeason[m.season] ||= []).push(m);
      });

      const matchesWithRounds = Object.values(bySeason).flatMap((arr) => {
        const dedup = new Map<string, MatchData>();
        arr.forEach((m) => {
          const key = `${m.match.replace(/\s+/g, ' ').trim()}|${m.date}`;
          if (!dedup.has(key)) dedup.set(key, m);
        });
        // Asignar rounds SOLO dentro de esta temporada
        return helpers.assignRoundsByDate(Array.from(dedup.values()));
      });

      setMatchesData(matchesWithRounds);

      // Temporada por defecto
      const seasons = Array.from(new Set(all.map((m) => m.season))).sort().reverse();
      const defaultSeason = seasons.includes('2025') ? '2025' : seasons[0] || '2025';
      setSelectedSeason((prev) => prev || defaultSeason);

      // Inicializar overlays con temporadas detectadas para el equipo seleccionado
      const allSeasons = Array.from(new Set([...rankings.map((r) => safeSeason(r))])).sort();
      const initialOverlays: Record<string, boolean> = {};
      allSeasons
        .filter((y) => y !== defaultSeason)
        .filter((y) => {
          const seasonRecord = rankings.find((r) => safeSeason(r) === y);
          const teamInSeason = seasonRecord?.data?.teams?.find((t) =>
            t?.name && t.name.toLowerCase().includes(selectedTeam.toLowerCase())
          );
          return teamInSeason && (teamInSeason.rows?.length || teamInSeason.data?.PPDA);
        })
        .forEach((y) => (initialOverlays[y] = false));
      setOverlaySeasons(initialOverlays);
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [selectedTeam]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Temporadas disponibles (todas en BD)
  const availableSeasonsAll = useMemo(
    () => Array.from(new Set(teamRankings.map((r) => safeSeason(r)))).sort(),
    [teamRankings]
  );

  // Temporadas con rows para el equipo seleccionado
  const seasonsWithRowsForTeam = useMemo(() => {
    const set = new Set<string>();
    teamRankings.forEach((rec) => {
      const season = safeSeason(rec);
      const team = rec.data?.teams?.find((t) => t?.name && t.name.toLowerCase().includes(selectedTeam.toLowerCase()));
      if (team?.rows?.some((row) => typeof (row.ppda || row['ppda']) === 'number')) set.add(season);
    });
    return Array.from(set).sort();
  }, [teamRankings, selectedTeam]);

  // Mapa de PPDA total por temporada (solo del equipo seleccionado)
  const seasonalPPDAMap = useMemo(() => {
    const map: Record<string, number> = {};
    teamRankings.forEach((rec) => {
      const season = safeSeason(rec);
      const team = rec.data?.teams?.find((t) => t?.name && t.name.toLowerCase().includes(selectedTeam.toLowerCase()));
      if (!team) return;
      const ppda = team?.data?.PPDA || team?.data?.ppda || team?.data?.['PPDA'];
      const asNum = typeof ppda === 'number' ? ppda : parseFloat(String(ppda ?? ''));
      if (Number.isFinite(asNum)) map[season] = asNum;
    });
    return map;
  }, [teamRankings, selectedTeam]);

  // Partidos de la temporada seleccionada
  const seasonMatches = useMemo(() => {
    return matchesData.filter((m) => m.season === selectedSeason);
  }, [matchesData, selectedSeason]);

  // Filtros aplicados + orden cronológico **ascendente** (antiguos → recientes)
  const filteredMatches = useMemo(() => {
    let list = seasonMatches;
    if (filters.round) list = list.filter((m) => m.round === filters.round);
    if (filters.venue === 'home') list = list.filter((m) => m.isHome);
    else if (filters.venue === 'away') list = list.filter((m) => !m.isHome);
    if (filters.result) list = list.filter((m) => m.result_type === filters.result);

    // Preferir el índice cronológico del helper; si no existe, ordenar por fecha ISO
    return list.slice().sort((a, b) => {
      const ai = (a as any).chronologicalIndex;
      const bi = (b as any).chronologicalIndex;
      if (Number.isFinite(ai) && Number.isFinite(bi)) return bi - ai; // NEWEST FIRST
      const aISO = (a as any).dateISO || helpers.toISODateOrFallback(a.date, (a as any).season);
      const bISO = (b as any).dateISO || helpers.toISODateOrFallback(b.date, (b as any).season);
      return bISO.localeCompare(aISO); // NEWEST FIRST
    });
  }, [seasonMatches, filters]);

  // Rounds disponibles ordenados por número (Playoffs al final)
  const availableRounds = useMemo(() => {
    const rounds = Array.from(new Set(seasonMatches.map((m) => m.round))).filter(Boolean) as string[];
    return rounds.sort((r1, r2) => {
      if (r1 === 'Playoffs') return 1;
      if (r2 === 'Playoffs') return -1;
      const n1 = parseInt(r1.replace(/\D+/g, ''), 10) || 0;
      const n2 = parseInt(r2.replace(/\D+/g, ''), 10) || 0;
      return n1 - n2;
    });
  }, [seasonMatches]);

  const filterCounts = useMemo(
    () => ({
      wins: seasonMatches.filter((m) => m.result_type === 'win').length,
      draws: seasonMatches.filter((m) => m.result_type === 'draw').length,
      losses: seasonMatches.filter((m) => m.result_type === 'loss').length,
      home: seasonMatches.filter((m) => m.isHome).length,
      away: seasonMatches.filter((m) => !m.isHome).length,
    }),
    [seasonMatches]
  );

  const seasonAverage = useMemo(() => {
    if (!filteredMatches.length) return undefined;
    return filteredMatches.reduce((s, m) => s + m.ppda, 0) / filteredMatches.length;
  }, [filteredMatches]);

  const seasonAverageAgainst = useMemo(() => {
    if (!filteredMatches.length) return undefined;
    const validMatches = filteredMatches.filter((m) => m.ppda_against !== null && m.ppda_against !== undefined);
    if (!validMatches.length) return undefined;
    return validMatches.reduce((s, m) => s + (m.ppda_against || 0), 0) / validMatches.length;
  }, [filteredMatches]);

  // Overlays (líneas horizontales con PPDA promedio por temporada)
  const overlayDatasets = useMemo(() => {
    const datasets: any[] = [];
    const n = filteredMatches.length || 1;
    Object.entries(overlaySeasons).forEach(([season, enabled]) => {
      if (!enabled) return;
      if (season === selectedSeason) return;
      const val = seasonalPPDAMap[season];
      if (!Number.isFinite(val)) return;
      datasets.push({
        label: `Season ${season} Avg PPDA`,
        data: Array(n).fill(val),
        type: 'line' as const,
        borderColor: '#ffdb4e',
        backgroundColor: 'rgba(255, 219, 78, 0.15)',
        borderWidth: 2,
        pointRadius: 0,
        borderDash: [6, 6],
      });
    });
    return datasets;
  }, [overlaySeasons, seasonalPPDAMap, filteredMatches.length, selectedSeason]);

  const ppdaChartData = useMemo(() => {
    if (!filteredMatches.length) return null;

    const ppdaFirstHalfData: (number | null)[] = [];
    const ppdaSecondHalfData: (number | null)[] = [];
    const ppdaAgainstData: (number | null)[] = [];

    filteredMatches.forEach((match) => {
      const ppdaEntry = ppdaEntries.find((entry) => {
        const entryTeamMatch = entry.match || '';
        const entrySeason = entry.season || '';
        const entryDate = entry.date ? String(entry.date) : '';
        const matchDate = String(match.date);
        return (
          entryTeamMatch.toLowerCase().includes(selectedTeam.toLowerCase()) &&
          entrySeason === selectedSeason &&
          entryDate === matchDate &&
          (entry.ppda_first_half || entry.ppda_second_half)
        );
      });

      if (ppdaEntry) {
        ppdaFirstHalfData.push(ppdaEntry.ppda_first_half || null);
        ppdaSecondHalfData.push(ppdaEntry.ppda_second_half || null);
      } else {
        ppdaFirstHalfData.push(null);
        ppdaSecondHalfData.push(null);
      }

      ppdaAgainstData.push(match.ppda_against || null);
    });

    const datasets = [
      {
        label: `${selectedTeam} PPDA`,
        data: filteredMatches.map((m) => Number(m.ppda.toFixed(2))),
        borderColor: '#2dd9fe',
        backgroundColor: 'rgba(45, 217, 254, 0.15)',
        borderWidth: 3,
        tension: 0.65,
        fill: true,
        pointRadius: 5,
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointBackgroundColor: ((ctx: any) => {
          const m = filteredMatches[ctx.dataIndex];
          if (!m) return '#9e9e9e';
          if (m.result_type === 'win') return '#00C853';
          if (m.result_type === 'draw') return '#FFEB3B';
          if (m.result_type === 'loss') return '#FF1744';
          return '#9e9e9e';
        }) as any
      }
    ];

    if (ppdaAgainstData.some((val) => val !== null)) {
      datasets.push({
        label: `Opponents PPDA Against ${selectedTeam}`,
        data: ppdaAgainstData.map((val) => (val ? Number(val.toFixed(2)) : null)) as number[],
        borderColor: '#ff5161',
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderDash: [4, 4],
        tension: 0.65,
        fill: false,
        pointRadius: 4,
        pointBorderColor: '#ff5161',
        pointBorderWidth: 1,
        pointBackgroundColor: '#ff5161' as any,
        spanGaps: true
      } as any);
    }

    if (ppdaFirstHalfData.some((val) => val !== null)) {
      datasets.push({
        label: `${selectedTeam} PPDA 1st Half`,
        data: ppdaFirstHalfData.map((val) => (val ? Number(val.toFixed(2)) : null)) as number[],
        borderColor: '#ffdb4e',
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderDash: [8, 4],
        tension: 0.65,
        fill: false,
        pointRadius: 3,
        pointBorderColor: '#ffdb4e',
        pointBorderWidth: 1,
        pointBackgroundColor: '#ffdb4e' as any,
        spanGaps: true
      } as any);
    }

    if (ppdaSecondHalfData.some((val) => val !== null)) {
      datasets.push({
        label: `${selectedTeam} PPDA 2nd Half`,
        data: ppdaSecondHalfData.map((val) => (val ? Number(val.toFixed(2)) : null)) as number[],
        borderColor: '#9461fd',
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderDash: [4, 8],
        tension: 0.65,
        fill: false,
        pointRadius: 3,
        pointBorderColor: '#9461fd',
        pointBorderWidth: 1,
        pointBackgroundColor: '#9461fd' as any,
        spanGaps: true
      } as any);
    }

    datasets.push(...overlayDatasets);

    return {
      labels: filteredMatches.map((m) => `${m.date} vs ${m.opponent}`),
      datasets
    };
  }, [filteredMatches, overlayDatasets, selectedSeason, selectedTeam, ppdaEntries]);

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    color: 'rgba(255,255,255,0.85)', // refuerzo local por si algún tema pisa los defaults
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: 'rgba(255, 255, 255, 0.85)',
          usePointStyle: false, // muestra la línea (coincide con borderColor), no el punto
          padding: 16,
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.85)',
        titleColor: '#fff',
        bodyColor: 'rgba(255,255,255,0.9)',
        borderColor: 'rgba(255,255,255,0.18)',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          afterLabel: (ctx) => {
            const m = filteredMatches[ctx.dataIndex];
            if (!m) return [];

            const extraInfo = [
              `Result: ${m.result ?? 'N/A'}`,
              `Venue: ${m.isHome ? 'Home' : 'Away'}`,
              `Round: ${m.round ?? '-'}`
            ];

            if (ctx.datasetIndex === 0) {
              extraInfo.push(`PPDA: ${m.ppda.toFixed(2)}`);
            } else if (ctx.datasetIndex === 1 && m.ppda_against != null) {
              extraInfo.push(`Opponent PPDA: ${m.ppda_against.toFixed(2)}`);
            }

            return extraInfo;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: { color: 'rgba(255,255,255,0.7)', maxRotation: 45 },
        grid: { color: 'rgba(255,255,255,0.08)' }
      },
      y: {
        ticks: { color: 'rgba(255,255,255,0.7)' },
        grid: { color: 'rgba(255,255,255,0.08)' },
        title: {
          display: true,
          text: 'PPDA (Lower = More Aggressive)',
          color: 'rgba(255,255,255,0.8)',
          font: { size: 12, weight: 'bold' as const }
        }
      },
    },
  };

  const activeFiltersCount = useMemo(() => Object.values(filters).filter(Boolean).length, [filters]);

  const resetFilters = () => setFilters({ round: '', venue: '', result: '' });

  const ppdaStats = useMemo(() => {
    if (!filteredMatches.length) return null;
    const sortedByPPDA = [...filteredMatches].sort((a, b) => a.ppda - b.ppda);
    const sortedByPPDAAgainst = [...filteredMatches]
      .filter((m) => m.ppda_against !== null && m.ppda_against !== undefined)
      .sort((a, b) => (a.ppda_against || 0) - (b.ppda_against || 0));
    return {
      bestPPDA: sortedByPPDA[0],
      worstPPDA: sortedByPPDA[sortedByPPDA.length - 1],
      bestPPDAAgainst: sortedByPPDAAgainst[0],
      worstPPDAAgainst: sortedByPPDAAgainst[sortedByPPDAAgainst.length - 1]
    };
  }, [filteredMatches]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto mb-3" />
          <p className="text-sm text-text-secondary">Loading PPDA data…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
            <TrendingUp className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">PPDA Evolution - {selectedTeam}</h1>
            <p className="text-text-secondary">Lower PPDA = More aggressive pressing</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowFilters(!showFilters)} variant="outline" size="sm" className="flex items-center gap-2">
            <Filter className="h-4 w-4" /> Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
          </Button>
          <Button onClick={() => setDebugMode(!debugMode)} variant="outline" size="sm" className="flex items-center gap-2">
            <Bug className="h-4 w-4" /> Debug: {debugMode ? 'On' : 'Off'}
          </Button>
          <Button onClick={fetchData} variant="outline" size="sm" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-error/10 border border-error/30 text-error px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <div>
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Team & Season */}
      <div className="card p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <Trophy className="h-5 w-5 text-primary" />
          <label className="text-text-primary font-medium">Team:</label>
          <Select value={selectedTeam} onValueChange={setSelectedTeam}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Select team" /></SelectTrigger>
            <SelectContent>
              {CPL_TEAMS.map((team) => <SelectItem key={team} value={team}>{team}</SelectItem>)}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2 ml-auto">
            <Calendar className="h-5 w-5 text-primary" />
            <label className="text-text-primary font-medium">Season:</label>
            <select
              className="select-field w-auto"
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
            >
              {(seasonsWithRowsForTeam.length ? seasonsWithRowsForTeam : availableSeasonsAll).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          className={`px-3 py-2 rounded-lg border transition-colors flex items-center gap-2 ${filters.result === 'win' ? 'border-success bg-success/10 text-success' : 'border-border hover:border-success text-text-secondary'}`}
          onClick={() => setFilters((p) => ({ ...p, result: p.result === 'win' ? '' : 'win' }))}
        >
          <Trophy className="h-4 w-4" /> Wins ({filterCounts.wins})
        </button>
        <button
          className={`px-3 py-2 rounded-lg border transition-colors flex items-center gap-2 ${filters.result === 'draw' ? 'border-warning bg-warning/10 text-warning' : 'border-border hover:border-warning text-text-secondary'}`}
          onClick={() => setFilters((p) => ({ ...p, result: p.result === 'draw' ? '' : 'draw' }))}
        >
          <Equal className="h-4 w-4" /> Draws ({filterCounts.draws})
        </button>
        <button
          className={`px-3 py-2 rounded-lg border transition-colors flex items-center gap-2 ${filters.result === 'loss' ? 'border-error bg-error/10 text-error' : 'border-border hover:border-error text-text-secondary'}`}
          onClick={() => setFilters((p) => ({ ...p, result: p.result === 'loss' ? '' : 'loss' }))}
        >
          <Minus className="h-4 w-4" /> Losses ({filterCounts.losses})
        </button>
        <button
          className={`px-3 py-2 rounded-lg border transition-colors flex items-center gap-2 ${filters.venue === 'home' ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary text-text-secondary'}`}
          onClick={() => setFilters((p) => ({ ...p, venue: p.venue === 'home' ? '' : 'home' }))}
        >
          <Home className="h-4 w-4" /> Home ({filterCounts.home})
        </button>
        <button
          className={`px-3 py-2 rounded-lg border transition-colors flex items-center gap-2 ${filters.venue === 'away' ? 'border-secondary bg-secondary/10 text-secondary' : 'border-border hover:border-secondary text-text-secondary'}`}
          onClick={() => setFilters((p) => ({ ...p, venue: p.venue === 'away' ? '' : 'away' }))}
        >
          <MapPin className="h-4 w-4" /> Away ({filterCounts.away})
        </button>
        <div className="ml-auto flex items-center gap-2">
          <label className="text-sm text-text-secondary">Round:</label>
          <select
            className="input-field"
            value={filters.round}
            onChange={(e) => setFilters((p) => ({ ...p, round: e.target.value }))}
          >
            <option value="">All</option>
            {availableRounds.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <Button size="sm" variant="outline" onClick={resetFilters}>Reset</Button>
        </div>
      </div>

      {/* Advanced Filters Modal */}
      {showFilters && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-surface rounded-lg w-full max-w-md m-4">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="text-lg font-bold">PPDA Filters</h2>
              <button onClick={() => setShowFilters(false)} className="p-1 hover:bg-surface rounded-full">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Round</label>
                <select
                  className="input-field"
                  value={filters.round}
                  onChange={(e) => setFilters((p) => ({ ...p, round: e.target.value }))}
                >
                  <option value="">All Rounds</option>
                  {availableRounds.map((round) => <option key={round} value={round}>{round}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Venue</label>
                <select
                  className="input-field"
                  value={filters.venue}
                  onChange={(e) => setFilters((p) => ({ ...p, venue: e.target.value as '' | 'home' | 'away' }))}
                >
                  <option value="">Home & Away</option>
                  <option value="home">Home Only</option>
                  <option value="away">Away Only</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Result</label>
                <select
                  className="input-field"
                  value={filters.result}
                  onChange={(e) => setFilters((p) => ({ ...p, result: e.target.value as '' | ResultType }))}
                >
                  <option value="">All Results</option>
                  <option value="win">Wins Only</option>
                  <option value="draw">Draws Only</option>
                  <option value="loss">Losses Only</option>
                </select>
              </div>
            </div>
            <div className="p-4 border-t border-border flex justify-between">
              <Button onClick={resetFilters} variant="outline">Reset Filters</Button>
              <Button onClick={() => setShowFilters(false)} className="bg-primary text-white hover:bg-primary/90">Apply</Button>
            </div>
          </div>
        </div>
      )}

      {/* Overlays de temporadas anteriores */}
      <div className="card p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <BarChart3 className="h-5 w-5 text-secondary" />
          <p className="font-medium">Compare with previous seasons (Avg PPDA):</p>
          <div className="flex flex-wrap gap-3">
            {Object.keys(seasonalPPDAMap)
              .filter((s) => s !== selectedSeason)
              .sort()
              .map((s) => (
                <label key={s} className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={!!overlaySeasons[s]}
                    onChange={(e) => setOverlaySeasons((prev) => ({ ...prev, [s]: e.target.checked }))}
                  />
                  <span>{s} ({Number(seasonalPPDAMap[s]).toFixed(2)})</span>
                </label>
              ))}
          </div>
        </div>
      </div>

      {/* Chart */}
      {ppdaChartData && filteredMatches.length ? (
        <div className="card p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">
                {selectedTeam} — PPDA per match ({selectedSeason})
              </h2>
              <p className="text-text-secondary">
                Showing {filteredMatches.length} matches
              </p>
            </div>
          </div>

          <div className="h-[420px] mb-6">
            <Line data={ppdaChartData} options={chartOptions} />
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-background p-4 rounded-lg">
              <p className="text-sm text-text-secondary">{selectedTeam} Avg PPDA</p>
              <p className="text-2xl font-bold" style={{ color: '#2dd9fe' }}>{(seasonAverage ?? 0).toFixed(2)}</p>
            </div>
            {seasonAverageAgainst && (
              <div className="bg-background p-4 rounded-lg">
                <p className="text-sm text-text-secondary">Opponents Avg PPDA</p>
                <p className="text-2xl font-bold" style={{ color: '#ff5161' }}>{seasonAverageAgainst.toFixed(2)}</p>
              </div>
            )}
            {ppdaStats && (
              <>
                <div className="bg-blue-500/10 p-4 rounded-lg border border-blue-500/20">
                  <p className="text-sm font-medium" style={{ color: '#2dd9fe' }}>Best PPDA (Most Aggressive)</p>
                  <p className="text-2xl font-bold" style={{ color: '#2dd9fe' }}>{ppdaStats.bestPPDA.ppda.toFixed(2)}</p>
                  <p className="text-xs text-success/80 mt-1">vs {ppdaStats.bestPPDA.opponent}</p>
                  <p className="text-xs text-success/60">{ppdaStats.bestPPDA.date} • {ppdaStats.bestPPDA.result}</p>
                </div>

                <div className="bg-error/10 p-4 rounded-lg border border-error/20">
                  <p className="text-sm font-medium" style={{ color: '#2dd9fe' }}>Worst PPDA (Least Aggressive)</p>
                  <p className="text-2xl font-bold" style={{ color: '#2dd9fe' }}>{ppdaStats.worstPPDA.ppda.toFixed(2)}</p>
                  <p className="text-xs text-error/80 mt-1">vs {ppdaStats.worstPPDA.opponent}</p>
                  <p className="text-xs text-error/60">{ppdaStats.worstPPDA.date} • {ppdaStats.worstPPDA.result}</p>
                </div>

                {ppdaStats.bestPPDAAgainst && (
                  <div className="bg-red-500/10 p-4 rounded-lg border border-red-500/20">
                    <p className="text-sm font-medium" style={{ color: '#ff5161' }}>Best PPDA Against (Opponent Most Aggressive)</p>
                    <p className="text-2xl font-bold" style={{ color: '#ff5161' }}>{(ppdaStats.bestPPDAAgainst.ppda_against || 0).toFixed(2)}</p>
                    <p className="text-xs text-red-400 mt-1">vs {ppdaStats.bestPPDAAgainst.opponent}</p>
                    <p className="text-xs text-red-300">{ppdaStats.bestPPDAAgainst.date} • {ppdaStats.bestPPDAAgainst.result}</p>
                  </div>
                )}

                {ppdaStats.worstPPDAAgainst && (
                  <div className="bg-red-500/10 p-4 rounded-lg border border-red-500/20">
                    <p className="text-sm font-medium" style={{ color: '#ff5161' }}>Worst PPDA Against (Opponent Least Aggressive)</p>
                    <p className="text-2xl font-bold" style={{ color: '#ff5161' }}>{(ppdaStats.worstPPDAAgainst.ppda_against || 0).toFixed(2)}</p>
                    <p className="text-xs text-red-400 mt-1">vs {ppdaStats.worstPPDAAgainst.opponent}</p>
                    <p className="text-xs text-red-300">{ppdaStats.worstPPDAAgainst.date} • {ppdaStats.worstPPDAAgainst.result}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-background p-8 rounded-lg border border-border text-center">
          <AlertTriangle className="h-12 w-12 text-warning mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">No per-match PPDA found</h3>
          <p className="text-text-secondary">
            Sube Team Data (2025) con <b>rows</b> para ver la evolución partido a partido. Los años anteriores se comparan como líneas de promedio.
          </p>
        </div>
      )}

      {/* Debug */}
      {debugMode && (
        <div className="bg-background-lighter p-4 rounded-lg border border-border">
          <h3 className="text-sm font-medium mb-2 text-warning flex items-center gap-2">
            <Bug className="h-4 w-4" /> Debug Information
          </h3>
          <div className="space-y-1 text-xs font-mono">
            <p>TeamRankings records: {teamRankings.length}</p>
            <p>Matches total: {matchesData.length}</p>
            <p>Seasons (all): {availableSeasonsAll.join(', ')}</p>
            <p>Seasons with rows for {selectedTeam}: {seasonsWithRowsForTeam.join(', ') || '(none)'}</p>
            <p>Selected Season: {selectedSeason}</p>
            <p>Season matches (raw): {seasonMatches.length}</p>
            <p>Filtered matches: {filteredMatches.length}</p>
            <p>PPDA entries: {ppdaEntries.length}</p>
            <p>Overlay seasons enabled: {Object.entries(overlaySeasons).filter(([,v])=>v).map(([k])=>k).join(', ') || '(none)'}</p>
            <p>Seasonal PPDA map: {JSON.stringify(seasonalPPDAMap)}</p>
            <p>Season average: {seasonAverage?.toFixed(2) || 'N/A'}</p>
            <p>Season average against: {seasonAverageAgainst?.toFixed(2) || 'N/A'}</p>
            <p>Matches with PPDA against: {filteredMatches.filter(m => m.ppda_against).length}</p>
            {ppdaStats && (
              <>
                <p>Best PPDA: {ppdaStats.bestPPDA.ppda.toFixed(2)} vs {ppdaStats.bestPPDA.opponent}</p>
                <p>Worst PPDA: {ppdaStats.worstPPDA.ppda.toFixed(2)} vs {ppdaStats.worstPPDA.opponent}</p>
                {ppdaStats.bestPPDAAgainst && (
                  <p>Best PPDA Against: {(ppdaStats.bestPPDAAgainst.ppda_against || 0).toFixed(2)} vs {ppdaStats.bestPPDAAgainst.opponent}</p>
                )}
                {ppdaStats.worstPPDAAgainst && (
                  <p>Worst PPDA Against: {(ppdaStats.worstPPDAAgainst.ppda_against || 0).toFixed(2)} vs {ppdaStats.worstPPDAAgainst.opponent}</p>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PPDAEvolution;
 