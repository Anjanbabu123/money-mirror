import { useEffect, useState } from 'react';
import { transactionApi } from '../utils/api';
import { formatINR } from '../utils/format';
import type { Transaction, MonthlySummary } from '../types';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell
} from 'recharts';
import { Smartphone, ShoppingCart, Zap, AlertTriangle, Target, Star } from 'lucide-react';

const YEAR = new Date().getFullYear();

function ScoreRing({ score }: { score: number }) {
  const grade = score >= 90 ? 'Excellent' : score >= 75 ? 'Good' : score >= 60 ? 'Average' : 'Needs Attention';
  const color = score >= 90 ? '#10b981' : score >= 75 ? '#6366f1' : score >= 60 ? '#f59e0b' : '#ef4444';
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          <circle cx="60" cy="60" r="50" fill="none" stroke="#f1f5f9" strokeWidth="10" />
          <circle cx="60" cy="60" r="50" fill="none" stroke={color} strokeWidth="10"
            strokeDasharray={`${(score / 100) * 314} 314`} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-gray-900">{score}</span>
          <span className="text-xs text-gray-500">/ 100</span>
        </div>
      </div>
      <span className="mt-2 text-sm font-semibold" style={{ color }}>{grade}</span>
    </div>
  );
}

export default function AnalyticsPage() {
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [summaries, setSummaries] = useState<MonthlySummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      transactionApi.list({ limit: 1500 }),
      Promise.all([1,2,3,4,5,6,7,8,9,10,11,12].map(m => transactionApi.getSummary(YEAR, m).then(r => r.data))),
    ]).then(([txnR, sumR]) => {
      setTxns(txnR.data);
      setSummaries(sumR);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400 p-6">Loading analytics…</div>;
  if (!txns.length) return (
    <div className="p-6 text-center text-gray-500 mt-20">
      No data yet — go to Dashboard and click "Load Sample Data" first.
    </div>
  );

  // ── UPI metrics ──────────────────────────────────────────────────────────────
  const upiTxns      = txns.filter(t => t.source === 'UPI' && t.type === 'debit');
  const smallTicket  = upiTxns.filter(t => t.amount < 200);
  const avgTicket    = upiTxns.length ? upiTxns.reduce((s, t) => s + t.amount, 0) / upiTxns.length : 0;
  const smallPct     = upiTxns.length ? (smallTicket.length / upiTxns.length * 100) : 0;

  // ── 50-30-20 budget ──────────────────────────────────────────────────────────
  const avgIncome   = summaries.reduce((s, m) => s + m.income, 0) / summaries.length;
  const needsCats   = ['Rent','EMI','Groceries','Utilities','Insurance','Healthcare','Fuel','Education'];
  const wantsCats   = ['Food & Dining','Shopping','Entertainment','Travel','Miscellaneous'];
  const totalNeeds  = txns.filter(t => t.type === 'debit' && needsCats.includes(t.category || '')).reduce((s,t) => s+t.amount,0) / 6;
  const totalWants  = txns.filter(t => t.type === 'debit' && wantsCats.includes(t.category || '')).reduce((s,t) => s+t.amount,0) / 6;
  const totalInvest = txns.filter(t => t.category === 'Investments').reduce((s,t) => s+t.amount,0) / 6;
  const budget50    = avgIncome * 0.5;
  const budget30    = avgIncome * 0.3;
  const budget20    = avgIncome * 0.2;

  // ── health score ─────────────────────────────────────────────────────────────
  const avgSavingsRatio = summaries.reduce((s,m) => s + Math.max(0, m.savings_ratio), 0) / summaries.length;
  const avgEmiRatio     = summaries.map(m => avgIncome > 0 ? m.emi / avgIncome * 100 : 0).reduce((a,b)=>a+b,0) / summaries.length;
  const avgInvestRatio  = avgIncome > 0 ? (totalInvest / avgIncome * 100) : 0;
  const savingsScore    = Math.min(25, (avgSavingsRatio / 20) * 25);
  const debtScore       = Math.max(0, 20 - (avgEmiRatio / 30) * 20);
  const investScore     = Math.min(20, (avgInvestRatio / 15) * 20);
  const emergencyScore  = avgSavingsRatio > 10 ? 20 : (avgSavingsRatio / 10) * 20;
  const impulseScore    = Math.max(0, 15 - (smallPct / 50) * 15);
  const healthScore     = Math.round(savingsScore + debtScore + investScore + emergencyScore + impulseScore);

  // ── money leakage ────────────────────────────────────────────────────────────
  const foodDelivery   = txns.filter(t => ['Swiggy','Zomato','Blinkit','Dunzo'].includes(t.merchant || '') && t.type==='debit').reduce((s,t)=>s+t.amount,0);
  const subscriptions  = txns.filter(t => ['Netflix','Spotify','Amazon Prime','YouTube Premium','Hotstar'].includes(t.merchant || '') && t.type==='debit').reduce((s,t)=>s+t.amount,0);
  const onlineShopping = txns.filter(t => ['Amazon','Flipkart','Myntra','Ajio'].includes(t.merchant || '') && t.type==='debit').reduce((s,t)=>s+t.amount,0);

  // ── weekday vs weekend ───────────────────────────────────────────────────────
  const weekdaySpend = txns.filter(t => { const d=new Date(t.date); return t.type==='debit' && d.getDay()>=1 && d.getDay()<=5; }).reduce((s,t)=>s+t.amount,0);
  const weekendSpend = txns.filter(t => { const d=new Date(t.date); return t.type==='debit' && (d.getDay()===0||d.getDay()===6); }).reduce((s,t)=>s+t.amount,0);

  const budgetData = [
    { name: 'Needs (50%)', actual: totalNeeds,  budget: budget50, fill: '#6366f1' },
    { name: 'Wants (30%)', actual: totalWants,  budget: budget30, fill: '#f59e0b' },
    { name: 'Savings (20%)', actual: totalInvest, budget: budget20, fill: '#10b981' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Advanced Analytics</h1>

      {/* Health Score + UPI */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Health score */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col items-center">
          <div className="flex items-center gap-2 mb-4 self-start">
            <Star className="w-5 h-5 text-yellow-500" />
            <h3 className="font-semibold text-gray-800">Financial Health Score</h3>
          </div>
          <ScoreRing score={healthScore} />
          <div className="w-full mt-4 space-y-2 text-xs">
            {[
              { label: 'Savings Ratio (25)', score: Math.round(savingsScore) },
              { label: 'Debt Ratio (20)',    score: Math.round(debtScore) },
              { label: 'Investments (20)',   score: Math.round(investScore) },
              { label: 'Emergency Fund (20)',score: Math.round(emergencyScore) },
              { label: 'Impulse Control (15)',score: Math.round(impulseScore) },
            ].map(({ label, score }) => (
              <div key={label} className="flex justify-between text-gray-600">
                <span>{label}</span><span className="font-semibold">{score}</span>
              </div>
            ))}
          </div>
        </div>

        {/* UPI metrics */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-4">
            <Smartphone className="w-5 h-5 text-indigo-500" />
            <h3 className="font-semibold text-gray-800">UPI Behaviour</h3>
          </div>
          <div className="space-y-4">
            <div className="bg-indigo-50 rounded-xl p-4">
              <p className="text-2xl font-bold text-indigo-700">{upiTxns.length}</p>
              <p className="text-xs text-indigo-600 mt-0.5">Total UPI transactions</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-4">
              <p className="text-2xl font-bold text-amber-700">{formatINR(avgTicket)}</p>
              <p className="text-xs text-amber-600 mt-0.5">Average ticket size</p>
            </div>
            <div className={`rounded-xl p-4 ${smallPct > 40 ? 'bg-red-50' : 'bg-green-50'}`}>
              <p className={`text-2xl font-bold ${smallPct > 40 ? 'text-red-700' : 'text-green-700'}`}>
                {smallPct.toFixed(1)}%
              </p>
              <p className={`text-xs mt-0.5 ${smallPct > 40 ? 'text-red-600' : 'text-green-600'}`}>
                Transactions below ₹200
              </p>
            </div>
            {smallPct > 30 && (
              <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                {smallPct.toFixed(0)}% of your UPI payments are below ₹200 — this indicates frequent impulse spending.
              </div>
            )}
          </div>
        </div>

        {/* Weekday vs weekend */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-purple-500" />
            <h3 className="font-semibold text-gray-800">Spend Patterns</h3>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Weekday spend</span>
                <span className="font-semibold">{formatINR(weekdaySpend)}</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full">
                <div className="h-3 bg-indigo-500 rounded-full" style={{ width: `${Math.min(100, weekdaySpend/(weekdaySpend+weekendSpend)*100)}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Weekend spend</span>
                <span className="font-semibold">{formatINR(weekendSpend)}</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full">
                <div className="h-3 bg-purple-500 rounded-full" style={{ width: `${Math.min(100, weekendSpend/(weekdaySpend+weekendSpend)*100)}%` }} />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Weekend spend is {((weekendSpend/weekdaySpend)*100).toFixed(0)}% of weekday spend
            </p>
          </div>
        </div>
      </div>

      {/* 50-30-20 Budget */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <div className="flex items-center gap-2 mb-1">
          <Target className="w-5 h-5 text-emerald-500" />
          <h3 className="font-semibold text-gray-800">50-30-20 Budget Rule</h3>
        </div>
        <p className="text-xs text-gray-500 mb-4">Based on avg monthly income of {formatINR(avgIncome)}</p>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          {budgetData.map(({ name, actual, budget, fill }) => {
            const over = actual > budget;
            return (
              <div key={name} className={`rounded-xl p-4 border ${over ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-medium text-gray-700">{name}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${over ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {over ? 'Over' : 'Under'}
                  </span>
                </div>
                <p className="text-xl font-bold text-gray-900">{formatINR(actual)}</p>
                <p className="text-xs text-gray-500">Budget: {formatINR(budget)}</p>
                <div className="mt-2 h-2 bg-white/60 rounded-full">
                  <div className="h-2 rounded-full" style={{ width: `${Math.min(100, actual/budget*100)}%`, background: fill }} />
                </div>
              </div>
            );
          })}
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={budgetData} margin={{ right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v: any) => formatINR(Number(v))} />
            <Bar dataKey="actual" name="Actual" radius={[4,4,0,0]}>
              {budgetData.map(d => <Cell key={d.name} fill={d.actual > d.budget ? '#ef4444' : d.fill} />)}
            </Bar>
            <Bar dataKey="budget" name="Budget" fill="#e2e8f0" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Money leakage */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <div className="flex items-center gap-2 mb-4">
          <ShoppingCart className="w-5 h-5 text-red-500" />
          <h3 className="font-semibold text-gray-800">Money Leakage Detection</h3>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[
            { label: 'Food Delivery Apps', amount: foodDelivery, hint: 'Swiggy, Zomato, Blinkit, Dunzo', saving: foodDelivery * 0.3 },
            { label: 'Subscriptions', amount: subscriptions, hint: 'Netflix, Spotify, OTT platforms', saving: subscriptions * 0.5 },
            { label: 'Online Shopping', amount: onlineShopping, hint: 'Amazon, Flipkart, Myntra', saving: onlineShopping * 0.2 },
          ].map(({ label, amount, hint, saving }) => (
            <div key={label} className="border border-slate-100 rounded-xl p-4 bg-slate-50">
              <p className="text-sm font-medium text-gray-700">{label}</p>
              <p className="text-xs text-gray-400 mb-2">{hint}</p>
              <p className="text-xl font-bold text-gray-900">{formatINR(amount)}<span className="text-xs text-gray-400 font-normal ml-1">6 months</span></p>
              <p className="text-xs text-red-600 mt-1">Potential annual saving: <strong>{formatINR(saving * 2)}</strong></p>
            </div>
          ))}
        </div>
        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          <strong>Total annual saving potential: {formatINR((foodDelivery * 0.3 + subscriptions * 0.5 + onlineShopping * 0.2) * 2)}</strong>
          {' '}by reducing discretionary spending by 20–50%.
        </div>
      </div>
    </div>
  );
}
