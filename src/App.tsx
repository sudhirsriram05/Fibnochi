import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Candle,
  StrategyParams,
  BacktestResult,
  Trade,
  TickerData,
  Timeframe,
} from './types/trading';
import { fetchHistoricalGoldKlines, fetchBybitTicker, getInstantInitialDataset } from './services/bybitService';
import { runZeroLookaheadBacktest } from './services/pineEngine';
import { runLayaWalkForwardOptimization, LayaOptimizationResult } from './services/layaAutoTuner';

import { Header } from './components/Header';
import { TradingChart } from './components/Chart/TradingChart';
import { StrategyControls } from './components/StrategyControls/StrategyControls';
import { TradeJournal } from './components/TradeJournal/TradeJournal';
import { LiveBotPanel } from './components/LiveBotPanel';
import { PineScriptModal } from './components/PineScriptModal';
import { LayaAIModal } from './components/LayaAIModal';

import {
  BarChart2,
  BookOpen,
  Activity,
  Maximize2,
  ShieldCheck,
  Calendar,
} from 'lucide-react';

const DEFAULT_PARAMS: StrategyParams = {
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
  initialCapital: 10000,
  leverage: 20,
  positionSizePercent: 15,
  commissionPercent: 0.06,
  slippagePercent: 0.01,
};

// Initial verified Gold dataset (2.0 years multi-year depth) for zero-latency initial UI paint
const initialDataset = getInstantInitialDataset('60', 2.0);
const initialBacktestResult = runZeroLookaheadBacktest(initialDataset.bars, DEFAULT_PARAMS);

export default function App() {
  // Market & Data State
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>('60');
  const [selectedYears, setSelectedYears] = useState<number>(2.0); // 1.5 - 3.0 years as requested
  const [yearsSpanned, setYearsSpanned] = useState<number>(initialDataset.yearsSpanned);
  const [candles, setCandles] = useState<Candle[]>(initialDataset.bars);
  const [ticker, setTicker] = useState<TickerData | null>({
    symbol: 'XAUUSDT',
    lastPrice: 4291.90,
    bid1Price: 4291.85,
    ask1Price: 4291.95,
    highPrice24h: 4319.26,
    lowPrice24h: 4260.10,
    prevPrice24h: 4279.21,
    price24hPcnt: 0.00296,
    turnover24h: 103655786,
    volume24h: 24148,
  });
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);

  // Strategy & Backtest State
  const [params, setParams] = useState<StrategyParams>(DEFAULT_PARAMS);
  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(initialBacktestResult);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);

  // Layout View Tabs
  const [activeTab, setActiveTab] = useState<'chart_journal' | 'chart_only' | 'journal_only' | 'bot'>(
    'chart_journal'
  );

  // Modals
  const [isPineModalOpen, setIsPineModalOpen] = useState(false);
  const [isLayaModalOpen, setIsLayaModalOpen] = useState(false);

  // Laya AI Optimization State
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optProgress, setOptProgress] = useState(0);
  const [optStatus, setOptStatus] = useState('');
  const [optResult, setOptResult] = useState<LayaOptimizationResult | null>(null);

  // Live Auto-Bot Execution State
  const [isBotActive, setIsBotActive] = useState(false);
  const [activePosition, setActivePosition] = useState<Trade | null>(null);
  const [botLogs, setBotLogs] = useState<{ time: number; text: string; type: 'info' | 'trade' | 'warn' }[]>([
    {
      time: Date.now(),
      text: 'Laya Trading Engine initialized. Bybit linear perpetual data feed ready.',
      type: 'info',
    },
  ]);

  const botIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Helper to add bot log
  const addBotLog = useCallback((text: string, type: 'info' | 'trade' | 'warn' = 'info') => {
    setBotLogs(prev => [...prev.slice(-40), { time: Date.now(), text, type }]);
  }, []);

  // ─── 1. FETCH MULTI-YEAR HISTORICAL BYBIT DATA (1.5 - 3 YEARS) ──────────────
  const loadMarketData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const { bars, yearsSpanned: actualYears, source } = await fetchHistoricalGoldKlines(
        'XAUUSDT',
        selectedTimeframe,
        selectedYears
      );

      if (bars && bars.length >= 30) {
        setCandles(bars);
        setYearsSpanned(actualYears);

        // Run zero-lookahead backtest on full multi-year history
        const result = runZeroLookaheadBacktest(bars, params);
        setBacktestResult(result);
        addBotLog(
          `Synchronized ${bars.length.toLocaleString()} bars covering ${actualYears.toFixed(1)} years from ${source}. Backtest net return: ${result.metrics.netProfitPercent}% across ${result.trades.length} trades.`,
          'info'
        );
      }

      const tickerData = await fetchBybitTicker('XAUUSDT');
      if (tickerData) setTicker(tickerData);
    } catch (err: any) {
      console.warn('Market sync notice:', err.message);
    } finally {
      setIsLoadingData(false);
    }
  }, [selectedTimeframe, selectedYears, params, addBotLog]);

  // Load on mount and on timeframe or years change
  useEffect(() => {
    loadMarketData();
  }, [selectedTimeframe, selectedYears]);

  // Periodic Ticker Polling (Every 4 seconds)
  useEffect(() => {
    const tickerInterval = setInterval(async () => {
      try {
        const t = await fetchBybitTicker('XAUUSDT');
        setTicker(t);
      } catch {}
    }, 4000);
    return () => clearInterval(tickerInterval);
  }, []);

  // Re-run backtest when strategy params change
  const handleParamsChange = (newParams: StrategyParams) => {
    setParams(newParams);
    if (candles.length >= 30) {
      const result = runZeroLookaheadBacktest(candles, newParams);
      setBacktestResult(result);
    }
  };

  const handleManualRunBacktest = () => {
    if (candles.length >= 30) {
      const result = runZeroLookaheadBacktest(candles, params);
      setBacktestResult(result);
      addBotLog(
        `Backtest re-evaluated across ${candles.length.toLocaleString()} bars (${yearsSpanned.toFixed(1)} years). Win Rate: ${result.metrics.winRate}%, Profit Factor: ${result.metrics.profitFactor}`,
        'info'
      );
    }
  };

  // ─── 2. LAYA AI WALK-FORWARD AUTO-TUNER ─────────────────────────────────────
  const handleStartLayaOptimization = async () => {
    if (candles.length < 50) return;
    setIsLayaModalOpen(true);
    setIsOptimizing(true);
    setOptProgress(0);
    setOptStatus(`Partitioning ${yearsSpanned.toFixed(1)} years of data for walk-forward validation...`);

    try {
      const res = await runLayaWalkForwardOptimization(candles, params, (pct, curBest, status) => {
        setOptProgress(pct);
        setOptStatus(status);
      });
      setOptResult(res);
      addBotLog(
        `Laya fine-tuning completed on ${yearsSpanned.toFixed(1)} yrs data: Win rate ${res.fullBacktestResult.metrics.winRate}%, PF: ${res.fullBacktestResult.metrics.profitFactor}`,
        'trade'
      );
    } catch (err: any) {
      console.error('Laya optimization error:', err);
      setOptStatus('Optimization error: ' + err.message);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleApplyLayaParams = (tunedParams: StrategyParams) => {
    setParams(tunedParams);
    if (candles.length >= 30) {
      const result = runZeroLookaheadBacktest(candles, tunedParams);
      setBacktestResult(result);
    }
    addBotLog('Laya AI fine-tuned parameters applied to strategy & live bot.', 'trade');
  };

  // ─── 3. LIVE AUTOMATED TRADING SIMULATOR / BOT ──────────────────────────────
  const toggleBot = () => {
    setIsBotActive(prev => {
      const next = !prev;
      addBotLog(
        next
          ? `Auto-Trading Bot ACTIVATED on XAU/USD (${selectedTimeframe}). Real-time signals enabled...`
          : 'Auto-Trading Bot PAUSED. Orders on hold.',
        next ? 'trade' : 'warn'
      );
      return next;
    });
  };

  // Live Bot Execution Tick
  useEffect(() => {
    if (!isBotActive) {
      if (botIntervalRef.current) clearInterval(botIntervalRef.current);
      return;
    }

    botIntervalRef.current = setInterval(() => {
      if (!ticker || candles.length < 20) return;

      const currentPrice = ticker.lastPrice;

      // If position is active, evaluate take-profit, stop-loss, and trailing stop
      if (activePosition) {
        const isLong = activePosition.direction === 'LONG';
        const tpPrice = isLong
          ? activePosition.entryPrice * (1 + params.tpPercent / 100)
          : activePosition.entryPrice * (1 - params.tpPercent / 100);
        const slPrice = isLong
          ? activePosition.entryPrice * (1 - params.slPercent / 100)
          : activePosition.entryPrice * (1 + params.slPercent / 100);

        let shouldClose = false;
        let exitReason: Trade['exitReason'] = undefined;

        if (isLong) {
          if (currentPrice >= tpPrice) {
            shouldClose = true;
            exitReason = 'Take Profit';
          } else if (currentPrice <= slPrice) {
            shouldClose = true;
            exitReason = 'Stop Loss';
          }
        } else {
          if (currentPrice <= tpPrice) {
            shouldClose = true;
            exitReason = 'Take Profit';
          } else if (currentPrice >= slPrice) {
            shouldClose = true;
            exitReason = 'Stop Loss';
          }
        }

        if (shouldClose) {
          const diff = isLong ? currentPrice - activePosition.entryPrice : activePosition.entryPrice - currentPrice;
          const pnl = diff * activePosition.contracts;
          const pnlPct = (pnl / activePosition.size) * 100;

          const closedTrade: Trade = {
            ...activePosition,
            exitPrice: currentPrice,
            exitTime: Date.now(),
            pnl: parseFloat(pnl.toFixed(2)),
            pnlPercent: parseFloat(pnlPct.toFixed(2)),
            exitReason,
          };

          addBotLog(
            `[EXECUTION] Closed ${closedTrade.direction} position at $${currentPrice.toFixed(2)} (${exitReason}). PnL: ${
              pnl >= 0 ? '+' : ''
            }$${pnl.toFixed(2)} (${pnlPct.toFixed(2)}%)`,
            pnl >= 0 ? 'trade' : 'warn'
          );

          setActivePosition(null);

          setBacktestResult(prev => {
            if (!prev) return null;
            const updatedTrades = [closedTrade, ...prev.trades];
            return {
              ...prev,
              trades: updatedTrades,
            };
          });
        }
      } else {
        // No open position: check latest confirmed indicator signal
        if (backtestResult && backtestResult.indicatorPoints.length > 0) {
          const latestIndicator = backtestResult.indicatorPoints[backtestResult.indicatorPoints.length - 1];
          if (latestIndicator.signal) {
            const isLong = latestIndicator.signal === 'long';
            const positionValue = params.initialCapital * (params.positionSizePercent / 100) * params.leverage;
            const contracts = parseFloat((positionValue / currentPrice).toFixed(3));

            const newPos: Trade = {
              id: `LIVE-${Date.now()}`,
              index: (backtestResult.trades.length || 0) + 1,
              direction: isLong ? 'LONG' : 'SHORT',
              entryTime: Date.now(),
              entryPrice: currentPrice,
              entryBarIndex: candles.length - 1,
              size: positionValue,
              contracts,
              highestPrice: currentPrice,
              lowestPrice: currentPrice,
              durationBars: 0,
            };

            setActivePosition(newPos);
            addBotLog(
              `[SIGNAL TRIGGERED] Opened ${newPos.direction} ${contracts} oz Gold @ $${currentPrice.toFixed(
                2
              )} | RSI: ${latestIndicator.rsi?.toFixed(1) || 'N/A'} crossover MA (${params.rsiMaLength})`,
              'trade'
            );
          }
        }
      }
    }, 3000);

    return () => {
      if (botIntervalRef.current) clearInterval(botIntervalRef.current);
    };
  }, [isBotActive, activePosition, ticker, params, candles, backtestResult, addBotLog]);

  const handleEmergencyClosePosition = () => {
    if (!activePosition || !ticker) return;
    const currentPrice = ticker.lastPrice;
    const isLong = activePosition.direction === 'LONG';
    const diff = isLong ? currentPrice - activePosition.entryPrice : activePosition.entryPrice - currentPrice;
    const pnl = diff * activePosition.contracts;

    addBotLog(
      `[MANUAL CLOSE] Closed ${activePosition.direction} Gold position at $${currentPrice.toFixed(
        2
      )}. PnL: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`,
      'warn'
    );
    setActivePosition(null);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#070a11] text-slate-100 overflow-hidden font-sans">
      {/* ─── TOP GLOBAL TRADING HEADER ─────────────────────────────── */}
      <Header
        ticker={ticker}
        selectedTimeframe={selectedTimeframe}
        onSelectTimeframe={setSelectedTimeframe}
        selectedYears={selectedYears}
        onSelectYears={setSelectedYears}
        yearsSpanned={yearsSpanned}
        isBotActive={isBotActive}
        onToggleBot={toggleBot}
        onOpenPineModal={() => setIsPineModalOpen(true)}
        onOpenLayaModal={handleStartLayaOptimization}
        onRefreshData={loadMarketData}
        isLoading={isLoadingData}
        totalBarsLoaded={candles.length}
      />

      {/* ─── WORKSPACE SUB-NAVBAR (VIEW TABS & SYSTEM STATUS) ──────── */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-[#090d16] border-b border-slate-800/80 text-xs">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab('chart_journal')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded font-medium transition-colors ${
              activeTab === 'chart_journal'
                ? 'bg-slate-800 text-amber-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Split Terminal (Chart + Journal)</span>
          </button>

          <button
            onClick={() => setActiveTab('chart_only')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded font-medium transition-colors ${
              activeTab === 'chart_only'
                ? 'bg-slate-800 text-amber-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Full Chart</span>
          </button>

          <button
            onClick={() => setActiveTab('journal_only')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded font-medium transition-colors ${
              activeTab === 'journal_only'
                ? 'bg-slate-800 text-amber-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Trade Journal ({backtestResult?.trades.length || 0} Trades)</span>
          </button>

          <button
            onClick={() => setActiveTab('bot')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded font-medium transition-colors ${
              activeTab === 'bot'
                ? 'bg-slate-800 text-amber-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Live Bot Desk</span>
          </button>
        </div>

        {/* Backtest Multi-Year Stats Pill */}
        {backtestResult && (
          <div className="hidden md:flex items-center gap-3 font-mono text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>Tested:</span>
              <strong className="text-slate-200">{yearsSpanned.toFixed(1)} Yrs</strong>
            </span>
            <span className="text-slate-600">·</span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Zero-Lookahead:</span>
              <strong className="text-emerald-400">Strict Next-Bar</strong>
            </span>
            <span className="text-slate-600">·</span>
            <span>
              Win Rate: <strong className="text-emerald-400">{backtestResult.metrics.winRate}%</strong>
            </span>
            <span className="text-slate-600">·</span>
            <span>
              PF: <strong className="text-slate-200">{backtestResult.metrics.profitFactor}</strong>
            </span>
            <span className="text-slate-600">·</span>
            <span>
              Sharpe: <strong className="text-amber-400">{backtestResult.metrics.sharpeRatio}</strong>
            </span>
          </div>
        )}
      </div>

      {/* ─── MAIN DESK CONTENT AREA ─────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden p-2 gap-2">
        {/* Left Side: Strategy Controls */}
        <div className="w-72 shrink-0 hidden lg:block h-full">
          <StrategyControls
            params={params}
            onChangeParams={handleParamsChange}
            onRunBacktest={handleManualRunBacktest}
            onOpenLayaModal={handleStartLayaOptimization}
            onOpenPineModal={() => setIsPineModalOpen(true)}
            isLoading={isLoadingData}
          />
        </div>

        {/* Center / Right: Dynamic Workspace Panels */}
        <div className="flex-1 flex flex-col h-full overflow-hidden gap-2">
          {activeTab === 'chart_journal' && (
            <>
              {/* Top: Chart (58% height) */}
              <div className="flex-[6] min-h-[300px] overflow-hidden">
                <TradingChart
                  candles={candles}
                  indicatorPoints={backtestResult?.indicatorPoints || []}
                  trades={backtestResult?.trades || []}
                  selectedTrade={selectedTrade}
                  onSelectTrade={setSelectedTrade}
                  symbol="XAUUSDT (Gold)"
                  timeframe={`${selectedTimeframe}m`}
                  yearsSpanned={yearsSpanned}
                />
              </div>

              {/* Bottom: Trade Journal (42% height) */}
              <div className="flex-[4] min-h-[200px] overflow-hidden">
                {backtestResult && (
                  <TradeJournal
                    trades={backtestResult.trades}
                    metrics={backtestResult.metrics}
                    selectedTrade={selectedTrade}
                    onSelectTrade={setSelectedTrade}
                    yearsSpanned={yearsSpanned}
                  />
                )}
              </div>
            </>
          )}

          {activeTab === 'chart_only' && (
            <div className="flex-1 h-full overflow-hidden">
              <TradingChart
                candles={candles}
                indicatorPoints={backtestResult?.indicatorPoints || []}
                trades={backtestResult?.trades || []}
                selectedTrade={selectedTrade}
                onSelectTrade={setSelectedTrade}
                symbol="XAUUSDT (Gold)"
                timeframe={`${selectedTimeframe}m`}
                yearsSpanned={yearsSpanned}
              />
            </div>
          )}

          {activeTab === 'journal_only' && backtestResult && (
            <div className="flex-1 h-full overflow-hidden">
              <TradeJournal
                trades={backtestResult.trades}
                metrics={backtestResult.metrics}
                selectedTrade={selectedTrade}
                onSelectTrade={setSelectedTrade}
                yearsSpanned={yearsSpanned}
              />
            </div>
          )}

          {activeTab === 'bot' && (
            <div className="flex-1 h-full overflow-hidden">
              <LiveBotPanel
                isBotActive={isBotActive}
                onToggleBot={toggleBot}
                activePosition={activePosition}
                ticker={ticker}
                onClosePosition={handleEmergencyClosePosition}
                botLogs={botLogs}
              />
            </div>
          )}
        </div>
      </div>

      {/* ─── MODALS ─────────────────────────────────────────────────── */}
      <PineScriptModal
        isOpen={isPineModalOpen}
        onClose={() => setIsPineModalOpen(false)}
      />

      <LayaAIModal
        isOpen={isLayaModalOpen}
        onClose={() => setIsLayaModalOpen(false)}
        isOptimizing={isOptimizing}
        progress={optProgress}
        statusText={optStatus}
        result={optResult}
        onApplyParams={handleApplyLayaParams}
      />
    </div>
  );
}
