"""
包括的ロバスト性評価スクリプト

概要:
    市場環境適応型ポートフォリオ戦略のロバスト性を包括的に評価。
    14種類の統計的検証テストを実施し、戦略の信頼性を多角的に分析。

入力:
    holygrail.parquet: S&P500構成銘柄およびETFの日次価格データ

出力:
    robust.json: ロバスト性評価結果（14テストの結果、総合評価）

テスト一覧（14テスト）:
    【必須テスト】
        1. 取引コスト感度分析: 0.1%/0.2%/0.5%/1.0%のコストでSharpe変化を検証
        2. レジーム別パフォーマンス分解: GFC/低金利期/コロナ/インフレ期/直近
        3. テールリスク分析: CVaR(5%), 最悑12ヶ月, DD滞在期間
    
    【推奨テスト】
        4. パラメータ感度分析: モメンタム期間(3/6/12M) × 銘柄数(3/5/10)
        5. ブロックブートストラップ: Sharpe/MaxDDの95%信頼区間
        6. DSR/PSR計算: 歪度・尖度を考慮した統計的有意性
    
    【任意テスト】
        7. サバイバーシップバイアス補正: -2%pt/年のペナルティ適用
        8. レバレッジ分析: レバ>1の頻度と資金調達コスト
        9. リバランス日感度: 月初/月中/月末のタイミング影響
    
    【追加テスト（v2）】
        10. モンテカルロ順列検定: 1000回シャッフルでp値算出
        11. Cohen's d: 効果量の大きさを評価
        12. Bonferroni補正: 多重比較による偽陽性を補正
        13. PBO（過剰最適化リスク）: CSCV法で過剰フィッティングを検出
        14. WFA一貫性: Walk-Forward分析での安定性

使用方法:
    $ python robust.py
    
    実行後、robust.jsonが生成される。

依存ライブラリ:
    - numpy
    - pandas
    - scipy
    - json

作成者: Portfolio Advisor System
バージョン: v2.0
最終更新: 2025-01-23
"""

import json
import numpy as np
import pandas as pd
from datetime import datetime
from scipy import stats
import warnings
warnings.filterwarnings('ignore')

# =============================================================================
# パラメータ
# =============================================================================
MOMENTUM_PERIOD = 126  # 6ヶ月（デフォルト）
MA_PERIOD = 200
REGIME_THRESHOLD = 0.95
ATTACK_TOP_N = 5
DEFENSE_TOP_N_3 = 3

# ボラティリティ推定パラメータ
VOL_SHORT_PERIOD = 21
VOL_LONG_PERIOD = 60
VOL_SHORT_WEIGHT = 0.7
VOL_LONG_WEIGHT = 0.3
VOL_FLOOR = 0.05
WEIGHT_CAP = 0.40

# VolScale パラメータ
VOLSCALE_LOOKBACK = 21
VOLSCALE_MIN = 0.5
VOLSCALE_MAX = 1.5

# 取引コスト（デフォルト）
TRANSACTION_COST = 0.002

# =============================================================================
# データ読み込み
# =============================================================================
print("=" * 80)
print("包括的ロバスト性評価（9テスト）")
print("=" * 80)
print()

PARQUET_PATH = '/home/ubuntu/portfolio-advisor/analysis/holygrail.parquet'
df = pd.read_parquet(PARQUET_PATH)
print(f"データ期間: {df.index.min()} 〜 {df.index.max()}")

# シンボルリスト
close_cols = [c for c in df.columns if '_Close' in c and 'Adj' not in c]
ALL_SYMBOLS = list(set([c.split('_')[0] for c in close_cols]))

DEFENSE_ETFS = ['GLD', 'EEM', 'IWM', 'QQQ', 'SPY', 'EFA', 'DBC', 'LQD', 'AGG', 'SHY', 'TLT', 'TIP', 'IYR']

sp500_symbols = [s for s in ALL_SYMBOLS if s not in DEFENSE_ETFS and f'{s}_Close' in df.columns]

# 価格データ
price_data = {}
for symbol in ALL_SYMBOLS:
    col = f'{symbol}_Close'
    if col in df.columns:
        price_data[symbol] = df[col].values

spy_prices = price_data.get('SPY', np.full(len(df), np.nan))

# 月次インデックス
df['YearMonth'] = df.index.to_period('M')
monthly_indices = []
monthly_dates = []
for ym, group in df.groupby('YearMonth'):
    first_idx = df.index.get_loc(group.index[0])
    monthly_indices.append((first_idx, group.index[0]))
    monthly_dates.append(group.index[0])

# =============================================================================
# 基本計算関数
# =============================================================================

def calc_momentum(symbol, idx, momentum_period=MOMENTUM_PERIOD):
    """
    モメンタム計算（指定期間のリターン）
    
    Args:
        symbol (str): 銘柄シンボル
        idx (int): 現在のインデックス
        momentum_period (int): モメンタム計算期間（日数）
    
    Returns:
        float: 指定期間のリターン（小数）
    """
    if symbol not in price_data:
        return np.nan
    prices = price_data[symbol]
    if idx < momentum_period:
        return np.nan
    current = prices[idx]
    past = prices[idx - momentum_period]
    if np.isnan(current) or np.isnan(past) or past <= 0:
        return np.nan
    return (current / past) - 1


def calc_volatility_improved(symbol, idx):
    if symbol not in price_data:
        return VOL_FLOOR
    prices = price_data[symbol]
    
    if idx >= VOL_SHORT_PERIOD:
        short_prices = prices[idx - VOL_SHORT_PERIOD:idx + 1]
        short_returns = np.diff(short_prices) / short_prices[:-1]
        short_returns = short_returns[~np.isnan(short_returns)]
        short_vol = np.std(short_returns) * np.sqrt(252) if len(short_returns) >= 10 else np.nan
    else:
        short_vol = np.nan
    
    if idx >= VOL_LONG_PERIOD:
        long_prices = prices[idx - VOL_LONG_PERIOD:idx + 1]
        long_returns = np.diff(long_prices) / long_prices[:-1]
        long_returns = long_returns[~np.isnan(long_returns)]
        long_vol = np.std(long_returns) * np.sqrt(252) if len(long_returns) >= 20 else np.nan
    else:
        long_vol = np.nan
    
    if not np.isnan(short_vol) and not np.isnan(long_vol):
        vol = VOL_SHORT_WEIGHT * short_vol + VOL_LONG_WEIGHT * long_vol
    elif not np.isnan(short_vol):
        vol = short_vol
    elif not np.isnan(long_vol):
        vol = long_vol
    else:
        vol = 0.20
    
    return max(vol, VOL_FLOOR)


def select_attack_stocks(universe, idx, top_n, momentum_period=MOMENTUM_PERIOD):
    momentum_scores = []
    for symbol in universe:
        mom = calc_momentum(symbol, idx, momentum_period)
        if not np.isnan(mom):
            momentum_scores.append((symbol, mom))
    
    if len(momentum_scores) < top_n:
        return [], {}
    
    momentum_scores.sort(key=lambda x: x[1], reverse=True)
    selected = [s[0] for s in momentum_scores[:top_n]]
    
    inv_vols = []
    for symbol in selected:
        vol = calc_volatility_improved(symbol, idx)
        inv_vols.append(1 / vol)
    
    total_inv = sum(inv_vols)
    weights = {s: min(iv / total_inv, WEIGHT_CAP) for s, iv in zip(selected, inv_vols)}
    
    total_weight = sum(weights.values())
    weights = {s: w / total_weight for s, w in weights.items()}
    
    return selected, weights


def select_defense_etfs(etfs, idx, top_n, momentum_period=MOMENTUM_PERIOD):
    momentum_scores = []
    for symbol in etfs:
        mom = calc_momentum(symbol, idx, momentum_period)
        if not np.isnan(mom):
            momentum_scores.append((symbol, mom))
    
    if len(momentum_scores) < top_n:
        return [], {}
    
    momentum_scores.sort(key=lambda x: x[1], reverse=True)
    selected = [s[0] for s in momentum_scores[:top_n]]
    
    inv_vols = []
    for symbol in selected:
        vol = calc_volatility_improved(symbol, idx)
        inv_vols.append(1 / vol)
    
    total_inv = sum(inv_vols)
    weights = {s: min(iv / total_inv, WEIGHT_CAP) for s, iv in zip(selected, inv_vols)}
    
    total_weight = sum(weights.values())
    weights = {s: w / total_weight for s, w in weights.items()}
    
    return selected, weights


def calc_portfolio_volatility(selected, weights, idx):
    if idx < VOLSCALE_LOOKBACK:
        return 0.15
    
    returns_matrix = []
    weight_list = []
    
    for symbol in selected:
        if symbol not in price_data:
            continue
        prices = price_data[symbol]
        period_prices = prices[idx - VOLSCALE_LOOKBACK:idx + 1]
        if len(period_prices) < VOLSCALE_LOOKBACK:
            continue
        returns = np.diff(period_prices) / period_prices[:-1]
        if np.any(np.isnan(returns)):
            continue
        returns_matrix.append(returns)
        weight_list.append(weights.get(symbol, 0))
    
    if len(returns_matrix) == 0:
        return 0.15
    
    returns_matrix = np.array(returns_matrix)
    weight_arr = np.array(weight_list)
    weight_arr = weight_arr / weight_arr.sum()
    
    portfolio_returns = np.dot(weight_arr, returns_matrix)
    vol = np.std(portfolio_returns) * np.sqrt(252)
    
    return max(vol, VOL_FLOOR) if vol > 0 else 0.15


def calc_volscale_factor(selected, weights, idx, target_vol):
    realized_vol = calc_portfolio_volatility(selected, weights, idx)
    scale = target_vol / realized_vol if realized_vol > 0 else 1.0
    scale = np.clip(scale, VOLSCALE_MIN, VOLSCALE_MAX)
    return scale, realized_vol


def calc_turnover(prev_weights, curr_weights):
    all_symbols = set(prev_weights.keys()) | set(curr_weights.keys())
    turnover = 0.0
    for symbol in all_symbols:
        prev_w = prev_weights.get(symbol, 0)
        curr_w = curr_weights.get(symbol, 0)
        turnover += abs(curr_w - prev_w)
    return turnover / 2


def calc_monthly_return_with_cost(selected, weights, start_idx, end_idx, prev_weights, transaction_cost=TRANSACTION_COST):
    month_return = 0.0
    for symbol in selected:
        if symbol not in price_data:
            continue
        start_price = price_data[symbol][start_idx]
        end_price = price_data[symbol][end_idx]
        if np.isnan(start_price) or np.isnan(end_price) or start_price <= 0:
            continue
        ret = (end_price / start_price) - 1
        month_return += ret * weights[symbol]
    
    turnover = calc_turnover(prev_weights, weights)
    cost = transaction_cost * turnover
    
    return month_return - cost, turnover


def is_bull_regime(idx):
    if idx < MA_PERIOD:
        return True
    spy_price = spy_prices[idx]
    ma200 = np.mean(spy_prices[idx - MA_PERIOD + 1:idx + 1])
    if np.isnan(spy_price) or np.isnan(ma200):
        return True
    return spy_price >= ma200 * REGIME_THRESHOLD


def calc_metrics(returns):
    returns = np.array(returns)
    if len(returns) == 0:
        return {}
    
    cumulative = np.prod(1 + returns) - 1
    years = len(returns) / 12
    cagr = (1 + cumulative) ** (1 / years) - 1 if years > 0 else 0
    
    cum_returns = np.cumprod(1 + returns)
    running_max = np.maximum.accumulate(cum_returns)
    drawdowns = cum_returns / running_max - 1
    max_dd = np.min(drawdowns)
    
    mean_ret = np.mean(returns) * 12
    std_ret = np.std(returns) * np.sqrt(12)
    sharpe = mean_ret / std_ret if std_ret > 0 else 0
    
    neg_returns = returns[returns < 0]
    downside_std = np.std(neg_returns) * np.sqrt(12) if len(neg_returns) > 0 else 0.001
    sortino = mean_ret / downside_std if downside_std > 0 else 0
    
    calmar = cagr / abs(max_dd) if max_dd < 0 else 0
    
    return {
        'cumulative': cumulative,
        'cagr': cagr,
        'max_dd': max_dd,
        'sharpe': sharpe,
        'sortino': sortino,
        'calmar': calmar
    }


# =============================================================================
# 戦略シミュレーション関数（パラメータ可変）
# =============================================================================

# S&P100シンボルリスト（D2戦略用）
SP100_SYMBOLS = [
    'AAPL', 'ABBV', 'ABT', 'ACN', 'ADBE', 'AIG', 'AMD', 'AMGN', 'AMT', 'AMZN',
    'AVGO', 'AXP', 'BA', 'BAC', 'BK', 'BKNG', 'BLK', 'BMY', 'BRK.B', 'C',
    'CAT', 'CHTR', 'CL', 'CMCSA', 'COF', 'COP', 'COST', 'CRM', 'CSCO', 'CVS',
    'CVX', 'DE', 'DHR', 'DIS', 'DOW', 'DUK', 'EMR', 'EXC', 'F', 'FDX',
    'GD', 'GE', 'GILD', 'GM', 'GOOG', 'GOOGL', 'GS', 'HD', 'HON', 'IBM',
    'INTC', 'JNJ', 'JPM', 'KHC', 'KO', 'LIN', 'LLY', 'LMT', 'LOW', 'MA',
    'MCD', 'MDLZ', 'MDT', 'MET', 'META', 'MMM', 'MO', 'MRK', 'MS', 'MSFT',
    'NEE', 'NFLX', 'NKE', 'NVDA', 'ORCL', 'PEP', 'PFE', 'PG', 'PM', 'PYPL',
    'QCOM', 'RTX', 'SBUX', 'SCHW', 'SO', 'SPG', 'T', 'TGT', 'TMO', 'TMUS',
    'TSLA', 'TXN', 'UNH', 'UNP', 'UPS', 'USB', 'V', 'VZ', 'WBA', 'WFC',
    'WMT', 'XOM'
]
sp100_symbols = [s for s in SP100_SYMBOLS if s in ALL_SYMBOLS and f'{s}_Close' in df.columns]

# 全13戦略の定義
ALL_13_STRATEGIES = [
    'D2', 'D3', '防御型TOP5', '防御型TOP3',
    'D2+防御型', 'D3+防御型', 'SPY',
    'D2_VolScale', 'D3_VolScale',
    '防御型TOP5_VolScale', '防御型TOP3_VolScale',
    'D2+防御型_VolScale', 'D3+防御型_VolScale'
]

def run_strategy_simulation(
    momentum_period=126,
    top_n=5,
    transaction_cost=0.002,
    target_vol=0.14,
    rebalance_offset=0,
    indices_override=None
):
    """
    全13戦略のシミュレーションを実行
    
    Args:
        momentum_period (int): モメンタム計算期間（日数、デフォルト126=6ヶ月）
        top_n (int): 選択銘柄数（デフォルト5）
        transaction_cost (float): 取引コスト率（デフォルト0.002=0.2%）
        target_vol (float): 目標ボラティリティ（デフォルト0.14=14%）
        rebalance_offset (int): リバランス日オフセット（0=月初, 5=月中, -1=月末）
        indices_override (list): カスタム月次インデックス（オプション）
    
    Returns:
        dict: 全13戦略の月次リターン、スケールファクター、ターンオーバー
    """
    indices = indices_override if indices_override else monthly_indices
    
    # 全13戦略の結果を初期化
    results = {}
    for strategy in ALL_13_STRATEGIES:
        if strategy == 'SPY':
            results[strategy] = {'returns': []}
        else:
            results[strategy] = {'returns': [], 'scale_factors': [], 'turnovers': []}
    
    prev_weights = {s: {} for s in ALL_13_STRATEGIES if s != 'SPY'}
    
    for i in range(len(indices) - 1):
        start_idx, month_start = indices[i]
        end_idx, month_end = indices[i + 1]
        
        # リバランスオフセット適用
        start_idx = min(start_idx + rebalance_offset, end_idx - 1)
        end_idx -= 1
        
        selection_idx = start_idx - 1
        if selection_idx < momentum_period:
            continue
        
        bull = is_bull_regime(selection_idx)
        
        # D2: S&P100モメンタム（VolScaleなし）
        selected_d2, weights_d2 = select_attack_stocks(sp100_symbols, selection_idx, top_n, momentum_period)
        if selected_d2:
            base_ret, turnover = calc_monthly_return_with_cost(selected_d2, weights_d2, start_idx, end_idx, prev_weights['D2'], transaction_cost)
            results['D2']['returns'].append(base_ret)
            results['D2']['scale_factors'].append(1.0)
            results['D2']['turnovers'].append(turnover)
            prev_weights['D2'] = weights_d2
        
        # D3: S&P500モメンタム（VolScaleなし）
        selected_d3, weights_d3 = select_attack_stocks(sp500_symbols, selection_idx, top_n, momentum_period)
        if selected_d3:
            base_ret, turnover = calc_monthly_return_with_cost(selected_d3, weights_d3, start_idx, end_idx, prev_weights['D3'], transaction_cost)
            results['D3']['returns'].append(base_ret)
            results['D3']['scale_factors'].append(1.0)
            results['D3']['turnovers'].append(turnover)
            prev_weights['D3'] = weights_d3
        
        # 防御型TOP5: 防御ETFのみTOP5（VolScaleなし）
        selected_def5, weights_def5 = select_defense_etfs(DEFENSE_ETFS, selection_idx, 5, momentum_period)
        if selected_def5:
            base_ret, turnover = calc_monthly_return_with_cost(selected_def5, weights_def5, start_idx, end_idx, prev_weights['防御型TOP5'], transaction_cost)
            results['防御型TOP5']['returns'].append(base_ret)
            results['防御型TOP5']['scale_factors'].append(1.0)
            results['防御型TOP5']['turnovers'].append(turnover)
            prev_weights['防御型TOP5'] = weights_def5
        
        # 防御型TOP3: 防御ETFのみTOP3（VolScaleなし）
        selected_def3, weights_def3 = select_defense_etfs(DEFENSE_ETFS, selection_idx, 3, momentum_period)
        if selected_def3:
            base_ret, turnover = calc_monthly_return_with_cost(selected_def3, weights_def3, start_idx, end_idx, prev_weights['防御型TOP3'], transaction_cost)
            results['防御型TOP3']['returns'].append(base_ret)
            results['防御型TOP3']['scale_factors'].append(1.0)
            results['防御型TOP3']['turnovers'].append(turnover)
            prev_weights['防御型TOP3'] = weights_def3
        
        # D2+防御型: レジーム切り替え（VolScaleなし）
        if bull:
            selected_d2d, weights_d2d = selected_d2, weights_d2
        else:
            selected_d2d, weights_d2d = selected_def3, weights_def3
        if selected_d2d:
            base_ret, turnover = calc_monthly_return_with_cost(selected_d2d, weights_d2d, start_idx, end_idx, prev_weights['D2+防御型'], transaction_cost)
            results['D2+防御型']['returns'].append(base_ret)
            results['D2+防御型']['scale_factors'].append(1.0)
            results['D2+防御型']['turnovers'].append(turnover)
            prev_weights['D2+防御型'] = weights_d2d
        
        # D3+防御型: レジーム切り替え（VolScaleなし）
        if bull:
            selected_d3d, weights_d3d = selected_d3, weights_d3
        else:
            selected_d3d, weights_d3d = selected_def3, weights_def3
        if selected_d3d:
            base_ret, turnover = calc_monthly_return_with_cost(selected_d3d, weights_d3d, start_idx, end_idx, prev_weights['D3+防御型'], transaction_cost)
            results['D3+防御型']['returns'].append(base_ret)
            results['D3+防御型']['scale_factors'].append(1.0)
            results['D3+防御型']['turnovers'].append(turnover)
            prev_weights['D3+防御型'] = weights_d3d
        
        # SPY
        spy_start = spy_prices[start_idx]
        spy_end = spy_prices[end_idx]
        if not np.isnan(spy_start) and not np.isnan(spy_end) and spy_start > 0:
            results['SPY']['returns'].append((spy_end / spy_start) - 1)
        
        # D2_VolScale
        if selected_d2:
            scale, _ = calc_volscale_factor(selected_d2, weights_d2, selection_idx, target_vol * 1.36)
            base_ret, turnover = calc_monthly_return_with_cost(selected_d2, weights_d2, start_idx, end_idx, prev_weights['D2_VolScale'], transaction_cost)
            results['D2_VolScale']['returns'].append(base_ret * scale)
            results['D2_VolScale']['scale_factors'].append(scale)
            results['D2_VolScale']['turnovers'].append(turnover)
            prev_weights['D2_VolScale'] = weights_d2
        
        # D3_VolScale
        if selected_d3:
            scale, _ = calc_volscale_factor(selected_d3, weights_d3, selection_idx, target_vol * 1.36)
            base_ret, turnover = calc_monthly_return_with_cost(selected_d3, weights_d3, start_idx, end_idx, prev_weights['D3_VolScale'], transaction_cost)
            results['D3_VolScale']['returns'].append(base_ret * scale)
            results['D3_VolScale']['scale_factors'].append(scale)
            results['D3_VolScale']['turnovers'].append(turnover)
            prev_weights['D3_VolScale'] = weights_d3
        
        # 防御型TOP5_VolScale
        if selected_def5:
            scale, _ = calc_volscale_factor(selected_def5, weights_def5, selection_idx, target_vol)
            base_ret, turnover = calc_monthly_return_with_cost(selected_def5, weights_def5, start_idx, end_idx, prev_weights['防御型TOP5_VolScale'], transaction_cost)
            results['防御型TOP5_VolScale']['returns'].append(base_ret * scale)
            results['防御型TOP5_VolScale']['scale_factors'].append(scale)
            results['防御型TOP5_VolScale']['turnovers'].append(turnover)
            prev_weights['防御型TOP5_VolScale'] = weights_def5
        
        # 防御型TOP3_VolScale
        if selected_def3:
            scale, _ = calc_volscale_factor(selected_def3, weights_def3, selection_idx, target_vol)
            base_ret, turnover = calc_monthly_return_with_cost(selected_def3, weights_def3, start_idx, end_idx, prev_weights['防御型TOP3_VolScale'], transaction_cost)
            results['防御型TOP3_VolScale']['returns'].append(base_ret * scale)
            results['防御型TOP3_VolScale']['scale_factors'].append(scale)
            results['防御型TOP3_VolScale']['turnovers'].append(turnover)
            prev_weights['防御型TOP3_VolScale'] = weights_def3
        
        # D2+防御型_VolScale
        if selected_d2d:
            scale, _ = calc_volscale_factor(selected_d2d, weights_d2d, selection_idx, target_vol)
            base_ret, turnover = calc_monthly_return_with_cost(selected_d2d, weights_d2d, start_idx, end_idx, prev_weights['D2+防御型_VolScale'], transaction_cost)
            results['D2+防御型_VolScale']['returns'].append(base_ret * scale)
            results['D2+防御型_VolScale']['scale_factors'].append(scale)
            results['D2+防御型_VolScale']['turnovers'].append(turnover)
            prev_weights['D2+防御型_VolScale'] = weights_d2d
        
        # D3+防御型_VolScale
        if selected_d3d:
            scale, _ = calc_volscale_factor(selected_d3d, weights_d3d, selection_idx, target_vol)
            base_ret, turnover = calc_monthly_return_with_cost(selected_d3d, weights_d3d, start_idx, end_idx, prev_weights['D3+防御型_VolScale'], transaction_cost)
            results['D3+防御型_VolScale']['returns'].append(base_ret * scale)
            results['D3+防御型_VolScale']['scale_factors'].append(scale)
            results['D3+防御型_VolScale']['turnovers'].append(turnover)
            prev_weights['D3+防御型_VolScale'] = weights_d3d
    
    return results


# =============================================================================
# テスト1: 取引コスト感度分析
# =============================================================================
print()
print("=" * 80)
print("テスト1: 取引コスト感度分析")
print("=" * 80)

cost_scenarios = [0.001, 0.002, 0.005, 0.010]  # 0.1%, 0.2%, 0.5%, 1.0%
cost_results = {}

for cost in cost_scenarios:
    results = run_strategy_simulation(transaction_cost=cost)
    cost_results[cost] = {
        strategy: calc_metrics(data['returns'])
        for strategy, data in results.items()
    }

print()
# 全戦略のSharpeを表示
print("全戦略のコスト感度分析:")
for strategy in ALL_13_STRATEGIES:
    print(f"\n{strategy}:")
    for cost in cost_scenarios:
        sharpe = cost_results[cost].get(strategy, {}).get('sharpe', 0)
        print(f"  {cost*100:.1f}%: Sharpe={sharpe:.2f}")

# 損益分岐点計算
print()
print("【損益分岐点分析】")
spy_sharpe = cost_results[0.002]['SPY']['sharpe']
for strategy in ALL_13_STRATEGIES:
    if strategy == 'SPY':
        continue
    for cost in cost_scenarios:
        if cost_results[cost].get(strategy, {}).get('sharpe', 0) < spy_sharpe:
            print(f"{strategy}: Sharpe < SPY となるコスト = {cost*100:.1f}%")
            break
    else:
        print(f"{strategy}: 1.0%コストでもSPYを上回る")


# =============================================================================
# テスト2: レジーム別パフォーマンス分解
# =============================================================================
print()
print("=" * 80)
print("テスト2: レジーム別パフォーマンス分解")
print("=" * 80)

# レジーム定義
regimes = {
    'GFC (2007-2009)': (pd.Timestamp('2007-01-01'), pd.Timestamp('2009-12-31')),
    '低金利期 (2010-2019)': (pd.Timestamp('2010-01-01'), pd.Timestamp('2019-12-31')),
    'コロナ (2020)': (pd.Timestamp('2020-01-01'), pd.Timestamp('2020-12-31')),
    'インフレ期 (2021-2022)': (pd.Timestamp('2021-01-01'), pd.Timestamp('2022-12-31')),
    '直近 (2023-2025)': (pd.Timestamp('2023-01-01'), pd.Timestamp('2025-12-31')),
}

# 全期間シミュレーション（月次リターンと日付を保持）
full_results = run_strategy_simulation()

# 月次リターンと日付を対応付け
n_returns = len(full_results['D3+防御型_VolScale']['returns'])
start_offset = len(monthly_dates) - n_returns - 1
return_dates = monthly_dates[start_offset + 1:start_offset + 1 + n_returns]

regime_results = {}
for regime_name, (start_date, end_date) in regimes.items():
    regime_returns = {strategy: [] for strategy in ['D3_VolScale', 'D3+防御型_VolScale', 'SPY']}
    
    for i, date in enumerate(return_dates):
        if start_date <= date <= end_date:
            for strategy in regime_returns.keys():
                if i < len(full_results[strategy]['returns']):
                    regime_returns[strategy].append(full_results[strategy]['returns'][i])
    
    regime_results[regime_name] = {
        strategy: calc_metrics(returns) if returns else {}
        for strategy, returns in regime_returns.items()
    }

print()
print(f"{'レジーム':<25} {'D3_VolScale':>15} {'D3+防御型':>15} {'SPY':>10}")
print(f"{'':25} {'CAGR / MaxDD':>15} {'CAGR / MaxDD':>15} {'CAGR / MaxDD':>10}")
print("-" * 70)
for regime_name in regimes.keys():
    d3 = regime_results[regime_name].get('D3_VolScale', {})
    regime = regime_results[regime_name].get('D3+防御型_VolScale', {})
    spy = regime_results[regime_name].get('SPY', {})
    
    d3_str = f"{d3.get('cagr', 0)*100:+.1f}% / {d3.get('max_dd', 0)*100:.1f}%" if d3 else "N/A"
    regime_str = f"{regime.get('cagr', 0)*100:+.1f}% / {regime.get('max_dd', 0)*100:.1f}%" if regime else "N/A"
    spy_str = f"{spy.get('cagr', 0)*100:+.1f}% / {spy.get('max_dd', 0)*100:.1f}%" if spy else "N/A"
    
    print(f"{regime_name:<25} {d3_str:>15} {regime_str:>15} {spy_str:>10}")


# =============================================================================
# テスト3: テールリスク分析
# =============================================================================
print()
print("=" * 80)
print("テスト3: テールリスク分析")
print("=" * 80)

def calc_tail_metrics(returns):
    """
    テールリスク指標を計算
    
    CVaR、最悑12ヶ月リターン、ドローダウン滞在期間を算出。
    
    Args:
        returns (list): 月次リターンのリスト
    
    Returns:
        dict: テールリスク指標
            - cvar_5: 5%CVaR（条件付きVaR）
            - worst_12m: 最悑12ヶ月リターン
            - dd_duration: ドローダウン滞在期間（月）
    """
    returns = np.array(returns)
    if len(returns) < 12:
        return {}
    
    # CVaR (5%)
    sorted_returns = np.sort(returns)
    var_5 = np.percentile(returns, 5)
    cvar_5 = np.mean(sorted_returns[sorted_returns <= var_5])
    
    # 最悪12ヶ月
    rolling_12m = []
    for i in range(len(returns) - 11):
        rolling_ret = np.prod(1 + returns[i:i+12]) - 1
        rolling_12m.append(rolling_ret)
    worst_12m = min(rolling_12m) if rolling_12m else np.nan
    
    # 最悪3ヶ月
    rolling_3m = []
    for i in range(len(returns) - 2):
        rolling_ret = np.prod(1 + returns[i:i+3]) - 1
        rolling_3m.append(rolling_ret)
    worst_3m = min(rolling_3m) if rolling_3m else np.nan
    
    # DD滞在期間（平均）
    cum_returns = np.cumprod(1 + returns)
    running_max = np.maximum.accumulate(cum_returns)
    in_dd = cum_returns < running_max
    
    dd_durations = []
    current_duration = 0
    for is_in_dd in in_dd:
        if is_in_dd:
            current_duration += 1
        else:
            if current_duration > 0:
                dd_durations.append(current_duration)
            current_duration = 0
    if current_duration > 0:
        dd_durations.append(current_duration)
    
    avg_dd_duration = np.mean(dd_durations) if dd_durations else 0
    max_dd_duration = max(dd_durations) if dd_durations else 0
    
    # 負け月の連続
    max_losing_streak = 0
    current_streak = 0
    for r in returns:
        if r < 0:
            current_streak += 1
            max_losing_streak = max(max_losing_streak, current_streak)
        else:
            current_streak = 0
    
    return {
        'cvar_5': cvar_5,
        'worst_12m': worst_12m,
        'worst_3m': worst_3m,
        'avg_dd_duration': avg_dd_duration,
        'max_dd_duration': max_dd_duration,
        'max_losing_streak': max_losing_streak
    }

tail_results = {}
for strategy in ALL_13_STRATEGIES:
    tail_results[strategy] = calc_tail_metrics(full_results[strategy]['returns'])

print()
print("全戦略のテールリスク分析:")
for strategy in ALL_13_STRATEGIES:
    t = tail_results[strategy]
    if t:
        print(f"\n{strategy}:")
        print(f"  CVaR(5%): {t.get('cvar_5', 0)*100:.2f}%")
        print(f"  最悪12ヶ月: {t.get('worst_12m', 0)*100:.1f}%")
        print(f"  最悪3ヶ月: {t.get('worst_3m', 0)*100:.1f}%")
        print(f"  平均DD滞在: {t.get('avg_dd_duration', 0):.1f}ヶ月")
        print(f"  最大DD滞在: {t.get('max_dd_duration', 0):.0f}ヶ月")
        print(f"  最大負け連続: {t.get('max_losing_streak', 0):.0f}ヶ月")

# 以下は互換性のため残す（削除予定）
metrics_labels = [
    ('CVaR (5%)', 'cvar_5', lambda x: f"{x*100:.2f}%"),
    ('最悪12ヶ月', 'worst_12m', lambda x: f"{x*100:.1f}%"),
    ('最悪3ヶ月', 'worst_3m', lambda x: f"{x*100:.1f}%"),
    ('平均DD滞在期間', 'avg_dd_duration', lambda x: f"{x:.1f}ヶ月"),
    ('最大DD滞在期間', 'max_dd_duration', lambda x: f"{x:.0f}ヶ月"),
    ('最大負け連続', 'max_losing_streak', lambda x: f"{x:.0f}ヶ月"),
]

# 旧形式の出力（互換性）
for label, key, fmt in metrics_labels:
    d3_val = tail_results['D3_VolScale'].get(key, np.nan)
    regime_val = tail_results['D3+防御型_VolScale'].get(key, np.nan)
    spy_val = tail_results['SPY'].get(key, np.nan)
    print(f"{label:<25} {fmt(d3_val):>15} {fmt(regime_val):>15} {fmt(spy_val):>15}")


# =============================================================================
# テスト4: パラメータ感度分析
# =============================================================================
print()
print("=" * 80)
print("テスト4: パラメータ感度分析（モメンタム期間 × 銘柄数）")
print("=" * 80)

momentum_periods = [63, 126, 189, 252]  # 3, 6, 9, 12ヶ月
top_n_values = [3, 5, 10]

param_results = {}
for mom_period in momentum_periods:
    for top_n in top_n_values:
        key = f"mom{mom_period//21}m_top{top_n}"
        results = run_strategy_simulation(momentum_period=mom_period, top_n=top_n)
        param_results[key] = {
            strategy: calc_metrics(data['returns'])
            for strategy, data in results.items()
        }

print()
print("【全戦略のパラメータ感度分析】")
for strategy in ALL_13_STRATEGIES:
    print(f"\n{strategy} Sharpe ヒートマップ:")
    print(f"{'モメンタム期間':>15}", end="")
    for top_n in top_n_values:
        print(f"{'Top'+str(top_n):>10}", end="")
    print()
    print("-" * 45)
    
    for mom_period in momentum_periods:
        mom_label = f"{mom_period//21}ヶ月"
        print(f"{mom_label:>15}", end="")
        for top_n in top_n_values:
            key = f"mom{mom_period//21}m_top{top_n}"
            sharpe = param_results[key].get(strategy, {}).get('sharpe', 0)
            print(f"{sharpe:>10.2f}", end="")
        print()

# 現在値（6ヶ月、Top5）との比較
print()
print("【現在値（6ヶ月・Top5）との比較】")
for strategy in ALL_13_STRATEGIES:
    baseline_sharpe = param_results['mom6m_top5'].get(strategy, {}).get('sharpe', 0)
    stable_count = 0
    total_count = 0
    for key, data in param_results.items():
        sharpe = data.get(strategy, {}).get('sharpe', 0)
        if sharpe >= baseline_sharpe * 0.7:  # 70%以上を維持
            stable_count += 1
        total_count += 1
    print(f"{strategy}: 現在値Sharpe={baseline_sharpe:.2f}, 70%以上維持={stable_count}/{total_count}")


# =============================================================================
# テスト5: ブロックブートストラップ
# =============================================================================
print()
print("=" * 80)
print("テスト5: ブロックブートストラップ（Sharpe/MaxDDの95%CI）")
print("=" * 80)

def block_bootstrap(returns, n_bootstrap=1000, block_size=12, seed=42):
    """ブロックブートストラップでSharpe/MaxDDの分布を推定
    
    Args:
        returns: 月次リターンの配列
        n_bootstrap: ブートストラップ回数（デフォルト1000）
        block_size: ブロックサイズ（デフォルト12ヶ月）
        seed: 乱数シード（デフォルト42、再現性確保のため）
    """
    np.random.seed(seed)  # 再現性のためシードを固定
    returns = np.array(returns)
    n = len(returns)
    
    sharpes = []
    max_dds = []
    
    for _ in range(n_bootstrap):
        # ブロックサンプリング
        n_blocks = int(np.ceil(n / block_size))
        sampled_returns = []
        
        for _ in range(n_blocks):
            start = np.random.randint(0, n - block_size + 1)
            sampled_returns.extend(returns[start:start + block_size])
        
        sampled_returns = np.array(sampled_returns[:n])
        
        # 指標計算
        metrics = calc_metrics(sampled_returns)
        sharpes.append(metrics['sharpe'])
        max_dds.append(metrics['max_dd'])
    
    return {
        'sharpe_mean': np.mean(sharpes),
        'sharpe_std': np.std(sharpes),
        'sharpe_ci_lower': np.percentile(sharpes, 2.5),
        'sharpe_ci_upper': np.percentile(sharpes, 97.5),
        'max_dd_mean': np.mean(max_dds),
        'max_dd_ci_lower': np.percentile(max_dds, 2.5),
        'max_dd_ci_upper': np.percentile(max_dds, 97.5),
        'prob_sharpe_gt_1': np.mean(np.array(sharpes) > 1.0),
    }

bootstrap_results = {}
for strategy in ALL_13_STRATEGIES:
    bootstrap_results[strategy] = block_bootstrap(full_results[strategy]['returns'])

print()
print("全戦略のブートストラップ結果:")
for strategy in ALL_13_STRATEGIES:
    bs = bootstrap_results[strategy]
    print(f"\n{strategy}:")
    print(f"  Sharpe: {bs['sharpe_mean']:.2f} [95%CI: {bs['sharpe_ci_lower']:.2f}, {bs['sharpe_ci_upper']:.2f}]")
    print(f"  MaxDD: {bs['max_dd_mean']*100:.1f}% [95%CI: {bs['max_dd_ci_lower']*100:.1f}%, {bs['max_dd_ci_upper']*100:.1f}%]")
    print(f"  P(Sharpe>1): {bs['prob_sharpe_gt_1']*100:.1f}%")


# =============================================================================
# テスト6: DSR/PSR計算
# =============================================================================
print()
print("=" * 80)
print("テスト6: DSR/PSR計算（統計的有意性の補正）")
print("=" * 80)

def calc_psr(returns, benchmark_sharpe=0):
    """
    Probabilistic Sharpe Ratio (PSR) を計算
    Bailey & López de Prado (2012)
    """
    returns = np.array(returns)
    n = len(returns)
    
    mean_ret = np.mean(returns)
    std_ret = np.std(returns, ddof=1)
    sharpe = mean_ret / std_ret * np.sqrt(12) if std_ret > 0 else 0
    
    # 歪度と尖度
    skew = stats.skew(returns)
    kurt = stats.kurtosis(returns)  # excess kurtosis
    
    # PSR計算
    # PSR = Φ((SR - SR*) × √(n-1) / √(1 - γ₃×SR + (γ₄-1)/4×SR²))
    sr_diff = sharpe - benchmark_sharpe
    denominator = np.sqrt(1 - skew * sharpe + (kurt - 1) / 4 * sharpe ** 2)
    
    if denominator > 0:
        z_score = sr_diff * np.sqrt(n - 1) / denominator
        psr = stats.norm.cdf(z_score)
    else:
        psr = 0.5
    
    return {
        'sharpe': sharpe,
        'skewness': skew,
        'kurtosis': kurt,
        'psr': psr,
        'n_samples': n
    }


def calc_dsr(returns, n_trials=10):
    """
    Deflated Sharpe Ratio (DSR) を計算
    Bailey & López de Prado (2014)
    
    n_trials: 試行回数（パラメータ組み合わせ数など）
    """
    returns = np.array(returns)
    n = len(returns)
    
    mean_ret = np.mean(returns)
    std_ret = np.std(returns, ddof=1)
    sharpe = mean_ret / std_ret * np.sqrt(12) if std_ret > 0 else 0
    
    # 期待される最大Sharpe（多重検定補正）
    # E[max(SR)] ≈ (1 - γ) × Φ⁻¹(1 - 1/n_trials) + γ × Φ⁻¹(1 - 1/(n_trials × e))
    # γ ≈ 0.5772 (Euler-Mascheroni constant)
    gamma = 0.5772
    expected_max_sr = (1 - gamma) * stats.norm.ppf(1 - 1/n_trials) + gamma * stats.norm.ppf(1 - 1/(n_trials * np.e))
    expected_max_sr *= np.sqrt(12 / n)  # 年率化とサンプルサイズ補正
    
    # DSR = PSR with benchmark = expected_max_sr
    psr_result = calc_psr(returns, benchmark_sharpe=expected_max_sr)
    
    return {
        'sharpe': sharpe,
        'expected_max_sr': expected_max_sr,
        'dsr': psr_result['psr'],
        'n_trials': n_trials
    }

print()
print("【全戦略のPSR (Probabilistic Sharpe Ratio)】")
for strategy in ALL_13_STRATEGIES:
    psr = calc_psr(full_results[strategy]['returns'])
    print(f"{strategy}: Sharpe={psr['sharpe']:.2f}, 歪度={psr['skewness']:.2f}, 尖度={psr['kurtosis']:.2f}, PSR={psr['psr']*100:.1f}%")

print()
print("【全戦略のDSR (Deflated Sharpe Ratio)】")
print("※ 試行回数 = 12（モメンタム期間4 × 銘柄数3）で補正")
for strategy in ALL_13_STRATEGIES:
    dsr = calc_dsr(full_results[strategy]['returns'], n_trials=12)
    print(f"{strategy}: Sharpe={dsr['sharpe']:.2f}, 期待最大SR={dsr['expected_max_sr']:.2f}, DSR={dsr['dsr']*100:.1f}%")


# =============================================================================
# テスト7: サバイバーシップバイアス補正
# =============================================================================
print()
print("=" * 80)
print("テスト7: サバイバーシップバイアス補正")
print("=" * 80)

# 学術研究に基づく補正（年率-1.5%〜-3%）
SURVIVORSHIP_PENALTY_ANNUAL = 0.02  # 年率2%のペナルティ

print()
print("【サバイバーシップバイアスの影響推定】")
print("※ 学術研究に基づき、年率-2%のペナルティを適用")
print()

original_metrics = {
    strategy: calc_metrics(full_results[strategy]['returns'])
    for strategy in ALL_13_STRATEGIES
}

# 月次ペナルティ
monthly_penalty = SURVIVORSHIP_PENALTY_ANNUAL / 12

adjusted_results = {}
for strategy in ALL_13_STRATEGIES:
    if strategy != 'SPY':  # SPYはETFなのでサバイバーシップバイアスなし
        adjusted_returns = [r - monthly_penalty for r in full_results[strategy]['returns']]
        adjusted_results[strategy] = calc_metrics(adjusted_returns)

# SPYはバイアスなし
adjusted_results['SPY'] = original_metrics['SPY']

print("全戦略のサバイバーシップバイアス補正:")
for strategy in ALL_13_STRATEGIES:
    orig = original_metrics[strategy]
    if strategy in adjusted_results:
        adj = adjusted_results[strategy]
        print(f"{strategy}: 元CAGR={orig['cagr']*100:.1f}%, 補正後CAGR={adj['cagr']*100:.1f}%, 元Sharpe={orig['sharpe']:.2f}, 補正後Sharpe={adj['sharpe']:.2f}")
    else:
        print(f"{strategy}: 元CAGR={orig['cagr']*100:.1f}%, Sharpe={orig['sharpe']:.2f} (ETFのため補正なし)")


# =============================================================================
# テスト8: レバレッジ分析
# =============================================================================
print()
print("=" * 80)
print("テスト8: レバレッジ分析")
print("=" * 80)

# スケールファクターの分析（VolScale戦略のみ）
volscale_strategies = [s for s in ALL_13_STRATEGIES if 'VolScale' in s]
scale_factors = {}
for strategy in volscale_strategies:
    if 'scale_factors' in full_results[strategy]:
        scale_factors[strategy] = full_results[strategy]['scale_factors']

print()
print("【全VolScale戦略のスケールファクター（レバレッジ）の分布】")
for strategy, factors in scale_factors.items():
    factors = np.array(factors)
    mean_scale = np.mean(factors)
    max_scale = np.max(factors)
    lev_gt_1_count = np.sum(factors > 1.0)
    lev_gt_1_ratio = lev_gt_1_count / len(factors)
    print(f"{strategy}: 平均={mean_scale:.2f}, 最大={max_scale:.2f}, レバ>1比率={lev_gt_1_ratio*100:.1f}%")

# 資金調達コストの影響（SOFR + スプレッド ≈ 5%/年）
FUNDING_COST_ANNUAL = 0.05

print()
print("【資金調達コストの影響】")
print(f"※ レバレッジ部分に年率{FUNDING_COST_ANNUAL*100:.0f}%の調達コストを適用")

funding_adjusted_results = {}
for strategy in volscale_strategies:
    if strategy in scale_factors:
        factors = np.array(scale_factors[strategy])
        returns = np.array(full_results[strategy]['returns'])
        
        # レバレッジ部分（scale - 1）に対して調達コストを適用
        leverage_portion = np.maximum(factors - 1, 0)
        monthly_funding_cost = leverage_portion * (FUNDING_COST_ANNUAL / 12)
        adjusted_returns = returns - monthly_funding_cost
        
        funding_adjusted_results[strategy] = calc_metrics(adjusted_returns)

print()
print("全VolScale戦略の資金調達コスト影響:")
for strategy in volscale_strategies:
    if strategy in funding_adjusted_results:
        orig = original_metrics[strategy]['sharpe']
        adj = funding_adjusted_results[strategy]['sharpe']
        diff = adj - orig
        print(f"{strategy}: 元Sharpe={orig:.2f}, 調達コスト後Sharpe={adj:.2f}, 差分={diff:+.2f}")


# =============================================================================
# テスト9: リバランス日感度
# =============================================================================
print()
print("=" * 80)
print("テスト9: リバランス日感度")
print("=" * 80)

rebalance_offsets = {
    '月初': 0,
    '月中（+5日）': 5,
    '月末（-5日）': -5,
}

rebalance_results = {}
for label, offset in rebalance_offsets.items():
    results = run_strategy_simulation(rebalance_offset=offset)
    rebalance_results[label] = {
        strategy: calc_metrics(data['returns'])
        for strategy, data in results.items()
    }

print()
print("【全戦略のリバランス日感度】")
for strategy in ALL_13_STRATEGIES:
    print(f"\n{strategy}:")
    for label in rebalance_offsets.keys():
        sharpe = rebalance_results[label].get(strategy, {}).get('sharpe', 0)
        print(f"  {label}: Sharpe={sharpe:.2f}")

# 感度評価（全戦略）
print()
print("【リバランス日感度サマリー】")
for strategy in ALL_13_STRATEGIES:
    baseline_sharpe = rebalance_results['月初'].get(strategy, {}).get('sharpe', 0)
    max_diff = 0
    for label, data in rebalance_results.items():
        diff = abs(data.get(strategy, {}).get('sharpe', 0) - baseline_sharpe)
        max_diff = max(max_diff, diff)
    
    if max_diff < 0.1:
        sensitivity = "低（ロバスト）"
    elif max_diff < 0.2:
        sensitivity = "中"
    else:
        sensitivity = "高（要注意）"
    print(f"{strategy}: 最大Sharpe差={max_diff:.2f}, 感度={sensitivity}")


# =============================================================================
# テスト10: モンテカルロ順列検定
# =============================================================================
print()
print("=" * 80)
print("テスト10: モンテカルロ順列検定（統計的有意性）")
print("=" * 80)

def monte_carlo_permutation_test(strategy_returns, benchmark_returns, n_simulations=10000):
    """モンテカルロ順列検定"""
    np.random.seed(42)
    
    n = min(len(strategy_returns), len(benchmark_returns))
    strategy_returns = np.array(strategy_returns[:n])
    benchmark_returns = np.array(benchmark_returns[:n])
    
    excess_returns = strategy_returns - benchmark_returns
    observed_mean = np.mean(excess_returns)
    
    simulated_means = []
    for _ in range(n_simulations):
        signs = np.random.choice([-1, 1], size=len(excess_returns))
        simulated_means.append(np.mean(excess_returns * signs))
    
    p_value = np.mean(np.array(simulated_means) >= observed_mean)
    
    return {
        'observed_mean': float(observed_mean),
        'p_value': float(p_value),
        'significant_005': p_value < 0.05,
        'significant_001': p_value < 0.01
    }

spy_returns = full_results['SPY']['returns']
mc_results = {}

print()
print("【全戦略のモンテカルロ順列検定結果】")
for strategy in ALL_13_STRATEGIES:
    if strategy != 'SPY':
        result = monte_carlo_permutation_test(full_results[strategy]['returns'], spy_returns)
        mc_results[strategy] = result
        sig = "✅ 有意" if result['significant_005'] else "❌ 非有意"
        print(f"{strategy}: 超過リターン={result['observed_mean']*100:.3f}%, p値={result['p_value']:.4f}, {sig}")


# =============================================================================
# テスト11: Cohen's d（効果量）
# =============================================================================
print()
print("=" * 80)
print("テスト11: Cohen's d（効果量）")
print("=" * 80)

def calc_cohens_d(strategy_returns, benchmark_returns):
    """Cohen's dを計算"""
    n1, n2 = len(strategy_returns), len(benchmark_returns)
    var1, var2 = np.var(strategy_returns, ddof=1), np.var(benchmark_returns, ddof=1)
    pooled_std = np.sqrt(((n1-1)*var1 + (n2-1)*var2) / (n1+n2-2))
    if pooled_std == 0:
        return 0
    return (np.mean(strategy_returns) - np.mean(benchmark_returns)) / pooled_std

def interpret_cohens_d(d):
    d_abs = abs(d)
    if d_abs < 0.2:
        return "無視できる"
    elif d_abs < 0.5:
        return "小"
    elif d_abs < 0.8:
        return "中"
    else:
        return "大"

cohens_d_results = {}

print()
print("【全戦略のCohen's d（効果量）】")
for strategy in ALL_13_STRATEGIES:
    if strategy != 'SPY':
        n = min(len(full_results[strategy]['returns']), len(spy_returns))
        d = calc_cohens_d(
            np.array(full_results[strategy]['returns'][:n]),
            np.array(spy_returns[:n])
        )
        cohens_d_results[strategy] = {
            'value': float(d),
            'interpretation': interpret_cohens_d(d)
        }
        print(f"{strategy}: Cohen's d={d:.3f}, 効果量={interpret_cohens_d(d)}")


# =============================================================================
# テスト12: Bonferroni補正
# =============================================================================
print()
print("=" * 80)
print("テスト12: Bonferroni補正（多重比較）")
print("=" * 80)

n_tests = len([s for s in ALL_13_STRATEGIES if s != 'SPY'])  # SPY以外の戦略数
alpha = 0.05
bonferroni_alpha = alpha / n_tests

print(f"\n検定数: {n_tests}")
print(f"元の有意水準: {alpha}")
print(f"Bonferroni補正後有意水準: {bonferroni_alpha:.4f}")

bonferroni_results = {}

print()
print("【全戦略のBonferroni補正結果】")
for strategy, result in mc_results.items():
    sig = result['p_value'] < bonferroni_alpha
    bonferroni_results[strategy] = {
        'p_value': result['p_value'],
        'bonferroni_alpha': bonferroni_alpha,
        'significant': sig
    }
    sig_str = "✅ 有意" if sig else "❌ 非有意"
    print(f"{strategy}: p値={result['p_value']:.4f}, {sig_str}")


# =============================================================================
# テスト13: CSCV/PBO（過剰最適化リスク）
# =============================================================================
print()
print("=" * 80)
print("テスト13: CSCV/PBO（過剰最適化リスク評価）")
print("=" * 80)

def cscv_pbo(returns, benchmark_returns, n_blocks=16):
    """CSCV/PBOの簡易版実装"""
    from itertools import combinations
    
    n = min(len(returns), len(benchmark_returns))
    returns = np.array(returns[:n])
    benchmark_returns = np.array(benchmark_returns[:n])
    
    block_size = n // n_blocks
    if block_size < 2:
        return None
    
    excess_returns = returns - benchmark_returns
    
    blocks = []
    for i in range(n_blocks):
        start = i * block_size
        end = start + block_size if i < n_blocks - 1 else n
        blocks.append(excess_returns[start:end])
    
    train_indices = list(combinations(range(n_blocks), n_blocks // 2))
    
    results_list = []
    for train_idx in train_indices:
        test_idx = tuple(i for i in range(n_blocks) if i not in train_idx)
        
        train_returns = np.concatenate([blocks[i] for i in train_idx])
        test_returns = np.concatenate([blocks[i] for i in test_idx])
        
        train_sharpe = (np.mean(train_returns) * 12) / (np.std(train_returns, ddof=1) * np.sqrt(12)) if np.std(train_returns) > 0 else 0
        test_sharpe = (np.mean(test_returns) * 12) / (np.std(test_returns, ddof=1) * np.sqrt(12)) if np.std(test_returns) > 0 else 0
        
        results_list.append({
            'train_sharpe': train_sharpe,
            'test_sharpe': test_sharpe
        })
    
    results_sorted = sorted(results_list, key=lambda x: x['train_sharpe'], reverse=True)
    
    test_sharpes = [r['test_sharpe'] for r in results_list]
    median_test_sharpe = np.median(test_sharpes)
    
    n_top = max(1, len(results_list) // 10)
    pbo_count = sum(1 for i in range(n_top) if results_sorted[i]['test_sharpe'] <= median_test_sharpe)
    pbo = pbo_count / n_top
    
    train_sharpes = [r['train_sharpe'] for r in results_list]
    rank_correlation = stats.spearmanr(train_sharpes, test_sharpes)[0]
    
    return {
        'n_combinations': len(results_list),
        'pbo': float(pbo),
        'rank_correlation': float(rank_correlation),
        'median_test_sharpe': float(median_test_sharpe)
    }

def interpret_pbo(pbo):
    if pbo < 0.10:
        return "低"
    elif pbo < 0.30:
        return "中"
    else:
        return "高"

pbo_results = {}

print(f"\nブロック数: 16、訓練/テスト分割: 8/8")
print()
print("【全戦略のPBO（過剰最適化リスク）】")

for strategy in ALL_13_STRATEGIES:
    if strategy != 'SPY':
        result = cscv_pbo(full_results[strategy]['returns'], spy_returns)
        if result:
            pbo_results[strategy] = result
            risk = interpret_pbo(result['pbo'])
            print(f"{strategy}: PBO={result['pbo']:.1%}, リスク={risk}, ランク相関={result['rank_correlation']:.3f}")


# =============================================================================
# テスト14: Walk-Forward Analysis
# =============================================================================
print()
print("=" * 80)
print("テスト14: Walk-Forward Analysis（ウォークフォワード分析）")
print("=" * 80)

def walk_forward_analysis(returns, window_years=5, step_years=1):
    """ウォークフォワード分析"""
    returns = np.array(returns)
    window_months = window_years * 12
    step_months = step_years * 12
    
    if len(returns) < window_months + step_months:
        return None
    
    periods = []
    start = 0
    
    while start + window_months + step_months <= len(returns):
        train_returns = returns[start:start + window_months]
        test_returns = returns[start + window_months:start + window_months + step_months]
        
        train_sharpe = (np.mean(train_returns) * 12) / (np.std(train_returns, ddof=1) * np.sqrt(12)) if np.std(train_returns) > 0 else 0
        test_sharpe = (np.mean(test_returns) * 12) / (np.std(test_returns, ddof=1) * np.sqrt(12)) if np.std(test_returns) > 0 else 0
        
        # 劣化率の計算（train_sharpeが0の場合は0とする）
        if train_sharpe != 0:
            degradation = (test_sharpe - train_sharpe) / abs(train_sharpe)
        else:
            degradation = 0
        
        periods.append({
            'start': start // 12,
            'train_sharpe': float(train_sharpe),
            'test_sharpe': float(test_sharpe),
            'degradation': float(degradation)
        })
        
        start += step_months
    
    avg_degradation = np.mean([p['degradation'] for p in periods])
    consistency = sum(1 for p in periods if p['test_sharpe'] > 0) / len(periods)
    
    return {
        'n_periods': len(periods),
        'avg_degradation': float(avg_degradation),
        'consistency': float(consistency),
        'periods': periods
    }

wfa_results = {}

print(f"\n訓練期間: 5年、テスト期間: 1年、ステップ: 1年")
print()
print("【全戦略のWalk-Forward Analysis】")

for strategy in ALL_13_STRATEGIES:
    result = walk_forward_analysis(full_results[strategy]['returns'])
    if result:
        wfa_results[strategy] = {
            'n_periods': result['n_periods'],
            'avg_degradation': result['avg_degradation'],
            'consistency': result['consistency']
        }
        print(f"{strategy}: 期間数={result['n_periods']}, 平均劣化={result['avg_degradation']:.1%}, 一貫性={result['consistency']:.1%}")


# =============================================================================
# テスト15: Out-of-Sample検証（ホールドアウト）
# =============================================================================
print()
print("=" * 80)
print("テスト15: Out-of-Sample検証（最後20%ホールドアウト）")
print("=" * 80)

def holdout_validation(returns, train_ratio=0.8):
    """
    Out-of-Sample検証（ホールドアウト方式）
    最後20%を完全に未使用のテストデータとして検証
    
    Args:
        returns: 月次リターンの配列
        train_ratio: 訓練データの割合（デフォルト0.8）
    
    Returns:
        dict: 訓練期間とテスト期間のパフォーマンス比較
    """
    returns = np.array(returns)
    split = int(len(returns) * train_ratio)
    
    train_returns = returns[:split]
    test_returns = returns[split:]
    
    train_metrics = calc_metrics(train_returns)
    test_metrics = calc_metrics(test_returns)
    
    # パフォーマンス劣化率の計算
    sharpe_degradation = (test_metrics['sharpe'] - train_metrics['sharpe']) / abs(train_metrics['sharpe']) if train_metrics['sharpe'] != 0 else 0
    cagr_degradation = (test_metrics['cagr'] - train_metrics['cagr']) / abs(train_metrics['cagr']) if train_metrics['cagr'] != 0 else 0
    
    # テスト期間の有意性検定（t検定）
    t_stat, p_value = stats.ttest_1samp(test_returns, 0)
    
    return {
        'train_months': len(train_returns),
        'test_months': len(test_returns),
        'train_sharpe': float(train_metrics['sharpe']),
        'test_sharpe': float(test_metrics['sharpe']),
        'sharpe_degradation': float(sharpe_degradation),
        'train_cagr': float(train_metrics['cagr']),
        'test_cagr': float(test_metrics['cagr']),
        'cagr_degradation': float(cagr_degradation),
        'test_p_value': float(p_value),
        'test_significant': bool(p_value < 0.05),
        'is_robust': bool(sharpe_degradation > -0.5 and test_metrics['sharpe'] > 0)  # 劣化が50%未満かつテスト期間もプラス
    }

oos_results = {}
print()
print(f"訓練期間: 最初80% / テスト期間: 最後20%")
print()
print("【全戦略のOut-of-Sample検証】")

for strategy in ALL_13_STRATEGIES:
    result = holdout_validation(full_results[strategy]['returns'])
    oos_results[strategy] = result
    robust_str = "✅ Yes" if result['is_robust'] else "❌ No"
    print(f"{strategy}: Train Sharpe={result['train_sharpe']:.2f}, Test Sharpe={result['test_sharpe']:.2f}, 劣化率={result['sharpe_degradation']:.1%}, p値={result['test_p_value']:.4f}, {robust_str}")


# =============================================================================
# テスト16: Regime Change検定（KS検定）
# =============================================================================
print()
print("=" * 80)
print("テスト16: Regime Change検定（市場構造変化の検出）")
print("=" * 80)

def regime_change_test(returns, split_ratio=0.5):
    """
    Regime Change検定（Kolmogorov-Smirnov検定）
    前半と後半でリターン分布が変化したかを検定
    
    Args:
        returns: 月次リターンの配列
        split_ratio: 分割位置（デフォルト0.5）
    
    Returns:
        dict: KS検定結果と分布の変化量
    """
    returns = np.array(returns)
    split = int(len(returns) * split_ratio)
    
    first_half = returns[:split]
    second_half = returns[split:]
    
    # KS検定
    ks_stat, ks_p_value = stats.ks_2samp(first_half, second_half)
    
    # 分布の特性変化
    first_mean = np.mean(first_half)
    second_mean = np.mean(second_half)
    first_std = np.std(first_half, ddof=1)
    second_std = np.std(second_half, ddof=1)
    
    mean_change = (second_mean - first_mean) / first_std if first_std > 0 else 0  # 標準化された平均変化
    vol_change = (second_std - first_std) / first_std if first_std > 0 else 0  # ボラティリティ変化率
    
    return {
        'ks_statistic': float(ks_stat),
        'ks_p_value': float(ks_p_value),
        'regime_changed': bool(ks_p_value < 0.05),
        'first_half_mean': float(first_mean),
        'second_half_mean': float(second_mean),
        'mean_change_std': float(mean_change),
        'first_half_vol': float(first_std),
        'second_half_vol': float(second_std),
        'vol_change_pct': float(vol_change),
    }

regime_change_results = {}
print()
print(f"前半期間 vs 後半期間のリターン分布を比較")
print()
print("【全戦略のRegime Change検定】")

for strategy in ALL_13_STRATEGIES:
    result = regime_change_test(full_results[strategy]['returns'])
    regime_change_results[strategy] = result
    change_str = "⚠️ あり" if result['regime_changed'] else "✅ なし"
    print(f"{strategy}: KS統計量={result['ks_statistic']:.4f}, p値={result['ks_p_value']:.4f}, 平均変化={result['mean_change_std']:.2f}σ, Vol変化={result['vol_change_pct']:.1%}, {change_str}")


# =============================================================================
# テスト17: FDR補正（Benjamini-Hochberg法）
# =============================================================================
print()
print("=" * 80)
print("テスト17: FDR補正（Benjamini-Hochberg法）")
print("=" * 80)

def benjamini_hochberg_correction(p_values, alpha=0.05):
    """
    Benjamini-Hochberg法によるFalse Discovery Rate (FDR) 補正
    Bonferroniよりも検出力が高い多重検定補正
    
    Args:
        p_values: dict of {strategy: p_value}
        alpha: 有意水準（デフォルト0.05）
    
    Returns:
        dict: 各戦略のFDR補正結果
    """
    strategies = list(p_values.keys())
    pvals = np.array([p_values[s] for s in strategies])
    n = len(pvals)
    
    # p値をソートしてランクを付ける
    sorted_indices = np.argsort(pvals)
    sorted_pvals = pvals[sorted_indices]
    
    # BH閾値を計算: (rank / n) * alpha
    bh_thresholds = (np.arange(1, n + 1) / n) * alpha
    
    # 調整済みp値を計算
    adjusted_pvals = np.zeros(n)
    for i in range(n - 1, -1, -1):
        if i == n - 1:
            adjusted_pvals[i] = sorted_pvals[i]
        else:
            adjusted_pvals[i] = min(adjusted_pvals[i + 1], sorted_pvals[i] * n / (i + 1))
    
    # 元の順序に戻す
    original_order_adjusted = np.zeros(n)
    for i, idx in enumerate(sorted_indices):
        original_order_adjusted[idx] = adjusted_pvals[i]
    
    # 結果を辞書形式で返す
    results = {}
    for i, strategy in enumerate(strategies):
        results[strategy] = {
            'original_p': float(pvals[i]),
            'adjusted_p': float(min(original_order_adjusted[i], 1.0)),
            'fdr_significant': bool(original_order_adjusted[i] < alpha),
            'bonferroni_significant': bool(pvals[i] < alpha / n),
        }
    
    return results

# モンテカルロ検定のp値を収集
mc_p_values = {strategy: data['p_value'] for strategy, data in mc_results.items()}

fdr_results = benjamini_hochberg_correction(mc_p_values)

print()
print(f"Bonferroni vs FDR（Benjamini-Hochberg）の比較")
print(f"※ FDRはBonferroniよりも検出力が高く、真の有意差を見逃しにくい")
print()
print("【全戦略のFDR補正結果】")

for strategy in ALL_13_STRATEGIES:
    if strategy in fdr_results:
        result = fdr_results[strategy]
        fdr_str = "✅ Yes" if result['fdr_significant'] else "❌ No"
        bonf_str = "✅ Yes" if result['bonferroni_significant'] else "❌ No"
        print(f"{strategy}: 元p値={result['original_p']:.4f}, 調整済みp値={result['adjusted_p']:.4f}, FDR有意={fdr_str}, Bonf有意={bonf_str}")


# =============================================================================
# 結果保存
# =============================================================================
print()
print("=" * 80)
print("結果サマリー")
print("=" * 80)

output = {
    'test1_cost_sensitivity': {
        cost: {
            strategy: {k: float(v) for k, v in metrics.items()}
            for strategy, metrics in data.items()
        }
        for cost, data in cost_results.items()
    },
    'test2_regime_breakdown': {
        regime: {
            strategy: {k: float(v) for k, v in metrics.items()} if metrics else {}
            for strategy, metrics in data.items()
        }
        for regime, data in regime_results.items()
    },
    'test3_tail_risk': {
        strategy: {k: float(v) for k, v in metrics.items()}
        for strategy, metrics in tail_results.items()
    },
    'test4_param_sensitivity': {
        key: {
            strategy: {k: float(v) for k, v in metrics.items()}
            for strategy, metrics in data.items()
        }
        for key, data in param_results.items()
    },
    'test5_bootstrap': {
        strategy: {k: float(v) for k, v in metrics.items()}
        for strategy, metrics in bootstrap_results.items()
    },
    'test6_dsr_psr': {
        strategy: {
            'psr': float(calc_psr(full_results[strategy]['returns'])['psr']),
            'dsr': float(calc_dsr(full_results[strategy]['returns'], n_trials=12)['dsr']),
        }
        for strategy in ALL_13_STRATEGIES
    },
    'test7_survivorship_adjusted': {
        strategy: {k: float(v) for k, v in metrics.items()}
        for strategy, metrics in adjusted_results.items()
    },
    'test8_leverage': {
        strategy: {
            'mean_scale': float(np.mean(factors)),
            'max_scale': float(np.max(factors)),
            'lev_gt_1_ratio': float(np.sum(np.array(factors) > 1.0) / len(factors)),
        }
        for strategy, factors in scale_factors.items()
    },
    'test9_rebalance_sensitivity': {
        label: {
            strategy: {k: float(v) for k, v in metrics.items()}
            for strategy, metrics in data.items()
        }
        for label, data in rebalance_results.items()
    },
    'test10_monte_carlo': {
        strategy: {
            'observed_mean': float(data['observed_mean']),
            'p_value': float(data['p_value']),
            'significant_005': bool(data['significant_005']),
            'significant_001': bool(data['significant_001'])
        }
        for strategy, data in mc_results.items()
    },
    'test11_cohens_d': cohens_d_results,
    'test12_bonferroni': {
        strategy: {
            'p_value': float(data['p_value']),
            'bonferroni_alpha': float(data['bonferroni_alpha']),
            'significant': bool(data['significant'])
        }
        for strategy, data in bonferroni_results.items()
    },
    'test13_pbo': pbo_results,
    'test14_wfa': wfa_results,
    'test15_oos': oos_results,
    'test16_regime_change': regime_change_results,
    'test17_fdr': fdr_results,
}

# =============================================================================
# 総合評価生成（13戦略全て）
# =============================================================================
print()
print("=" * 80)
print("総合評価生成（13戦略 × 5項目）")
print("=" * 80)

# grail.jsonから全戦略のリターンを取得
grail_path = '/home/ubuntu/portfolio-advisor/analysis/grail.json'
with open(grail_path, 'r', encoding='utf-8') as f:
    grail_data = json.load(f)

all_strategies = list(grail_data['summary'].keys())
print(f"対象戦略: {all_strategies}")
print()

# 累積リターンから月次リターンを計算する関数
def calc_monthly_returns_from_cumulative(cumulative):
    """100スタートの累積リターンから月次リターンを計算"""
    monthly = []
    for i in range(len(cumulative)):
        if i == 0:
            # 最初の月は100からの変化
            monthly.append((cumulative[i] / 100) - 1)
        else:
            if cumulative[i-1] != 0:
                monthly.append(cumulative[i] / cumulative[i-1] - 1)
            else:
                monthly.append(0)
    return monthly

# SPYリターンを取得（累積リターンから計算）
spy_cumulative = grail_data['monthly_data']['cumulative_returns']['SPY']
spy_monthly_returns = calc_monthly_returns_from_cumulative(spy_cumulative)

comprehensive_evaluation = {}

for strategy in all_strategies:
    if strategy == 'SPY':
        # SPYはベンチマークなのでスキップ
        comprehensive_evaluation[strategy] = {
            'monte_carlo': {'p_value': 1.0, 'significant': False},
            'cohens_d': {'value': 0.0, 'interpretation': 'ベンチマーク'},
            'bonferroni': {'p_value': 1.0, 'significant': False},
            'pbo': {'pbo': 0.0, 'risk': 'N/A'},
            'wfa': {'consistency': 0.0, 'avg_degradation': 0.0},
            'score': 0,
            'max_score': 5
        }
        continue
    
    # 累積リターンから月次リターンを計算
    strategy_cumulative = grail_data['monthly_data']['cumulative_returns'].get(strategy, [])
    if strategy_cumulative:
        strategy_returns = calc_monthly_returns_from_cumulative(strategy_cumulative)
    else:
        strategy_returns = []
    
    if not strategy_returns or len(strategy_returns) < 60:
        # データ不足の場合
        comprehensive_evaluation[strategy] = {
            'monte_carlo': {'p_value': 1.0, 'significant': False},
            'cohens_d': {'value': 0.0, 'interpretation': 'データ不足'},
            'bonferroni': {'p_value': 1.0, 'significant': False},
            'pbo': {'pbo': 0.0, 'risk': 'N/A'},
            'wfa': {'consistency': 0.0, 'avg_degradation': 0.0},
            'score': 0,
            'max_score': 5
        }
        continue
    
    # データ長を揃える
    n = min(len(strategy_returns), len(spy_monthly_returns))
    strat_ret = np.array(strategy_returns[:n])
    spy_ret = np.array(spy_monthly_returns[:n])
    
    # 1. モンテカルロ順列検定
    mc_result = monte_carlo_permutation_test(strat_ret, spy_ret)
    
    # 2. Cohen's d
    d_value = calc_cohens_d(strat_ret, spy_ret)
    d_interp = interpret_cohens_d(d_value)
    
    # 3. Bonferroni補正（13戦略なのでalpha=0.05/13）
    bonferroni_alpha_all = 0.05 / 13
    bonf_sig = mc_result['p_value'] < bonferroni_alpha_all
    
    # 4. PBO
    pbo_result = cscv_pbo(strat_ret, spy_ret)
    if pbo_result:
        pbo_val = pbo_result['pbo']
        pbo_risk = interpret_pbo(pbo_val)
    else:
        pbo_val = 0.5
        pbo_risk = '中'
    
    # 5. WFA
    wfa_result = walk_forward_analysis(strat_ret)
    if wfa_result:
        wfa_consistency = wfa_result['consistency']
        wfa_degradation = wfa_result['avg_degradation']
    else:
        wfa_consistency = 0.0
        wfa_degradation = 0.0
    
    # スコア計算
    score = 0
    if mc_result['significant_005']:
        score += 1
    if abs(d_value) >= 0.2:
        score += 1
    if bonf_sig:
        score += 1
    if pbo_val < 0.30:
        score += 1
    if wfa_consistency >= 0.60:
        score += 1
    
    comprehensive_evaluation[strategy] = {
        'monte_carlo': {
            'p_value': float(mc_result['p_value']),
            'significant': bool(mc_result['significant_005'])
        },
        'cohens_d': {
            'value': float(d_value),
            'interpretation': d_interp
        },
        'bonferroni': {
            'p_value': float(mc_result['p_value']),
            'bonferroni_alpha': float(bonferroni_alpha_all),
            'significant': bool(bonf_sig)
        },
        'pbo': {
            'pbo': float(pbo_val),
            'risk': pbo_risk
        },
        'wfa': {
            'consistency': float(wfa_consistency),
            'avg_degradation': float(wfa_degradation)
        },
        'score': score,
        'max_score': 5
    }
    
    print(f"{strategy}: {score}/5 (MC:{mc_result['significant_005']}, d:{d_interp}, Bonf:{bonf_sig}, PBO:{pbo_risk}, WFA:{wfa_consistency:.0%})")

# outputにcomprehensive_evaluationを追加
output['comprehensive_evaluation'] = comprehensive_evaluation

output_path = '/home/ubuntu/portfolio-advisor/analysis/robust.json'
with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(output, f, indent=2, ensure_ascii=False)

print()
print(f"結果を {output_path} に保存しました")

# 総合評価
print()
print("【総合評価】")
print()

evaluations = [
    ("テスト1: 取引コスト感度", "1.0%コストでもSPYを上回る" if cost_results[0.01]['D3+防御型_VolScale']['sharpe'] > cost_results[0.01]['SPY']['sharpe'] else "1.0%コストで優位性消失", "✅" if cost_results[0.01]['D3+防御型_VolScale']['sharpe'] > cost_results[0.01]['SPY']['sharpe'] else "⚠️"),
    ("テスト2: レジーム頑健性", "全期間でプラスCAGR" if all(regime_results[r].get('D3+防御型_VolScale', {}).get('cagr', -1) > 0 for r in regimes.keys() if regime_results[r].get('D3+防御型_VolScale')) else "一部期間でマイナス", "✅" if all(regime_results[r].get('D3+防御型_VolScale', {}).get('cagr', -1) > 0 for r in regimes.keys() if regime_results[r].get('D3+防御型_VolScale')) else "⚠️"),
    ("テスト3: テールリスク", f"CVaR(5%)={tail_results['D3+防御型_VolScale']['cvar_5']*100:.1f}%", "✅" if tail_results['D3+防御型_VolScale']['cvar_5'] > -0.10 else "⚠️"),
    ("テスト4: パラメータ感度", f"{stable_count}/{total_count}が70%以上維持", "✅" if stable_count >= total_count * 0.7 else "⚠️"),
    ("テスト5: ブートストラップ", f"P(Sharpe>1)={bootstrap_results['D3+防御型_VolScale']['prob_sharpe_gt_1']*100:.0f}%", "✅" if bootstrap_results['D3+防御型_VolScale']['prob_sharpe_gt_1'] > 0.8 else "⚠️"),
    ("テスト6: DSR/PSR", f"DSR={calc_dsr(full_results['D3+防御型_VolScale']['returns'], n_trials=12)['dsr']*100:.0f}%", "✅" if calc_dsr(full_results['D3+防御型_VolScale']['returns'], n_trials=12)['dsr'] > 0.5 else "⚠️"),
    ("テスト7: サバイバーシップ補正", f"補正後Sharpe={adjusted_results['D3+防御型_VolScale']['sharpe']:.2f}", "✅" if adjusted_results['D3+防御型_VolScale']['sharpe'] > 1.0 else "⚠️"),
    ("テスト8: レバレッジ", f"レバ>1比率={np.sum(np.array(scale_factors['D3+防御型_VolScale']) > 1.0) / len(scale_factors['D3+防御型_VolScale'])*100:.0f}%", "✅" if np.sum(np.array(scale_factors['D3+防御型_VolScale']) > 1.0) / len(scale_factors['D3+防御型_VolScale']) < 0.5 else "⚠️"),
    ("テスト9: リバランス日感度", f"最大差={max_diff:.2f}", "✅" if max_diff < 0.1 else "⚠️"),
]

for test_name, result, verdict in evaluations:
    print(f"{verdict} {test_name}: {result}")

print()
print("=" * 80)
