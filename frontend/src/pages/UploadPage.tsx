import { useState, useRef } from 'react';
import { uploadApi } from '../utils/api';
import { Upload, CheckCircle, XCircle, FileText, AlertCircle } from 'lucide-react';

export default function UploadPage() {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file) return;
    if (!file.name.match(/\.(csv|xlsx|xls)$/i)) {
      setResult({ success: false, message: 'Only .csv and .xlsx files are supported. PDF parsing is a future feature.' });
      return;
    }
    setUploading(true);
    setResult(null);
    try {
      const r = await uploadApi.uploadFile(file);
      setResult({ success: true, message: r.data.message });
    } catch (err: any) {
      setResult({ success: false, message: err.response?.data?.detail || 'Upload failed. Please try again.' });
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Upload Transactions</h1>
      <p className="text-gray-500 mb-6 text-sm">Upload a CSV or Excel file exported from your bank or any finance app.</p>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-colors ${
          dragging ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
        }`}
      >
        <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden"
          onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
        <Upload className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <p className="text-gray-700 font-medium mb-1">
          {uploading ? 'Uploading…' : 'Drop your file here, or click to browse'}
        </p>
        <p className="text-sm text-gray-400">Supported: CSV, Excel (.xlsx, .xls) — max 10 MB</p>
        <p className="text-xs text-gray-400 mt-1">PDF bank statements: coming in a future update</p>
      </div>

      {result && (
        <div className={`mt-4 flex items-start gap-3 p-4 rounded-xl border ${
          result.success ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {result.success
            ? <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
            : <XCircle className="w-5 h-5 shrink-0 mt-0.5" />}
          <p className="text-sm">{result.message}</p>
        </div>
      )}

      {/* Expected format guide */}
      <div className="mt-8 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-indigo-500" />
          <h3 className="font-semibold text-gray-800">Expected File Format</h3>
        </div>
        <p className="text-sm text-gray-600 mb-3">
          Your file should have these columns (extra columns are ignored):
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50">
                {['date','description','amount','type','source','account','category','merchant'].map(h => (
                  <th key={h} className="border border-slate-200 px-3 py-2 text-left font-mono text-indigo-700">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-slate-200 px-3 py-2 text-gray-600">2025-03-15</td>
                <td className="border border-slate-200 px-3 py-2 text-gray-600">Swiggy food order</td>
                <td className="border border-slate-200 px-3 py-2 text-gray-600">450</td>
                <td className="border border-slate-200 px-3 py-2 text-gray-600">debit</td>
                <td className="border border-slate-200 px-3 py-2 text-gray-400">UPI</td>
                <td className="border border-slate-200 px-3 py-2 text-gray-400">HDFC Savings</td>
                <td className="border border-slate-200 px-3 py-2 text-gray-400">(auto)</td>
                <td className="border border-slate-200 px-3 py-2 text-gray-400">Swiggy</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span><strong>category</strong> and <strong>merchant</strong> are optional — the app will auto-detect them using our rules engine.</span>
        </div>
      </div>
    </div>
  );
}
