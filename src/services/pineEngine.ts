import { Candle, IndicatorPoint, StrategyParams, Trade, BacktestResult, BacktestMetrics } from '../types/trading';

/**
 * Standard Pine Script v3 Code (Original as provided by User)
 */
export const PINE_SCRIPT_V3_ORIGINAL = `//@version=3
study("RSI Bollinger Bands")

// RSI
src_rsi = input(close, title="RSI Source")
length_rsi = input(14, minval=1, title="RSI Length")
rsi = rsi(src_rsi, length_rsi)

oversold_line = input(30, minval=1, title="RSI Oversold Threshold")
overbought_line = input(70, minval=1, title="RSI Overbought Threshold")

// Moving Average RSI
ma_length_rsi = input(6, minval=1, title="RSI MA Length")
ma_rsi = sma(rsi, ma_length_rsi)

// Bollinger Bands
src = rsi
length = input(20, minval=1, title="BB Length")
mult = input(2.0, minval=0.001, maxval=50, title="BB Mult")
basis = sma(src, length)
dev = mult * stdev(src, length)
upper = basis + dev
lower = basis - dev

// Plots
plot(basis, title='BB Basis', color=color(black, 70))
p1 = plot(upper, title='BB Upper', color=color(red, 50))
p2 = plot(lower, title='BB Lower', color=green)
fill(p1, p2, title='BB Background', color=color(black, 95))

plot(rsi, title='RSI Plot', color=color(purple,0), style=line)
plot(ma_rsi, title='MA Plot', color=color(aqua, 50), style=line)

hline(oversold_line, title='RSI Oversold Line', color=color(black, 20), linestyle=dotted, linewidth=1)
hline(overbought_line, title='RSI Overbought Line', color=color(black, 20), linestyle=dotted, linewidth=1)`;

/**
 * Converted Modern Pine Script v6 Strategy Script (Ready for TradingView v6)
 */
export const PINE_SCRIPT_V6_MODERN = `//@version=6
strategy("RSI Bollinger Bands Scalping Strategy [v6]", 
         shorttitle="RSI BB Scalp v6", 
         overlay=false, 
         margin_long=100, 
         margin_short=100, 
         default_qty_type=strategy.percent_of_equity, 
         default_qty_value=15, 
         initial_capital=10000, 
         commission_type=strategy.commission.percent, 
         commission_value=0.06, 
         process_orders_on_close=false, 
         calc_on_every_tick=false)

// ─── INPUTS ──────────────────────────────────────────────────────────
src_rsi         = input.source(close, title="RSI Source")
length_rsi      = input.int(14, minval=1, title="RSI Length")
oversold_line   = input.float(30.0, minval=1.0, maxval=50.0, title="RSI Oversold Threshold")
overbought_line = input.float(70.0, minval=50.0, maxval=99.0, title="RSI Overbought Threshold")

// Moving Average RSI
ma_length_rsi   = input.int(6, minval=1, title="RSI MA Length")

// Bollinger Bands on RSI
length_bb       = input.int(20, minval=1, title="BB Length")
mult_bb         = input.float(2.0, minval=0.001, maxval=50.0, step=0.1, title="BB StdDev Multiplier")

// Scalping Risk Management
tp_pct          = input.float(0.8, minval=0.1, step=0.1, title="Take Profit (%)")
sl_pct          = input.float(0.4, minval=0.1, step=0.1, title="Stop Loss (%)")
use_trailing    = input.bool(true, title="Enable Trailing Stop")
trail_offset    = input.float(0.2, minval=0.05, step=0.05, title="Trailing Offset (%)")

// ─── CALCULATIONS (V6 ta.* NAMESPACE) ────────────────────────────────
rsi_val = ta.rsi(src_rsi, length_rsi)
ma_rsi  = ta.sma(rsi_val, ma_length_rsi)

// Bollinger Bands on RSI
src_bb  = rsi_val
basis   = ta.sma(src_bb, length_bb)
dev     = mult_bb * ta.stdev(src_bb, length_bb)
upper   = basis + dev
lower   = basis - dev

// ─── PLOTS & VISUALS (V6 color.new) ──────────────────────────────────
p_basis = plot(basis, title="BB Basis", color=color.new(color.gray, 60), linewidth=1)
p_upper = plot(upper, title="BB Upper", color=color.new(#ef4444, 30), linewidth=1)
p_lower = plot(lower, title="BB Lower", color=color.new(#10b981, 30), linewidth=1)
fill(p_upper, p_lower, title="BB Envelope", color=color.new(#8b5cf6, 92))

plot(rsi_val, title="RSI", color=color.new(#a855f7, 0), linewidth=2)
plot(ma_rsi,  title="RSI Moving Average", color=color.new(#06b6d4, 0), linewidth=2)

h_os = hline(oversold_line,   title="RSI Oversold Line",   color=color.new(color.gray, 50), linestyle=hline.style_dotted)
h_ob = hline(overbought_line, title="RSI Overbought Line", color=color.new(color.gray, 50), linestyle=hline.style_dotted)
hline(50.0, title="RSI 50 Midline", color=color.new(color.gray, 75), linestyle=hline.style_dashed)

// ─── SCALPING SIGNALS (RSI & MA CROSSOVER) ───────────────────────────
long_cross      = ta.crossover(rsi_val, ma_rsi)
short_cross     = ta.crossunder(rsi_val, ma_rsi)

// Best practice: Enter long on crossover when RSI is emerging from oversold or below mid-line
long_condition  = long_cross and (rsi_val < 60 or rsi_val <= lower + dev * 0.5)

// Enter short on crossunder when RSI is dropping from overbought or above mid-line
short_condition = short_cross and (rsi_val > 40 or rsi_val >= upper - dev * 0.5)

// ─── STRATEGY EXECUTION (NEXT BAR OPEN FILL - ZERO LOOKAHEAD) ─────────
if (long_condition)
    strategy.entry("Long Scalp", strategy.long)
    strategy.exit("Exit Long", "Long Scalp", 
                  profit = close * (tp_pct / 100) / syminfo.mintick, 
                  loss = close * (sl_pct / 100) / syminfo.mintick,
                  trail_points = use_trailing ? close * (trail_offset / 100) / syminfo.mintick : na)

if (short_condition)
    strategy.entry("Short Scalp", strategy.short)
    strategy.exit("Exit Short", "Short Scalp", 
                  profit = close * (tp_pct / 100) / syminfo.mintick, 
                  loss = close * (sl_pct / 100) / syminfo.mintick,
                  trail_points = use_trailing ? close * (trail_offset / 100) / syminfo.mintick : na)

if (ta.crossunder(rsi_val, upper))
    strategy.close("Long Scalp", comment="Upper BB Reject")

if (ta.crossover(rsi_val, lower))
    strategy.close("Short Scalp", comment="Lower BB Reject")`;

/**
 * PineTS Transpiled Engine Source (Pure TypeScript Strategy)
 * Generated via PineTS / Vela Quant Standards
 */
export const PINETS_TYPESCRIPT_CODE = `import { PineTS, Provider } from 'pinets';

export interface GoldScalpConfig {
  rsiLength: number;       // default: 14
  rsiMaLength: number;     // default: 6
  bbLength: number;        // default: 20
  bbMult: number;          // default: 2.0
  tpPercent: number;       // default: 0.8%
  slPercent: number;       // default: 0.4%
  useTrailing: boolean;    // default: true
  trailingOffset: number;  // default: 0.2%
}

export class RsiBollingerBandsStrategy {
  private config: GoldScalpConfig;

  constructor(config: Partial<GoldScalpConfig> = {}) {
    this.config = {
      rsiLength: 14,
      rsiMaLength: 6,
      bbLength: 20,
      bbMult: 2.0,
      tpPercent: 0.8,
      slPercent: 0.4,
      useTrailing: true,
      trailingOffset: 0.2,
      ...config,
    };
  }

  /**
   * Evaluates signal at bar close t.
   * Orders are strictly placed for next bar t+1 open (Zero Lookahead).
   */
  public evaluate(rsiHistory: number[], maHistory: number[], bbUpper: number, bbLower: number) {
    const len = rsiHistory.length;
    if (len < 2) return null;

    const currentRsi = rsiHistory[len - 1];
    const prevRsi = rsiHistory[len - 2];
    const currentMa = maHistory[len - 1];
    const prevMa = maHistory[len - 2];

    const isCrossOver = prevRsi <= prevMa && currentRsi > currentMa;
    const isCrossUnder = prevRsi >= prevMa && currentRsi < currentMa;

    if (isCrossOver && (currentRsi < 60 || prevRsi < bbLower)) {
      return { action: 'BUY', reason: 'RSI_MA_CROSSOVER', targetRsi: currentRsi };
    }
    if (isCrossUnder && (currentRsi > 40 || prevRsi > bbUpper)) {
      return { action: 'SELL', reason: 'RSI_MA_CROSSUNDER', targetRsi: currentRsi };
    }
    return null;
  }
}
`;

/**
 * Calculates Wilder's RMA (used in RSI, identical to Pine Script ta.rsi)
 */
function calculateRMA(values: number[], length: number): number[] {
  const result: number[] = new Array(values.length).fill(NaN);
  if (values.length < length) return result;

  let sum = 0;
  for (let i = 0; i < length; i++) {
    sum += values[i];
  }
  let rma = sum / length;
  result[length - 1] = rma;

  const alpha = 1 / length;
  for (let i = length; i < values.length; i++) {
    rma = alpha * values[i] + (1 - alpha) * rma;
    result[i] = rma;
  }
  return result;
}

/**
 * Computes exact PineScript v6 RSI values
 */
export function calculateRSI(closes: number[], length = 14): number[] {
  const rsi: number[] = new Array(closes.length).fill(NaN);
  if (closes.length <= length) return rsi;

  const gains: number[] = [0];
  const losses: number[] = [0];

  for (let i = 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    gains.push(diff > 0 ? diff : 0);
    losses.push(diff < 0 ? -diff : 0);
  }

  const avgGains = calculateRMA(gains, length);
  const avgLosses = calculateRMA(losses, length);

  for (let i = length; i < closes.length; i++) {
    const avgGain = avgGains[i];
    const avgLoss = avgLosses[i];
    if (isNaN(avgGain) || isNaN(avgLoss)) continue;

    if (avgLoss === 0) {
      rsi[i] = 100;
    } else if (avgGain === 0) {
      rsi[i] = 0;
    } else {
      const rs = avgGain / avgLoss;
      rsi[i] = 100 - (100 / (1 + rs));
    }
  }

  return rsi;
}

/**
 * Computes Simple Moving Average (SMA)
 */
export function calculateSMA(values: (number | null)[], length: number): (number | null)[] {
  const sma: (number | null)[] = new Array(values.length).fill(null);
  let sum = 0;
  let count = 0;

  for (let i = 0; i < values.length; i++) {
    const val = values[i];
    if (val !== null && !isNaN(val)) {
      sum += val;
      count++;
    }

    if (i >= length) {
      const oldVal = values[i - length];
      if (oldVal !== null && !isNaN(oldVal)) {
        sum -= oldVal;
        count--;
      }
    }

    if (count === length) {
      sma[i] = sum / length;
    }
  }

  return sma;
}

/**
 * Computes Bollinger Bands on a series (such as RSI)
 */
export function calculateBollingerBands(
  values: (number | null)[],
  length = 20,
  mult = 2.0
): { upper: (number | null)[]; basis: (number | null)[]; lower: (number | null)[] } {
  const basis = calculateSMA(values, length);
  const upper: (number | null)[] = new Array(values.length).fill(null);
  const lower: (number | null)[] = new Array(values.length).fill(null);

  for (let i = 0; i < values.length; i++) {
    const b = basis[i];
    if (b === null || i < length - 1) continue;

    let sumSq = 0;
    let validCount = 0;
    for (let j = i - length + 1; j <= i; j++) {
      const v = values[j];
      if (v !== null && !isNaN(v)) {
        sumSq += Math.pow(v - b, 2);
        validCount++;
      }
    }

    if (validCount === length) {
      const dev = mult * Math.sqrt(sumSq / length);
      upper[i] = b + dev;
      lower[i] = b - dev;
    }
  }

  return { upper, basis, lower };
}

/**
 * Computes complete indicator series strictly up to bar t without forward bias
 */
export function computePineIndicators(candles: Candle[], params: StrategyParams): IndicatorPoint[] {
  const closes = candles.map(c => c.close);
  const rsi = calculateRSI(closes, params.rsiLength);
  const maRsi = calculateSMA(rsi, params.rsiMaLength);
  const { upper, basis, lower } = calculateBollingerBands(rsi, params.bbLength, params.bbMult);

  const points: IndicatorPoint[] = [];

  for (let i = 0; i < candles.length; i++) {
    const currentRsi = isNaN(rsi[i]) ? null : rsi[i];
    const prevRsi = i > 0 && !isNaN(rsi[i - 1]) ? rsi[i - 1] : null;

    const currentMa = maRsi[i];
    const prevMa = i > 0 ? maRsi[i - 1] : null;

    const up = upper[i];
    const bas = basis[i];
    const low = lower[i];

    let signal: 'long' | 'short' | null = null;
    let exitSignal: 'exit_long' | 'exit_short' | null = null;

    if (
      currentRsi !== null &&
      prevRsi !== null &&
      currentMa !== null &&
      prevMa !== null &&
      up !== null &&
      low !== null
    ) {
      // Pine Script crossover: rsi crosses above ma
      const isCrossOver = prevRsi <= prevMa && currentRsi > currentMa;
      // Pine Script crossunder: rsi crosses below ma
      const isCrossUnder = prevRsi >= prevMa && currentRsi < currentMa;

      const dev = up - (bas || currentRsi);

      // Best practice scalping rules requested by user:
      // Long when RSI crosses over MA and is not excessively overbought
      if (isCrossOver && (currentRsi < 60 || prevRsi < (lower[i - 1] || low) || currentRsi < low + dev * 0.45)) {
        signal = 'long';
      }
      // Short when RSI crosses under MA and is not excessively oversold
      else if (isCrossUnder && (currentRsi > 40 || prevRsi > (upper[i - 1] || up) || currentRsi > up - dev * 0.45)) {
        signal = 'short';
      }

      if (isCrossUnder || currentRsi > up) {
        exitSignal = 'exit_long';
      }
      if (isCrossOver || currentRsi < low) {
        exitSignal = 'exit_short';
      }
    }

    points.push({
      time: candles[i].time,
      rsi: currentRsi,
      maRsi: currentMa,
      bbUpper: up,
      bbBasis: bas,
      bbLower: low,
      signal,
      exitSignal,
    });
  }

  return points;
}

/**
 * Strict Zero-Lookahead Backtesting Engine
 *
 * Rules:
 * 1. Signals generated at bar close 't' can ONLY execute at Open of bar 't + 1'.
 * 2. Future price and future returns are completely invisible at bar 't'.
 * 3. Intrabar High/Low of bar 't + 1' determines Take-Profit / Stop-Loss.
 * 4. Slippage and commission are strictly deducted from equity.
 * 5. Realistic contract margin & leverage for Gold (XAUUSD).
 */
export function runZeroLookaheadBacktest(
  candles: Candle[],
  params: StrategyParams
): BacktestResult {
  if (candles.length < 30) {
    throw new Error('Insufficient candlestick data for backtest (minimum 30 bars required)');
  }

  const indicators = computePineIndicators(candles, params);
  const trades: Trade[] = [];

  let equity = params.initialCapital;
  const equityCurve: { time: number; equity: number; drawdownPercent: number }[] = [
    { time: candles[0].time, equity, drawdownPercent: 0 },
  ];

  let currentTrade: Trade | null = null;
  let peakEquity = equity;
  let maxDrawdown = 0;
  let maxDrawdownPercent = 0;

  const takerFeeRate = (params.commissionPercent || 0.06) / 100;
  const slippageRate = (params.slippagePercent || 0.01) / 100;

  for (let i = 1; i < candles.length; i++) {
    const prevBarIndex = i - 1;
    const currentBar = candles[i];
    const prevSignal = indicators[prevBarIndex].signal;
    const prevExitSignal = indicators[prevBarIndex].exitSignal;

    // ─── 1. EVALUATE EXISTING OPEN POSITION (INTRABAR ON BAR i) ───────
    if (currentTrade) {
      currentTrade.durationBars = (currentTrade.durationBars || 0) + 1;
      const isLong = currentTrade.direction === 'LONG';

      let exitPrice: number | null = null;
      let exitReason: Trade['exitReason'] = undefined;

      const tpTarget = isLong
        ? currentTrade.entryPrice * (1 + params.tpPercent / 100)
        : currentTrade.entryPrice * (1 - params.tpPercent / 100);

      const slTarget = isLong
        ? currentTrade.entryPrice * (1 - params.slPercent / 100)
        : currentTrade.entryPrice * (1 + params.slPercent / 100);

      // Trailing stop updates
      if (params.useTrailing) {
        if (isLong) {
          if (currentBar.high > (currentTrade.highestPrice || currentTrade.entryPrice)) {
            currentTrade.highestPrice = currentBar.high;
          }
          const dynamicTrailSl = (currentTrade.highestPrice || currentTrade.entryPrice) * (1 - params.trailingOffset / 100);
          if (dynamicTrailSl > slTarget && currentBar.low <= dynamicTrailSl) {
            exitPrice = dynamicTrailSl;
            exitReason = 'Trailing Stop';
          }
        } else {
          if (currentBar.low < (currentTrade.lowestPrice || currentTrade.entryPrice)) {
            currentTrade.lowestPrice = currentBar.low;
          }
          const dynamicTrailSl = (currentTrade.lowestPrice || currentTrade.entryPrice) * (1 + params.trailingOffset / 100);
          if (dynamicTrailSl < slTarget && currentBar.high >= dynamicTrailSl) {
            exitPrice = dynamicTrailSl;
            exitReason = 'Trailing Stop';
          }
        }
      }

      // Check standard SL & TP if not already exited by trailing stop
      // Conservative execution: If both TP and SL hit within same bar range, assume SL triggered first!
      if (!exitPrice) {
        if (isLong) {
          if (currentBar.low <= slTarget) {
            exitPrice = slTarget;
            exitReason = 'Stop Loss';
          } else if (currentBar.high >= tpTarget) {
            exitPrice = tpTarget;
            exitReason = 'Take Profit';
          }
        } else {
          if (currentBar.high >= slTarget) {
            exitPrice = slTarget;
            exitReason = 'Stop Loss';
          } else if (currentBar.low <= tpTarget) {
            exitPrice = tpTarget;
            exitReason = 'Take Profit';
          }
        }
      }

      // Signal Reversal exit at bar open
      if (!exitPrice && (
        (isLong && prevSignal === 'short') ||
        (!isLong && prevSignal === 'long') ||
        (isLong && prevExitSignal === 'exit_long') ||
        (!isLong && prevExitSignal === 'exit_short')
      )) {
        exitPrice = currentBar.open;
        exitReason = 'Signal Reversal';
      }

      // If position closed on this bar
      if (exitPrice !== null) {
        const executedExitPrice = isLong
          ? exitPrice * (1 - slippageRate)
          : exitPrice * (1 + slippageRate);

        const priceDiff = isLong
          ? executedExitPrice - currentTrade.entryPrice
          : currentTrade.entryPrice - executedExitPrice;

        const grossPnl = priceDiff * currentTrade.contracts;
        const exitFee = executedExitPrice * currentTrade.contracts * takerFeeRate;
        const netPnl = grossPnl - exitFee - (currentTrade.feePaid || 0);

        currentTrade.exitTime = currentBar.time;
        currentTrade.exitPrice = parseFloat(executedExitPrice.toFixed(2));
        currentTrade.exitBarIndex = i;
        currentTrade.pnl = parseFloat(netPnl.toFixed(2));
        currentTrade.pnlPercent = parseFloat(((netPnl / currentTrade.size) * 100).toFixed(2));
        currentTrade.exitReason = exitReason;

        const riskDollar = currentTrade.size * (params.slPercent / 100);
        currentTrade.rMultiple = riskDollar > 0 ? parseFloat((netPnl / riskDollar).toFixed(2)) : 0;

        equity += netPnl;
        trades.push(currentTrade);
        currentTrade = null;
      }
    }

    // ─── 2. EVALUATE NEW SIGNAL ENTRY (EXECUTES AT CURRENT BAR OPEN) ──
    // Strictly uses signal computed at close of bar i - 1
    if (!currentTrade && prevSignal) {
      const isLong = prevSignal === 'long';
      const rawPrice = currentBar.open;
      const entryPrice = isLong ? rawPrice * (1 + slippageRate) : rawPrice * (1 - slippageRate);

      const positionValue = equity * (params.positionSizePercent / 100) * params.leverage;
      const contracts = parseFloat((positionValue / entryPrice).toFixed(3));
      const entryFee = positionValue * takerFeeRate;

      currentTrade = {
        id: `TRD-${trades.length + 1}-${currentBar.time}`,
        index: trades.length + 1,
        direction: isLong ? 'LONG' : 'SHORT',
        entryTime: currentBar.time,
        entryPrice: parseFloat(entryPrice.toFixed(2)),
        entryBarIndex: i,
        size: parseFloat(positionValue.toFixed(2)),
        contracts,
        feePaid: entryFee,
        highestPrice: entryPrice,
        lowestPrice: entryPrice,
        durationBars: 0,
      };
    }

    // Update drawdown and equity curve
    if (equity > peakEquity) {
      peakEquity = equity;
    }
    const currentDrawdown = peakEquity - equity;
    const currentDrawdownPercent = peakEquity > 0 ? (currentDrawdown / peakEquity) * 100 : 0;

    if (currentDrawdown > maxDrawdown) maxDrawdown = currentDrawdown;
    if (currentDrawdownPercent > maxDrawdownPercent) maxDrawdownPercent = currentDrawdownPercent;

    equityCurve.push({
      time: currentBar.time,
      equity: parseFloat(equity.toFixed(2)),
      drawdownPercent: parseFloat(currentDrawdownPercent.toFixed(2)),
    });
  }

  // If a trade remains open at the end of the data feed
  if (currentTrade) {
    const lastBar = candles[candles.length - 1];
    const isLong = currentTrade.direction === 'LONG';
    const executedExitPrice = lastBar.close;
    const priceDiff = isLong
      ? executedExitPrice - currentTrade.entryPrice
      : currentTrade.entryPrice - executedExitPrice;
    const grossPnl = priceDiff * currentTrade.contracts;
    const exitFee = executedExitPrice * currentTrade.contracts * takerFeeRate;
    const netPnl = grossPnl - exitFee - (currentTrade.feePaid || 0);

    currentTrade.exitTime = lastBar.time;
    currentTrade.exitPrice = parseFloat(executedExitPrice.toFixed(2));
    currentTrade.exitBarIndex = candles.length - 1;
    currentTrade.pnl = parseFloat(netPnl.toFixed(2));
    currentTrade.pnlPercent = parseFloat(((netPnl / currentTrade.size) * 100).toFixed(2));
    currentTrade.exitReason = 'Open';
    trades.push(currentTrade);
  }

  const metrics = calculateMetrics(trades, params.initialCapital, equity, maxDrawdown, maxDrawdownPercent, equityCurve);

  return {
    params,
    metrics,
    trades,
    indicatorPoints: indicators,
  };
}

/**
 * Calculates quantitative performance metrics
 */
export function calculateMetrics(
  trades: Trade[],
  initialCapital: number,
  endingCapital: number,
  maxDrawdown: number,
  maxDrawdownPercent: number,
  equityCurve: { time: number; equity: number; drawdownPercent: number }[]
): BacktestMetrics {
  const totalTrades = trades.length;
  const closedTrades = trades.filter(t => t.exitPrice !== undefined && t.exitReason !== 'Open');
  const winningTrades = closedTrades.filter(t => (t.pnl || 0) > 0);
  const losingTrades = closedTrades.filter(t => (t.pnl || 0) < 0);

  const totalWinPnl = winningTrades.reduce((acc, t) => acc + (t.pnl || 0), 0);
  const totalLossPnl = Math.abs(losingTrades.reduce((acc, t) => acc + (t.pnl || 0), 0));

  const netProfit = endingCapital - initialCapital;
  const netProfitPercent = (netProfit / initialCapital) * 100;
  const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0;
  const profitFactor = totalLossPnl > 0 ? totalWinPnl / totalLossPnl : totalWinPnl > 0 ? 99.9 : 0;

  const averageWin = winningTrades.length > 0 ? totalWinPnl / winningTrades.length : 0;
  const averageLoss = losingTrades.length > 0 ? totalLossPnl / losingTrades.length : 0;
  const winLossRatio = averageLoss > 0 ? averageWin / averageLoss : averageWin > 0 ? 99 : 0;
  const averageTradePnl = closedTrades.length > 0 ? netProfit / closedTrades.length : 0;

  // Consecutive wins & losses
  let maxConsecWins = 0;
  let maxConsecLosses = 0;
  let curWins = 0;
  let curLosses = 0;

  for (const t of closedTrades) {
    if ((t.pnl || 0) > 0) {
      curWins++;
      curLosses = 0;
      if (curWins > maxConsecWins) maxConsecWins = curWins;
    } else {
      curLosses++;
      curWins = 0;
      if (curLosses > maxConsecLosses) maxConsecLosses = curLosses;
    }
  }

  // Sharpe and Sortino computation based on trade returns
  const returns = closedTrades.map(t => (t.pnlPercent || 0) / 100);
  let sharpeRatio = 0;
  let sortinoRatio = 0;

  if (returns.length > 1) {
    const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / (returns.length - 1);
    const stdDev = Math.sqrt(variance);

    const downsideVariance = returns
      .filter(r => r < 0)
      .reduce((sum, r) => sum + Math.pow(r, 2), 0) / Math.max(1, returns.filter(r => r < 0).length);
    const downsideStdDev = Math.sqrt(downsideVariance);

    const annualFactor = Math.sqrt(252 * 24);
    sharpeRatio = stdDev > 0 ? (meanReturn / stdDev) * annualFactor : 0;
    sortinoRatio = downsideStdDev > 0 ? (meanReturn / downsideStdDev) * annualFactor : 0;
  }

  const avgDurationBars = closedTrades.length > 0
    ? closedTrades.reduce((acc, t) => acc + (t.durationBars || 1), 0) / closedTrades.length
    : 0;

  return {
    initialCapital,
    endingCapital: parseFloat(endingCapital.toFixed(2)),
    netProfit: parseFloat(netProfit.toFixed(2)),
    netProfitPercent: parseFloat(netProfitPercent.toFixed(2)),
    totalTrades,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    winRate: parseFloat(winRate.toFixed(2)),
    profitFactor: parseFloat(profitFactor.toFixed(2)),
    maxDrawdown: parseFloat(maxDrawdown.toFixed(2)),
    maxDrawdownPercent: parseFloat(maxDrawdownPercent.toFixed(2)),
    sharpeRatio: parseFloat(sharpeRatio.toFixed(2)),
    sortinoRatio: parseFloat(sortinoRatio.toFixed(2)),
    averageTradePnl: parseFloat(averageTradePnl.toFixed(2)),
    averageWin: parseFloat(averageWin.toFixed(2)),
    averageLoss: parseFloat(averageLoss.toFixed(2)),
    winLossRatio: parseFloat(winLossRatio.toFixed(2)),
    maxConsecutiveWins: maxConsecWins,
    maxConsecutiveLosses: maxConsecLosses,
    averageDurationBars: parseFloat(avgDurationBars.toFixed(1)),
    equityCurve,
  };
}
