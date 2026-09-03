"use client";

import React, { useState, useEffect, useCallback } from "react";

interface TeamUnits {
  passOff: number; // Positive = better than avg
  rushOff: number;
  passDef: number; // Positive = better defense (allows less)
  rushDef: number;
  overall: number;
}

// Initial anchor ratings for all 32 teams
const INITIAL_UNIT_RATINGS: Record<string, TeamUnits> = {
  KC:  { passOff: 2.6, rushOff: 0.8, passDef: 1.5, rushDef: 0.6, overall: 5.5 },
  SF:  { passOff: 2.2, rushOff: 2.0, passDef: 1.2, rushDef: 1.0, overall: 5.2 },
  BAL: { passOff: 1.5, rushOff: 2.5, passDef: 1.2, rushDef: 1.0, overall: 4.8 },
  DET: { passOff: 2.0, rushOff: 1.8, passDef: 0.4, rushDef: 1.1, overall: 4.5 },
  BUF: { passOff: 2.1, rushOff: 1.2, passDef: 0.8, rushDef: 0.5, overall: 4.2 },
  PHI: { passOff: 1.4, rushOff: 1.9, passDef: 0.5, rushDef: 0.8, overall: 4.0 },
  CIN: { passOff: 2.4, rushOff: 0.2, passDef: 0.6, rushDef: 0.3, overall: 3.5 },
  HOU: { passOff: 2.0, rushOff: 0.4, passDef: 0.8, rushDef: 0.5, overall: 3.2 },
  GB:  { passOff: 1.8, rushOff: 0.8, passDef: 0.4, rushDef: 0.2, overall: 2.8 },
  DAL: { passOff: 1.7, rushOff: 0.3, passDef: 0.8, rushDef: -0.2, overall: 2.5 },
  MIA: { passOff: 2.1, rushOff: 0.8, passDef: 0.2, rushDef: -0.5, overall: 2.2 },
  LAR: { passOff: 1.6, rushOff: 0.7, passDef: 0.1, rushDef: -0.2, overall: 2.0 },
  NYJ: { passOff: 0.8, rushOff: 0.6, passDef: 1.6, rushDef: 0.4, overall: 1.8 },
  CLE: { passOff: 0.2, rushOff: 0.7, passDef: 1.4, rushDef: 0.6, overall: 1.2 },
  TB:  { passOff: 1.2, rushOff: -0.4, passDef: 0.2, rushDef: 0.8, overall: 0.8 },
  ATL: { passOff: 0.8, rushOff: 1.1, passDef: -0.3, rushDef: -0.2, overall: 0.5 },
  PIT: { passOff: 0.0, rushOff: 0.6, passDef: 0.8, rushDef: 0.4, overall: 0.2 },
  SEA: { passOff: 0.9, rushOff: 0.2, passDef: -0.5, rushDef: -0.4, overall: -0.2 },
  JAX: { passOff: 0.7, rushOff: 0.1, passDef: -0.6, rushDef: -0.3, overall: -0.5 },
  CHI: { passOff: 0.3, rushOff: 0.6, passDef: 0.2, rushDef: -0.6, overall: -0.8 },
  IND: { passOff: 0.4, rushOff: 0.8, passDef: -0.8, rushDef: -0.4, overall: -1.0 },
  LAC: { passOff: 0.8, rushOff: 0.2, passDef: -0.6, rushDef: -0.6, overall: -1.2 },
  NO:  { passOff: 0.2, rushOff: 0.1, passDef: 0.4, rushDef: -0.9, overall: -1.8 },
  MIN: { passOff: 0.8, rushOff: -0.6, passDef: 0.2, rushDef: -0.8, overall: -2.0 },
  LV:  { passOff: -0.2, rushOff: 0.0, passDef: 0.3, rushDef: -0.8, overall: -2.5 },
  ARI: { passOff: 0.3, rushOff: 0.8, passDef: -1.4, rushDef: -1.2, overall: -3.0 },
  WAS: { passOff: 0.2, rushOff: 0.5, passDef: -1.5, rushDef: -1.0, overall: -3.2 },
  NYG: { passOff: -0.8, rushOff: 0.2, passDef: 0.0, rushDef: -1.2, overall: -3.8 },
  TEN: { passOff: -0.5, rushOff: 0.3, passDef: -0.8, rushDef: 0.2, overall: -4.0 },
  DEN: { passOff: -0.6, rushOff: -0.2, passDef: 0.1, rushDef: -1.3, overall: -4.2 },
  NE:  { passOff: -1.2, rushOff: 0.2, passDef: 0.5, rushDef: 0.1, overall: -4.8 },
  CAR: { passOff: -1.4, rushOff: -0.5, passDef: -0.8, rushDef: -1.5, overall: -5.2 }
};

const HOME_FIELD_ADVANTAGE = 1.75;
const K_LEARNING_RATE = 0.14;

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
  liveSpread: number;
  homeML: number;
  awayML: number;
  projectedSpread: number;
  matchupHighlight: string;
  awayRankSummary: string;
  homeRankSummary: string;
}

export default function GridironDashboard() {
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [activeTab, setActiveTab] = useState<"SPREAD" | "MONEYLINE" | "UPSET">("SPREAD");
  const [games, setGames] = useState<GameDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [syncCount, setSyncCount] = useState<number>(0);
  const [historicalGamesCount, setHistoricalGamesCount] = useState<number>(0);

  const fetchLiveSlate = useCallback(async () => {
    setLoading(true);
    try {
      // Clone unit baseline ratings
      const currentRatings: Record<string, TeamUnits> = {};
      Object.keys(INITIAL_UNIT_RATINGS).forEach((abbr) => {
        currentRatings[abbr] = { ...INITIAL_UNIT_RATINGS[abbr] };
      });

      let totalHistory = 0;

      // Dynamically replay prior weeks to evolve team units & rankings
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
              const homeAbbr = home?.team?.abbreviation;
              const awayAbbr = away?.team?.abbreviation;
              const homeScore = Number(home?.score || 0);
              const awayScore = Number(away?.score || 0);

              if (homeAbbr && awayAbbr && currentRatings[homeAbbr] && currentRatings[awayAbbr]) {
                totalHistory++;
                const actualMargin = homeScore - awayScore;
                const expectedMargin = (currentRatings[homeAbbr].overall - currentRatings[awayAbbr].overall) + HOME_FIELD_ADVANTAGE;
                const clampedDelta = Math.max(-14, Math.min(14, actualMargin - expectedMargin)) * K_LEARNING_RATE;

                // Update overall ratings
                currentRatings[homeAbbr].overall = Number((currentRatings[homeAbbr].overall + clampedDelta).toFixed(2));
                currentRatings[awayAbbr].overall = Number((currentRatings[awayAbbr].overall - clampedDelta).toFixed(2));

                // Adjust offensive/defensive sub-units based on game flow
                if (homeScore > 27) {
                  currentRatings[homeAbbr].passOff += 0.12;
                  currentRatings[awayAbbr].passDef -= 0.12;
                } else if (homeScore < 14) {
                  currentRatings[homeAbbr].passOff -= 0.12;
                  currentRatings[awayAbbr].passDef += 0.12;
                }

                if (awayScore > 27) {
                  currentRatings[awayAbbr].passOff += 0.12;
                  currentRatings[homeAbbr].passDef -= 0.12;
                } else if (awayScore < 14) {
                  currentRatings[awayAbbr].passOff -= 0.12;
                  currentRatings[homeAbbr].passDef += 0.12;
                }
              }
            }
          });
        });
      }

      setHistoricalGamesCount(totalHistory);

      // Compute current 1-32 league rankings for each unit
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

      // Fetch active week scoreboard
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

        const homeAbbr = home?.team?.abbreviation || "HOU";
        const awayAbbr = away?.team?.abbreviation || "IND";

        const oddsData = comp?.odds?.[0];
        let liveSpread = -3.5;
        let homeML = -160;
        let awayML = +140;

        const homeUnits = currentRatings[homeAbbr] || { passOff: 0, rushOff: 0, passDef: 0, rushDef: 0, overall: 0 };
        const awayUnits = currentRatings[awayAbbr] || { passOff: 0, rushOff: 0, passDef: 0, rushDef: 0, overall: 0 };

        // Matchup Unit Clashes
        // Clash 1: Away Pass Offense vs Home Pass Defense
        const awayPassClash = awayUnits.passOff - homeUnits.passDef;
        // Clash 2: Away Rush Offense vs Home Rush Defense
        const awayRushClash = awayUnits.rushOff - homeUnits.rushDef;
        // Clash 3: Home Pass Offense vs Away Pass Defense
        const homePassClash = homeUnits.passOff - awayUnits.passDef;
        // Clash 4: Home Rush Offense vs Away Rush Defense
        const homeRushClash = homeUnits.rushOff - awayUnits.rushDef;

        // Net matchup clash edge (Positive = tilts towards Away, Negative = tilts towards Home)
        const netMatchupClash = (awayPassClash + awayRushClash) - (homePassClash + homeRushClash);

        // Determine matchup highlight note
        let matchupHighlight = "Balanced unit matchup across both sides.";
        if (homeUnits.rushOff - awayUnits.rushDef >= 1.2) {
          matchupHighlight = `🔥 Run Edge: ${home?.team?.displayName} Rush O (#${rushOffRanks[homeAbbr] || 16}) vs ${away?.team?.displayName} Run D (#${rushDefRanks[awayAbbr] || 16})`;
        } else if (awayUnits.rushOff - homeUnits.rushDef >= 1.2) {
          matchupHighlight = `🔥 Run Edge: ${away?.team?.displayName} Rush O (#${rushOffRanks[awayAbbr] || 16}) vs ${home?.team?.displayName} Run D (#${rushDefRanks[homeAbbr] || 16})`;
        } else if (homeUnits.passOff - awayUnits.passDef >= 1.4) {
          matchupHighlight = `⚡ Air Edge: ${home?.team?.displayName} Pass O (#${passOffRanks[homeAbbr] || 16}) vs ${away?.team?.displayName} Secondary (#${passDefRanks[awayAbbr] || 16})`;
        } else if (awayUnits.passOff - homeUnits.passDef >= 1.4) {
          matchupHighlight = `⚡ Air Edge: ${away?.team?.displayName} Pass O (#${passOffRanks[awayAbbr] || 16}) vs ${home?.team?.displayName} Secondary (#${passDefRanks[homeAbbr] || 16})`;
        }

        // Projected Spread = Baseline power diff - HFA + Matchup clash tilt
        const baseProjected = (awayUnits.overall - homeUnits.overall) - HOME_FIELD_ADVANTAGE;
        const projectedSpread = Number((baseProjected + (netMatchupClash * 0.45)).toFixed(1));

        if (oddsData?.spread !== undefined) {
          liveSpread = Number(oddsData.spread);
        } else {
          liveSpread = Number((Math.round(baseProjected * 2) / 2).toFixed(1));
          if (liveSpread % 1 === 0) liveSpread -= 0.5;
        }

        if (oddsData?.moneyline?.home?.odds) {
          homeML = oddsData.moneyline.home.odds;
          awayML = oddsData.moneyline.away.odds;
        } else {
          homeML = liveSpread < 0 ? -110 + Math.round(liveSpread * 25) : 100 + Math.round(liveSpread * 25);
          awayML = liveSpread < 0 ? 100 + Math.round(Math.abs(liveSpread) * 22) : -110 - Math.round(liveSpread * 22);
        }

        return {
          id: ev.id,
          matchup: `${away?.team?.displayName} @ ${home?.team?.displayName}`,
          awayTeam: away?.team?.displayName || awayAbbr,
          homeTeam: home?.team?.displayName || homeAbbr,
          awayAbbr,
          homeAbbr,
          awayScore: away?.score,
          homeScore: home?.score,
          gameStatusText: statusDetail,
          isLiveOrFinal: statusType === "STATUS_IN_PROGRESS" || statusType === "STATUS_FINAL",
          liveSpread,
          homeML,
          awayML,
          projectedSpread,
          matchupHighlight,
          awayRankSummary: `Pass O: #${passOffRanks[awayAbbr] || 16} | Rush O: #${rushOffRanks[awayAbbr] || 16}`,
          homeRankSummary: `Pass D: #${passDefRanks[homeAbbr] || 16} | Rush D: #${rushDefRanks[homeAbbr] || 16}`
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

  const classifyTier = (type: "SPREAD" | "MONEYLINE" | "UPSET", val: number) => {
    if (type === "SPREAD") {
      if (val >= 2.5) return { tier: "Lock (3★)", color: "emerald", isTossUp: false };
      if (val >= 1.0) return { tier: "Value Lean (2★)", color: "blue", isTossUp: false };
      if (val >= 0.5) return { tier: "Slight Lean (1★)", color: "zinc", isTossUp: false };
      return { tier: "Toss-Up (50/50)", color: "amber", isTossUp: true };
    }
    if (type === "MONEYLINE") {
      if (val >= 8.0) return { tier: "Lock (3★)", color: "emerald", isTossUp: false };
      if (val >= 4.0) return { tier: "Value Lean (2★)", color: "blue", isTossUp: false };
      if (val >= 1.5) return { tier: "Slight Lean (1★)", color: "zinc", isTossUp: false };
      return { tier: "Toss-Up (50/50)", color: "amber", isTossUp: true };
    }
    if (val >= 35.0) return { tier: "Lock (3★)", color: "emerald", isTossUp: false };
    if (val >= 25.0) return { tier: "Value Lean (2★)", color: "blue", isTossUp: false };
    if (val >= 18.0) return { tier: "Slight Lean (1★)", color: "zinc", isTossUp: false };
    return { tier: "Toss-Up (50/50)", color: "amber", isTossUp: true };
  };

  // 1. SPREAD RANKINGS
  const spreadCards = games.map((g) => {
    const diff = g.liveSpread - g.projectedSpread;
    const isHome = diff >= 0;
    const teamPicked = isHome ? g.homeTeam : g.awayTeam;
    const linePicked = isHome
      ? (g.liveSpread > 0 ? `+${g.liveSpread}` : `${g.liveSpread}`)
      : (-g.liveSpread > 0 ? `+${-g.liveSpread}` : `${-g.liveSpread}`);
    const edge = Number(Math.abs(diff).toFixed(1));
    const meta = classifyTier("SPREAD", edge);
    return { ...g, teamPicked, linePicked, edge, ...meta };
  }).sort((a, b) => b.edge - a.edge);

  // 2. MONEYLINE VALUE RANKINGS
  const moneylineCards = games.map((g) => {
    const homeProb = spreadToWinProbability(g.projectedSpread);
    const awayProb = 1 - homeProb;
    const homeEV = calculateEV(homeProb, g.homeML);
    const awayEV = calculateEV(awayProb, g.awayML);
    const isHome = homeEV >= awayEV;
    const team = isHome ? g.homeTeam : g.awayTeam;
    const odds = isHome ? g.homeML : g.awayML;
    const evPct = Number(((isHome ? homeEV : awayEV) * 100).toFixed(1));
    const winProbPct = Number(((isHome ? homeProb : awayProb) * 100).toFixed(1));
    const meta = classifyTier("MONEYLINE", evPct);
    return { ...g, team, odds, evPct, winProbPct, ...meta };
  }).sort((a, b) => b.evPct - a.evPct);

  // 3. UPSET RADAR RANKINGS
  const upsetCards = games.map((g) => {
    const isAwayDog = g.awayML > g.homeML;
    const dog = isAwayDog ? g.awayTeam : g.homeTeam;
    const odds = isAwayDog ? g.awayML : g.homeML;
    const winProb = isAwayDog ? (1 - spreadToWinProbability(g.projectedSpread)) : spreadToWinProbability(g.projectedSpread);
    const ev = calculateEV(winProb, odds);
    const score = Number(((winProb * 50) + (Math.max(ev, 0) * 50)).toFixed(1));
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
            <p className="text-xs text-zinc-500 mt-0.5">Unit Matchup Engine & Live Pick'em Radar</p>
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
            Model:{" "}
            {selectedWeek === 1 ? (
              <strong className="text-zinc-300">Unit Positional Anchors (1-32 Rankings Active)</strong>
            ) : (
              <strong className="text-emerald-400">
                Dynamic Rolling Clashes ({historicalGamesCount} Completed Games Factored)
              </strong>
            )}
          </span>
          <span>Last Updated: <strong className="text-zinc-300">{lastUpdated || "Connecting..."}</strong> (Sync #{syncCount})</span>
        </div>
      </header>

      <nav className="flex gap-2 p-1.5 bg-zinc-900/90 border border-zinc-800 rounded-xl mb-6">
        {(["SPREAD", "MONEYLINE", "UPSET"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-lg transition ${
              activeTab === tab ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {tab === "SPREAD" ? "Spread (Pick'em)" : tab === "MONEYLINE" ? "Moneyline Value" : "Upset Radar"}
          </button>
        ))}
      </nav>

      {loading && games.length === 0 ? (
        <div className="py-24 text-center text-zinc-500 text-sm">
          <div className="inline-block w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p>Processing 1-32 unit rankings & calculating matchup edges...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activeTab === "SPREAD" &&
            spreadCards.map((c, i) => (
              <div key={c.id} className={`p-4 rounded-xl border bg-zinc-900/80 transition ${c.isTossUp ? "border-amber-500/40" : "border-zinc-800"}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-500 font-mono text-xs">#{i + 1}</span>
                    <span className="text-white font-semibold text-sm">{c.matchup}</span>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${badgeStyles[c.color]}`}>{c.tier}</span>
                </div>

                {/* Matchup Unit Advantage Highlight */}
                <div className="bg-zinc-950/40 border border-zinc-800/60 rounded px-2.5 py-1 text-[11px] font-mono text-zinc-400 mb-2.5 flex flex-col sm:flex-row justify-between gap-1">
                  <span className="text-zinc-300 font-semibold">{c.matchupHighlight}</span>
                  <span className="text-[10px] text-zinc-500">{c.awayRankSummary}</span>
                </div>

                {c.isLiveOrFinal && (
                  <div className="flex items-center justify-between text-xs font-mono bg-zinc-950/40 px-3 py-1.5 rounded mb-2 border border-zinc-800/60">
                    <span className="text-amber-400 font-bold">{c.gameStatusText}</span>
                    <span className="text-zinc-200">{c.awayAbbr} {c.awayScore} - {c.homeScore} {c.homeAbbr}</span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-zinc-950/70 p-3 rounded-lg gap-2">
                  <div>
                    <span className="text-zinc-500 text-[11px] uppercase font-bold tracking-wider block">Recommended Pick</span>
                    <span className="text-base font-black text-emerald-400">{c.teamPicked} {c.linePicked}</span>
                    {c.isTossUp && <span className="text-[11px] text-amber-400/90 block mt-0.5">Dead heat — pick your gut favorite</span>}
                    {!c.isLiveOrFinal && <span className="text-[10px] text-zinc-500 block mt-0.5 font-mono">Kickoff: {c.gameStatusText}</span>}
                  </div>
                  <div className="flex gap-4 text-xs font-mono text-zinc-400 border-t sm:border-t-0 sm:border-l border-zinc-800 pt-2 sm:pt-0 sm:pl-4">
                    <div><span className="text-zinc-500 block text-[10px]">Live Line</span><span className="text-zinc-200 font-bold">{c.liveSpread > 0 ? `+${c.liveSpread}` : c.liveSpread}</span></div>
                    <div><span className="text-zinc-500 block text-[10px]">Model Line</span><span className="text-zinc-200 font-bold">{c.projectedSpread > 0 ? `+${c.projectedSpread}` : c.projectedSpread}</span></div>
                    <div><span className="text-zinc-500 block text-[10px]">Edge</span><span className="text-emerald-400 font-bold">+{c.edge} pts</span></div>
                  </div>
                </div>
              </div>
            ))}

          {activeTab === "MONEYLINE" &&
            moneylineCards.map((c, i) => (
              <div key={c.id} className={`p-4 rounded-xl border bg-zinc-900/80 ${c.isTossUp ? "border-amber-500/40" : "border-zinc-800"}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-500 font-mono text-xs">#{i + 1}</span>
                    <span className="text-white font-semibold text-sm">{c.matchup}</span>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${badgeStyles[c.color]}`}>{c.tier}</span>
                </div>

                <div className="bg-zinc-950/40 border border-zinc-800/60 rounded px-2.5 py-1 text-[11px] font-mono text-zinc-400 mb-2.5">
                  <span>{c.matchupHighlight}</span>
                </div>

                <div className="flex items-center justify-between bg-zinc-950/70 p-3 rounded-lg">
                  <div>
                    <span className="text-zinc-500 text-[11px] uppercase font-bold tracking-wider block">Best Value ML</span>
                    <span className="text-base font-black text-emerald-400">{c.team} ({c.odds > 0 ? `+${c.odds}` : c.odds})</span>
                    <span className="text-[10px] text-zinc-500 font-mono block mt-0.5">{c.gameStatusText}</span>
                  </div>
                  <div className="text-right font-mono text-xs">
                    <span className="text-zinc-300 block">ROI: <strong className="text-emerald-400">+{c.evPct}%</strong></span>
                    <span className="text-zinc-500 text-[11px]">Win Prob: {c.winProbPct}%</span>
                  </div>
                </div>
              </div>
            ))}

          {activeTab === "UPSET" &&
            upsetCards.map((c, i) => (
              <div key={c.id} className={`p-4 rounded-xl border bg-zinc-900/80 ${c.isTossUp ? "border-amber-500/40" : "border-zinc-800"}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-500 font-mono text-xs">#{i + 1}</span>
                    <span className="text-white font-semibold text-sm">{c.matchup}</span>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${badgeStyles[c.color]}`}>{c.tier}</span>
                </div>

                <div className="bg-zinc-950/40 border border-zinc-800/60 rounded px-2.5 py-1 text-[11px] font-mono text-zinc-400 mb-2.5">
                  <span>{c.matchupHighlight}</span>
                </div>

                <div className="flex items-center justify-between bg-zinc-950/70 p-3 rounded-lg">
                  <div>
                    <span className="text-amber-500 text-[11px] uppercase font-bold tracking-wider block">Live Dog Candidate</span>
                    <span className="text-base font-black text-amber-400">{c.dog} ({c.odds > 0 ? `+${c.odds}` : c.odds})</span>
                    <span className="text-[10px] text-zinc-500 font-mono block mt-0.5">{c.gameStatusText}</span>
                  </div>
                  <div className="text-right font-mono text-xs">
                    <span className="text-zinc-200 block font-bold">Win Prob: {c.winProbPct}%</span>
                    <span className="text-zinc-500 text-[11px]">EV: +{c.evPct}% | Score: {c.score}</span>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}
    </main>
  );
}
