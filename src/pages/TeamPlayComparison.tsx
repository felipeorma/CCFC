import React, { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Download, ArrowLeftRight, RefreshCw, AlertTriangle, Trophy, Shield, Zap, BarChart3, Shuffle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { toPng } from 'html-to-image';
import { PolarArea } from 'react-chartjs-2';
import { Chart as ChartJS, RadialLinearScale, ArcElement, Tooltip, Legend } from 'chart.js';
import { parseFixture, assignRoundsByDate } from '../utils/helpers';

// Register the required Chart.js components
ChartJS.register(RadialLinearScale, ArcElement, Tooltip, Legend);

interface TeamData {
  name: string;
  data: { [key: string]: number };
  rows?: any[];
}

interface TeamRankingsData {
  id: string;
  data: { teams: TeamData[] };
  created_at: string;
}

// Define team-specific neon colors based on CPL team colors
const teamColors: Record<string, { fill: string, border: string, glow: string }> = {
  Cavalry: { fill: 'rgba(200, 16, 46, 0.7)', border: '#C8102E', glow: '#C8102E' },
  Forge: { fill: 'rgba(255, 140, 0, 0.7)', border: '#FF8C00', glow: '#FF8C00' },
  'Atlético Ottawa': { fill: 'rgba(39, 46, 97, 0.7)', border: '#272E61', glow: '#272E61' },
  'Pacific FC': { fill: 'rgba(106, 64, 153, 0.7)', border: '#6A4099', glow: '#6A4099' },
  'Valour FC': { fill: 'rgba(122, 0, 60, 0.7)', border: '#7A003C', glow: '#7A003C' },
  'York United FC': { fill: 'rgba(0, 122, 51, 0.7)', border: '#007A33', glow: '#007A33' },
  'HFX Wanderers FC': { fill: 'rgba(0, 99, 190, 0.7)', border: '#0063BE', glow: '#0063BE' },
  'Vancouver FC': { fill: 'rgba(0, 175, 176, 0.7)', border: '#00AFB0', glow: '#00AFB0' }
};

// Fallback neon colors
const neonColors = {
  red: { fill: 'rgba(255, 81, 97, 0.7)', border: '#FF5161', glow: '#D30302' },
  pink: { fill: 'rgba(255, 83, 205, 0.7)', border: '#FF53cd', glow: '#e10361' },
  purple: { fill: 'rgba(148, 97, 253, 0.7)', border: '#9461fd', glow: '#4003e6' },
  blue: { fill: 'rgba(45, 217, 254, 0.7)', border: '#2dd9fe', glow: '#00a3d5' },
  green: { fill: 'rgba(0, 254, 155, 0.7)', border: '#00fe9b', glow: '#02c435' },
  yellow: { fill: 'rgba(255, 219, 78, 0.7)', border: '#ffdb4e', glow: '#b48505' }
};
const neonColorArray = Object.values(neonColors);

// =============================
// Play style metrics (headers EXACTOS)
// =============================
const playStyleMetrics = {
  Possession: [
    { label: 'Possession, %', value: 'Possession, %', invert: false },
    { label: 'Passes accurate, %', value: 'Passes accurate, %', invert: false },
    { label: 'Average passes per possession', value: 'Average passes per possession', invert: false },
    { label: 'Long pass %', value: 'Long pass %', invert: false },
    { label: 'Match tempo', value: 'Match tempo', invert: false },
    { label: 'Progressive passes accurate, %', value: 'Progressive passes accurate, %', invert: false }
  ],
  Attack: [
    { label: 'Goals', value: 'Goals', invert: false },
    { label: 'xG', value: 'xG', invert: false },
    { label: 'Shots on target, %', value: 'Shots on target, %', invert: false },
    { label: 'Positional attacks with shots, %', value: 'Positional attacks with shots, %', invert: false },
    { label: 'Counterattacks with shots, %', value: 'Counterattacks with shots, %', invert: false },
    { label: 'Touches in penalty area', value: 'Touches in penalty area', invert: false }
  ],
  Defense: [
    { label: 'PPDA (lower is better)', value: 'PPDA', invert: true },
    { label: 'Defensive duels won, %', value: 'Defensive duels won, %', invert: false },
    { label: 'Aerial duels won, %', value: 'Aerial duels won, %', invert: false },
    { label: 'Interceptions', value: 'Interceptions', invert: false },
    { label: 'Recoveries', value: 'Recoveries', invert: false }, // también puedes usar: 'Recoveries / High'
    { label: 'Conceded goals (lower is better)', value: 'Conceded goals', invert: true }
  ],
  'Set Pieces': [
    { label: 'Corners with shots, %', value: 'Corners with shots, %', invert: false },
    { label: 'Free kicks with shots, %', value: 'Free kicks with shots, %', invert: false },
    { label: 'Penalties converted, %', value: 'Penalties converted, %', invert: false },
    { label: 'Set pieces with shots, %', value: 'Set pieces with shots, %', invert: false }
  ]
} as const;

// Descripciones (claves alineadas a headers)
function getMetricDescription(metricValue: string): string {
  const d: Record<string, string> = {
    'Possession, %': 'Ball possession percentage.',
    'Passes accurate, %': 'Percentage of successful passes.',
    'Average passes per possession': 'Average number of passes before losing possession.',
    'Long pass %': 'Percentage of all passes that are long.',
    'Match tempo': 'Average time between actions/possessions.',
    'Progressive passes accurate, %': 'Success rate of progressive passes.',
    Goals: 'Total goals scored.',
    xG: 'Expected goals based on shot quality.',
    'Shots on target, %': 'Share of shots that hit the target.',
    'Positional attacks with shots, %': 'Structured attacks that end with a shot.',
    'Counterattacks with shots, %': 'Counters that end with a shot.',
    'Touches in penalty area': 'Touches in the opponent box.',
    PPDA: 'Passes allowed per defensive action (lower = more aggressive).',
    'Defensive duels won, %': 'Share of defensive duels won.',
    'Aerial duels won, %': 'Share of aerial duels won.',
    Interceptions: 'Number of interceptions.',
    Recoveries: 'Total ball recoveries.',
    'Recoveries / High': 'Ball recoveries in attacking third.',
    'Conceded goals': 'Total goals conceded.',
    'Corners with shots, %': 'Corners that end with a shot.',
    'Free kicks with shots, %': 'Free kicks that end with a shot.',
    'Penalties converted, %': 'Penalty conversion rate.',
    'Set pieces with shots, %': 'Set-piece situations that end with a shot.'
  };
  return d[metricValue] || 'Performance metric.';
}

const TeamPlayComparison: React.FC = () => {
  const [teamRankings, setTeamRankings] = useState<TeamRankingsData[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<keyof typeof playStyleMetrics>('Possession');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [normalizedData, setNormalizedData] = useState<{[team: string]: {[metric: string]: number}}>({});
  const chartRef = useRef<HTMLDivElement>(null);
  const [availableColumns, setAvailableColumns] = useState<string[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [teamMatches, setTeamMatches] = useState<any[]>([]);
  const [showTeamMatches, setShowTeamMatches] = useState(false);

  useEffect(() => {
    fetchTeamRankings();
  }, []);

  const fetchTeamRankings = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        throw new Error('Supabase configuration missing. Please connect to Supabase using the "Connect to Supabase" button in the top right corner.');
      }

      const { data, error } = await supabase
        .from('team_rankings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setTeamRankings(data || []);

      if (data && data.length > 0 && data[0].data.teams.length >= 2) {
        setSelectedTeams([data[0].data.teams[0].name, data[0].data.teams[1].name]);
      }

      if (data && data.length > 0) {
        // Normalización global a percentiles (usa headers exactos)
        normalizeDataToPercentiles(data[0].data.teams);

        // Debug: columnas disponibles
        const firstTeam = data[0].data.teams[0];
        const columns = Object.keys(firstTeam.data || {}).sort();
        setAvailableColumns(columns);
        console.log('=== AVAILABLE COLUMNS IN TEAM COMPARISON ===');
        console.log('Total columns:', columns.length);
        columns.forEach((col, idx) => console.log(`${idx + 1}. "${col}"`));
        console.log('=== END AVAILABLE COLUMNS ===');
      }

      // Selección por defecto para análisis de partidos
      if (data && data.length > 0 && data[0].data.teams.length > 0) {
        const cav = data[0].data.teams.find((t: any) => t.name.toLowerCase().includes('cavalry'));
        if (cav) {
          setSelectedTeam(cav.name);
          processTeamMatches(cav);
        }
      }
    } catch (err: any) {
      console.error('Error fetching team rankings:', err);
      if (err.message?.includes('Failed to fetch') || err.name === 'TypeError') {
        setError('Unable to connect to database. Please check your internet connection and ensure Supabase is properly configured. Click the "Connect to Supabase" button in the top right if needed.');
      } else if (err.message?.includes('Supabase configuration')) {
        setError(err.message);
      } else {
        setError(`Failed to load team rankings: ${err.message || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Encuentra un valor de métrica respetando el header exacto con tolerancias
  const findMetricValue = (team: TeamData, metricKey: string): number | undefined => {
    if (!team?.data) return undefined;

    if (team.data[metricKey] !== undefined) return team.data[metricKey];

    const keys = Object.keys(team.data);

    const exact = keys.find(k => k === metricKey);
    if (exact) return team.data[exact];

    const lower = metricKey.toLowerCase();
    const caseInsensitive = keys.find(k => k.toLowerCase() === lower);
    if (caseInsensitive) return team.data[caseInsensitive];

    const normalized = lower.replace(/[^a-z0-9]/g, '');
    const normalizedMatch = keys.find(k => k.toLowerCase().replace(/[^a-z0-9]/g, '') === normalized);
    if (normalizedMatch) return team.data[normalizedMatch];

    return undefined;
  };

  // Normaliza todas las métricas definidas a percentiles (0-100)
  const normalizeDataToPercentiles = (teams: TeamData[]) => {
    const store: {[team: string]: {[metric: string]: number}} = {};
    teams.forEach(team => { store[team.name] = {}; });

    const allMetrics = Object.values(playStyleMetrics).flat();

    allMetrics.forEach(m => {
      const metric = m.value;
      const invert = m.invert;

      const values = teams.map(t => findMetricValue(t, metric) ?? 0);

      teams.forEach(t => {
        const v = findMetricValue(t, metric) ?? 0;
        let pct = calculatePercentile(v, values);
        if (invert) pct = 100 - pct;
        store[t.name][metric] = pct;
      });
    });

    setNormalizedData(store);
  };

  // Procesa filas de partidos (rows) usando headers exactos
  const processTeamMatches = (team: TeamData) => {
    if (!team.rows || !Array.isArray(team.rows)) {
      setTeamMatches([]);
      return;
    }

    const matchRows = team.rows.filter(row =>
      row.match &&
      typeof row.match === 'string' &&
      row.match.includes(' - ') &&
      row.match.includes(':')
    );

    const withRounds = assignRoundsByDate(matchRows);

    const processed = withRounds.map((row: any, index: number) => {
      const parsed = parseFixture(row.match, team.name);

      return {
        id: `${team.name}-${index}`,
        match: row.match,
        date: row.date || '',
        round: row.round || `Round ${Math.floor(index / 7) + 1}`,
        opponent: parsed?.opponent || 'Unknown',
        isHome: parsed?.isHome || false,
        goals_for: parsed?.teamGoals || 0,
        goals_against: parsed?.oppGoals || 0,
        result: `${parsed?.teamGoals || 0}-${parsed?.oppGoals || 0}`,
        result_type:
          (parsed?.teamGoals ?? 0) > (parsed?.oppGoals ?? 0) ? 'win' :
          (parsed?.teamGoals ?? 0) === (parsed?.oppGoals ?? 0) ? 'draw' : 'loss',
        // métricas con headers exactos
        possession: row['Possession, %'] || 0,
        shots_on_target: row['Shots on target'] || 0,
        xg: row['xG'] || 0,
        ppda: row['PPDA'] || 0,
        passes_accurate: row['Passes accurate'] || 0,
        defensive_duels_won: row['Defensive duels won'] || 0,
        ...row
      };
    });

    setTeamMatches(processed);
  };

  // Percentil (incluye empates con 0.5)
  const calculatePercentile = (value: number, array: number[]): number => {
    if (array.length === 0) return 0;
    const less = array.filter(v => v < value).length;
    const equal = array.filter(v => v === value).length;
    return ((less + 0.5 * equal) / array.length) * 100;
  };

  const availableTeams = teamRankings.length > 0
    ? teamRankings[0].data.teams.map(t => t.name)
    : [];

  const selectedTeamsData = teamRankings.length > 0
    ? teamRankings[0].data.teams.filter(t => selectedTeams.includes(t.name))
    : [];

  const categoryMetrics = playStyleMetrics[selectedCategory] || [];

  const chartData = {
    labels: categoryMetrics.map(m => m.label),
    datasets: selectedTeamsData.map((team, index) => {
      const color = teamColors[team.name] || neonColorArray[index % neonColorArray.length];
      return {
        label: team.name,
        data: categoryMetrics.map(m => {
          const key = m.value;
          if (normalizedData[team.name]?.[key] !== undefined) {
            return normalizedData[team.name][key];
          }
          const v = findMetricValue(team, key) ?? 0;
          const values = selectedTeamsData.map(t => findMetricValue(t, key) ?? 0);
          let pct = calculatePercentile(v, values);
          if (m.invert) pct = 100 - pct;
          return pct;
        }),
        backgroundColor: color.fill,
        borderColor: color.border,
        borderWidth: 2,
        hoverBackgroundColor: color.fill,
        hoverBorderColor: color.border,
        hoverBorderWidth: 3
      };
    })
  };

  const chartOptions = {
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
        ticks: { backdropColor: 'transparent', color: 'rgba(255, 255, 255, 0.6)', z: 1 },
        suggestedMin: 0,
        suggestedMax: 100
      }
    },
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: 'rgba(255, 255, 255, 0.8)',
          font: { size: 12 },
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'rgba(255, 255, 255, 1)',
        bodyColor: 'rgba(255, 255, 255, 0.9)',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        callbacks: {
          label: (context: any) => {
            const metric = categoryMetrics[context.dataIndex];
            const pct = context.raw;
            const team = selectedTeamsData.find(t => t.name === context.dataset.label);
            const originalValue = team ? findMetricValue(team, metric.value) : undefined;
            return `${context.dataset.label}: ${pct.toFixed(1)}% (Value: ${originalValue !== undefined ? Number(originalValue).toFixed(2) : 'N/A'})`;
          }
        }
      }
    },
    elements: { arc: { borderWidth: 2 } }
  };

  const handleTeamSelect = (team: string) => {
    if (selectedTeams.includes(team)) {
      setSelectedTeams(prev => prev.filter(t => t !== team));
    } else if (selectedTeams.length < 4) {
      setSelectedTeams(prev => [...prev, team]);
    }
  };

  const downloadChart = async () => {
    if (!chartRef.current) return;
    try {
      const dataUrl = await toPng(chartRef.current, { quality: 0.95, backgroundColor: '#121212' });
      const link = document.createElement('a');
      link.download = `team-play-comparison-${String(selectedCategory).toLowerCase()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error downloading chart:', err);
      setError('Failed to download chart image');
    }
  };

  const randomizeTeams = () => {
    if (availableTeams.length <= 1) return;
    const shuffled = [...availableTeams].sort(() => 0.5 - Math.random());
    setSelectedTeams(shuffled.slice(0, Math.min(4, availableTeams.length)));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-background-light rounded-lg shadow-lg border border-background-lighter p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <ArrowLeftRight className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-text-primary">Team Play Comparison</h2>
          </div>

          {error && (
            <div className="bg-error/10 text-error px-4 py-2 rounded-lg flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
              <Button variant="ghost" size="sm" onClick={fetchTeamRankings} className="ml-2 h-7 w-7 p-0">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {teamRankings.length === 0 ? (
          <div className="bg-background p-8 rounded-lg border border-border text-center">
            <AlertTriangle className="h-12 w-12 text-warning mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No Season Data Available</h3>
            <p className="text-text-secondary mb-4">
              Please upload team data files in the Settings page to view team play style comparisons.
            </p>
            <p className="text-sm text-text-secondary">
              Data uploaded in Settings will be used for team play style analysis and comparison.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-text-primary mb-2 block">Play Style Category</Label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.keys(playStyleMetrics).map(category => (
                    <button
                      key={category}
                      className={`p-3 rounded-lg border transition-colors ${
                        selectedCategory === category
                          ? 'border-primary bg-primary/10 text-white'
                          : 'border-border hover:border-primary text-text-secondary'
                      }`}
                      onClick={() => setSelectedCategory(category as keyof typeof playStyleMetrics)}
                    >
                      <div className="flex items-center gap-2">
                        {category === 'Possession' && <BarChart3 className="h-4 w-4" />}
                        {category === 'Attack' && <Zap className="h-4 w-4" />}
                        {category === 'Defense' && <Shield className="h-4 w-4" />}
                        {category === 'Set Pieces' && <Trophy className="h-4 w-4" />}
                        <span>{category}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-text-primary">Select Teams (max 4)</Label>
                  <Button variant="outline" size="sm" onClick={randomizeTeams} className="h-7 px-2">
                    <Shuffle className="h-3 w-3 mr-1" />
                    Random
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto pr-2">
                  {availableTeams.map(team => (
                    <div
                      key={team}
                      className={`p-2 rounded border text-sm cursor-pointer transition-colors ${
                        selectedTeams.includes(team)
                          ? 'border-primary bg-primary/10 text-white'
                          : 'border-border hover:border-primary text-text-secondary'
                      }`}
                      onClick={() => handleTeamSelect(team)}
                      style={{
                        borderColor: selectedTeams.includes(team) ? teamColors[team]?.border || 'var(--primary)' : undefined,
                        backgroundColor: selectedTeams.includes(team) ? `${teamColors[team]?.fill || 'rgba(200, 16, 46, 0.1)'}` : undefined
                      }}
                    >
                      {team}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div ref={chartRef} className="bg-background p-6 rounded-lg border border-border">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">{selectedCategory} Style Comparison (Percentiles)</h3>
                <Button variant="outline" size="sm" onClick={downloadChart} disabled={selectedTeams.length === 0}>
                  <Download className="h-4 w-4 mr-2" />
                  Download Chart
                </Button>
              </div>

              {selectedTeams.length === 0 ? (
                <div className="text-center py-12 text-text-secondary">
                  <ArrowLeftRight className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>Select teams to compare their play styles</p>
                </div>
              ) : (
                <div className="h-[500px]">
                  <PolarArea data={chartData} options={chartOptions} />
                </div>
              )}

              <div className="mt-4">
                <h4 className="text-sm font-medium text-text-secondary mb-2">Metrics Explanation:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {categoryMetrics.map(metric => (
                    <div key={metric.value} className="text-xs text-text-secondary flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                      <span className="font-medium">{metric.label}:</span>
                      <span>{getMetricDescription(metric.value)}</span>
                      {metric.invert && <span className="text-warning">(Lower is better, values inverted)</span>}
                    </div>
                  ))}
                </div>
                <div className="mt-2 p-2 bg-background-lighter rounded-lg">
                  <p className="text-xs text-text-secondary">
                    <strong>Note:</strong> All values are normalized to percentiles (0–100%) for fair comparison.
                    Percentile 90% = mejor que el 90% de equipos en esa métrica. Para métricas donde
                    menor es mejor (ej. PPDA, Conceded goals), el percentil se invierte.
                  </p>
                </div>
              </div>
            </div>

            {/* Tabla comparativa */}
            <div className="bg-background p-4 rounded-lg border border-border">
              <h3 className="text-lg font-semibold mb-4">Team Comparison Table</h3>
              {selectedTeams.length === 0 ? (
                <div className="text-center py-8 text-text-secondary">
                  <p>Select teams to view comparison table</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-background-lighter">
                        <th className="p-2 text-left">Metric</th>
                        {selectedTeamsData.map((team, index) => (
                          <th
                            key={team.name}
                            className="p-2 text-left"
                            style={{ color: teamColors[team.name]?.border || neonColorArray[index % neonColorArray.length].border }}
                          >
                            {team.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {categoryMetrics.map(metric => (
                        <tr key={metric.value} className="border-t border-border">
                          <td className="p-2 font-medium">
                            {metric.label}
                            {metric.invert && <span className="text-xs text-warning ml-1">(inverted)</span>}
                          </td>
                          {selectedTeamsData.map((team, index) => {
                            const originalValue = findMetricValue(team, metric.value);
                            let percentileValue = normalizedData[team.name]?.[metric.value];

                            if (percentileValue === undefined && originalValue !== undefined) {
                              const values = selectedTeamsData.map(t => findMetricValue(t, metric.value) ?? 0);
                              percentileValue = calculatePercentile(originalValue, values);
                              if (metric.invert) percentileValue = 100 - percentileValue;
                            }

                            const color = teamColors[team.name]?.border || neonColorArray[index % neonColorArray.length].border;

                            return (
                              <td key={team.name} className="p-2">
                                <div className="font-mono" style={{ color }}>
                                  {percentileValue !== undefined ? `${percentileValue.toFixed(1)}%` : 'N/A'}
                                </div>
                                <div className="text-xs text-text-secondary">
                                  Value: {originalValue !== undefined ? Number(originalValue).toFixed(2) : 'N/A'}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default TeamPlayComparison;
