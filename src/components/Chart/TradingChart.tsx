import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Candle, IndicatorPoint, Trade } from '../../types/trading';
import { ZoomIn, ZoomOut, RotateCcw, Eye, EyeOff, Layers, Target, Compass } from 'lucide-react';

interface TradingChartProps {
  candles: Candle[];
  indicatorPoints: IndicatorPoint[];
  trades: Trade[];
  selectedTrade: Trade | null;
  onSelectTrade?: (trade: Trade | null) => void;
  symbol?: string;
  timeframe?: string;
  yearsSpanned?: number;
}

export const TradingChart: React.FC<TradingChartProps> = ({
  candles,
  indicatorPoints,
  trades,
  selectedTrade,
  onSelectTrade,
  symbol = 'XAUUSDT (Gold)',
  timeframe = '1h',
  yearsSpanned = 2.0,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Viewport / Zoom & Pan state
  const [visibleCount, setVisibleCount] = useState<number>(100);
  const [scrollOffset, setScrollOffset] = useState<number>(0); // 0 = anchored to right (latest)
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStartX, setDragStartX] = useState<number>(0);
  const [dragStartOffset, setDragStartOffset] = useState<number>(0);
  const [showIndicators, setShowIndicators] = useState<boolean>(true);
  const [showVolume, setShowVolume] = useState<boolean>(true);
  const animFrameRef = useRef<number | null>(null);

  // Auto-pan to selected trade if selected in Trade Journal
  useEffect(() => {
    if (selectedTrade && selectedTrade.entryBarIndex !== undefined && candles.length > 0) {
      const targetIndex = selectedTrade.entryBarIndex;
      const targetOffset = Math.max(0, candles.length - 1 - targetIndex - Math.floor(visibleCount / 2));
      setScrollOffset(targetOffset);
    }
  }, [selectedTrade, candles.length, visibleCount]);

  // Window slice calculation
  const { startIndex, endIndex, visibleCandles, visibleIndicators } = useMemo(() => {
    const total = candles.length;
    if (total === 0) {
      return { startIndex: 0, endIndex: 0, visibleCandles: [], visibleIndicators: [] };
    }
    const safeVisible = Math.min(Math.max(15, visibleCount), total);
    const end = Math.max(safeVisible, total - scrollOffset);
    const start = Math.max(0, end - safeVisible);

    return {
      startIndex: start,
      endIndex: end,
      visibleCandles: candles.slice(start, end),
      visibleIndicators: indicatorPoints.slice(start, end),
    };
  }, [candles, indicatorPoints, visibleCount, scrollOffset]);

  // Pre-filter trades for currently visible viewport only (prevents looping 3,000+ trades on each frame)
  const visibleTrades = useMemo(() => {
    if (trades.length === 0 || visibleCandles.length === 0) return [];
    return trades.filter(trade =>
      (trade.entryBarIndex >= startIndex && trade.entryBarIndex < endIndex) ||
      (trade.exitBarIndex !== undefined && trade.exitBarIndex >= startIndex && trade.exitBarIndex < endIndex)
    );
  }, [trades, startIndex, endIndex, visibleCandles.length]);

  // Canvas drawing loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    if (width === 0 || height === 0) return;

    const targetW = Math.floor(width * dpr);
    const targetH = Math.floor(height * dpr);
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    // Layout partitioning: 68% for price candles, 32% for RSI BB indicator
    const pricePaneHeight = Math.floor(height * (showIndicators ? 0.68 : 0.96));
    const indicatorPaneTop = pricePaneHeight + 10;
    const indicatorPaneHeight = height - indicatorPaneTop - 25;

    // Background
    ctx.fillStyle = '#0b0f17';
    ctx.fillRect(0, 0, width, height);

    if (visibleCandles.length === 0) {
      ctx.fillStyle = '#64748b';
      ctx.font = '14px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Gathering multi-year historical Gold data from Bybit...', width / 2, height / 2);
      return;
    }

    // Min and Max prices for visible candles
    let minPrice = Infinity;
    let maxPrice = -Infinity;
    let maxVol = 0;

    for (const c of visibleCandles) {
      if (c.low < minPrice) minPrice = c.low;
      if (c.high > maxPrice) maxPrice = c.high;
      if (c.volume > maxVol) maxVol = c.volume;
    }

    // Padding to price scale (3%)
    const pricePadding = (maxPrice - minPrice) * 0.05 || 1;
    minPrice -= pricePadding;
    maxPrice += pricePadding;
    const priceRange = maxPrice - minPrice;

    // Coordinate transforms
    const rightMargin = 75;
    const chartWidth = width - rightMargin;
    const barWidth = chartWidth / visibleCandles.length;
    const candleBodyWidth = Math.max(1, Math.min(barWidth * 0.72, 22));

    const getYPrice = (price: number) => {
      const normalized = (maxPrice - price) / priceRange;
      return 15 + normalized * (pricePaneHeight - 35);
    };

    const getXBar = (idx: number) => {
      return idx * barWidth + barWidth / 2;
    };

    // ─── 1. DRAW PRICE PANE GRID & AXIS ─────────────────────────────
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;

    const priceSteps = 6;
    for (let i = 0; i <= priceSteps; i++) {
      const p = minPrice + (priceRange * i) / priceSteps;
      const y = getYPrice(p);

      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(chartWidth, y);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '11px JetBrains Mono, monospace';
      ctx.textAlign = 'left';
      ctx.fillText(p.toFixed(2), chartWidth + 6, y + 4);
    }

    ctx.beginPath();
    ctx.moveTo(chartWidth, 0);
    ctx.lineTo(chartWidth, height);
    ctx.stroke();

    // ─── 2. DRAW VOLUME BARS ────────────────────────────────────────
    if (showVolume && maxVol > 0) {
      const volMaxHeight = pricePaneHeight * 0.20;
      for (let i = 0; i < visibleCandles.length; i++) {
        const c = visibleCandles[i];
        const x = getXBar(i);
        const vHeight = (c.volume / maxVol) * volMaxHeight;
        const y = pricePaneHeight - vHeight;
        const isUp = c.close >= c.open;

        ctx.fillStyle = isUp ? 'rgba(16, 185, 129, 0.18)' : 'rgba(239, 68, 68, 0.18)';
        ctx.fillRect(x - candleBodyWidth / 2, y, candleBodyWidth, vHeight);
      }
    }

    // ─── 3. DRAW CANDLESTICKS ───────────────────────────────────────
    for (let i = 0; i < visibleCandles.length; i++) {
      const c = visibleCandles[i];
      const x = getXBar(i);
      const isUp = c.close >= c.open;

      const yOpen = getYPrice(c.open);
      const yClose = getYPrice(c.close);
      const yHigh = getYPrice(c.high);
      const yLow = getYPrice(c.low);

      const color = isUp ? '#10b981' : '#ef4444';
      ctx.strokeStyle = color;
      ctx.fillStyle = color;

      ctx.lineWidth = Math.max(1, candleBodyWidth > 8 ? 1.5 : 1);
      ctx.beginPath();
      ctx.moveTo(x, yHigh);
      ctx.lineTo(x, yLow);
      ctx.stroke();

      const bodyTop = Math.min(yOpen, yClose);
      const bodyHeight = Math.max(2, Math.abs(yClose - yOpen));
      ctx.fillRect(x - candleBodyWidth / 2, bodyTop, candleBodyWidth, bodyHeight);
    }

    // ─── 4. DRAW TRADES (EXACT ENTRY & EXIT VISUALIZATION) ───────────
    for (const trade of visibleTrades) {
      const isLong = trade.direction === 'LONG';
      const isWin = (trade.pnl || 0) > 0;

      // Draw Entry Marker
      if (trade.entryBarIndex >= startIndex && trade.entryBarIndex < endIndex) {
        const relIdx = trade.entryBarIndex - startIndex;
        const x = getXBar(relIdx);
        const y = getYPrice(trade.entryPrice);

        ctx.fillStyle = isLong ? '#22c55e' : '#f97316';
        ctx.beginPath();
        if (isLong) {
          ctx.moveTo(x, y + 16);
          ctx.lineTo(x - 6, y + 26);
          ctx.lineTo(x + 6, y + 26);
        } else {
          ctx.moveTo(x, y - 16);
          ctx.lineTo(x - 6, y - 26);
          ctx.lineTo(x + 6, y - 26);
        }
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = isLong ? '#4ade80' : '#fb923c';
        ctx.font = 'bold 10px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(
          `${isLong ? '▲ BUY' : '▼ SELL'}`,
          x,
          isLong ? y + 36 : y - 30
        );

        if (selectedTrade?.id === trade.id) {
          ctx.strokeStyle = '#eab308';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(x, y, 9, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // Draw Exit Marker
      if (trade.exitBarIndex !== undefined && trade.exitBarIndex >= startIndex && trade.exitBarIndex < endIndex) {
        const relIdx = trade.exitBarIndex - startIndex;
        const x = getXBar(relIdx);
        const y = getYPrice(trade.exitPrice || trade.entryPrice);

        ctx.fillStyle = isWin ? '#10b981' : '#ef4444';
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.fillStyle = isWin ? '#34d399' : '#f87171';
        ctx.font = '9px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        const pnlText = `${isWin ? '+' : ''}$${trade.pnl?.toFixed(1) || '0'}`;
        ctx.fillText(pnlText, x, y - 8);

        // Connect entry to exit
        if (trade.entryBarIndex >= startIndex && trade.entryBarIndex < endIndex) {
          const entryX = getXBar(trade.entryBarIndex - startIndex);
          const entryY = getYPrice(trade.entryPrice);
          ctx.save();
          ctx.setLineDash([3, 3]);
          ctx.strokeStyle = isWin ? 'rgba(52, 211, 153, 0.45)' : 'rgba(239, 68, 68, 0.45)';
          ctx.beginPath();
          ctx.moveTo(entryX, entryY);
          ctx.lineTo(x, y);
          ctx.stroke();
          ctx.restore();
        }
      }
    }

    // ─── 5. DRAW RSI BOLLINGER BANDS SUB-PANE ───────────────────────
    if (showIndicators) {
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, pricePaneHeight);
      ctx.lineTo(width, pricePaneHeight);
      ctx.stroke();

      ctx.fillStyle = '#080c14';
      ctx.fillRect(0, indicatorPaneTop, chartWidth, indicatorPaneHeight);

      const rsiMin = 10;
      const rsiMax = 90;
      const rsiRange = rsiMax - rsiMin;

      const getYRsi = (val: number) => {
        const clamped = Math.max(rsiMin, Math.min(rsiMax, val));
        const normalized = (rsiMax - clamped) / rsiRange;
        return indicatorPaneTop + normalized * indicatorPaneHeight;
      };

      const levels = [
        { val: 70, label: '70 OB', color: 'rgba(239, 68, 68, 0.4)' },
        { val: 50, label: '50', color: 'rgba(148, 163, 184, 0.25)' },
        { val: 30, label: '30 OS', color: 'rgba(16, 185, 129, 0.4)' },
      ];

      for (const lvl of levels) {
        const y = getYRsi(lvl.val);
        ctx.save();
        ctx.strokeStyle = lvl.color;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(chartWidth, y);
        ctx.stroke();
        ctx.restore();

        ctx.fillStyle = '#64748b';
        ctx.font = '10px JetBrains Mono, monospace';
        ctx.textAlign = 'left';
        ctx.fillText(lvl.label, chartWidth + 6, y + 3);
      }

      // Fill Bollinger Bands Envelope
      ctx.beginPath();
      let hasStarted = false;
      for (let i = 0; i < visibleIndicators.length; i++) {
        const ind = visibleIndicators[i];
        if (ind && ind.bbUpper !== null && ind.bbUpper !== undefined) {
          const x = getXBar(i);
          const y = getYRsi(ind.bbUpper);
          if (!hasStarted) { ctx.moveTo(x, y); hasStarted = true; } else { ctx.lineTo(x, y); }
        }
      }
      for (let i = visibleIndicators.length - 1; i >= 0; i--) {
        const ind = visibleIndicators[i];
        if (ind && ind.bbLower !== null && ind.bbLower !== undefined) {
          const x = getXBar(i);
          const y = getYRsi(ind.bbLower);
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.fillStyle = 'rgba(139, 92, 246, 0.08)';
      ctx.fill();

      // Upper BB
      ctx.strokeStyle = 'rgba(244, 63, 94, 0.7)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      hasStarted = false;
      for (let i = 0; i < visibleIndicators.length; i++) {
        const ind = visibleIndicators[i];
        if (ind && ind.bbUpper !== null && ind.bbUpper !== undefined) {
          const x = getXBar(i);
          const y = getYRsi(ind.bbUpper);
          if (!hasStarted) { ctx.moveTo(x, y); hasStarted = true; } else { ctx.lineTo(x, y); }
        }
      }
      ctx.stroke();

      // Lower BB
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.7)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      hasStarted = false;
      for (let i = 0; i < visibleIndicators.length; i++) {
        const ind = visibleIndicators[i];
        if (ind && ind.bbLower !== null && ind.bbLower !== undefined) {
          const x = getXBar(i);
          const y = getYRsi(ind.bbLower);
          if (!hasStarted) { ctx.moveTo(x, y); hasStarted = true; } else { ctx.lineTo(x, y); }
        }
      }
      ctx.stroke();

      // BB Basis
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      hasStarted = false;
      for (let i = 0; i < visibleIndicators.length; i++) {
        const ind = visibleIndicators[i];
        if (ind && ind.bbBasis !== null && ind.bbBasis !== undefined) {
          const x = getXBar(i);
          const y = getYRsi(ind.bbBasis);
          if (!hasStarted) { ctx.moveTo(x, y); hasStarted = true; } else { ctx.lineTo(x, y); }
        }
      }
      ctx.stroke();

      // RSI Moving Average (Cyan)
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      hasStarted = false;
      for (let i = 0; i < visibleIndicators.length; i++) {
        const ind = visibleIndicators[i];
        if (ind && ind.maRsi !== null && ind.maRsi !== undefined) {
          const x = getXBar(i);
          const y = getYRsi(ind.maRsi);
          if (!hasStarted) { ctx.moveTo(x, y); hasStarted = true; } else { ctx.lineTo(x, y); }
        }
      }
      ctx.stroke();

      // RSI Line (Purple)
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 2;
      ctx.beginPath();
      hasStarted = false;
      for (let i = 0; i < visibleIndicators.length; i++) {
        const ind = visibleIndicators[i];
        if (ind && ind.rsi !== null && ind.rsi !== undefined) {
          const x = getXBar(i);
          const y = getYRsi(ind.rsi);
          if (!hasStarted) { ctx.moveTo(x, y); hasStarted = true; } else { ctx.lineTo(x, y); }
        }
      }
      ctx.stroke();

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('RSI (14) + BB (20, 2.0) + MA (6)', 12, indicatorPaneTop + 14);
    }

    // ─── 6. TIME AXIS (BOTTOM) ──────────────────────────────────────
    const bottomAxisY = height - 10;
    ctx.fillStyle = '#64748b';
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.textAlign = 'center';

    const timeStep = Math.max(1, Math.floor(visibleCandles.length / 6));
    for (let i = 0; i < visibleCandles.length; i += timeStep) {
      const c = visibleCandles[i];
      const x = getXBar(i);
      const d = new Date(c.time);
      const timeStr = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
      const dateStr = `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
      ctx.fillText(`${dateStr} ${timeStr}`, x, bottomAxisY);
    }

    // ─── 7. INTERACTIVE CROSSHAIR & HOVER HUD ────────────────────────
    if (mousePos && hoverIndex !== null && hoverIndex >= 0 && hoverIndex < visibleCandles.length) {
      const c = visibleCandles[hoverIndex];
      const ind = visibleIndicators[hoverIndex];
      const x = getXBar(hoverIndex);

      ctx.save();
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = '#64748b';
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();

      if (mousePos.y <= pricePaneHeight) {
        ctx.beginPath();
        ctx.moveTo(0, mousePos.y);
        ctx.lineTo(chartWidth, mousePos.y);
        ctx.stroke();

        const cursorPrice = maxPrice - ((mousePos.y - 15) / (pricePaneHeight - 35)) * priceRange;
        ctx.fillStyle = '#334155';
        ctx.fillRect(chartWidth + 1, mousePos.y - 9, rightMargin - 2, 18);
        ctx.fillStyle = '#f8fafc';
        ctx.font = '10px JetBrains Mono, monospace';
        ctx.textAlign = 'left';
        ctx.fillText(cursorPrice.toFixed(2), chartWidth + 6, mousePos.y + 4);
      }
      ctx.restore();

      const d = new Date(c.time);
      const hudDate = `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      const isUp = c.close >= c.open;
      const change = c.close - c.open;
      const changePct = ((change / c.open) * 100).toFixed(2);

      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      ctx.fillRect(8, 8, chartWidth - 16, 26);
      ctx.strokeStyle = '#1e293b';
      ctx.strokeRect(8, 8, chartWidth - 16, 26);

      ctx.font = '11px JetBrains Mono, monospace';
      ctx.textAlign = 'left';

      let hudX = 16;
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`${symbol} · ${timeframe} · ${hudDate}`, hudX, 25);

      hudX += 260;
      ctx.fillStyle = '#94a3b8'; ctx.fillText('O:', hudX, 25);
      ctx.fillStyle = '#f8fafc'; ctx.fillText(c.open.toFixed(2), hudX + 16, 25);

      hudX += 75;
      ctx.fillStyle = '#94a3b8'; ctx.fillText('H:', hudX, 25);
      ctx.fillStyle = '#f8fafc'; ctx.fillText(c.high.toFixed(2), hudX + 16, 25);

      hudX += 75;
      ctx.fillStyle = '#94a3b8'; ctx.fillText('L:', hudX, 25);
      ctx.fillStyle = '#f8fafc'; ctx.fillText(c.low.toFixed(2), hudX + 16, 25);

      hudX += 75;
      ctx.fillStyle = '#94a3b8'; ctx.fillText('C:', hudX, 25);
      ctx.fillStyle = isUp ? '#22c55e' : '#ef4444';
      ctx.fillText(`${c.close.toFixed(2)} (${isUp ? '+' : ''}${changePct}%)`, hudX + 16, 25);

      if (ind && ind.rsi !== null) {
        hudX += 135;
        ctx.fillStyle = '#a855f7';
        ctx.fillText(`RSI: ${ind.rsi.toFixed(1)}`, hudX, 25);

        if (ind.maRsi !== null) {
          hudX += 75;
          ctx.fillStyle = '#06b6d4';
          ctx.fillText(`MA: ${ind.maRsi.toFixed(1)}`, hudX, 25);
        }
      }
    }
  }, [
    visibleCandles,
    visibleIndicators,
    visibleTrades,
    selectedTrade,
    mousePos,
    hoverIndex,
    showIndicators,
    showVolume,
    symbol,
    timeframe,
    startIndex,
    endIndex,
  ]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
    }

    animFrameRef.current = requestAnimationFrame(() => {
      animFrameRef.current = null;
      setMousePos({ x, y });

      if (isDragging) {
        const deltaX = x - dragStartX;
        const barWidth = (rect.width - 75) / visibleCount;
        const barsMoved = Math.round(deltaX / barWidth);
        const newOffset = Math.max(0, Math.min(candles.length - visibleCount, dragStartOffset + barsMoved));
        setScrollOffset(newOffset);
        return;
      }

      const chartWidth = rect.width - 75;
      if (x >= 0 && x <= chartWidth && visibleCandles.length > 0) {
        const barWidth = chartWidth / visibleCandles.length;
        const idx = Math.floor(x / barWidth);
        setHoverIndex(Math.max(0, Math.min(visibleCandles.length - 1, idx)));
      } else {
        setHoverIndex(null);
      }
    });
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStartX(e.clientX - (canvasRef.current?.getBoundingClientRect().left || 0));
    setDragStartOffset(scrollOffset);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    setMousePos(null);
    setHoverIndex(null);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 1.15 : 0.85;
    const newCount = Math.round(visibleCount * zoomFactor);
    setVisibleCount(Math.min(Math.max(20, newCount), candles.length));
  };

  const resetZoom = () => {
    setVisibleCount(100);
    setScrollOffset(0);
    onSelectTrade?.(null);
  };

  const zoomIn = () => {
    setVisibleCount(prev => Math.max(20, Math.round(prev * 0.8)));
  };

  const zoomOut = () => {
    setVisibleCount(prev => Math.min(candles.length, Math.round(prev * 1.25)));
  };

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col w-full h-full bg-[#0b0f17] border border-slate-800 rounded-lg overflow-hidden select-none"
    >
      {/* Chart Top Quick Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#0f172a] border-b border-slate-800 text-xs text-slate-300">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-amber-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            {symbol}
          </span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400 font-mono">Bybit Linear Perpetual</span>
          <span className="text-slate-500">·</span>
          <span className="text-emerald-400 font-mono font-medium">
            {timeframe} ({yearsSpanned.toFixed(1)} Yrs Data)
          </span>
          <span className="text-slate-500">·</span>
          <span className="text-slate-400 font-mono text-[11px] hidden sm:inline">
            {candles.length.toLocaleString()} Bars Loaded
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowIndicators(p => !p)}
            title="Toggle RSI Bollinger Bands Subchart"
            className={`px-2 py-1 flex items-center gap-1 rounded text-xs transition-colors ${
              showIndicators ? 'bg-violet-950/70 text-violet-300 border border-violet-700/50' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>RSI BB v6</span>
          </button>

          <button
            onClick={() => setShowVolume(p => !p)}
            title="Toggle Volume Bars"
            className={`px-2 py-1 flex items-center gap-1 rounded text-xs transition-colors ${
              showVolume ? 'bg-slate-800 text-slate-200' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {showVolume ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>Vol</span>
          </button>

          <div className="w-[1px] h-4 bg-slate-800 mx-1"></div>

          <button
            onClick={zoomIn}
            title="Zoom In"
            className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition-colors"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={zoomOut}
            title="Zoom Out"
            className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition-colors"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={resetZoom}
            title="Reset View"
            className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Canvas Chart Area */}
      <div className="relative flex-1 w-full overflow-hidden cursor-crosshair">
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onWheel={handleWheel}
          className="w-full h-full block"
        />

        {/* Legend Overlay at bottom-left */}
        <div className="absolute bottom-6 left-3 pointer-events-none flex items-center gap-3 text-[10px] text-slate-400 bg-slate-900/80 px-2 py-1 rounded border border-slate-800 backdrop-blur-sm">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-sm inline-block"></span>
            <span>Bullish Scalp Entry</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 bg-rose-500 rounded-sm inline-block"></span>
            <span>Bearish Scalp Entry</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-0.5 bg-violet-400 inline-block"></span>
            <span>RSI Line</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-0.5 bg-cyan-400 inline-block"></span>
            <span>RSI MA</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-1.5 bg-violet-500/30 border border-violet-400 inline-block"></span>
            <span>BB Cloud</span>
          </div>
        </div>
      </div>
    </div>
  );
};
