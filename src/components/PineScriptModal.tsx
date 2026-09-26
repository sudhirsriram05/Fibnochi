import React, { useState } from 'react';
import { X, Copy, Check, Code2, Sparkles, BookOpen, ArrowRight } from 'lucide-react';
import { PINE_SCRIPT_V3_ORIGINAL, PINE_SCRIPT_V6_MODERN, PINETS_TYPESCRIPT_CODE } from '../services/pineEngine';

interface PineScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PineScriptModal: React.FC<PineScriptModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'v6' | 'v3' | 'changes' | 'typescript'>('v6');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const v3ToV6Changes = [
    {
      feature: 'Directive & Script Declaration',
      v3: '//@version=3\nstudy("RSI Bollinger Bands")',
      v6: '//@version=6\nstrategy("RSI Bollinger Bands Scalping Strategy [v6]", overlay=false, initial_capital=10000, commission_value=0.06)',
      explanation: 'Upgrades from deprecated v3 indicator study to full v6 quantitative strategy with portfolio execution and fees.',
    },
    {
      feature: 'Technical Analysis Namespace',
      v3: 'rsi(src, length)\nsma(src, length)\nstdev(src, length)',
      v6: 'ta.rsi(src, length)\nta.sma(src, length)\nta.stdev(src, length)',
      explanation: 'Pine v6 organizes all mathematical indicators into the official "ta.*" namespace for strict typing and performance.',
    },
    {
      feature: 'Color Syntax & Transparency',
      v3: 'color(black, 70)\ncolor(red, 50)',
      v6: 'color.new(color.black, 70)\ncolor.new(#ef4444, 30)',
      explanation: 'Old color() function is replaced by color.new(baseColor, transparencyPercent).',
    },
    {
      feature: 'Type-Safe User Inputs',
      v3: 'input(close, title="...")\ninput(14, minval=1)',
      v6: 'input.source(close, title="...")\ninput.int(14, minval=1)\ninput.float(0.8, step=0.1)',
      explanation: 'Pine v6 enforces explicit input typing (input.int, input.float, input.source, input.bool).',
    },
    {
      feature: 'Automated Scalping Execution',
      v3: '// None (Indicator only)',
      v6: 'strategy.entry("Long Scalp", strategy.long)\nstrategy.exit("Exit Long", profit=..., loss=..., trail_points=...)',
      explanation: 'Native broker execution with stop-loss, profit-target, and trailing stop protection without lookahead.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-[#0b0f17] border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-[#0f172a]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                Pine Script Migration & Transpiler
                <span className="text-xs font-mono font-normal text-emerald-400 bg-emerald-950/70 border border-emerald-700/50 px-2 py-0.5 rounded">
                  v3 → v6 Validated
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                RSI Bollinger Bands scalping algorithm converted to modern TradingView PineScript v6
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

        {/* Tab Navigation */}
        <div className="flex items-center justify-between px-5 py-2.5 bg-[#090d16] border-b border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('v6')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'v6'
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Pine Script v6 (Strategy)</span>
            </button>

            <button
              onClick={() => setActiveTab('typescript')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'typescript'
                  ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>TypeScript (PineTS Engine)</span>
            </button>

            <button
              onClick={() => setActiveTab('changes')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'changes'
                  ? 'bg-slate-700 text-slate-100'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>v3 vs v6 Breakdown</span>
            </button>

            <button
              onClick={() => setActiveTab('v3')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeTab === 'v3'
                  ? 'bg-slate-700 text-slate-100'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              Original Pine v3 (Study)
            </button>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'v6' && (
              <button
                onClick={() => handleCopy(PINE_SCRIPT_V6_MODERN)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg font-medium transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Pine v6'}</span>
              </button>
            )}

            {activeTab === 'typescript' && (
              <button
                onClick={() => handleCopy(PINETS_TYPESCRIPT_CODE)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg font-medium transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy TypeScript'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-auto p-5">
          {activeTab === 'v6' && (
            <div>
              <div className="mb-3 p-3 bg-emerald-950/30 border border-emerald-800/40 rounded-lg text-xs text-emerald-300 flex items-start gap-2">
                <span className="font-bold">✓ Ready for TradingView:</span>
                <span>
                  This script is 100% compliant with TradingView Pine Script v6. It includes full automated scalping rules,
                  RSI & MA crossover logic, Bollinger Bands envelope, SL/TP risk controls, and zero-lookahead order execution.
                </span>
              </div>
              <pre className="p-4 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed select-text">
                <code>{PINE_SCRIPT_V6_MODERN}</code>
              </pre>
            </div>
          )}

          {activeTab === 'typescript' && (
            <div>
              <div className="mb-3 p-3 bg-cyan-950/30 border border-cyan-800/40 rounded-lg text-xs text-cyan-300 flex items-start gap-2">
                <span className="font-bold">✓ PineTS Transpiled Engine:</span>
                <span>
                  Pine Script converted into modular, pure TypeScript using PineTS formulas. Directly executable on Node.js/browser
                  with zero lookahead bias and automated backtesting against Bybit Gold data.
                </span>
              </div>
              <pre className="p-4 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-cyan-200 overflow-x-auto leading-relaxed select-text">
                <code>{PINETS_TYPESCRIPT_CODE}</code>
              </pre>
            </div>
          )}

          {activeTab === 'v3' && (
            <div>
              <div className="mb-3 p-3 bg-amber-950/30 border border-amber-800/40 rounded-lg text-xs text-amber-300">
                Original Pine Script v3 study script as provided in prompt (Legacy syntax without execution or strategy support).
              </div>
              <pre className="p-4 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed select-text">
                <code>{PINE_SCRIPT_V3_ORIGINAL}</code>
              </pre>
            </div>
          )}

          {activeTab === 'changes' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                Summary of syntactical and algorithmic modifications applied to convert the legacy version 3 study to version 6 strategy:
              </p>

              <div className="space-y-3">
                {v3ToV6Changes.map((change, idx) => (
                  <div key={idx} className="p-3.5 bg-slate-900 border border-slate-800 rounded-lg text-xs space-y-2">
                    <div className="font-semibold text-amber-400 flex items-center justify-between">
                      <span>{change.feature}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 font-mono text-[11px]">
                      <div className="p-2 bg-rose-950/20 border border-rose-900/30 rounded">
                        <div className="text-rose-400 font-sans font-semibold mb-1 text-[10px]">Legacy v3</div>
                        <pre className="text-slate-300 whitespace-pre-wrap">{change.v3}</pre>
                      </div>

                      <div className="p-2 bg-emerald-950/20 border border-emerald-900/30 rounded">
                        <div className="text-emerald-400 font-sans font-semibold mb-1 text-[10px]">Upgraded v6</div>
                        <pre className="text-slate-200 whitespace-pre-wrap">{change.v6}</pre>
                      </div>
                    </div>

                    <div className="text-slate-400 text-[11px] pt-1 border-t border-slate-800/60">
                      <span className="text-slate-300 font-medium">Impact: </span>
                      {change.explanation}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-800 bg-[#0f172a] text-xs text-slate-400">
          <span>PineTS & Vela Compliant Runtime</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
