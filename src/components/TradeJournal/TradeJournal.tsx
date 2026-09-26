import React, { useState, useMemo } from 'react';
import { Trade, BacktestMetrics } from '../../types/trading';
import { Download, ArrowUpRight, ArrowDownRight, Search, Target, ShieldAlert, Clock, BarChart2, Eye } from 'lucide-react';

interface TradeJournalProps {
  trades: Trade[];
  metrics: BacktestMetrics;
  selectedTrade: Trade | null;
  onSelectTrade: (trade: Trade | null) => void;
  yearsSpanned?: number;
}

export const TradeJournal: React.FC<TradeJournalProps> = ({
  trades,
  metrics,
  selectedTrade,
  onSelectTrade,
  yearsSpanned = 2.0,
}) => {
  const [filterType, setFilterType] = useState<'ALL' | 'WINS' | 'LOSSES' | 'LONG' | 'SHORT'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // Filtered trades
  const filteredTrades = useMemo(() => {
    return trades.filter(t => {
      if (filterType === 'WINS' && (t.pnl || 0) <= 0) return false;
      if (filterType === 'LOSSES' && (t.pnl || 0) >= 0) return false;
      if (filterType === 'LONG' && t.direction !== 'LONG') return false;
      if (filterType === 'SHORT' && t.direction !== 'SHORT') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesId = t.id.toLowerCase().includes(q);
        const matchesReason = t.exitReason?.toLowerCase().includes(q) || false;
        const matchesPrice = t.entryPrice.toString().includes(q) || (t.exitPrice?.toString().includes(q) || false);
        return matchesId || matchesReason || matchesPrice;
      }
      return true;
    });
  }, [trades, filterType, searchQuery]);

  // Reset page when filter or search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filterType, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredTrades.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);

  // Slice paginated trades (renders only 50 rows instead of 3,000+ DOM nodes)
  const paginatedTrades = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredTrades.slice(start, start + pageSize);
  }, [filteredTrades, safePage, pageSize]);

  // Export CSV
  const handleExportCSV = () => {
    if (trades.length === 0) return;

    const headers = [
      'Trade Index',
      'Direction',
      'Entry Time (UTC)',
      'Entry Price ($)',
      'Exit Time (UTC)',
      'Exit Price ($)',
      'Contracts (oz)',
      'Position Size ($)',
      'Net PnL ($)',
      'Return (%)',
      'R-Multiple',
      'Exit Reason',
      'Duration (bars)',
    ];

    const rows = trades.map(t => [
      t.index,
      t.direction,
      new Date(t.entryTime).toISOString(),
      t.entryPrice.toFixed(2),
      t.exitTime ? new Date(t.exitTime).toISOString() : 'Open',
      t.exitPrice ? t.exitPrice.toFixed(2) : 'Open',
      t.contracts,
      t.size.toFixed(2),
      t.pnl !== undefined ? t.pnl.toFixed(2) : '0.00',
      t.pnlPercent !== undefined ? `${t.pnlPercent.toFixed(2)}%` : '0.00%',
      t.rMultiple !== undefined ? `${t.rMultiple.toFixed(2)}R` : 'N/A',
      t.exitReason || 'Active',
      t.durationBars || 1,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `XAUUSD_MultiYear_Journal_${yearsSpanned}Yrs_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-full bg-[#0b0f17] border border-slate-800 rounded-lg overflow-hidden">
      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-px bg-slate-800/80 border-b border-slate-800">
        <div className="bg-[#0f172a] p-3">
          <div className="text-[11px] text-slate-400 font-medium">Net Profit ({yearsSpanned} Yrs)</div>
          <div className={`text-base font-mono font-bold mt-0.5 ${(metrics?.netProfit || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {(metrics?.netProfit || 0) >= 0 ? '+' : ''}${(metrics?.netProfit || 0).toLocaleString()}
            <span className="text-xs ml-1 font-normal opacity-80">
              ({(metrics?.netProfitPercent || 0) >= 0 ? '+' : ''}{(metrics?.netProfitPercent || 0).toFixed(1)}%)
            </span>
          </div>
        </div>

        <div className="bg-[#0f172a] p-3">
          <div className="text-[11px] text-slate-400 font-medium">Win Rate</div>
          <div className="text-base font-mono font-bold text-slate-100 mt-0.5">
            {(metrics?.winRate || 0).toFixed(1)}%
            <span className="text-xs text-slate-400 font-normal ml-1">
              ({metrics?.winningTrades || 0}W / {metrics?.losingTrades || 0}L)
            </span>
          </div>
        </div>

        <div className="bg-[#0f172a] p-3">
          <div className="text-[11px] text-slate-400 font-medium">Profit Factor</div>
          <div className={`text-base font-mono font-bold mt-0.5 ${(metrics?.profitFactor || 0) >= 1.5 ? 'text-emerald-400' : 'text-slate-100'}`}>
            {(metrics?.profitFactor || 0).toFixed(2)}
          </div>
        </div>

        <div className="bg-[#0f172a] p-3">
          <div className="text-[11px] text-slate-400 font-medium">Max Drawdown</div>
          <div className="text-base font-mono font-bold text-rose-400 mt-0.5">
            -{(metrics?.maxDrawdownPercent || 0).toFixed(1)}%
            <span className="text-xs text-slate-500 font-normal ml-1">
              (-${(metrics?.maxDrawdown || 0).toFixed(0)})
            </span>
          </div>
        </div>

        <div className="bg-[#0f172a] p-3">
          <div className="text-[11px] text-slate-400 font-medium">Sharpe Ratio</div>
          <div className="text-base font-mono font-bold text-amber-400 mt-0.5">
            {(metrics?.sharpeRatio || 0).toFixed(2)}
          </div>
        </div>

        <div className="bg-[#0f172a] p-3">
          <div className="text-[11px] text-slate-400 font-medium">Avg Win / Loss</div>
          <div className="text-base font-mono font-bold text-slate-100 mt-0.5">
            ${(metrics?.averageWin || 0).toFixed(0)} / ${(metrics?.averageLoss || 0).toFixed(0)}
          </div>
        </div>

        <div className="bg-[#0f172a] p-3">
          <div className="text-[11px] text-slate-400 font-medium">Total Trades</div>
          <div className="text-base font-mono font-bold text-slate-100 mt-0.5 flex items-center justify-between">
            <span>{metrics?.totalTrades || 0}</span>
            <span className="text-[10px] text-slate-400 font-normal">
              Streak: {metrics?.maxConsecutiveWins || 0}W / {metrics?.maxConsecutiveLosses || 0}L
            </span>
          </div>
        </div>
      </div>

      {/* Control & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between p-3 gap-2 bg-[#090d16] border-b border-slate-800">
        <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded border border-slate-800 text-xs">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${
              filterType === 'ALL' ? 'bg-slate-700 text-slate-100' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All ({trades.length})
          </button>
          <button
            onClick={() => setFilterType('WINS')}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${
              filterType === 'WINS' ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/50' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Wins ({metrics.winningTrades})
          </button>
          <button
            onClick={() => setFilterType('LOSSES')}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${
              filterType === 'LOSSES' ? 'bg-rose-950 text-rose-300 border border-rose-700/50' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Losses ({metrics.losingTrades})
          </button>
          <button
            onClick={() => setFilterType('LONG')}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${
              filterType === 'LONG' ? 'bg-slate-700 text-slate-100' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Longs
          </button>
          <button
            onClick={() => setFilterType('SHORT')}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${
              filterType === 'SHORT' ? 'bg-slate-700 text-slate-100' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Shorts
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search trade, price, reason..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded pl-8 pr-3 py-1 text-xs text-slate-200 focus:outline-none focus:border-amber-500 w-48 font-mono"
            />
          </div>

          <button
            onClick={handleExportCSV}
            title="Download CSV Trade Journal"
            className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Trade Log Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left text-xs text-slate-300 font-mono">
          <thead className="bg-[#0f172a] text-[11px] text-slate-400 uppercase sticky top-0 border-b border-slate-800 z-10">
            <tr>
              <th className="py-2.5 px-3">#</th>
              <th className="py-2.5 px-3">Side</th>
              <th className="py-2.5 px-3">Entry Time</th>
              <th className="py-2.5 px-3">Entry ($)</th>
              <th className="py-2.5 px-3">Exit Time</th>
              <th className="py-2.5 px-3">Exit ($)</th>
              <th className="py-2.5 px-3">Contracts</th>
              <th className="py-2.5 px-3">Net PnL ($)</th>
              <th className="py-2.5 px-3">Return %</th>
              <th className="py-2.5 px-3">R:R</th>
              <th className="py-2.5 px-3">Exit Reason</th>
              <th className="py-2.5 px-3">Duration</th>
              <th className="py-2.5 px-3">Chart</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {paginatedTrades.length === 0 ? (
              <tr>
                <td colSpan={13} className="text-center py-10 text-slate-500 font-sans">
                  No trades match the selected filter.
                </td>
              </tr>
            ) : (
              paginatedTrades.map(trade => {
                const isWin = (trade.pnl || 0) > 0;
                const isSelected = selectedTrade?.id === trade.id;

                return (
                  <tr
                    key={trade.id}
                    onClick={() => onSelectTrade(trade)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-amber-500/10 border-l-2 border-l-amber-400'
                        : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="py-2 px-3 text-slate-400 font-medium">#{trade.index}</td>
                    <td className="py-2 px-3">
                      <span
                        className={`inline-flex items-center gap-1 font-semibold ${
                          trade.direction === 'LONG' ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {trade.direction === 'LONG' ? (
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowDownRight className="w-3.5 h-3.5" />
                        )}
                        {trade.direction}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-400">
                      {new Date(trade.entryTime).toLocaleDateString([], { year: '2-digit', month: '2-digit', day: '2-digit' })}{' '}
                      {new Date(trade.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-2 px-3 text-slate-200">${trade.entryPrice.toFixed(2)}</td>
                    <td className="py-2 px-3 text-slate-400">
                      {trade.exitTime ? (
                        <>
                          {new Date(trade.exitTime).toLocaleDateString([], { year: '2-digit', month: '2-digit', day: '2-digit' })}{' '}
                          {new Date(trade.exitTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </>
                      ) : (
                        <span className="text-amber-400 font-sans font-medium animate-pulse">Active</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-slate-200">
                      {trade.exitPrice ? `$${trade.exitPrice.toFixed(2)}` : '—'}
                    </td>
                    <td className="py-2 px-3 text-slate-400">{trade.contracts} oz</td>
                    <td className={`py-2 px-3 font-bold ${isWin ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {trade.pnl !== undefined ? (
                        <>
                          {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className={`py-2 px-3 font-medium ${isWin ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {trade.pnlPercent !== undefined ? (
                        <>
                          {trade.pnlPercent >= 0 ? '+' : ''}{trade.pnlPercent.toFixed(2)}%
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-2 px-3 text-slate-300">
                      {trade.rMultiple !== undefined ? (
                        <span className={trade.rMultiple >= 1.5 ? 'text-amber-400' : ''}>
                          {trade.rMultiple >= 0 ? '+' : ''}{trade.rMultiple.toFixed(1)}R
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-2 px-3">
                      <span className="text-slate-300 flex items-center gap-1.5">
                        {trade.exitReason === 'Take Profit' && <Target className="w-3.5 h-3.5 text-emerald-400" />}
                        {trade.exitReason === 'Stop Loss' && <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />}
                        {trade.exitReason === 'Trailing Stop' && <BarChart2 className="w-3.5 h-3.5 text-amber-400" />}
                        {trade.exitReason || 'Position Open'}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {trade.durationBars || 1} bars
                    </td>
                    <td className="py-2 px-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTrade(trade);
                        }}
                        title="Locate and center on chart"
                        className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-amber-400 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination & Status Footer */}
      <div className="flex flex-wrap items-center justify-between px-3 py-2 bg-[#090d16] border-t border-slate-800 text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <span>
            Showing <strong className="text-slate-200">{filteredTrades.length === 0 ? 0 : (safePage - 1) * pageSize + 1}</strong> - <strong className="text-slate-200">{Math.min(safePage * pageSize, filteredTrades.length)}</strong> of <strong className="text-slate-200">{filteredTrades.length.toLocaleString()}</strong> trades
          </span>
          <div className="flex items-center gap-1.5 ml-2">
            <span className="text-[11px] text-slate-500">Per page:</span>
            {[25, 50, 100].map(sz => (
              <button
                key={sz}
                onClick={() => { setPageSize(sz); setCurrentPage(1); }}
                className={`px-1.5 py-0.5 rounded text-[11px] font-mono transition-colors ${
                  pageSize === sz ? 'bg-amber-500 text-slate-950 font-bold' : 'hover:bg-slate-800 text-slate-400'
                }`}
              >
                {sz}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={safePage <= 1}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
          >
            Previous
          </button>
          <span className="font-mono text-[11px] px-2 text-slate-300">
            Page {safePage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={safePage >= totalPages}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};
