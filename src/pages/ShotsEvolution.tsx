import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import * as helpers from '../utils/helpers';
import { Target, Goal, TriangleAlert as AlertTriangle, RefreshCw, Calendar, Bug, Filter, X, Home, MapPin, Trophy, Minus, Equal, TrendingUp, Shield, Zap } from 'lucide-react';
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
// ← fuerza texto blanco por defecto (leyenda incluida)
ChartJS.defaults.color = 'rgba(255,255,255,0.85)';

type ResultType = 'win' | 'draw' | 'loss';

type TeamRow = {
  Date?: string;
  date?: string;
  Match?: string;
  match?: string;
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
  shots: number;
  shots_against?: number | null;
  xg: number;
  xg_against?: number | null;
  goals_for: number;
  goals_against: number;
  result: string;
  result_type: ResultType;
  season: string;
  chronologicalIndex?: number;
  dateISO?: string;
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
): { isHome: boolean; opponent: string; goals_for: number; goals_against: number; result: string; result_type: ResultType } | null => {
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
  const goals_for = isHome ? sL : sR;
  const goals_against = isHome ? sR : sL;

  let result_type: ResultType = 'draw';
  if (goals_for > goals_against) result_type = 'win';
  else if (goals_for < goals_against) result_type = 'loss';
  
  return { isHome, opponent, goals_for, goals_against, result: `${goals_for}-${goals_against}`, result_type };
};

const ShotsEvolution: React.FC = () => {
  // Paleta fija para líneas/áreas + colores de puntos por resultado
  const COLORS = {
    shots: '#2dd9fe',
    shotsAgainst: '#ff5161',
    xg: '#9461fd',
    xgAgainst: '#ff53cd',
    overlayShots: '#ffdb4e',
    overlayXg: '#9461fd',
    win: '#00C853',
    draw: '#FFB300',
    loss: '#E53935',
  } as const;

  const pointColorByResult = (rt?: ResultType) => {
    if (rt === 'win') return COLORS.win;
    if (rt === 'loss') return COLORS.loss;
    if (rt === 'draw') return COLORS.draw;
    return '#9e9e9e';
  };

  const findOpponentXG = (match: string, teamName: string, allTeams: any[]): number | null => {
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
    return opponentRow?.xG || opponentRow?.['xG'] || null;
  };

  const [teamRankings, setTeamRankings] = useState<TeamRankingsRecord[]>([]);
  const [matchesData, setMatchesData] = useState<MatchData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedTeam, setSelectedTeam] = useState<string>('Cavalry');
  const [selectedSeason, setSelectedSeason] = useState<string>('');
  const [showXG, setShowXG] = useState<boolean>(true);

  // Filtros
  const [filters, setFilters] = useState<{ round: string; venue: '' | 'home' | 'away'; result: '' | ResultType }>({
    round: '',
    venue: '',
    result: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [debugMode, setDebugMode] = useState(false);

  // Overlays: temporadas previas con promedios
  const [overlaySeasons, setOverlaySeasons] = useState<Record<string, boolean>>({});

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Rankings y datos por temporada
      const { data, error } = await supabase
        .from('team_rankings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const rankings = (data || []) as TeamRankingsRecord[];
      setTeamRankings(rankings);

      // Construir matches por equipo/temporada usando la misma lógica que Settings.tsx
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

          const matchStr = row.Match || row.match;
          const dateStr = row.Date || row.date || '';

          if (!matchStr) return;

          const teamShotsOnTarget = row['Shots on target'] || 0;
          const teamXG = row.xG || row['xG'] || 0;
          const teamShotsAgainst = row['Shots against on target'] || 0;

          const parsed = parseResult(matchStr, team.name);
          if (!parsed) return;

          const opponentXG = findOpponentXG(matchStr, team.name, allTeamsInSeason);

          all.push({
            match: matchStr,
            date: dateStr,
            round: row.round || '',
            opponent: row.opponent || parsed.opponent,
            isHome: typeof row.isHome === 'boolean' ? row.isHome : parsed.isHome,
            shots: teamShotsOnTarget,
            shots_against: teamShotsAgainst,
            xg: teamXG,
            xg_against: opponentXG,
            goals_for: parsed.goals_for,
            goals_against: parsed.goals_against,
            result: parsed.result,
            result_type: parsed.result_type,
            season,
          });
        });
      });

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
        return helpers.assignRoundsByDate(Array.from(dedup.values()));
      });

      setMatchesData(matchesWithRounds);

      const seasons = Array.from(new Set(all.map((m) => m.season))).sort().reverse();
      const defaultSeason = seasons.includes('2025') ? '2025' : seasons[0] || '2025';
      setSelectedSeason((prev) => prev || defaultSeason);

      const allSeasons = Array.from(new Set([...rankings.map((r) => safeSeason(r))])).sort();
      const initialOverlays: Record<string, boolean> = {};
      allSeasons
        .filter((y) => y !== defaultSeason)
        .filter((y) => {
          const seasonRecord = rankings.find((r) => safeSeason(r) === y);
          const teamInSeason = seasonRecord?.data?.teams?.find((t) =>
            t?.name && t.name.toLowerCase().includes(selectedTeam.toLowerCase())
          );
          return teamInSeason && teamInSeason.rows?.some((row: any) => {
            const hasShots = (row['Shots / on target'] || 0) > 0;
            const hasXG = (row['xG'] || 0) > 0;
            return hasShots || hasXG;
          });
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

  const availableSeasonsAll = useMemo(
    () => Array.from(new Set(teamRankings.map((r) => safeSeason(r)))).sort(),
    [teamRankings]
  );

  const seasonsWithRowsForTeam = useMemo(() => {
    const set = new Set<string>();
    teamRankings.forEach((rec) => {
      const season = safeSeason(rec);
      const team = rec.data?.teams?.find((t) => t?.name && t.name.toLowerCase().includes(selectedTeam.toLowerCase()));
      if (team?.rows?.some((row: any) => {
        const hasShots = (row['Shots / on target'] || 0) > 0;
        const hasXG = (row['xG'] || 0) > 0;
        return hasShots || hasXG;
      })) set.add(season);
    });
    return Array.from(set).sort();
  }, [teamRankings, selectedTeam]);

  const seasonalAveragesMap = useMemo(() => {
    const map: Record<string, { shots: number; xg: number }> = {};
    teamRankings.forEach((rec) => {
      const season = safeSeason(rec);
      const team = rec.data?.teams?.find((t) => t?.name && t.name.toLowerCase().includes(selectedTeam.toLowerCase()));
      if (!team) return;
      const shots = team.data?.['Shots / on target'] || 0;
      const xg = team.data?.['xG'] || 0;
      if (shots > 0 || xg > 0) {
        map[season] = { shots, xg };
      }
    });
    return map;
  }, [teamRankings, selectedTeam]);

  const seasonMatches = useMemo(() => {
    return matchesData.filter((m) => m.season === selectedSeason);
  }, [matchesData, selectedSeason]);

  const filteredMatches = useMemo(() => {
    let list = seasonMatches;
    if (filters.round) list = list.filter((m) => m.round === filters.round);
    if (filters.venue === 'home') list = list.filter((m) => m.isHome);
    else if (filters.venue === 'away') list = list.filter((m) => !m.isHome);
    if (filters.result) list = list.filter((m) => m.result_type === filters.result);

    return list.slice().sort((a, b) => {
      const ai = (a as any).chronologicalIndex;
      const bi = (b as any).chronologicalIndex;
      if (Number.isFinite(ai) && Number.isFinite(bi)) return bi - ai; // NEWEST FIRST
      const aISO = (a as any).dateISO || helpers.toISODateOrFallback(a.date, (a as any).season);
      const bISO = (b as any).dateISO || helpers.toISODateOrFallback(b.date, (b as any).season);
      return bISO.localeCompare(aISO); // NEWEST FIRST
    });
  }, [seasonMatches, filters]);

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

  const seasonAverageShots = useMemo(() => {
    if (!filteredMatches.length) return undefined;
    return filteredMatches.reduce((s, m) => s + m.shots, 0) / filteredMatches.length;
  }, [filteredMatches]);

  const seasonAverageXG = useMemo(() => {
    if (!filteredMatches.length) return undefined;
    return filteredMatches.reduce((s, m) => s + m.xg, 0) / filteredMatches.length;
  }, [filteredMatches]);

  const seasonAverageShotsAgainst = useMemo(() => {
    if (!filteredMatches.length) return undefined;
    const validMatches = filteredMatches.filter((m) => m.shots_against !== null && m.shots_against !== undefined);
    if (!validMatches.length) return undefined;
    return validMatches.reduce((s, m) => s + (m.shots_against || 0), 0) / validMatches.length;
  }, [filteredMatches]);

  const seasonAverageXGAgainst = useMemo(() => {
    if (!filteredMatches.length) return undefined;
    const validMatches = filteredMatches.filter((m) => m.xg_against !== null && m.xg_against !== undefined);
    if (!validMatches.length) return undefined;
    return validMatches.reduce((s, m) => s + (m.xg_against || 0), 0) / validMatches.length;
  }, [filteredMatches]);

  const overlayDatasets = useMemo(() => {
    const datasets: any[] = [];
    const n = filteredMatches.length || 1;
    Object.entries(overlaySeasons).forEach(([season, enabled]) => {
      if (!enabled) return;
      if (season === selectedSeason) return;
      const seasonData = seasonalAveragesMap[season];
      if (!seasonData) return;
      if (seasonData.shots > 0) {
        datasets.push({
          label: `Season ${season} Avg Shots on Target`,
          data: Array(n).fill(seasonData.shots),
          type: 'line' as const,
          borderColor: COLORS.overlayShots,
          backgroundColor: 'rgba(255, 219, 78, 0.15)',
          borderWidth: 2,
          pointRadius: 0,
          borderDash: [6, 6],
        });
      }
      if (showXG && seasonData.xg > 0) {
        datasets.push({
          label: `Season ${season} Avg xG`,
          data: Array(n).fill(seasonData.xg),
          type: 'line' as const,
          borderColor: COLORS.overlayXg,
          backgroundColor: 'rgba(148, 97, 253, 0.15)',
          borderWidth: 2,
          pointRadius: 0,
          borderDash: [8, 4],
        });
      }
    });
    return datasets;
  }, [overlaySeasons, seasonalAveragesMap, filteredMatches.length, selectedSeason, showXG]);

  const shotsChartData = useMemo(() => {
    if (!filteredMatches.length) return null;

    const datasets: any[] = [
      {
        label: `${selectedTeam} Shots on Target`,
        data: filteredMatches.map((m) => Number(m.shots.toFixed(1))),
        borderColor: COLORS.shots,
        backgroundColor: 'rgba(45, 217, 254, 0.15)',
        borderWidth: 3,
        tension: 0.65,
        fill: true,
        pointRadius: 5,
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointBackgroundColor: (ctx: any) => {
          const m = filteredMatches[ctx.dataIndex];
          return pointColorByResult(m?.result_type);
        },
      }
    ];

    const shotsAgainstData = filteredMatches.map((m) => m.shots_against);
    if (shotsAgainstData.some((val) => val !== null)) {
      datasets.push({
        label: `Opponents Shots on Target Against ${selectedTeam}`,
        data: shotsAgainstData.map((val) => (val != null ? Number((val as number).toFixed(1)) : null)),
        borderColor: COLORS.shotsAgainst,
        backgroundColor: 'rgba(255, 81, 97, 0.15)',
        borderWidth: 3,
        tension: 0.65,
        fill: true,
        pointRadius: 5,
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointBackgroundColor: (ctx: any) => {
          const m = filteredMatches[ctx.dataIndex];
          return pointColorByResult(m?.result_type);
        },
        spanGaps: true,
      });
    }

    if (showXG) {
      datasets.push({
        label: `${selectedTeam} xG`,
        data: filteredMatches.map((m) => Number(m.xg.toFixed(2))),
        borderColor: COLORS.xg,
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderDash: [8, 4],
        tension: 0.65,
        fill: false,
        pointRadius: 4,
        pointBorderColor: '#ffffff',
        pointBorderWidth: 1,
        pointBackgroundColor: (ctx: any) => {
          const m = filteredMatches[ctx.dataIndex];
          return pointColorByResult(m?.result_type);
        },
        spanGaps: true,
      });

      const xgAgainstData = filteredMatches.map((m) => m.xg_against);
      if (xgAgainstData.some((val) => val !== null)) {
        datasets.push({
          label: `Opponents xG Against ${selectedTeam}`,
          data: xgAgainstData.map((val) => (val != null ? Number((val as number).toFixed(2)) : null)),
          borderColor: COLORS.xgAgainst,
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderDash: [4, 8],
          tension: 0.65,
          fill: false,
          pointRadius: 3,
          pointBorderColor: '#ffffff',
          pointBorderWidth: 1,
          pointBackgroundColor: (ctx: any) => {
            const m = filteredMatches[ctx.dataIndex];
            return pointColorByResult(m?.result_type);
          },
          spanGaps: true,
        });
      }
    }

    datasets.push(...overlayDatasets);

    return {
      labels: filteredMatches.map((m) => `vs ${m.opponent}`),
      datasets,
    };
  }, [filteredMatches, selectedTeam, showXG, overlayDatasets]);

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    color: 'rgba(255,255,255,0.85)', // refuerzo local
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: 'rgba(255,255,255,0.85)',
          usePointStyle: false, // muestra de línea (coincide con borderColor)
          padding: 16,
        },
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
            const mData = filteredMatches[ctx.dataIndex];
            if (!mData) return [];

            const extraInfo = [
              `Result: ${mData.result ?? 'N/A'}`,
              `Goals: ${mData.goals_for}-${mData.goals_against}`,
              `Venue: ${mData.isHome ? 'Home' : 'Away'}`,
              `Round: ${mData.round ?? '-'}`,
            ];

            if (ctx.datasetIndex === 0) {
              extraInfo.push(`Shots on Target: ${mData.shots}`);
            } else if (ctx.datasetIndex === 1 && mData.shots_against != null) {
              extraInfo.push(`Opponent Shots on Target: ${mData.shots_against}`);
            } else if (ctx.datasetIndex === 2 && showXG) {
              extraInfo.push(`xG: ${mData.xg?.toFixed(2) ?? 'N/A'}`);
            } else if (ctx.datasetIndex === 3 && showXG && mData.xg_against != null) {
              extraInfo.push(`Opponent xG: ${mData.xg_against.toFixed(2)}`);
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
          text: showXG ? 'Shots on Target / xG per Match' : 'Shots on Target per Match',
          color: 'rgba(255,255,255,0.8)',
          font: { size: 12, weight: 'bold' as const }
        }
      },
    },
  };

  const activeFiltersCount = useMemo(() => Object.values(filters).filter(Boolean).length, [filters]);

  const resetFilters = () => setFilters({ round: '', venue: '', result: '' });

  const shotsStats = useMemo(() => {
    if (!filteredMatches.length) return null;
    const sortedByShots = [...filteredMatches].sort((a, b) => b.shots - a.shots);
    const sortedByXG = [...filteredMatches].sort((a, b) => b.xg - a.xg);
    const xgEfficiencyMatches = filteredMatches
      .filter(m => m.xg > 0)
      .map(m => ({ ...m, efficiency: m.goals_for / m.xg }))
      .sort((a, b) => b.efficiency - a.efficiency);
    const totalGoals = filteredMatches.reduce((sum, m) => sum + m.goals_for, 0);
    const totalXG = filteredMatches.reduce((sum, m) => sum + m.xg, 0);
    const goalsVsXGDiff = totalGoals - totalXG;
    return {
      bestShots: sortedByShots[0],
      worstShots: sortedByShots[sortedByShots.length - 1],
      bestXGMatch: sortedByXG[0],
      worstXGMatch: sortedByXG[sortedByXG.length - 1],
      bestXGEfficiency: xgEfficiencyMatches[0] || null,
      worstXGEfficiency: xgEfficiencyMatches[xgEfficiencyMatches.length - 1] || null,
      goalsVsXGDiff
    };
  }, [filteredMatches, showXG]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto mb-3" />
          <p className="text-sm text-text-secondary">Loading shots data…</p>
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
            <Target className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Shots & xG Evolution - {selectedTeam}</h1>
            <p className="text-text-secondary">Shooting performance and expected goals analysis</p>
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

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="show-xg"
              checked={showXG}
              onChange={(e) => setShowXG(e.target.checked)}
              className="rounded border-border bg-background"
            />
            <label htmlFor="show-xg" className="text-text-primary font-medium cursor-pointer">
              Show xG
            </label>
          </div>

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
              <h2 className="text-lg font-bold">Shots & xG Filters</h2>
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
          <Target className="h-5 w-5 text-secondary" />
          <p className="font-medium">Compare with previous seasons (Avg Shots{showXG ? ' & xG' : ''}):</p>
          <div className="flex flex-wrap gap-3">
            {Object.keys(seasonalAveragesMap)
              .filter((s) => s !== selectedSeason)
              .sort()
              .map((s) => (
                <label key={s} className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={!!overlaySeasons[s]}
                    onChange={(e) => setOverlaySeasons((prev) => ({ ...prev, [s]: e.target.checked }))}
                  />
                  <span>{s} (Shots: {Number(seasonalAveragesMap[s].shots).toFixed(1)}{showXG ? `, xG: ${Number(seasonalAveragesMap[s].xg).toFixed(2)}` : ''})</span>
                </label>
              ))}
          </div>
        </div>
      </div>

      {/* Chart */}
      {shotsChartData && filteredMatches.length ? (
        <div className="card p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Target className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">
                {selectedTeam} — Shots on Target{showXG ? ' & xG' : ''} per match ({selectedSeason})
              </h2>
              <p className="text-text-secondary">
                Showing {filteredMatches.length} matches
              </p>
            </div>
          </div>

          <div className="h-[420px] mb-6">
            <Line data={shotsChartData} options={chartOptions} />
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-background p-4 rounded-lg">
              <p className="text-sm text-text-secondary">{selectedTeam} Avg Shots on Target</p>
              <p className="text-2xl font-bold" style={{ color: '#2dd9fe' }}>{(seasonAverageShots ?? 0).toFixed(1)}</p>
            </div>
            {seasonAverageShotsAgainst && (
              <div className="bg-background p-4 rounded-lg">
                <p className="text-sm text-text-secondary">Opponents Avg Shots on Target</p>
                <p className="text-2xl font-bold" style={{ color: '#ff5161' }}>{seasonAverageShotsAgainst.toFixed(1)}</p>
              </div>
            )}
            {showXG && seasonAverageXG && (
              <div className="bg-background p-4 rounded-lg">
                <p className="text-sm text-text-secondary">{selectedTeam} Avg xG</p>
                <p className="text-2xl font-bold" style={{ color: '#9461fd' }}>{seasonAverageXG.toFixed(2)}</p>
              </div>
            )}
            {showXG && seasonAverageXGAgainst && (
              <div className="bg-background p-4 rounded-lg">
                <p className="text-sm text-text-secondary">Opponents Avg xG</p>
                <p className="text-2xl font-bold" style={{ color: '#ff53cd' }}>{seasonAverageXGAgainst.toFixed(2)}</p>
              </div>
            )}
            {showXG && shotsStats?.goalsVsXGDiff !== undefined && (
              <div className="bg-background p-4 rounded-lg">
                <p className="text-sm text-text-secondary">Goals vs xG Difference</p>
                <p className={`text-2xl font-bold ${shotsStats.goalsVsXGDiff >= 0 ? 'text-success' : 'text-error'}`}>
                  {shotsStats.goalsVsXGDiff >= 0 ? '+' : ''}{shotsStats.goalsVsXGDiff.toFixed(2)}
                </p>
              </div>
            )}
          </div>

          {/* Stats Cards */}
          {shotsStats && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-blue-500/10 p-4 rounded-lg border border-blue-500/20">
                <p className="text-sm font-medium" style={{ color: '#2dd9fe' }}>Most Shots on Target</p>
                <p className="text-2xl font-bold" style={{ color: '#2dd9fe' }}>{shotsStats.bestShots.shots}</p>
                <p className="text-xs text-success/80 mt-1">vs {shotsStats.bestShots.opponent}</p>
                <p className="text-xs text-success/60">{shotsStats.bestShots.date} • {shotsStats.bestShots.result}</p>
              </div>

              <div className="bg-blue-500/10 p-4 rounded-lg border border-blue-500/20">
                <p className="text-sm font-medium" style={{ color: '#2dd9fe' }}>Fewest Shots on Target</p>
                <p className="text-2xl font-bold" style={{ color: '#2dd9fe' }}>{shotsStats.worstShots.shots}</p>
                <p className="text-xs text-error/80 mt-1">vs {shotsStats.worstShots.opponent}</p>
                <p className="text-xs text-error/60">{shotsStats.worstShots.date} • {shotsStats.worstShots.result}</p>
              </div>

              {showXG && shotsStats.bestXGMatch && (
                <div className="bg-purple-500/10 p-4 rounded-lg border border-purple-500/20">
                  <p className="text-sm font-medium" style={{ color: '#9461fd' }}>Best xG Performance</p>
                  <p className="text-2xl font-bold" style={{ color: '#9461fd' }}>{shotsStats.bestXGMatch.xg.toFixed(2)}</p>
                  <p className="text-xs text-success/80 mt-1">vs {shotsStats.bestXGMatch.opponent}</p>
                  <p className="text-xs text-success/60">{shotsStats.bestXGMatch.date} • {shotsStats.bestXGMatch.result}</p>
                </div>
              )}

              {showXG && shotsStats.worstXGMatch && (
                <div className="bg-purple-500/10 p-4 rounded-lg border border-purple-500/20">
                  <p className="text-sm font-medium" style={{ color: '#9461fd' }}>Worst xG Performance</p>
                  <p className="text-2xl font-bold" style={{ color: '#9461fd' }}>{shotsStats.worstXGMatch.xg.toFixed(2)}</p>
                  <p className="text-xs text-error/80 mt-1">vs {shotsStats.worstXGMatch.opponent}</p>
                  <p className="text-xs text-error/60">{shotsStats.worstXGMatch.date} • {shotsStats.worstXGMatch.result}</p>
                </div>
              )}

              {showXG && shotsStats.bestXGEfficiency && (
                <div className="bg-purple-500/10 p-4 rounded-lg border border-purple-500/20">
                  <p className="text-sm font-medium" style={{ color: '#9461fd' }}>Best xG Efficiency (Goals/xG)</p>
                  <p className="text-2xl font-bold" style={{ color: '#9461fd' }}>{((shotsStats.bestXGEfficiency as any).efficiency).toFixed(2)}</p>
                  <p className="text-xs text-purple-400 mt-1">vs {shotsStats.bestXGEfficiency.opponent}</p>
                  <p className="text-xs text-purple-300">{shotsStats.bestXGEfficiency.date} • {shotsStats.bestXGEfficiency.result}</p>
                </div>
              )}

              {showXG && shotsStats.worstXGEfficiency && (
                <div className="bg-purple-500/10 p-4 rounded-lg border border-purple-500/20">
                  <p className="text-sm font-medium" style={{ color: '#9461fd' }}>Worst xG Efficiency (Goals/xG)</p>
                  <p className="text-2xl font-bold" style={{ color: '#9461fd' }}>{((shotsStats.worstXGEfficiency as any).efficiency).toFixed(2)}</p>
                  <p className="text-xs text-error/80 mt-1">vs {shotsStats.worstXGEfficiency.opponent}</p>
                  <p className="text-xs text-error/60">{shotsStats.worstXGEfficiency.date} • {shotsStats.worstXGEfficiency.result}</p>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-background p-8 rounded-lg border border-border text-center">
          <AlertTriangle className="h-12 w-12 text-warning mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">No shots data found</h3>
          <p className="text-text-secondary">
            Sube Team Data (2025) con <b>rows</b> que contengan columnas "Shots / on target" y \"xG\" para ver la evolución partido a partido.
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
            <p>Overlay seasons enabled: {Object.entries(overlaySeasons).filter(([,v])=>v).map(([k])=>k).join(', ') || '(none)'}</p>
            <p>Seasonal averages map: {JSON.stringify(seasonalAveragesMap)}</p>
            <p>Season average shots: {seasonAverageShots?.toFixed(1) || 'N/A'}</p>
            <p>Season average xG: {seasonAverageXG?.toFixed(2) || 'N/A'}</p>
            <p>Show xG: {showXG ? 'Yes' : 'No'}</p>
            <p>Season average shots against: {seasonAverageShotsAgainst?.toFixed(1) || 'N/A'}</p>
            <p>Season average xG against: {seasonAverageXGAgainst?.toFixed(2) || 'N/A'}</p>
            <p>Matches with shots against: {filteredMatches.filter(m => m.shots_against).length}</p>
            <p>Matches with xG against: {filteredMatches.filter(m => m.xg_against).length}</p>
            {shotsStats && (
              <>
                <p>Most shots on target: {shotsStats.bestShots.shots} vs {shotsStats.bestShots.opponent}</p>
                <p>Fewest shots on target: {shotsStats.worstShots.shots} vs {shotsStats.worstShots.opponent}</p>
                {showXG && shotsStats.bestXGMatch && (
                  <p>Best xG: {shotsStats.bestXGMatch.xg.toFixed(2)} vs {shotsStats.bestXGMatch.opponent}</p>
                )}
                {showXG && shotsStats.worstXGMatch && (
                  <p>Worst xG: {shotsStats.worstXGMatch.xg.toFixed(2)} vs {shotsStats.worstXGMatch.opponent}</p>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ShotsEvolution;
