import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Search, RefreshCw, AlertTriangle, TrendingUp, ArrowLeftRight, Download, ChevronDown, ChevronUp, Filter, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toPng } from 'html-to-image';
import { Scatter } from 'react-chartjs-2';
import debounce from 'lodash.debounce';
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  CategoryScale,
  LineController,
  ScatterController
} from 'chart.js';
import { teamInfo, getTeamInfo } from '../utils/teamLogos';

// Register all required Chart.js components
ChartJS.register(
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  ScatterController,
  CategoryScale,
  Tooltip,
  Legend
);

interface TeamData {
  name: string;
  data: {
    [key: string]: number;
  };
}

interface TeamRankingsData {
  id: string;
  data: {
    teams: TeamData[];
  };
  created_at: string;
}

// Fallback neon colors for teams without specific colors
const fallbackColors = [
  { fill: 'rgba(255, 81, 97, 0.6)', border: '#FF5161' },    // Red
  { fill: 'rgba(255, 83, 205, 0.6)', border: '#FF53cd' },   // Pink
  { fill: 'rgba(148, 97, 253, 0.6)', border: '#9461fd' },   // Purple
  { fill: 'rgba(45, 217, 254, 0.6)', border: '#2dd9fe' },   // Blue
  { fill: 'rgba(0, 254, 155, 0.6)', border: '#00fe9b' },    // Green
  { fill: 'rgba(255, 219, 78, 0.6)', border: '#ffdb4e' }    // Yellow
];

// =============================
// Metric categories (headers EXACTOS)
// =============================
const metricCategories = {
  'Possession': [
    { label: 'Possession, %', value: 'Possession, %' },
    { label: 'Passes accurate, %', value: 'Passes accurate, %' },
    { label: 'Average passes per possession', value: 'Average passes per possession' },
    { label: 'Long pass %', value: 'Long pass %' },
    { label: 'Match tempo', value: 'Match tempo' },
    { label: 'Progressive passes accurate, %', value: 'Progressive passes accurate, %' }
  ],
  'Attack': [
    { label: 'Goals', value: 'Goals' },
    { label: 'xG', value: 'xG' },
    { label: 'Shots on target, %', value: 'Shots on target, %' },
    { label: 'Positional attacks', value: 'Positional attacks' },
    { label: 'Counterattacks with shots, %', value: 'Counterattacks with shots, %' },
    { label: 'Touches in penalty area', value: 'Touches in penalty area' }
  ],
  'Defense': [
    { label: 'PPDA', value: 'PPDA' },
    { label: 'Defensive duels won, %', value: 'Defensive duels won, %' },
    { label: 'Aerial duels won, %', value: 'Aerial duels won, %' },
    { label: 'Interceptions', value: 'Interceptions' },
    { label: 'Recoveries', value: 'Recoveries' },
    { label: 'Conceded goals', value: 'Conceded goals' }
  ],
  'Set Pieces': [
    { label: 'Corners with shots, %', value: 'Corners with shots, %' },
    { label: 'Free kicks with shots, %', value: 'Free kicks with shots, %' },
    { label: 'Penalties converted, %', value: 'Penalties converted, %' },
    { label: 'Set pieces with shots, %', value: 'Set pieces with shots, %' }
  ]
} as const;

// Helper: busca el valor de una métrica respetando el header exacto y con tolerancia
const findMetricValue = (team: TeamData, metricKey: string): number => {
  if (!team?.data) return 0;

  // 1) Coincidencia directa
  if (team.data[metricKey] !== undefined) return team.data[metricKey];

  const keys = Object.keys(team.data);

  // 2) Coincidencia exacta por string (por si hay referencias distintas al objeto)
  const exact = keys.find(k => k === metricKey);
  if (exact) return team.data[exact];

  // 3) Case-insensitive exact
  const lower = metricKey.toLowerCase();
  const caseInsensitive = keys.find(k => k.toLowerCase() === lower);
  if (caseInsensitive) return team.data[caseInsensitive];

  // 4) Normalización: quitar signos
  const normalized = lower.replace(/[^a-z0-9]/g, '');
  const normalizedMatch = keys.find(k => k.toLowerCase().replace(/[^a-z0-9]/g, '') === normalized);
  if (normalizedMatch) return team.data[normalizedMatch];

  // 5) Alias mínimos útiles (por si vienen variantes antiguas)
  //   - Pass accuracy
  if (metricKey === 'Passes accurate, %') {
    const passAccKey = keys.find(k =>
      k.toLowerCase().includes('pass') &&
      k.toLowerCase().includes('accur')
    );
    if (passAccKey) return team.data[passAccKey];
  }

  //   - Progressive passes accurate, %
  if (metricKey === 'Progressive passes accurate, %') {
    const progKey = keys.find(k =>
      k.toLowerCase().includes('progressive') &&
      k.toLowerCase().includes('accur')
    );
    if (progKey) return team.data[progKey];
  }

  //   - Counterattacks with shots, %
  if (metricKey === 'Counterattacks with shots, %') {
    const caKey = keys.find(k =>
      k.toLowerCase().includes('counter') &&
      k.toLowerCase().includes('shots')
    );
    if (caKey) return team.data[caKey];
  }

  //   - Touches in penalty area
  if (metricKey === 'Touches in penalty area') {
    const touchKey = keys.find(k =>
      k.toLowerCase().includes('touch') &&
      (k.toLowerCase().includes('penalty') || k.toLowerCase().includes('box'))
    );
    if (touchKey) return team.data[touchKey];
  }

  return 0;
};

export default function TeamScatterPlot() {
  const [teamRankings, setTeamRankings] = useState<TeamRankingsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [xMetric, setXMetric] = useState<string>('');
  const [yMetric, setYMetric] = useState<string>('');
  const [metricCategory, setMetricCategory] = useState<keyof typeof metricCategories>('Possession');
  const [chartData, setChartData] = useState<any>(null);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [highlightColor, setHighlightColor] = useState('#00E1FF');
  const [processingState, setProcessingState] = useState<string | null>(null);
  const [chartKey, setChartKey] = useState(0); // Used to force re-render the chart
  const [useTeamLogos, setUseTeamLogos] = useState(true);
  const chartRef = useRef<HTMLDivElement>(null);
  const scatterRef = useRef<any>(null);

  useEffect(() => {
    fetchTeamRankings();
  }, []);

  const fetchTeamRankings = async () => {
    try {
      setLoading(true);
      setError(null);
      setProcessingState('Fetching team rankings...');
      
      const { data, error } = await supabase
        .from('team_rankings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        setTeamRankings(data);
        
        // Set default metrics based on the first category
        const defaultCategory: keyof typeof metricCategories = 'Possession';
        const metrics = metricCategories[defaultCategory];
        if (metrics.length >= 2) {
          setXMetric(metrics[0].value);
          setYMetric(metrics[1].value);
        }
      } else {
        setTeamRankings([]);
      }
      
      setProcessingState(null);
    } catch (err: any) {
      console.error('Error fetching team rankings:', err);
      setError(`Failed to load team rankings: ${err.message || 'Unknown error'}`);
      setProcessingState(null);
    } finally {
      setLoading(false);
    }
  };

  // Get available teams
  const availableTeams = useMemo(() => {
    if (teamRankings.length === 0 || !teamRankings[0].data?.teams) return [];
    return teamRankings[0].data.teams.map(team => team.name);
  }, [teamRankings]);

  // Filter teams by search query
  const filteredTeams = useMemo(() => {
    if (!availableTeams.length) return [];
    if (!searchQuery) return availableTeams;
    return availableTeams.filter(team => 
      team.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [availableTeams, searchQuery]);

  // Get metrics for the selected category
  const availableMetrics = useMemo(() => {
    return metricCategories[metricCategory] || [];
  }, [metricCategory]);

  // Preload team logos
  useEffect(() => {
    Object.values(teamInfo).forEach(team => {
      const img = new Image();
      img.src = team.logo;
    });
  }, []);

  // Debounced chart update function to prevent too many re-renders
  const debouncedUpdateChart = useCallback(
    debounce(() => {
      try {
        if (!xMetric || !yMetric || teamRankings.length === 0 || !teamRankings[0].data?.teams) {
          setChartData(null);
          return;
        }

        setProcessingState('Generating chart data...');
        
        const teams = teamRankings[0].data.teams;
        
        // Calculate means for reference lines
        const xValues = teams.map(team => findMetricValue(team, xMetric));
        const yValues = teams.map(team => findMetricValue(team, yMetric));
        
        const xMean = xValues.reduce((a, b) => a + b, 0) / (xValues.length || 1);
        const yMean = yValues.reduce((a, b) => a + b, 0) / (yValues.length || 1);

        const data = {
          datasets: [
            {
              label: `${xMetric} vs ${yMetric}`,
              data: teams.map(team => ({
                x: findMetricValue(team, xMetric),
                y: findMetricValue(team, yMetric),
                team: team.name,
                logo: teamInfo[team.name]?.logo || ''
              })),
              backgroundColor: (context: any) => {
                if (!context || !context.raw) return 'rgba(200, 16, 46, 0.6)';
                
                const point = context.raw;
                const isHighlighted = searchQuery && point.team.toLowerCase().includes(searchQuery.toLowerCase());
                
                if (selectedTeam && point.team === selectedTeam) return highlightColor;
                if (isHighlighted) return highlightColor;
                
                // Use team-specific color if available
                return teamInfo[point.team]?.fill || fallbackColors[context.dataIndex % fallbackColors.length].fill;
              },
              borderColor: (context: any) => {
                if (!context || !context.raw) return '#C8102E';
                
                const point = context.raw;
                const isHighlighted = searchQuery && point.team.toLowerCase().includes(searchQuery.toLowerCase());
                
                if (selectedTeam && point.team === selectedTeam) return highlightColor;
                if (isHighlighted) return highlightColor;
                
                // Use team-specific color if available
                return teamInfo[point.team]?.border || fallbackColors[context.dataIndex % fallbackColors.length].border;
              },
              borderWidth: useTeamLogos ? 0 : 1,
              pointRadius: (context: any) => {
                if (!context || !context.raw) return 15;
                const point = context.raw;
                const isHighlighted = searchQuery && point.team.toLowerCase().includes(searchQuery.toLowerCase());
                return (selectedTeam && point.team === selectedTeam) || isHighlighted ? 20 : 15;
              },
              pointHoverRadius: 20,
              // Make points transparent when using logos
              pointStyle: useTeamLogos ? 'circle' : 'circle',
              pointBackgroundColor: useTeamLogos ? 'rgba(0,0,0,0)' : undefined,
              pointBorderColor: useTeamLogos ? 'rgba(0,0,0,0)' : undefined,
            },
            {
              label: 'X Mean',
              data: [
                { x: xMean, y: Math.min(...yValues) },
                { x: xMean, y: Math.max(...yValues) }
              ],
              showLine: true,
              borderColor: '#34D399',
              borderWidth: 2,
              borderDash: [5, 5],
              pointRadius: 0,
            },
            {
              label: 'Y Mean',
              data: [
                { x: Math.min(...xValues), y: yMean },
                { x: Math.max(...xValues), y: yMean }
              ],
              showLine: true,
              borderColor: '#34D399',
              borderWidth: 2,
              borderDash: [5, 5],
              pointRadius: 0,
            }
          ]
        };

        const options = {
          responsive: true,
          maintainAspectRatio: false,
          onClick: (event: any, elements: any) => {
            if (elements.length > 0) {
              const dataIndex = elements[0].index;
              const point = data.datasets[0].data[dataIndex];
              if ('team' in point) {
                setSelectedTeam(point.team);
              }
            }
          },
          plugins: {
            tooltip: {
              callbacks: {
                label: (context: any) => {
                  const point = context.raw;
                  if (!point || !point.team) {
                    return `Mean: ${context.parsed.y.toFixed(2)}`;
                  }
                  return [
                    `Team: ${point.team}`,
                    `${formatMetricName(xMetric)}: ${point.x.toFixed(2)}`,
                    `${formatMetricName(yMetric)}: ${point.y.toFixed(2)}`
                  ];
                }
              },
              backgroundColor: '#1A1D24',
              titleColor: '#FFFFFF',
              bodyColor: '#8B92A5',
              borderColor: '#2A2F3C',
              borderWidth: 1,
              padding: 12,
              boxPadding: 6,
              usePointStyle: true,
            },
            legend: {
              display: false
            }
          },
          scales: {
            x: {
              title: {
                display: true,
                text: formatMetricName(xMetric),
                color: '#8B92A5',
                font: { size: 12, weight: 'bold' }
              },
              grid: { color: '#2A2F3C', borderColor: '#2A2F3C' },
              ticks: { color: '#8B92A5' }
            },
            y: {
              title: {
                display: true,
                text: formatMetricName(yMetric),
                color: '#8B92A5',
                font: { size: 12, weight: 'bold' }
              },
              grid: { color: '#2A2F3C', borderColor: '#2A2F3C' },
              ticks: { color: '#8B92A5' }
            }
          }
        };

        setChartData({ data, options });
        setProcessingState(null);
        setChartKey(prev => prev + 1); // Force chart re-render
      } catch (err: any) {
        console.error('Error generating chart data:', err);
        setError(`Failed to generate chart: ${err.message || 'Unknown error'}`);
        setChartData(null);
        setProcessingState(null);
      }
    }, 300),
    [xMetric, yMetric, teamRankings, selectedTeam, searchQuery, highlightColor, useTeamLogos]
  );

  // Update chart data when metrics change
  useEffect(() => {
    debouncedUpdateChart();
    return () => { debouncedUpdateChart.cancel(); };
  }, [xMetric, yMetric, teamRankings, selectedTeam, searchQuery, highlightColor, useTeamLogos, debouncedUpdateChart]);

  // Handle metric category change
  const handleCategoryChange = (category: keyof typeof metricCategories) => {
    setMetricCategory(category);
    const metrics = metricCategories[category];
    if (metrics.length >= 2) {
      setXMetric(metrics[0].value);
      setYMetric(metrics[1].value);
    }
  };

  const handleSwapMetrics = () => {
    setXMetric(yMetric);
    setYMetric(xMetric);
    setSelectedTeam(null);
  };

  const downloadChart = async () => {
    if (chartRef.current) {
      try {
        setProcessingState('Generating image...');
        const dataUrl = await toPng(chartRef.current, {
          quality: 0.95,
          backgroundColor: '#121212'
        });
        const link = document.createElement('a');
        link.download = `team-scatter-plot-${xMetric.replace(/[^a-zA-Z0-9]/g, '-')}-vs-${yMetric.replace(/[^a-zA-Z0-9]/g, '-')}.png`;
        link.href = dataUrl;
        link.click();
        setProcessingState(null);
      } catch (err) {
        console.error('Error downloading chart:', err);
        setError('Failed to download chart image');
      }
    }
  };

  const handleResetView = () => {
    setSelectedTeam(null);
    setSearchQuery('');
  };

  const handleResetChart = () => {
    setChartKey(prev => prev + 1);
    setError(null);
  };

  // Custom plugin to draw team logos
  const logoPlugin = {
    id: 'teamLogos',
    afterDraw: (chart: any) => {
      if (!useTeamLogos) return;
      const ctx = chart.ctx;
      if (!ctx) return;
      const xAxis = chart.scales.x;
      const yAxis = chart.scales.y;
      if (!xAxis || !yAxis) return;

      const dataset = chart.data.datasets[0];
      if (!dataset) return;

      dataset.data.forEach((point: any) => {
        if (!point) return;
        const team = point.team;
        const x = xAxis.getPixelForValue(point.x);
        const y = yAxis.getPixelForValue(point.y);
        const logoUrl = teamInfo[team]?.logo;

        if (logoUrl) {
          const img = new Image();
          img.src = logoUrl;
          const size = (selectedTeam && team === selectedTeam) ? 40 : 30;

          if (img.complete) {
            ctx.drawImage(img, x - size/2, y - size/2, size, size);
          } else {
            img.onload = () => {
              ctx.drawImage(img, x - size/2, y - size/2, size, size);
            };
          }
        }
      });
    }
  };

  // Format metric name for display (usa labels definidos)
  const formatMetricName = (metric: string): string => {
    for (const category of Object.values(metricCategories)) {
      const found = category.find(m => m.value === metric);
      if (found) return found.label;
    }
    return metric;
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
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-text-primary">Team Scatter Plot</h2>
          </div>
          
          {processingState && (
            <div className="flex items-center gap-2 text-text-secondary bg-background-lighter px-3 py-1 rounded-lg">
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary"></div>
              <span className="text-sm">{processingState}</span>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {teamRankings.length === 0 ? (
            <div className="bg-background p-8 rounded-lg border border-border text-center">
              <AlertTriangle className="h-12 w-12 text-warning mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No Season Data Available</h3>
              <p className="text-text-secondary mb-4">
                Please upload team data files in the Settings page to view team scatter plots.
              </p>
              <p className="text-sm text-text-secondary">
                Data uploaded in Settings will be used for team performance visualization and comparison.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-text-primary mb-2 block">Metric Category</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.keys(metricCategories).map(category => (
                      <button
                        key={category}
                        className={`p-3 rounded-lg border transition-colors ${
                          metricCategory === category
                            ? 'border-primary bg-primary/10 text-white'
                            : 'border-border hover:border-primary text-text-secondary'
                        }`}
                        onClick={() => handleCategoryChange(category as keyof typeof metricCategories)}
                      >
                        <span>{category}</span>
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-text-primary">Team Search</Label>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                      className="flex items-center gap-2 h-7 px-2"
                    >
                      <Filter className="h-3 w-3" />
                      {showAdvancedFilters ? 'Hide Filters' : 'Filters'}
                      {showAdvancedFilters ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </Button>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-secondary" />
                    <input
                      type="text"
                      placeholder="Search teams..."
                      className="pl-9 w-full h-10 bg-background border border-background-lighter rounded-md text-text-primary focus:border-primary focus:outline-none"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  
                  {showAdvancedFilters && (
                    <div className="mt-4 p-4 bg-background-lighter rounded-lg border border-border">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-text-primary">Highlight Color</Label>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="use-team-logos"
                            checked={useTeamLogos}
                            onChange={(e) => setUseTeamLogos(e.target.checked)}
                            className="rounded border-border bg-background"
                          />
                          <Label htmlFor="use-team-logos" className="text-sm cursor-pointer">
                            Use Team Logos
                          </Label>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={highlightColor}
                          onChange={(e) => setHighlightColor(e.target.value)}
                          className="w-10 h-10 p-1 bg-background border border-border rounded-md cursor-pointer"
                        />
                        <div className="flex flex-wrap gap-2">
                          {fallbackColors.map(color => (
                            <div
                              key={color.border}
                              className="w-6 h-6 rounded-full cursor-pointer border border-white/20"
                              style={{ backgroundColor: color.border }}
                              onClick={() => setHighlightColor(color.border)}
                            ></div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <Label className="text-text-primary">X-Axis Metric</Label>
                  <Select value={xMetric} onValueChange={setXMetric}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select X-axis metric" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableMetrics.map(metric => (
                        <SelectItem key={metric.value} value={metric.value}>{metric.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <Label className="text-text-primary">Y-Axis Metric</Label>
                  <Select value={yMetric} onValueChange={setYMetric}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Y-axis metric" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableMetrics.map(metric => (
                        <SelectItem key={metric.value} value={metric.value}>{metric.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-center space-x-4">
                <Button
                  onClick={handleSwapMetrics}
                  variant="outline"
                  className="text-text-primary"
                  disabled={!xMetric || !yMetric}
                >
                  <ArrowLeftRight className="h-4 w-4 mr-2" />
                  Swap Axes
                </Button>
                {chartData && (
                  <Button
                    onClick={downloadChart}
                    variant="outline"
                    className="text-text-primary"
                    disabled={loading}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Chart
                  </Button>
                )}
                {selectedTeam && (
                  <Button
                    onClick={handleResetView}
                    variant="outline"
                    className="text-text-primary"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Reset Selection
                  </Button>
                )}
                <Button
                  onClick={handleResetChart}
                  variant="outline"
                  className="text-text-primary"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset Chart
                </Button>
              </div>

              {error && (
                <div className="bg-error/10 text-error p-4 rounded-lg border border-error/50 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Error</p>
                    <p className="text-sm">{error}</p>
                    <Button 
                      onClick={() => {
                        setError(null);
                        debouncedUpdateChart();
                      }} 
                      className="mt-2 bg-error/20 hover:bg-error/30 text-error"
                      size="sm"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Retry
                    </Button>
                  </div>
                </div>
              )}

              {chartData && (
                <div className="space-y-4">
                  {selectedTeam && (
                    <div className="bg-background rounded-lg p-4 border border-background-lighter">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <img 
                            src={teamInfo[selectedTeam]?.logo} 
                            alt={selectedTeam}
                            className="w-12 h-12 object-contain"
                          />
                          <h3 className="text-lg font-semibold text-text-primary">{selectedTeam}</h3>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedTeam(null)}
                          className="hover:bg-background-lighter"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-text-secondary">{formatMetricName(xMetric)}</Label>
                          <p className="text-text-primary font-medium mt-1">
                            {teamRankings[0].data.teams.find(t => t.name === selectedTeam) 
                              ? findMetricValue(
                                  teamRankings[0].data.teams.find(t => t.name === selectedTeam)!,
                                  xMetric
                                ).toFixed(2)
                              : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <Label className="text-text-secondary">{formatMetricName(yMetric)}</Label>
                          <p className="text-text-primary font-medium mt-1">
                            {teamRankings[0].data.teams.find(t => t.name === selectedTeam)
                              ? findMetricValue(
                                  teamRankings[0].data.teams.find(t => t.name === selectedTeam)!,
                                  yMetric
                                ).toFixed(2)
                              : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={chartRef} className="h-[600px] bg-background rounded-lg p-6">
                    {loading ? (
                      <div className="h-full flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                      </div>
                    ) : (
                      <Scatter 
                        key={chartKey}
                        ref={scatterRef}
                        data={chartData.data} 
                        options={{
                          ...chartData.options,
                          plugins: {
                            ...chartData.options.plugins,
                            teamLogos: logoPlugin
                          }
                        }}
                        plugins={useTeamLogos ? [logoPlugin] : []}
                        fallbackContent={
                          <div className="h-full flex items-center justify-center text-text-secondary">
                            Chart could not be rendered
                          </div>
                        }
                      />
                    )}
                  </div>

                  {/* Team Legend */}
                  <div className="bg-background p-4 rounded-lg border border-border">
                    <h3 className="text-sm font-medium mb-3">Teams</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {availableTeams.map(team => (
                        <div 
                          key={team}
                          className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                            selectedTeam === team ? 'bg-background-lighter border border-primary' : 'hover:bg-background-lighter'
                          }`}
                          onClick={() => setSelectedTeam(team === selectedTeam ? null : team)}
                        >
                          <img 
                            src={teamInfo[team]?.logo} 
                            alt={team}
                            className="w-6 h-6 object-contain"
                          />
                          <span className="text-xs font-medium truncate">{team}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end">
                    <p className="text-text-primary text-sm font-medium">
                      By: Felipe Ormazabal
                    </p>
                    <div className="flex items-center gap-2 text-text-secondary text-xs">
                      <span>Football Scout</span>
                      <span>•</span>
                      <span>Data Analyst</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
