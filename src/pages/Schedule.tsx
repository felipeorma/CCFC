import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Home, MapPin, Calendar, Clock, ChevronRight, Trophy, Target, Shield, Brain } from 'lucide-react';
import { parseFixture, seasonFromRanking } from '../utils/helpers';
import type { TeamRankingsRecord } from '../utils/helpers';
import { teamLogos } from '../utils/teamLogos';

interface Match {
  fecha: string;
  hora: string;
  oponente: string;
  local: boolean;
  resultado?: string;
}

interface TeamStanding {
  team: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  xPoints?: number;
  pointsDelta?: number;
}

const staticMatches: Match[] = [
  {"fecha": "2025-04-05", "hora": "16:30", "oponente": "Forge FC", "local": false},
  {"fecha": "2025-04-17", "hora": "19:00", "oponente": "Vancouver FC", "local": true},
  {"fecha": "2025-04-26", "hora": "17:00", "oponente": "Atlético Ottawa", "local": true},
  {"fecha": "2025-05-02", "hora": "20:00", "oponente": "York United FC", "local": false},
  {"fecha": "2025-05-10", "hora": "16:30", "oponente": "HFX Wanderers FC", "local": false},
  {"fecha": "2025-05-17", "hora": "17:00", "oponente": "Pacific FC", "local": true},
  {"fecha": "2025-05-25", "hora": "17:00", "oponente": "Valour FC", "local": true},
  {"fecha": "2025-06-08", "hora": "18:00", "oponente": "York United FC", "local": true},
  {"fecha": "2025-06-14", "hora": "15:00", "oponente": "HFX Wanderers FC", "local": false},
  {"fecha": "2025-06-21", "hora": "18:00", "oponente": "Pacific FC", "local": true},
  {"fecha": "2025-06-28", "hora": "18:00", "oponente": "Atlético Ottawa", "local": true},
  {"fecha": "2025-07-13", "hora": "21:00", "oponente": "Vancouver FC", "local": false},
  {"fecha": "2025-07-20", "hora": "15:00", "oponente": "Valour FC", "local": false},
  {"fecha": "2025-07-26", "hora": "17:00", "oponente": "York United FC", "local": true},
  {"fecha": "2025-08-04", "hora": "18:00", "oponente": "Pacific FC", "local": false},
  {"fecha": "2025-08-09", "hora": "17:00", "oponente": "HFX Wanderers FC", "local": true},
  {"fecha": "2025-08-17", "hora": "18:00", "oponente": "Vancouver FC", "local": true},
  {"fecha": "2025-08-23", "hora": "19:00", "oponente": "Atlético Ottawa", "local": false},
  {"fecha": "2025-08-30", "hora": "16:00", "oponente": "Forge FC", "local": true},
  {"fecha": "2025-09-05", "hora": "19:30", "oponente": "York United FC", "local": false},
  {"fecha": "2025-09-13", "hora": "16:00", "oponente": "HFX Wanderers FC", "local": true},
  {"fecha": "2025-09-20", "hora": "18:00", "oponente": "Valour FC", "local": true},
  {"fecha": "2025-09-27", "hora": "13:00", "oponente": "Atlético Ottawa", "local": false},
  {"fecha": "2025-10-05", "hora": "18:00", "oponente": "Pacific FC", "local": false},
  {"fecha": "2025-10-18", "hora": "16:00", "oponente": "Vancouver FC", "local": false}
];

const MAX_GOALS = 10;

/* ----------------- Normalización de nombres/alias ----------------- */
const removeDiacritics = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const norm = (s: unknown) =>
  (typeof s === 'string'
    ? removeDiacritics(s).toLowerCase().replace(/\./g, '').replace(/\s+fc\b/g, '').replace(/\s+/g, ' ').trim()
    : '');

const ALIAS_CANON: Record<string, string> = {
  'cavalry': 'Cavalry FC', 'cavalry fc': 'Cavalry FC',
  'forge': 'Forge FC', 'forge fc': 'Forge FC',
  'atletico ottawa': 'Atlético Ottawa', 'atlético ottawa': 'Atlético Ottawa', 'ottawa': 'Atlético Ottawa',
  'pacific': 'Pacific FC', 'pacific fc': 'Pacific FC',
  'valour': 'Valour FC', 'valour fc': 'Valour FC',
  'york': 'York United FC', 'york united': 'York United FC', 'york united fc': 'York United FC',
  'hfx': 'HFX Wanderers FC', 'hfx wanderers': 'HFX Wanderers FC', 'wanderers': 'HFX Wanderers FC',
  'halifax': 'HFX Wanderers FC', 'halifax wanderers': 'HFX Wanderers FC', 'hfx wanderers fc': 'HFX Wanderers FC',
  'vancouver': 'Vancouver FC', 'vancouver fc': 'Vancouver FC',
};

const toCanonical = (raw: unknown): string => {
  const n = norm(raw);
  if (!n) return typeof raw === 'string' ? raw : '';
  return ALIAS_CANON[n] || (typeof raw === 'string' ? raw : '');
};

/* ----------------- Poisson / xPts ----------------- */
const poissonPMF = (lambda: number, k: number) => {
  if (lambda <= 0) return k === 0 ? 1 : 0;
  let logP = -lambda + k * Math.log(Math.max(lambda, 1e-9));
  let logFact = 0;
  for (let i = 2; i <= k; i++) logFact += Math.log(i);
  return Math.exp(logP - logFact);
};

const goalDist = (lambda: number) => {
  const p: number[] = [];
  let total = 0;
  for (let k = 0; k < MAX_GOALS; k++) {
    const val = poissonPMF(lambda, k);
    p.push(val);
    total += val;
  }
  const tail = Math.max(0, 1 - total);
  p.push(tail);
  return p;
};

const expectedPointsFromXG = (xgf: number, xga: number) => {
  const pF = goalDist(Math.max(0, xgf));
  const pA = goalDist(Math.max(0, xga));
  let pWin = 0, pDraw = 0;
  for (let i = 0; i <= MAX_GOALS; i++) {
    for (let j = 0; j <= MAX_GOALS; j++) {
      const pij = pF[i] * pA[j];
      if (i > j) pWin += pij;
      else if (i === j) pDraw += pij;
    }
  }
  return 3 * pWin + 1 * pDraw;
};

/* ----------------- Playoffs + Monte Carlo ----------------- */
const simulateDetailedPlayoffs = (teams: any[]): {
  round1Winners: string[],
  semifinalWinners: string[],
  finalists: string[],
  champion: string | null
} => {
  if (teams.length < 5) return {
    round1Winners: [],
    semifinalWinners: [],
    finalists: [],
    champion: null
  };

  const [first, second, third, fourth, fifth] = teams;

  const getTeamStrength = (team: any) => {
    const matchesPlayed = team.played || 1;
    const form = team.simulatedPoints / (matchesPlayed * 3);
    const attackStrength = team.simulatedGF / matchesPlayed;
    const defenseStrength = (team.simulatedGA || team.goalsAgainst) / matchesPlayed || 1;
    const goalRatio = attackStrength / (attackStrength + defenseStrength);
    return form * 0.7 + goalRatio * 0.3;
  };

  const simulateMatch = (teamA: any, teamB: any, homeAdvantage = false) => {
    const strengthA = getTeamStrength(teamA) + (homeAdvantage ? 0.15 : 0);
    const randomFactor = (Math.random() - 0.5) * 0.4;
    const adjustedStrengthA = Math.max(0.15, Math.min(0.85, strengthA + randomFactor));
    return Math.random() < adjustedStrengthA ? teamA : teamB;
  };

  const results = {
    round1Winners: [] as string[],
    semifinalWinners: [] as string[],
    finalists: [] as string[],
    champion: null as string | null
  };

  const r1Winner = simulateMatch(fourth, fifth);
  results.round1Winners.push(r1Winner.team);

  const directFinalWinner = simulateMatch(first, second);
  const directFinalLoser = directFinalWinner === first ? second : first;

  const r2bWinner = simulateMatch(third, r1Winner);

  results.semifinalWinners.push(directFinalLoser.team, r2bWinner.team);

  const semifinalWinner = simulateMatch(directFinalLoser, r2bWinner);
  results.finalists.push(directFinalWinner.team, semifinalWinner.team);

  const champion = simulateMatch(directFinalWinner, semifinalWinner, true);
  results.champion = champion.team;

  return results;
};

const simulateSeasonFinish = (standings: TeamStanding[]) => {
  const NUM_SIMULATIONS = 10000;
  const TOTAL_MATCHES = 28;

  const positionCounts: {[team: string]: number[]} = {};
  const playoffCounts: {[team: string]: number} = {};
  const cupCounts: {[team: string]: number} = {};
  const playoffRoundCounts: {[team: string]: {qualify:number;round1:number;semifinal:number;final:number;champion:number}} = {};

  standings.forEach(team => {
    positionCounts[team.team] = new Array(standings.length).fill(0);
    playoffCounts[team.team] = 0;
    cupCounts[team.team] = 0;
    playoffRoundCounts[team.team] = { qualify:0, round1:0, semifinal:0, final:0, champion:0 };
  });

  for (let sim = 0; sim < NUM_SIMULATIONS; sim++) {
    const simStandings = standings.map(team => ({
      ...team,
      simulatedPoints: team.points,
      simulatedGD: team.goalDifference,
      simulatedGF: team.goalsFor,
      simulatedGA: team.goalsAgainst
    }));

    simStandings.forEach(team => {
      const played = team.played || 0;
      const att = team.goalsFor / Math.max(1, played);
      const def = team.goalsAgainst / Math.max(1, played);
      const expectedForm = (team.xPoints || team.points) / Math.max(1, played * 3);
      const trend = team.pointsDelta || 0;

      const remaining = Math.max(0, TOTAL_MATCHES - played);
      for (let m = 0; m < remaining; m++) {
        const regression = 0.3;
        const leagueAvg = 0.33;
        const adjForm = expectedForm * (1 - regression) + leagueAvg * regression;
        const consistency = Math.max(0.1, 1 - Math.abs(trend) / 10);
        const variance = (1 - consistency) * 0.4;
        const randomFactor = (Math.random() - 0.5) * variance;
        const matchForm = Math.max(0, Math.min(1, adjForm + randomFactor));

        const egf = att * (0.5 + matchForm);
        const ega = def * (1.5 - matchForm);

        const gf = Math.max(0, Math.round(egf + (Math.random() - 0.5) * 2));
        const ga = Math.max(0, Math.round(ega + (Math.random() - 0.5) * 2));

        team.simulatedGF += gf;
        team.simulatedGA += ga;
        team.simulatedGD += (gf - ga);
        if (gf > ga) team.simulatedPoints += 3;
        else if (gf === ga) team.simulatedPoints += 1;
      }
    });

    simStandings.sort((a, b) => {
      if (b.simulatedPoints !== a.simulatedPoints) return b.simulatedPoints - a.simulatedPoints;
      if (b.simulatedGD !== a.simulatedGD) return b.simulatedGD - a.simulatedGD;
      return b.simulatedGF - a.simulatedGF;
    });

    simStandings.forEach((team, pos) => { positionCounts[team.team][pos]++; });

    if (simStandings.length >= 5) {
      const playoffTeams = simStandings.slice(0, 5);
      playoffTeams.forEach(t => { playoffCounts[t.team]++; playoffRoundCounts[t.team].qualify++; });

      const r = simulateDetailedPlayoffs(playoffTeams);
      r.round1Winners.forEach(t => playoffRoundCounts[t].round1++);
      r.semifinalWinners.forEach(t => playoffRoundCounts[t].semifinal++);
      r.finalists.forEach(t => playoffRoundCounts[t].final++);
      if (r.champion) { cupCounts[r.champion]++; playoffRoundCounts[r.champion].champion++; }
    }
  }

  const positionProbs: {[team: string]: number[]} = {};
  const playoffProbs: {[team: string]: number} = {};
  const cupProbs: {[team: string]: number} = {};
  const playoffRoundProbs: {[team: string]: {qualify:number;round1:number;semifinal:number;final:number;champion:number}} = {};

  Object.keys(positionCounts).forEach(team => {
    positionProbs[team] = positionCounts[team].map(c => (c / NUM_SIMULATIONS) * 100);
    playoffProbs[team] = (playoffCounts[team] / NUM_SIMULATIONS) * 100;
    cupProbs[team] = (cupCounts[team] / NUM_SIMULATIONS) * 100;
    playoffRoundProbs[team] = {
      qualify: (playoffRoundCounts[team].qualify / NUM_SIMULATIONS) * 100,
      round1: (playoffRoundCounts[team].round1 / NUM_SIMULATIONS) * 100,
      semifinal: (playoffRoundCounts[team].semifinal / NUM_SIMULATIONS) * 100,
      final: (playoffRoundCounts[team].final / NUM_SIMULATIONS) * 100,
      champion: (playoffRoundCounts[team].champion / NUM_SIMULATIONS) * 100,
    };
  });

  return { positionProbs, playoffProbs, cupProbs, playoffRoundProbs };
};

/* ----------------- xG del rival en mismo match ----------------- */
const findOpponentXG = (match: string, teamName: string, allTeams: any[]): number | null => {
  const parsed = parseFixture(match, teamName);
  if (!parsed) return null;
  const oppCanon = toCanonical(parsed.opponent);
  const opponentTeam = allTeams.find((t: any) => t?.name && toCanonical(t.name) === oppCanon);
  if (!opponentTeam?.rows) return null;
  const opponentRow = opponentTeam.rows.find((row: any) => row?.match === match);
  const val = opponentRow?.['xG'];
  return typeof val === 'number' ? val : (val ? Number(val) : null);
};

const Schedule: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>(staticMatches);
  const [nextMatch, setNextMatch] = useState<Match | null>(null);
  const [leagueStandings, setLeagueStandings] = useState<TeamStanding[]>([]);
  const [currentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [positionProbabilities, setPositionProbabilities] = useState<{[team: string]: number[]}>({});
  const [playoffProbabilities, setPlayoffProbabilities] = useState<{[team: string]: number}>({});
  const [cupProbabilities, setCupProbabilities] = useState<{[team: string]: number}>({});
  const [playoffRoundProbabilities, setPlayoffRoundProbabilities] = useState<{[team: string]: {
    qualify: number,
    round1: number,
    semifinal: number,
    final: number,
    champion: number
  }}>({});

  useEffect(() => { fetchTeamData(); }, []);

  useEffect(() => {
    if (leagueStandings.length > 0) {
      const simulation = simulateSeasonFinish(leagueStandings);
      setPositionProbabilities(simulation.positionProbs);
      setPlayoffProbabilities(simulation.playoffProbs);
      setCupProbabilities(simulation.cupProbs);
      setPlayoffRoundProbabilities(simulation.playoffRoundProbs);
    }
  }, [leagueStandings]);

  const fetchTeamData = async () => {
    try {
      setLoading(true);
      const { data: teamRankings, error } = await supabase
        .from('team_rankings')
        .select('*')
        .eq('year', 2025)
        .limit(1);

      if (error) {
        console.warn('Error fetching team data:', error);
        setMatches(staticMatches);
        setLeagueStandings([]);
        return;
      }

      if (teamRankings && teamRankings.length > 0) {
        const season2025 = (teamRankings as TeamRankingsRecord[]).find(r => seasonFromRanking(r as any) === '2025');
        if (!season2025) {
          console.warn('No 2025 season data found');
          setMatches(staticMatches);
          setLeagueStandings([]);
          return;
        }

        const teams = (season2025 as any).data?.teams || [];
        const standings = calculateLeagueStandings(teams);
        setLeagueStandings(standings);

        const cavalryTeam = teams.find((t: any) => t.name && norm(t.name).includes('cavalry'));
        if (cavalryTeam) {
          const matchResults = extractMatchResultsFromRows(cavalryTeam);

          // Emparejar SIEMPRE con el rival canónico y elegir el resultado con fecha más cercana.
          const updatedMatches = staticMatches.map(staticMatch => {
            const canonOpp = toCanonical(staticMatch.oponente);
            const targetMs = Date.parse(staticMatch.fecha);

            const candidates = matchResults.filter(r => toCanonical(r.opponent) === canonOpp);

            if (candidates.length === 0) return { ...staticMatch };

            // separar candidatos con fecha válida y sin fecha
            const withDate = candidates
              .map(r => ({ r, t: Date.parse(r.date || '') }))
              .filter(x => Number.isFinite(x.t));

            let chosen: { opponent: string; date: string; resultado: string } | null = null;

            if (withDate.length > 0 && Number.isFinite(targetMs)) {
              // escoger por mínima distancia temporal
              let best = withDate[0];
              let bestDiff = Math.abs(best.t - targetMs);
              for (let i = 1; i < withDate.length; i++) {
                const dif = Math.abs(withDate[i].t - targetMs);
                if (dif < bestDiff) { best = withDate[i]; bestDiff = dif; }
              }
              chosen = best.r;
            } else {
              // si no hay fechas, toma el primero
              chosen = candidates[0];
            }

            return { ...staticMatch, resultado: chosen?.resultado };
          });

          setMatches(updatedMatches);
        } else {
          setMatches(staticMatches);
        }
      } else {
        setMatches(staticMatches);
        setLeagueStandings([]);
      }
    } catch (e) {
      console.error('Error fetching team data:', e);
      setMatches(staticMatches);
      setLeagueStandings([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateLeagueStandings = (teams: any[]): TeamStanding[] => {
    const standings: TeamStanding[] = [];

    teams.forEach(team => {
      if (!team?.name) return;

      const teamName = team.name;
      let totalWins = 0, totalDraws = 0, totalLosses = 0;
      let totalGoalsFor = 0, totalGoalsAgainst = 0;
      let matchesPlayed = 0;
      let xPointsSum = 0;

      const processedMatches = new Set<string>();

      if (team.rows && Array.isArray(team.rows) && team.rows.length > 0) {
        team.rows.forEach((row: any) => {
          const matchStr: string | undefined = row?.match;
          if (matchStr && typeof matchStr === 'string' && matchStr.includes(' - ') && matchStr.includes(':')) {
            const matchKey = `${matchStr.trim()}-${(row.date || row.Date || row['Fecha'] || row['match_date'] || row['Match Date'] || row['Date UTC'] || '')}`;
            if (processedMatches.has(matchKey)) return;
            processedMatches.add(matchKey);

            const parsed = parseFixture(matchStr, teamName);
            if (parsed) {
              matchesPlayed++;
              totalGoalsFor += parsed.teamGoals;
              totalGoalsAgainst += parsed.oppGoals;

              const xgFor = typeof row['xG'] === 'number' ? row['xG'] : (row['xG'] ? Number(row['xG']) : 0);
              let xgAgainst = findOpponentXG(matchStr, teamName, teams);
              if (xgAgainst == null && row['xG against'] != null) {
                xgAgainst = typeof row['xG against'] === 'number' ? row['xG against'] : Number(row['xG against']);
              }
              if (xgFor != null && xgAgainst != null) {
                xPointsSum += expectedPointsFromXG(Number(xgFor) || 0, Number(xgAgainst) || 0);
              }

              if (parsed.teamGoals > parsed.oppGoals) totalWins++;
              else if (parsed.teamGoals === parsed.oppGoals) totalDraws++;
              else totalLosses++;
            }
          }
        });
      } else if (team.data) {
        totalGoalsFor = team.data['Goals'] || 0;
        totalGoalsAgainst = team.data['Conceded goals'] || 0;
        matchesPlayed = team.data['Matches played'] || Math.max(1, Math.ceil((totalGoalsFor + totalGoalsAgainst) / 3));

        const avgXGF = team.data['xG'] || 0;
        const avgXGA = team.data['xGA'] || team.data['xG against'] || 0;
        if (avgXGF > 0 || avgXGA > 0) {
          const xpPerMatch = expectedPointsFromXG(avgXGF, avgXGA);
          xPointsSum = xpPerMatch * (matchesPlayed || 0);
        }

        if (team.data['Wins'] !== undefined) {
          totalWins = team.data['Wins'] || 0;
          totalDraws = team.data['Draws'] || 0;
          totalLosses = team.data['Losses'] || (matchesPlayed - totalWins - totalDraws);
        } else {
          const goalDiff = totalGoalsFor - totalGoalsAgainst;
          if (goalDiff > 5) {
            totalWins = Math.round(matchesPlayed * 0.6);
            totalDraws = Math.round(matchesPlayed * 0.25);
            totalLosses = matchesPlayed - totalWins - totalDraws;
          } else if (goalDiff > 0) {
            totalWins = Math.round(matchesPlayed * 0.45);
            totalDraws = Math.round(matchesPlayed * 0.35);
            totalLosses = matchesPlayed - totalWins - totalDraws;
          } else if (goalDiff === 0) {
            totalWins = Math.round(matchesPlayed * 0.3);
            totalDraws = Math.round(matchesPlayed * 0.4);
            totalLosses = matchesPlayed - totalWins - totalDraws;
          } else if (goalDiff > -5) {
            totalWins = Math.round(matchesPlayed * 0.25);
            totalDraws = Math.round(matchesPlayed * 0.35);
            totalLosses = matchesPlayed - totalWins - totalDraws;
          } else {
            totalWins = Math.round(matchesPlayed * 0.15);
            totalDraws = Math.round(matchesPlayed * 0.25);
            totalLosses = matchesPlayed - totalWins - totalDraws;
          }
        }
      } else {
        return;
      }

      totalWins = Math.max(0, totalWins);
      totalDraws = Math.max(0, totalDraws);
      totalLosses = Math.max(0, totalLosses);
      totalGoalsFor = Math.max(0, totalGoalsFor);
      totalGoalsAgainst = Math.max(0, totalGoalsAgainst);

      const calculatedMatches = totalWins + totalDraws + totalLosses;
      if (calculatedMatches > 0) {
        matchesPlayed = calculatedMatches;
      }

      const points = totalWins * 3 + totalDraws;
      const goalDifference = totalGoalsFor - totalGoalsAgainst;

      const xPoints = Number((xPointsSum).toFixed(1));
      const pointsDelta = Number((points - xPoints).toFixed(1));

      standings.push({
        team: teamName,
        played: matchesPlayed,
        wins: totalWins,
        draws: totalDraws,
        losses: totalLosses,
        goalsFor: totalGoalsFor,
        goalsAgainst: totalGoalsAgainst,
        goalDifference,
        points,
        xPoints,
        pointsDelta
      });
    });

    return standings.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      return b.goalsFor - a.goalsFor;
    });
  };

  const extractMatchResultsFromRows = (cavalryTeam: any) => {
    const results: Array<{ opponent: string; date: string; resultado: string; }> = [];

    if (cavalryTeam.rows && Array.isArray(cavalryTeam.rows)) {
      cavalryTeam.rows.forEach((row: any) => {
        if (row.match && typeof row.match === 'string' && row.match.includes(' - ') && row.match.includes(':')) {
          const parsed = parseFixture(row.match, cavalryTeam.name);
          if (parsed) {
            const dateRaw =
              row.date || row.Date || row['Fecha'] || row['match_date'] || row['Match Date'] || row['Date UTC'] || '';
            results.push({
              opponent: toCanonical(parsed.opponent),
              date: dateRaw,
              resultado: `${parsed.teamGoals}-${parsed.oppGoals}`
            });
          }
        }
      });
    } else {
      Object.entries(cavalryTeam.data || {}).forEach(([key, value]) => {
        if (typeof value === 'string' && value.includes(' - ') && value.includes(':')) {
          const parsed = parseFixture(value, cavalryTeam.name);
          if (parsed) {
            results.push({
              opponent: toCanonical(parsed.opponent),
              date: extractDateFromKey(key) || '',
              resultado: `${parsed.teamGoals}-${parsed.oppGoals}`
            });
          }
        }
      });
    }

    return results;
  };

  const extractDateFromKey = (key: string): string | null => {
    const dateMatch = key.match(/(\d{4}-\d{2}-\d{2})/);
    if (dateMatch) return dateMatch[1];
    const ddmmyyyy = key.match(/(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/);
    if (ddmmyyyy) {
      const [, day, month, year] = ddmmyyyy;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    return null;
  };

  useEffect(() => {
    const now = currentTime;
    const upcoming = matches.find(match => {
      const matchDateTime = new Date(`${match.fecha}T${match.hora}:00`);
      return matchDateTime > now;
    });
    setNextMatch(upcoming || null);
  }, [currentTime, matches]);

  const groupedMatches = matches.reduce((acc, match) => {
    const date = new Date(match.fecha);
    const month = date.toLocaleString('default', { month: 'long' });
    if (!acc[month]) acc[month] = [] as typeof matches;
    acc[month].push(match);
    return acc;
  }, {} as Record<string, typeof matches>);

  const getCountdown = (matchDate: Date) => {
    const diff = matchDate.getTime() - currentTime.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return { days, hours };
  };

  const getResultColor = (resultado?: string) => {
    if (!resultado) return '';
    const [cavalryGoals, opponentGoals] = resultado.split('-').map(g => parseInt(g));
    if (cavalryGoals > opponentGoals) return 'text-green-500';
    else if (cavalryGoals === opponentGoals) return 'text-yellow-500';
    return 'text-red-500';
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* League Standings */}
      {leagueStandings.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Trophy className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Canadian Premier League 2025</h2>
              <p className="text-text-secondary">Current standings based on uploaded team data</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-background-lighter">
                  <th className="p-3 text-left text-xs font-medium text-text-secondary uppercase">Pos</th>
                  <th className="p-3 text-left text-xs font-medium text-text-secondary uppercase">Team</th>
                  <th className="p-3 text-center text-xs font-medium text-text-secondary uppercase">P</th>
                  <th className="p-3 text-center text-xs font-medium text-text-secondary uppercase">W</th>
                  <th className="p-3 text-center text-xs font-medium text-text-secondary uppercase">D</th>
                  <th className="p-3 text-center text-xs font-medium text-text-secondary uppercase">L</th>
                  <th className="p-3 text-center text-xs font-medium text-text-secondary uppercase">GF</th>
                  <th className="p-3 text-center text-xs font-medium text-text-secondary uppercase">GA</th>
                  <th className="p-3 text-center text-xs font-medium text-text-secondary uppercase">GD</th>
                  <th className="p-3 text-center text-xs font-medium text-text-secondary uppercase">Pts</th>
                  <th className="p-3 text-center text-xs font-medium text-cyan-400 uppercase bg-cyan-500/5">xPts</th>
                  <th className="p-3 text-center text-xs font-medium text-orange-400 uppercase bg-orange-500/5">Δ</th>
                </tr>
              </thead>
              <tbody>
                {leagueStandings.map((team, index) => {
                  const isCavalry = team.team.toLowerCase().includes('cavalry');
                  const delta = team.pointsDelta ?? 0;
                  const deltaClass = delta > 0 ? 'text-success' : delta < 0 ? 'text-error' : 'text-text-secondary';
                  return (
                    <tr key={team.team} className={`border-b border-border ${isCavalry ? 'bg-gray-500/20 border-primary/30' : 'hover:bg-surface/50'} transition-colors`}>
                      <td className="p-3 font-bold">
                        <div className="flex items-center gap-2">
                          {index + 1}
                          {isCavalry && <Target className="h-4 w-4 text-primary" />}
                        </div>
                      </td>
                      <td className={`p-3 font-medium ${isCavalry ? 'text-white' : ''}`}>
                        <div className="flex items-center gap-2">
                          {teamLogos[team.team] && (
                            <img src={teamLogos[team.team]} alt={team.team} className="w-6 h-6 object-contain" />
                          )}
                          {team.team}
                        </div>
                      </td>
                      <td className="p-3 text-center">{team.played}</td>
                      <td className="p-3 text-center text-success">{team.wins}</td>
                      <td className="p-3 text-center text-warning">{team.draws}</td>
                      <td className="p-3 text-center text-error">{team.losses}</td>
                      <td className="p-3 text-center">{team.goalsFor}</td>
                      <td className="p-3 text-center">{team.goalsAgainst}</td>
                      <td className={`p-3 text-center ${team.goalDifference >= 0 ? 'text-success' : 'text-error'}`}>{team.goalDifference > 0 ? '+' : ''}{team.goalDifference}</td>
                      <td className={`p-3 text-center font-bold ${isCavalry ? 'text-primary' : ''}`}>{team.points}</td>
                      <td className="p-3 text-center text-cyan-400 font-bold bg-cyan-500/5">{team.xPoints?.toFixed(1) ?? '—'}</td>
                      <td className={`p-3 text-center font-bold ${deltaClass} bg-orange-500/5`}>{delta > 0 ? '+' : ''}{(team.pointsDelta ?? 0).toFixed(1)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Cavalry Stats Summary */}
          {(() => {
            const cavalryStats = leagueStandings.find(t => t.team.toLowerCase().includes('cavalry'));
            if (!cavalryStats) return null;
            return (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-success/10 rounded-lg p-4 border border-success/20">
                  <div className="flex items-center gap-2 mb-2"><Trophy className="h-4 w-4 text-success" /><span className="text-sm text-success font-medium">Wins</span></div>
                  <p className="text-2xl font-bold text-success">{cavalryStats.wins}</p>
                </div>
                <div className="bg-warning/10 rounded-lg p-4 border border-warning/20">
                  <div className="flex items-center gap-2 mb-2"><div className="w-4 h-4 bg-warning rounded-sm"></div><span className="text-sm text-warning font-medium">Draws</span></div>
                  <p className="text-2xl font-bold text-warning">{cavalryStats.draws}</p>
                </div>
                <div className="bg-error/10 rounded-lg p-4 border border-error/20">
                  <div className="flex items-center gap-2 mb-2"><Shield className="h-4 w-4 text-error" /><span className="text-sm text-error font-medium">Losses</span></div>
                  <p className="text-2xl font-bold text-error">{cavalryStats.losses}</p>
                </div>
                <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
                  <div className="flex items-center gap-2 mb-2"><Target className="h-4 w-4 text-primary" /><span className="text-sm text-primary font-medium">Points</span></div>
                  <p className="text-2xl font-bold text-primary">{cavalryStats.points}</p>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Position Probability Table */}
      {Object.keys(positionProbabilities).length > 0 && (
        <div className="card p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-12 w-12 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-lg flex items-center justify-center">
              <Brain className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Season Finish Probabilities</h2>
              <p className="text-text-secondary">Monte Carlo simulation (10,000 iterations)</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Position Probabilities Table */}
            <div className="overflow-x-auto">
              <h3 className="text-lg font-semibold mb-4 text-purple-400">Final Position Probabilities</h3>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-purple-500/10 to-blue-500/10">
                    <th className="p-3 text-left text-xs font-medium text-purple-400 uppercase">Team</th>
                    <th className="p-2 text-center text-xs font-medium text-purple-400 uppercase">1st</th>
                    <th className="p-2 text-center text-xs font-medium text-purple-400 uppercase">2nd</th>
                    <th className="p-2 text-center text-xs font-medium text-purple-400 uppercase">3rd</th>
                    <th className="p-2 text-center text-xs font-medium text-purple-400 uppercase">4th</th>
                    <th className="p-2 text-center text-xs font-medium text-purple-400 uppercase">5th</th>
                    <th className="p-2 text-center text-xs font-medium text-purple-400 uppercase">6th</th>
                    <th className="p-2 text-center text-xs font-medium text-purple-400 uppercase">7th</th>
                    <th className="p-2 text-center text-xs font-medium text-purple-400 uppercase">8th</th>
                  </tr>
                </thead>
                <tbody>
                  {leagueStandings.map((team, index) => {
                    const isCavalry = team.team.toLowerCase().includes('cavalry');
                    const teamProbs = positionProbabilities[team.team] || [];

                    return (
                      <tr key={`prob-${team.team}`} className={`border-b border-border ${isCavalry ? 'bg-purple-500/10 border-purple-500/30' : 'hover:bg-purple-500/5'} transition-colors`}>
                        <td className={`p-3 font-medium ${isCavalry ? 'text-purple-300' : ''}`}>
                          <div className="flex items-center gap-2">
                            {teamLogos[team.team] && (
                              <img src={teamLogos[team.team]} alt={team.team} className="w-5 h-5 object-contain" />
                            )}
                            <span className="text-sm">{team.team}</span>
                          </div>
                        </td>
                        {teamProbs.slice(0, 8).map((prob, pos) => {
                          const isHighProb = prob > 20;
                          const isMediumProb = prob > 10;
                          const isCurrentPos = index === pos;

                          return (
                            <td key={pos} className={`p-2 text-center text-xs font-mono ${isCurrentPos ? 'bg-purple-500/20 font-bold' : isHighProb ? 'text-purple-300 font-bold' : isMediumProb ? 'text-purple-400' : 'text-text-secondary'}`}>
                              {prob >= 0.1 ? `${prob.toFixed(1)}%` : prob > 0 ? '<0.1%' : '0%'}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* CPL Playoff Bracket & Advancement */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-blue-400">CPL Playoff Bracket & Advancement Probabilities</h3>

              <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-lg p-6 mb-6 border border-blue-500/20">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-center">
                  {/* Round 1 */}
                  <div className="space-y-4">
                    <h4 className="text-center text-blue-300 font-semibold text-sm">ROUND 1</h4>
                    <div className="bg-background/50 border border-blue-500/30 rounded-lg p-3">
                      <div className="text-center text-xs text-blue-400 mb-2">Elimination</div>
                      {(() => {
                        const fourthTeam = leagueStandings[3];
                        const fifthTeam = leagueStandings[4];
                        if (!fourthTeam || !fifthTeam) return <div className="text-center text-xs">TBD vs TBD</div>;
                        const fourthProbs = playoffRoundProbabilities[fourthTeam.team];
                        const fifthProbs = playoffRoundProbabilities[fifthTeam.team];
                        return (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-1">
                                {teamLogos[fourthTeam.team] && (<img src={teamLogos[fourthTeam.team]} alt="" className="w-4 h-4" />)}
                                <span className="text-yellow-300">4th</span>
                              </div>
                              <span className="font-mono text-blue-300">{fourthProbs?.round1.toFixed(1) || '0.0'}%</span>
                            </div>
                            <div className="text-center text-xs text-gray-400">vs</div>
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-1">
                                {teamLogos[fifthTeam.team] && (<img src={teamLogos[fifthTeam.team]} alt="" className="w-4 h-4" />)}
                                <span className="text-red-300">5th</span>
                              </div>
                              <span className="font-mono text-blue-300">{fifthProbs?.round1.toFixed(1) || '0.0'}%</span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Round 2 */}
                  <div className="space-y-4">
                    <h4 className="text-center text-purple-300 font-semibold text-sm">ROUND 2</h4>
                    <div className="bg-background/50 border border-purple-500/30 rounded-lg p-3">
                      <div className="text-center text-xs text-purple-400 mb-2">Direct to Final</div>
                      {(() => {
                        const firstTeam = leagueStandings[0];
                        const secondTeam = leagueStandings[1];
                        if (!firstTeam || !secondTeam) return <div className="text-center text-xs">TBD vs TBD</div>;
                        const firstProbs = playoffRoundProbabilities[firstTeam.team];
                        const secondProbs = playoffRoundProbabilities[secondTeam.team];
                        return (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-1">
                                {teamLogos[firstTeam.team] && (<img src={teamLogos[firstTeam.team]} alt="" className="w-4 h-4" />)}
                                <span className="text-green-300">1st</span>
                              </div>
                              <span className="font-mono text-purple-300">{firstProbs?.semifinal.toFixed(1) || '0.0'}%</span>
                            </div>
                            <div className="text-center text-xs text-gray-400">vs</div>
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-1">
                                {teamLogos[secondTeam.team] && (<img src={teamLogos[secondTeam.team]} alt="" className="w-4 h-4" />)}
                                <span className="text-blue-300">2nd</span>
                              </div>
                              <span className="font-mono text-purple-300">{secondProbs?.semifinal.toFixed(1) || '0.0'}%</span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    <div className="bg-background/50 border border-purple-500/30 rounded-lg p-3">
                      <div className="text-center text-xs text-purple-400 mb-2">Elimination</div>
                      {(() => {
                        const thirdTeam = leagueStandings[2];
                        if (!thirdTeam) return <div className="text-center text-xs">TBD vs R1W</div>;
                        const thirdProbs = playoffRoundProbabilities[thirdTeam.team];
                        return (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-1">
                                {teamLogos[thirdTeam.team] && (<img src={teamLogos[thirdTeam.team]} alt="" className="w-4 h-4" />)}
                                <span className="text-orange-300">3rd</span>
                              </div>
                              <span className="font-mono text-purple-300">{thirdProbs?.semifinal.toFixed(1) || '0.0'}%</span>
                            </div>
                            <div className="text-center text-xs text-gray-400">vs</div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-400">R1 Winner</span>
                              <span className="font-mono text-gray-400 text-xs">
                                {(() => {
                                  const fourthTeam = leagueStandings[3];
                                  const fifthTeam = leagueStandings[4];
                                  if (!fourthTeam || !fifthTeam) return '—';
                                  const fourthR1 = playoffRoundProbabilities[fourthTeam.team]?.round1 || 0;
                                  const fifthR1 = playoffRoundProbabilities[fifthTeam.team]?.round1 || 0;
                                  return `${(fourthR1 + fifthR1).toFixed(1)}%`;
                                })()}
                              </span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Semifinal */}
                  <div className="space-y-4">
                    <h4 className="text-center text-green-300 font-semibold text-sm">SEMIFINAL</h4>
                    <div className="bg-background/50 border border-green-500/30 rounded-lg p-3">
                      <div className="text-center text-xs text-green-400 mb-2">Last Chance</div>
                      <div className="space-y-2">
                        <div className="text-center text-xs text-gray-400">R2A Loser</div>
                        <div className="text-center text-xs text-gray-400">vs</div>
                        <div className="text-center text-xs text-gray-400">R2B Winner</div>
                      </div>
                    </div>
                  </div>

                  {/* Final */}
                  <div className="space-y-4">
                    <h4 className="text-center text-yellow-300 font-semibold text-sm">FINAL</h4>
                    <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-lg p-3">
                      <div className="text-center text-xs text-yellow-400 mb-2">North Star Cup</div>
                      <div className="space-y-2">
                        <div className="text-center text-xs text-gray-400">R2A Winner</div>
                        <div className="text-center text-xs text-yellow-400">(Home)</div>
                        <div className="text-center text-xs text-gray-400">vs</div>
                        <div className="text-center text-xs text-gray-400">SF Winner</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Round-by-Round Probabilities Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="bg-gradient-to-r from-blue-500/10 to-green-500/10">
                      <th className="p-2 text-left text-blue-400 uppercase font-medium">Team</th>
                      <th className="p-2 text-center text-blue-400 uppercase font-medium">Qualify</th>
                      <th className="p-2 text-center text-purple-400 uppercase font-medium">R1</th>
                      <th className="p-2 text-center text-green-400 uppercase font-medium">SF</th>
                      <th className="p-2 text-center text-yellow-400 uppercase font-medium">Final</th>
                      <th className="p-2 text-center text-orange-400 uppercase font-medium">Champion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leagueStandings.slice(0, 8).map((team, index) => {
                      const isCavalry = team.team.toLowerCase().includes('cavalry');
                      const probs = playoffRoundProbabilities[team.team] || { qualify:0, round1:0, semifinal:0, final:0, champion:0 };

                      return (
                        <tr key={`rounds-${team.team}`} className={`border-b border-border ${isCavalry ? 'bg-blue-500/10 border-blue-500/30' : 'hover:bg-blue-500/5'} transition-colors`}>
                          <td className={`p-2 font-medium ${isCavalry ? 'text-blue-300' : ''}`}>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-1.5 py-0.5 rounded ${index < 5 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                {index + 1}
                              </span>
                              {teamLogos[team.team] && (<img src={teamLogos[team.team]} alt={team.team} className="w-4 h-4 object-contain" />)}
                              <span className="text-xs">{team.team}</span>
                            </div>
                          </td>
                          <td className="p-2 text-center font-mono">
                            <span className={probs.qualify > 50 ? 'text-green-400 font-bold' : probs.qualify > 20 ? 'text-blue-400' : 'text-gray-400'}>
                              {probs.qualify.toFixed(1)}%
                            </span>
                          </td>
                          <td className="p-2 text-center font-mono">
                            <span className={probs.round1 > 30 ? 'text-purple-300 font-bold' : probs.round1 > 10 ? 'text-purple-400' : 'text-gray-400'}>
                              {probs.round1.toFixed(1)}%
                            </span>
                          </td>
                          <td className="p-2 text-center font-mono">
                            <span className={probs.semifinal > 30 ? 'text-green-300 font-bold' : probs.semifinal > 10 ? 'text-green-400' : 'text-gray-400'}>
                              {probs.semifinal.toFixed(1)}%
                            </span>
                          </td>
                          <td className="p-2 text-center font-mono">
                            <span className={probs.final > 30 ? 'text-yellow-300 font-bold' : probs.final > 10 ? 'text-yellow-400' : 'text-gray-400'}>
                              {probs.final.toFixed(1)}%
                            </span>
                          </td>
                          <td className="p-2 text-center font-mono">
                            <span className={probs.champion > 20 ? 'text-orange-300 font-bold' : probs.champion > 5 ? 'text-orange-400' : 'text-gray-400'}>
                              {probs.champion.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* CPL Playoff Format Details */}
              <div className="mt-6 p-4 bg-gradient-to-r from-blue-500/10 to-green-500/10 rounded-lg border border-blue-500/20">
                <h4 className="text-sm font-medium text-blue-400 mb-2">CPL Playoff Format Details</h4>
                <div className="text-xs text-text-secondary space-y-1">
                  <p>• <strong>Top 5 teams qualify</strong> for playoffs (positions 1-5 in final table)</p>
                  <p>• <strong>Round 1:</strong> 4th vs 5th (single elimination match)</p>
                  <p>• <strong>Round 2A:</strong> 1st vs 2nd (winner goes directly to Final with home advantage)</p>
                  <p>• <strong>Round 2B:</strong> 3rd vs Round 1 winner (single elimination)</p>
                  <p>• <strong>Semifinal:</strong> Round 2A loser vs Round 2B winner</p>
                  <p>• <strong>Final:</strong> Round 2A winner (home) vs Semifinal winner</p>
                  <p>• <strong>Champion qualifies for Concacaf Champions Cup</strong></p>
                  <p>• All matches are single games (extra time + penalties if tied)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Next Match Card */}
      {nextMatch && (
        <div className="card bg-gradient-to-br from-primary/10 to-surface p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Next Match</h2>
            {(() => {
              const matchDate = new Date(`${nextMatch.fecha}T${nextMatch.hora}:00`);
              const { days, hours } = getCountdown(matchDate);
              return (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="font-mono">{days}d {hours}h</span>
                </div>
              );
            })()}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${nextMatch.local ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                {nextMatch.local ? <Home className="h-6 w-6" /> : <MapPin className="h-6 w-6" />}
              </div>
              <div className="flex items-center gap-3">
                {teamLogos[nextMatch.oponente] && (
                  <img src={teamLogos[nextMatch.oponente]} alt={nextMatch.oponente} className="w-10 h-10 object-contain" />
                )}
                <div>
                  <p className="text-lg font-semibold">{nextMatch.local ? 'vs' : '@'} {nextMatch.oponente}</p>
                  <div className="flex items-center gap-3 text-text-secondary mt-1">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(nextMatch.fecha).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{nextMatch.hora}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {new Date(`${nextMatch.fecha}T${nextMatch.hora}:00`) < currentTime && nextMatch.resultado && (
              <div className="text-right">
                <div className="text-sm text-text-secondary">Result</div>
                <div className={`font-bold text-lg ${getResultColor(nextMatch.resultado)}`}>{nextMatch.resultado}</div>
              </div>
            )}
            <ChevronRight className="h-5 w-5 text-text-secondary" />
          </div>
        </div>
      )}

      {/* Season Schedule */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">2025 Season Schedule</h2>

          {/* Legend */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-full bg-primary/10 text-primary"><div className="w-4 h-4 bg-green-500 rounded-full"></div></div>
              <span className="text-text-secondary">Home</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-full bg-secondary/10 text-secondary"><div className="w-4 h-4 bg-red-500 rounded-full"></div></div>
              <span className="text-text-secondary">Away</span>
            </div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 bg-green-500 rounded-full"></div><span className="text-text-secondary">Win</span></div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 bg-yellow-500 rounded-full"></div><span className="text-text-secondary">Draw</span></div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 bg-red-500 rounded-full"></div><span className="text-text-secondary">Loss</span></div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(groupedMatches).map(([month, monthMatches]) => {
            const now = currentTime;
            const monthDate = new Date(monthMatches[0].fecha);
            const isPastMonth = monthDate.getMonth() < now.getMonth() && monthDate.getFullYear() <= now.getFullYear();

            return (
              <div key={month} className={`card p-4 ${isPastMonth ? 'opacity-60' : ''}`}>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" /> {month}
                </h3>

                <div className="space-y-3">
                  {monthMatches.map((match) => {
                    const matchDateTime = new Date(`${match.fecha}T${match.hora}:00`);
                    const isNextMatch = nextMatch && match.fecha === nextMatch.fecha && match.oponente === nextMatch.oponente;
                    const isPast = matchDateTime < now;

                    return (
                      <div
                        key={`${match.fecha}-${match.oponente}`}
                        className={`p-3 rounded-lg border transition-all ${isNextMatch ? 'border-primary bg-primary/5 shadow-lg transform -translate-y-1' : isPast ? 'border-border opacity-50' : match.local ? 'border-primary/20 hover:border-primary' : 'border-secondary/20 hover:border-secondary'}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-full ${match.local ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                              {match.local ? <Home className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                            </div>
                            <div className="flex items-center gap-2">
                              {teamLogos[match.oponente] && (<img src={teamLogos[match.oponente]} alt={match.oponente} className="w-6 h-6 object-contain" />)}
                              <span className="font-medium">{match.local ? 'vs' : '@'} {match.oponente}</span>
                            </div>
                          </div>
                          {isNextMatch && <span className="text-xs bg-primary text-white px-2 py-1 rounded-full">Next Match</span>}
                        </div>

                        <div className="flex items-center gap-4 text-sm text-text-secondary">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>{matchDateTime.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            <span>{match.hora}</span>
                          </div>
                        </div>

                        {/* Resultado solo si ya pasó el encuentro */}
                        {isPast && match.resultado && (
                          <div className="mt-2 text-center">
                            <div className={`text-sm font-bold ${getResultColor(match.resultado)}`}>{match.resultado}</div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Schedule;
