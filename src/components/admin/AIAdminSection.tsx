
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext.tsx';
import {
  Brain, Cpu, Zap, Activity, Settings2, Shield,
  RefreshCw, Plus, Edit3, Trash2, CheckCircle2,
  AlertTriangle, XCircle, BarChart3, Key,
  ExternalLink, Check, X, ShieldAlert, Layers
} from 'lucide-react';
import { AIProviderConfig, AIModelConfig, AISettings, AIUsageStats } from '../../types.ts';

interface AIAdminSectionProps {
  token: string | null;
}

export const AIAdminSection: React.FC<AIAdminSectionProps> = ({ token }) => {
  const { lang, dir } = useLanguage();
  const [activeSubTab, setActiveTab] = useState<'providers' | 'models' | 'routing' | 'usage' | 'keys'>('providers');

  const [providers, setProviders] = useState<any[]>([]);
  const [models, setModels] = useState<AIModelConfig[]>([]);
  const [settings, setSettings] = useState<AISettings | null>(null);
  const [usageStats, setUsageStats] = useState<AIUsageStats[]>([]);
  const [userKeys, setUserKeys] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'provider' | 'model' | 'settings'>('provider');
  const [editingItem, setEditingItem] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    const headers = { 'Authorization': `Bearer ${token}` };

    try {
      if (activeSubTab === 'providers') {
        const res = await fetch('/api/admin/ai/providers', { headers });
        const data = await res.json();
        if (data.success) setProviders(data.providers);
      } else if (activeSubTab === 'models') {
        const [mRes, pRes] = await Promise.all([
          fetch('/api/admin/ai/models', { headers }),
          fetch('/api/admin/ai/providers', { headers })
        ]);
        const mData = await mRes.json();
        const pData = await pRes.json();
        if (mData.success) setModels(mData.models);
        if (pData.success) setProviders(pData.providers);
      } else if (activeSubTab === 'routing') {
        const sRes = await fetch('/api/admin/ai/settings', { headers });
        const sData = await sRes.json();
        if (sData.success) setSettings(sData.settings);
      } else if (activeSubTab === 'usage') {
        const uRes = await fetch('/api/admin/ai/usage/stats', { headers });
        const uData = await uRes.json();
        if (uData.success) setUsageStats(uData.stats);
      } else if (activeSubTab === 'keys') {
        const kRes = await fetch('/api/admin/ai/user-keys', { headers });
        const kData = await kRes.json();
        if (kData.success) setUserKeys(kData.keys);
      }
    } catch (err: any) {
      setError('فشل تحميل البيانات من الخادم');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeSubTab, token]);

  const handleToggleProvider = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      const res = await fetch(`/api/admin/ai/providers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) fetchData();
    } catch (err) {
      alert('فشل تحديث حالة المزود');
    }
  };

  const handleToggleModel = async (id: string, currentActive: boolean) => {
    try {
      const res = await fetch(`/api/admin/ai/models/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ active: !currentActive })
      });
      if (res.ok) fetchData();
    } catch (err) {
      alert('فشل تحديث حالة النموذج');
    }
  };

  const testProvider = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/ai/providers/${id}/test`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      alert(`نتجية الفحص: ${data.status}\n${data.details}`);
    } catch (err) {
      alert('فشل إجراء فحص الاتصال');
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Header */}
      <div className="flex flex-col md:flex-row justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-sm">
            <Brain className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">AI Control Center</h2>
            <p className="text-xs text-slate-500">إدارة مزودي الذكاء الاصطناعي وسياسات التوجيه والتعافي</p>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
          {[
            { id: 'providers', label: 'المزودين', icon: Cpu },
            { id: 'models', label: 'النماذج', icon: Zap },
            { id: 'routing', label: 'التوجيه', icon: Settings2 },
            { id: 'usage', label: 'الاستهلاك', icon: BarChart3 },
            { id: 'keys', label: 'مفاتيح BYOK', icon: Key }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeSubTab === tab.id
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <tab.icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      )}

      {/* Content Area */}
      {!loading && !error && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          {activeSubTab === 'providers' && (
            <div className="grid gap-4">
               {providers.map(p => (
                 <div key={p.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm hover:border-slate-300 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${p.status === 'active' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400'}`}>
                        <Cpu className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                           <h4 className="font-bold text-slate-900">{p.displayName}</h4>
                           <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                             p.adapterStatus === 'LIVE' ? 'bg-emerald-50 text-emerald-700' :
                             p.adapterStatus === 'STUB' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                           }`}>
                             {p.adapterStatus}
                           </span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-mono">Type: {p.type} | ID: {p.id}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        p.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {p.status === 'active' ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                        <span>{p.status === 'active' ? 'مفعل' : 'معطل'}</span>
                      </div>

                      <button
                        onClick={() => testProvider(p.id)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="فحص الاتصال"
                      >
                        <Activity className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => handleToggleProvider(p.id, p.status)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                          p.status === 'active'
                          ? 'border-amber-200 text-amber-700 hover:bg-amber-50'
                          : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                        }`}
                      >
                        {p.status === 'active' ? 'تعطيل' : 'تفعيل'}
                      </button>
                    </div>
                 </div>
               ))}

               <button className="border-2 border-dashed border-slate-200 rounded-2xl p-4 flex items-center justify-center gap-2 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group">
                 <Plus className="h-5 w-5 group-hover:scale-110 transition-transform" />
                 <span className="text-sm font-bold">إضافة مزود ذكاء اصطناعي مخصص</span>
               </button>
            </div>
          )}

          {activeSubTab === 'models' && (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-start border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-start text-[10px] font-bold text-slate-500 uppercase tracking-wider">النموذج</th>
                    <th className="px-4 py-3 text-start text-[10px] font-bold text-slate-500 uppercase tracking-wider">المزود</th>
                    <th className="px-4 py-3 text-start text-[10px] font-bold text-slate-500 uppercase tracking-wider">الأولوية</th>
                    <th className="px-4 py-3 text-start text-[10px] font-bold text-slate-500 uppercase tracking-wider">الحالة</th>
                    <th className="px-4 py-3 text-start text-[10px] font-bold text-slate-500 uppercase tracking-wider">الفئة</th>
                    <th className="px-4 py-3 text-start text-[10px] font-bold text-slate-500 uppercase tracking-wider">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {models.map(m => (
                    <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-900">{m.displayNameAr}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{m.modelId}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] px-2 py-0.5 bg-slate-100 rounded-full font-bold text-slate-600">
                          {m.providerId}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                          {m.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className={`flex items-center gap-1 text-[10px] font-bold ${m.active ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {m.active ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                          <span>{m.active ? 'نشط' : 'متوقف'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-bold ${m.freeTierStatus === 'FREE' ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {m.freeTierStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleToggleModel(m.id, m.active)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all"
                          >
                            <Settings2 className="h-3.5 w-3.5" />
                          </button>
                          <button className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="p-3 bg-slate-50 border-t border-slate-100">
                 <button className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-dashed border-slate-300 text-slate-500 hover:text-indigo-600 hover:border-indigo-300 hover:bg-white transition-all text-xs font-bold">
                   <Plus className="h-3.5 w-3.5" />
                   <span>تسجيل نموذج AI جديد</span>
                 </button>
              </div>
            </div>
          )}

          {activeSubTab === 'routing' && settings && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h3 className="text-sm font-extrabold text-slate-900 mb-4 flex items-center gap-2">
                  <Layers className="h-4 w-4 text-indigo-600" />
                  سياسات التوجيه والتعافي العالمية
                </h3>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700">وضع التوجيه التلقائي</label>
                    <select
                      value={settings.routingMode}
                      onChange={(e) => setSettings({...settings, routingMode: e.target.value as any})}
                      className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    >
                      <option value="AUTO">AUTO (أفضل موازنة)</option>
                      <option value="FREE_FIRST">FREE_FIRST (الأرخص أولاً)</option>
                      <option value="USER_SELECTED">USER_SELECTED (خيار المستخدم)</option>
                      <option value="PROVIDER_SELECTED">PROVIDER_SELECTED (تفضيل المزود)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700">الحد الأقصى لمحاولات التعافي</label>
                    <input
                      type="number"
                      min="1" max="5"
                      value={settings.maxRetryAttempts}
                      onChange={(e) => setSettings({...settings, maxRetryAttempts: parseInt(e.target.value)})}
                      className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 col-span-full">
                    <div className={`w-10 h-6 rounded-full relative transition-colors cursor-pointer ${settings.allowPaidFallback ? 'bg-indigo-600' : 'bg-slate-300'}`}
                         onClick={() => setSettings({...settings, allowPaidFallback: !settings.allowPaidFallback})}>
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.allowPaidFallback ? 'left-5' : 'left-1'}`} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">السماح بالتعافي المدفوع (Paid Fallback)</h4>
                      <p className="text-[10px] text-slate-500">في حال فشل النماذج المجانية، هل يتم استخدام النماذج المدفوعة تلقائياً؟</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-end">
                   <button
                    onClick={async () => {
                      const res = await fetch('/api/admin/ai/settings', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify(settings)
                      });
                      if (res.ok) alert('تم حفظ الإعدادات بنجاح');
                    }}
                    className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-slate-900/20 hover:bg-slate-800 active:scale-95 transition-all"
                   >
                     حفظ التغييرات
                   </button>
                </div>
              </div>
            </div>
          )}

          {activeSubTab === 'usage' && (
            <div className="space-y-6">
               <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">إجمالي العمليات</span>
                    <div className="text-2xl font-mono font-bold text-slate-900 mt-1">
                      {usageStats.reduce((acc, s) => acc + s.successCount + s.failedCount + s.quotaErrorCount, 0)}
                    </div>
                  </div>
                  <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
                    <span className="text-[10px] font-bold text-emerald-600 uppercase">النجاح</span>
                    <div className="text-2xl font-mono font-bold text-emerald-700 mt-1">
                      {usageStats.reduce((acc, s) => acc + s.successCount, 0)}
                    </div>
                  </div>
                  <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
                    <span className="text-[10px] font-bold text-rose-600 uppercase">الفشل</span>
                    <div className="text-2xl font-mono font-bold text-rose-700 mt-1">
                      {usageStats.reduce((acc, s) => acc + s.failedCount, 0)}
                    </div>
                  </div>
                  <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
                    <span className="text-[10px] font-bold text-amber-600 uppercase">Quota Limits</span>
                    <div className="text-2xl font-mono font-bold text-amber-700 mt-1">
                      {usageStats.reduce((acc, s) => acc + s.quotaErrorCount, 0)}
                    </div>
                  </div>
               </div>

               <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full text-start">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 text-start text-[10px] font-bold text-slate-500 uppercase">المزود/النموذج</th>
                        <th className="px-4 py-3 text-start text-[10px] font-bold text-slate-500 uppercase">القدرة</th>
                        <th className="px-4 py-3 text-start text-[10px] font-bold text-slate-500 uppercase">نجاح</th>
                        <th className="px-4 py-3 text-start text-[10px] font-bold text-slate-500 uppercase">فشل</th>
                        <th className="px-4 py-3 text-start text-[10px] font-bold text-slate-500 uppercase">Avg (ms)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {usageStats.map((s, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-3">
                             <div className="text-xs font-bold">{s.modelId}</div>
                             <div className="text-[10px] text-slate-400">{s.providerId}</div>
                          </td>
                          <td className="px-4 py-3 text-[10px] font-mono font-bold text-slate-600">{s.capability}</td>
                          <td className="px-4 py-3 text-xs font-bold text-emerald-600">{s.successCount}</td>
                          <td className="px-4 py-3 text-xs font-bold text-rose-600">{s.failedCount + s.quotaErrorCount}</td>
                          <td className="px-4 py-3 text-xs font-mono">{Math.round(s.avgDurationMs)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
               </div>
            </div>
          )}

          {activeSubTab === 'keys' && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex gap-3 text-amber-800">
                 <ShieldAlert className="h-5 w-5 shrink-0" />
                 <div>
                   <p className="text-xs font-bold">حماية خصوصية المستخدمين</p>
                   <p className="text-[10px]">لا يمكن للمسؤولين رؤية مفاتيح API الخاصة بالمستخدمين. يتم عرض البصمة الزمنية والحالة فقط.</p>
                 </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-start">
                   <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 text-start text-[10px] font-bold text-slate-500 uppercase tracking-wider">المستخدم</th>
                        <th className="px-4 py-3 text-start text-[10px] font-bold text-slate-500 uppercase tracking-wider">المزود</th>
                        <th className="px-4 py-3 text-start text-[10px] font-bold text-slate-500 uppercase tracking-wider">المفتاح</th>
                        <th className="px-4 py-3 text-start text-[10px] font-bold text-slate-500 uppercase tracking-wider">تاريخ التحديث</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                     {userKeys.map(k => (
                       <tr key={k.id}>
                         <td className="px-4 py-3">
                           <div className="text-xs font-bold text-slate-900">{k.userName}</div>
                           <div className="text-[10px] text-slate-400 font-mono">{k.userEmail}</div>
                         </td>
                         <td className="px-4 py-3">
                            <span className="text-[10px] px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full font-bold uppercase">{k.providerId}</span>
                         </td>
                         <td className="px-4 py-3">
                            <span className="text-xs font-mono text-slate-400">{k.mask}</span>
                         </td>
                         <td className="px-4 py-3 text-[10px] text-slate-500">
                            {new Date(k.updatedAt).toLocaleString('ar-EG')}
                         </td>
                       </tr>
                     ))}
                   </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
