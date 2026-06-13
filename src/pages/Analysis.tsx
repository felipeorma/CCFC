import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { parseFixture, toISODateOrFallback } from '../utils/helpers';
import { positionMapping } from '../types/metrics';
import { Brain, TrendingUp, Users, Target, Shield, Zap, BarChart3, TriangleAlert as AlertTriangle, RefreshCw, Download, Activity, Award, Clock, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { Button } from '../components/ui/button';
import { analyticsEngine } from '../utils/analysisEngine';
import { toPng } from 'html-to-image';

interface PlayerData {
  Player: string;
  Team: string;
  Position: string;
  'Minutes played': number;
  MappedPositions?: string[];
  [key: string]: any;
}

interface PositionAnalysis {
  playerCount: number;
  avgForwardPasses: number;
  forwardPassAccuracy: number;
  avgBackPasses: number;
  backPassAccuracy: number;
  avgLateralPasses: number;
  lateralPassAccuracy: number;
  avgLongPasses: number;
  longPassAccuracy: number;
  avgReceivedPasses: number;
  avgPassLength: number;
  avgLongPassLength: number;
}

interface MatchPair {
  match: string;
  date: string;
  isoDate: string;
  cavalryRow: any;
  opponentRow: any;
  parsed: any;
  chronologicalIndex: number;
  round?: string;
}

const Analysis: React.FC = () => {
  const [playerData, setPlayerData] = useState<PlayerData[]>([]);
  const [teamRankings, setTeamRankings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRounds, setSelectedRounds] = useState<string[]>(['Round 1', 'Round 2']);
  const [analysisReport, setAnalysisReport] = useState<any>(null);
  const [comparisonMode, setComparisonMode] = useState<string>('rounds');
  const [selectedOpponent, setSelectedOpponent] = useState<string>('');
  const [selectedMatchIndex, setSelectedMatchIndex] = useState<number>(-1);
  const [selectedMatches, setSelectedMatches] = useState<number[]>([-1, -1]);
  const [opponentAnalysisReport, setOpponentAnalysisReport] = useState<any>(null);
  const [matchAnalysisReport, setMatchAnalysisReport] = useState<any>(null);
  const [matchVsMatchReport, setMatchVsMatchReport] = useState<any>(null);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([
    'avgXG', 'avgGoalsFor', 'avgXGA', 'avgGoalsAgainst', 'avgShots',
    'avgPossession', 'avgPassAccuracy', 'winRate', 'conversionRate'
  ]);
  const [generatingAI, setGeneratingAI] = useState<{
    rounds: boolean;
    opponent: boolean;
    match: boolean;
    matchVsMatch: boolean;
    tacticalInsights: boolean;
  }>({
    rounds: false,
    opponent: false,
    match: false,
    matchVsMatch: false,
    tacticalInsights: false
  });
  const [aiTacticalInsights, setAiTacticalInsights] = useState<string[] | null>(null);
  const [aiGeneratedReports, setAiGeneratedReports] = useState<{
    rounds: boolean;
    opponent: boolean;
    match: boolean;
    matchVsMatch: boolean;
  }>({
    rounds: false,
    opponent: false,
    match: false,
    matchVsMatch: false
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Player data
      const { data: playerDataResult, error: playerError } = await supabase
        .from('player_data')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

      if (playerError) {
        console.warn('Error fetching player data:', playerError);
      } else if (playerDataResult && playerDataResult.length > 0) {
        setPlayerData(playerDataResult[0].data || []);
      }

      // Team data
      const { data: teamRankingsResult, error: teamError } = await supabase
        .from('team_rankings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

      if (teamError) {
        console.warn('Error fetching team data:', teamError);
      } else if (teamRankingsResult && teamRankingsResult.length > 0) {
        setTeamRankings(teamRankingsResult);
      }
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(`Failed to load data: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Cavalry team data
  const cavalryTeamData = useMemo(() => {
    if (!teamRankings.length) return null;
    const latestRanking = teamRankings[0];
    if (!latestRanking.data?.teams) return null;
    return latestRanking.data.teams.find((team: any) => 
      team.name?.toLowerCase().includes('cavalry')
    );
  }, [teamRankings]);

  // Helper: Create match pairs from team rows
  const createMatchPairs = (teamData: any): MatchPair[] => {
    if (!teamData?.rows?.length) return [];
    
    const pairs: MatchPair[] = [];
    
    // Process rows starting from index 2, every 2 rows
    for (let i = 2; i < teamData.rows.length; i += 2) {
      const cavalryRow = teamData.rows[i];
      const opponentRow = teamData.rows[i + 1];
      
      if (!cavalryRow?.match || !opponentRow?.match) continue;
      if (cavalryRow.match !== opponentRow.match) continue;
      
      const parsed = parseFixture(cavalryRow.match, teamData.name);
      if (!parsed) continue;
      
      // Extract date from multiple possible fields
      const rawDate = cavalryRow.Date || cavalryRow.date || cavalryRow.DATE || '';
      const chronologicalIndex = Math.floor((i - 2) / 2);
      const isoDate = toISODateOrFallback(rawDate, '2025', chronologicalIndex);
      
      pairs.push({
        match: cavalryRow.match,
        date: rawDate,
        isoDate,
        cavalryRow,
        opponentRow,
        parsed,
        chronologicalIndex
      });
    }
    
    return pairs;
  };

  // Helper: Assign rounds to matches based on chronological order
  const assignRoundsToMatches = (pairs: MatchPair[]): MatchPair[] => {
    // Sort by ISO date (ascending - oldest first)
    const sortedPairs = [...pairs].sort((a, b) => a.isoDate.localeCompare(b.isoDate));
    
    // Assign rounds based on chronological position
    return sortedPairs.map((pair, index) => {
      let round: string;
      if (index <= 6) round = 'Round 1';
      else if (index <= 13) round = 'Round 2';
      else if (index <= 20) round = 'Round 3';
      else if (index <= 27) round = 'Round 4';
      else round = 'Playoffs';
      
      return {
        ...pair,
        round,
        chronologicalIndex: index // Update with actual chronological position
      };
    });
  };

  // Main helper: Process match pairs with rounds
  const processMatchPairs = (teamData: any): MatchPair[] => {
    const pairs = createMatchPairs(teamData);
    return assignRoundsToMatches(pairs);
  };

  // Processed match pairs (centralized)
  const matchPairs = useMemo(() => {
    return processMatchPairs(cavalryTeamData);
  }, [cavalryTeamData]);

  // Pass analysis by position
  const passAnalysis = useMemo(() => {
    if (!playerData.length) return {};
    const analysis: { [position: string]: PositionAnalysis } = {};
    
    ['Goalkeeper', 'Defender', 'Fullback', 'Midfielder', 'Wingers', 'Forward'].forEach(position => {
      analysis[position] = {
        playerCount: 0,
        avgForwardPasses: 0,
        forwardPassAccuracy: 0,
        avgBackPasses: 0,
        backPassAccuracy: 0,
        avgLateralPasses: 0,
        lateralPassAccuracy: 0,
        avgLongPasses: 0,
        longPassAccuracy: 0,
        avgReceivedPasses: 0,
        avgPassLength: 0,
        avgLongPassLength: 0
      };
    });

    playerData.forEach(player => {
      const firstPosition = String(player.Position || '').split(',')[0].trim();
      if (!firstPosition) return;
      
      const isCavalryPlayer = player.Team?.toLowerCase().includes('cavalry') ||
                             player['Team within selected timeframe']?.toLowerCase().includes('cavalry');
      if (!isCavalryPlayer) return;

      const mappedPosition = positionMapping[firstPosition as keyof typeof positionMapping];
      if (mappedPosition && analysis[mappedPosition]) {
        const pos = analysis[mappedPosition];
        pos.playerCount++;
        pos.avgForwardPasses += parseFloat(player['Forward passes per 90']) || 0;
        pos.forwardPassAccuracy += parseFloat(player['Accurate forward passes, %']) || 0;
        pos.avgBackPasses += parseFloat(player['Back passes per 90']) || 0;
        pos.backPassAccuracy += parseFloat(player['Accurate back passes, %']) || 0;
        pos.avgLateralPasses += parseFloat(player['Lateral passes per 90']) || 0;
        pos.lateralPassAccuracy += parseFloat(player['Accurate lateral passes, %']) || 0;
        pos.avgLongPasses += parseFloat(player['Long passes per 90']) || 0;
        pos.longPassAccuracy += parseFloat(player['Accurate long passes, %']) || 0;
        pos.avgReceivedPasses += parseFloat(player['Received passes per 90']) || 0;
        pos.avgPassLength += parseFloat(player['Average pass length, m']) || 0;
        pos.avgLongPassLength += parseFloat(player['Average long pass length, m']) || 0;
      }
    });

    Object.keys(analysis).forEach(position => {
      const pos = analysis[position];
      if (pos.playerCount > 0) {
        pos.avgForwardPasses = Number((pos.avgForwardPasses / pos.playerCount).toFixed(1));
        pos.forwardPassAccuracy = Number((pos.forwardPassAccuracy / pos.playerCount).toFixed(1));
        pos.avgBackPasses = Number((pos.avgBackPasses / pos.playerCount).toFixed(1));
        pos.backPassAccuracy = Number((pos.backPassAccuracy / pos.playerCount).toFixed(1));
        pos.avgLateralPasses = Number((pos.avgLateralPasses / pos.playerCount).toFixed(1));
        pos.lateralPassAccuracy = Number((pos.lateralPassAccuracy / pos.playerCount).toFixed(1));
        pos.avgLongPasses = Number((pos.avgLongPasses / pos.playerCount).toFixed(1));
        pos.longPassAccuracy = Number((pos.longPassAccuracy / pos.playerCount).toFixed(1));
        pos.avgReceivedPasses = Number((pos.avgReceivedPasses / pos.playerCount).toFixed(1));
        pos.avgPassLength = Number((pos.avgPassLength / pos.playerCount).toFixed(1));
        pos.avgLongPassLength = Number((pos.avgLongPassLength / pos.playerCount).toFixed(1));
      }
    });

    return analysis;
  }, [playerData]);

  const passEffectivenessInsights = useMemo(() => {
    if (!passAnalysis || Object.keys(passAnalysis).length === 0) return [];
    const insights: string[] = [];
    
    ['Goalkeeper', 'Defender', 'Fullback', 'Midfielder', 'Wingers', 'Forward'].forEach(posType => {
      const analysis = passAnalysis[posType];
      if (!analysis || analysis.playerCount === 0) return;
      
      if (analysis.forwardPassAccuracy > 0) {
        const forwardEffectiveness = analysis.forwardPassAccuracy >= 75 ? 'excellent' : 
                                    analysis.forwardPassAccuracy >= 65 ? 'solid' : 
                                    analysis.forwardPassAccuracy >= 55 ? 'adequate' : 'concerning';
        insights.push(`${posType} (${analysis.playerCount} players) demonstrate ${forwardEffectiveness} forward passing accuracy at ${analysis.forwardPassAccuracy}% with ${analysis.avgForwardPasses} forward passes per 90, indicating ${forwardEffectiveness === 'excellent' ? 'strong progression capabilities' : forwardEffectiveness === 'solid' ? 'reliable build-up contribution' : 'areas for tactical improvement'}.`);
      }
      
      if (analysis.backPassAccuracy > 0) {
        const backPassEffectiveness = analysis.backPassAccuracy >= 85 ? 'exceptional' :
                                    analysis.backPassAccuracy >= 75 ? 'strong' :
                                    analysis.backPassAccuracy >= 65 ? 'adequate' : 'inconsistent';
        insights.push(`${posType} maintain ${backPassEffectiveness} ball retention with ${analysis.backPassAccuracy}% accuracy on ${analysis.avgBackPasses} back passes per 90, demonstrating ${backPassEffectiveness === 'exceptional' ? 'elite possession management' : backPassEffectiveness === 'strong' ? 'reliable ball security' : 'room for improvement in possession phases'}.`);
      }

      if (analysis.lateralPassAccuracy > 0) {
        const lateralEffectiveness = analysis.lateralPassAccuracy >= 80 ? 'excellent' :
                                    analysis.lateralPassAccuracy >= 70 ? 'solid' :
                                    analysis.lateralPassAccuracy >= 60 ? 'adequate' : 'concerning';
        insights.push(`${posType} show ${lateralEffectiveness} width circulation with ${analysis.lateralPassAccuracy}% accuracy on ${analysis.avgLateralPasses} lateral passes per 90, indicating ${lateralEffectiveness === 'excellent' ? 'strong ability to stretch opposition defenses' : lateralEffectiveness === 'solid' ? 'effective lateral movement' : 'limited width in ball circulation'}.`);
      }

      if (analysis.longPassAccuracy > 0) {
        const longPassEffectiveness = analysis.longPassAccuracy >= 70 ? 'strong' :
                                    analysis.longPassAccuracy >= 60 ? 'adequate' : 'weak';
        insights.push(`${posType} display ${longPassEffectiveness} long-range distribution with ${analysis.longPassAccuracy}% success rate on ${analysis.avgLongPasses} long passes per 90, with average long pass distance of ${analysis.avgLongPassLength}m per player.`);
      }
    });

    return insights;
  }, [passAnalysis]);

  const squadDepthAnalysis = useMemo(() => {
    if (!playerData.length) return null;
    
    const cavalryPlayers = playerData.filter(player => 
      player.Team?.toLowerCase().includes('cavalry') ||
      player['Team within selected timeframe']?.toLowerCase().includes('cavalry')
    );
    
    if (!cavalryPlayers.length) return null;

    const positionGroups = {
      'Goalkeeper': cavalryPlayers.filter(p => {
        const firstPos = String(p.Position || '').split(',')[0].trim();
        return positionMapping[firstPos as keyof typeof positionMapping] === 'Goalkeeper';
      }),
      'Defender': cavalryPlayers.filter(p => {
        const firstPos = String(p.Position || '').split(',')[0].trim();
        return positionMapping[firstPos as keyof typeof positionMapping] === 'Defender';
      }),
      'Fullback': cavalryPlayers.filter(p => {
        const firstPos = String(p.Position || '').split(',')[0].trim();
        return positionMapping[firstPos as keyof typeof positionMapping] === 'Fullback';
      }),
      'Midfielder': cavalryPlayers.filter(p => {
        const firstPos = String(p.Position || '').split(',')[0].trim();
        return positionMapping[firstPos as keyof typeof positionMapping] === 'Midfielder';
      }),
      'Wingers': cavalryPlayers.filter(p => {
        const firstPos = String(p.Position || '').split(',')[0].trim();
        return positionMapping[firstPos as keyof typeof positionMapping] === 'Wingers';
      }),
      'Forward': cavalryPlayers.filter(p => {
        const firstPos = String(p.Position || '').split(',')[0].trim();
        return positionMapping[firstPos as keyof typeof positionMapping] === 'Forward';
      })
    };

    const analysis: any = {};
    Object.entries(positionGroups).forEach(([position, players]) => {
      if (players.length === 0) return;
      
      const totalMinutes = players.reduce((sum, p) => sum + (p['Minutes played'] || 0), 0);
      const avgMinutes = totalMinutes / players.length;
      const regularStarters = players.filter(p => (p['Minutes played'] || 0) >= 1000).length;
      const squadPlayers = players.filter(p => (p['Minutes played'] || 0) >= 270).length;
      const minutesDistribution = players.map(p => p['Minutes played'] || 0).sort((a, b) => b - a);
      const topPlayerMinutes = minutesDistribution[0] || 0;
      const secondPlayerMinutes = minutesDistribution[1] || 0;
      const depthRatio = topPlayerMinutes > 0 ? secondPlayerMinutes / topPlayerMinutes : 0;
      
      let depthQuality = 'limited';
      if (depthRatio >= 0.7) depthQuality = 'excellent';
      else if (depthRatio >= 0.5) depthQuality = 'good';
      else if (depthRatio >= 0.3) depthQuality = 'adequate';
      
      analysis[position] = {
        totalPlayers: players.length,
        regularStarters,
        squadPlayers,
        avgMinutes: Math.round(avgMinutes),
        depthQuality,
        depthRatio: Number((depthRatio * 100).toFixed(1)),
        topMinutes: topPlayerMinutes,
        secondMinutes: secondPlayerMinutes
      };
    });

    return analysis;
  }, [playerData]);

  const playersByPosition = useMemo(() => {
    if (!playerData.length) return {};
    
    const cavalryPlayers = playerData.filter(player => 
      player.Team?.toLowerCase().includes('cavalry') ||
      player['Team within selected timeframe']?.toLowerCase().includes('cavalry')
    );

    const positionGroups: { [position: string]: PlayerData[] } = {
      'Goalkeeper': [],
      'Defender': [],
      'Fullback': [],
      'Midfielder': [],
      'Wingers': [],
      'Forward': []
    };

    cavalryPlayers.forEach(player => {
      const firstPosition = String(player.Position || '').split(',')[0].trim();
      if (!firstPosition) return;
      
      const mappedPosition = positionMapping[firstPosition as keyof typeof positionMapping];
      if (mappedPosition && positionGroups[mappedPosition]) {
        positionGroups[mappedPosition].push(player);
      }
    });

    return positionGroups;
  }, [playerData]);

  // Performance by rounds using centralized match pairs
  const performanceByRounds = useMemo(() => {
    if (!matchPairs.length) return [];
    
    // Group pairs by round
    const roundGroups = matchPairs.reduce((acc, pair) => {
      const round = pair.round || 'Round 1';
      if (!acc[round]) {
        acc[round] = {
          round,
          matches: [],
          totalGoals: 0,
          totalGoalsAgainst: 0,
          totalXG: 0,
          totalXGA: 0,
          totalShots: 0,
          totalShotsAgainst: 0,
          totalPossession: 0,
          totalPassAccuracy: 0,
          totalPPDA: 0,
          totalPPDAAgainst: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          matchCount: 0
        };
      }
      
      const group = acc[round];
      const cavalryRow = pair.cavalryRow;
      const opponentRow = pair.opponentRow;
      
      // Extract metrics using exact headers
      const goals = parseFloat(cavalryRow.Goals) || 0;
      const goalsAgainst = parseFloat(cavalryRow['Conceded goals']) || 0;
      const xg = parseFloat(cavalryRow.xG) || 0;
      const xga = parseFloat(opponentRow.xG) || 0; // XGA del rival
      const shots = parseFloat(cavalryRow['Shots on target']) || 0;
      const shotsAgainst = parseFloat(cavalryRow['Shots against on target']) || 0;
      const possession = parseFloat(cavalryRow['Possession, %']) || 0;
      const passAccuracy = parseFloat(cavalryRow['Passes accurate, %']) || 0;
      const ppda = parseFloat(cavalryRow.PPDA || cavalryRow.ppda || cavalryRow['PPDA']) || 0;
      const ppdaAgainst = parseFloat(opponentRow.PPDA || opponentRow.ppda || opponentRow['PPDA']) || 0;
      
      // Determine result based on actual goals
      let result = 'draw';
      if (goals > goalsAgainst) {
        result = 'win';
        group.wins++;
      } else if (goals < goalsAgainst) {
        result = 'loss';
        group.losses++;
      } else {
        group.draws++;
      }
      
      group.matches.push({
        match: pair.match,
        date: pair.date,
        opponent: pair.parsed.opponent,
        isHome: pair.parsed.isHome,
        goals,
        goalsAgainst,
        xg,
        xga,
        shots,
        shotsAgainst,
        possession,
        passAccuracy,
        ppda,
        ppdaAgainst,
        result,
        round: pair.round,
        venue: pair.parsed.isHome ? 'Home' : 'Away',
        score: `${goals}-${goalsAgainst}`
      });

      // Accumulate totals for averages
      group.totalGoals += goals;
      group.totalGoalsAgainst += goalsAgainst;
      group.totalXG += xg;
      group.totalXGA += xga;
      group.totalShots += shots;
      group.totalShotsAgainst += shotsAgainst;
      group.totalPossession += possession;
      group.totalPassAccuracy += passAccuracy;
      group.totalPPDA += ppda;
      group.totalPPDAAgainst += ppdaAgainst;
      group.matchCount++;
      
      return acc;
    }, {} as any);
    
    // Calculate averages and sort rounds
    return Object.values(roundGroups).map((group: any) => ({
      ...group,
      avgGoals: group.matchCount > 0 ? (group.totalGoals / group.matchCount).toFixed(2) : '0.00',
      avgGoalsAgainst: group.matchCount > 0 ? (group.totalGoalsAgainst / group.matchCount).toFixed(2) : '0.00',
      avgXG: group.matchCount > 0 ? (group.totalXG / group.matchCount).toFixed(2) : '0.00',
      avgXGA: group.matchCount > 0 ? (group.totalXGA / group.matchCount).toFixed(2) : '0.00',
      avgShots: group.matchCount > 0 ? (group.totalShots / group.matchCount).toFixed(1) : '0.0',
      avgShotsAgainst: group.matchCount > 0 ? (group.totalShotsAgainst / group.matchCount).toFixed(1) : '0.0',
      avgPossession: group.matchCount > 0 ? (group.totalPossession / group.matchCount).toFixed(1) : '0.0',
      avgPassAccuracy: group.matchCount > 0 ? (group.totalPassAccuracy / group.matchCount).toFixed(1) : '0.0',
      avgPPDA: group.matchCount > 0 ? (group.totalPPDA / group.matchCount).toFixed(2) : '0.00',
      avgPPDAAgainst: group.matchCount > 0 ? (group.totalPPDAAgainst / group.matchCount).toFixed(2) : '0.00',
      winRate: group.matchCount > 0 ? ((group.wins / group.matchCount) * 100).toFixed(1) : '0.0',
      conversionRate: group.totalXG > 0 ? ((group.totalGoals / group.totalXG) * 100).toFixed(1) : '0.0',
      defensiveEfficiency: group.totalXGA > 0 ? (100 - (group.totalGoalsAgainst / group.totalXGA) * 100).toFixed(1) : '100.0'
    })).sort((a: any, b: any) => {
      // Sort rounds: Round 1, Round 2, Round 3, Round 4, Playoffs
      if (a.round === 'Playoffs') return 1;
      if (b.round === 'Playoffs') return -1;
      const aNum = parseInt(a.round.replace(/\D+/g, ''), 10) || 0;
      const bNum = parseInt(b.round.replace(/\D+/g, ''), 10) || 0;
      return aNum - bNum;
    });
  }, [matchPairs]);

  // Available rounds from processed pairs
  const availableRounds = useMemo(() => {
    const rounds = new Set<string>();
    matchPairs.forEach(pair => {
      if (pair.round) rounds.add(pair.round);
    });
    
    // Sort rounds: Round 1 → Round 4 → Playoffs
    return Array.from(rounds).sort((a, b) => {
      if (a === 'Playoffs') return 1;
      if (b === 'Playoffs') return -1;
      const aNum = parseInt(a.replace(/\D+/g, ''), 10) || 0;
      const bNum = parseInt(b.replace(/\D+/g, ''), 10) || 0;
      return aNum - bNum;
    });
  }, [matchPairs]);

  // Available opponents from processed pairs
  const availableOpponents = useMemo(() => {
    const opponents = new Set<string>();
    matchPairs.forEach(pair => {
      if (pair.parsed?.opponent) opponents.add(pair.parsed.opponent);
    });
    return Array.from(opponents).sort();
  }, [matchPairs]);

  // Available matches for UI (newest first for display)
  const availableMatches = useMemo(() => {
    return [...matchPairs]
      .sort((a, b) => b.isoDate.localeCompare(a.isoDate)) // Newest first for UI
      .map(pair => ({
        date: pair.date,
        round: pair.round,
        match: pair.match,
        opponent: pair.parsed?.opponent || 'Unknown',
        result: pair.parsed ? `${pair.parsed.teamGoals}-${pair.parsed.oppGoals}` : 'Unknown',
        chronologicalIndex: pair.chronologicalIndex,
        dateISO: pair.isoDate,
        cavalryRow: pair.cavalryRow,
        opponentRow: pair.opponentRow
      }));
  }, [matchPairs]);

  // Round comparison using filtered pairs
  const roundComparison = useMemo(() => {
    if (!matchPairs.length || selectedRounds.length !== 2) return null;
    
    const roundData: any = {};
    
    selectedRounds.forEach(round => {
      const roundPairs = matchPairs.filter(pair => pair.round === round);
      
      if (!roundPairs.length) return;
      
      const totalMatches = roundPairs.length;
      let totalGoalsFor = 0, totalGoalsAgainst = 0, wins = 0, draws = 0, losses = 0;
      let totalXG = 0, totalXGA = 0, totalShots = 0, totalShotsAgainst = 0, totalPoss = 0, totalPassAcc = 0;
      let totalPPDA = 0, totalPPDAAgainst = 0;

      roundPairs.forEach(pair => {
        const cavalryData = pair.cavalryRow;
        const opponentData = pair.opponentRow;

        if (pair.parsed) {
          totalGoalsFor += pair.parsed.teamGoals;
          totalGoalsAgainst += pair.parsed.oppGoals;
          if (pair.parsed.teamGoals > pair.parsed.oppGoals) wins++;
          else if (pair.parsed.teamGoals === pair.parsed.oppGoals) draws++;
          else losses++;
        }

        totalXG += parseFloat(cavalryData.xG) || 0;
        totalXGA += parseFloat(opponentData.xG) || 0; // XGA del rival
        totalShots += parseFloat(cavalryData['Shots on target']) || 0;
        totalShotsAgainst += parseFloat(cavalryData['Shots against on target']) || 0;
        totalPoss += parseFloat(cavalryData['Possession, %']) || 0;
        totalPassAcc += parseFloat(cavalryData['Passes accurate, %']) || 0;
        totalPPDA += parseFloat(cavalryData.PPDA || cavalryData.ppda || cavalryData['PPDA']) || 0;
        totalPPDAAgainst += parseFloat(opponentData.PPDA || opponentData.ppda || opponentData['PPDA']) || 0;
      });
      
      roundData[round] = {
        round,
        matches: roundPairs.map(pair => ({
          date: pair.date,
          round: pair.round,
          match: pair.match,
          opponent: pair.parsed?.opponent || 'Unknown',
          result: pair.parsed ? `${pair.parsed.teamGoals}-${pair.parsed.oppGoals}` : '–',
          isHome: pair.parsed?.isHome ?? null
        })),
        avgXG: Number((totalXG / totalMatches).toFixed(2)),
        avgXGA: Number((totalXGA / totalMatches).toFixed(2)),
        avgGoalsFor: Number((totalGoalsFor / totalMatches).toFixed(2)),
        avgGoalsAgainst: Number((totalGoalsAgainst / totalMatches).toFixed(2)),
        avgShots: Number((totalShots / totalMatches).toFixed(2)),
        avgShotsAgainst: Number((totalShotsAgainst / totalMatches).toFixed(2)),
        avgPossession: Number((totalPoss / totalMatches).toFixed(1)),
        avgPassAccuracy: Number((totalPassAcc / totalMatches).toFixed(1)),
        avgPPDA: Number((totalPPDA / totalMatches).toFixed(2)),
        avgPPDAAgainst: Number((totalPPDAAgainst / totalMatches).toFixed(2)),
        winRate: Number(((wins / totalMatches) * 100).toFixed(1)),
        conversionRate: totalXG > 0 ? Number(((totalGoalsFor / totalXG) * 100).toFixed(1)) : 0,
        defensiveEfficiency: totalXGA > 0 ? Number((100 - (totalGoalsAgainst / totalXGA) * 100).toFixed(1)) : 100
      };
    });
    
    return roundData;
  }, [matchPairs, selectedRounds]);

  // Season averages from all pairs
  const seasonAverages = useMemo(() => {
    if (!matchPairs.length) return {};
    
    const totalMatches = matchPairs.length;
    let totalGoalsFor = 0, totalGoalsAgainst = 0, wins = 0;
    let totalXG = 0, totalXGA = 0, totalShots = 0, totalShotsAgainst = 0, totalPoss = 0, totalPassAcc = 0;

    matchPairs.forEach(pair => {
      if (pair.parsed) {
        totalGoalsFor += pair.parsed.teamGoals;
        totalGoalsAgainst += pair.parsed.oppGoals;
        if (pair.parsed.teamGoals > pair.parsed.oppGoals) wins++;
      }

      totalXG += parseFloat(pair.cavalryRow.xG) || 0;
      totalXGA += parseFloat(pair.opponentRow.xG) || 0; // XGA del rival
      totalShots += parseFloat(pair.cavalryRow['Shots on target']) || 0;
      totalShotsAgainst += parseFloat(pair.cavalryRow['Shots against on target']) || 0;
      totalPoss += parseFloat(pair.cavalryRow['Possession, %']) || 0;
      totalPassAcc += parseFloat(pair.cavalryRow['Passes accurate, %']) || 0;
    });
    
    return {
      avgXG: totalMatches ? Number((totalXG / totalMatches).toFixed(2)) : 0,
      avgXGA: totalMatches ? Number((totalXGA / totalMatches).toFixed(2)) : 0,
      avgGoalsFor: totalMatches ? Number((totalGoalsFor / totalMatches).toFixed(2)) : 0,
      avgGoalsAgainst: totalMatches ? Number((totalGoalsAgainst / totalMatches).toFixed(2)) : 0,
      avgShots: totalMatches ? Number((totalShots / totalMatches).toFixed(1)) : 0,
      avgShotsAgainst: totalMatches ? Number((totalShotsAgainst / totalMatches).toFixed(1)) : 0,
      avgPossession: totalMatches ? Number((totalPoss / totalMatches).toFixed(1)) : 0,
      avgPassAccuracy: totalMatches ? Number((totalPassAcc / totalMatches).toFixed(1)) : 0,
      winRate: totalMatches ? Number(((wins / totalMatches) * 100).toFixed(1)) : 0,
      conversionRate: totalXG > 0 ? Number(((totalGoalsFor / totalXG) * 100).toFixed(1)) : 0
    };
  }, [matchPairs]);

  // Opponent comparison using filtered pairs
  const opponentComparison = useMemo(() => {
    if (!matchPairs.length || !selectedOpponent) return null;
    
    const opponentPairs = matchPairs.filter(pair => 
      pair.parsed?.opponent === selectedOpponent
    );
    
    if (!opponentPairs.length) return null;
    
    const totalMatches = opponentPairs.length;
    let totalGoalsFor = 0, totalGoalsAgainst = 0, wins = 0, draws = 0, losses = 0;
    let totalXG = 0, totalXGA = 0, totalShots = 0, totalShotsAgainst = 0, totalPoss = 0, totalPassAcc = 0;
    let totalPPDA = 0, totalPPDAAgainst = 0;

    opponentPairs.forEach(pair => {
      if (pair.parsed) {
        totalGoalsFor += pair.parsed.teamGoals;
        totalGoalsAgainst += pair.parsed.oppGoals;
        if (pair.parsed.teamGoals > pair.parsed.oppGoals) wins++;
        else if (pair.parsed.teamGoals === pair.parsed.oppGoals) draws++;
        else losses++;
      }

      totalXG += parseFloat(pair.cavalryRow.xG) || 0;
      totalXGA += parseFloat(pair.opponentRow.xG) || 0; // XGA del rival
      totalShots += parseFloat(pair.cavalryRow['Shots on target']) || 0;
      totalShotsAgainst += parseFloat(pair.cavalryRow['Shots against on target']) || 0;
      totalPoss += parseFloat(pair.cavalryRow['Possession, %']) || 0;
      totalPassAcc += parseFloat(pair.cavalryRow['Passes accurate, %']) || 0;
      totalPPDA += parseFloat(pair.cavalryRow.PPDA || pair.cavalryRow.ppda || pair.cavalryRow['PPDA']) || 0;
      totalPPDAAgainst += parseFloat(pair.opponentRow.PPDA || pair.opponentRow.ppda || pair.opponentRow['PPDA']) || 0;
    });
    
    return {
      matches: opponentPairs.map(pair => ({
        date: pair.date,
        round: pair.round,
        match: pair.match,
        opponent: pair.parsed?.opponent || 'Unknown',
        result: pair.parsed ? `${pair.parsed.teamGoals}-${pair.parsed.oppGoals}` : '–',
        isHome: pair.parsed?.isHome ?? null
      })),
      avgXG: Number((totalXG / totalMatches).toFixed(2)),
      avgXGA: Number((totalXGA / totalMatches).toFixed(2)),
      avgGoalsFor: Number((totalGoalsFor / totalMatches).toFixed(2)),
      avgGoalsAgainst: Number((totalGoalsAgainst / totalMatches).toFixed(2)),
      avgShots: Number((totalShots / totalMatches).toFixed(1)),
      avgShotsAgainst: Number((totalShotsAgainst / totalMatches).toFixed(1)),
      avgPossession: Number((totalPoss / totalMatches).toFixed(1)),
      avgPassAccuracy: Number((totalPassAcc / totalMatches).toFixed(1)),
      avgPPDA: Number((totalPPDA / totalMatches).toFixed(2)),
      avgPPDAAgainst: Number((totalPPDAAgainst / totalMatches).toFixed(2)),
      winRate: Number(((wins / totalMatches) * 100).toFixed(1)),
      conversionRate: totalXG > 0 ? Number(((totalGoalsFor / totalXG) * 100).toFixed(1)) : 0,
      seasonAvg: seasonAverages
    };
  }, [matchPairs, selectedOpponent, seasonAverages]);

  // Match comparison using available matches
  const matchComparison = useMemo(() => {
    if (!availableMatches.length || selectedMatchIndex < 0) return null;
    
    const selectedMatch = availableMatches[selectedMatchIndex];
    if (!selectedMatch) return null;
    
    // Find the corresponding pair for detailed data
    const matchPair = matchPairs.find(pair => 
      pair.match === selectedMatch.match && pair.date === selectedMatch.date
    );
    
    if (!matchPair) return null;
    
    return {
      match: {
        ...selectedMatch,
        avgXG: parseFloat(matchPair.cavalryRow.xG) || 0,
        avgXGA: parseFloat(matchPair.opponentRow.xG) || 0,
        avgGoalsFor: matchPair.parsed?.teamGoals || 0,
        avgGoalsAgainst: matchPair.parsed?.oppGoals || 0,
        avgShots: parseFloat(matchPair.cavalryRow['Shots on target']) || 0,
        avgShotsAgainst: parseFloat(matchPair.opponentRow['Shots on target']) || 0,
        avgPossession: parseFloat(matchPair.cavalryRow['Possession, %']) || 0,
        avgPPDA: parseFloat(matchPair.cavalryRow.PPDA || matchPair.cavalryRow.ppda || matchPair.cavalryRow['PPDA']) || 0,
        avgPPDAAgainst: parseFloat(matchPair.opponentRow.PPDA || matchPair.opponentRow.ppda || matchPair.opponentRow['PPDA']) || 0
      },
      seasonAverage: seasonAverages
    };
  }, [availableMatches, selectedMatchIndex, matchPairs, seasonAverages]);

  // Match vs match comparison
  const matchVsMatchComparison = useMemo(() => {
    if (!availableMatches.length || selectedMatches[0] < 0 || selectedMatches[1] < 0) return null;
    
    const match1 = availableMatches[selectedMatches[0]];
    const match2 = availableMatches[selectedMatches[1]];
    
    if (!match1 || !match2) return null;

    // Find corresponding pairs
    const pair1 = matchPairs.find(pair => 
      pair.match === match1.match && pair.date === match1.date
    );
    const pair2 = matchPairs.find(pair => 
      pair.match === match2.match && pair.date === match2.date
    );
    
    if (!pair1 || !pair2) return null;

    return {
      match1: {
        ...match1,
        avgXG: parseFloat(pair1.cavalryRow.xG) || 0,
        avgXGA: parseFloat(pair1.opponentRow.xG) || 0,
        avgGoalsFor: pair1.parsed?.teamGoals || 0,
        avgGoalsAgainst: pair1.parsed?.oppGoals || 0,
        avgShots: parseFloat(pair1.cavalryRow['Shots on target']) || 0,
        avgShotsAgainst: parseFloat(pair1.opponentRow['Shots on target']) || 0,
        avgPossession: parseFloat(pair1.cavalryRow['Possession, %']) || 0,
        avgPPDA: parseFloat(pair1.cavalryRow.PPDA || pair1.cavalryRow.ppda || pair1.cavalryRow['PPDA']) || 0,
        avgPPDAAgainst: parseFloat(pair1.opponentRow.PPDA || pair1.opponentRow.ppda || pair1.opponentRow['PPDA']) || 0
      },
      match2: {
        ...match2,
        avgXG: parseFloat(pair2.cavalryRow.xG) || 0,
        avgXGA: parseFloat(pair2.opponentRow.xG) || 0,
        avgGoalsFor: pair2.parsed?.teamGoals || 0,
        avgGoalsAgainst: pair2.parsed?.oppGoals || 0,
        avgShots: parseFloat(pair2.cavalryRow['Shots on target']) || 0,
        avgShotsAgainst: parseFloat(pair2.opponentRow['Shots on target']) || 0,
        avgPossession: parseFloat(pair2.cavalryRow['Possession, %']) || 0,
        avgPPDA: parseFloat(pair2.cavalryRow.PPDA || pair2.cavalryRow.ppda || pair2.cavalryRow['PPDA']) || 0,
        avgPPDAAgainst: parseFloat(pair2.opponentRow.PPDA || pair2.opponentRow.ppda || pair2.opponentRow['PPDA']) || 0
      }
    };
  }, [availableMatches, selectedMatches, matchPairs]);

  // AI Analysis Reports are now generated ONLY when user clicks "Generate Report with AI" button
  // No automatic report generation

  // Clear AI reports and insights when comparison mode changes
  useEffect(() => {
    setAnalysisReport(null);
    setOpponentAnalysisReport(null);
    setMatchAnalysisReport(null);
    setMatchVsMatchReport(null);
    setAiTacticalInsights(null);
    setAiGeneratedReports({
      rounds: false,
      opponent: false,
      match: false,
      matchVsMatch: false
    });
  }, [comparisonMode]);

  // Manual AI Report Generation Functions
  const generateRoundsAIReport = async () => {
    if (!roundComparison || Object.keys(roundComparison).length !== 2) return;
    setGeneratingAI(prev => ({ ...prev, rounds: true }));
    try {
      console.log('🚀 Generating AI report for rounds comparison...');
      const rounds = Object.values(roundComparison);
      console.log('Round 1:', rounds[0]);
      console.log('Round 2:', rounds[1]);
      const report = await analyticsEngine.generateDeclineAnalysis(rounds[0], rounds[1], 'round', true);
      console.log('✅ Report generated successfully');
      setAnalysisReport(report);
      setAiGeneratedReports(prev => ({ ...prev, rounds: true }));
    } catch (err) {
      console.error('❌ AI generation error:', err);
      alert(`Failed to generate AI report: ${err instanceof Error ? err.message : 'Unknown error'}. Please check the console for details.`);
    } finally {
      setGeneratingAI(prev => ({ ...prev, rounds: false }));
    }
  };

  const generateOpponentAIReport = async () => {
    if (!opponentComparison || !opponentComparison.seasonAvg) return;
    setGeneratingAI(prev => ({ ...prev, opponent: true }));
    try {
      console.log('🚀 Generating AI report for opponent comparison...');
      const report = await analyticsEngine.generateDeclineAnalysis(
        opponentComparison.seasonAvg,
        opponentComparison,
        'opponent',
        true
      );
      console.log('✅ Report generated successfully');
      setOpponentAnalysisReport(report);
      setAiGeneratedReports(prev => ({ ...prev, opponent: true }));
    } catch (err) {
      console.error('❌ AI generation error:', err);
      alert(`Failed to generate AI report: ${err instanceof Error ? err.message : 'Unknown error'}. Please check the console for details.`);
    } finally {
      setGeneratingAI(prev => ({ ...prev, opponent: false }));
    }
  };

  const generateMatchAIReport = async () => {
    if (!matchComparison) return;
    setGeneratingAI(prev => ({ ...prev, match: true }));
    try {
      const report = await analyticsEngine.generateDeclineAnalysis(
        matchComparison.seasonAverage,
        matchComparison.match,
        'match',
        true
      );
      setMatchAnalysisReport(report);
      setAiGeneratedReports(prev => ({ ...prev, match: true }));
    } catch (err) {
      console.error('AI generation error:', err);
    } finally {
      setGeneratingAI(prev => ({ ...prev, match: false }));
    }
  };

  const generateMatchVsMatchAIReport = async () => {
    if (!matchVsMatchComparison) return;
    setGeneratingAI(prev => ({ ...prev, matchVsMatch: true }));
    try {
      const report = await analyticsEngine.generateDeclineAnalysis(
        matchVsMatchComparison.match1,
        matchVsMatchComparison.match2,
        'match',
        true
      );
      setMatchVsMatchReport(report);
      setAiGeneratedReports(prev => ({ ...prev, matchVsMatch: true }));
    } catch (err) {
      console.error('AI generation error:', err);
    } finally {
      setGeneratingAI(prev => ({ ...prev, matchVsMatch: false }));
    }
  };

  const generateDataDrivenInsights = () => {
    if (!passAnalysis || Object.keys(passAnalysis).length === 0) {
      console.error('❌ No pass analysis data available');
      setAiTacticalInsights(['No passing data available yet. Please upload player data first.']);
      return;
    }

    console.log('📊 Generating data-driven insights from:', passAnalysis);
    const insights: string[] = [];

    Object.entries(passAnalysis).forEach(([position, data]: [string, any]) => {
      if (!data || data.playerCount === 0) {
        console.log(`⏭️ Skipping ${position} - no players`);
        return;
      }

      console.log(`🔍 Analyzing ${position}:`, data);

      const playerText = data.playerCount === 1 ? 'player' : 'players';
      const passes = [
        { type: 'forward', accuracy: data.forwardPassAccuracy, avg: data.avgForwardPasses, label: 'forward passes' },
        { type: 'back', accuracy: data.backPassAccuracy, avg: data.avgBackPasses, label: 'back passes' },
        { type: 'lateral', accuracy: data.lateralPassAccuracy, avg: data.avgLateralPasses, label: 'lateral passes' },
        { type: 'long', accuracy: data.longPassAccuracy, avg: data.avgLongPasses, label: 'long passes' }
      ].filter(p => p.avg > 0 && p.accuracy > 0);

      console.log(`  📊 ${position} pass types with data:`, passes.length);

      if (passes.length === 0) {
        console.log(`  ⚠️ ${position} has no valid pass data`);
        return;
      }

      const bestPass = passes.reduce((best, current) =>
        current.accuracy > best.accuracy ? current : best
      );
      const worstPass = passes.reduce((worst, current) =>
        current.accuracy < worst.accuracy ? current : worst
      );

      const allPasses = passes.reduce((sum, p) => sum + p.avg, 0);
      const avgAccuracy = passes.reduce((sum, p) => sum + p.accuracy, 0) / passes.length;

      let insight = `${position}: `;

      if (avgAccuracy >= 75) {
        insight += `Strong passing game with ${avgAccuracy.toFixed(0)}% average accuracy. `;
      } else if (avgAccuracy >= 65) {
        insight += `Solid passing foundation (${avgAccuracy.toFixed(0)}% accuracy). `;
      } else {
        insight += `Passing needs improvement (${avgAccuracy.toFixed(0)}% accuracy). `;
      }

      if (bestPass.accuracy >= 80) {
        insight += `Excellent ${bestPass.label} (${bestPass.accuracy.toFixed(0)}%, ${bestPass.avg.toFixed(1)}/game)`;
      } else if (bestPass.accuracy >= 70) {
        insight += `Good ${bestPass.label} (${bestPass.accuracy.toFixed(0)}%, ${bestPass.avg.toFixed(1)}/game)`;
      } else {
        insight += `Best at ${bestPass.label} (${bestPass.accuracy.toFixed(0)}%, ${bestPass.avg.toFixed(1)}/game)`;
      }

      if (worstPass.type !== bestPass.type) {
        const diff = bestPass.accuracy - worstPass.accuracy;
        if (diff > 15) {
          insight += `, but ${worstPass.label} need work (${worstPass.accuracy.toFixed(0)}%)`;
        } else if (worstPass.accuracy < 60) {
          insight += `, ${worstPass.label} inconsistent (${worstPass.accuracy.toFixed(0)}%)`;
        }
      }

      insight += `. Total: ${allPasses.toFixed(1)} passes/game. ${data.playerCount} ${playerText} analyzed.`;

      console.log(`  ✅ Generated insight for ${position}`);
      insights.push(insight);
    });

    console.log(`📋 Total insights generated: ${insights.length}`);

    if (insights.length > 0) {
      setAiTacticalInsights(insights);
      console.log('✅ Generated', insights.length, 'data-driven insights');
    } else {
      setAiTacticalInsights(['No insights could be generated. Please ensure player data is loaded with passing statistics.']);
    }
  };

  const generateTacticalInsightsWithAI = async () => {
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
      console.warn('⚠️ VITE_GEMINI_API_KEY not configured, using data-driven analysis');
      generateDataDrivenInsights();
      return;
    }

    if (!passAnalysis || Object.keys(passAnalysis).length === 0) {
      console.error('❌ No pass analysis data available');
      setAiTacticalInsights(['No passing data available yet. Please upload match data first.']);
      return;
    }

    console.log('🚀 Starting AI generation with data:', passAnalysis);
    setGeneratingAI(prev => ({ ...prev, tacticalInsights: true }));
    try {
      const prompt = `You are a soccer coach analyzing passing effectiveness. Write simple insights that anyone can understand.

PASSING DATA BY POSITION:
${JSON.stringify(passAnalysis, null, 2)}

INSTRUCTIONS:
- Write ONE insight per position that has data
- Use SIMPLE soccer language (no technical jargon)
- Start EVERY line with: Position Name: (example: "Goalkeeper:" or "Defender:")
- Focus on what players are doing well or poorly with their passes
- Mention specific percentages to show how good/bad they are

EXAMPLES OF GOOD INSIGHTS:
Goalkeeper: Keepers are doing great with long passes (85% accuracy) which helps start attacks from the back.
Defender: Center backs complete 72% of forward passes, showing they're reliable at building from defense.
Midfielder: The midfield is strong at keeping the ball moving sideways (88% accuracy on lateral passes).
Forward: Strikers struggle with pass accuracy (only 58% forward), they need to improve decision-making.

NOW ANALYZE THE DATA ABOVE - Write 4-6 simple insights, ONE per position:`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`);
      }

      const data = await response.json();
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      console.log('✅ Gemini raw response:', generatedText);

      if (!generatedText || generatedText.length < 10) {
        console.error('❌ Empty or very short response from Gemini');
        console.log('⚠️ Falling back to data-driven analysis due to empty response...');
        generateDataDrivenInsights();
        return;
      }

      const insights = generatedText
        .split('\n')
        .map((line: string) => line.trim())
        .filter((line: string) => {
          const hasPosition = /^(Goalkeeper|Defender|Fullback|Midfielder|Wingers|Forward)s?:/i.test(line);
          return line.length > 15 && hasPosition;
        })
        .map((line: string) => line.replace(/^[-•*]\s*/, '').trim())
        .slice(0, 6);

      console.log('✅ Parsed insights:', insights);
      console.log('✅ Number of insights:', insights.length);

      if (insights.length > 0) {
        setAiTacticalInsights(insights);
        console.log('✅ Insights set successfully!');
      } else {
        console.warn('⚠️ No insights matched the position pattern');
        console.log('⚠️ Falling back to data-driven analysis due to parsing failure...');
        generateDataDrivenInsights();
      }
    } catch (err) {
      console.error('❌ AI generation error:', err);
      console.log('⚠️ Falling back to data-driven analysis...');
      generateDataDrivenInsights();
    } finally {
      setGeneratingAI(prev => ({ ...prev, tacticalInsights: false }));
    }
  };

  // UI helpers
  const getPositionColor = (position: string): string => {
    switch (position) {
      case 'Goalkeeper':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'Defender':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'Fullback':
        return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      case 'Midfielder':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'Wingers':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'Forward':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="bg-background-light rounded-lg shadow-lg border border-background-lighter p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Brain className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-text-primary">Advanced Performance Analysis</h2>
              <p className="text-text-secondary">Felipe-powered tactical insights and performance evaluation</p>
            </div>
          </div>
          
          {error && (
            <div className="bg-error/10 text-error px-4 py-2 rounded-lg flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={fetchData}
                className="ml-2 h-7 w-7 p-0"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {!playerData.length && !teamRankings.length ? (
          <div className="bg-background p-8 rounded-lg border border-border text-center">
            <AlertTriangle className="h-12 w-12 text-warning mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No Season Data Available</h3>
            <p className="text-text-secondary mb-4">
              Please upload player and team data files in the Settings page to view advanced analysis.
            </p>
            <p className="text-sm text-text-secondary">
              Data uploaded in Settings will be used for comprehensive performance analysis and tactical insights.
            </p>
            <Button onClick={fetchData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Data
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Pass Effectiveness Analysis */}
            {Object.keys(passAnalysis).length > 0 && (
              <div className="card p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Target className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Pass Effectiveness by Position</h3>
                    <p className="text-text-secondary">Tactical analysis of passing patterns and accuracy</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                  {Object.entries(passAnalysis).map(([position, analysis]) => (
                    <div key={position} className={`p-4 rounded-lg border ${getPositionColor(position)}`}>
                      <div className="text-center">
                        <h4 className="font-semibold text-sm">{position}</h4>
                        <p className="text-2xl font-bold mt-2">{(analysis as any).playerCount}</p>
                        <p className="text-xs opacity-80">players</p>
                        
                        <div className="mt-3 space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>Forward:</span>
                            <span className="font-mono">{(analysis as any).forwardPassAccuracy}%</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span>Back:</span>
                            <span className="font-mono">{(analysis as any).backPassAccuracy}%</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span>Lateral:</span>
                            <span className="font-mono">{(analysis as any).lateralPassAccuracy}%</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span>Long:</span>
                            <span className="font-mono">{(analysis as any).longPassAccuracy}%</span>
                          </div>
                        </div>
                        
                        <div className="mt-3 pt-2 border-t border-current/20">
                          <p className="text-xs font-medium mb-1">Players:</p>
                          <div className="space-y-1">
                            {(playersByPosition as any)[position]?.map((player: any, idx: number) => (
                              <p key={idx} className="text-xs truncate">{player.Player}</p>
                            ))}
                            {(!(playersByPosition as any)[position] || (playersByPosition as any)[position].length === 0) && (
                              <p className="text-xs opacity-60">No players</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-background p-4 rounded-lg border border-border">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Activity className="h-4 w-4 text-primary" />
                      Tactical Insights
                      {aiTacticalInsights && import.meta.env.VITE_GEMINI_API_KEY && (
                        <span className="px-2 py-1 bg-accent/20 text-accent text-xs font-medium rounded">
                          Gemini AI
                        </span>
                      )}
                    </h4>
                    <button
                      onClick={generateTacticalInsightsWithAI}
                      disabled={generatingAI.tacticalInsights}
                      className="px-3 py-1.5 bg-accent text-white rounded-lg hover:bg-accent/80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-xs font-medium transition-colors"
                    >
                      {generatingAI.tacticalInsights ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                          Generating...
                        </>
                      ) : (
                        <>
                          <Brain className="h-3 w-3" />
                          Generate with AI
                        </>
                      )}
                    </button>
                  </div>
                  {aiTacticalInsights ? (
                    <div className="space-y-3">
                      {aiTacticalInsights.map((insight, index) => {
                        const position = insight.split(':')[0].trim();
                        const positionColors = getPositionColor(position);

                        return (
                          <div key={index} className={`p-4 rounded-lg border-l-4 ${positionColors}`}>
                            <p className="text-sm leading-relaxed font-medium">{insight}</p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Brain className="h-12 w-12 text-text-secondary mx-auto mb-3 opacity-50" />
                      <p className="text-sm font-medium text-text-secondary mb-1">No AI Insights Generated Yet</p>
                      <p className="text-xs text-text-secondary">Click "Generate Report" to analyze passing effectiveness and create tactical insights powered by Gemini AI</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Squad Depth Analysis */}
            {squadDepthAnalysis && (
              <div className="card p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-12 w-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-secondary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Squad Depth Analysis</h3>
                    <p className="text-text-secondary">Positional depth and rotation capabilities assessment</p>
                  </div>
                </div>

                <div className="bg-background p-4 rounded-lg border border-border mb-6">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Award className="h-4 w-4 text-accent" />
                    How to Interpret Squad Depth Analysis
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 rounded-full bg-success mt-1.5"></div>
                        <div>
                          <p className="font-medium text-success">Excellent Depth (70%+)</p>
                          <p className="text-text-secondary">Strong rotation options, minimal drop-off between first and second choice players</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary mt-1.5"></div>
                        <div>
                          <p className="font-medium text-primary">Good Depth (50-70%)</p>
                          <p className="text-text-secondary">Adequate backup options, manageable quality difference</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 rounded-full bg-warning mt-1.5"></div>
                        <div>
                          <p className="font-medium text-warning">Adequate Depth (30-50%)</p>
                          <p className="text-text-secondary">Limited rotation, noticeable quality gap between starters and backups</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 rounded-full bg-error mt-1.5"></div>
                        <div>
                          <p className="font-medium text-error">Limited Depth (&lt;30%)</p>
                          <p className="text-text-secondary">Vulnerable to injuries, significant drop in quality with rotations</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-background-lighter rounded-lg">
                    <p className="text-xs text-text-secondary">
                      <strong>Depth Ratio:</strong> Calculated as (2nd choice minutes / 1st choice minutes) × 100. 
                      Higher ratios indicate better squad depth and rotation capabilities. 
                      <strong>Regular Starters:</strong> Players with 1000+ minutes. 
                      <strong>Squad Players:</strong> Players with 270+ minutes (3+ games).
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
                  {Object.entries(squadDepthAnalysis).map(([position, analysis]: [string, any]) => (
                    <div key={position} className={`p-6 rounded-lg border ${getPositionColor(position)}`}>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold">{position}</h4>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          analysis.depthQuality === 'excellent' ? 'bg-success/20 text-success' :
                          analysis.depthQuality === 'good' ? 'bg-primary/20 text-primary' :
                          analysis.depthQuality === 'adequate' ? 'bg-warning/20 text-warning' :
                          'bg-error/20 text-error'
                        }`}>
                          {analysis.depthQuality}
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm">Total Squad:</span>
                          <span className="font-mono font-bold">{analysis.totalPlayers}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Regular Starters:</span>
                          <span className="font-mono font-bold">{analysis.regularStarters}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Squad Players:</span>
                          <span className="font-mono font-bold">{analysis.squadPlayers}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Avg Minutes:</span>
                          <span className="font-mono font-bold">{analysis.avgMinutes}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Depth Ratio:</span>
                          <span className="font-mono font-bold">{analysis.depthRatio}%</span>
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-3 border-t border-current/20">
                        <div className="text-xs space-y-1">
                          <div className="flex justify-between">
                            <span>1st Choice:</span>
                            <span className="font-mono">{analysis.topMinutes} min</span>
                          </div>
                          <div className="flex justify-between">
                            <span>2nd Choice:</span>
                            <span className="font-mono">{analysis.secondMinutes} min</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Performance Comparison Analysis */}
            {availableRounds.length >= 2 && (
              <div className="card p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-12 w-12 bg-accent/10 rounded-lg flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Performance Comparison Analysis</h3>
                    <p className="text-text-secondary">Felipe-powered decline analysis between selected periods</p>
                  </div>
                </div>

                {/* Metric selector */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Select Metrics to Compare
                  </label>
                  <div className="bg-background p-4 rounded-lg border border-border">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {[
                        { key: 'avgXG', label: 'xG' },
                        { key: 'avgGoalsFor', label: 'Goals' },
                        { key: 'avgXGA', label: 'Expected Goals Against' },
                        { key: 'avgGoalsAgainst', label: 'Conceded goals' },
                        { key: 'avgShots', label: 'Shots on target' },
                        { key: 'avgShotsAgainst', label: 'Shots Against' },
                        { key: 'avgPossession', label: 'Possession %' },
                        { key: 'avgPassAccuracy', label: 'Pass Accuracy %' },
                        { key: 'avgPPDA', label: 'PPDA' },
                        { key: 'avgPPDAAgainst', label: 'PPDA Against' },
                        { key: 'winRate', label: 'Win Rate' },
                        { key: 'conversionRate', label: 'Conversion Rate' },
                        { key: 'defensiveEfficiency', label: 'Defensive Efficiency' }
                      ].map(metric => (
                        <label key={metric.key} className="flex items-center gap-2 cursor-pointer hover:bg-surface p-2 rounded">
                          <input
                            type="checkbox"
                            checked={selectedMetrics.includes(metric.key)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedMetrics([...selectedMetrics, metric.key]);
                              } else {
                                setSelectedMetrics(selectedMetrics.filter(m => m !== metric.key));
                              }
                            }}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">{metric.label}</span>
                        </label>
                      ))}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button
                        className="text-xs px-3 py-1 bg-primary text-white rounded hover:bg-primary/80"
                        onClick={() => setSelectedMetrics([
                          'avgXG', 'avgGoalsFor', 'avgXGA', 'avgGoalsAgainst', 'avgShots',
                          'avgShotsAgainst', 'avgPossession', 'avgPassAccuracy', 'avgPPDA',
                          'avgPPDAAgainst', 'winRate', 'conversionRate', 'defensiveEfficiency'
                        ])}
                      >
                        Select All
                      </button>
                      <button
                        className="text-xs px-3 py-1 bg-surface border border-border rounded hover:bg-background"
                        onClick={() => setSelectedMetrics(['avgXG', 'avgGoalsFor', 'avgXGA', 'avgGoalsAgainst'])}
                      >
                        Reset to Default
                      </button>
                    </div>
                  </div>
                </div>

                {/* Mode selector */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Comparison Mode
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                    <button
                      className={`p-3 rounded-lg border transition-colors ${
                        comparisonMode === 'rounds'
                          ? 'border-primary bg-primary/10 text-white'
                          : 'border-border hover:border-primary text-text-secondary'
                      }`}
                      onClick={() => setComparisonMode('rounds')}
                    >
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>By Rounds</span>
                      </div>
                    </button>
                    <button
                      className={`p-3 rounded-lg border transition-colors ${
                        comparisonMode === 'opponents'
                          ? 'border-primary bg-primary/10 text-white'
                          : 'border-border hover:border-primary text-text-secondary'
                      }`}
                      onClick={() => setComparisonMode('opponents')}
                    >
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        <span>vs Opponents</span>
                      </div>
                    </button>
                    <button
                      className={`p-3 rounded-lg border transition-colors ${
                        comparisonMode === 'matches'
                          ? 'border-primary bg-primary/10 text-white'
                          : 'border-border hover:border-primary text-text-secondary'
                      }`}
                      onClick={() => setComparisonMode('matches')}
                    >
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        <span>Specific Match</span>
                      </div>
                    </button>
                    <button
                      className={`p-3 rounded-lg border transition-colors ${
                        comparisonMode === 'match-vs-match'
                          ? 'border-primary bg-primary/10 text-white'
                          : 'border-border hover:border-primary text-text-secondary'
                      }`}
                      onClick={() => setComparisonMode('match-vs-match')}
                    >
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        <span>Match vs Match</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Rounds pickers */}
                {comparisonMode === 'rounds' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">First Period</label>
                      <select
                        className="select-field"
                        value={selectedRounds[0]}
                        onChange={(e) => setSelectedRounds([e.target.value, selectedRounds[1]])}
                      >
                        {availableRounds.map(round => (
                          <option key={round} value={round}>{round}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">Second Period</label>
                      <select
                        className="select-field"
                        value={selectedRounds[1]}
                        onChange={(e) => setSelectedRounds([selectedRounds[0], e.target.value])}
                      >
                        {availableRounds.map(round => (
                          <option key={round} value={round}>{round}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Opponent selector */}
                {comparisonMode === 'opponents' && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-text-secondary mb-2">Select Opponent to Analyze</label>
                    <select
                      className="select-field"
                      value={selectedOpponent}
                      onChange={(e) => setSelectedOpponent(e.target.value)}
                    >
                      <option value="">Select opponent</option>
                      {availableOpponents.map(opponent => (
                        <option key={opponent} value={opponent}>{opponent}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Specific match selector */}
                {comparisonMode === 'matches' && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Select Match to Analyze vs Season Average
                    </label>
                    <select
                      className="select-field"
                      value={selectedMatchIndex}
                      onChange={(e) => setSelectedMatchIndex(parseInt(e.target.value))}
                    >
                      <option value={-1}>Select match</option>
                      {availableMatches.map((match, index) => (
                        <option key={index} value={index}>
                          {match.date} - {match.round} vs {match.opponent} ({match.result})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Match vs match selectors */}
                {comparisonMode === 'match-vs-match' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">First Match</label>
                      <select
                        className="select-field"
                        value={selectedMatches[0]}
                        onChange={(e) => setSelectedMatches([parseInt(e.target.value), selectedMatches[1]])}
                      >
                        <option value={-1}>Select first match</option>
                        {availableMatches.map((match, index) => (
                          <option key={index} value={index}>
                            {match.date} - {match.round} vs {match.opponent} ({match.result})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">Second Match</label>
                      <select
                        className="select-field"
                        value={selectedMatches[1]}
                        onChange={(e) => setSelectedMatches([selectedMatches[0], parseInt(e.target.value)])}
                      >
                        <option value={-1}>Select second match</option>
                        {availableMatches.map((match, index) => (
                          <option key={index} value={index}>
                            {match.date} - {match.round} vs {match.opponent} ({match.result})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Round comparison analysis */}
                {comparisonMode === 'rounds' && roundComparison && (
                  <div className="space-y-6">
                    {/* Matches by round */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedRounds.map((round, idx) => (
                        <div key={`round-panel-${idx}`} className="bg-background p-4 rounded-lg border border-border">
                          <h5 className="font-medium mb-3 flex items-center gap-2">
                            <Clock className="h-4 w-4 text-primary" />
                            {round} Matches ({(roundComparison as any)[round]?.matches.length || 0})
                          </h5>
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {((roundComparison as any)[round]?.matches || []).map((m: any, idx2: number) => (
                              <div key={idx2} className="text-xs p-3 bg-surface rounded border-l-2 border-primary">
                                <p className="font-medium">{m.date || 'No date'}</p>
                                <p className="text-text-primary">{m.match}</p>
                                <p className="text-text-secondary text-[10px] mt-1">Round: {round}</p>
                              </div>
                            ))}
                            {((roundComparison as any)[round]?.matches || []).length === 0 && (
                              <div className="text-xs p-2 bg-surface rounded border border-border text-center text-text-secondary">
                                No matches found for {round}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Comparison table */}
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-background-lighter">
                            <th className="p-3 text-left text-sm font-medium text-text-secondary">Metric</th>
                            <th className="p-3 text-center text-sm font-medium text-text-secondary">{selectedRounds[0]}</th>
                            <th className="p-3 text-center text-sm font-medium text-text-secondary">{selectedRounds[1]}</th>
                            <th className="p-3 text-center text-sm font-medium text-text-secondary">Change</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            { key: 'avgXG', label: 'xG', format: (v: number) => v.toFixed(2) },
                            { key: 'avgGoalsFor', label: 'Goals', format: (v: number) => v.toFixed(2) },
                            { key: 'avgXGA', label: 'Expected Goals Against', format: (v: number) => v.toFixed(2) },
                            { key: 'avgGoalsAgainst', label: 'Conceded goals', format: (v: number) => v.toFixed(2) },
                            { key: 'avgShots', label: 'Shots on target', format: (v: number) => v.toFixed(1) },
                            { key: 'avgShotsAgainst', label: 'Shots Against', format: (v: number) => v.toFixed(1) },
                            { key: 'avgPossession', label: 'Possession, %', format: (v: number) => v.toFixed(1) + '%' },
                            { key: 'avgPassAccuracy', label: 'Passes accurate, %', format: (v: number) => v.toFixed(1) + '%' },
                            { key: 'avgPPDA', label: 'PPDA', format: (v: number) => v.toFixed(2) },
                            { key: 'avgPPDAAgainst', label: 'PPDA Against', format: (v: number) => v.toFixed(2) },
                            { key: 'winRate', label: 'Win Rate', format: (v: number) => v.toFixed(1) + '%' },
                            { key: 'conversionRate', label: 'Conversion Rate', format: (v: number) => v.toFixed(1) + '%' },
                            { key: 'defensiveEfficiency', label: 'Defensive Efficiency', format: (v: number) => v.toFixed(1) + '%' }
                          ].filter(metric => selectedMetrics.includes(metric.key)).map(metric => {
                            const round1Value = (roundComparison as any)[selectedRounds[0]]?.[metric.key] || 0;
                            const round2Value = (roundComparison as any)[selectedRounds[1]]?.[metric.key] || 0;
                            const change = round2Value - round1Value;
                            const changePercent = round1Value > 0 ? (change / round1Value) * 100 : 0;
                            
                            return (
                              <tr key={metric.key} className="border-t border-border">
                                <td className="p-3 font-medium">{metric.label}</td>
                                <td className="p-3 text-center font-mono">{metric.format(round1Value)}</td>
                                <td className="p-3 text-center font-mono">{metric.format(round2Value)}</td>
                                <td className="p-3 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    {change > 0 ? (
                                      <ArrowUp className="h-4 w-4 text-success" />
                                    ) : change < 0 ? (
                                      <ArrowDown className="h-4 w-4 text-error" />
                                    ) : (
                                      <Minus className="h-4 w-4 text-text-secondary" />
                                    )}
                                    <span className={`font-mono text-sm ${
                                      change > 0 ? 'text-success' : change < 0 ? 'text-error' : 'text-secondary'
                                    }`}>
                                      {change > 0 ? '+' : ''}{change.toFixed(2)} ({changePercent > 0 ? '+' : ''}{changePercent.toFixed(1)}%)
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* AI Analysis Report */}
                    <div className="bg-background p-6 rounded-lg border border-border">
                      <div className="flex items-center gap-3 mb-4">
                        <Brain className="h-5 w-5 text-accent" />
                        <h4 className="text-lg font-semibold">AI Performance Analysis Report</h4>
                        {aiGeneratedReports.rounds && import.meta.env.VITE_GEMINI_API_KEY && (
                          <span className="px-2 py-1 bg-accent/20 text-accent text-xs font-medium rounded">
                            Gemini AI
                          </span>
                        )}
                        <button
                          onClick={generateRoundsAIReport}
                          disabled={generatingAI.rounds}
                          className="ml-auto px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium transition-colors"
                        >
                          {generatingAI.rounds ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                              Generating...
                            </>
                          ) : (
                            <>
                              <Brain className="h-4 w-4" />
                              Generate Report with AI
                            </>
                          )}
                        </button>
                        {analysisReport && (
                          <div className="text-xs text-text-secondary">
                            Confidence: {analysisReport.confidence}%
                          </div>
                        )}
                      </div>

                      {analysisReport ? (
                        <>
                          <div className="space-y-4">
                            <div className="bg-surface p-4 rounded-lg">
                              <h5 className="font-medium mb-2 text-primary">Executive Summary</h5>
                              <p className="text-sm leading-relaxed">{analysisReport.executiveSummary}</p>
                            </div>

                            <div className="bg-surface p-4 rounded-lg">
                              <h5 className="font-medium mb-2 text-warning">Quantified Impact</h5>
                              <p className="text-sm leading-relaxed">{analysisReport.quantifiedImpact}</p>
                            </div>

                            {analysisReport.strengths && analysisReport.strengths.length > 0 && (
                              <div className="bg-surface p-4 rounded-lg">
                                <h5 className="font-medium mb-3 text-green-500">What The Team Is Doing Well</h5>
                                <div className="space-y-2">
                                  {analysisReport.strengths.map((strength: string, index: number) => (
                                    <div key={index} className="border-l-4 border-green-500 pl-3 bg-green-500/5 py-2 rounded-r">
                                      <p className="text-sm leading-relaxed">{strength}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {analysisReport.decliningMetrics.length > 0 && (
                              <div className="bg-surface p-4 rounded-lg">
                                <h5 className="font-medium mb-3 text-error">Performance Declines Identified</h5>
                                <div className="space-y-3">
                                  {analysisReport.decliningMetrics.slice(0, 3).map((decline: any, index: number) => (
                                    <div key={index} className="border-l-4 border-error pl-3">
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="font-medium text-sm">{decline.metric}</span>
                                        <span className={`text-xs px-2 py-1 rounded ${
                                          decline.severity === 'critical' ? 'bg-error/20 text-error' :
                                          decline.severity === 'high' ? 'bg-warning/20 text-warning' :
                                          'bg-text-secondary/20 text-text-secondary'
                                        }`}>
                                          {decline.severity}
                                        </span>
                                      </div>
                                      <p className="text-xs text-text-secondary">
                                        {decline.previousValue.toFixed(2)} → {decline.currentValue.toFixed(2)}
                                        ({decline.declinePercentage.toFixed(1)}% decline)
                                      </p>
                                      <p className="text-xs mt-1 leading-relaxed">{decline.rootCause}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {analysisReport.correlations.length > 0 && (
                              <div className="bg-surface p-4 rounded-lg">
                                <h5 className="font-medium mb-3 text-accent">Performance Correlations</h5>
                                <div className="space-y-2">
                                  {analysisReport.correlations.map((correlation: string, index: number) => (
                                    <div key={index} className="border-l-4 border-accent pl-3">
                                      <p className="text-sm leading-relaxed">{correlation}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="mt-6 pt-4 border-t border-border text-xs text-text-secondary">
                            <p>Analysis generated by: {analysisReport.analyst}</p>
                            <p>Report date: {new Date(analysisReport.analysisDate).toLocaleString()}</p>
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-12">
                          <Brain className="h-16 w-16 text-text-secondary mx-auto mb-4 opacity-50" />
                          <p className="text-lg font-medium text-text-secondary mb-2">No AI Report Generated Yet</p>
                          <p className="text-sm text-text-secondary mb-6">Click "Generate Report with AI" to create a comprehensive performance analysis powered by Gemini AI</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Opponent Analysis */}
                {comparisonMode === 'opponents' && selectedOpponent && opponentComparison && (
                  <div className="space-y-6">
                    {/* Opponent matches */}
                    <div className="bg-background p-4 rounded-lg border border-border">
                      <h5 className="font-medium mb-3 flex items-center gap-2">
                        <Shield className="h-4 w-4 text-primary" />
                        Matches vs {selectedOpponent} ({opponentComparison.matches.length})
                      </h5>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {opponentComparison.matches.map((m: any, idx: number) => (
                          <div key={idx} className="text-xs p-3 bg-surface rounded border-l-2 border-primary">
                            <p className="font-medium">{m.date || 'No date'} - {m.round || 'No round'}</p>
                            <p className="text-text-secondary">{m.match}</p>
                            <p className="text-text-secondary text-[10px] mt-1">vs {selectedOpponent}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Comparison Table vs season */}
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-background-lighter">
                            <th className="p-3 text-left text-sm font-medium text-text-secondary">Metric</th>
                            <th className="p-3 text-center text-sm font-medium text-text-secondary">vs {selectedOpponent}</th>
                            <th className="p-3 text-center text-sm font-medium text-text-secondary">Season Average</th>
                            <th className="p-3 text-center text-sm font-medium text-text-secondary">Difference</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            { key: 'avgXG', label: 'xG', format: (v: number) => v.toFixed(2) },
                            { key: 'avgGoalsFor', label: 'Goals', format: (v: number) => v.toFixed(2) },
                            { key: 'avgXGA', label: 'Expected Goals Against', format: (v: number) => v.toFixed(2) },
                            { key: 'avgGoalsAgainst', label: 'Conceded goals', format: (v: number) => v.toFixed(2) },
                            { key: 'avgShots', label: 'Shots on target', format: (v: number) => v.toFixed(1) },
                            { key: 'avgShotsAgainst', label: 'Shots Against per Match', format: (v: number) => v.toFixed(1) },
                            { key: 'avgPossession', label: 'Possession %', format: (v: number) => v.toFixed(1) + '%' },
                            { key: 'avgPassAccuracy', label: 'Pass Accuracy %', format: (v: number) => v.toFixed(1) + '%' },
                            { key: 'avgPPDA', label: 'PPDA', format: (v: number) => v.toFixed(2) },
                            { key: 'avgPPDAAgainst', label: 'PPDA Against', format: (v: number) => v.toFixed(2) },
                            { key: 'winRate', label: 'Win Rate', format: (v: number) => v.toFixed(1) + '%' },
                            { key: 'conversionRate', label: 'Conversion Rate', format: (v: number) => v.toFixed(1) + '%' },
                            { key: 'defensiveEfficiency', label: 'Defensive Efficiency', format: (v: number) => v.toFixed(1) + '%' }
                          ].filter(metric => selectedMetrics.includes(metric.key)).map(metric => {
                            const opponentValue = (opponentComparison as any)[metric.key] || 0;
                            const seasonValue = (opponentComparison as any).seasonAvg?.[metric.key] ?? 0;
                            const difference = opponentValue - seasonValue;
                            const diffPercent = seasonValue > 0 ? (difference / seasonValue) * 100 : 0;
                            
                            return (
                              <tr key={metric.key} className="border-t border-border">
                                <td className="p-3 font-medium">{metric.label}</td>
                                <td className="p-3 text-center font-mono">{metric.format(opponentValue)}</td>
                                <td className="p-3 text-center font-mono">{metric.format(seasonValue)}</td>
                                <td className="p-3 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    {difference > 0 ? (
                                      <ArrowUp className="h-4 w-4 text-success" />
                                    ) : difference < 0 ? (
                                      <ArrowDown className="h-4 w-4 text-error" />
                                    ) : (
                                      <Minus className="h-4 w-4 text-text-secondary" />
                                    )}
                                    <span className={`font-mono text-sm ${
                                      difference > 0 ? 'text-success' : difference < 0 ? 'text-error' : 'text-secondary'
                                    }`}>
                                      {difference > 0 ? '+' : ''}{difference.toFixed(2)} ({diffPercent > 0 ? '+' : ''}{diffPercent.toFixed(1)}%)
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* AI Analysis Report for Opponent */}
                    <div className="bg-background p-6 rounded-lg border border-border">
                      <div className="flex items-center gap-3 mb-4">
                        <Brain className="h-5 w-5 text-accent" />
                        <h4 className="text-lg font-semibold">AI Performance Analysis Report</h4>
                        {aiGeneratedReports.opponent && import.meta.env.VITE_GEMINI_API_KEY && (
                          <span className="px-2 py-1 bg-accent/20 text-accent text-xs font-medium rounded">
                            Gemini AI
                          </span>
                        )}
                        <button
                          onClick={generateOpponentAIReport}
                          disabled={generatingAI.opponent}
                          className="ml-auto px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium transition-colors"
                        >
                          {generatingAI.opponent ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                              Generating...
                            </>
                          ) : (
                            <>
                              <Brain className="h-4 w-4" />
                              Generate Report with AI
                            </>
                          )}
                        </button>
                        {opponentAnalysisReport && (
                          <div className="text-xs text-text-secondary">
                            Confidence: {opponentAnalysisReport.confidence}%
                          </div>
                        )}
                      </div>

                      {opponentAnalysisReport ? (
                        <>
                          <div className="space-y-4">
                          <div className="bg-surface p-4 rounded-lg">
                            <h5 className="font-medium mb-2 text-primary">Executive Summary</h5>
                            <p className="text-sm leading-relaxed">{opponentAnalysisReport.executiveSummary}</p>
                          </div>

                          <div className="bg-surface p-4 rounded-lg">
                            <h5 className="font-medium mb-2 text-warning">Quantified Impact</h5>
                            <p className="text-sm leading-relaxed">{opponentAnalysisReport.quantifiedImpact}</p>
                          </div>

                          {opponentAnalysisReport.strengths && opponentAnalysisReport.strengths.length > 0 && (
                            <div className="bg-surface p-4 rounded-lg">
                              <h5 className="font-medium mb-3 text-green-500">What The Team Is Doing Well</h5>
                              <div className="space-y-2">
                                {opponentAnalysisReport.strengths.map((strength: string, index: number) => (
                                  <div key={index} className="border-l-4 border-green-500 pl-3 bg-green-500/5 py-2 rounded-r">
                                    <p className="text-sm leading-relaxed">{strength}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {opponentAnalysisReport.decliningMetrics.length > 0 && (
                            <div className="bg-surface p-4 rounded-lg">
                              <h5 className="font-medium mb-3 text-error">Performance Declines Identified</h5>
                              <div className="space-y-3">
                                {opponentAnalysisReport.decliningMetrics.slice(0, 3).map((decline: any, index: number) => (
                                  <div key={index} className="border-l-4 border-error pl-3">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="font-medium text-sm">{decline.metric}</span>
                                      <span className={`text-xs px-2 py-1 rounded ${
                                        decline.severity === 'critical' ? 'bg-error/20 text-error' :
                                        decline.severity === 'high' ? 'bg-warning/20 text-warning' :
                                        'bg-text-secondary/20 text-text-secondary'
                                      }`}>
                                        {decline.severity}
                                      </span>
                                    </div>
                                    <p className="text-xs text-text-secondary">
                                      {decline.previousValue.toFixed(2)} → {decline.currentValue.toFixed(2)}
                                      ({decline.declinePercentage.toFixed(1)}% decline)
                                    </p>
                                    <p className="text-xs mt-1 leading-relaxed">{decline.rootCause}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {opponentAnalysisReport.correlations.length > 0 && (
                            <div className="bg-surface p-4 rounded-lg">
                              <h5 className="font-medium mb-3 text-accent">Performance Correlations</h5>
                              <div className="space-y-2">
                                {opponentAnalysisReport.correlations.map((correlation: string, index: number) => (
                                  <div key={index} className="border-l-4 border-accent pl-3">
                                    <p className="text-sm leading-relaxed">{correlation}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          </div>

                          <div className="mt-6 pt-4 border-t border-border text-xs text-text-secondary">
                            <p>Analysis generated by: {opponentAnalysisReport.analyst}</p>
                            <p>Report date: {new Date(opponentAnalysisReport.analysisDate).toLocaleString()}</p>
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-12">
                          <Brain className="h-16 w-16 text-text-secondary mx-auto mb-4 opacity-50" />
                          <p className="text-lg font-medium text-text-secondary mb-2">No AI Report Generated Yet</p>
                          <p className="text-sm text-text-secondary mb-6">Click "Generate Report with AI" to create a comprehensive performance analysis powered by Gemini AI</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Specific Match Analysis */}
                {comparisonMode === 'matches' && selectedMatchIndex >= 0 && matchComparison && (
                  <div className="space-y-6">
                    {/* Match details */}
                    <div className="bg-background p-4 rounded-lg border border-border">
                      <h5 className="font-medium mb-3 flex items-center gap-2">
                        <Target className="h-4 w-4 text-primary" />
                        Selected Match Details
                      </h5>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-text-secondary">Date</p>
                          <p className="font-medium">{matchComparison.match.date}</p>
                        </div>
                        <div>
                          <p className="text-sm text-text-secondary">Round</p>
                          <p className="font-medium">{matchComparison.match.round}</p>
                        </div>
                        <div>
                          <p className="text-sm text-text-secondary">Opponent</p>
                          <p className="font-medium">{matchComparison.match.opponent}</p>
                        </div>
                        <div>
                          <p className="text-sm text-text-secondary">Result</p>
                          <p className="font-medium">{matchComparison.match.result}</p>
                        </div>
                      </div>
                    </div>

                    {/* Comparison Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-background-lighter">
                            <th className="p-3 text-left text-sm font-medium text-text-secondary">Metric</th>
                            <th className="p-3 text-center text-sm font-medium text-text-secondary">This Match</th>
                            <th className="p-3 text-center text-sm font-medium text-text-secondary">Season Average</th>
                            <th className="p-3 text-center text-sm font-medium text-text-secondary">Difference</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            { key: 'avgXG', label: 'xG', format: (v: number) => v.toFixed(2) },
                            { key: 'avgGoalsFor', label: 'Goals', format: (v: number) => v.toFixed(2) },
                            { key: 'avgXGA', label: 'Expected Goals Against', format: (v: number) => v.toFixed(2) },
                            { key: 'avgGoalsAgainst', label: 'Conceded goals', format: (v: number) => v.toFixed(2) },
                            { key: 'avgShots', label: 'Shots on target', format: (v: number) => v.toFixed(1) },
                            { key: 'avgPossession', label: 'Possession %', format: (v: number) => v.toFixed(1) + '%' }
                          ].filter(metric => selectedMetrics.includes(metric.key)).map(metric => {
                            const matchValue = (matchComparison.match as any)[metric.key] || 0;
                            const seasonValue = (matchComparison.seasonAverage as any)[metric.key] || 0;
                            const difference = matchValue - seasonValue;
                            const diffPercent = seasonValue > 0 ? (difference / seasonValue) * 100 : 0;
                            
                            return (
                              <tr key={metric.key} className="border-t border-border">
                                <td className="p-3 font-medium">{metric.label}</td>
                                <td className="p-3 text-center font-mono">{metric.format(matchValue)}</td>
                                <td className="p-3 text-center font-mono">{metric.format(seasonValue)}</td>
                                <td className="p-3 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    {difference > 0 ? (
                                      <ArrowUp className="h-4 w-4 text-success" />
                                    ) : difference < 0 ? (
                                      <ArrowDown className="h-4 w-4 text-error" />
                                    ) : (
                                      <Minus className="h-4 w-4 text-text-secondary" />
                                    )}
                                    <span className={`font-mono text-sm ${
                                      difference > 0 ? 'text-success' : difference < 0 ? 'text-error' : 'text-secondary'
                                    }`}>
                                      {difference > 0 ? '+' : ''}{difference.toFixed(2)} ({diffPercent > 0 ? '+' : ''}{diffPercent.toFixed(1)}%)
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* AI Analysis Report for Match */}
                    <div className="bg-background p-6 rounded-lg border border-border">
                      <div className="flex items-center gap-3 mb-4">
                        <Brain className="h-5 w-5 text-accent" />
                        <h4 className="text-lg font-semibold">AI Performance Analysis Report</h4>
                        {aiGeneratedReports.match && import.meta.env.VITE_GEMINI_API_KEY && (
                          <span className="px-2 py-1 bg-accent/20 text-accent text-xs font-medium rounded">
                            Gemini AI
                          </span>
                        )}
                        <button
                          onClick={generateMatchAIReport}
                          disabled={generatingAI.match}
                          className="ml-auto px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium transition-colors"
                        >
                          {generatingAI.match ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                              Generating...
                            </>
                          ) : (
                            <>
                              <Brain className="h-4 w-4" />
                              Generate Report with AI
                            </>
                          )}
                        </button>
                        {matchAnalysisReport && (
                          <div className="text-xs text-text-secondary">
                            Confidence: {matchAnalysisReport.confidence}%
                          </div>
                        )}
                      </div>

                      {matchAnalysisReport ? (
                        <>
                          <div className="space-y-4">
                          <div className="bg-surface p-4 rounded-lg">
                            <h5 className="font-medium mb-2 text-primary">Executive Summary</h5>
                            <p className="text-sm leading-relaxed">{matchAnalysisReport.executiveSummary}</p>
                          </div>

                          <div className="bg-surface p-4 rounded-lg">
                            <h5 className="font-medium mb-2 text-warning">Quantified Impact</h5>
                            <p className="text-sm leading-relaxed">{matchAnalysisReport.quantifiedImpact}</p>
                          </div>

                          {matchAnalysisReport.strengths && matchAnalysisReport.strengths.length > 0 && (
                            <div className="bg-surface p-4 rounded-lg">
                              <h5 className="font-medium mb-3 text-green-500">What The Team Is Doing Well</h5>
                              <div className="space-y-2">
                                {matchAnalysisReport.strengths.map((strength: string, index: number) => (
                                  <div key={index} className="border-l-4 border-green-500 pl-3 bg-green-500/5 py-2 rounded-r">
                                    <p className="text-sm leading-relaxed">{strength}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {matchAnalysisReport.decliningMetrics.length > 0 && (
                            <div className="bg-surface p-4 rounded-lg">
                              <h5 className="font-medium mb-3 text-error">Performance Declines Identified</h5>
                              <div className="space-y-3">
                                {matchAnalysisReport.decliningMetrics.slice(0, 3).map((decline: any, index: number) => (
                                  <div key={index} className="border-l-4 border-error pl-3">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="font-medium text-sm">{decline.metric}</span>
                                      <span className={`text-xs px-2 py-1 rounded ${
                                        decline.severity === 'critical' ? 'bg-error/20 text-error' :
                                        decline.severity === 'high' ? 'bg-warning/20 text-warning' :
                                        'bg-text-secondary/20 text-text-secondary'
                                      }`}>
                                        {decline.severity}
                                      </span>
                                    </div>
                                    <p className="text-xs text-text-secondary">
                                      {decline.previousValue.toFixed(2)} → {decline.currentValue.toFixed(2)}
                                      ({decline.declinePercentage.toFixed(1)}% decline)
                                    </p>
                                    <p className="text-xs mt-1 leading-relaxed">{decline.rootCause}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {matchAnalysisReport.correlations.length > 0 && (
                            <div className="bg-surface p-4 rounded-lg">
                              <h5 className="font-medium mb-3 text-accent">Performance Correlations</h5>
                              <div className="space-y-2">
                                {matchAnalysisReport.correlations.map((correlation: string, index: number) => (
                                  <div key={index} className="border-l-4 border-accent pl-3">
                                    <p className="text-sm leading-relaxed">{correlation}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          </div>

                          <div className="mt-6 pt-4 border-t border-border text-xs text-text-secondary">
                            <p>Analysis generated by: {matchAnalysisReport.analyst}</p>
                            <p>Report date: {new Date(matchAnalysisReport.analysisDate).toLocaleString()}</p>
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-12">
                          <Brain className="h-16 w-16 text-text-secondary mx-auto mb-4 opacity-50" />
                          <p className="text-lg font-medium text-text-secondary mb-2">No AI Report Generated Yet</p>
                          <p className="text-sm text-text-secondary mb-6">Click "Generate Report with AI" to create a comprehensive performance analysis powered by Gemini AI</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Match vs Match Analysis */}
                {comparisonMode === 'match-vs-match' && selectedMatches[0] >= 0 && selectedMatches[1] >= 0 && matchVsMatchComparison && (
                  <div className="space-y-6">
                    {/* Match details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-background p-4 rounded-lg border border-border">
                        <h5 className="font-medium mb-3 flex items-center gap-2">
                          <Target className="h-4 w-4 text-primary" />
                          First Match
                        </h5>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-text-secondary">Date:</span>
                            <span className="font-medium">{matchVsMatchComparison.match1.date}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-text-secondary">Round:</span>
                            <span className="font-medium">{matchVsMatchComparison.match1.round}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-text-secondary">Opponent:</span>
                            <span className="font-medium">{matchVsMatchComparison.match1.opponent}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-text-secondary">Result:</span>
                            <span className="font-medium">{matchVsMatchComparison.match1.result}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-background p-4 rounded-lg border border-border">
                        <h5 className="font-medium mb-3 flex items-center gap-2">
                          <Target className="h-4 w-4 text-secondary" />
                          Second Match
                        </h5>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-text-secondary">Date:</span>
                            <span className="font-medium">{matchVsMatchComparison.match2.date}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-text-secondary">Round:</span>
                            <span className="font-medium">{matchVsMatchComparison.match2.round}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-text-secondary">Opponent:</span>
                            <span className="font-medium">{matchVsMatchComparison.match2.opponent}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-text-secondary">Result:</span>
                            <span className="font-medium">{matchVsMatchComparison.match2.result}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Comparison Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-background-lighter">
                            <th className="p-3 text-left text-sm font-medium text-text-secondary">Metric</th>
                            <th className="p-3 text-center text-sm font-medium text-text-secondary">Match 1</th>
                            <th className="p-3 text-center text-sm font-medium text-text-secondary">Match 2</th>
                            <th className="p-3 text-center text-sm font-medium text-text-secondary">Difference</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            { key: 'avgXG', label: 'xG', format: (v: number) => v.toFixed(2) },
                            { key: 'avgGoalsFor', label: 'Goals', format: (v: number) => v.toFixed(2) },
                            { key: 'avgXGA', label: 'Expected Goals Against', format: (v: number) => v.toFixed(2) },
                            { key: 'avgGoalsAgainst', label: 'Conceded goals', format: (v: number) => v.toFixed(2) },
                            { key: 'avgShots', label: 'Shots on target', format: (v: number) => v.toFixed(1) },
                            { key: 'avgPossession', label: 'Possession %', format: (v: number) => v.toFixed(1) + '%' }
                          ].filter(metric => selectedMetrics.includes(metric.key)).map(metric => {
                            const match1Value = (matchVsMatchComparison.match1 as any)[metric.key] || 0;
                            const match2Value = (matchVsMatchComparison.match2 as any)[metric.key] || 0;
                            const difference = match2Value - match1Value;
                            const diffPercent = match1Value > 0 ? (difference / match1Value) * 100 : 0;
                            
                            return (
                              <tr key={metric.key} className="border-t border-border">
                                <td className="p-3 font-medium">{metric.label}</td>
                                <td className="p-3 text-center font-mono">{metric.format(match1Value)}</td>
                                <td className="p-3 text-center font-mono">{metric.format(match2Value)}</td>
                                <td className="p-3 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    {difference > 0 ? (
                                      <ArrowUp className="h-4 w-4 text-success" />
                                    ) : difference < 0 ? (
                                      <ArrowDown className="h-4 w-4 text-error" />
                                    ) : (
                                      <Minus className="h-4 w-4 text-text-secondary" />
                                    )}
                                    <span className={`font-mono text-sm ${
                                      difference > 0 ? 'text-success' : difference < 0 ? 'text-error' : 'text-secondary'
                                    }`}>
                                      {difference > 0 ? '+' : ''}{difference.toFixed(2)} ({diffPercent > 0 ? '+' : ''}{diffPercent.toFixed(1)}%)
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* AI Analysis Report for Match vs Match */}
                    <div className="bg-background p-6 rounded-lg border border-border">
                      <div className="flex items-center gap-3 mb-4">
                        <Brain className="h-5 w-5 text-accent" />
                        <h4 className="text-lg font-semibold">AI Performance Analysis Report</h4>
                        {aiGeneratedReports.matchVsMatch && import.meta.env.VITE_GEMINI_API_KEY && (
                          <span className="px-2 py-1 bg-accent/20 text-accent text-xs font-medium rounded">
                            Gemini AI
                          </span>
                        )}
                        <button
                          onClick={generateMatchVsMatchAIReport}
                          disabled={generatingAI.matchVsMatch}
                          className="ml-auto px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium transition-colors"
                        >
                          {generatingAI.matchVsMatch ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                              Generating...
                            </>
                          ) : (
                            <>
                              <Brain className="h-4 w-4" />
                              Generate Report with AI
                            </>
                          )}
                        </button>
                        {matchVsMatchReport && (
                          <div className="text-xs text-text-secondary">
                            Confidence: {matchVsMatchReport.confidence}%
                          </div>
                        )}
                      </div>

                      {matchVsMatchReport ? (
                        <>
                          <div className="space-y-4">
                          <div className="bg-surface p-4 rounded-lg">
                            <h5 className="font-medium mb-2 text-primary">Executive Summary</h5>
                            <p className="text-sm leading-relaxed">{matchVsMatchReport.executiveSummary}</p>
                          </div>

                          <div className="bg-surface p-4 rounded-lg">
                            <h5 className="font-medium mb-2 text-warning">Quantified Impact</h5>
                            <p className="text-sm leading-relaxed">{matchVsMatchReport.quantifiedImpact}</p>
                          </div>

                          {matchVsMatchReport.strengths && matchVsMatchReport.strengths.length > 0 && (
                            <div className="bg-surface p-4 rounded-lg">
                              <h5 className="font-medium mb-3 text-green-500">What The Team Is Doing Well</h5>
                              <div className="space-y-2">
                                {matchVsMatchReport.strengths.map((strength: string, index: number) => (
                                  <div key={index} className="border-l-4 border-green-500 pl-3 bg-green-500/5 py-2 rounded-r">
                                    <p className="text-sm leading-relaxed">{strength}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {matchVsMatchReport.decliningMetrics.length > 0 && (
                            <div className="bg-surface p-4 rounded-lg">
                              <h5 className="font-medium mb-3 text-error">Performance Declines Identified</h5>
                              <div className="space-y-3">
                                {matchVsMatchReport.decliningMetrics.slice(0, 3).map((decline: any, index: number) => (
                                  <div key={index} className="border-l-4 border-error pl-3">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="font-medium text-sm">{decline.metric}</span>
                                      <span className={`text-xs px-2 py-1 rounded ${
                                        decline.severity === 'critical' ? 'bg-error/20 text-error' :
                                        decline.severity === 'high' ? 'bg-warning/20 text-warning' :
                                        'bg-text-secondary/20 text-text-secondary'
                                      }`}>
                                        {decline.severity}
                                      </span>
                                    </div>
                                    <p className="text-xs text-text-secondary">
                                      {decline.previousValue.toFixed(2)} → {decline.currentValue.toFixed(2)}
                                      ({decline.declinePercentage.toFixed(1)}% decline)
                                    </p>
                                    <p className="text-xs mt-1 leading-relaxed">{decline.rootCause}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {matchVsMatchReport.correlations.length > 0 && (
                            <div className="bg-surface p-4 rounded-lg">
                              <h5 className="font-medium mb-3 text-accent">Performance Correlations</h5>
                              <div className="space-y-2">
                                {matchVsMatchReport.correlations.map((correlation: string, index: number) => (
                                  <div key={index} className="border-l-4 border-accent pl-3">
                                    <p className="text-sm leading-relaxed">{correlation}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          </div>

                          <div className="mt-6 pt-4 border-t border-border text-xs text-text-secondary">
                            <p>Analysis generated by: {matchVsMatchReport.analyst}</p>
                            <p>Report date: {new Date(matchVsMatchReport.analysisDate).toLocaleString()}</p>
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-12">
                          <Brain className="h-16 w-16 text-text-secondary mx-auto mb-4 opacity-50" />
                          <p className="text-lg font-medium text-text-secondary mb-2">No AI Report Generated Yet</p>
                          <p className="text-sm text-text-secondary mb-6">Click "Generate Report with AI" to create a comprehensive performance analysis powered by Gemini AI</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Analysis;