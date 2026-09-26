import React, { useState } from 'react';
import { Trade, TickerData } from '../types/trading';
import { Play, Pause, AlertOctagon, CheckCircle2, Radio, DollarSign, Activity, Zap } from 'lucide-react';

interface LiveBotPanelProps {
  isBotActive: boolean;
  onToggleBot: () => void;
  activePosition: Trade | null;
  ticker: TickerData | null;
  onClosePosition: () => void;
  botLogs: { time: number; text: string; type: 'info' | 'trade' | 'warn' }[];
}

export const LiveBotPanel: React.FC<LiveBotPanelProps> = ({
  isBotActive,
  onToggleBot,
  activePosition,
  ticker,
  onClosePosition,
  botLogs,
}) => {
  const [tradingMode, setTradingMode] = useState<'PAPER' | 'TESTNET' | 'LIVE'>('PAPER');

  // Calculate live unrealized PnL
  let unrealizedPnl = 0;
  let unrealizedPnlPct = 0;

  if (activePosition && ticker) {
    const isLong = activePosition.direction === 'LONG';
    const currentPrice = ticker.lastPrice;
    const diff = isLong ? currentPrice - activePosition.entryPrice : activePosition.entryPrice - currentPrice;
    unrealizedPnl = diff * activePosition.contracts;
    unrealizedPnlPct = (unrealizedPnl / activePosition.size) * 100;
  }

  return (
    <div className="flex flex-col h-full bg-[#0b0f17] border border-slate-800 rounded-lg overflow-hidden">
      {/* Panel Top Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#0f172a] border-b border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-slate-200">Laya Auto-Execution Engine</span>
          <span className="text-slate-500">·</span>
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                isBotActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
              }`}
            />
            <span className={isBotActive ? 'text-emerald-400 font-semibold' : 'text-slate-400'}>
              {isBotActive ? 'BOT RUNNING' : 'BOT STANDBY'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode Selector */}
          <div className="flex items-center gap-1 bg-slate-900 px-1 py-0.5 rounded border border-slate-800 text-[11px]">
            <button
              onClick={() => setTradingMode('PAPER')}
              className={`px-2 py-0.5 rounded transition-colors ${
                tradingMode === 'PAPER' ? 'bg-amber-500/20 text-amber-300 font-medium' : 'text-slate-400'
              }`}
            >
              Paper Bybit
            </button>
            <button
              onClick={() => setTradingMode('TESTNET')}
              className={`px-2 py-0.5 rounded transition-colors ${
                tradingMode === 'TESTNET' ? 'bg-cyan-500/20 text-cyan-300 font-medium' : 'text-slate-400'
              }`}
            >
              Testnet
            </button>
            <button
              onClick={() => setTradingMode('LIVE')}
              className={`px-2 py-0.5 rounded transition-colors ${
                tradingMode === 'LIVE' ? 'bg-rose-500/20 text-rose-300 font-medium' : 'text-slate-400'
              }`}
            >
              Live Real
            </button>
          </div>

          <button
            onClick={onToggleBot}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold shadow transition-all cursor-pointer ${
              isBotActive
                ? 'bg-rose-600 hover:bg-rose-500 text-white'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {isBotActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isBotActive ? 'Pause Bot' : 'Start Auto-Trading'}</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-slate-800/80 flex-1 overflow-hidden">
        {/* Active Position Card */}
        <div className="bg-[#0b0f17] p-3 flex flex-col justify-between overflow-y-auto">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-semibold text-slate-300 uppercase tracking-wider text-[11px]">
                Active Gold Position
              </span>
              {activePosition ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-950 text-emerald-300 border border-emerald-700/60">
                  {activePosition.direction} {activePosition.contracts} OZ
                </span>
              ) : (
                <span className="text-slate-500 text-[11px]">No Open Position</span>
              )}
            </div>

            {activePosition && ticker ? (
              <div className="space-y-3 font-mono">
                <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase">Unrealized PnL</div>
                      <div
                        className={`text-xl font-bold mt-0.5 ${
                          unrealizedPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {unrealizedPnl >= 0 ? '+' : ''}${unrealizedPnl.toFixed(2)}
                        <span className="text-xs ml-1 font-normal opacity-90">
                          ({unrealizedPnlPct >= 0 ? '+' : ''}{unrealizedPnlPct.toFixed(2)}%)
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-slate-500 uppercase">Live Gold Price</div>
                      <div className="text-base font-bold text-amber-400">
                        ${ticker.lastPrice.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-800 text-[11px]">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Entry Price</span>
                      <span className="text-slate-200 font-semibold">${activePosition.entryPrice.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Position Size</span>
                      <span className="text-slate-200 font-semibold">${activePosition.size.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Gold Contracts</span>
                      <span className="text-slate-200 font-semibold">{activePosition.contracts} oz</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={onClosePosition}
                    className="w-full py-1.5 px-3 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800/80 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <AlertOctagon className="w-3.5 h-3.5" />
                    <span>Emergency Market Close</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-900/40 border border-dashed border-slate-800 rounded-lg text-center text-xs text-slate-500 space-y-1">
                <Radio className="w-5 h-5 mx-auto text-slate-600 mb-1" />
                <p>Bot is actively scanning Bybit XAUUSDT orderbook &amp; candles.</p>
                <p className="text-[11px] text-slate-600">
                  When RSI crosses MA and confirms BB band momentum, entry will trigger automatically.
                </p>
              </div>
            )}
          </div>

          <div className="pt-2 text-[10px] text-slate-500 flex items-center justify-between border-t border-slate-800/60 mt-2">
            <span>Bybit VIP Taker Fee: 0.06%</span>
            <span>Zero Lookahead Protection: ENABLED</span>
          </div>
        </div>

        {/* Live Execution Stream / Bot Log */}
        <div className="bg-[#0b0f17] p-3 flex flex-col justify-between overflow-hidden">
          <div className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Real-Time Execution Log
            </span>
            <span className="text-[10px] text-slate-500 font-normal">Auto-Scroll</span>
          </div>

          <div className="flex-1 bg-slate-950/80 border border-slate-800 rounded-lg p-2.5 font-mono text-[11px] overflow-y-auto space-y-1.5 text-slate-400">
            {botLogs.length === 0 ? (
              <div className="text-slate-600 text-center py-6">Awaiting incoming market events...</div>
            ) : (
              botLogs.slice(-25).map((log, idx) => (
                <div key={idx} className="flex items-start gap-2 leading-relaxed">
                  <span className="text-slate-600 select-none text-[10px]">
                    {new Date(log.time).toLocaleTimeString()}
                  </span>
                  <span
                    className={`flex-1 ${
                      log.type === 'trade'
                        ? 'text-emerald-400 font-semibold'
                        : log.type === 'warn'
                        ? 'text-amber-400'
                        : 'text-slate-300'
                    }`}
                  >
                    {log.text}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
