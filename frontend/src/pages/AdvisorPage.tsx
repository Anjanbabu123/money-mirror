import { useState, useEffect } from 'react';
import { transactionApi } from '../utils/api';
import { formatINR } from '../utils/format';
import type { MonthlySummary } from '../types';
import { Brain, Lightbulb, TrendingDown, AlertTriangle, CheckCircle, Loader } from 'lucide-react';
import api from '../utils/api';

const YEAR = 2025;

export default function AdvisorPage() {
  const [summaries, setSummaries] = useState<MonthlySummary[]>([]);
  const [advice, setAdvice] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    Promise.all([1,2,3,4,5,6].map(m => transactionApi.getSummary(YEAR, m).then(r => r.data)))
      .then(setSummaries)
      .finally(() => setLoading(false));
  }, []);

  const generateAdvice = async () => {
    setGenerating(true);
    try {
      const r = await api.get('/advisor/summary');
      setAdvice(r.data.advice);
    } catch {
      setAdvice('');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <div className="p-6 text-gray-400">Loading…</div>;
  if (!summaries.length || !summaries[0]?.income) return (
    <div className="p-6 text-center text-gray-500 mt-20">
      No data yet — go to Dashboard and click "Load Sample Data" first.
    </div>
  );

  const avgIncome   = summaries.reduce((s,m) => s + m.income, 0) / summaries.length;
  const avgExpenses = summaries.reduce((s,m) => s + m.expenses + m.emi, 0) / summaries.length;
  const avgSavings  = summaries.reduce((s,m) => s + m.savings, 0) / summaries.length;
  const avgInvest   = summaries.reduce((s,m) => s + m.investments, 0) / summaries.length;
  const totalCategories = summaries.reduce((acc, m) => {
    Object.entries(m.by_category).forEach(([k,v]) => { acc[k] = (acc[k]||0) + v; });
    return acc;
  }, {} as Record<string,number>);
  const topCat = Object.entries(totalCategories).sort(([,a],[,b])=>b-a)[0];

  // Rule-based insights (always shown, no API needed)
  const insights = [
    avgSavings < avgIncome * 0.2 && {
      type: 'warning',
      title: 'Low savings rate',
      body: `You're saving ${((avgSavings/avgIncome)*100).toFixed(1)}% of income on average. The recommended target is 20%. Consider cutting discretionary spend or increasing SIP contributions.`,
    },
    topCat && {
      type: 'info',
      title: `Highest spend: ${topCat[0]}`,
      body: `${topCat[0]} is your biggest expense category at ${formatINR(topCat[1])} over 6 months (avg ${formatINR(topCat[1]/6)}/month).`,
    },
    avgInvest < avgIncome * 0.1 && {
      type: 'warning',
      title: 'Under-investing',
      body: `Investments average ${formatINR(avgInvest)}/month (${((avgInvest/avgIncome)*100).toFixed(1)}% of income). Financial planners recommend at least 10–15%.`,
    },
    avgExpenses > avgIncome * 0.7 && {
      type: 'alert',
      title: 'High expense ratio',
      body: `Expenses are ${((avgExpenses/avgIncome)*100).toFixed(0)}% of income. This leaves little room for emergencies. Review the 50-30-20 budget on the Analytics page.`,
    },
    avgInvest >= avgIncome * 0.1 && {
      type: 'success',
      title: 'Good investment discipline',
      body: `You're investing ${((avgInvest/avgIncome)*100).toFixed(1)}% of income. Keep it up — compound growth will work in your favour over time.`,
    },
  ].filter(Boolean) as { type: string; title: string; body: string }[];

  const iconFor = (type: string) => {
    if (type === 'warning') return <AlertTriangle className="w-4 h-4 text-amber-500" />;
    if (type === 'alert')   return <TrendingDown  className="w-4 h-4 text-red-500" />;
    if (type === 'success') return <CheckCircle   className="w-4 h-4 text-green-500" />;
    return <Lightbulb className="w-4 h-4 text-blue-500" />;
  };
  const bgFor = (type: string) => {
    if (type === 'warning') return 'bg-amber-50  border-amber-200';
    if (type === 'alert')   return 'bg-red-50    border-red-200';
    if (type === 'success') return 'bg-green-50  border-green-200';
    return 'bg-blue-50 border-blue-200';
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
          <Brain className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Financial Advisor</h1>
          <p className="text-sm text-gray-500">Personalised insights based on your 6-month data</p>
        </div>
      </div>

      {/* 6-month snapshot */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Avg Monthly Income',   value: formatINR(avgIncome),   color: 'text-green-600' },
          { label: 'Avg Monthly Expenses', value: formatINR(avgExpenses), color: 'text-red-600'   },
          { label: 'Avg Monthly Savings',  value: formatINR(avgSavings),  color: 'text-indigo-600'},
          { label: 'Avg Investments',      value: formatINR(avgInvest),   color: 'text-emerald-600'},
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <p className={`text-xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Rule-based insights */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <h3 className="font-semibold text-gray-800 mb-4">Key Insights</h3>
        <div className="space-y-3">
          {insights.map(({ type, title, body }) => (
            <div key={title} className={`flex gap-3 p-4 rounded-xl border ${bgFor(type)}`}>
              <div className="mt-0.5 shrink-0">{iconFor(type)}</div>
              <div>
                <p className="text-sm font-semibold text-gray-800">{title}</p>
                <p className="text-sm text-gray-600 mt-0.5">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI advice (optional, requires API key) */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-indigo-600" />
            <h3 className="font-semibold text-gray-800">AI-Generated Summary</h3>
            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">Requires OpenAI key</span>
          </div>
          <button onClick={generateAdvice} disabled={generating}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors">
            {generating ? <Loader className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
            {generating ? 'Thinking…' : 'Generate Advice'}
          </button>
        </div>
        {advice ? (
          <div className="bg-white rounded-xl p-4 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            {advice}
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            Click "Generate Advice" to get a personalised AI analysis of your spending patterns.
            If no OpenAI API key is set, the app will use rule-based insights above instead.
          </p>
        )}
      </div>
    </div>
  );
}
