"use client";

import React, { useState, useEffect, useCallback } from "react";

interface TeamUnits {
  passOff: number;
  rushOff: number;
  passDef: number;
  rushDef: number;
  scoringOff: number;
  scoringDef: number;
  turnoverRank: number; // 1 = elite turnover margin, 32 = turnover prone
  overall: number;
}

// Power baselines derived from Super Bowl futures, win totals, and unit baselines
const SUPER_BOWL_POWER_RATINGS: Record<string, TeamUnits> = {
  LAR: { overall: 5.8, passOff: 2.8, rushOff: 1.8, passDef: 1.6, rushDef: 1.4, scoringOff: 27.2, scoringDef: 19.5, turnoverRank: 8 },
  KC:  { overall: 5.6, passOff: 2.7, rushOff: 1.0, passDef: 1.5, rushDef: 1.0, scoringOff: 25.8, scoringDef: 18.2, turnoverRank: 5 },
  SF:  { overall: 5.4, passOff: 2.3, rushOff: 2.2, passDef: 1.3, rushDef: 1.1, scoringOff: 26.5, scoringDef: 19.2, turnoverRank: 7 },
  BAL: { overall: 5.0, passOff: 1.8, rushOff: 2.7, passDef: 1.2, rushDef: 1.6, scoringOff: 26.0, scoringDef: 18.8, turnoverRank: 4 },
  DET: { overall: 4.8, passOff: 2.3, rushOff: 2.1, passDef: 0.6, rushDef: 1.5, scoringOff: 27.0, scoringDef: 21.0, turnoverRank: 6 },
  BUF: { overall: 4.4, passOff: 2.4, rushOff: 1.4, passDef: 0.9, rushDef: 0.7, scoringOff: 25.5, scoringDef: 20.2, turnoverRank: 3 },
  PHI: { overall: 4.2, passOff: 1.6, rushOff: 2.1, passDef: 0.7, rushDef: 1.0, scoringOff: 24.8, scoringDef: 20.0, turnoverRank: 10 },
  HOU: { overall: 3.8, passOff: 2.2, rushOff: 0.8, passDef: 1.2, rushDef: 0.9, scoringOff: 24.0, scoringDef: 20.4, turnoverRank: 9 },
  GB:  { overall: 3.4, passOff: 2.1, rushOff: 1.1, passDef: 0.6, rushDef: 0.4, scoringOff: 23.8, scoringDef: 20.8, turnoverRank: 11 },
  CIN: { overall: 3.2, passOff: 2.5, rushOff: 0.3, passDef: 0.5, rushDef: 0.3, scoringOff: 23.5, scoringDef: 21.2, turnoverRank: 14 },
  MIA: { overall: 2.4, passOff: 2.2, rushOff: 0.9, passDef: 0.3, rushDef: -0.2, scoringOff: 23.2, scoringDef: 21.9, turnoverRank: 16 },
  DAL: { overall: 2.2, passOff: 1.9, rushOff: 0.3, passDef: 0.8, rushDef: -0.3, scoringOff: 23.0, scoringDef: 21.8, turnoverRank: 12 },
  NYJ: { overall: 1.8, passOff: 1.1, rushOff: 0.8, passDef: 1.8, rushDef: 1.0, scoringOff: 21.0, scoringDef: 19.4, turnoverRank: 18 },
  ATL: { overall: 1.2, passOff: 1.2, rushOff: 1.4, passDef: -0.1, rushDef: 0.0, scoringOff: 22.1, scoringDef: 21.5, turnoverRank: 19 },
  CHI: { overall: 0.8, passOff: 0.9, rushOff: 0.9, passDef: 0.5, rushDef: 0.4, scoringOff: 21.8, scoringDef: 21.2, turnoverRank: 15 },
  PIT: { overall: 0.6, passOff: 0.2, rushOff: 0.8, passDef: 1.2, rushDef: 1.3, scoringOff: 20.2, scoringDef: 19.8, turnoverRank: 2 },
  TB:  { overall: 0.5, passOff: 1.4, rushOff: -0.2, passDef: 0.3, rushDef: 0.8, scoringOff: 21.5, scoringDef: 21.4, turnoverRank: 17 },
  CLE: { overall: 0.4, passOff: 0.2, rushOff: 0.9, passDef: 1.7, rushDef: 1.2, scoringOff: 19.8, scoringDef: 19.6, turnoverRank: 26 },
  SEA: { overall: 0.0, passOff: 1.1, rushOff: 0.4, passDef: -0.3, rushDef: -0.2, scoringOff: 21.4, scoringDef: 22.0, turnoverRank: 20 },
  JAX: { overall: -0.2, passOff: 0.9, rushOff: 0.3, passDef: -0.4, rushDef: -0.1, scoringOff: 21.0, scoringDef: 22.2, turnoverRank: 22 },
  IND: { overall: -0.4, passOff: 0.6, rushOff: 1.1, passDef: -0.6, rushDef: -0.2, scoringOff: 21.2, scoringDef: 22.5, turnoverRank: 21 },
  LAC: { overall: -0.5, passOff: 1.0, rushOff: 0.5, passDef: -0.3, rushDef: 0.2, scoringOff: 20.8, scoringDef: 22.1, turnoverRank: 13 },
  MIN: { overall: -0.8, passOff: 1.1, rushOff: -0.3, passDef: 0.4, rushDef: 0.3, scoringOff: 20.5, scoringDef: 22.2, turnoverRank: 23 },
  DEN: { overall: -1.0, passOff: 0.3, rushOff: 0.4, passDef: 1.0, rushDef: 1.8, scoringOff: 19.5, scoringDef: 20.8, turnoverRank: 24 },
  NO:  { overall: -1.5, passOff: 0.4, rushOff: 0.3, passDef: 0.5, rushDef: -0.6, scoringOff: 20.1, scoringDef: 22.8, turnoverRank: 25 },
  ARI: { overall: -2.0, passOff: 0.6, rushOff: 1.0, passDef: -1.1, rushDef: -0.8, scoringOff: 20.4, scoringDef: 23.9, turnoverRank: 27 },
  LV:  { overall: -2.2, passOff: 0.1, rushOff: 0.2, passDef: 0.3, rushDef: -0.7, scoringOff: 19.2, scoringDef: 23.4, turnoverRank: 28 },
  WAS: { overall: -2.5, passOff: 0.4, rushOff: 0.7, passDef: -1.3, rushDef: -0.7, scoringOff: 19.8, scoringDef: 24.3, turnoverRank: 29 },
  TEN: { overall: -3.2, passOff: -0.3, rushOff: 0.5, passDef: -0.5, rushDef: 0.5, scoringOff: 18.5, scoringDef: 23.5, turnoverRank: 30 },
  NYG: { overall: -3.6, passOff: -0.5, rushOff: 0.4, passDef: 0.0, rushDef: -0.8, scoringOff: 17.8, scoringDef: 23.6, turnoverRank: 31 },
  NE:  { overall: -4.0, passOff: -0.9, rushOff: 0.4, passDef: 0.7, rushDef: 0.4, scoringOff: 17.0, scoringDef: 23.2, turnoverRank: 32 },
  CAR: { overall: -4.8, passOff: -1.1, rushOff: -0.3, passDef: -0.7, rushDef: -1.3, scoringOff: 16.5, scoringDef: 24.8, turnoverRank: 32 }
};

// Aliases resolver (e.g. ESPN uses WSH, JAC, OAK, etc.)
function resolveTeamAbbr(raw: string): string {
  const norm = raw.toUpperCase().trim();
  const map: Record<string, string> = {
    WSH: "WAS",
    JAC: "JAX",
    OAK: "LV",
    SD: "LAC",
    STL: "LAR"
  };
  return map[norm] || norm;
}

const HOME_FIELD_ADVANTAGE = 1.75;
const K_LEARNING_RATE = 0.12;

interface GameDisplay {
  id: string;
  matchup: string;
  awayTeam: string;
  homeTeam: string;
  awayAbbr: string;
  homeAbbr: string;
  awayScore?: string;
  homeScore?: string;
  gameStatusText: string;
  isLiveOrFinal: boolean;
  liveHomeSpread: number;
  liveAwaySpread: number;
  marketTotal: number;
  homeML: number;
  awayML: number;
  projectedHomeSpread: number;
  projectedAwaySpread: number;
  projectedTotal: number;
  predictedHomeScore: number;
  predictedAwayScore: number;
  matchupHighlight: string;
  awayRankSummary: string;
  homeRankSummary: string;
}

export default function GridironDashboard() {
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [activeTab, setActiveTab] = useState<"SPREAD" | "MONEYLINE" | "TOTALS" | "UPSET">("SPREAD");
  const [games, setGames] = useState<GameDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [syncCount, setSyncCount] = useState<number>(0);
  const [historicalGamesCount, setHistoricalGamesCount] = useState<number>(0);

  const fetchLiveSlate = useCallback(async () => {
    setLoading(true);
    try {
      const currentRatings: Record<string, TeamUnits> = {};
      Object.keys(SUPER_BOWL_POWER_RATINGS).forEach((abbr) => {
        currentRatings[abbr] = { ...SUPER_BOWL_POWER_RATINGS[abbr] };
      });

      let totalHistory = 0;

      if (selectedWeek > 1) {
        const priorWeekFetches = [];
        for (let w = 1; w < selectedWeek; w++) {
          priorWeekFetches.push(
            fetch(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?seasontype=2&week=${w}`)
              .then((r) => r.json())
              .catch(() => ({ events: [] }))
          );
        }

        const priorResults = await Promise.all(priorWeekFetches);

        priorResults.forEach((weekData) => {
          (weekData.events || []).forEach((ev: any) => {
            const comp = ev.competitions?.[0];
            if (ev.status?.type?.name === "STATUS_FINAL") {
              const home = comp?.competitors?.find((c: any) => c.homeAway === "home");
              const away = comp?.competitors?.find((c: any) => c.homeAway === "away");
              const homeAbbr = resolveTeamAbbr(home?.team?.abbreviation || "");
              const awayAbbr = resolveTeamAbbr(away?.team?.abbreviation || "");
              const homeScore = Number(home?.score || 0);
              const awayScore = Number(away?.score || 0);

              if (homeAbbr && awayAbbr && currentRatings[homeAbbr] && currentRatings[awayAbbr]) {
                totalHistory++;
                const actualMargin = homeScore - awayScore;
                const expectedMargin = (currentRatings[homeAbbr].overall - currentRatings[awayAbbr].overall) + HOME_FIELD_ADVANTAGE;
                const clampedDelta = Math.max(-10, Math.min(10, actualMargin - expectedMargin)) * K_LEARNING_RATE;

                currentRatings[homeAbbr].overall = Number((currentRatings[homeAbbr].overall + clampedDelta).toFixed(2));
                currentRatings[awayAbbr].overall = Number((currentRatings[awayAbbr].overall - clampedDelta).toFixed(2));

                currentRatings[homeAbbr].scoringOff = Number((currentRatings[homeAbbr].scoringOff * 0.85 + homeScore * 0.15).toFixed(1));
                currentRatings[awayAbbr].scoringOff = Number((currentRatings[awayAbbr].scoringOff * 0.85 + awayScore * 0.15).toFixed(1));
              }
            }
          });
        });
      }

      setHistoricalGamesCount(totalHistory);

      const getRanks = (key: keyof TeamUnits) => {
        return Object.entries(currentRatings)
          .sort(([, a], [, b]) => b[key] - a[key])
          .reduce((acc, [abbr], idx) => {
            acc[abbr] = idx + 1;
            return acc;
          }, {} as Record<string, number>);
      };

      const passOffRanks = getRanks("passOff");
      const rushOffRanks = getRanks("rushOff");
      const passDefRanks = getRanks("passDef");
      const rushDefRanks = getRanks("rushDef");

      const res = await fetch(
        `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?seasontype=2&week=${selectedWeek}`
      );
      const data = await res.json();
      const events = data.events || [];

      const parsedGames: GameDisplay[] = events.map((ev: any) => {
        const comp = ev.competitions?.[0];
        const statusType = ev.status?.type?.name;
        const statusDetail = ev.status?.type?.detail || "Scheduled";

        const home = comp?.competitors?.find((c: any) => c.homeAway === "home");
        const away = comp?.competitors?.find((c: any) => c.homeAway === "away");

        // Canonical abbreviation lookup with WSH alias fallback
        const homeAbbrRaw = home?.team?.abbreviation || "HOU";
        const awayAbbrRaw = away?.team?.abbreviation || "IND";
        const homeAbbr = resolveTeamAbbr(homeAbbrRaw);
        const awayAbbr = resolveTeamAbbr(awayAbbrRaw);

        const oddsData = comp?.odds?.[0];
        const defaultUnits: TeamUnits = { passOff: 0, rushOff: 0, passDef: 0, rushDef: 0, scoringOff: 22, scoringDef: 22, turnoverRank: 16, overall: 0 };
        const homeUnits = currentRatings[homeAbbr] || defaultUnits;
        const awayUnits = currentRatings[awayAbbr] || defaultUnits;

        // Base spread: (Away - Home) - HFA
        const rawHomeSpread = (awayUnits.overall - homeUnits.overall) - HOME_FIELD_ADVANTAGE;

        // Trench clash disparities
        const homePassRankAdv = (passDefRanks[awayAbbr] || 16) - (passOffRanks[homeAbbr] || 16);
        const homeRushRankAdv = (rushDefRanks[awayAbbr] || 16) - (rushOffRanks[homeAbbr] || 16);
        const awayPassRankAdv = (passDefRanks[homeAbbr] || 16) - (passOffRanks[awayAbbr] || 16);
        const awayRushRankAdv = (rushDefRanks[homeAbbr] || 16) - (rushOffRanks[awayAbbr] || 16);

        let matchupHighlight = "Neutral game script: Both units profile evenly across trenches.";
        if (homeRushRankAdv >= 12 && homeRushRankAdv > homePassRankAdv) {
          matchupHighlight = `Trench Edge: ${home?.team?.displayName} Rush (#${rushOffRanks[homeAbbr] || 16}) vs ${away?.team?.displayName} Run D (#${rushDefRanks[awayAbbr] || 16})`;
        } else if (awayRushRankAdv >= 12 && awayRushRankAdv > awayPassRankAdv) {
          matchupHighlight = `Trench Edge: ${away?.team?.displayName} Rush (#${rushOffRanks[awayAbbr] || 16}) vs ${home?.team?.displayName} Run D (#${rushDefRanks[homeAbbr] || 16})`;
        } else if (homePassRankAdv >= 10) {
          matchupHighlight = `Air Edge: ${home?.team?.displayName} Pass (#${passOffRanks[homeAbbr] || 16}) vs ${away?.team?.displayName} Secondary (#${passDefRanks[awayAbbr] || 16})`;
        } else if (awayPassRankAdv >= 10) {
          matchupHighlight = `Air Edge: ${away?.team?.displayName} Pass (#${passOffRanks[awayAbbr] || 16}) vs ${home?.team?.displayName} Secondary (#${passDefRanks[homeAbbr] || 16})`;
        } else if (homeUnits.rushDef >= 1.5) {
          matchupHighlight = `Defensive Anchor: ${home?.team?.displayName} ranks #${rushDefRanks[homeAbbr] || 1} against the run`;
        } else if (awayUnits.rushDef >= 1.5) {
          matchupHighlight = `Defensive Anchor: ${away?.team?.displayName} ranks #${rushDefRanks[awayAbbr] || 1} against the run`;
        }

        // Turnover & unit clash nudge (+/- 0.6 pts max)
        const turnoverTilt = ((homeUnits.turnoverRank - awayUnits.turnoverRank) * 0.02);
        const netRankDiff = (awayPassRankAdv + awayRushRankAdv) - (homePassRankAdv + homeRushRankAdv);
        const clampedClash = Math.max(-0.6, Math.min(0.6, (netRankDiff * 0.03) + turnoverTilt));

        let projectedHomeSpread = Number((rawHomeSpread + clampedClash).toFixed(1));

        // Live Market consensus
        let liveHomeSpread = 0;
        if (oddsData?.spread !== undefined && Math.abs(Number(oddsData.spread)) <= 21) {
          liveHomeSpread = Number(oddsData.spread);
        } else {
          liveHomeSpread = Number((Math.round(rawHomeSpread * 2) / 2).toFixed(1));
          if (liveHomeSpread % 1 === 0) liveHomeSpread -= 0.5;
        }

        // Over/Under totals from market
        let marketTotal = 44.5;
        if (oddsData?.overUnder !== undefined) {
          marketTotal = Number(oddsData.overUnder);
        }

        // Model projected total
        const baseGameTotal = ((homeUnits.scoringOff + awayUnits.scoringDef) / 2) +
                              ((awayUnits.scoringOff + homeUnits.scoringDef) / 2) + 0.8;
        const projectedTotal = Number(baseGameTotal.toFixed(1));

        // Smooth non-clamped distribution (realistic deviation curve)
        const delta = projectedHomeSpread - liveHomeSpread;
        projectedHomeSpread = Number((liveHomeSpread + (Math.tanh(delta / 2.5) * 2.8)).toFixed(1));

        const liveAwaySpread = Number((-liveHomeSpread).toFixed(1));
        const projectedAwaySpread = Number((-projectedHomeSpread).toFixed(1));

        // Final score projections
        const predictedHomeRaw = (projectedTotal / 2) - (projectedHomeSpread / 2);
        const predictedAwayRaw = (projectedTotal / 2) + (projectedHomeSpread / 2);

        let finalHomeScore = Math.round(predictedHomeRaw);
        let finalAwayScore = Math.round(predictedAwayRaw);
        if (finalHomeScore === finalAwayScore) {
          if (projectedHomeSpread < 0) finalHomeScore += 3;
          else finalAwayScore += 3;
        }

        let homeML = -110;
        let awayML = -110;
        if (oddsData?.moneyline?.home?.odds) {
          homeML = oddsData.moneyline.home.odds;
          awayML = oddsData.moneyline.away.odds;
        } else {
          homeML = liveHomeSpread < 0 ? -110 + Math.round(liveHomeSpread * 22) : 100 + Math.round(liveHomeSpread * 22);
          awayML = liveHomeSpread < 0 ? 100 + Math.round(Math.abs(liveHomeSpread) * 20) : -110 - Math.round(liveHomeSpread * 20);
        }

        return {
          id: ev.id,
          matchup: `${away?.team?.displayName} @ ${home?.team?.displayName}`,
          awayTeam: away?.team?.displayName || awayAbbrRaw,
          homeTeam: home?.team?.displayName || homeAbbrRaw,
          awayAbbr: awayAbbrRaw,
          homeAbbr: homeAbbrRaw,
          awayScore: away?.score,
          homeScore: home?.score,
          gameStatusText: statusDetail,
          isLiveOrFinal: statusType === "STATUS_IN_PROGRESS" || statusType === "STATUS_FINAL",
          liveHomeSpread,
          liveAwaySpread,
          marketTotal,
          homeML,
          awayML,
          projectedHomeSpread,
          projectedAwaySpread,
          projectedTotal,
          predictedHomeScore: finalHomeScore,
          predictedAwayScore: finalAwayScore,
          matchupHighlight,
          awayRankSummary: `Pass O: #${passOffRanks[awayAbbr] || 16} | Rush D: #${rushDefRanks[awayAbbr] || 16}`,
          homeRankSummary: `Pass O: #${passOffRanks[homeAbbr] || 16} | Rush D: #${rushDefRanks[homeAbbr] || 16}`
        };
      });

      setGames(parsedGames);
      setLastUpdated(new Date().toLocaleTimeString());
      setSyncCount((c) => c + 1);
    } catch (err) {
      console.error("Matchup engine sync error:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedWeek]);

  useEffect(() => {
    fetchLiveSlate();
    const interval = setInterval(fetchLiveSlate, 60000);
    return () => clearInterval(interval);
  }, [fetchLiveSlate]);

  const spreadToWinProbability = (spread: number) => 1 / (1 + Math.pow(10, spread / 14.5));
  const calculateEV = (winProb: number, odds: number) => {
    const profit = odds > 0 ? odds : 100 / (Math.abs(odds) / 100);
    return Number((((winProb * profit) - ((1 - winProb) * 100)) / 100).toFixed(3));
  };

  const classifyTier = (type: "SPREAD" | "MONEYLINE" | "TOTALS" | "UPSET", val: number) => {
    if (type === "SPREAD") {
      if (val >= 2.0) return { tier: "Lock (3★)", color: "emerald", isTossUp: false };
      if (val >= 1.0) return { tier: "Value Lean (2★)", color: "blue", isTossUp: false };
      if (val >= 0.5) return { tier: "Slight Lean (1★)", color: "zinc", isTossUp: false };
      return { tier: "Toss-Up (50/50)", color: "amber", isTossUp: true };
    }
    if (type === "TOTALS") {
      if (val >= 2.5) return { tier: "Lock (3★)", color: "emerald", isTossUp: false };
      if (val >= 1.5) return { tier: "Value Lean (2★)", color: "blue", isTossUp: false };
      if (val >= 0.8) return { tier: "Slight Lean (1★)", color: "zinc", isTossUp: false };
      return { tier: "Toss-Up (50/50)", color: "amber", isTossUp: true };
    }
    if (type === "MONEYLINE") {
      if (val >= 6.0) return { tier: "Lock (3★)", color: "emerald", isTossUp: false };
      if (val >= 3.0) return { tier: "Value Lean (2★)", color: "blue", isTossUp: false };
      if (val >= 1.0) return { tier: "Slight Lean (1★)", color: "zinc", isTossUp: false };
      return { tier: "Toss-Up (50/50)", color: "amber", isTossUp: true };
    }
    if (val >= 28.0) return { tier: "Lock (3★)", color: "emerald", isTossUp: false };
    if (val >= 20.0) return { tier: "Value Lean (2★)", color: "blue", isTossUp: false };
    if (val >= 14.0) return { tier: "Slight Lean (1★)", color: "zinc", isTossUp: false };
    return { tier: "Toss-Up (50/50)", color: "amber", isTossUp: true };
  };

  // 1. SPREAD CARDS (With Key Number Leverage bonus)
  const spreadCards = games.map((g) => {
    const homeEdge = g.liveHomeSpread - g.projectedHomeSpread;
    const isHomePick = homeEdge >= 0;

    const teamPicked = isHomePick ? g.homeTeam : g.awayTeam;
    const pickedSpreadNum = isHomePick ? g.liveHomeSpread : g.liveAwaySpread;
    const isFavorite = pickedSpreadNum < 0;
    const spreadString = pickedSpreadNum > 0 ? `+${pickedSpreadNum}` : `${pickedSpreadNum}`;

    let edge = Number(Math.abs(homeEdge).toFixed(1));
    // Key number crossing bonus (3 or 7)
    const line1 = Math.abs(g.liveHomeSpread);
    const line2 = Math.abs(g.projectedHomeSpread);
    if ((line1 > 3 && line2 <= 3) || (line1 <= 3 && line2 > 3) || (line1 > 7 && line2 <= 7)) {
      edge = Number((edge + 0.3).toFixed(1));
    }

    const meta = classifyTier("SPREAD", edge);

    return {
      ...g,
      teamPicked,
      spreadString,
      isFavorite,
      edge,
      ...meta
    };
  }).sort((a, b) => b.edge - a.edge);

  // 2. OVER / UNDER TOTALS CARDS
  const totalsCards = games.map((g) => {
    const totalDiff = g.projectedTotal - g.marketTotal;
    const isOver = totalDiff >= 0;
    const pickType = isOver ? "OVER" : "UNDER";
    const edge = Number(Math.abs(totalDiff).toFixed(1));
    const meta = classifyTier("TOTALS", edge);
    return {
      ...g,
      pickType,
      edge,
      ...meta
    };
  }).sort((a, b) => b.edge - a.edge);

  // 3. MONEYLINE CARDS
  const moneylineCards = games.map((g) => {
    const homeProb = spreadToWinProbability(g.projectedHomeSpread);
    const awayProb = 1 - homeProb;
    const homeEV = calculateEV(homeProb, g.homeML);
    const awayEV = calculateEV(awayProb, g.awayML);
    const isHome = homeEV >= awayEV;
    const team = isHome ? g.homeTeam : g.awayTeam;
    const odds = isHome ? g.homeML : g.awayML;
    const evPct = Number(((isHome ? homeEV : awayEV) * 100).toFixed(1));
    const winProbPct = Number(((isHome ? homeProb : awayProb) * 100).toFixed(1));
    const meta = classifyTier("MONEYLINE", Math.max(0, evPct));
    return { ...g, team, odds, evPct, winProbPct, ...meta };
  }).sort((a, b) => b.evPct - a.evPct);

  // 4. UPSET CARDS
  const upsetCards = games.map((g) => {
    const isAwayDog = g.awayML > g.homeML;
    const dog = isAwayDog ? g.awayTeam : g.homeTeam;
    const odds = isAwayDog ? g.awayML : g.homeML;
    const winProb = isAwayDog ? (1 - spreadToWinProbability(g.projectedHomeSpread)) : spreadToWinProbability(g.projectedHomeSpread);
    const ev = calculateEV(winProb, odds);
    const score = Number(((winProb * 40) + (Math.max(ev, 0) * 60)).toFixed(1));
    const meta = classifyTier("UPSET", score);
    return { ...g, dog, odds, winProbPct: Number((winProb * 100).toFixed(1)), evPct: Number((ev * 100).toFixed(1)), score, ...meta };
  }).sort((a, b) => b.score - a.score);

  const badgeStyles: Record<string, string> = {
    emerald: "bg-emerald-950/70 border-emerald-500/40 text-emerald-400",
    blue: "bg-blue-950/70 border-blue-500/40 text-blue-400",
    zinc: "bg-zinc-800/80 border-zinc-700 text-zinc-300",
    amber: "bg-amber-950/70 border-amber-500/40 text-amber-400",
  };

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <header className="border-b border-zinc-800 pb-5 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-white">GridironPicks</h1>
              <span className="inline-flex items-center gap-1 bg-emerald-950/60 border border-emerald-500/50 text-emerald-400 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                LIVE SYNC
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">Key Number Leverage & Over/Under Value Engine</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchLiveSlate()}
              className="text-xs font-mono bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 px-2.5 py-1.5 rounded-lg transition active:scale-95"
            >
              ↻ Refresh Now
            </button>
            <div className="flex items-center gap-1.5">
              <label htmlFor="week-selector" className="text-xs text-zinc-400 font-semibold">Slate:</label>
              <select
                id="week-selector"
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(Number(e.target.value))}
                className="bg-zinc-900 border border-zinc-700 text-xs font-bold rounded-lg px-3 py-1.5 text-zinc-200 outline-none hover:border-zinc-500 cursor-pointer"
              >
                {Array.from({ length: 18 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>Week {i + 1}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-3 text-[11px] font-mono text-zinc-500 gap-1">
          <span>
            Algorithm:{" "}
            {selectedWeek === 1 ? (
              <strong className="text-zinc-300">Composite Power + Key Leverage Numbers (3, 7)</strong>
            ) : (
              <strong className="text-emerald-400">
                Dynamic Rolling Regression ({historicalGamesCount} Completed Games Factored)
              </strong>
            )}
          </span>
          <span>Last Updated: <strong className="text-zinc-300">{lastUpdated || "Connecting..."}</strong> (Sync #{syncCount})</span>
        </div>
      </header>

      {/* Nav Tabs */}
      <nav className="flex gap-2 p-1.5 bg-zinc-900/90 border border-zinc-800 rounded-xl mb-6">
        {(["SPREAD", "TOTALS", "MONEYLINE", "UPSET"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-lg transition ${
              activeTab === tab ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {tab === "SPREAD" ? "Spread (Pick'em)" : tab === "TOTALS" ? "Over / Under" : tab === "MONEYLINE" ? "Moneyline Value" : "Upset Radar"}
          </button>
        ))}
      </nav>

      {loading && games.length === 0 ? (
        <div className="py-24 text-center text-zinc-500 text-sm">
          <div className="inline-block w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p>Processing key number leverage & simulated score distributions...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* SPREAD TAB */}
          {activeTab === "SPREAD" &&
            spreadCards.map((c, i) => (
              <div key={c.id} className={`p-4 rounded-xl border bg-zinc-900/80 transition ${c.isTossUp ? "border-amber-500/40" : "border-zinc-800"}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-500 font-mono text-xs">#{i + 1}</span>
                    <span className="text-white font-bold text-sm">{c.awayTeam} @ {c.homeTeam}</span>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${badgeStyles[c.color]}`}>{c.tier}</span>
                </div>

                <div className="bg-zinc-950/60 border border-zinc-800/80 rounded px-2.5 py-1 text-[11px] font-mono text-zinc-400 mb-2 flex flex-col sm:flex-row justify-between gap-1">
                  <span className="text-zinc-200 font-semibold">{c.matchupHighlight}</span>
                  <span className="text-[10px] text-zinc-500">{c.awayRankSummary}</span>
                </div>

                {c.isLiveOrFinal && (
                  <div className="flex items-center justify-between text-xs font-mono bg-zinc-950/40 px-3 py-1.5 rounded mb-2 border border-zinc-800/60">
                    <span className="text-amber-400 font-bold">{c.gameStatusText}</span>
                    <span className="text-zinc-200">{c.awayAbbr} {c.awayScore} - {c.homeScore} {c.homeAbbr}</span>
                  </div>
                )}

                <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 mb-2.5 text-xs font-mono">
                  <span className="text-zinc-400 text-[11px] uppercase tracking-wider font-semibold">Predicted Final Score:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-100 font-bold">
                      {c.awayAbbr} {c.predictedAwayScore} - {c.predictedHomeScore} {c.homeAbbr}
                    </span>
                    <span className="text-zinc-500 text-[10px]">
                      ({c.predictedHomeScore > c.predictedAwayScore ? c.homeAbbr : c.awayAbbr} by {Math.abs(c.predictedHomeScore - c.predictedAwayScore)})
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-zinc-950/70 p-3.5 rounded-lg gap-3">
                  <div>
                    <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider block">Recommended Pool Pick</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-base font-black text-emerald-400">{c.teamPicked}</span>
                      <span className="text-sm font-mono font-bold bg-zinc-800 text-zinc-100 px-2 py-0.5 rounded border border-zinc-700">
                        {c.spreadString}
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                        c.isFavorite ? "bg-red-950/60 text-red-400 border border-red-800/50" : "bg-emerald-950/60 text-emerald-400 border border-emerald-800/50"
                      }`}>
                        {c.isFavorite ? "Favorite" : "Underdog"}
                      </span>
                    </div>
                    {c.isTossUp && <span className="text-[11px] text-amber-400/90 block mt-1">Toss-up play: Minimal statistical margin</span>}
                    {!c.isLiveOrFinal && <span className="text-[10px] text-zinc-500 block mt-1 font-mono">Kickoff: {c.gameStatusText}</span>}
                  </div>

                  <div className="flex gap-4 text-xs font-mono text-zinc-400 border-t sm:border-t-0 sm:border-l border-zinc-800 pt-2 sm:pt-0 sm:pl-4">
                    <div className="space-y-0.5">
                      <span className="text-zinc-500 block text-[10px] font-sans font-semibold">Vegas Consensus</span>
                      <span className="text-zinc-200 font-semibold block text-[11px]">
                        {c.homeAbbr}: {c.liveHomeSpread > 0 ? `+${c.liveHomeSpread}` : c.liveHomeSpread}
                      </span>
                      <span className="text-zinc-400 block text-[10px]">
                        {c.awayAbbr}: {c.liveAwaySpread > 0 ? `+${c.liveAwaySpread}` : c.liveAwaySpread}
                      </span>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-zinc-500 block text-[10px] font-sans font-semibold">Model Fair Line</span>
                      <span className="text-zinc-200 font-semibold block text-[11px]">
                        {c.homeAbbr}: {c.projectedHomeSpread > 0 ? `+${c.projectedHomeSpread}` : c.projectedHomeSpread}
                      </span>
                      <span className="text-zinc-400 block text-[10px]">
                        {c.awayAbbr}: {c.projectedAwaySpread > 0 ? `+${c.projectedAwaySpread}` : c.projectedAwaySpread}
                      </span>
                    </div>

                    <div className="pl-1">
                      <span className="text-zinc-500 block text-[10px] font-sans font-semibold">Pick Edge</span>
                      <span className="text-emerald-400 font-black block text-base leading-tight">+{c.edge}</span>
                      <span className="text-zinc-500 text-[9px] block">pts</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

          {/* OVER / UNDER TAB */}
          {activeTab === "TOTALS" &&
            totalsCards.map((c, i) => (
              <div key={c.id} className={`p-4 rounded-xl border bg-zinc-900/80 transition ${c.isTossUp ? "border-amber-500/40" : "border-zinc-800"}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-500 font-mono text-xs">#{i + 1}</span>
                    <span className="text-white font-bold text-sm">{c.awayTeam} @ {c.homeTeam}</span>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${badgeStyles[c.color]}`}>{c.tier}</span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-zinc-950/70 p-3.5 rounded-lg gap-3">
                  <div>
                    <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider block">Recommended Total Pick</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-base font-black ${c.pickType === "OVER" ? "text-emerald-400" : "text-blue-400"}`}>
                        {c.pickType} {c.marketTotal}
                      </span>
                      <span className="text-xs font-mono text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">
                        Model: {c.projectedTotal}
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-500 block mt-1 font-mono">
                      Projected Score: {c.awayAbbr} {c.predictedAwayScore} - {c.predictedHomeScore} {c.homeAbbr}
                    </span>
                  </div>

                  <div className="flex gap-4 text-xs font-mono text-zinc-400 border-t sm:border-t-0 sm:border-l border-zinc-800 pt-2 sm:pt-0 sm:pl-4">
                    <div>
                      <span className="text-zinc-500 block text-[10px] font-sans font-semibold">Vegas Total</span>
                      <span className="text-zinc-200 font-bold text-sm">{c.marketTotal}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[10px] font-sans font-semibold">Model Total</span>
                      <span className="text-zinc-200 font-bold text-sm">{c.projectedTotal}</span>
                    </div>
                    <div className="pl-1">
                      <span className="text-zinc-500 block text-[10px] font-sans font-semibold">Total Edge</span>
                      <span className="text-emerald-400 font-black text-base leading-tight">+{c.edge}</span>
                      <span className="text-zinc-500 text-[9px] block">pts</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

          {/* MONEYLINE TAB */}
          {activeTab === "MONEYLINE" &&
            moneylineCards.map((c, i) => (
              <div key={c.id} className={`p-4 rounded-xl border bg-zinc-900/80 ${c.isTossUp ? "border-amber-500/40" : "border-zinc-800"}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-500 font-mono text-xs">#{i + 1}</span>
                    <span className="text-white font-bold text-sm">{c.awayTeam} @ {c.homeTeam}</span>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${badgeStyles[c.color]}`}>{c.tier}</span>
                </div>

                <div className="bg-zinc-950/60 border border-zinc-800/80 rounded px-2.5 py-1 text-[11px] font-mono text-zinc-400 mb-2.5">
                  <span className="text-zinc-200 font-semibold">{c.matchupHighlight}</span>
                </div>

                <div className="flex items-center justify-between bg-zinc-950/70 p-3.5 rounded-lg">
                  <div>
                    <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider block">Best Value ML</span>
                    <span className="text-base font-black text-emerald-400 mt-0.5 block">{c.team} ({c.odds > 0 ? `+${c.odds}` : c.odds})</span>
                    <span className="text-[10px] text-zinc-500 font-mono block mt-0.5">Projected Score: {c.awayAbbr} {c.predictedAwayScore} - {c.predictedHomeScore} {c.homeAbbr}</span>
                  </div>
                  <div className="text-right font-mono text-xs">
                    <span className="text-zinc-300 block">Expected ROI: <strong className="text-emerald-400">+{c.evPct}%</strong></span>
                    <span className="text-zinc-500 text-[11px]">Fair Win Prob: {c.winProbPct}%</span>
                  </div>
                </div>
              </div>
            ))}

          {/* UPSET TAB */}
          {activeTab === "UPSET" &&
            upsetCards.map((c, i) => (
              <div key={c.id} className={`p-4 rounded-xl border bg-zinc-900/80 ${c.isTossUp ? "border-amber-500/40" : "border-zinc-800"}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-500 font-mono text-xs">#{i + 1}</span>
                    <span className="text-white font-bold text-sm">{c.awayTeam} @ {c.homeTeam}</span>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${badgeStyles[c.color]}`}>{c.tier}</span>
                </div>

                <div className="bg-zinc-950/60 border border-zinc-800/80 rounded px-2.5 py-1 text-[11px] font-mono text-zinc-400 mb-2.5">
                  <span className="text-zinc-200 font-semibold">{c.matchupHighlight}</span>
                </div>

                <div className="flex items-center justify-between bg-zinc-950/70 p-3.5 rounded-lg">
                  <div>
                    <span className="text-amber-500 text-[10px] uppercase font-bold tracking-wider block">Live Dog Candidate</span>
                    <span className="text-base font-black text-amber-400 mt-0.5 block">{c.dog} ({c.odds > 0 ? `+${c.odds}` : c.odds})</span>
                    <span className="text-[10px] text-zinc-500 font-mono block mt-0.5">Predicted Score: {c.awayAbbr} {c.predictedAwayScore} - {c.predictedHomeScore} {c.homeAbbr}</span>
                  </div>
                  <div className="text-right font-mono text-xs">
                    <span className="text-zinc-200 block font-bold">Win Prob: {c.winProbPct}%</span>
                    <span className="text-zinc-500 text-[11px]">ROI: +{c.evPct}% | Score: {c.score}</span>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}
    </main>
  );
}
