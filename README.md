# 分析結果機能 - ファイル構成

## 概要
このzipには、分析結果ページ（AnalysisResults.tsx）とその依存コンポーネントが含まれています。

## ファイル構成

```
client/src/
├── pages/
│   └── AnalysisResults.tsx      # メインの分析結果ページ
├── components/
│   ├── SimulationConditionsBadge.tsx  # シミュレーション条件バッジ
│   ├── StrategySimulator.tsx          # 戦略シミュレーター
│   ├── MonthlyChart13Strategies.tsx   # 月次チャート（13戦略）
│   ├── YearlyPerformanceTable13.tsx   # 年次パフォーマンステーブル
│   ├── ParamSensitivityCard.tsx       # パラメータ感度分析カード
│   ├── ParameterSimulator.tsx         # パラメータシミュレーター
│   └── RobustnessPageNew.tsx          # ロバスト性評価（15種類の統計検定）
└── data/
    ├── integratedData.ts              # 統合データ（エクスポート関数含む）
    └── integrated_web_data.json       # 統合Webデータ（JSON）
```

## タブ構成（AnalysisResults.tsx）
1. **概要** - 戦略パフォーマンス概要
2. **成績** - 詳細な成績データ
3. **HF比較** - ヘッジファンド比較
4. **シミュレーター** - パラメータシミュレーション
5. **VolScale** - Volatility Scaling詳細
6. **チャート** - 累積リターンチャート
7. **年次詳細** - 年次パフォーマンス詳細
8. **レジーム** - レジーム別パフォーマンス
9. **ロバスト性** - 15種類の統計検定結果

## 使い方
1. zipを解凍
2. holystatリポジトリの対応するディレクトリにファイルを上書きコピー
3. App.tsxに `/analysis-results` ルートを追加（必要な場合）
4. git add, commit, push

## 依存パッケージ
- recharts（チャート描画）
- lucide-react（アイコン）
- wouter（ルーティング）
- shadcn/ui コンポーネント（Card, Tabs, Badge, Button, Tooltip, Collapsible）
