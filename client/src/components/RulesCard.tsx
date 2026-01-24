import { motion } from 'framer-motion';
import { BookOpen, ArrowRight } from 'lucide-react';

export function RulesCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="terminal-card"
    >
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-medium text-foreground">判定ルール</h3>
      </div>

      <div className="space-y-4">
        {/* Bull Rule */}
        <div className="p-3 rounded-lg bg-[oklch(0.75_0.2_145)]/5 border border-[oklch(0.75_0.2_145)]/20">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-[oklch(0.75_0.2_145)]" />
            <span className="text-sm font-medium text-[oklch(0.75_0.2_145)]">好況期判定</span>
          </div>
          <p className="text-xs text-muted-foreground">
            好況シグナル3つのうち<span className="font-semibold text-foreground">2つ以上</span>が点灯
          </p>
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            <ArrowRight className="w-3 h-3" />
            <span>攻撃型 60% : 防御型 40%</span>
          </div>
        </div>

        {/* Bear Rule */}
        <div className="p-3 rounded-lg bg-[oklch(0.65_0.25_25)]/5 border border-[oklch(0.65_0.25_25)]/20">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-[oklch(0.65_0.25_25)]" />
            <span className="text-sm font-medium text-[oklch(0.65_0.25_25)]">不況期判定</span>
          </div>
          <p className="text-xs text-muted-foreground">
            不況シグナル5つのうち<span className="font-semibold text-foreground">3つ以上</span>が点灯
          </p>
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            <ArrowRight className="w-3 h-3" />
            <span>攻撃型 20% : 防御型 80%</span>
          </div>
        </div>

        {/* Neutral Rule */}
        <div className="p-3 rounded-lg bg-[oklch(0.7_0.15_220)]/5 border border-[oklch(0.7_0.15_220)]/20">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-[oklch(0.7_0.15_220)]" />
            <span className="text-sm font-medium text-[oklch(0.7_0.15_220)]">中立期判定</span>
          </div>
          <p className="text-xs text-muted-foreground">
            上記いずれの条件も満たさない場合
          </p>
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            <ArrowRight className="w-3 h-3" />
            <span>攻撃型 40% : 防御型 60%</span>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground">
          ※ デュアル・シグナル戦略に基づく判定
        </p>
      </div>
    </motion.div>
  );
}
