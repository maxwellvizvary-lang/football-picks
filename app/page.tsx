"use client";

import React, { useState } from "react";

interface SlateGame {
  id: string;
  homeTeam: string;
  awayTeam: string;
  tuesdayPoolSpread: number; // Half-point fixed line (-3.5 means home favored)
  liveMarketSpread: number;
  homeMoneyline: number;
  awayMoneyline: number;
  projectedSpread: number;  // From Phase 1 EPA & Power Rating Engine
}

const WEEK_1_GAMES: SlateGame[] = [
  { id: "1", awayTeam: "Jets", homeTeam: "Titans", tuesdayPoolSpread: -3.5, liveMarketSpread: -4.0, homeMoneyline: -180, awayMoneyline: +155, projectedSpread: -7.3 },
  { id: "2", awayTeam: "Bills", homeTeam: "Texans", tuesdayPoolSpread: 2.5, liveMarketSpread: 3.0, homeMoneyline: +120, awayMoneyline: -140, projectedSpread: 6.2 },
  { id: "3", awayTeam: "Ravens", homeTeam: "Chiefs", tuesdayPoolSpread: -3.0, liveMarketSpread: -3.0, homeMoneyline: -150, awayMoneyline: +130, projectedSpread: -4.4 },
  { id: "4", awayTeam: "Packers", homeTeam: "Eagles", tuesdayPoolSpread: -2.5, liveMarketSpread: -2.0, homeMoneyline: -135, awayMoneyline: +115, projectedSpread: -4.2 },
  { id: "5", awayTeam: "Jaguars", homeTeam: "Dolphins", tuesdayPoolSpread: -3.5, liveMarketSpread: -3.5, homeMoneyline: -175, awayMoneyline: +150, projectedSpread: -1.8 },
  { id: "6", awayTeam: "Steelers", homeTeam: "Falcons", tuesdayPoolSpread: -3.5, liveMarketSpread: -3.5, homeMoneyline: -180, awayMoneyline: +155, projectedSpread: -1.2 },
  { id: "7", awayTeam: "Cardinals", homeTeam: "Bills", tuesdayPoolSpread: -6.5, liveMarketSpread: -6.5, homeMoneyline: -280, awayMoneyline: +230, projectedSpread: -4.8 },
  { id: "8", awayTeam: "Vikings", homeTeam: "Giants", tuesdayPoolSpread: 1.5, liveMarketSpread: 1.5, homeMoneyline: +105, awayMoneyline: -125, projectedSpread: 0.8 },
  { id: "9", awayTeam: "Patriots", homeTeam: "Bengals", tuesdayPoolSpread: -8.5, liveMarketSpread: -8.5, homeMoneyline: -400, awayMoneyline: +320, projectedSpread: -6.1 },
  { id: "10", awayTeam: "Texans", homeTeam: "Colts", tuesdayPoolSpread: 2.5, liveMarketSpread: 3.0, homeMoneyline: +135, awayMoneyline: -160, projectedSpread: 4.8 },
  { id: "11", awayTeam: "Panthers", homeTeam: "Saints", tuesdayPoolSpread: -4.0, liveMarketSpread: -4.0, homeMoneyline: -200, awayMoneyline: +170, projectedSpread: -3.8 },
  { id: "12", awayTeam: "Raiders", homeTeam: "Chargers", tuesdayPoolSpread: -3.5, liveMarketSpread: -3.0, homeMoneyline: -165, awayMoneyline: +140, projectedSpread: -2.8 },
  { id: "13", awayTeam: "Broncos", homeTeam: "Seahawks", tuesdayPoolSpread: -5.5, liveMarketSpread: -6.0, homeMoneyline: -250, awayMoneyline: +205, projectedSpread: -4.9 },
  { id: "14", awayTeam: "Cowboys", homeTeam: "Browns", tuesdayPoolSpread: -2.5, liveMarketSpread: -2.5, homeMoneyline: -140, awayMoneyline: +120, projectedSpread: -2.2 },
  { id: "15", awayTeam: "Rams", homeTeam: "Lions", tuesdayPoolSpread: -3.5, liveMarketSpread: -4.5, homeMoneyline: -210, awayMoneyline: +175, projectedSpread: -3.7 },
  { id: "16", awayTeam: "Commanders", homeTeam: "Buccaneers", tuesdayPoolSpread: -3.5, liveMarketSpread: -3.5, homeMoneyline: -180, awayMoneyline: +150, projectedSpread: -3.6 }
];

function spreadToWinProbability(spread: number): number {
  return 1 / (1 + Math.pow(10, spread / 14.5));
}

function calculateEV(winProb: number, odds: number): number {
  const profit = odds > 0 ? odds : 100 / (Math.abs(odds) / 100);
  const ev = (winProb * profit) - ((1 - winProb) * 100);
  return Number((ev / 100).toFixed(3));
}

function classifyTier(type: "SPREAD" | "MONEYLINE" | "UPSET", val: number) {
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
}

export default function App() {
  const [activeTab, setActiveTab] = useState<"SPREAD" | "MONEYLINE" | "UPSET">("SPREAD");

  const spreadCards = WEEK_1_GAMES.map((g) => {
    const spreadDiff = g.tuesdayPoolSpread - g.projectedSpread;
    const isHome = spreadDiff >= 0;
    const teamPicked = isHome ? g.homeTeam : g.awayTeam;
    const linePicked = isHome
      ? (g.tuesdayPoolSpread > 0 ? `+${g.tuesdayPoolSpread}` : `${g.tuesdayPoolSpread}`)
      : (-g.tuesdayPoolSpread > 0 ? `+${-g.tuesdayPoolSpread}` : `${-g.tuesdayPoolSpread}`);
    const edge = Number(Math.abs(spreadDiff).toFixed(1));
    const meta = classifyTier("SPREAD", edge);
    return { ...g, teamPicked, linePicked, edge, ...meta };
  }).sort((a, b) => b.edge - a.edge);

  const moneylineCards = WEEK_1_GAMES.map((g) => {
    const homeProb = spreadToWinProbability(g.projectedSpread);
    const awayProb = 1 - homeProb;
    const homeEV = calculateEV(homeProb, g.homeMoneyline);
    const awayEV = calculateEV(awayProb, g.awayMoneyline);
    const isHome = homeEV >= awayEV;
    const team = isHome ? g.homeTeam : g.awayTeam;
    const odds = isHome ? g.homeMoneyline : g.awayMoneyline;
    const evPct = Number(((isHome ? homeEV : awayEV) * 100).toFixed(1));
    const winProbPct = Number(((isHome ? homeProb : awayProb) * 100).toFixed(1));
    const meta = classifyTier("MONEYLINE", evPct);
    return { ...g, team, odds, evPct, winProbPct, ...meta };
  }).sort((a, b) => b.evPct - a.evPct);

  const upsetCards = WEEK_1_GAMES.map((g) => {
    const isAwayDog = g.awayMoneyline > g.homeMoneyline;
    const dog = isAwayDog ? g.awayTeam : g.homeTeam;
    const odds = isAwayDog ? g.awayMoneyline : g.homeMoneyline;
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
      <header className="flex items-center justify-between border-b border-zinc-800 pb-5 mb-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">GridironPicks</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Pick'em Engine & Market Value Radar</p>
        </div>
        <span className="text-xs font-mono font-semibold bg-zinc-900 border border-zinc-700 px-3 py-1.5 rounded-lg text-zinc-300">
          Week 1 Slate
        </span>
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

      <div className="space-y-3">
        {activeTab === "SPREAD" &&
          spreadCards.map((c, i) => (
            <div key={c.id} className={`p-4 rounded-xl border bg-zinc-900/80 transition ${c.isTossUp ? "border-amber-500/40" : "border-zinc-800"}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-zinc-500 font-mono text-xs">#{i + 1}</span>
                  <span className="text-white font-semibold text-sm">{c.awayTeam} @ {c.homeTeam}</span>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${badgeStyles[c.color]}`}>{c.tier}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-zinc-950/70 p-3 rounded-lg gap-2">
                <div>
                  <span className="text-zinc-500 text-[11px] uppercase font-bold tracking-wider block">Recommended Pick</span>
                  <span className="text-base font-black text-emerald-400">{c.teamPicked} {c.linePicked}</span>
                  {c.isTossUp && <span className="text-[11px] text-amber-400/90 block mt-0.5">Dead heat — pick your gut favorite</span>}
                </div>
                <div className="flex gap-4 text-xs font-mono text-zinc-400 border-t sm:border-t-0 sm:border-l border-zinc-800 pt-2 sm:pt-0 sm:pl-4">
                  <div><span className="text-zinc-500 block text-[10px]">Tuesday Pool</span><span className="text-zinc-200 font-bold">{c.tuesdayPoolSpread > 0 ? `+${c.tuesdayPoolSpread}` : c.tuesdayPoolSpread}</span></div>
                  <div><span className="text-zinc-500 block text-[10px]">Model Line</span><span className="text-zinc-200 font-bold">{c.projectedSpread > 0 ? `+${c.projectedSpread}` : c.projectedSpread}</span></div>
                  <div><span className="text-zinc-500 block text-[10px]">Edge</span><span className="text-emerald-400 font-bold">+{c.edge} pts</span></div>
                </div>
              </div>
            </div>
          ))}

        {activeTab === "MONEYLINE" &&
          moneylineCards.map((c, i) => (
            <div key={c.id} className={`p-4 rounded-xl border bg-zinc-900/80 ${c.isTossUp ? "border-amber-500/40" : "border-zinc-800"}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-zinc-500 font-mono text-xs">#{i + 1}</span>
                  <span className="text-white font-semibold text-sm">{c.awayTeam} @ {c.homeTeam}</span>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${badgeStyles[c.color]}`}>{c.tier}</span>
              </div>
              <div className="flex items-center justify-between bg-zinc-950/70 p-3 rounded-lg">
                <div>
                  <span className="text-zinc-500 text-[11px] uppercase font-bold tracking-wider block">Best Value ML</span>
                  <span className="text-base font-black text-emerald-400">{c.team} ({c.odds > 0 ? `+${c.odds}` : c.odds})</span>
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
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-zinc-500 font-mono text-xs">#{i + 1}</span>
                  <span className="text-white font-semibold text-sm">{c.awayTeam} @ {c.homeTeam}</span>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${badgeStyles[c.color]}`}>{c.tier}</span>
              </div>
              <div className="flex items-center justify-between bg-zinc-950/70 p-3 rounded-lg">
                <div>
                  <span className="text-amber-500 text-[11px] uppercase font-bold tracking-wider block">Live Dog Candidate</span>
                  <span className="text-base font-black text-amber-400">{c.dog} ({c.odds > 0 ? `+${c.odds}` : c.odds})</span>
                </div>
                <div className="text-right font-mono text-xs">
                  <span className="text-zinc-200 block font-bold">Win Prob: {c.winProbPct}%</span>
                  <span className="text-zinc-500 text-[11px]">EV: +{c.evPct}% | Score: {c.score}</span>
                </div>
              </div>
            </div>
          ))}
      </div>
    </main>
  );
}
