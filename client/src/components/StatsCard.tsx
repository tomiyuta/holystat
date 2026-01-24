import { motion } from 'framer-motion';
import { BarChart3, Target, TrendingUp, Shield } from 'lucide-react';

interface StatItem {
  label: string;
  value: string;
  subtext?: string;
  color?: string;
}

interface StatsCardProps {
  title: string;
  icon: 'chart' | 'target' | 'trending' | 'shield';
  stats: StatItem[];
}

const iconMap = {
  chart: BarChart3,
  target: Target,
  trending: TrendingUp,
  shield: Shield,
};

export function StatsCard({ title, icon, stats }: StatsCardProps) {
  const Icon = iconMap[icon];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="terminal-card"
    >
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-medium text-foreground">{title}</h3>
      </div>
      <div className="space-y-3">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center justify-between"
          >
            <span className="text-xs text-muted-foreground">{stat.label}</span>
            <div className="text-right">
              <span 
                className="font-mono font-semibold"
                style={{ color: stat.color || 'inherit' }}
              >
                {stat.value}
              </span>
              {stat.subtext && (
                <span className="text-xs text-muted-foreground ml-1">
                  {stat.subtext}
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
