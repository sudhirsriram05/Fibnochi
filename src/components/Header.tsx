import React from 'react';
import { TickerData, Timeframe } from '../types/trading';
import { TIMEFRAME_OPTIONS } from '../services/bybitService';
import { Sparkles, Code2, Play, Pause, RefreshCw, Calendar } from 'lucide-react';

interface HeaderProps {
  ticker: TickerData | null;
  selectedTimeframe: Timeframe;
  onSelectTimeframe: (tf: Timeframe) => void;
  selectedYears: number;
  onSelectYears: (years: number) => void;
  yearsSpanned: number;
  isBotActive: boolean;
  onToggleBot: () => void;
  onOpenPineModal: () => void;
  onOpenLayaModal: () => void;
  onRefreshData: () => void;
  isLoading: boolean;
  totalBarsLoaded: number;
}

export const Header: React.FC<HeaderProps> = ({
  ticker,
  selectedTimeframe,
  onSelectTimeframe,
  selectedYears,
  onSelectYears,
  yearsSpanned,
  isBotActive,
  onToggleBot,
  onOpenPineModal,
  onOpenLayaModal,
  onRefreshData,
  isLoading,
  totalBarsLoaded,
}) => {
  const isUp = (ticker?.price24hPcnt || 0) >= 0;

  return (
    <header className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-[#090d16] border-b border-slate-800 gap-3 select-none">
      {/* Brand & Market Identity */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/20 font-bold text-slate-950 text-sm">
            Au
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-100 tracking-tight text-sm">
                LAYA QUANT
              </span>
              <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                XAU/USD
              </span>
            </div>
            <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
              <span>Gold Perpetual</span>
              <span className="text-slate-600">·</span>
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Bybit API v5
              </span>
            </div>
          </div>
        </div>

        {/* Live Ticker Bar */}
        {ticker && (
          <div className="hidden md:flex items-center gap-4 pl-4 border-l border-slate-800 font-mono text-xs">
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Spot / Mark</div>
              <div className="text-sm font-bold text-amber-400">
                ${ticker.lastPrice.toFixed(2)}
              </div>
            </div>

            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">24h Change</div>
              <div className={`text-xs font-semibold ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isUp ? '+' : ''}{(ticker.price24hPcnt * 100).toFixed(2)}%
              </div>
            </div>

            <div className="hidden lg:block">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">24h High / Low</div>
              <div className="text-xs text-slate-300">
                ${ticker.highPrice24h.toFixed(1)} / ${ticker.lowPrice24h.toFixed(1)}
              </div>
            </div>

            <div className="hidden xl:block">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Historical Depth</div>
              <div className="text-xs text-emerald-400 font-semibold">
                {yearsSpanned > 0 ? `${yearsSpanned.toFixed(1)} Yrs (${totalBarsLoaded.toLocaleString()} bars)` : 'Loading...'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Multi-Year History Depth Selector (1.5 Yrs to 3 Yrs Max) */}
      <div className="flex items-center gap-1.5 bg-slate-900/90 px-2 py-1 rounded-lg border border-slate-800 text-xs">
        <span className="text-slate-400 text-[11px] font-semibold flex items-center gap-1 mr-1">
          <Calendar className="w-3.5 h-3.5 text-amber-400" />
          <span>Depth:</span>
        </span>
        <button
          onClick={() => onSelectYears(1.5)}
          className={`px-2 py-0.5 rounded font-mono text-[11px] font-medium transition-all ${
            selectedYears === 1.5
              ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          1.5 Years
        </button>
        <button
          onClick={() => onSelectYears(2.0)}
          className={`px-2 py-0.5 rounded font-mono text-[11px] font-medium transition-all ${
            selectedYears === 2.0
              ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          2.0 Years
        </button>
        <button
          onClick={() => onSelectYears(3.0)}
          className={`px-2 py-0.5 rounded font-mono text-[11px] font-medium transition-all ${
            selectedYears === 3.0
              ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          3.0 Years (Max)
        </button>
      </div>

      {/* Timeframe Switcher (All User-Specified Timeframes) */}
      <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-800 overflow-x-auto text-xs">
        {TIMEFRAME_OPTIONS.map(tf => {
          const isActive = selectedTimeframe === tf.value;
          return (
            <button
              key={tf.value}
              onClick={() => onSelectTimeframe(tf.value)}
              className={`px-2.5 py-1 rounded font-mono font-medium transition-all ${
                isActive
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {tf.label}
            </button>
          );
        })}

        <button
          onClick={onRefreshData}
          disabled={isLoading}
          title="Refresh Multi-Year Bybit Candles"
          className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors ml-1 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
        </button>
      </div>

      {/* Primary Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenPineModal}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
        >
          <Code2 className="w-3.5 h-3.5 text-amber-400" />
          <span>Pine v6 Script</span>
        </button>

        <button
          onClick={onOpenLayaModal}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-violet-900/30 transition-all cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Laya AI Fine-Tune</span>
        </button>

        <button
          onClick={onToggleBot}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow cursor-pointer ${
            isBotActive
              ? 'bg-rose-600 hover:bg-rose-500 text-white'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
          }`}
        >
          {isBotActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          <span>{isBotActive ? 'Bot Running' : 'Start Bot'}</span>
        </button>
      </div>
    </header>
  );
};
