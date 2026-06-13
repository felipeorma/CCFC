import React, { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Search, RefreshCw, AlertTriangle, Users, ArrowLeftRight, Download, ChevronDown, ChevronUp, Filter } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toPng } from 'html-to-image';
import * as d3 from 'd3';

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
  [key: string]: any;
}

const PlayerComparison: React.FC = () => {
  const [playerData, setPlayerData] = useState<PlayerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const [position, setPosition] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [metricSearchQuery, setMetricSearchQuery] = useState<string>('');
  const [normalizedData, setNormalizedData] = useState<{[player: string]: {[metric: string]: number}}>({});
  const comparisonRef = useRef<HTMLDivElement>(null);
  const [debugMode, setDebugMode] = useState(false);

  // Define neon colors for the radar chart
  const neonColors = [
    { fill: 'rgba(255, 81, 97, 0.3)', stroke: '#FF5161' },    // Red
    { fill: 'rgba(255, 83, 205, 0.3)', stroke: '#FF53cd' },   // Pink
    { fill: 'rgba(148, 97, 253, 0.3)', stroke: '#9461fd' },   // Purple
    { fill: 'rgba(45, 217, 254, 0.3)', stroke: '#2dd9fe' },   // Blue
    { fill: 'rgba(0, 254, 155, 0.3)', stroke: '#00fe9b' },    // Green
    { fill: 'rgba(255, 219, 78, 0.3)', stroke: '#ffdb4e' }    // Yellow
  ];

  // Metric categories for better organization
  const metricCategories = {
    'Attacking': [
      'Goals per 90', 'Non-penalty goals per 90', 'xG per 90', 'Shots per 90', 
      'Shots on target, %', 'Touches in box per 90', 'Dribbles per 90', 'Successful dribbles, %'
    ],
    'Passing': [
      'Assists per 90', 'xA per 90', 'Key passes per 90', 'Passes per 90', 
      'Accurate passes, %', 'Progressive passes per 90', 'Passes to final third per 90',
      'Smart passes per 90', 'Smart passes accurate, %'
    ],
    'Defensive': [
      'Defensive duels per 90', 'Defensive duels won, %', 'Aerial duels per 90', 
      'Aerial duels won, %', 'Interceptions per 90', 'Sliding tackles per 90',
      'Recoveries per 90', 'Clearances per 90'
    ],
    'Physical': [
      'Accelerations per 90', 'Sprints per 90', 'Progressive runs per 90',
      'Duels per 90', 'Duels won, %', 'Fouls suffered per 90', 'Fouls per 90'
    ],
    'Goalkeeper': [
      'Save rate, %', 'Prevented goals per 90', 'Exits per 90', 'Aerial duels per 90',
      'Clean sheets per 90', 'Conceded goals per 90', 'xG against per 90'
    ]
  };

  // Metrics that should be inverted (lower is better)
  const invertedMetrics = [
    'Conceded goals per 90', 
    'xG against per 90',
    'Fouls per 90',
    'PPDA'
  ];

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
        setPlayerData(data[0].data || []);
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

  // Normalize data to percentiles when player data changes or selected metrics change
  useEffect(() => {
    if (playerData.length > 0 && selectedMetrics.length > 0) {
      normalizeDataToPercentiles();
    }
  }, [playerData, selectedMetrics]);

  // Normalize data to percentiles
  const normalizeDataToPercentiles = () => {
    const normalized: {[player: string]: {[metric: string]: number}} = {};
    
    // Initialize normalized data structure
    playerData.forEach(player => {
      normalized[player.Player] = {};
    });

    // For each metric, calculate percentiles
    selectedMetrics.forEach(metric => {
      // Get all values for this metric
      const values = playerData.map(player => player[metric] || 0);
      
      // Calculate percentiles for each player
      playerData.forEach(player => {
        const value = player[metric] || 0;
        
        // Calculate percentile (0-100)
        let percentile = calculatePercentile(value, values);
        
        // Invert percentile if this is a metric where lower is better
        if (shouldInvertMetric(metric)) {
          percentile = 100 - percentile;
        }
        
        // Store the percentile
        normalized[player.Player][metric] = percentile;
      });
    });
    
    if (debugMode) {
      console.log('Normalized data:', normalized);
    }
    
    setNormalizedData(normalized);
  };

  // Check if a metric should be inverted (lower is better)
  const shouldInvertMetric = (metric: string): boolean => {
    return invertedMetrics.includes(metric) || 
           metric.toLowerCase().includes('conceded') ||
           metric.toLowerCase().includes('against');
  };

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

  // Get available positions from player data
  const availablePositions = useMemo(() => {
    const positions = new Set<string>();
    
    playerData.forEach(player => {
      if (player.MappedPositions && Array.isArray(player.MappedPositions)) {
        player.MappedPositions.forEach(pos => positions.add(pos));
      }
    });
    
    return Array.from(positions).sort();
  }, [playerData]);

  // Get available metrics for the selected position
  const availableMetrics = useMemo(() => {
    if (!playerData.length) return [];
    
    // Get all metrics from the first player
    const allMetrics = Object.keys(playerData[0]).filter(key => 
      // Filter out non-metric fields
      !['id', 'Player', 'Team', 'Position', 'Age', 'Market value', 'Minutes played', 
        'Contract expires', 'MappedPositions'].includes(key) &&
      // Ensure it's a numeric value
      typeof playerData[0][key] === 'number'
    );
    
    // If position is selected, filter metrics by position category
    if (position === 'Goalkeeper') {
      return allMetrics.filter(metric => 
        metricCategories.Goalkeeper.includes(metric) || 
        metric.toLowerCase().includes('save') || 
        metric.toLowerCase().includes('goal') ||
        metric.toLowerCase().includes('prevent')
      ).sort();
    } else if (position) {
      // For other positions, exclude goalkeeper metrics
      return allMetrics.filter(metric => 
        !metricCategories.Goalkeeper.includes(metric) &&
        !metric.toLowerCase().includes('save rate') &&
        !metric.toLowerCase().includes('prevented goals')
      ).sort();
    }
    
    return allMetrics.sort();
  }, [playerData, position]);

  // Filter metrics by search query
  const filteredMetrics = useMemo(() => {
    if (!metricSearchQuery) return availableMetrics;
    
    return availableMetrics.filter(metric => 
      metric.toLowerCase().includes(metricSearchQuery.toLowerCase())
    );
  }, [availableMetrics, metricSearchQuery]);

  // Filter players by position and search query
  const filteredPlayers = useMemo(() => {
    if (!playerData.length) return [];
    
    return playerData.filter(player => {
      // Filter by position if selected
      const positionMatch = !position || 
        (player.MappedPositions && 
         Array.isArray(player.MappedPositions) && 
         player.MappedPositions.includes(position));
      
      // Filter by search query
      const searchMatch = !searchQuery || 
        player.Player.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (player.Team && player.Team.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (player['Team within selected timeframe'] && 
         player['Team within selected timeframe'].toLowerCase().includes(searchQuery.toLowerCase()));
      
      return positionMatch && searchMatch;
    });
  }, [playerData, position, searchQuery]);

  // Sort filtered players
  const sortedPlayers = useMemo(() => {
    if (!filteredPlayers.length) return [];
    
    return [...filteredPlayers].sort((a, b) => {
      if (!sortBy) return 0;
      
      const valueA = a[sortBy] || 0;
      const valueB = b[sortBy] || 0;
      
      return sortDirection === 'asc' 
        ? valueA - valueB 
        : valueB - valueA;
    });
  }, [filteredPlayers, sortBy, sortDirection]);

  // Get player data for selected players
  const selectedPlayersData = useMemo(() => {
    return playerData.filter(player => selectedPlayers.includes(player.Player));
  }, [playerData, selectedPlayers]);

  // Get metrics organized by category
  const organizedMetrics = useMemo(() => {
    const result: { [category: string]: string[] } = {};
    
    // Initialize categories
    Object.keys(metricCategories).forEach(category => {
      result[category] = [];
    });
    
    // Categorize available metrics
    filteredMetrics.forEach(metric => {
      let assigned = false;
      
      // Check each category
      Object.entries(metricCategories).forEach(([category, categoryMetrics]) => {
        if (categoryMetrics.includes(metric) || 
            categoryMetrics.some(catMetric => metric.includes(catMetric))) {
          result[category].push(metric);
          assigned = true;
        }
      });
      
      // If not assigned to any category, put in "Other"
      if (!assigned) {
        if (!result["Other"]) result["Other"] = [];
        result["Other"].push(metric);
      }
    });
    
    // Remove empty categories
    Object.keys(result).forEach(category => {
      if (result[category].length === 0) {
        delete result[category];
      }
    });
    
    return result;
  }, [filteredMetrics]);

  // Handle player selection
  const handlePlayerSelect = (player: string) => {
    if (selectedPlayers.includes(player)) {
      setSelectedPlayers(prev => prev.filter(p => p !== player));
    } else {
      // Limit to 5 players maximum
      if (selectedPlayers.length < 5) {
        setSelectedPlayers(prev => [...prev, player]);
      }
    }
  };

  // Handle metric selection
  const handleMetricSelect = (metric: string) => {
    if (selectedMetrics.includes(metric)) {
      setSelectedMetrics(prev => prev.filter(m => m !== metric));
    } else {
      setSelectedMetrics(prev => [...prev, metric]);
    }
  };

  // Handle sort change
  const handleSortChange = (metric: string) => {
    if (sortBy === metric) {
      // Toggle direction if same metric
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new metric and default to descending
      setSortBy(metric);
      setSortDirection('desc');
    }
  };

  // Download comparison as image
  const downloadComparison = async () => {
    if (!comparisonRef.current) return;
    
    try {
      const dataUrl = await toPng(comparisonRef.current, {
        quality: 0.95,
        backgroundColor: '#121212'
      });
      
      const link = document.createElement('a');
      link.download = `player-comparison-${new Date().toISOString().split('T')[0]}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error downloading comparison:', err);
      setError('Failed to download comparison image');
    }
  };

  // Create radar chart using D3
  useEffect(() => {
    if (!selectedPlayersData.length || !selectedMetrics.length) return;
    
    // Clear previous chart
    d3.select('#radar-chart').selectAll('*').remove();
    
    const width = 500;
    const height = 500;
    const margin = 70;
    const radius = Math.min(width, height) / 2 - margin;
    
    // Create SVG
    const svg = d3.select('#radar-chart')
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width/2},${height/2})`);
    
    // Scales
    const angleScale = d3.scaleLinear()
      .domain([0, selectedMetrics.length])
      .range([0, 2 * Math.PI]);
    
    // Create radar lines using normalized percentile data
    selectedPlayersData.forEach((player, i) => {
      const color = neonColors[i % neonColors.length];
      
      // Create points for the radar using percentile values
      const points = selectedMetrics.map((metric, j) => {
        // Get the normalized percentile value (0-100)
        const percentileValue = normalizedData[player.Player]?.[metric] || 0;
        // Scale to radius (0-1)
        const normalizedValue = percentileValue / 100;
        const angle = angleScale(j);
        return {
          x: radius * normalizedValue * Math.sin(angle),
          y: -radius * normalizedValue * Math.cos(angle)
        };
      });
      
      // Create line generator
      const lineGenerator = d3.lineRadial<{angle: number, radius: number}>()
        .angle(d => d.angle)
        .radius(d => d.radius)
        .curve(d3.curveLinearClosed);
      
      // Convert points to angle/radius format
      const radialPoints = points.map((point, j) => {
        return {
          angle: angleScale(j),
          radius: Math.sqrt(point.x * point.x + point.y * point.y)
        };
      });
      
      // Add an extra point to close the path
      radialPoints.push(radialPoints[0]);
      
      // Draw radar path
      svg.append('path')
        .datum(radialPoints)
        .attr('d', lineGenerator as any)
        .attr('fill', color.fill)
        .attr('stroke', color.stroke)
        .attr('stroke-width', 2)
        .attr('stroke-opacity', 0.8)
        .attr('fill-opacity', 0.5);
      
      // Add points
      svg.selectAll(`.point-${i}`)
        .data(points)
        .enter()
        .append('circle')
        .attr('cx', d => d.x)
        .attr('cy', d => d.y)
        .attr('r', 4)
        .attr('fill', color.stroke)
        .attr('stroke', '#121212')
        .attr('stroke-width', 1);
    });
    
    // Add axis lines
    selectedMetrics.forEach((metric, i) => {
      const angle = angleScale(i);
      const x = radius * Math.sin(angle);
      const y = -radius * Math.cos(angle);
      
      // Draw axis line
      svg.append('line')
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('x2', x)
        .attr('y2', y)
        .attr('stroke', 'rgba(255, 255, 255, 0.2)')
        .attr('stroke-width', 1);
      
      // Add axis label
      svg.append('text')
        .attr('x', 1.1 * x)
        .attr('y', 1.1 * y)
        .attr('text-anchor', angle > Math.PI ? 'end' : 'start')
        .attr('dominant-baseline', 'middle')
        .attr('fill', 'rgba(255, 255, 255, 0.8)')
        .attr('font-size', '12px')
        .text(formatMetricName(metric));
    });
    
    // Add concentric circles for percentiles
    [25, 50, 75, 100].forEach(percentile => {
      const level = percentile / 100;
      svg.append('circle')
        .attr('cx', 0)
        .attr('cy', 0)
        .attr('r', radius * level)
        .attr('fill', 'none')
        .attr('stroke', 'rgba(255, 255, 255, 0.1)')
        .attr('stroke-width', 1);
      
      // Add percentile labels
      svg.append('text')
        .attr('x', 5)
        .attr('y', -radius * level - 5)
        .attr('text-anchor', 'start')
        .attr('fill', 'rgba(255, 255, 255, 0.5)')
        .attr('font-size', '10px')
        .text(`${percentile}%`);
    });
    
    // Add legend
    const legend = svg.append('g')
      .attr('transform', `translate(${-width/2 + 20}, ${-height/2 + 20})`);
    
    selectedPlayersData.forEach((player, i) => {
      const color = neonColors[i % neonColors.length];
      
      legend.append('rect')
        .attr('x', 0)
        .attr('y', i * 20)
        .attr('width', 15)
        .attr('height', 15)
        .attr('fill', color.stroke);
      
      legend.append('text')
        .attr('x', 20)
        .attr('y', i * 20 + 12)
        .attr('fill', 'white')
        .attr('font-size', '12px')
        .text(`${player.Player} (${player.Team || player['Team within selected timeframe'] || ''})`);
    });
    
  }, [selectedPlayersData, selectedMetrics, normalizedData]);

  // Format metric name for display
  const formatMetricName = (metric: string): string => {
    // Remove "per 90" suffix for display
    let displayName = metric.replace(' per 90', '');
    
    // Capitalize first letter of each word
    displayName = displayName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    return displayName;
  };

  // Select all metrics in a category
  const selectAllInCategory = (category: string) => {
    if (!organizedMetrics[category]) return;
    
    const metricsToAdd = organizedMetrics[category].filter(
      metric => !selectedMetrics.includes(metric)
    );
    
    if (metricsToAdd.length > 0) {
      setSelectedMetrics(prev => [...prev, ...metricsToAdd]);
    }
  };

  // Clear all metrics in a category
  const clearAllInCategory = (category: string) => {
    if (!organizedMetrics[category]) return;
    
    setSelectedMetrics(prev => 
      prev.filter(metric => !organizedMetrics[category].includes(metric))
    );
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
              <Users className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-text-primary">Player Comparison</h2>
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
              Please upload player data files in the Settings page to view player comparisons.
            </p>
            <p className="text-sm text-text-secondary">
              Data uploaded in Settings will be used for player performance comparison and analysis.
            </p>
            <Button onClick={fetchPlayerData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Data
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-text-primary mb-2 block">Position Filter</Label>
                <Select value={position} onValueChange={setPosition}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px] overflow-y-auto">
                    <SelectItem value="">All Positions</SelectItem>
                    {availablePositions.map(pos => (
                      <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-text-primary mb-2 block">Search Players</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-secondary" />
                  <input
                    type="text"
                    placeholder="Search by name or team..."
                    className="pl-9 w-full h-10 bg-background border border-background-lighter rounded-md text-text-primary focus:border-primary focus:outline-none"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <Label className="text-text-primary mb-2 block">Sort By</Label>
                <Select value={sortBy} onValueChange={handleSortChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select metric" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px] overflow-y-auto">
                    <SelectItem value="">No Sorting</SelectItem>
                    <SelectItem value="Minutes played">Minutes Played</SelectItem>
                    <SelectItem value="Age">Age</SelectItem>
                    <SelectItem value="Market value">Market Value</SelectItem>
                    {availableMetrics.slice(0, 10).map(metric => (
                      <SelectItem key={metric} value={metric}>{formatMetricName(metric)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 bg-background p-4 rounded-lg border border-border">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Available Players
                  <span className="text-sm text-text-secondary ml-2">
                    ({sortedPlayers.length})
                  </span>
                </h3>
                
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {sortedPlayers.length === 0 ? (
                    <div className="text-center py-8 text-text-secondary">
                      No players match your filters
                    </div>
                  ) : (
                    sortedPlayers.map(player => (
                      <div
                        key={player.id || player.Player}
                        className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                          selectedPlayers.includes(player.Player)
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary'
                        }`}
                        onClick={() => handlePlayerSelect(player.Player)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{player.Player}</p>
                            <div className="flex items-center gap-2 text-sm text-text-secondary">
                              <span>{player.Team || player['Team within selected timeframe'] || ''}</span>
                              <span>•</span>
                              <span>{player.Position}</span>
                              {sortBy && (
                                <>
                                  <span>•</span>
                                  <span className="font-mono">
                                    {typeof player[sortBy] === 'number' 
                                      ? player[sortBy].toFixed(2) 
                                      : player[sortBy]}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-xs bg-background-lighter px-2 py-1 rounded">
                              {player.Age} y/o
                            </div>
                            <div className="text-xs bg-background-lighter px-2 py-1 rounded">
                              {player['Minutes played']} min
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              <div className="lg:col-span-2">
                <div className="bg-background p-4 rounded-lg border border-border">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <ArrowLeftRight className="h-5 w-5 text-primary" />
                      Player Comparison (Percentiles)
                    </h3>
                    
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedPlayers([])}
                        disabled={selectedPlayers.length === 0}
                      >
                        Clear
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={downloadComparison}
                        disabled={selectedPlayers.length === 0 || selectedMetrics.length === 0}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDebugMode(!debugMode)}
                      >
                        Debug: {debugMode ? 'On' : 'Off'}
                      </Button>
                    </div>
                  </div>
                  
                  {selectedPlayers.length === 0 ? (
                    <div className="text-center py-12 text-text-secondary">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
                      <p>Select players from the list to compare</p>
                    </div>
                  ) : (
                    <div ref={comparisonRef} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <Label className="text-text-primary">Select Metrics</Label>
                            <div className="relative">
                              <Search className="absolute left-2 top-1.5 h-3 w-3 text-text-secondary" />
                              <input
                                type="text"
                                placeholder="Search metrics..."
                                className="pl-6 py-1 text-xs w-40 bg-background border border-background-lighter rounded-md text-text-primary focus:border-primary focus:outline-none"
                                value={metricSearchQuery}
                                onChange={(e) => setMetricSearchQuery(e.target.value)}
                              />
                            </div>
                          </div>
                          
                          <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar space-y-3">
                            {Object.entries(organizedMetrics).map(([category, metrics]) => (
                              <div key={category} className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-sm font-medium text-primary">{category}</h4>
                                  <div className="flex gap-2">
                                    <button 
                                      className="text-xs text-text-secondary hover:text-text-primary"
                                      onClick={() => selectAllInCategory(category)}
                                    >
                                      Select All
                                    </button>
                                    <button 
                                      className="text-xs text-text-secondary hover:text-text-primary"
                                      onClick={() => clearAllInCategory(category)}
                                    >
                                      Clear
                                    </button>
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-2">
                                  {metrics.map(metric => (
                                    <div
                                      key={metric}
                                      className={`p-2 rounded border text-sm cursor-pointer transition-colors ${
                                        selectedMetrics.includes(metric)
                                          ? 'border-primary bg-primary/10 text-white'
                                          : 'border-border hover:border-primary text-text-secondary'
                                      }`}
                                      onClick={() => handleMetricSelect(metric)}
                                    >
                                      <div className="flex items-center justify-between">
                                        <span>{formatMetricName(metric)}</span>
                                        {shouldInvertMetric(metric) && (
                                          <span className="text-xs text-warning">(inv)</span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <Label className="text-text-primary mb-2 block">Selected Players</Label>
                          <div className="space-y-2">
                            {selectedPlayersData.map((player, index) => (
                              <div 
                                key={player.id || player.Player}
                                className="flex items-center justify-between p-2 rounded bg-background-lighter"
                              >
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="w-3 h-3 rounded-full" 
                                    style={{ backgroundColor: neonColors[index % neonColors.length].stroke }}
                                  ></div>
                                  <span>{player.Player}</span>
                                </div>
                                <span className="text-xs text-text-secondary">{player.Team || player['Team within selected timeframe'] || ''}</span>
                              </div>
                            ))}
                          </div>
                          
                          {selectedPlayersData.length > 0 && (
                            <div className="mt-4 space-y-3">
                              <h4 className="text-sm font-medium text-primary">Player Details</h4>
                              <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                  <thead>
                                    <tr className="bg-background-lighter">
                                      <th className="p-2 text-left text-xs">Player</th>
                                      <th className="p-2 text-left text-xs">Age</th>
                                      <th className="p-2 text-left text-xs">Position</th>
                                      <th className="p-2 text-left text-xs">Minutes</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {selectedPlayersData.map((player, index) => (
                                      <tr key={`${player.id}-details`} className="border-t border-border">
                                        <td className="p-2 text-xs font-medium" style={{ color: neonColors[index % neonColors.length].stroke }}>
                                          {player.Player}
                                        </td>
                                        <td className="p-2 text-xs">{player.Age}</td>
                                        <td className="p-2 text-xs">{player.Position}</td>
                                        <td className="p-2 text-xs">{player['Minutes played']}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {selectedMetrics.length > 0 && selectedPlayers.length > 0 && (
                        <div className="mt-6">
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                              <thead>
                                <tr className="bg-background-lighter">
                                  <th className="p-2 text-left">Metric</th>
                                  {selectedPlayersData.map(player => (
                                    <th key={player.id || player.Player} className="p-2 text-left">
                                      {player.Player}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {selectedMetrics.map(metric => (
                                  <tr key={metric} className="border-t border-border">
                                    <td className="p-2 font-medium">
                                      {formatMetricName(metric)}
                                      {shouldInvertMetric(metric) && (
                                        <span className="text-xs text-warning ml-1">(inverted)</span>
                                      )}
                                    </td>
                                    {selectedPlayersData.map((player, index) => {
                                      const originalValue = player[metric];
                                      const percentileValue = normalizedData[player.Player]?.[metric] || 0;
                                      const color = neonColors[index % neonColors.length].stroke;
                                      
                                      return (
                                        <td 
                                          key={player.id || player.Player} 
                                          className="p-2"
                                        >
                                          <div className="font-mono" style={{ color }}>
                                            {percentileValue.toFixed(1)}%
                                          </div>
                                          <div className="text-xs text-text-secondary">
                                            Value: {typeof originalValue === 'number' ? originalValue.toFixed(2) : originalValue || '-'}
                                          </div>
                                        </td>
                                      );
                                    })}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          
                          <div className="mt-8 h-[500px] flex items-center justify-center">
                            <div id="radar-chart" className="w-full h-full"></div>
                          </div>
                          
                          <div className="mt-4 p-2 bg-background-lighter rounded-lg">
                            <p className="text-xs text-text-secondary">
                              <strong>Note:</strong> All values are normalized to percentiles (0-100%) for fair comparison. 
                              A percentile of 90% means the player performs better than 90% of other players for that metric.
                              For metrics where lower values are better (marked with "inverted"), the percentiles are inverted so higher is always better.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerComparison;