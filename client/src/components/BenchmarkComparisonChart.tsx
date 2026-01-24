import { trpc } from "@/lib/trpc";
import { BarChart3, TrendingUp } from "lucide-react";
import { useMemo } from "react";

interface MonthlyData {
  month: string;
  cumReturn: number;
}

export function BenchmarkComparisonChart() {
  const { data: performanceData, isLoading: perfLoading } = trpc.performance.getMonthlyData.useQuery();
  const { data: benchmarkData, isLoading: benchLoading } = trpc.performance.getBenchmark.useQuery();

  const isLoading = perfLoading || benchLoading;

  // チャートデータを準備
  const chartData = useMemo(() => {
    if (!performanceData || !benchmarkData) return null;

    // 全ての月を収集してソート
    const allMonths = new Set<string>();
    performanceData.d2.monthlyData.forEach((m: MonthlyData) => allMonths.add(m.month));
    performanceData.d3.monthlyData.forEach((m: MonthlyData) => allMonths.add(m.month));
    performanceData.defensive.monthlyData.forEach((m: MonthlyData) => allMonths.add(m.month));
    benchmarkData.monthlyData.forEach((m: MonthlyData) => allMonths.add(m.month));

    const sortedMonths = Array.from(allMonths).sort();

    // 各戦略の累積リターンをマップ
    const d2Map = new Map(performanceData.d2.monthlyData.map((m: MonthlyData) => [m.month, m.cumReturn]));
    const d3Map = new Map(performanceData.d3.monthlyData.map((m: MonthlyData) => [m.month, m.cumReturn]));
    const defMap = new Map(performanceData.defensive.monthlyData.map((m: MonthlyData) => [m.month, m.cumReturn]));
    const spyMap = new Map(benchmarkData.monthlyData.map((m: MonthlyData) => [m.month, m.cumReturn]));

    return sortedMonths.map(month => ({
      month,
      d2: d2Map.get(month) ?? null,
      d3: d3Map.get(month) ?? null,
      defensive: defMap.get(month) ?? null,
      spy: spyMap.get(month) ?? null,
    }));
  }, [performanceData, benchmarkData]);

  if (isLoading) {
    return (
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-yellow-500/20">
            <BarChart3 className="w-5 h-5 text-yellow-400" />
          </div>
          <h3 className="text-lg font-semibold">ベンチマーク比較</h3>
        </div>
        <div className="animate-pulse h-64 bg-gray-800 rounded"></div>
      </div>
    );
  }

  if (!chartData || !performanceData || !benchmarkData) {
    return (
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-yellow-500/20">
            <BarChart3 className="w-5 h-5 text-yellow-400" />
          </div>
          <h3 className="text-lg font-semibold">ベンチマーク比較</h3>
        </div>
        <p className="text-gray-500 text-sm">ベンチマークデータを取得できませんでした。</p>
      </div>
    );
  }

  // 最大値と最小値を計算
  const allValues = chartData.flatMap(d => [d.d2, d.d3, d.defensive, d.spy].filter(v => v !== null)) as number[];
  const maxValue = Math.max(...allValues, 0);
  const minValue = Math.min(...allValues, 0);
  const range = maxValue - minValue;

  // SVGチャートの描画
  const width = 800;
  const height = 300;
  const padding = { top: 20, right: 20, bottom: 40, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const xScale = (index: number) => padding.left + (index / (chartData.length - 1)) * chartWidth;
  const yScale = (value: number) => padding.top + chartHeight - ((value - minValue) / range) * chartHeight;

  const createPath = (data: (number | null)[]) => {
    const points = data
      .map((value, index) => (value !== null ? { x: xScale(index), y: yScale(value) } : null))
      .filter(p => p !== null);
    
    if (points.length === 0) return "";
    
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p!.x} ${p!.y}`).join(' ');
  };

  const d2Path = createPath(chartData.map(d => d.d2));
  const d3Path = createPath(chartData.map(d => d.d3));
  const defensivePath = createPath(chartData.map(d => d.defensive));
  const spyPath = createPath(chartData.map(d => d.spy));

  // 超過リターンを計算
  const d2ExcessReturn = performanceData.d2.summary.totalReturn - benchmarkData.summary.totalReturn;
  const d3ExcessReturn = performanceData.d3.summary.totalReturn - benchmarkData.summary.totalReturn;
  const defensiveExcessReturn = performanceData.defensive.summary.totalReturn - benchmarkData.summary.totalReturn;

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-yellow-500/10">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-5 h-5 text-yellow-400" />
          <div>
            <h3 className="font-semibold">ベンチマーク比較（累積リターン）</h3>
            <p className="text-xs text-gray-500">
              各戦略 vs S&P500 ETF (SPY)
              {chartData && chartData.length > 0 && (
                <span className="ml-2">
                  （{chartData[0].month.replace('-', '年').replace(/-(\d+)$/, '月')}〜{chartData[chartData.length - 1].month.replace('-', '年').replace(/-(\d+)$/, '月')}、{chartData.length}ヶ月）
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-emerald-400"></div>
            <span className="text-gray-400">D2</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-cyan-400"></div>
            <span className="text-gray-400">D3</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-blue-400"></div>
            <span className="text-gray-400">防御型</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-yellow-400"></div>
            <span className="text-gray-400">SPY</span>
          </div>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="p-4">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-64">
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map(pct => {
            const value = minValue + (range * pct) / 100;
            const y = yScale(value);
            return (
              <g key={pct}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#374151"
                  strokeDasharray="4,4"
                />
                <text
                  x={padding.left - 10}
                  y={y}
                  textAnchor="end"
                  dominantBaseline="middle"
                  className="fill-gray-500 text-xs"
                >
                  {value.toFixed(0)}%
                </text>
              </g>
            );
          })}

          {/* Zero line */}
          {minValue < 0 && maxValue > 0 && (
            <line
              x1={padding.left}
              y1={yScale(0)}
              x2={width - padding.right}
              y2={yScale(0)}
              stroke="#6b7280"
              strokeWidth={1}
            />
          )}

          {/* Lines */}
          <path d={spyPath} fill="none" stroke="#facc15" strokeWidth={2} opacity={0.8} />
          <path d={defensivePath} fill="none" stroke="#3b82f6" strokeWidth={2} />
          <path d={d2Path} fill="none" stroke="#10b981" strokeWidth={2} />
          <path d={d3Path} fill="none" stroke="#06b6d4" strokeWidth={2} />

          {/* X-axis labels */}
          {chartData.filter((_, i) => i % 6 === 0 || i === chartData.length - 1).map((d, i, arr) => {
            const index = chartData.indexOf(d);
            return (
              <text
                key={d.month}
                x={xScale(index)}
                y={height - 10}
                textAnchor="middle"
                className="fill-gray-500 text-xs"
              >
                {d.month.slice(2)}
              </text>
            );
          })}
        </svg>
      </div>

      {/* Excess Return Summary */}
      <div className="p-4 border-t border-gray-800 bg-gray-800/30">
        <p className="text-xs text-gray-500 mb-3">対SPY超過リターン（累計）</p>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">D2 (S&P100)</p>
            <p className={`text-lg font-mono font-bold ${d2ExcessReturn >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {d2ExcessReturn >= 0 ? '+' : ''}{d2ExcessReturn.toFixed(1)}%
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">D3 (S&P500)</p>
            <p className={`text-lg font-mono font-bold ${d3ExcessReturn >= 0 ? 'text-cyan-400' : 'text-red-400'}`}>
              {d3ExcessReturn >= 0 ? '+' : ''}{d3ExcessReturn.toFixed(1)}%
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">防御型</p>
            <p className={`text-lg font-mono font-bold ${defensiveExcessReturn >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
              {defensiveExcessReturn >= 0 ? '+' : ''}{defensiveExcessReturn.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
