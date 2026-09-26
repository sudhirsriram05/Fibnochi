export interface Candle {
  time: number; // Unix timestamp in ms
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type Timeframe = '1' | '3' | '5' | '15' | '30' | '45' | '60' | '120' | '240' | 'D';

export interface TimeframeOption {
  value: Timeframe;
  label: string;
  category: 'Scalping' | 'Intraday' | 'Swing';
}

export interface IndicatorPoint {
  time: number;
  rsi: number | null;
  maRsi: number | null;
  bbUpper: number | null;
  bbBasis: number | null;
  bbLower: number | null;
  signal?: 'long' | 'short' | null;
  exitSignal?: 'exit_long' | 'exit_short' | null;
}

export interface StrategyParams {
  rsiLength: number;
  rsiMaLength: number;
  bbLength: number;
  bbMult: number;
  oversold: number;
  overbought: number;
  tpPercent: number; // e.g. 0.8%
  slPercent: number; // e.g. 0.4%
  useTrailing: boolean;
  trailingOffset: number; // e.g. 0.2%
  initialCapital: number;
  leverage: number;
  positionSizePercent: number;
  commissionPercent: number; // e.g. 0.06% Bybit taker
  slippagePercent: number; // e.g. 0.01%
}

export interface Trade {
  id: string;
  index: number;
  direction: 'LONG' | 'SHORT';
  entryTime: number;
  entryPrice: number;
  entryBarIndex: number;
  exitTime?: number;
  exitPrice?: number;
  exitBarIndex?: number;
  size: number; // contracts or dollar value
  contracts: number; // ounces of gold
  pnl?: number; // dollar net PnL after commissions and slippage
  pnlPercent?: number; // net percentage return
  exitReason?: 'Take Profit' | 'Stop Loss' | 'Trailing Stop' | 'Signal Reversal' | 'Open' | 'Market Close';
  durationBars?: number;
  rMultiple?: number;
  feePaid?: number;
  slippageCost?: number;
  highestPrice?: number;
  lowestPrice?: number;
}

export interface BacktestMetrics {
  initialCapital: number;
  endingCapital: number;
  netProfit: number;
  netProfitPercent: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number; // 0 - 100%
  profitFactor: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  sharpeRatio: number;
  sortinoRatio: number;
  averageTradePnl: number;
  averageWin: number;
  averageLoss: number;
  winLossRatio: number;
  maxConsecutiveWins: number;
  maxConsecutiveLosses: number;
  averageDurationBars: number;
  equityCurve: { time: number; equity: number; drawdownPercent: number }[];
}

export interface BacktestResult {
  params: StrategyParams;
  metrics: BacktestMetrics;
  trades: Trade[];
  indicatorPoints: IndicatorPoint[];
  inSampleMetrics?: BacktestMetrics;
  outOfSampleMetrics?: BacktestMetrics;
}

export interface TickerData {
  symbol: string;
  lastPrice: number;
  bid1Price: number;
  ask1Price: number;
  highPrice24h: number;
  lowPrice24h: number;
  prevPrice24h: number;
  price24hPcnt: number;
  turnover24h: number;
  volume24h: number;
}

export interface LayaAuditAnalysis {
  regime: string;
  overfittingRisk: 'Low' | 'Moderate' | 'High';
  critique: string;
  keyStrengths?: string[];
  riskWarnings?: string[];
  verdict?: 'APPLY_RECOMMENDED' | 'HOLD_CURRENT' | 'FURTHER_TEST';
}
