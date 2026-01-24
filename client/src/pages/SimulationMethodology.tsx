/**
 * シミュレーション条件詳細ページ
 * 取引コスト・バイアス補正の計算方法を説明
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  ArrowLeft, 
  Calculator, 
  AlertTriangle, 
  TrendingUp, 
  Shield,
  ChevronDown,
  ChevronUp,
  Info,
  Database,
  Clock,
  DollarSign,
  BarChart3,
  Target,
  Zap
} from 'lucide-react';
import { Link } from 'wouter';
import { useState } from 'react';
import { SimulationConditionsBadge } from '@/components/SimulationConditionsBadge';

export default function SimulationMethodology() {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'trading-cost': true,
    'bias-correction': true,
    'data-source': false,
    'limitations': false
  });
  
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };
  
  return (
    <div className="min-h-screen bg-background">
      {/* ヘッダー */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">戻る</span>
              </Link>
              <div>
                <h1 className="text-xl font-bold">シミュレーション条件詳細</h1>
                <p className="text-xs text-muted-foreground">
                  計算手法・前提条件・限界の説明
                </p>
              </div>
            </div>
            <SimulationConditionsBadge variant="compact" />
          </div>
        </div>
      </header>
      
      {/* メインコンテンツ */}
      <main className="container py-6 space-y-6">
        {/* サマリーカード */}
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-primary" />
              シミュレーション条件サマリー
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 bg-background/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-amber-400" />
                  <span className="font-semibold">取引コスト</span>
                </div>
                <div className="text-2xl font-bold text-amber-400">0.2%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  往復取引あたり
                </p>
              </div>
              <div className="p-4 bg-background/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span className="font-semibold">バイアス補正</span>
                </div>
                <div className="text-2xl font-bold text-red-400">-2%/年</div>
                <p className="text-xs text-muted-foreground mt-1">
                  サバイバーシップバイアス
                </p>
              </div>
              <div className="p-4 bg-background/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span className="font-semibold">シミュレーション期間</span>
                </div>
                <div className="text-2xl font-bold text-blue-400">21年</div>
                <p className="text-xs text-muted-foreground mt-1">
                  2004-08 〜 2025-11
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* 取引コスト詳細 */}
        <Collapsible open={expandedSections['trading-cost']} onOpenChange={() => toggleSection('trading-cost')}>
          <Card>
            <CollapsibleTrigger className="w-full">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-amber-400" />
                  <CardTitle>取引コストの計算方法</CardTitle>
                </div>
                {expandedSections['trading-cost'] ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted/30 rounded-lg">
                  <h4 className="font-semibold mb-2">計算式</h4>
                  <code className="text-sm bg-background p-2 rounded block">
                    月次リターン = 実際のリターン × (1 - 取引コスト率)
                  </code>
                  <p className="text-sm text-muted-foreground mt-2">
                    ※ リバランス発生月のみ適用
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold">取引コスト0.2%の内訳</h4>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">項目</th>
                        <th className="text-right p-2">コスト</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="p-2">売買手数料（往復）</td>
                        <td className="p-2 text-right">0.10%</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2">スプレッド（往復）</td>
                        <td className="p-2 text-right">0.05%</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2">マーケットインパクト</td>
                        <td className="p-2 text-right">0.05%</td>
                      </tr>
                      <tr className="border-b bg-muted/30">
                        <td className="p-2 font-semibold">合計</td>
                        <td className="p-2 text-right font-semibold">0.20%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-amber-400 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-amber-400">注意事項</h4>
                      <p className="text-sm text-muted-foreground">
                        取引コスト0.2%は保守的な見積もりです。Interactive Brokersなどの低コストブローカーを使用する場合、
                        実際のコストは0.1%以下になる可能性があります。一方、高頻度取引や大口取引では
                        マーケットインパクトが増大する可能性があります。
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
        
        {/* サバイバーシップバイアス補正 */}
        <Collapsible open={expandedSections['bias-correction']} onOpenChange={() => toggleSection('bias-correction')}>
          <Card>
            <CollapsibleTrigger className="w-full">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  <CardTitle>サバイバーシップバイアス補正</CardTitle>
                </div>
                {expandedSections['bias-correction'] ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted/30 rounded-lg">
                  <h4 className="font-semibold mb-2">サバイバーシップバイアスとは</h4>
                  <p className="text-sm text-muted-foreground">
                    現在のS&P500構成銘柄で過去をバックテストすると、倒産・除外された銘柄が含まれないため、
                    リターンが過大評価されます。これを「サバイバーシップバイアス」と呼びます。
                  </p>
                </div>
                
                <div className="p-4 bg-muted/30 rounded-lg">
                  <h4 className="font-semibold mb-2">補正方法</h4>
                  <code className="text-sm bg-background p-2 rounded block">
                    補正後CAGR = 補正前CAGR - 2.0%
                  </code>
                  <p className="text-sm text-muted-foreground mt-2">
                    学術研究に基づき、年率2%のペナルティを適用
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold">補正根拠（学術研究）</h4>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">研究</th>
                        <th className="text-right p-2">推定バイアス</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="p-2">Brown et al. (1992)</td>
                        <td className="p-2 text-right">1.5%/年</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2">Elton et al. (1996)</td>
                        <td className="p-2 text-right">2.0%/年</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2">Carhart et al. (2002)</td>
                        <td className="p-2 text-right">1.8%/年</td>
                      </tr>
                      <tr className="border-b bg-muted/30">
                        <td className="p-2 font-semibold">採用値（保守的）</td>
                        <td className="p-2 text-right font-semibold text-red-400">2.0%/年</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-red-400">重要な注意</h4>
                      <p className="text-sm text-muted-foreground">
                        バイアス補正後の数値は「実際に達成可能なリターン」の推定値です。
                        補正前の数値（例：D3のCAGR 34.51%）は過大評価であり、
                        実際の運用では補正後の数値（32.51%）に近い結果になると予想されます。
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
        
        {/* データソース */}
        <Collapsible open={expandedSections['data-source']} onOpenChange={() => toggleSection('data-source')}>
          <Card>
            <CollapsibleTrigger className="w-full">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-blue-400" />
                  <CardTitle>データソースと更新頻度</CardTitle>
                </div>
                {expandedSections['data-source'] ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4">
                {/* holygrail.parquet データセット概要 */}
                <div className="p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-lg">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Database className="w-4 h-4 text-blue-400" />
                    マスターデータセット: holygrail.parquet
                  </h4>
                  <div className="grid md:grid-cols-3 gap-4 mb-4">
                    <div className="p-3 bg-background/50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-400">520</div>
                      <div className="text-xs text-muted-foreground">銘柄数</div>
                    </div>
                    <div className="p-3 bg-background/50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-400">5,534</div>
                      <div className="text-xs text-muted-foreground">取引日数</div>
                    </div>
                    <div className="p-3 bg-background/50 rounded-lg">
                      <div className="text-2xl font-bold text-green-400">22年</div>
                      <div className="text-xs text-muted-foreground">データ期間</div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    2004-01-02 〜 2025-12-30の日次OHLCV価格データ（Yahoo Finance取得）
                  </p>
                </div>

                {/* 銘柄カテゴリ */}
                <div className="space-y-3">
                  <h4 className="font-semibold">銘柄カテゴリ（MECE分類）</h4>
                  
                  {/* S&P500構成銘柄 */}
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-400" />
                        S&P500構成銘柄
                      </span>
                      <Badge variant="secondary">507銘柄</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      現在または過去にS&P500に構成されていた銘柄
                    </p>
                    <div className="text-xs text-muted-foreground">
                      例: AAPL, MSFT, GOOGL, AMZN, NVDA, TSLA, META, BRK-B, UNH, JNJ...
                    </div>
                  </div>

                  {/* 市場インデックス */}
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-blue-400" />
                        市場インデックス
                      </span>
                      <Badge variant="secondary">5銘柄</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      ベンチマーク比較用の主要指数
                    </p>
                    <table className="w-full text-xs">
                      <tbody>
                        <tr><td className="py-1"><code>^GSPC</code></td><td>S&P500指数</td></tr>
                        <tr><td className="py-1"><code>^DJI</code></td><td>ダウ・ジョーンズ工業株30種平均</td></tr>
                        <tr><td className="py-1"><code>^IXIC</code></td><td>NASDAQ総合指数</td></tr>
                        <tr><td className="py-1"><code>^IRX</code></td><td>13週物米国債利回り（短期金利指標）</td></tr>
                        <tr><td className="py-1"><code>^TNX</code></td><td>10年物米国債利回り（長期金利指標）</td></tr>
                      </tbody>
                    </table>
                  </div>

                  {/* 債券ETF */}
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium flex items-center gap-2">
                        <Shield className="w-4 h-4 text-amber-400" />
                        債券ETF（防御型資産）
                      </span>
                      <Badge variant="secondary">4銘柄</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      不況シグナル時の安全資産として使用
                    </p>
                    <table className="w-full text-xs">
                      <tbody>
                        <tr><td className="py-1"><code>BIL</code></td><td>SPDR Bloomberg 1-3 Month T-Bill ETF（超短期国債）</td></tr>
                        <tr><td className="py-1"><code>SGOV</code></td><td>iShares 0-3 Month Treasury Bond ETF（超短期国債）</td></tr>
                        <tr><td className="py-1"><code>GOVT</code></td><td>iShares U.S. Treasury Bond ETF（米国債全般）</td></tr>
                        <tr><td className="py-1"><code>USFR</code></td><td>WisdomTree Floating Rate Treasury Fund（変動金利国債）</td></tr>
                      </tbody>
                    </table>
                  </div>

                  {/* 上場廃止銘柄 */}
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                        上場廃止銘柄
                      </span>
                      <Badge variant="secondary">4銘柄</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      サバイバーシップバイアス補正用に含有
                    </p>
                    <table className="w-full text-xs">
                      <tbody>
                        <tr><td className="py-1"><code>MER</code></td><td>Merrill Lynch（2009年Bank of America買収）</td></tr>
                        <tr><td className="py-1"><code>TWX</code></td><td>Time Warner（2018年AT&T買収）</td></tr>
                        <tr><td className="py-1"><code>EMC</code></td><td>EMC Corporation（2016年Dell買収）</td></tr>
                        <tr><td className="py-1"><code>WB</code></td><td>Weibo Corporation（中国SNS、ADR）</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* データ構造 */}
                <div className="space-y-2">
                  <h4 className="font-semibold">データ構造（OHLCV）</h4>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">カラム</th>
                        <th className="text-left p-2">説明</th>
                        <th className="text-left p-2">用途</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="p-2"><code>Date</code></td>
                        <td className="p-2">取引日（インデックス）</td>
                        <td className="p-2 text-muted-foreground">時系列分析</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2"><code>{'{TICKER}'}_Open</code></td>
                        <td className="p-2">始値</td>
                        <td className="p-2 text-muted-foreground">-</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2"><code>{'{TICKER}'}_High</code></td>
                        <td className="p-2">高値</td>
                        <td className="p-2 text-muted-foreground">-</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2"><code>{'{TICKER}'}_Low</code></td>
                        <td className="p-2">安値</td>
                        <td className="p-2 text-muted-foreground">-</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2"><code>{'{TICKER}'}_Close</code></td>
                        <td className="p-2">終値</td>
                        <td className="p-2 text-muted-foreground">-</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2"><code>{'{TICKER}'}_Volume</code></td>
                        <td className="p-2">出来高</td>
                        <td className="p-2 text-muted-foreground">流動性確認</td>
                      </tr>
                      <tr className="border-b bg-primary/5">
                        <td className="p-2 font-medium"><code>{'{TICKER}'}_AdjClose</code></td>
                        <td className="p-2">調整後終値</td>
                        <td className="p-2 text-primary">モメンタム計算に使用</td>
                      </tr>
                    </tbody>
                  </table>
                  <p className="text-xs text-muted-foreground">
                    ※ AdjClose（調整後終値）は配当・株式分割を調整済みの価格で、モメンタム計算に使用
                  </p>
                </div>

                {/* データ品質 */}
                <div className="p-4 bg-muted/30 rounded-lg">
                  <h4 className="font-semibold mb-2">データ品質</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium">完全データ銘柄</div>
                      <div className="text-2xl font-bold text-green-400">393銘柄</div>
                      <div className="text-xs text-muted-foreground">全期間（2004-2025）のデータあり</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">部分データ銘柄</div>
                      <div className="text-2xl font-bold text-amber-400">127銘柄</div>
                      <div className="text-xs text-muted-foreground">IPO日以前のデータが欠損（正常）</div>
                    </div>
                  </div>
                </div>

                {/* シミュレーションでの使用方法 */}
                <div className="space-y-2">
                  <h4 className="font-semibold">シミュレーションでの使用方法</h4>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <div className="font-medium text-sm mb-1">モメンタム計算</div>
                      <code className="text-xs bg-background p-1 rounded block">
                        6ヶ月モメンタム = (現在AdjClose / 6ヶ月前AdjClose) - 1
                      </code>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <div className="font-medium text-sm mb-1">ポートフォリオ選定</div>
                      <div className="text-xs text-muted-foreground">
                        D2: S&P100からTOP5 / D3: S&P500からTOP5
                      </div>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <div className="font-medium text-sm mb-1">防御型配分</div>
                      <div className="text-xs text-muted-foreground">
                        不況シグナル時にBIL/SGOVへ資金移動
                      </div>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <div className="font-medium text-sm mb-1">バイアス補正</div>
                      <div className="text-xs text-muted-foreground">
                        上場廃止銘柄含有 + 年率-2%補正
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-muted/30 rounded-lg">
                  <h4 className="font-semibold mb-2">シミュレーション期間</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• 開始: 2004年8月（ETFデータの利用可能開始時点）</li>
                    <li>• 終了: 2025年11月（最新データ）</li>
                    <li>• 期間: 256ヶ月（約21年）</li>
                  </ul>
                </div>
                
                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-400 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-blue-400">データ更新について</h4>
                      <p className="text-sm text-muted-foreground">
                        シミュレーション結果は月次で更新されます。ポートフォリオ推奨は月初に更新され、
                        次回リバランス日まで固定されます。
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
        
        {/* 限界（Limitations） */}
        <Collapsible open={expandedSections['limitations']} onOpenChange={() => toggleSection('limitations')}>
          <Card className="border-amber-500/30">
            <CollapsibleTrigger className="w-full">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  <CardTitle>シミュレーションの限界（Limitations）</CardTitle>
                </div>
                {expandedSections['limitations'] ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  本シミュレーションには以下の限界があります。投資判断の際はこれらを考慮してください。
                </p>
                
                {/* データ品質の限界 */}
                <div className="p-4 bg-muted/30 rounded-lg">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    データ品質の限界
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• 株式分割・配当調整の精度に依存</li>
                    <li>• 上場廃止銘柄のデータ欠損</li>
                    <li>• 日中価格変動は考慮せず（終値ベース）</li>
                  </ul>
                </div>
                
                {/* モデルの限界 */}
                <div className="p-4 bg-muted/30 rounded-lg">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Calculator className="w-4 h-4" />
                    モデルの限界
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• 過去のパフォーマンスは将来を保証しない</li>
                    <li>• モメンタム効果の持続性は不確実</li>
                    <li>• レジーム判定の遅延（200日移動平均）</li>
                    <li>• パラメータの過学習リスク</li>
                  </ul>
                </div>
                
                {/* 実行の限界 */}
                <div className="p-4 bg-muted/30 rounded-lg">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    実行の限界
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• 流動性リスク（大口取引時のスリッページ）</li>
                    <li>• 約定タイミングの不確実性</li>
                    <li>• 税金・為替変動は考慮せず</li>
                    <li>• 借入コスト（レバレッジ使用時）は考慮せず</li>
                  </ul>
                </div>
                
                {/* 外部環境の限界 */}
                <div className="p-4 bg-muted/30 rounded-lg">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    外部環境の限界
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• 市場構造の変化（HFT、ETF普及等）</li>
                    <li>• 規制変更リスク</li>
                    <li>• ブラックスワンイベント</li>
                    <li>• 戦略の普及による効果減衰</li>
                  </ul>
                </div>
                
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-amber-400">免責事項</h4>
                      <p className="text-sm text-muted-foreground">
                        本システムは投資助言を目的としたものではありません。
                        シミュレーション結果は過去のデータに基づく参考情報であり、
                        将来のパフォーマンスを保証するものではありません。
                        投資判断は自己責任でお願いします。
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
        
        {/* 戦略パラメータ */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-400" />
              戦略パラメータ
            </CardTitle>
            <CardDescription>
              各戦略で使用されるパラメータ設定
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">パラメータ</th>
                    <th className="text-left p-2">値</th>
                    <th className="text-left p-2">説明</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="p-2 font-medium">モメンタム期間</td>
                    <td className="p-2">6ヶ月（126営業日）</td>
                    <td className="p-2 text-muted-foreground">過去リターン計算期間</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 font-medium">リスク期間</td>
                    <td className="p-2">60営業日</td>
                    <td className="p-2 text-muted-foreground">ボラティリティ計算期間</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 font-medium">移動平均期間</td>
                    <td className="p-2">200日</td>
                    <td className="p-2 text-muted-foreground">レジーム判定用</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 font-medium">攻撃型銘柄数</td>
                    <td className="p-2">TOP 5</td>
                    <td className="p-2 text-muted-foreground">D2/D3戦略</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 font-medium">防御型銘柄数</td>
                    <td className="p-2">TOP 3〜5</td>
                    <td className="p-2 text-muted-foreground">低ボラETF</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 font-medium">リバランス頻度</td>
                    <td className="p-2">月次</td>
                    <td className="p-2 text-muted-foreground">月初に実行</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
      
      {/* フッター */}
      <footer className="border-t border-border py-6">
        <div className="container">
          <p className="text-xs text-muted-foreground text-center">
            ※ 本システムは投資助言を目的としたものではありません。投資判断は自己責任でお願いします。
          </p>
        </div>
      </footer>
    </div>
  );
}
