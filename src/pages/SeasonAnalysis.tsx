import React, { useState, useEffect, useMemo } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  TrendingUp, 
  Users, 
  Trophy, 
  ArrowRight, 
  AlertTriangle,
  Target,
  Goal,
  Award
} from 'lucide-react';
import { PolarArea } from 'react-chartjs-2';
import { Chart as ChartJS, RadialLinearScale, ArcElement, Tooltip, Legend } from 'chart.js';

// Register Chart.js components
ChartJS.register(RadialLinearScale, ArcElement, Tooltip, Legend);

interface TeamData {
  name: string;
  data: {
    [key: string]: number | string;
  };
}
 
interface PlayerData {
  Player: string;
  Team: string;
  Position: string;
  'Minutes played': number;
  'Goals per 90': number;
  'Assists per 90': number;
  'Goals': number;
  'Assists': number;
  'Yellow cards': number;
  'Red cards': number;
  'Matches played': number;
  MappedPositions?: string[];
  __goals?: number;
  __assists?: number;
  __yellows?: number;
  __reds?: number;
  __minutes?: number;
  __matches?: number;
  [key: string]: any;
}

// Radar metrics
const cavalryRadarMetrics = [
  { label: 'Goals', value: 'Goals' },
  { label: 'xG', value: 'xG' },
  { label: 'Possession %', value: 'Possession, %' },
  { label: 'Passes Accurate %', value: 'Passes accurate, %'},
  { label: 'PPDA', value: 'PPDA' },
  { label: 'Defensive Duels Won %', value: 'Defensive duels won, %' },
  { label: 'Goals Conceded', value: 'Conceded goals' },
  { label: 'Shots on Target %', value: 'Shots on target, %'}
];

// Metrics by type
const percentageMetrics = new Set([
  'Possession, %',
  'Passes accurate, %',
  'Defensive duels won, %',
  'Shots on target, %'
]);

const per90Metrics = new Set([
  'Goals per 90',
  'Assists per 90',
  'xG per 90',
  'Shots per 90'
]);

// Position mapping
const positionMapping: Record<string, string> = {
  'GK': 'Goalkeeper',
  'LB': 'Defender',
  'LWB': 'Defender', 
  'RB': 'Defender',
  'RWB': 'Defender',
  'CB': 'Defender',
  'DF': 'Defender',
  'LCB': 'Defender',
  'RCB': 'Defender',
  'DMF': 'Midfielder',
  'CMF': 'Midfielder',
  'MF': 'Midfielder',
  'AMF': 'Midfielder',
  'LDMF': 'Midfielder',
  'RDMF': 'Midfielder',
  'LAMF': 'Midfielder',
  'RAMF': 'Midfielder',
  'LM': 'Midfielder',
  'RM': 'Midfielder',
  'LW': 'Winger',
  'LWF': 'Winger',
  'RW': 'Winger',
  'RWF': 'Winger',
  'CF': 'Forward',
  'ST': 'Forward',
  'FW': 'Forward',
  'SS': 'Forward'
};

const SeasonAnalysis: React.FC = () => {
  const [teamData, setTeamData] = useState<TeamData[]>([]);
  const [playerData, setPlayerData] = useState<PlayerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Supabase client is already configured and validated

      const { data: teamRankings } = await supabase
        .from('team_rankings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

      if (teamRankings && teamRankings.length > 0) {
        setTeamData(teamRankings[0].data.teams || []);
      }

      const { data: playerDataResult } = await supabase
        .from('player_data')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

      if (playerDataResult && playerDataResult.length > 0) {
        const processedData = (playerDataResult[0].data || []).map((player: any) => {
          if (!player.MappedPositions || !Array.isArray(player.MappedPositions)) {
            const positions = String(player.Position || '').split(',').map((pos: string) => pos.trim());
            const mappedPositions = new Set<string>();
            positions.forEach((pos: string) => {
              const directMapping = positionMapping[pos as keyof typeof positionMapping];
              if (directMapping) mappedPositions.add(directMapping);
            });
            player.MappedPositions = Array.from(mappedPositions);
          }

          const pickNumber = (obj: any, keys: string[]) => {
            for (const k of keys) {
              if (obj.hasOwnProperty(k)) {
                const raw = obj[k];
                if (raw !== undefined && raw !== null && String(raw).trim() !== '') {
                  const num = Number(raw);
                  if (!isNaN(num)) {
                    return Math.round(num);
                  }
                  const m = String(raw).match(/-?\d+(\.\d+)?/);
                  if (m) return Math.round(Number(m[0]));
                }
              }
            }
            return 0;
          };

          const numberFromAny = (obj: any, predicate: (k: string) => boolean) => {
            let best = 0;
            for (const k of Object.keys(obj)) {
              if (predicate(k)) {
                const m = String(obj[k] ?? '').match(/-?\d+(\.\d+)?/);
                if (m) best = Math.max(best, Number(m[0]));
              }
            }
            return best;
          };

          player.__goals   = pickNumber(player, ['Goals', 'Goles']);
          player.__assists = pickNumber(player, ['Assists', 'Asistencias']);
          player.__yellows = pickNumber(player, ['Yellow cards', 'Yellow Cards', 'Yellows']);
          player.__reds    = pickNumber(player, ['Red cards', 'Red Cards', 'Reds']);
          player.__minutes = pickNumber(player, ['Minutes played', 'Minutos jugados']);
          player.__matches = pickNumber(player, ['Matches played', 'Apps', 'Appearances']);
          player.Player    = player.Player ?? player.Name ?? '';
          player.Team      = player.Team ?? player['Team within selected timeframe'] ?? player.Club ?? '';

          return player;
        });
        setPlayerData(processedData);
      }
    } catch (err: any) {
      setError(`Failed to load data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const cavalryRadarData = useMemo(() => {
    if (!teamData.length) return null;

    const cavalryTeam = teamData.find(team => 
      team.name.toLowerCase().includes('cavalry')
    );
    if (!cavalryTeam) return null;

    const radarData = cavalryRadarMetrics.map(metric => {
      const allValues = teamData.map(team => {
        const v = team.data[metric.value];
        return typeof v === 'number' ? v : Number(v) || 0;
      });

      const rawVal = cavalryTeam.data[metric.value];
      const cavalryValue = typeof rawVal === 'number' ? rawVal : Number(rawVal) || 0;

      const sortedValues = [...allValues].sort((a, b) => a - b);
      const rank = sortedValues.findIndex(v => v >= cavalryValue) + 1;
      let percentile = (rank / sortedValues.length) * 100;

      if (metric.value === 'PPDA' || metric.value === 'Conceded goals') { 
        percentile = 100 - percentile;
      }

      let color = '#ffdb4e';
      if (percentile >= 70) color = '#00fe9b';
      else if (percentile <= 30) color = '#ff5161';

      return {
        label: metric.label,
        value: percentile,
        originalValue: cavalryValue,
        color,
        valueKey: metric.value
      };
    });

    return {
      labels: radarData.map(d => d.label),
      datasets: [{
        label: 'Cavalry FC Performance',
        data: radarData.map(d => d.value),
        backgroundColor: radarData.map(d => `${d.color}40`),
        borderColor: radarData.map(d => d.color),
        borderWidth: 2,
        pointBackgroundColor: radarData.map(d => d.color),
        pointBorderColor: radarData.map(d => d.color),
        pointRadius: 6
      }],
      radarData
    };
  }, [teamData]);

  const squadStats = useMemo(() => {
    if (!playerData.length) return null;

    const isCavalryPlayer = (player: any): boolean => {
      const teamFields = [
        player.Team,
        player['Team within selected timeframe'],
        player.Club,
        player.TeamName
      ];
      return teamFields.some(field => {
        if (!field) return false;
        return String(field).toLowerCase().includes('cavalry');
      });
    };

    const cavalryPlayers = playerData.filter(isCavalryPlayer);
    if (!cavalryPlayers.length) return null;

    const topScorers = [...cavalryPlayers]
      .filter(p => (p.__goals ?? 0) > 0)
      .sort((a, b) => (b.__goals ?? 0) - (a.__goals ?? 0))
      .slice(0, 5);

    const topAssists = [...cavalryPlayers]
      .filter(p => (p.__assists ?? 0) > 0)
      .sort((a, b) => (b.__assists ?? 0) - (a.__assists ?? 0))
      .slice(0, 5);

    const topYellowCards = [...cavalryPlayers]
      .filter(p => (p.__yellows ?? 0) > 0)
      .sort((a, b) => (b.__yellows ?? 0) - (a.__yellows ?? 0))
      .slice(0, 5);

    const topRedCards = [...cavalryPlayers]
      .filter(p => (p.__reds ?? 0) > 0)
      .sort((a, b) => (b.__reds ?? 0) - (a.__reds ?? 0))
      .slice(0, 5);

    return {
      topScorers,
      topAssists,
      topYellowCards,
      topRedCards
    };
  }, [playerData]);

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
        pointLabels: {
          color: 'rgba(255, 255, 255, 0.8)',
          font: { size: 12, weight: 'bold' as const }
        },
        ticks: {
          backdropColor: 'transparent',
          color: 'rgba(255, 255, 255, 0.6)',
          z: 1
        },
        suggestedMin: 0,
        suggestedMax: 100
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        callbacks: {
          label: function(context: any) {
            const dataIndex = context.dataIndex;
            const rd = (cavalryRadarData as any)?.radarData?.[dataIndex];
            if (rd) {
              const isPercentage = percentageMetrics.has(rd.valueKey) || rd.label.includes('%');
              const isPer90 = per90Metrics.has(rd.valueKey) || rd.label.includes('per 90');
              if (isPercentage) {
                return `${rd.label}: ${rd.originalValue.toFixed(2)}% (${context.raw.toFixed(1)}th pct)`;
              } else if (isPer90) {
                return `${rd.label}: ${rd.originalValue.toFixed(2)} per 90 (${context.raw.toFixed(1)}th pct)`;
              }
              return `${rd.label}: ${rd.originalValue.toFixed(2)} (${context.raw.toFixed(1)}th pct)`;
            }
            return `${context.raw.toFixed(1)}%`;
          }
        }
      }
    }
  };

  const getPositionDisplay = (player: PlayerData): string => {
    if (player.MappedPositions && player.MappedPositions.length > 0) {
      return player.MappedPositions[0];
    }
    return positionMapping[player.Position] || player.Position || 'Unknown';
  };

  const getPositionColor = (position: string): string => {
    switch (position) {
      case 'Goalkeeper': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'Defender':   return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'Midfielder': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'Winger':     return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'Forward':    return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:           return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
    </div>;
  }

  if (location.pathname !== '/season-analysis') {
    return <Outlet />;
  }

  return (
    <div className="space-y-8 p-6">
      {error && (
        <div className="bg-error/10 border border-error/30 text-error px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Radar */}
      {cavalryRadarData && (
        <div className="card p-6">
          <h2 className="text-2xl font-bold mb-4">Cavalry FC Performance vs League</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-[400px]">
              <PolarArea data={cavalryRadarData} options={radarOptions} />
            </div>
            <div className="space-y-3">
              {(cavalryRadarData as any).radarData.map((m: any, i: number) => {
                const isPercentage = percentageMetrics.has(m.valueKey) || m.label.includes('%');
                const isPer90 = per90Metrics.has(m.valueKey) || m.label.includes('per 90');
                return (
                  <div key={i} className="flex items-center justify-between p-3 bg-background rounded-lg">
                    <span>{m.label}</span>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-mono text-sm">
                          {isPercentage
                            ? `${m.originalValue.toFixed(2)}%`
                            : isPer90
                              ? `${m.originalValue.toFixed(2)} per 90`
                              : m.originalValue.toFixed(2)}
                        </div>
                        <div className="text-xs text-text-secondary">{m.value.toFixed(0)}th percentile</div>
                      </div>
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: m.color }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Squad Stats */}
      {squadStats && (
        <div className="card p-6">
          <h2 className="text-2xl font-bold mb-6">Squad Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top Scorers */}
            {(squadStats.topScorers?.length ?? 0) > 0 && (
              <div className="bg-success/10 p-6 rounded-lg">
                <h3 className="font-semibold text-success mb-3">Top 5 Scorers</h3>
                {squadStats.topScorers.map((p: PlayerData, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-background rounded-lg">
                    <span>{p.Player}</span>
                    <span className="font-mono text-success font-bold">{p.__goals}</span>
                  </div>
                ))}
              </div>
            )}
            {/* Top Assists */}
            {(squadStats.topAssists?.length ?? 0) > 0 && (
              <div className="bg-primary/10 p-6 rounded-lg">
                <h3 className="font-semibold text-primary mb-3">Top 5 Assists</h3>
                {squadStats.topAssists.map((p: PlayerData, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-background rounded-lg">
                    <span>{p.Player}</span>
                    <span className="font-mono text-primary font-bold">{p.__assists}</span>
                  </div>
                ))}
              </div>
            )}
            {/* Yellow Cards */}
            {(squadStats.topYellowCards?.length ?? 0) > 0 && (
              <div className="bg-warning/10 p-6 rounded-lg">
                <h3 className="font-semibold text-warning mb-3">Top 5 Yellow Cards</h3>
                {squadStats.topYellowCards.map((p: PlayerData, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-background rounded-lg">
                    <span>{p.Player}</span>
                    <span className="font-mono text-warning font-bold">{p.__yellows}</span>
                  </div>
                ))}
              </div>
            )}
            {/* Red Cards */}
            {(squadStats.topRedCards?.length ?? 0) > 0 && (
              <div className="bg-error/10 p-6 rounded-lg">
                <h3 className="font-semibold text-error mb-3">Top 5 Red Cards</h3>
                {squadStats.topRedCards.map((p: PlayerData, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-background rounded-lg">
                    <span>{p.Player}</span>
                    <span className="font-mono text-error font-bold">{p.__reds}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SeasonAnalysis; 
