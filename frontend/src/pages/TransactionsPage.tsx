import { useEffect, useState } from 'react';
import { transactionApi } from '../utils/api';
import { formatINR } from '../utils/format';
import type { Transaction } from '../types';
import { Search, TrendingUp, TrendingDown } from 'lucide-react';

const CATEGORIES = [
  'All','Salary','Business Income','Food & Dining','Groceries','Shopping','Fuel',
  'Travel','Utilities','Rent','EMI','Insurance','Investments','Healthcare',
  'Education','Entertainment','Transfers','Cash Withdrawal','Taxes','Miscellaneous',
];

export default function TransactionsPage() {
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [month, setMonth] = useState('');

  useEffect(() => {
    setLoading(true);
    transactionApi.list({ limit: 500, category: category !== 'All' ? category : undefined, month: month ? Number(month) : undefined })
      .then(r => setTxns(r.data))
      .finally(() => setLoading(false));
  }, [category, month]);

  const filtered = txns.filter(t =>
    t.description.toLowerCase().includes(search.toLowerCase()) ||
    (t.merchant || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Transactions</h1>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search description or merchant…"
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <select value={category} onChange={e => setCategory(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={month} onChange={e => setMonth(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
          <option value="">All months</option>
          {['Jan','Feb','Mar','Apr','May','Jun'].map((m,i) => (
            <option key={m} value={i+1}>{m} 2025</option>
          ))}
        </select>
      </div>

      <p className="text-sm text-gray-500 mb-3">{filtered.length} transactions</p>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Date</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Description</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Merchant</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Category</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Account</th>
                <th className="text-right px-4 py-3 text-gray-500 font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">No transactions found</td></tr>
              ) : filtered.map(t => (
                <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{t.date}</td>
                  <td className="px-4 py-3 text-gray-800 max-w-xs truncate">{t.description}</td>
                  <td className="px-4 py-3 text-gray-600">{t.merchant || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full text-xs">
                      {t.category || 'Miscellaneous'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{t.account || '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-semibold flex items-center justify-end gap-1 ${t.type === 'credit' ? 'text-green-600' : 'text-gray-800'}`}>
                      {t.type === 'credit'
                        ? <TrendingUp className="w-3 h-3" />
                        : <TrendingDown className="w-3 h-3 text-red-400" />}
                      {formatINR(t.amount)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
