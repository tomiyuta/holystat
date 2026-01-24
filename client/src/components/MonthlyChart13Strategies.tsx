/**
 * 13戦略月次累積リターンチャート
 * Performance.tsxのSVGチャート形式を採用
 * 
 * 機能:
 * - 経済危機の背景シェード（リーマン、欧州債務、中国、コロナ、2022年弱気相場）
 * - Bear期間の赤シェード
 * - Bull/Bear転換マーカー（緑↑/赤↓）
 * - 対数/線形スケール切替
 * - ホバー時のツールチップ（全13戦略の値を表示）
 * - インタラクティブ凡例（クリックで表示/非表示切替）
 */

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  monthlyChartData13Strategies,
  economicCrises13,
  regimeSwitches13,
  type MonthlyDataPoint,
} from '@/data/monthlyChartData13Strategies';

// 戦略設定
const STRATEGY_CONFIGS = [
  { key: 'D2' as const, name: 'D2', color: '#F97316', strokeWidth: 2 },
  { key: 'D3' as const, name: 'D3', color: '#FF8C00', strokeWidth: 2 },
  { key: '防御型TOP5' as const, name: '防御型TOP5', color: '#64748B', strokeWidth: 1.5 },
  { key: '防御型TOP3' as const, name: '防御型TOP3', color: '#94A3B8', strokeWidth: 1.5 },
  { key: 'D2+防御型' as const, name: 'D2+防御型', color: '#60A5FA', strokeWidth: 2 },
  { key: 'D3+防御型' as const, name: 'D3+防御型', color: '#3B82F6', strokeWidth: 2.5 },
  { key: 'SPY' as const, name: 'SPY', color: '#6B7280', strokeWidth: 1.5 },
  { key: 'D2_VolScale' as const, name: 'D2_VolScale', color: '#C084FC', strokeWidth: 2 },
  { key: 'D3_VolScale' as const, name: 'D3_VolScale', color: '#8B5CF6', strokeWidth: 2 },
  { key: '防御型TOP5_VolScale' as const, name: '防御型TOP5_VolScale', color: '#7C3AED', strokeWidth: 1.5 },
  { key: '防御型TOP3_VolScale' as const, name: '防御型TOP3_VolScale', color: '#A78BFA', strokeWidth: 1.5 },
  { key: 'D2+防御型_VolScale' as const, name: 'D2+防御型_VolScale', color: '#34D399', strokeWidth: 2 },
  { key: 'D3+防御型_VolScale' as const, name: 'D3+防御型_VolScale', color: '#10B981', strokeWidth: 2.5 },
];

type StrategyKey = typeof STRATEGY_CONFIGS[number]['key'];

// 対数スケール変換
const toLogScale = (value: number): number => {
  if (value <= 0) return 0;
  return Math.log10(value + 100);
};

interface HoveredPoint {
  month: string;
  data: MonthlyDataPoint;
  index: number;
}

export function MonthlyChart13Strategies() {
  const [useLogScale, setUseLogScale] = useState(true);
  const [hoveredPoint, setHoveredPoint] = useState<HoveredPoint | null>(null);
  const [visibleSeries, setVisibleSeries] = useState<Record<StrategyKey, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    STRATEGY_CONFIGS.forEach(c => {
      // 主要戦略のみデフォルト表示
      initial[c.key] = ['D3', 'D3+防御型', 'D3+防御型_VolScale', 'SPY'].includes(c.key);
    });
    return initial as Record<StrategyKey, boolean>;
  });

  // チャートサイズ
  const chartWidth = 1200;
  const chartHeight = 500;
  const padding = { top: 40, right: 30, bottom: 60, left: 70 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  // スケール計算
  const { minValue, maxValue, xScale, yScale } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;

    monthlyChartData13Strategies.forEach((d) => {
      STRATEGY_CONFIGS.forEach(({ key }) => {
        if (visibleSeries[key]) {
          const value = d[key];
          if (value !== undefined && value < min) min = value;
          if (value !== undefined && value > max) max = value;
        }
      });
    });

    min = Math.min(min, 50);
    max = max * 1.1;

    const xScale = (index: number) =>
      padding.left + (index / (monthlyChartData13Strategies.length - 1)) * innerWidth;

    const yScale = (value: number) => {
      if (useLogScale) {
        const logMin = toLogScale(min);
        const logMax = toLogScale(max);
        const logValue = toLogScale(value);
        return padding.top + innerHeight - ((logValue - logMin) / (logMax - logMin)) * innerHeight;
      } else {
        return padding.top + innerHeight - ((value - min) / (max - min)) * innerHeight;
      }
    };

    return { minValue: min, maxValue: max, xScale, yScale };
  }, [visibleSeries, useLogScale, innerWidth, innerHeight]);

  // パスを生成
  const generatePath = (key: StrategyKey) => {
    return monthlyChartData13Strategies
      .filter((d) => d[key] !== undefined)
      .map((d, i, arr) => {
        const originalIndex = monthlyChartData13Strategies.indexOf(d);
        const x = xScale(originalIndex);
        const y = yScale(d[key] as number);
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  };

  // Y軸の目盛りを生成
  const yTicks = useMemo(() => {
    if (useLogScale) {
      const ticks = [100, 500, 1000, 2000, 5000, 10000, 20000, 50000];
      return ticks.filter((t) => t >= minValue && t <= maxValue);
    } else {
      const tickCount = 5;
      const range = maxValue - minValue;
      const step = range / tickCount;
      return Array.from({ length: tickCount + 1 }, (_, i) => Math.round(minValue + step * i));
    }
  }, [minValue, maxValue, useLogScale]);

  // X軸の目盛り（年単位）
  const xTicks = useMemo(() => {
    const years = Array.from(new Set(monthlyChartData13Strategies.map((d) => d.month.substring(0, 4))));
    return years.filter((_, i) => i % 2 === 0);
  }, []);

  // レジーム切り替えの位置を計算
  const regimeSwitchPositions = useMemo(() => {
    return regimeSwitches13.map((s) => {
      const index = monthlyChartData13Strategies.findIndex((d) => d.month === s.month);
      if (index === -1) return null;
      return {
        ...s,
        x: xScale(index),
        index,
      };
    }).filter(Boolean) as (typeof regimeSwitches13[0] & { x: number; index: number })[];
  }, [xScale]);

  // Bear期間の背景を生成
  const bearPeriods = useMemo(() => {
    const periods: { startX: number; endX: number }[] = [];
    let currentBearStart: number | null = null;

    monthlyChartData13Strategies.forEach((d, i) => {
      if (d.regime === 'Bear' && currentBearStart === null) {
        currentBearStart = xScale(i);
      } else if (d.regime === 'Bull' && currentBearStart !== null) {
        periods.push({ startX: currentBearStart, endX: xScale(i) });
        currentBearStart = null;
      }
    });

    if (currentBearStart !== null) {
      periods.push({ startX: currentBearStart, endX: xScale(monthlyChartData13Strategies.length - 1) });
    }

    return periods;
  }, [xScale]);

  // 経済危機の位置を計算
  const crisisPositions = useMemo(() => {
    return economicCrises13.map((crisis) => {
      const startIndex = monthlyChartData13Strategies.findIndex((d) => d.month === crisis.start);
      const endIndex = monthlyChartData13Strategies.findIndex((d) => d.month === crisis.end);
      if (startIndex === -1 || endIndex === -1) return null;
      return {
        ...crisis,
        startX: xScale(startIndex),
        endX: xScale(endIndex),
        centerX: (xScale(startIndex) + xScale(endIndex)) / 2,
      };
    }).filter(Boolean) as (typeof economicCrises13[0] & { startX: number; endX: number; centerX: number })[];
  }, [xScale]);

  // レジームサマリー
  const regimeSummary = useMemo(() => {
    const bullMonths = monthlyChartData13Strategies.filter(d => d.regime === 'Bull').length;
    const bearMonths = monthlyChartData13Strategies.filter(d => d.regime === 'Bear').length;
    return {
      bullMonths,
      bearMonths,
      regimeSwitches: regimeSwitches13.length,
    };
  }, []);

  const toggleSeries = (key: StrategyKey) => {
    setVisibleSeries((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const index = Math.round(((x - padding.left) / innerWidth) * (monthlyChartData13Strategies.length - 1));
    if (index >= 0 && index < monthlyChartData13Strategies.length) {
      setHoveredPoint({
        month: monthlyChartData13Strategies[index].month,
        data: monthlyChartData13Strategies[index],
        index,
      });
    }
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
  };

  // 全表示/主要のみ切替
  const showAll = () => {
    const newState: Record<string, boolean> = {};
    STRATEGY_CONFIGS.forEach(c => { newState[c.key] = true; });
    setVisibleSeries(newState as Record<StrategyKey, boolean>);
  };

  const showMainOnly = () => {
    const newState: Record<string, boolean> = {};
    STRATEGY_CONFIGS.forEach(c => {
      newState[c.key] = ['D3', 'D3+防御型', 'D3+防御型_VolScale', 'SPY'].includes(c.key);
    });
    setVisibleSeries(newState as Record<StrategyKey, boolean>);
  };

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>Bull: {regimeSummary.bullMonths}ヶ月</span>
          <span>Bear: {regimeSummary.bearMonths}ヶ月</span>
          <span>切替: {regimeSummary.regimeSwitches}回</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={showMainOnly}
            className="text-xs px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
          >
            主要戦略のみ
          </button>
          <button
            onClick={showAll}
            className="text-xs px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
          >
            全戦略表示
          </button>
          <button
            onClick={() => setUseLogScale(!useLogScale)}
            className="text-xs px-3 py-1.5 rounded-lg bg-primary/20 hover:bg-primary/30 transition-colors text-primary"
          >
            {useLogScale ? '対数スケール' : '線形スケール'}
          </button>
        </div>
      </div>

      {/* チャート */}
      <div className="overflow-x-auto">
        <svg
          width={chartWidth}
          height={chartHeight}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="cursor-crosshair"
        >
          {/* Bear期間の背景 */}
          {bearPeriods.map((period, i) => (
            <rect
              key={`bear-${i}`}
              x={period.startX}
              y={padding.top}
              width={period.endX - period.startX}
              height={innerHeight}
              fill="rgba(239, 68, 68, 0.1)"
            />
          ))}

          {/* 経済危機の背景とラベル */}
          {crisisPositions.map((crisis, i) => (
            <g key={`crisis-${i}`}>
              <rect
                x={crisis.startX}
                y={padding.top}
                width={crisis.endX - crisis.startX}
                height={innerHeight}
                fill={crisis.color}
                fillOpacity={0.2}
              />
              <text
                x={crisis.centerX}
                y={padding.top + 15}
                textAnchor="middle"
                className="fill-current text-[10px] font-medium"
                style={{ fill: crisis.color }}
              >
                {crisis.name}
              </text>
            </g>
          ))}

          {/* グリッド線 */}
          {yTicks.map((tick) => (
            <g key={tick}>
              <line
                x1={padding.left}
                y1={yScale(tick)}
                x2={padding.left + innerWidth}
                y2={yScale(tick)}
                stroke="currentColor"
                strokeOpacity={0.1}
                strokeDasharray="4,4"
              />
              <text
                x={padding.left - 8}
                y={yScale(tick)}
                textAnchor="end"
                dominantBaseline="middle"
                className="fill-muted-foreground text-[10px]"
              >
                {tick >= 1000 ? `${(tick / 1000).toFixed(0)}k` : tick}%
              </text>
            </g>
          ))}

          {/* X軸の目盛り */}
          {xTicks.map((year) => {
            const index = monthlyChartData13Strategies.findIndex((d) => d.month.startsWith(year) && d.month.endsWith('-01'));
            if (index === -1) return null;
            const x = xScale(index);
            return (
              <g key={year}>
                <line
                  x1={x}
                  y1={padding.top}
                  x2={x}
                  y2={padding.top + innerHeight}
                  stroke="currentColor"
                  strokeOpacity={0.05}
                />
                <text
                  x={x}
                  y={padding.top + innerHeight + 15}
                  textAnchor="middle"
                  className="fill-muted-foreground text-[10px]"
                >
                  {year}
                </text>
              </g>
            );
          })}

          {/* レジーム切り替えマーカー */}
          {regimeSwitchPositions.map((s, i) => (
            <g key={`switch-${i}`}>
              <line
                x1={s.x}
                y1={padding.top}
                x2={s.x}
                y2={padding.top + innerHeight}
                stroke={s.to === 'Bear' ? '#ef4444' : '#22c55e'}
                strokeWidth={1.5}
                strokeDasharray="4,2"
                opacity={0.7}
              />
              <circle
                cx={s.x}
                cy={padding.top + innerHeight + 30}
                r={6}
                fill={s.to === 'Bear' ? '#ef4444' : '#22c55e'}
                opacity={0.9}
              />
              <text
                x={s.x}
                y={padding.top + innerHeight + 34}
                textAnchor="middle"
                className="fill-white text-[8px] font-bold"
              >
                {s.to === 'Bear' ? '↓' : '↑'}
              </text>
            </g>
          ))}

          {/* データライン */}
          {STRATEGY_CONFIGS.map(({ key, color, strokeWidth }) =>
            visibleSeries[key] ? (
              <path
                key={key}
                d={generatePath(key)}
                fill="none"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null
          )}

          {/* ホバー時の垂直線とデータポイント */}
          {hoveredPoint && (
            <g>
              <line
                x1={xScale(hoveredPoint.index)}
                y1={padding.top}
                x2={xScale(hoveredPoint.index)}
                y2={padding.top + innerHeight}
                stroke="currentColor"
                strokeOpacity={0.3}
                strokeWidth={1}
              />
              {STRATEGY_CONFIGS.map(({ key, color }) => {
                const value = hoveredPoint.data[key];
                return visibleSeries[key] && value !== undefined ? (
                  <circle
                    key={key}
                    cx={xScale(hoveredPoint.index)}
                    cy={yScale(value)}
                    r={4}
                    fill={color}
                    stroke="white"
                    strokeWidth={2}
                  />
                ) : null;
              })}
            </g>
          )}

          {/* 100%ライン（初期値） */}
          <line
            x1={padding.left}
            y1={yScale(100)}
            x2={padding.left + innerWidth}
            y2={yScale(100)}
            stroke="currentColor"
            strokeOpacity={0.3}
            strokeWidth={1}
          />
        </svg>
      </div>

      {/* ツールチップ */}
      {hoveredPoint && (
        <div className="p-3 rounded-lg bg-muted/50 border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold">{hoveredPoint.month}</span>
            <span
              className={cn(
                'px-2 py-0.5 rounded text-xs font-medium',
                hoveredPoint.data.regime === 'Bull'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-red-500/20 text-red-400'
              )}
            >
              {hoveredPoint.data.regime}
            </span>
          </div>
          <div className="grid grid-cols-4 md:grid-cols-7 gap-2 text-sm">
            {STRATEGY_CONFIGS.map(({ key, name, color }) => {
              const value = hoveredPoint.data[key];
              if (value === undefined) return null;
              return (
                <div key={key} className={visibleSeries[key] ? '' : 'opacity-30'}>
                  <div className="text-[10px] text-muted-foreground truncate">{name}</div>
                  <div className="font-mono font-semibold text-xs" style={{ color }}>
                    {value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toFixed(0)}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 凡例 */}
      <div className="flex items-center justify-center gap-2 flex-wrap">
        {STRATEGY_CONFIGS.map(({ key, name, color }) => (
          <button
            key={key}
            onClick={() => toggleSeries(key)}
            className={cn(
              'flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all text-xs',
              visibleSeries[key] ? 'bg-muted/50' : 'bg-transparent opacity-40'
            )}
          >
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
            <span className="truncate max-w-[80px]">{name}</span>
          </button>
        ))}
      </div>

      {/* 注釈 */}
      <div className="text-xs text-muted-foreground text-center">
        <span className="inline-flex items-center gap-1">
          <span className="w-2 h-2 rounded bg-red-500/30" /> Bear期間
        </span>
        <span className="mx-2">|</span>
        <span className="text-emerald-400">↑</span> Bull転換
        <span className="mx-1">/</span>
        <span className="text-red-400">↓</span> Bear転換
        <span className="mx-2">|</span>
        <span>経済危機は背景色で表示</span>
      </div>
    </div>
  );
}
