import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, TrendingDown, Clock, Database, Zap, Globe } from "lucide-react";

export function SimulationLimitationsCard() {
  const limitations = [
    {
      category: "データ品質",
      icon: Database,
      items: [
        "サバイバーシップバイアス: 2005年以降上場の銘柄22個を除外済み",
        "価格調整: 株式分割・配当調整済みだが、完全な配当再投資反映は確認不可"
      ]
    },
    {
      category: "方法論",
      icon: Zap,
      items: [
        "取引コスト未考慮: 実装時に年1-3%のコスト差引が必要",
        "月次リバランス仮定: 実際には日中の価格変動で実現不可能",
        "流動性制約無視: 大口売却時の市場インパクト未考慮"
      ]
    },
    {
      category: "市場環境",
      icon: TrendingDown,
      items: [
        "低金利環境の特殊性: 2005-2021年の歴史的低金利が結果を押し上げた可能性",
        "危機の頻度: 20年間に2回の大型危機のみ。他の危機タイプでの検証不足",
        "テック企業の成長: 2010年代後半のテック企業急速成長が結果に影響"
      ]
    },
    {
      category: "パラメータ",
      icon: Clock,
      items: [
        "ストップロス閾値: -10%に固定。最適値は市場環境により異なる可能性",
        "MA期間: 200日に固定。異なる期間での検証なし",
        "レジーム判定: 特定の経済指標に固定。他の指標での検証なし"
      ]
    },
    {
      category: "将来予測",
      icon: Globe,
      items: [
        "構造的変化: HFT普及・ETF拡大・AI普及により市場構造が継続変化",
        "黒鳥イベント: パンデミック・戦争など予測不可能なイベントの発生",
        "規制変更: 金融規制の変更により市場環境が変化する可能性"
      ]
    }
  ];

  return (
    <Card className="border-yellow-500/30 bg-yellow-900/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-500" />
          20年シミュレーションのLimitation分析
        </CardTitle>
        <CardDescription>
          本シミュレーションは過去20年間の特定の市場環境における戦略の相対的な有効性を示すもので、将来の絶対的なパフォーマンスを保証するものではありません
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 制限事項一覧 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {limitations.map((limitation) => {
            const Icon = limitation.icon;
            return (
              <div key={limitation.category} className="border border-yellow-500/20 rounded-lg p-4 bg-yellow-500/5">
                <div className="flex items-center gap-2 mb-3">
                  <Icon className="w-5 h-5 text-yellow-500" />
                  <h4 className="font-semibold text-foreground">{limitation.category}</h4>
                </div>
                <ul className="space-y-2">
                  {limitation.items.map((item, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground flex gap-2">
                      <span className="text-yellow-500 mt-0.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* 優先度別推奨検証項目 */}
        <div className="border-t border-yellow-500/20 pt-6">
          <h4 className="font-semibold text-foreground mb-4">推奨される今後の検証項目</h4>
          
          <div className="space-y-4">
            <div className="p-3 bg-red-900/20 border border-red-500/30 rounded">
              <p className="text-sm font-semibold text-red-400 mb-2">優先度 高</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 取引コスト込みシミュレーション（1-3%のコスト考慮）</li>
                <li>• パラメータ感度分析（ストップロス閾値: -5%, -15%）</li>
                <li>• 利上げ環境での検証（2022年以降データ分離）</li>
              </ul>
            </div>

            <div className="p-3 bg-yellow-900/20 border border-yellow-500/30 rounded">
              <p className="text-sm font-semibold text-yellow-400 mb-2">優先度 中</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 日次リバランス検証（月次→日次への変更影響）</li>
                <li>• セクター別分析（セクター構成変化の影響）</li>
                <li>• 他市場への拡張（国際株式・債券・商品）</li>
              </ul>
            </div>

            <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded">
              <p className="text-sm font-semibold text-blue-400 mb-2">優先度 低</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 機械学習による最適化（AIを用いたパラメータ自動調整）</li>
                <li>• リアルタイムシグナル検証（過去のシグナル実行可能性）</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 重要な注意事項 */}
        <div className="border-t border-yellow-500/20 pt-6 bg-red-900/20 border border-red-500/30 rounded-lg p-4">
          <h4 className="font-semibold text-red-400 mb-3">⚠️ 重要な注意事項</h4>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>
              <strong className="text-foreground">取引コスト:</strong> 実装により年1-3%のパフォーマンス低下の可能性
            </li>
            <li>
              <strong className="text-foreground">環境依存性:</strong> 低金利環境の終焉により、戦略の有効性が変化する可能性
            </li>
            <li>
              <strong className="text-foreground">過適合リスク:</strong> 現在の固定パラメータは過去データへの過適合の可能性
            </li>
            <li>
              <strong className="text-foreground">統計的有意性:</strong> Bonferroni補正後、シナリオ間に有意差なし（p &gt; 0.05）
            </li>
          </ul>
        </div>

        {/* 結論 */}
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
          <p className="text-sm text-muted-foreground">
            <strong className="text-blue-400">結論:</strong> 投資判断には、本シミュレーション結果に加えて、専門家の判断・市場環境分析・リスク許容度の確認が必須です。本システムは投資助言を目的としたものではありません。投資判断は自己責任でお願いします。
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
