import React, { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Download, Trash2, AlertTriangle, Users, ArrowLeftRight, TrendingUp, BarChart as ChartBar, Layers, Clipboard, Gauge, ScatterChart, Award, Filter, ChevronUp, ChevronDown, Search, RefreshCw, Bug, Star, Trophy } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toPng } from 'html-to-image';
import { useAuth } from '../context/AuthContext';

interface PlayerData {
  id: string;
  Player: string;
  Team: string;
  Position: string;
  Age: number;
  'Market value': number;
  'Minutes played': number;
  'Contract expires': string;
  MappedPositions?: string[];
  similarity?: string;
  [key: string]: any;
}

// Define position groups for filtering
const positionGroups = {
  'All Positions': [],
  'Goalkeepers': ['Goalkeeper'],
  'Defenders': ['Defender', 'Fullback'],
  'Midfielders': ['Midfielder'],
  'Wingers': ['Wingers'],
  'Forwards': ['Forward']
};

// Define metrics categories with friendly labels
const metricCategories = {
  'Attacking': [
    { label: 'Goals/90', value: 'Goals per 90' },
    { label: 'xG/90', value: 'xG per 90' },
    { label: 'Shots/90', value: 'Shots per 90' },
    { label: 'Shot Accuracy %', value: 'Shots on target, %' },
    { label: 'Assists/90', value: 'Assists per 90' },
    { label: 'xA/90', value: 'xA per 90' },
    { label: 'Key Passes/90', value: 'Key passes per 90' },
    { label: 'Touches in Box/90', value: 'Touches in box per 90' },
    { label: 'Crosses per 90', value: 'Crosses per 90'},
    { label: 'Crosses Accurate', value: 'Accurate crosses, %'}
  ],
  'Possession': [
    { label: 'Pass Accuracy %', value: 'Accurate passes, %' },
    { label: 'Passes/90', value: 'Passes per 90' },
    { label: 'Prog. Passes/90', value: 'Progressive passes per 90' },
    { label: 'Dribbles/90', value: 'Dribbles per 90' },
    { label: 'Dribble Success %', value: 'Successful dribbles, %' },
    { label: 'Forward Passes/90', value: 'Forward passes per 90' }
  ],
  'Defensive': [
    { label: 'Def. Duels Won %', value: 'Defensive duels won, %' },
    { label: 'Aerial Duels Won %', value: 'Aerial duels won, %' },
    { label: 'Interceptions/90', value: 'Interceptions per 90' },
    { label: 'Tackles/90', value: 'Sliding tackles per 90' },
    { label: 'Recoveries/90', value: 'Recoveries per 90' },
    { label: 'Clearances/90', value: 'Clearances per 90' }
  ],
  'Physical': [
    { label: 'Duels Won %', value: 'Duels won, %' },
    { label: 'Accelerations/90', value: 'Accelerations per 90' },
    { label: 'Sprints/90', value: 'Sprints per 90' },
    { label: 'Distance Covered km/90', value: 'Distance covered per 90' }
  ],
  'Goalkeeper': [
    { label: 'Save Rate %', value: 'Save rate, %' },
    { label: 'Prevented Goals/90', value: 'Prevented goals per 90' },
    { label: 'Clean Sheets/90', value: 'Clean sheets per 90' },
    { label: 'Exits/90', value: 'Exits per 90' },
    { label: 'Conceded Goals/90', value: 'Conceded goals per 90' }
  ]
};

// Define neon colors for highlighting
const neonColors = [
  '#FF5161', // Red
  '#FF53cd', // Pink
  '#9461fd', // Purple
  '#2dd9fe', // Blue
  '#00fe9b', // Green
  '#ffdb4e'  // Yellow
];

// Position mapping for different formats
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
  'LW': 'Wingers',
  'LWF': 'Wingers',
  'RW': 'Wingers',
  'RWF': 'Wingers',
  'CF': 'Forward',
  'ST': 'Forward',
  'FW': 'Forward',
  'SS': 'Forward'
};

const PlayerRankings: React.FC = () => {
  const [playerData, setPlayerData] = useState<PlayerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [positionFilter, setPositionFilter] = useState<string>('All Positions');
  const [metricCategory, setMetricCategory] = useState<string>('Attacking');
  const [selectedMetric, setSelectedMetric] = useState<string>('');
  const [teamFilter, setTeamFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [highlightColor, setHighlightColor] = useState<string>(neonColors[0]);
  const [teamToHighlight, setTeamToHighlight] = useState<string>('');
  const [minMinutes, setMinMinutes] = useState<number>(0); // Changed from 500 to 0
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [ageRange, setAgeRange] = useState<[number, number]>([15, 40]);
  const [showPercentiles, setShowPercentiles] = useState(false);
  const [percentileData, setPercentileData] = useState<{[key: string]: number}>({});
  const [hideZeroValues, setHideZeroValues] = useState<boolean>(false); // Changed from true to false
  const [debugMode, setDebugMode] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);
  const { isAdmin } = useAuth();

  useEffect(() => {
    fetchPlayerData();
  }, []);

  const fetchPlayerData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('player_data')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        // Process data to ensure all required fields exist
        const processedData = data[0].data.map((player: any, index: number) => {
          // Ensure all fields have default values
          const processedPlayer: any = {
            id: player.id || `player-${index}`,
            Player: player.Player || `Player ${index}`,
            Team: player.Team || player['Team within selected timeframe'] || 'Unknown',
            Position: player.Position || 'Unknown',
            Age: parseInt(player.Age) || 0,
            'Market value': parseFloat(player['Market value']) || 0,
            'Minutes played': parseInt(player['Minutes played']) || 0,
            'Contract expires': player['Contract expires'] || 'N/A'
          };
          
          // Copy all other fields with default values for numeric fields
          Object.keys(player).forEach(key => {
            if (!processedPlayer[key]) {
              if (typeof player[key] === 'number') {
                processedPlayer[key] = player[key];
              } else if (typeof player[key] === 'string' && !isNaN(parseFloat(player[key]))) {
                processedPlayer[key] = parseFloat(player[key]);
              } else {
                processedPlayer[key] = player[key] || (typeof player[key] === 'number' ? 0 : 'N/A');
              }
            }
          });
          
          // Map positions
          const positions = String(player.Position || '').split(',').map((pos: string) => pos.trim());
          const mappedPositions = new Set<string>();
          
          positions.forEach((pos: string) => {
            // Try direct mapping first
            const directMapping = positionMapping[pos as keyof typeof positionMapping];
            if (directMapping) {
              mappedPositions.add(directMapping);
            } else {
              // Try to find a partial match
              for (const [key, value] of Object.entries(positionMapping)) {
                if (pos.includes(key)) {
                  mappedPositions.add(value);
                  break;
                }
              }
              
              // If still no match, try to infer from position name
              if (mappedPositions.size === 0) {
                if (pos.toLowerCase().includes('gk') || pos.toLowerCase().includes('goal')) {
                  mappedPositions.add('Goalkeeper');
                } else if (pos.toLowerCase().includes('cb') || pos.toLowerCase().includes('def')) {
                  mappedPositions.add('Defender');
                } else if (pos.toLowerCase().includes('mid') || pos.toLowerCase().includes('mf')) {
                  mappedPositions.add('Midfielder');
                } else if (pos.toLowerCase().includes('wing') || pos.toLowerCase().includes('w')) {
                  mappedPositions.add('Wingers');
                } else if (pos.toLowerCase().includes('forw') || pos.toLowerCase().includes('fw') || 
                           pos.toLowerCase().includes('cf') || pos.toLowerCase().includes('st')) {
                  mappedPositions.add('Forward');
                } else {
                  // Default to Midfielder if we can't determine
                  mappedPositions.add('Midfielder');
                }
              }
            }
          });
          
          // If no positions were mapped, add a default
          if (mappedPositions.size === 0) {
            mappedPositions.add('Midfielder');
          }
          
          processedPlayer.MappedPositions = Array.from(mappedPositions);
          
          return processedPlayer;
        });
        
        console.log(`Processed ${processedData.length} players`);
        
        // Check if Van Bost is in the data
        const vanBost = processedData.find((p: any) =>
          p.Player.toLowerCase().includes('van bost') ||
          p.Player.toLowerCase().includes('vanbost')
        );
        
        if (vanBost) {
          console.log('Van Bost found:', vanBost);
        } else {
          console.log('Van Bost not found in the data');
        }
        
        setPlayerData(processedData);
      } else {
        setPlayerData([]);
      }
    } catch (err: any) {
      console.error('Error fetching player data:', err);
      setError(`Failed to load player data: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Get available teams from player data
  const availableTeams = useMemo(() => {
    const teams = new Set<string>();
    playerData.forEach(player => {
      if (player.Team) {
        teams.add(player.Team);
      } else if (player['Team within selected timeframe']) {
        teams.add(player['Team within selected timeframe']);
      }
    });
    return Array.from(teams).sort();
  }, [playerData]);

  // Filter players based on position, team, and search query
  const filteredPlayers = useMemo(() => {
    if (!playerData?.length) return [];
    
    return playerData.filter(player => {
      // Filter by minutes played
      if (player['Minutes played'] < minMinutes) {
        return false;
      }
      
      // Filter by age range
      if (player.Age < ageRange[0] || player.Age > ageRange[1]) {
        return false;
      }
      
      // Filter by position
      const positionMatch = positionFilter === 'All Positions' || 
        (player.MappedPositions && 
         Array.isArray(player.MappedPositions) && 
         player.MappedPositions.some(pos => {
           if (positionFilter === 'Goalkeepers') return pos === 'Goalkeeper';
           if (positionFilter === 'Defenders') return pos === 'Defender' || pos === 'Fullback';
           if (positionFilter === 'Midfielders') return pos === 'Midfielder';
           if (positionFilter === 'Wingers') return pos === 'Wingers';
           if (positionFilter === 'Forwards') return pos === 'Forward';
           return true;
         }));
      
      // Filter by team
      const teamMatch = !teamFilter || 
        player.Team === teamFilter || 
        player['Team within selected timeframe'] === teamFilter;
      
      // Filter by search query
      const searchMatch = !searchQuery || 
        player.Player.toLowerCase().includes(searchQuery.toLowerCase());
      
      return positionMatch && teamMatch && searchMatch;
    });
  }, [playerData, positionFilter, teamFilter, searchQuery, minMinutes, ageRange]);

  // Calculate percentiles for the selected metric
  useEffect(() => {
    if (!selectedMetric || !filteredPlayers.length) {
      setPercentileData({});
      return;
    }

    const values = filteredPlayers
      .map(player => parseFloat(player[selectedMetric]) || 0)
      .sort((a, b) => a - b);
    
    const percentiles: {[key: string]: number} = {};
    
    filteredPlayers.forEach(player => {
      const value = parseFloat(player[selectedMetric]) || 0;
      const percentile = calculatePercentile(value, values);
      percentiles[player.Player] = percentile;
    });
    
    setPercentileData(percentiles);
  }, [selectedMetric, filteredPlayers]);

  // Calculate percentile of a value within an array
  const calculatePercentile = (value: number, array: number[]): number => {
    if (array.length === 0) return 0;
    
    // Count values less than the given value
    const lessThan = array.filter(v => v < value).length;
    
    // Count values equal to the given value
    const equalTo = array.filter(v => v === value).length;
    
    // Calculate percentile using the formula: (less than + 0.5 * equal to) / total * 100
    return ((lessThan + 0.5 * equalTo) / array.length) * 100;
  };

  // Sort players by selected metric
  const sortedPlayers = useMemo(() => {
    if (!filteredPlayers.length || !selectedMetric) return filteredPlayers;
    
    return [...filteredPlayers].sort((a, b) => {
      const valueA = parseFloat(a[selectedMetric]) || 0;
      const valueB = parseFloat(b[selectedMetric]) || 0;
      
      return sortDirection === 'asc' 
        ? valueA - valueB 
        : valueB - valueA;
    });
  }, [filteredPlayers, selectedMetric, sortDirection]);

  // Filter out players with 0.0 values in the selected metric if hideZeroValues is true
  const displayedPlayers = useMemo(() => {
    if (!selectedMetric || !hideZeroValues) return sortedPlayers;
    
    return sortedPlayers.filter(player => {
      const value = parseFloat(player[selectedMetric]) || 0;
      return value > 0;
    });
  }, [sortedPlayers, selectedMetric, hideZeroValues]);

  // Download table as image
  const downloadTable = async () => {
    if (!tableRef.current) return;
    
    try {
      const dataUrl = await toPng(tableRef.current, {
        quality: 0.95,
        backgroundColor: '#121212'
      });
      
      const link = document.createElement('a');
      link.download = `player-rankings-${selectedMetric.replace(/[^a-zA-Z0-9]/g, '-')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error downloading table:', err);
      setError('Failed to download table image');
    }
  };

  // Toggle sort direction
  const toggleSortDirection = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  // Format metric value for display
  const formatMetricValue = (value: number | string): string => {
    if (typeof value !== 'number') {
      const parsed = parseFloat(value);
      if (isNaN(parsed)) return value.toString();
      value = parsed;
    }
    
    // Format percentages
    if (selectedMetric.includes('%')) {
      return `${value.toFixed(1)}%`;
    }
    
    // Format regular numbers
    return value.toFixed(2);
  };

  // Format metric name for display
  const formatMetricName = (metric: string): string => {
    // Find the friendly label for the metric
    for (const category of Object.values(metricCategories)) {
      const found = category.find(m => m.value === metric);
      if (found) return found.label;
    }
    
    // If not found, format the raw metric name
    return metric
      .replace(' per 90', '/90')
      .replace(', %', '%')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Get color based on percentile
  const getPercentileColor = (percentile: number): string => {
    if (percentile >= 90) return 'text-success font-bold';
    if (percentile >= 70) return 'text-primary font-bold';
    if (percentile >= 50) return 'text-warning';
    if (percentile >= 30) return 'text-text-primary';
    return 'text-error';
  };

  // Reset all filters to show all players
  const resetAllFilters = () => {
    setPositionFilter('All Positions');
    setTeamFilter('');
    setSearchQuery('');
    setMinMinutes(0);
    setAgeRange([15, 40]);
    setHideZeroValues(false);
  };

  // Check if a player is Van Bost
  const isVanBost = (player: PlayerData): boolean => {
    return player.Player.toLowerCase().includes('van bost') || 
           player.Player.toLowerCase().includes('vanbost');
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
              <Award className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-text-primary">Player Rankings</h2>
          </div>
          
          {error && (
            <div className="bg-error/10 text-error px-4 py-2 rounded-lg flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={fetchPlayerData}
                className="ml-2 h-7 w-7 p-0"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {playerData.length === 0 ? (
          <div className="bg-background p-8 rounded-lg border border-border text-center">
            <AlertTriangle className="h-12 w-12 text-warning mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No Season Data Available</h3>
            <p className="text-text-secondary mb-4">
              Please upload player data files in the Settings page to view player rankings.
            </p>
            <p className="text-sm text-text-secondary">
              Data uploaded in Settings will be used for player performance analysis and rankings.
            </p>
            <Button onClick={fetchPlayerData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Data
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-text-secondary mb-2 block">Position Filter</label>
                <select
                  className="select-field"
                  value={positionFilter}
                  onChange={(e) => setPositionFilter(e.target.value)}
                >
                  {Object.keys(positionGroups).map(pos => (
                    <option key={pos} value={pos}>{pos}</option>
                  ))}
                </select>
              </div>

              

              <div>
                <label className="text-text-secondary mb-2 block">Highlight Color</label>
                <input
                  type="color"
                  value={highlightColor}
                  onChange={(e) => setHighlightColor(e.target.value)}
                  className="h-10 w-20 p-1 bg-background border-border"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="btn-secondary w-full flex items-center justify-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  {showAdvancedFilters ? 'Hide Filters' : 'Advanced Filters'}
                  {showAdvancedFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {showAdvancedFilters && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-background-lighter rounded-lg border border-border">
                <div>
                  <Label className="text-text-primary mb-2 block">Team Filter</Label>
                  <Select value={teamFilter} onValueChange={setTeamFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All teams" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Teams</SelectItem>
                      {availableTeams.map(team => (
                        <SelectItem key={team} value={team}>{team}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-text-primary mb-2 block">Minimum Minutes Played</Label>
                  <Select value={minMinutes.toString()} onValueChange={(value) => setMinMinutes(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Min. minutes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">No minimum</SelectItem>
                      <SelectItem value="270">270 minutes (3 games)</SelectItem>
                      <SelectItem value="450">450 minutes (5 games)</SelectItem>
                      <SelectItem value="500">500 minutes</SelectItem>
                      <SelectItem value="900">900 minutes (10 games)</SelectItem>
                      <SelectItem value="1350">1350 minutes (15 games)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-text-primary mb-2 block">Age Range</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="15"
                      max={ageRange[1]}
                      value={ageRange[0]}
                      onChange={(e) => setAgeRange([parseInt(e.target.value), ageRange[1]])}
                      className="w-20 p-2 bg-background border border-border rounded-md text-text-primary"
                    />
                    <span className="text-text-secondary">to</span>
                    <input
                      type="number"
                      min={ageRange[0]}
                      max="40"
                      value={ageRange[1]}
                      onChange={(e) => setAgeRange([ageRange[0], parseInt(e.target.value)])}
                      className="w-20 p-2 bg-background border border-border rounded-md text-text-primary"
                    />
                  </div>
                </div>
                
                <div>
                  <Label className="text-text-primary mb-2 block">Search Player</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-secondary" />
                    <input
                      type="text"
                      placeholder="Search by name..."
                      className="pl-9 w-full h-10 bg-background border border-background-lighter rounded-md text-text-primary focus:border-primary focus:outline-none"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="show-percentiles"
                      checked={showPercentiles}
                      onChange={(e) => setShowPercentiles(e.target.checked)}
                      className="rounded border-border bg-background"
                    />
                    <Label htmlFor="show-percentiles" className="text-sm cursor-pointer">
                      Show Percentiles
                    </Label>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="hide-zero-values"
                      checked={hideZeroValues}
                      onChange={(e) => setHideZeroValues(e.target.checked)}
                      className="rounded border-border bg-background"
                    />
                    <Label htmlFor="hide-zero-values" className="text-sm cursor-pointer">
                      Hide 0.0 Values
                    </Label>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button 
                    onClick={resetAllFilters}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Show All Players
                  </Button>
                  
                  <Button 
                    onClick={() => setDebugMode(!debugMode)}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Bug className="h-3 w-3" />
                    Debug: {debugMode ? 'On' : 'Off'}
                  </Button>
                </div>
              </div>
            )}

            {debugMode && (
              <div className="bg-background-lighter p-4 rounded-lg border border-border">
                <h3 className="text-sm font-medium mb-2 text-warning flex items-center gap-2">
                  <Bug className="h-4 w-4" />
                  Debug Information
                </h3>
                <div className="space-y-2 text-xs font-mono">
                  <p>Total Players: {playerData.length}</p>
                  <p>Filtered Players: {filteredPlayers.length}</p>
                  <p>Displayed Players: {displayedPlayers.length}</p>
                  <p>Position Filter: {positionFilter}</p>
                  <p>Team Filter: {teamFilter || 'None'}</p>
                  <p>Search Query: {searchQuery || 'None'}</p>
                  <p>Min Minutes: {minMinutes}</p>
                  <p>Age Range: {ageRange[0]}-{ageRange[1]}</p>
                  <p>Hide Zero Values: {hideZeroValues ? 'Yes' : 'No'}</p>
                  <p>Selected Metric: {selectedMetric || 'None'}</p>
                  
                  {/* Check for Van Bost */}
                  {(() => {
                    const vanBost = playerData.find(p => 
                      p.Player.toLowerCase().includes('van bost') || 
                      p.Player.toLowerCase().includes('vanbost')
                    );
                    
                    if (vanBost) {
                      return (
                        <div className="bg-yellow-900/30 p-2 rounded border border-yellow-500/30 mt-2">
                          <p className="text-yellow-500 font-bold">Van Bost Found:</p>
                          <p>Name: {vanBost.Player}</p>
                          <p>Team: {vanBost.Team || vanBost['Team within selected timeframe']}</p>
                          <p>Position: {vanBost.Position}</p>
                          <p>Mapped Positions: {vanBost.MappedPositions?.join(', ')}</p>
                          <p>Minutes: {vanBost['Minutes played']}</p>
                          <p>Age: {vanBost.Age}</p>
                          <p>In filtered results: {filteredPlayers.some(p => p.Player === vanBost.Player) ? 'Yes' : 'No'}</p>
                          <p>In displayed results: {displayedPlayers.some(p => p.Player === vanBost.Player) ? 'Yes' : 'No'}</p>
                        </div>
                      );
                    }
                    return <p className="text-error">Van Bost not found in data</p>;
                  })()}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-text-secondary mb-2 block">Metrics to Rank</label>
                <select
                  className="select-field"
                  value={selectedMetric}
                  onChange={(e) => setSelectedMetric(e.target.value)}
                >
                  <option value="">Select metric</option>
                  {Object.entries(metricCategories).map(([group, metrics]) => (
                    <optgroup key={group} label={group}>
                      {metrics.map((metric) => (
                        <option key={metric.value} value={metric.value}>
                          {metric.label}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-text-secondary mb-2 block">Team to Highlight</label>
                <select
                  className="select-field"
                  value={teamToHighlight}
                  onChange={(e) => setTeamToHighlight(e.target.value)}
                >
                  <option value="">Select team</option>
                  {availableTeams.map((team) => (
                    <option key={team} value={team}>{team}</option>
                  ))}
                </select>
              </div>

              

              <div className="flex items-end">
                <button
                  onClick={downloadTable}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                  disabled={!selectedMetric}
                >
                  <Download className="h-4 w-4" />
                  Download Table
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="show-percentiles"
                    checked={showPercentiles}
                    onChange={(e) => setShowPercentiles(e.target.checked)}
                    className="rounded border-border bg-background"
                  />
                  <Label htmlFor="show-percentiles" className="text-sm cursor-pointer">
                    Show Percentiles
                  </Label>
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="hide-zero-values"
                    checked={hideZeroValues}
                    onChange={(e) => setHideZeroValues(e.target.checked)}
                    className="rounded border-border bg-background"
                  />
                  <Label htmlFor="hide-zero-values" className="text-sm cursor-pointer">
                    Hide 0.0 Values
                  </Label>
                </div>
                
                <button 
                  onClick={toggleSortDirection}
                  className="flex items-center gap-2 px-3 py-1 bg-background-lighter rounded-md text-text-secondary hover:text-text-primary transition-colors"
                >
                  <ArrowLeftRight className="h-4 w-4" />
                  <span>{sortDirection === 'desc' ? 'Highest First' : 'Lowest First'}</span>
                </button>
              </div>
              
              <Button 
                onClick={downloadTable}
                className="flex items-center gap-2"
                disabled={!selectedMetric || displayedPlayers.length === 0}
              >
                <Download className="h-4 w-4" />
                Download Rankings
              </Button>
            </div>
            
            {selectedMetric && displayedPlayers.length > 0 ? (
              <div 
                ref={tableRef} 
                className="bg-background p-8 rounded-lg space-y-6"
                style={{
                  width: '100%',
                  maxWidth: '1200px',
                  margin: '0 auto',
                  fontFamily: "'Inter', sans-serif"
                }}
              >
                <div className="flex items-center gap-4">
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/en/c/c2/Cavalry_FC_logo.svg"
                    alt="Cavalry FC"
                    className="h-12 w-12"
                  />
                  <div>
                    <h2 className="text-2xl font-bold text-white">Player Rankings</h2>
                    <p className="text-text-secondary mt-1">
                      {formatMetricName(selectedMetric)}
                      {' • '}
                      Min. {minMinutes} minutes played
                      {positionFilter !== 'All Positions' ? ` • ${positionFilter}` : ''}
                      {hideZeroValues ? ' • Hiding 0.0 values' : ''}
                      {' • '}
                      Showing {displayedPlayers.length} of {filteredPlayers.length} players
                    </p>
                  </div>
                </div>

                <div className="w-full overflow-x-auto">
                  <table className="min-w-full divide-y divide-border">
                    <thead className="bg-background">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                          Rank
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                          Player
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                          Team
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                          Position
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                          Age
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                          Minutes
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                          {formatMetricName(selectedMetric)}
                        </th>
                        {showPercentiles && (
                          <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                            Percentile
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="bg-surface divide-y divide-border">
                      {displayedPlayers.map((player, index) => {
                        const isHighlightedTeam = teamToHighlight && (
                          player.Team === teamToHighlight || 
                          player['Team within selected timeframe'] === teamToHighlight
                        );
                        
                        const isVanBostPlayer = isVanBost(player);
                        
                        const metricValue = parseFloat(player[selectedMetric]) || 0;
                        const percentileValue = percentileData[player.Player] || 0;
                        
                        return (
                          <tr 
                            key={`${player.id || player.Player}-${index}`}
                            className={`${
                              isVanBostPlayer 
                                ? 'bg-yellow-900/30' 
                                : isHighlightedTeam 
                                  ? 'bg-surface/50' 
                                  : ''
                            } transition-colors hover:bg-background-lighter`}
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-white">
                              {index + 1}
                            </td>
                            <td 
                              className="px-6 py-4 whitespace-nowrap font-bold"
                              style={{ 
                                color: isVanBostPlayer 
                                  ? '#FFD700' 
                                  : isHighlightedTeam 
                                    ? highlightColor 
                                    : 'white'
                              }}
                            >
                              {player.Player}
                              {isVanBostPlayer && (
                                <Star className="h-4 w-4 text-yellow-500 inline-block ml-1" />
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-text-secondary">
                              {player.Team || player['Team within selected timeframe'] || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-text-secondary">
                              {player.Position || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-text-secondary">
                              {player.Age || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-text-secondary">
                              {player['Minutes played'] || 0}
                            </td>
                            <td 
                              className={`px-6 py-4 whitespace-nowrap font-mono ${
                                isHighlightedTeam || isVanBostPlayer ? 'font-bold' : ''
                              }`}
                              style={{ 
                                color: isVanBostPlayer 
                                  ? '#FFD700' 
                                  : isHighlightedTeam 
                                    ? highlightColor 
                                    : 'white'
                              }}
                            >
                              {formatMetricValue(metricValue)}
                            </td>
                            {showPercentiles && (
                              <td className={`px-6 py-4 whitespace-nowrap ${getPercentileColor(percentileValue)}`}>
                                <div className="flex items-center gap-2">
                                  <div className="w-full max-w-[100px] bg-background-lighter h-2 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-primary rounded-full"
                                      style={{ 
                                        width: `${percentileValue}%`,
                                        backgroundColor: isVanBostPlayer 
                                          ? '#FFD700' 
                                          : isHighlightedTeam 
                                            ? highlightColor 
                                            : undefined
                                      }}
                                    ></div>
                                  </div>
                                  <span>{percentileValue.toFixed(0)}%</span>
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-col items-end mt-6">
                  <p className="text-white/90 text-sm font-medium">
                    By: Felipe Ormazabal
                  </p>
                  <div className="flex items-center gap-2 text-white/70 text-xs">
                    <span>Football Scout</span>
                    <span>•</span>
                    <span>Data Analyst</span>
                  </div>
                </div>
              </div>
            ) : selectedMetric && sortedPlayers.length > 0 && displayedPlayers.length === 0 ? (
              <div className="bg-background p-8 rounded-lg border border-border text-center">
                <Trophy className="h-12 w-12 text-warning mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No Players with Non-Zero Values</h3>
                <p className="text-text-secondary">
                  All players have 0.0 values for the selected metric. Try disabling the "Hide 0.0 Values" option or selecting a different metric.
                </p>
                <Button 
                  onClick={() => setHideZeroValues(false)} 
                  className="mt-4"
                  variant="outline"
                >
                  Show All Players (Including 0.0 Values)
                </Button>
              </div>
            ) : (
              <div className="bg-background p-8 rounded-lg border border-border text-center">
                <Trophy className="h-12 w-12 text-primary mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Select a Metric to View Rankings</h3>
                <p className="text-text-secondary">
                  Choose a metric category and specific metric to view player rankings.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Metrics groups with friendly labels
const METRICS = {
  'Build-up': [
    { label: 'Ball Possession', value: 'Possession, %' },
    { label: 'Pass accuracy', value: 'Pass accuracy, %' },
    { label: 'Progressive Pass Success', value: 'Progressive passes accurate, %' },
    { label: 'Final Third Pass Success', value: 'Passes to final third accurate, %' },
    { label: 'Crosses per 90', value: 'Crosses per 90'},
    { label: 'Crosses Accurate', value: 'Crosses accurate, %'}
    
  ],
  'Attack': [
    { label: 'Goals', value: 'Goals' },
    { label: 'Expected Goals', value: 'xG' },
    { label: 'Shot Accuracy', value: 'Shots on target, %' },
    { label: 'Offensive Duels Won', value: 'Offensive duels won, %' },
    { label: 'Cross Accuracy', value: 'Crosses accurate, %' }
  ],
  'Defense': [
    { label: 'Defensive Duels Won', value: 'Defensive duels won, %' },
    { label: 'Aerial Duels Won', value: 'Aerial duels won, %' },
    { label: 'Interceptions', value: 'Interceptions' },
    { label: 'Clearances', value: 'Clearances' },
    { label: 'Sliding Tackles Success', value: 'Sliding tackles successful, %' },
    { label: 'PPDA', value: 'PPDA' },
    { label: 'Goals Conceded', value: 'Conceded goals' },
    { label: 'Shots Against', value: 'Shots against' }
  ],
  'Transitions': [
    { label: 'Counter Attacks with Shots', value: 'Counter attacks with shots, %' },
    { label: 'High Recoveries', value: 'Recoveries / High' },
    { label: 'Low Losses', value: 'Losses / Low' },
    { label: 'Progressive Pass Success', value: 'Progressive passes accurate, %' }
  ],
  'Set Pieces': [
    { label: 'Penalty Conversion', value: 'Penalties converted, %' },
    { label: 'Corners with Shots', value: 'Corners with shots, %' },
    { label: 'Free Kicks with Shots', value: 'Free kicks with shots, %' },
    { label: 'Deep Completed Crosses', value: 'Deep completed crosses' }
  ],
  'Wing Play': [
    { label: 'Total Crosses', value: 'Crosses' },
    { label: 'Cross Accuracy', value: 'Crosses accurate, %' },
    { label: 'Deep Completed Crosses', value: 'Deep completed crosses' },
    { label: 'Box Entries (Crosses)', value: 'Box entries (crosses)' }
  ]
};

export default PlayerRankings;