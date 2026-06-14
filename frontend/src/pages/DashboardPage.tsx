import { useEffect, useState } from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend
} from 'recharts';
import { transactionApi } from '../utils/api';
import { formatINR, CATEGORY_COLORS, MONTHS } from '../utils/format';
import type { MonthlySummary } from '../types';
import {
  TrendingUp, TrendingDown, Wallet, PiggyBank, RefreshCw, AlertCircle
} from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1].filter(y => y >= 2024);

function StatCard({ label, value, sub, color, icon: Icon }: {
  label: string; value: string; sub?: string; color: string; icon: any
}) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [monthlySeries, setMonthlySeries] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(CURRENT_YEAR);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState('');

  const loadData = async (month: number, year: number) => {
    setLoading(true);
    setError('');
    try {
      const [sumR, seriesResults] = await Promise.all([
        transactionApi.getSummary(year, month),
        Promise.all(
          [1,2,3,4,5,6,7,8,9,10,11,12].map(m =>
            transactionApi.getSummary(year, m).then(r => ({
              month: MONTHS[m - 1],
              Income: r.data.income,
              Expenses: r.data.expenses + r.data.emi,
              Savings: Math.max(0, r.data.savings),
            }))
          )
        ),
      ]);
      setSummary(sumR.data);
      setMonthlySeries(seriesResults);
    } catch {
      setError('No data yet. Click "Load Sample Data" to get started.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(selectedMonth, selectedYear); }, [selectedMonth, selectedYear]);

  const seedDemo = async () => {
    setSeeding(true);
    try {
      await transactionApi.seedDemo();
      setSelectedYear(2025);
      setSelectedMonth(3);
      await loadData(3, 2025);
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Failed to load sample data');
    } finally {
      setSeeding(false);
    }
  };

  const pieData = summary
    ? Object.entries(summary.by_category)
        .filter(([, v]) => v > 0)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 8)
        .map(([name, value]) => ({ name, value: Math.round(value) }))
    : [];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Your money story, clearly told</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Year selector */}
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(Number(e.target.value))}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          {/* Month selector */}
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(Number(e.target.value))}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {MONTHS.map((m, i) => (
              <option key={i+1} value={i+1}>{m}</option>
            ))}
          </select>
          <button
            onClick={seedDemo} disabled={seeding}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${seeding ? 'animate-spin' : ''}`} />
            {seeding ? 'Loading…' : 'Load Sample Data'}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 mb-6 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64 text-gray-400">
          <RefreshCw className="w-6 h-6 animate-spin mr-2" /> Loading data…
        </div>
      ) : summary && (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              label="Monthly Income" icon={TrendingUp}
              value={formatINR(summary.income)}
              sub="Credits this month"
              color="bg-green-100 text-green-600"
            />
            <StatCard
              label="Total Expenses" icon={TrendingDown}
              value={formatINR(summary.expenses)}
              sub={`EMI: ${formatINR(summary.emi)}`}
              color="bg-red-100 text-red-600"
            />
            <StatCard
              label="Investments" icon={PiggyBank}
              value={formatINR(summary.investments)}
              sub="SIPs & MFs this month"
              color="bg-emerald-100 text-emerald-600"
            />
            <StatCard
              label="Net Savings" icon={Wallet}
              value={formatINR(summary.savings)}
              sub={`Savings ratio: ${summary.savings_ratio}%`}
              color={summary.savings >= 0 ? 'bg-indigo-100 text-indigo-600' : 'bg-orange-100 text-orange-600'}
            />
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Pie chart */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h3 className="font-semibold text-gray-800 mb-4">Spending by Category</h3>
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={200}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={80} paddingAngle={2}>
                      {pieData.map((entry) => (
                        <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] || '#94a3b8'} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: any) => formatINR(Number(v))} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {pieData.map(entry => (
                    <div key={entry.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ background: CATEGORY_COLORS[entry.name] || '#94a3b8' }} />
                        <span className="text-gray-600 truncate max-w-[100px]">{entry.name}</span>
                      </div>
                      <span className="font-medium text-gray-800">{formatINR(entry.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Category bar chart */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h3 className="font-semibold text-gray-800 mb-4">Top Spending Categories</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={pieData} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <XAxis type="number" tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={90} />
                  <Tooltip formatter={(v: any) => formatINR(Number(v))} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] || '#94a3b8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Monthly trend */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-6">
            <h3 className="font-semibold text-gray-800 mb-4">6-Month Income vs Expenses Trend</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={monthlySeries} margin={{ right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: any) => formatINR(Number(v))} />
                <Legend />
                <Line type="monotone" dataKey="Income"   stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="Expenses" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="Savings"  stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 2" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Category table */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="font-semibold text-gray-800 mb-4">Category Breakdown — {MONTHS[selectedMonth-1]} {selectedYear}</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-2 text-gray-500 font-medium">Category</th>
                    <th className="text-right py-2 text-gray-500 font-medium">Amount</th>
                    <th className="text-right py-2 text-gray-500 font-medium">% of Expenses</th>
                    <th className="py-2 pl-4 text-gray-500 font-medium">Bar</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(summary.by_category)
                    .sort(([, a], [, b]) => b - a)
                    .filter(([cat]) => !['Transfers','Investments','Salary','Business Income'].includes(cat))
                    .map(([cat, amt]) => {
                      const pct = summary.expenses > 0 ? (amt / summary.expenses * 100) : 0;
                      return (
                        <tr key={cat} className="border-b border-slate-50 hover:bg-slate-50/50">
                          <td className="py-2.5 flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full"
                              style={{ background: CATEGORY_COLORS[cat] || '#94a3b8' }} />
                            {cat}
                          </td>
                          <td className="py-2.5 text-right font-medium">{formatINR(amt)}</td>
                          <td className="py-2.5 text-right text-gray-500">{pct.toFixed(1)}%</td>
                          <td className="py-2.5 pl-4 w-32">
                            <div className="h-2 bg-slate-100 rounded-full">
                              <div className="h-2 rounded-full" style={{
                                width: `${Math.min(pct, 100)}%`,
                                background: CATEGORY_COLORS[cat] || '#94a3b8'
                              }} />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
