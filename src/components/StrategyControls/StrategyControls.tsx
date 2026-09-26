import React from 'react';
import { StrategyParams } from '../../types/trading';
import { Sliders, Sparkles, RefreshCw, Zap, Shield, Play } from 'lucide-react';

interface StrategyControlsProps {
  params: StrategyParams;
  onChangeParams: (newParams: StrategyParams) => void;
  onRunBacktest: () => void;
  onOpenLayaModal: () => void;
  onOpenPineModal: () => void;
  isLoading: boolean;
}

export const StrategyControls: React.FC<StrategyControlsProps> = ({
  params,
  onChangeParams,
  onRunBacktest,
  onOpenLayaModal,
  onOpenPineModal,
  isLoading,
}) => {
  const updateParam = <K extends keyof StrategyParams>(key: K, value: StrategyParams[K]) => {
    onChangeParams({
      ...params,
      [key]: value,
    });
  };

  const applyPreset = (presetName: 'SCALP' | 'INTRADAY' | 'SWING') => {
    if (presetName === 'SCALP') {
      onChangeParams({
        ...params,
        rsiLength: 9,
        rsiMaLength: 4,
        bbLength: 14,
        bbMult: 1.8,
        oversold: 28,
        overbought: 72,
        tpPercent: 0.6,
        slPercent: 0.3,
        useTrailing: true,
        trailingOffset: 0.15,
      });
    } else if (presetName === 'INTRADAY') {
      onChangeParams({
        ...params,
        rsiLength: 14,
        rsiMaLength: 6,
        bbLength: 20,
        bbMult: 2.0,
        oversold: 30,
        overbought: 70,
        tpPercent: 0.8,
        slPercent: 0.4,
        useTrailing: true,
        trailingOffset: 0.2,
      });
    } else if (presetName === 'SWING') {
      onChangeParams({
        ...params,
        rsiLength: 18,
        rsiMaLength: 8,
        bbLength: 24,
        bbMult: 2.2,
        oversold: 32,
        overbought: 68,
        tpPercent: 1.5,
        slPercent: 0.7,
        useTrailing: true,
        trailingOffset: 0.35,
      });
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0b0f17] border border-slate-800 rounded-lg p-3 text-xs overflow-y-auto space-y-4">
      {/* Header & Quick Action Buttons */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-1.5 font-semibold text-slate-200">
          <Sliders className="w-4 h-4 text-amber-400" />
          <span>RSI BB Strategy Controls</span>
        </div>

        <button
          onClick={onOpenPineModal}
          className="text-[11px] text-amber-400 hover:text-amber-300 font-mono underline"
        >
          View Pine v6
        </button>
      </div>

      {/* Preset Strategy Buttons */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
          Scalping Presets
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          <button
            onClick={() => applyPreset('SCALP')}
            className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 font-medium transition-colors text-center"
          >
            M1-M5 Scalp
          </button>
          <button
            onClick={() => applyPreset('INTRADAY')}
            className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 font-medium transition-colors text-center"
          >
            M15 Standard
          </button>
          <button
            onClick={() => applyPreset('SWING')}
            className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 font-medium transition-colors text-center"
          >
            H1 Trend
          </button>
        </div>
      </div>

      {/* RSI Parameters */}
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between text-slate-300 font-medium">
          <span>RSI Length</span>
          <span className="font-mono text-amber-400 font-bold">{params.rsiLength}</span>
        </div>
        <input
          type="range"
          min="5"
          max="30"
          value={params.rsiLength}
          onChange={e => updateParam('rsiLength', parseInt(e.target.value, 10))}
          className="w-full accent-amber-500 cursor-pointer"
        />

        <div className="flex items-center justify-between text-slate-300 font-medium pt-1">
          <span>RSI MA Length</span>
          <span className="font-mono text-cyan-400 font-bold">{params.rsiMaLength}</span>
        </div>
        <input
          type="range"
          min="2"
          max="20"
          value={params.rsiMaLength}
          onChange={e => updateParam('rsiMaLength', parseInt(e.target.value, 10))}
          className="w-full accent-cyan-500 cursor-pointer"
        />
      </div>

      {/* Bollinger Bands Parameters */}
      <div className="space-y-2.5 pt-2 border-t border-slate-800/80">
        <div className="flex items-center justify-between text-slate-300 font-medium">
          <span>BB Length</span>
          <span className="font-mono text-violet-400 font-bold">{params.bbLength}</span>
        </div>
        <input
          type="range"
          min="10"
          max="40"
          value={params.bbLength}
          onChange={e => updateParam('bbLength', parseInt(e.target.value, 10))}
          className="w-full accent-violet-500 cursor-pointer"
        />

        <div className="flex items-center justify-between text-slate-300 font-medium pt-1">
          <span>BB StdDev Multiplier</span>
          <span className="font-mono text-violet-400 font-bold">{params.bbMult.toFixed(1)}</span>
        </div>
        <input
          type="range"
          min="1.0"
          max="3.5"
          step="0.1"
          value={params.bbMult}
          onChange={e => updateParam('bbMult', parseFloat(e.target.value))}
          className="w-full accent-violet-500 cursor-pointer"
        />
      </div>

      {/* Overbought / Oversold Bands */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
        <div>
          <label className="text-[10px] text-slate-400 block mb-1">Oversold (Long)</label>
          <input
            type="number"
            min="15"
            max="45"
            value={params.oversold}
            onChange={e => updateParam('oversold', parseInt(e.target.value, 10))}
            className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 font-mono text-xs focus:border-amber-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="text-[10px] text-slate-400 block mb-1">Overbought (Short)</label>
          <input
            type="number"
            min="55"
            max="85"
            value={params.overbought}
            onChange={e => updateParam('overbought', parseInt(e.target.value, 10))}
            className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 font-mono text-xs focus:border-amber-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Risk Management (Take Profit & Stop Loss) */}
      <div className="space-y-2.5 pt-2 border-t border-slate-800/80">
        <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span>Execution Risk &amp; Exits</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-emerald-400 block mb-1">Take Profit (%)</label>
            <input
              type="number"
              step="0.1"
              min="0.2"
              max="5.0"
              value={params.tpPercent}
              onChange={e => updateParam('tpPercent', parseFloat(e.target.value))}
              className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-emerald-300 font-mono text-xs focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] text-rose-400 block mb-1">Stop Loss (%)</label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              max="3.0"
              value={params.slPercent}
              onChange={e => updateParam('slPercent', parseFloat(e.target.value))}
              className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-rose-300 font-mono text-xs focus:border-rose-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Trailing Stop */}
        <div className="p-2.5 bg-slate-900/60 rounded border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-300 font-medium">Trailing Stop</span>
            <input
              type="checkbox"
              checked={params.useTrailing}
              onChange={e => updateParam('useTrailing', e.target.checked)}
              className="accent-amber-500 w-4 h-4 cursor-pointer"
            />
          </div>

          {params.useTrailing && (
            <div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                <span>Trailing Offset</span>
                <span className="font-mono text-amber-400">{params.trailingOffset}%</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.6"
                step="0.05"
                value={params.trailingOffset}
                onChange={e => updateParam('trailingOffset', parseFloat(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-2 space-y-2">
        <button
          onClick={onRunBacktest}
          disabled={isLoading}
          className="w-full py-2 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
        >
          {isLoading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4 fill-slate-950" />
          )}
          <span>Re-Run Backtest</span>
        </button>

        <button
          onClick={onOpenLayaModal}
          className="w-full py-2 px-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-violet-950/40 transition-all cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-violet-200" />
          <span>Laya AI Auto-Tune</span>
        </button>
      </div>
    </div>
  );
};
