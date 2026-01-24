import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, TrendingUp, TrendingDown, ChevronRight, History } from "lucide-react";

interface Holding {
  symbol: string;
  name: string;
  weight: number;
  momentum: number;
  volatility: number;
  category?: string;
}

interface RebalanceRecord {
  id: number;
  yearMonth: string;
  rebalanceDate: Date;
  regime: "bull" | "bear";
  regimeJapanese: string;
  spyPrice: string;
  spyMA200: string;
  threshold: string;
  confidence: string;
  d2Holdings: Holding[];
  d3Holdings: Holding[];
  defensiveHoldings: Holding[];
  batchId: string;
  createdAt: Date;
}

function formatYearMonth(yearMonth: string): string {
  const [year, month] = yearMonth.split("-");
  return `${year}年${parseInt(month)}月`;
}

function HoldingsTable({ holdings, title }: { holdings: Holding[]; title: string }) {
  return (
    <div className="space-y-2">
      <h4 className="font-semibold text-sm text-muted-foreground">{title}</h4>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-20">銘柄</TableHead>
            <TableHead>銘柄名</TableHead>
            <TableHead className="text-right">ウェイト</TableHead>
            <TableHead className="text-right">モメンタム</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {holdings.map((holding, index) => (
            <TableRow key={index}>
              <TableCell className="font-mono font-semibold">{holding.symbol}</TableCell>
              <TableCell className="text-sm text-muted-foreground truncate max-w-[200px]">
                {holding.name || "-"}
              </TableCell>
              <TableCell className="text-right">{(holding.weight * 100).toFixed(1)}%</TableCell>
              <TableCell className="text-right">
                <span className={holding.momentum >= 0 ? "text-green-500" : "text-red-500"}>
                  {holding.momentum >= 0 ? "+" : ""}
                  {(holding.momentum * 100).toFixed(1)}%
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function RebalanceDetailDialog({ record }: { record: RebalanceRecord }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1">
          詳細 <ChevronRight className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {formatYearMonth(record.yearMonth)} リバランス詳細
            <Badge variant={record.regime === "bull" ? "default" : "destructive"}>
              {record.regimeJapanese}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 mt-4">
          {/* Market Indicators */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="text-sm text-muted-foreground">SPY終値</div>
                <div className="text-xl font-bold">${parseFloat(record.spyPrice).toFixed(2)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-sm text-muted-foreground">MA200</div>
                <div className="text-xl font-bold">${parseFloat(record.spyMA200).toFixed(2)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-sm text-muted-foreground">閾値 (MA200×0.95)</div>
                <div className="text-xl font-bold">${parseFloat(record.threshold).toFixed(2)}</div>
              </CardContent>
            </Card>
          </div>

          {/* Holdings */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-4">
                <HoldingsTable holdings={record.d2Holdings} title="D2戦略（S&P100）" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <HoldingsTable holdings={record.d3Holdings} title="D3戦略（S&P500）" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <HoldingsTable holdings={record.defensiveHoldings} title="防御型（ETF）" />
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function RebalanceHistory() {
  const { data: history, isLoading, error } = trpc.portfolio.getRebalanceHistory.useQuery({ limit: 12 });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            リバランス履歴
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            リバランス履歴
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">履歴の取得に失敗しました</p>
        </CardContent>
      </Card>
    );
  }

  if (!history || history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            リバランス履歴
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            履歴データがありません。次回のバッチ処理後に表示されます。
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          リバランス履歴
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>年月</TableHead>
              <TableHead>レジーム</TableHead>
              <TableHead className="text-right">SPY</TableHead>
              <TableHead className="text-right">MA200</TableHead>
              <TableHead className="text-right">閾値</TableHead>
              <TableHead className="text-center">D2 Top銘柄</TableHead>
              <TableHead className="text-center">D3 Top銘柄</TableHead>
              <TableHead className="text-center">防御型 Top銘柄</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.map((record) => (
              <TableRow key={record.id}>
                <TableCell className="font-medium">
                  {formatYearMonth(record.yearMonth)}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={record.regime === "bull" ? "default" : "destructive"}
                    className="gap-1"
                  >
                    {record.regime === "bull" ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {record.regime === "bull" ? "強気" : "弱気"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-mono">
                  ${parseFloat(record.spyPrice).toFixed(2)}
                </TableCell>
                <TableCell className="text-right font-mono">
                  ${parseFloat(record.spyMA200).toFixed(2)}
                </TableCell>
                <TableCell className="text-right font-mono">
                  ${parseFloat(record.threshold).toFixed(2)}
                </TableCell>
                <TableCell className="text-center">
                  <span className="font-mono text-sm">
                    {record.d2Holdings.slice(0, 3).map(h => h.symbol).join(", ")}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <span className="font-mono text-sm">
                    {record.d3Holdings.slice(0, 3).map(h => h.symbol).join(", ")}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <span className="font-mono text-sm">
                    {record.defensiveHoldings.slice(0, 3).map(h => h.symbol).join(", ")}
                  </span>
                </TableCell>
                <TableCell>
                  <RebalanceDetailDialog record={record as RebalanceRecord} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default RebalanceHistory;
