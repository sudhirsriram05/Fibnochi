import React from 'react';
import { X, Check, Brain, Cpu, ShieldCheck, TrendingUp, AlertTriangle, Sparkles, ArrowRight } from 'lucide-react';
import { StrategyParams } from '../types/trading';
import { LayaOptimizationResult } from '../services/layaAutoTuner';

interface LayaAIModalProps {
  isOpen: boolean;
  onClose: () => void;
  isOptimizing: boolean;
  progress: number;
  statusText: string;
  result: LayaOptimizationResult | null;
  onApplyParams: (params: StrategyParams) => void;
}

export const LayaAIModal: React.FC<LayaAIModalProps> = ({
  isOpen,
  onClose,
  isOptimizing,
  progress,
  statusText,
  result,
  onApplyParams,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-[#0b0f17] border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-[#0f172a]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/30 text-violet-400">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                Laya AI Quantitative Auto-Tuner & Copilot
                <span className="text-[11px] font-mono text-violet-300 bg-violet-950/70 border border-violet-700/50 px-2 py-0.5 rounded">
                  Walk-Forward Analysis (Zero-Lookahead)
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Automated optimization agent for XAU/USD scalping without curve-fitting
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-auto p-5 space-y-5">
          {/* Optimization Progress Bar */}
          {isOptimizing ? (
            <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-xl space-y-4 text-center">
              <div className="flex items-center justify-center gap-3 text-violet-400">
                <Cpu className="w-6 h-6 animate-spin" />
                <span className="text-sm font-semibold text-slate-200">
                  Laya Neural Engine Searching Parameter Space...
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-800">
                <div
                  className="bg-gradient-to-r from-violet-600 via-amber-500 to-emerald-500 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>{statusText}</span>
                <span className="font-bold text-violet-300">{progress}%</span>
              </div>

              <div className="pt-2 text-[11px] text-slate-500">
                Strict Walk-Forward: 70% In-Sample training · 30% blind Out-of-Sample validation
              </div>
            </div>
          ) : result ? (
            <>
              {/* Optimization KPI Diff Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-lg">
                  <div className="text-[11px] text-slate-400">Win Rate Improvement</div>
                  <div className="text-lg font-mono font-bold text-emerald-400 mt-1 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    {result.improvementStats.winRateDiff >= 0 ? '+' : ''}
                    {result.improvementStats.winRateDiff}%
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    {result.inSampleResult.metrics.winRate}% → {result.fullBacktestResult.metrics.winRate}%
                  </div>
                </div>

                <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-lg">
                  <div className="text-[11px] text-slate-400">Profit Factor Gain</div>
                  <div className="text-lg font-mono font-bold text-emerald-400 mt-1">
                    {result.improvementStats.profitFactorDiff >= 0 ? '+' : ''}
                    {result.improvementStats.profitFactorDiff}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    New PF: {result.fullBacktestResult.metrics.profitFactor}
                  </div>
                </div>

                <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-lg">
                  <div className="text-[11px] text-slate-400">Sharpe Ratio Delta</div>
                  <div className="text-lg font-mono font-bold text-amber-400 mt-1">
                    {result.improvementStats.sharpeDiff >= 0 ? '+' : ''}
                    {result.improvementStats.sharpeDiff}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    New Sharpe: {result.fullBacktestResult.metrics.sharpeRatio}
                  </div>
                </div>

                <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-lg">
                  <div className="text-[11px] text-slate-400">Max Drawdown</div>
                  <div className="text-lg font-mono font-bold text-rose-400 mt-1">
                    -{result.fullBacktestResult.metrics.maxDrawdownPercent}%
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    Reduced by {result.improvementStats.drawdownReduction}%
                  </div>
                </div>
              </div>

              {/* Parameter Side-by-Side Comparison */}
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg">
                <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
                  Parameter Adjustments (RSI Bollinger Bands Strategy)
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
                  <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">RSI Length</span>
                    <span className="text-slate-400 line-through mr-2">{result.initialParams.rsiLength}</span>
                    <span className="text-emerald-400 font-bold">{result.bestParams.rsiLength}</span>
                  </div>

                  <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">RSI MA Length</span>
                    <span className="text-slate-400 line-through mr-2">{result.initialParams.rsiMaLength}</span>
                    <span className="text-emerald-400 font-bold">{result.bestParams.rsiMaLength}</span>
                  </div>

                  <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">BB StdDev Mult</span>
                    <span className="text-slate-400 line-through mr-2">{result.initialParams.bbMult}</span>
                    <span className="text-emerald-400 font-bold">{result.bestParams.bbMult}</span>
                  </div>

                  <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">Take Profit (%)</span>
                    <span className="text-slate-400 line-through mr-2">{result.initialParams.tpPercent}%</span>
                    <span className="text-emerald-400 font-bold">{result.bestParams.tpPercent}%</span>
                  </div>

                  <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">Stop Loss (%)</span>
                    <span className="text-slate-400 line-through mr-2">{result.initialParams.slPercent}%</span>
                    <span className="text-emerald-400 font-bold">{result.bestParams.slPercent}%</span>
                  </div>

                  <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">Trailing Offset</span>
                    <span className="text-slate-400 line-through mr-2">{result.initialParams.trailingOffset}%</span>
                    <span className="text-emerald-400 font-bold">{result.bestParams.trailingOffset}%</span>
                  </div>

                  <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">Oversold Threshold</span>
                    <span className="text-slate-400 line-through mr-2">{result.initialParams.oversold}</span>
                    <span className="text-emerald-400 font-bold">{result.bestParams.oversold}</span>
                  </div>

                  <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">Overbought Threshold</span>
                    <span className="text-slate-400 line-through mr-2">{result.initialParams.overbought}</span>
                    <span className="text-emerald-400 font-bold">{result.bestParams.overbought}</span>
                  </div>
                </div>
              </div>

              {/* Laya Neural Audit Report */}
              {result.auditReport && (
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-violet-400" />
                      <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                        Laya AI Model Strategic Audit
                      </h3>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-slate-400">Overfitting Risk:</span>
                      <span
                        className={`font-semibold px-2 py-0.5 rounded text-[10px] ${
                          result.auditReport.overfittingRisk === 'Low'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                            : 'bg-amber-950 text-amber-300 border border-amber-700'
                        }`}
                      >
                        {result.auditReport.overfittingRisk}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-300 leading-relaxed bg-slate-950/70 p-3 rounded border border-slate-800/80">
                    <p className="font-semibold text-amber-400 mb-1">
                      Detected Market Regime: {result.auditReport.regime}
                    </p>
                    <p className="text-slate-300">{result.auditReport.critique}</p>
                  </div>

                  {result.auditReport.keyStrengths && (
                    <div className="space-y-1.5 pt-1">
                      <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Key Algorithmic Strengths:</span>
                      </div>
                      <ul className="text-xs text-slate-300 space-y-1 pl-4 list-disc marker:text-emerald-400">
                        {result.auditReport.keyStrengths.map((s, idx) => (
                          <li key={idx}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.auditReport.riskWarnings && (
                    <div className="space-y-1.5 pt-1">
                      <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        <span>Commodities Risk Warnings:</span>
                      </div>
                      <ul className="text-xs text-slate-400 space-y-1 pl-4 list-disc marker:text-amber-400">
                        {result.auditReport.riskWarnings.map((w, idx) => (
                          <li key={idx}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-10 text-slate-400 text-sm">
              Click &quot;Auto-Tune Now&quot; to begin Laya AI walk-forward parameter optimization.
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-800 bg-[#0f172a]">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors"
          >
            Cancel
          </button>

          {result && !isOptimizing && (
            <button
              onClick={() => {
                onApplyParams(result.bestParams);
                onClose();
              }}
              className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-violet-900/30 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Apply Fine-Tuned Parameters</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
