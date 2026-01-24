import { motion } from 'framer-motion';
import { AlertTriangle, TrendingDown, Calendar, BarChart3, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useState, useMemo } from 'react';

// SL発動履歴データの型定義
interface SLEvent {
  date: string;
  month: string;
  symbol: string;
  strategy: string;
  regime: string;
  entry_price: number;
  trigger_price: number;
  drawdown: number;
  weight: number;
  sold_ratio: number;
}

interface SLHistoryData {
  metadata: {
    generated_at: string;
    strategy: string;
    stoploss_threshold: string;
    sell_ratio: string;
    total_events: number;
    simulation_period: string;
  };
  summary: {
    yearly_counts: Record<string, number>;
    monthly_counts: Record<string, number>;
    symbol_counts: Record<string, number>;
  };
  events: SLEvent[];
}

// 静的データ（バックエンドから取得する代わりに直接インポート）
const SL_HISTORY_DATA: SLHistoryData = {
  metadata: {
    generated_at: "2026-01-23T00:54:21.473090",
    strategy: "D3+防御型+SL(個別)",
    stoploss_threshold: "-10.0%",
    sell_ratio: "50.0%",
    total_events: 305,
    simulation_period: "2004-01 to 2025-12"
  },
  summary: {
    yearly_counts: {
      "2005": 8, "2006": 21, "2007": 11, "2008": 11, "2009": 11,
      "2010": 15, "2011": 17, "2012": 16, "2013": 12, "2014": 15,
      "2015": 13, "2016": 11, "2017": 11, "2018": 21, "2019": 8,
      "2020": 16, "2021": 22, "2022": 10, "2023": 19, "2024": 15, "2025": 22
    },
    monthly_counts: {},
    symbol_counts: {
      "ENPH": 18, "AMD": 15, "NVDA": 12, "SMCI": 12, "TSLA": 12,
      "MRNA": 11, "FSLR": 9, "ILMN": 7, "NFLX": 6, "URI": 6
    }
  },
  events: []
};

type ViewMode = 'yearly' | 'symbols';

export function SLHistoryChart() {
  const [viewMode, setViewMode] = useState<ViewMode>('yearly');
  
  const data = SL_HISTORY_DATA;
  
  // 年別データを配列に変換
  const yearlyData = useMemo(() => {
    return Object.entries(data.summary.yearly_counts)
      .map(([year, count]) => ({ year: parseInt(year), count }))
      .sort((a, b) => a.year - b.year);
  }, [data]);
  
  // 銘柄別データを配列に変換（上位10）
  const symbolData = useMemo(() => {
    return Object.entries(data.summary.symbol_counts)
      .map(([symbol, count]) => ({ symbol, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [data]);
  
  // 最大値を取得（バーの高さ計算用）
  const maxYearlyCount = Math.max(...yearlyData.map(d => d.count));
  const maxSymbolCount = Math.max(...symbolData.map(d => d.count));
  
  // 年間平均発動回数
  const avgYearlyCount = yearlyData.reduce((sum, d) => sum + d.count, 0) / yearlyData.length;

  return (
    <Card className="bg-card/50 border-border/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-destructive/10 border border-destructive/30">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold">SL発動履歴</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {data.metadata.simulation_period} | 閾値: {data.metadata.stoploss_threshold}
              </p>
            </div>
          </div>
          
          {/* 表示切替タブ */}
          <div className="flex gap-1 p-1 rounded-lg bg-muted/50 border border-border">
            <button
              onClick={() => setViewMode('yearly')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === 'yearly'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              年別
            </button>
            <button
              onClick={() => setViewMode('symbols')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === 'symbols'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              銘柄別
            </button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-4">
        {/* サマリー統計 */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
            <div className="text-2xl font-bold text-destructive">{data.metadata.total_events}</div>
            <div className="text-xs text-muted-foreground">総発動回数</div>
          </div>
          <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
            <div className="text-2xl font-bold text-amber-400">{avgYearlyCount.toFixed(1)}</div>
            <div className="text-xs text-muted-foreground">年間平均</div>
          </div>
          <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
            <div className="text-2xl font-bold text-foreground">{data.metadata.sell_ratio}</div>
            <div className="text-xs text-muted-foreground">売却比率</div>
          </div>
        </div>
        
        {/* チャート表示 */}
        {viewMode === 'yearly' ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <Info className="w-3.5 h-3.5" />
              <span>年別SL発動回数（-10%以上の下落で発動）</span>
            </div>
            
            {/* 年別バーチャート */}
            <div className="flex items-end gap-1 h-40 px-2">
              {yearlyData.map((item, index) => {
                const height = (item.count / maxYearlyCount) * 100;
                const isHighYear = item.count >= 20;
                
                return (
                  <Tooltip key={item.year}>
                    <TooltipTrigger asChild>
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${height}%` }}
                        transition={{ duration: 0.5, delay: index * 0.02 }}
                        className={`flex-1 rounded-t cursor-pointer transition-opacity hover:opacity-80 ${
                          isHighYear
                            ? 'bg-gradient-to-t from-destructive to-destructive/60'
                            : 'bg-gradient-to-t from-amber-500 to-amber-500/60'
                        }`}
                        style={{ minWidth: '12px' }}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-sm">
                        <div className="font-semibold">{item.year}年</div>
                        <div className="text-muted-foreground">{item.count}回発動</div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
            
            {/* X軸ラベル */}
            <div className="flex justify-between px-2 text-xs text-muted-foreground">
              <span>{yearlyData[0]?.year}</span>
              <span>{yearlyData[Math.floor(yearlyData.length / 2)]?.year}</span>
              <span>{yearlyData[yearlyData.length - 1]?.year}</span>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <TrendingDown className="w-3.5 h-3.5" />
              <span>銘柄別SL発動回数（上位10銘柄）</span>
            </div>
            
            {/* 銘柄別横棒グラフ */}
            <div className="space-y-2">
              {symbolData.map((item, index) => {
                const width = (item.count / maxSymbolCount) * 100;
                
                return (
                  <motion.div
                    key={item.symbol}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-14 text-xs font-mono font-semibold text-foreground">
                      {item.symbol}
                    </div>
                    <div className="flex-1 h-6 bg-muted/30 rounded overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${width}%` }}
                        transition={{ duration: 0.5, delay: index * 0.05 }}
                        className="h-full bg-gradient-to-r from-destructive/80 to-destructive/40 rounded flex items-center justify-end pr-2"
                      >
                        <span className="text-xs font-semibold text-white">{item.count}</span>
                      </motion.div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* 注釈 */}
        <div className="mt-4 pt-4 border-t border-border/50">
          <p className="text-xs text-muted-foreground">
            ※ SL発動時は該当銘柄の50%を現金化し、価格が購入時に回復したタイミングで再購入（個別復帰方式）
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
