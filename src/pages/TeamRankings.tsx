import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Download, Trash2, AlertTriangle } from 'lucide-react';
import { toPng } from 'html-to-image';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { getTeamLogo } from '../utils/teamLogos';

interface TeamRankingsData {
  id: string;
  data: {
    teams: any[];
  };
  created_at: string;
}

const TeamRankings: React.FC = () => {
  const [teamsData, setTeamsData] = useState<any[]>([]);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [highlightColor, setHighlightColor] = useState('#ff0000');
  const [teamToHighlight, setTeamToHighlight] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadedRankings, setLoadedRankings] = useState<TeamRankingsData[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const { isAdmin } = useAuth();

  // Load Google Fonts
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap';
    document.head.appendChild(link);
  }, []);

  // Fetch existing rankings on component mount
  useEffect(() => {
    fetchRankings();
  }, []);

  const fetchRankings = async () => {
    try {
      const { data, error } = await supabase
        .from('team_rankings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLoadedRankings(data || []);
      
      // If we have data, load the first ranking
      if (data && data.length > 0) {
        setTeamsData(data[0].data.teams);
      }
    } catch (err) {
      console.error('Error fetching rankings:', err);
    }
  };

  const handleDeleteRanking = async (id: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('team_rankings')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Refresh rankings after deletion
      await fetchRankings();
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Error deleting ranking:', err);
      setError('Failed to delete ranking');
    } finally {
      setLoading(false);
    }
  };

  const loadRanking = (ranking: TeamRankingsData) => {
    setTeamsData(ranking.data.teams);
  };

  const calculateScore = (team: any, metrics: string[]) => {
    return metrics.reduce((score, metric) => {
      const value = team.data[metric] || 0;
      return score + value;
    }, 0);
  };

  const downloadTable = async () => {
    if (tableRef.current) {
      try {
        const container = tableRef.current;
        const { width, height } = container.getBoundingClientRect();
        const scale = Math.min(1200 / width, 1600 / height);

        const dataUrl = await toPng(container, {
          quality: 1,
          backgroundColor: '#0e1117',
          width: width * scale,
          height: height * scale,
          style: {
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            width: `${width}px`,
            height: `${height}px`
          }
        });

        const link = document.createElement('a');
        const timestamp = new Date().toISOString().split('T')[0];
        link.download = `team-analysis-${timestamp}.png`;
        link.href = dataUrl;
        link.click();
      } catch (err) {
        console.error('Error downloading image:', err);
      }
    }
  };

  return (
    <div className="space-y-8 p-6">
      <div className="bg-surface rounded-lg shadow-lg border border-border p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-text-primary">Team Rankings</h2>
        </div>

        <div className="space-y-6">
          {error && (
            <div className="bg-error/10 text-error p-4 rounded-lg border border-error/50">
              {error}
            </div>
          )}



          {teamsData.length > 0 ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="text-text-secondary mb-2 block">Metrics to Rank</label>
                  <select
                    className="select-field"
                    value={selectedMetrics[0] || ''}
                    onChange={(e) => setSelectedMetrics([e.target.value])}
                  >
                    <option value="">Select metric</option>
                    {Object.entries(METRICS).map(([group, metrics]) => (
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

                {/* Team to Highlight */}
<div>
  <label className="text-text-secondary mb-2 block">Team to Highlight</label>
  <select
    className="select-field"
    value={teamToHighlight}
    onChange={(e) => setTeamToHighlight(e.target.value)}
  >
    <option value="">None</option>
    {teamsData.map((t) => (
      <option key={t.name} value={t.name}>
        {t.name}
      </option>
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
                    onClick={downloadTable}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                    disabled={!selectedMetrics.length}
                  >
                    <Download className="h-4 w-4" />
                    Download Table
                  </button>
                </div>
              </div>

              {selectedMetrics.length > 0 && (
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
                      <h2 className="text-2xl font-bold text-white">Team Performance Analysis</h2>
                      <p className="text-text-secondary mt-1">
                        {selectedMetrics.map(metric => 
                          Object.values(METRICS)
                            .flat()
                            .find(m => m.value === metric)?.label || metric
                        ).join(' • ')}
                      </p>
                    </div>
                  </div>

                  <div className="w-full">
                    <table className="min-w-full divide-y divide-border">
                      <thead className="bg-background">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                            Rank
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                            Team
                          </th>
                          {selectedMetrics.map(metric => {
                            const metricLabel = Object.values(METRICS)
                              .flat()
                              .find(m => m.value === metric)?.label || metric;
                            
                            return (
                              <th key={metric} className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                                {metricLabel}
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody className="bg-surface divide-y divide-border">
                        {teamsData
                          .sort((a, b) => calculateScore(b, selectedMetrics) - calculateScore(a, selectedMetrics))
                          .map((team, index) => {
                            const isHighlightedTeam = team.name === teamToHighlight;
                            
                            return (
                              <tr 
                                key={team.name}
                                className={`${isHighlightedTeam ? 'bg-surface/50' : ''} transition-colors`}
                              >
                                <td className="px-6 py-4 whitespace-nowrap text-white">
                                  {index + 1}
                                </td>
                                <td
                                  className="px-6 py-4 whitespace-nowrap font-bold"
                                  style={{
                                    color: isHighlightedTeam ? highlightColor : 'white'
                                  }}
                                >
                                  <div className="flex items-center gap-3">
                                    {getTeamLogo(team.name) && (
                                      <img
                                        src={getTeamLogo(team.name)}
                                        alt={team.name}
                                        className="w-6 h-6 object-contain"
                                      />
                                    )}
                                    {team.name}
                                  </div>
                                </td>
                                {selectedMetrics.map(metric => {
                                  const value = team.data[metric] || 0;
                                  const maxValue = Math.max(...teamsData.map(t => t.data[metric] || 0));
                                  const isHighest = value === maxValue;
                                  const shouldHighlight = isHighlightedTeam && isHighest;

                                  return (
                                    <td 
                                      key={metric}
                                      className={`px-6 py-4 whitespace-nowrap ${
                                        isHighest ? 'font-semibold' : ''
                                      }`}
                                      style={{ 
                                        color: shouldHighlight ? highlightColor : 'white'
                                      }}
                                    >
                                      {typeof value === 'number' ? value.toFixed(2) : value}
                                    </td>
                                  );
                                })}
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
              )}
            </div>
          ) : (
            <div className="bg-background p-8 rounded-lg border border-border text-center">
              <AlertTriangle className="h-12 w-12 text-warning mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No Season Data Available</h3>
              <p className="text-text-secondary mb-4">
                Please upload team data files in the Settings page to view team rankings.
              </p>
              <p className="text-sm text-text-secondary">
                Data uploaded in Settings will be used for team performance comparisons and rankings.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Metrics groups with friendly labels
// Metrics groups with friendly labels
const METRICS = {
  'Build-up': [
    { label: 'Possession %', value: 'Possession, %' },
    { label: 'Passes accurate %', value: 'Passes accurate, %' },
    { label: 'Progressive passes accurate %', value: 'Progressive passes accurate, %' },
    { label: 'Passes to final third accurate %', value: 'Passes to final third accurate, %' }
  ],
  'Attack': [
    { label: 'Goals', value: 'Goals' },
    { label: 'Expected Goals (xG)', value: 'xG' },
    { label: 'Shots on target %', value: 'Shots on target, %' },
    { label: 'Offensive duels won %', value: 'Offensive duels won, %' },
    { label: 'Crosses accurate %', value: 'Crosses accurate, %' }
  ],
  'Defense': [
    { label: 'Defensive duels won %', value: 'Defensive duels won, %' },
    { label: 'Aerial duels won %', value: 'Aerial duels won, %' },
    { label: 'Interceptions', value: 'Interceptions' },
    { label: 'Clearances', value: 'Clearances' },
    { label: 'Sliding tackles successful %', value: 'Sliding tackles successful, %' },
    { label: 'PPDA', value: 'PPDA' },
    { label: 'Goals conceded', value: 'Conceded goals' },
    { label: 'Shots against', value: 'Shots against' }
  ],
  'Transitions': [
    { label: 'Counterattacks with shots %', value: 'Counterattacks with shots, %' },
    { label: 'Recoveries / High', value: 'Recoveries / High' },
    { label: 'Losses / Low', value: 'Losses / Low' },
    { label: 'Progressive passes accurate %', value: 'Progressive passes accurate, %' }
  ],
  'Set Pieces': [
    { label: 'Penalties converted %', value: 'Penalties converted, %' },
    { label: 'Corners with shots %', value: 'Corners with shots, %' },
    { label: 'Free kicks with shots %', value: 'Free kicks with shots, %' },
    { label: 'Deep completed crosses', value: 'Deep completed crosses' }
  ],
  'Wing Play': [
    { label: 'Crosses', value: 'Crosses' },
    { label: 'Crosses accurate %', value: 'Crosses accurate, %' },
    { label: 'Deep completed crosses', value: 'Deep completed crosses' },
    { label: 'Penalty area entries (crosses)', value: 'Penalty area entries (crosses)' }
  ]
};

export default TeamRankings;