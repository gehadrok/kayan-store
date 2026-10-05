import React, { useState, useEffect } from 'react';
import { Megaphone, Plus, Edit3, Trash2, CheckCircle2, XCircle, Calendar, Tag, Sparkles, X, Check, AlertCircle, Eye } from 'lucide-react';
import type { Announcement, Product } from '../../types.ts';
import { StoreAnnouncementsBar } from '../common/StoreAnnouncementsBar.tsx';

interface AnnouncementsAdminSectionProps {
  token: string | null;
}

export const AnnouncementsAdminSection: React.FC<AnnouncementsAdminSectionProps> = ({ token }) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  // Settings States
  const [currentSpeed, setCurrentSpeed] = useState<number>(35);
  const [currentHeight, setCurrentHeight] = useState<number>(40);
  const [selectedSpeed, setSelectedSpeed] = useState<number>(35);
  const [selectedHeight, setSelectedHeight] = useState<number>(40);

  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);

  // ... rest of state
  const [form, setForm] = useState({
    title: '',
    message: '',
    type: 'info',
    icon: 'Sparkles',
    link: '',
    productId: '',
    startAt: new Date().toISOString().slice(0, 16),
    endAt: new Date(Date.now() + 86400000 * 30).toISOString().slice(0, 16),
    priority: 0,
    displayOrder: 0,
    active: true,
    dismissible: true
  });

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAnnouncements();
    fetchProducts();
    fetchTickerSettings();
  }, [token]);

  const fetchTickerSettings = async () => {
    try {
      const res = await fetch('/api/ticker-settings');
      const data = await res.json();
      if (data.success) {
        if (typeof data.tickerSpeed === 'number') {
          setCurrentSpeed(data.tickerSpeed);
          setSelectedSpeed(data.tickerSpeed);
        }
        if (typeof data.tickerHeight === 'number') {
          setCurrentHeight(data.tickerHeight);
          setSelectedHeight(data.tickerHeight);
        }
      }
    } catch (err) {
      console.error('Failed to fetch ticker settings:', err);
    }
  };

  const handleSaveSettings = async () => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/admin/ticker-settings', {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify({ speed: selectedSpeed, height: selectedHeight })
      });
      const data = await res.json();
      if (data.success) {
        setCurrentSpeed(selectedSpeed);
        setCurrentHeight(selectedHeight);
        setSuccessMsg(`🚀 تم حفظ إعدادات الشريط بنجاح: (السرعة: ${selectedSpeed}ث | الارتفاع: ${selectedHeight}بكسل)`);
      }
    } catch {
      setError('فشل حفظ إعدادات الشريط');
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/admin/announcements', { headers, credentials: 'include' });
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.announcements)) {
        setAnnouncements(data.announcements);
      } else {
        throw new Error(data.error || 'فشل في تحميل الإعلانات');
      }
    } catch (err: any) {
      console.error('Failed to fetch admin announcements:', err);
      setError(err?.message || 'فشل في تحميل قائمة الإعلانات');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      if (data.success && Array.isArray(data.products)) {
        setProducts(data.products);
      }
    } catch (err) {
      console.error('Failed to fetch products for announcement linkage:', err);
    }
  };

  const handleOpenCreate = () => {
    setEditingAnnouncement(null);
    setForm({
      title: '',
      message: '',
      type: 'info',
      icon: 'Sparkles',
      link: '',
      productId: '',
      startAt: new Date().toISOString().slice(0, 16),
      endAt: new Date(Date.now() + 86400000 * 30).toISOString().slice(0, 16),
      priority: 0,
      displayOrder: announcements.length + 1,
      active: true,
      dismissible: true
    });
    setError(null);
    setSuccessMsg(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (ann: Announcement) => {
    setEditingAnnouncement(ann);
    setForm({
      title: ann.title,
      message: ann.message,
      type: ann.type,
      icon: ann.icon || 'Sparkles',
      link: ann.link || '',
      productId: ann.productId || '',
      startAt: ann.startAt ? new Date(ann.startAt).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
      endAt: ann.endAt ? new Date(ann.endAt).toISOString().slice(0, 16) : new Date(Date.now() + 86400000 * 30).toISOString().slice(0, 16),
      priority: ann.priority,
      displayOrder: ann.displayOrder,
      active: ann.active,
      dismissible: ann.dismissible !== false
    });
    setError(null);
    setSuccessMsg(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) {
      setError('العنوان والمحتوى مطلوبان');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const payload = {
        ...form,
        startAt: new Date(form.startAt).toISOString(),
        endAt: new Date(form.endAt).toISOString(),
        productId: form.productId || undefined,
        link: form.link || undefined
      };

      const url = editingAnnouncement ? `/api/admin/announcements/${editingAnnouncement.id}` : '/api/admin/announcements';
      const method = editingAnnouncement ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers,
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'فشل في حفظ الإعلان');
      }

      setSuccessMsg(editingAnnouncement ? 'تم تحديث الإعلان بنجاح' : 'تم إنشاء الإعلان بنجاح');
      await fetchAnnouncements();
      setTimeout(() => {
        setModalOpen(false);
      }, 1000);
    } catch (err: any) {
      setError(err?.message || 'حدث خطأ أثناء الحفظ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الإعلان؟')) return;
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`/api/admin/announcements/${id}`, {
        method: 'DELETE',
        headers
      });
      const data = await res.json();
      if (data.success) {
        fetchAnnouncements();
      } else {
        alert(data.error || 'فشل الحذف');
      }
    } catch (err) {
      alert('حدث خطأ أثناء الحذف');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-sky-400" />
            إدارة إعلانات المتجر والعروض (Announcements)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            إدارة شريط الإعلانات الديناميكي في أعلى المتجر، وتحديد تواريخ الظهور والأولوية وروابط المنتجات.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-colors shadow-lg shadow-sky-600/20 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          إضافة إعلان جديد
        </button>
      </div>

      {/* Speed & Size Settings & Live Preview Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-800 pb-5 relative z-10">
          
          {/* Speed Controller */}
          <div className="space-y-4 flex-1">
            <div>
              <h3 className="text-xs sm:text-sm font-black text-white flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">⚡</span> 
                سرعة حركة الشريط (Ticker Speed)
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">التحكم في سرعة دوران الأخبار (كلما زاد الرقم كانت الحركة أبطأ وأكثر هدوءاً).</p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center p-1 bg-slate-950 border border-slate-800 rounded-2xl shadow-inner">
                <button 
                  onClick={() => setSelectedSpeed(prev => Math.min(1000, prev + 1))}
                  className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 text-xl hover:bg-slate-800 hover:text-white transition-all flex flex-col items-center justify-center gap-0.5 shadow-sm"
                  title="إبطاء الحركة"
                >
                  <span className="text-[9px] font-bold text-slate-400">أبطأ</span>
                  🐢
                </button>
                
                <div className="px-6 flex flex-col items-center justify-center min-w-[100px]">
                  <span className="text-xl font-mono font-black text-sky-400">{selectedSpeed}</span>
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">ثانية / دورة</span>
                </div>

                <button 
                  onClick={() => setSelectedSpeed(prev => Math.max(2, prev - 1))}
                  className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 text-xl hover:bg-slate-800 hover:text-white transition-all flex flex-col items-center justify-center gap-0.5 shadow-sm"
                  title="تسريع الحركة"
                >
                  <span className="text-[9px] font-bold text-slate-400">أسرع</span>
                  🚀
                </button>
              </div>
              
              <div className="hidden sm:flex flex-col gap-1">
                <button onClick={() => setSelectedSpeed(300)} className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 transition-colors">🧘 هادئ جداً (300ث)</button>
                <button onClick={() => setSelectedSpeed(120)} className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 transition-colors">🐢 بطيء جداً (120ث)</button>
                <button onClick={() => setSelectedSpeed(60)} className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 transition-colors">🚶 بطيء (60ث)</button>
                <button onClick={() => setSelectedSpeed(35)} className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 transition-colors">⚡ متوسط (35ث)</button>
              </div>
            </div>
          </div>

          {/* Size Controller */}
          <div className="space-y-4 flex-1">
            <div>
              <h3 className="text-xs sm:text-sm font-black text-white flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">📏</span> 
                ارتفاع وحجم الشريط (Ticker Height)
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">تغيير الحجم الكلي للشريط العلوي ليتناسب مع تصميمك.</p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center p-1 bg-slate-950 border border-slate-800 rounded-2xl shadow-inner">
                <button 
                  onClick={() => setSelectedHeight(prev => Math.max(20, prev - 2))}
                  className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 text-xl font-black text-slate-400 hover:bg-slate-800 hover:text-white transition-all flex flex-col items-center justify-center shadow-sm"
                  title="تصغير"
                >
                  <span className="text-[10px]">تصغير</span>
                  -
                </button>
                
                <div className="px-6 flex flex-col items-center justify-center min-w-[100px]">
                  <span className="text-xl font-mono font-black text-emerald-400">{selectedHeight}</span>
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">بكسل (PX)</span>
                </div>

                <button 
                  onClick={() => setSelectedHeight(prev => Math.min(120, prev + 2))}
                  className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 text-xl font-black text-slate-400 hover:bg-slate-800 hover:text-white transition-all flex flex-col items-center justify-center shadow-sm"
                  title="تكبير"
                >
                  <span className="text-[10px]">تكبير</span>
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Save Action */}
          <div className="lg:border-r lg:border-slate-800 lg:pr-6 lg:ml-6 flex flex-col justify-center gap-3">
            <button
              onClick={handleSaveSettings}
              className={`group relative flex items-center justify-center gap-3 px-8 py-4 rounded-2xl text-sm font-black transition-all duration-300 overflow-hidden ${
                (selectedSpeed !== currentSpeed || selectedHeight !== currentHeight)
                  ? 'bg-sky-600 text-white shadow-2xl shadow-sky-600/40 scale-105 hover:bg-sky-500 ring-4 ring-sky-500/20'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              <div className={`absolute inset-0 bg-gradient-to-r from-sky-400/20 to-transparent transition-transform duration-1000 translate-x-[-100%] group-hover:translate-x-[100%]`} />
              <CheckCircle2 className={`w-5 h-5 ${(selectedSpeed !== currentSpeed || selectedHeight !== currentHeight) ? 'animate-bounce' : ''}`} />
              <span>حفظ التعديلات النهائية للزوار</span>
            </button>
            
            {(selectedSpeed !== currentSpeed || selectedHeight !== currentHeight) && (
              <p className="text-[10px] text-amber-400 font-black text-center animate-pulse flex items-center justify-center gap-1">
                <AlertCircle className="w-3 h-3" /> لديك تعديلات غير محفوظة!
              </p>
            )}
          </div>
        </div>

        {/* Live Preview Bar */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-black text-sky-400 flex items-center gap-2 bg-sky-500/5 px-3 py-1 rounded-full border border-sky-500/10">
              <Eye className="w-4 h-4" /> المعاينة الحية قبل الحفظ (Live Preview)
            </span>
            <div className="flex gap-4 font-mono text-[10px] text-slate-400 bg-slate-950 px-3 py-1 rounded-full border border-slate-800">
              <span>السرعة الحالية: <b className={selectedSpeed !== currentSpeed ? 'text-amber-400' : ''}>{selectedSpeed}ث</b></span>
              <span className="w-px h-3 bg-slate-800 mx-1" />
              <span>الارتفاع الحالي: <b className={selectedHeight !== currentHeight ? 'text-amber-400' : ''}>{selectedHeight}px</b></span>
            </div>
          </div>
          
          <div className="rounded-3xl overflow-hidden border-2 border-slate-800 shadow-2xl transition-all duration-300 hover:border-sky-500/30">
            <StoreAnnouncementsBar overrideSpeed={selectedSpeed} overrideHeight={selectedHeight} />
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {successMsg}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-slate-400 text-xs">جاري تحميل الإعلانات...</div>
      ) : announcements.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-400">
          <Megaphone className="w-12 h-12 mx-auto mb-3 opacity-30 text-sky-400" />
          <p className="text-sm font-bold text-white mb-1">لا توجد إعلانات مسجلة</p>
          <p className="text-xs text-slate-500">أضف إعلاناً جديداً ليظهر فوراً في شريط المتجر العلوي.</p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-start border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold">
                  <th className="p-4 text-start">العنوان والمحتوى</th>
                  <th className="p-4 text-start">النوع</th>
                  <th className="p-4 text-start">الفترة الزمنية</th>
                  <th className="p-4 text-start">الأولوية والترتيب</th>
                  <th className="p-4 text-start">الحالة</th>
                  <th className="p-4 text-end">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {announcements.map((ann) => (
                  <tr key={ann.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 max-w-xs">
                      <div className="font-bold text-white truncate">{ann.title}</div>
                      <div className="text-[11px] text-slate-400 truncate mt-0.5">{ann.message}</div>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                        {ann.type}
                      </span>
                    </td>
                    <td className="p-4 text-[11px] text-slate-400">
                      <div>من: {new Date(ann.startAt).toLocaleDateString('ar')}</div>
                      <div>إلى: {new Date(ann.endAt).toLocaleDateString('ar')}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-slate-300 font-medium">أولوية: {ann.priority}</div>
                      <div className="text-[10px] text-slate-500">ترتيب: {ann.displayOrder}</div>
                    </td>
                    <td className="p-4">
                      {ann.active ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                          <CheckCircle2 className="w-3 h-3" /> فعال
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/25">
                          <XCircle className="w-3 h-3" /> متوقف
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-end">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(ann)}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                          title="تعديل"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(ann.id)}
                          className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                          title="حذف"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal for Create / Edit */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl text-slate-100 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-5 left-5 text-slate-400 hover:text-white p-1 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-4 border-b border-slate-800 pb-3 flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-sky-400" />
              {editingAnnouncement ? 'تعديل الإعلان' : 'إضافة إعلان جديد'}
            </h3>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">عنوان الإعلان *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="مثال: خصم 50% على حزمة كيان أوفيس"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">محتوى الإعلان *</label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="اكتب تفاصيل الإعلان أو الترويج..."
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">نوع الإعلان</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="info">معلومة عامة (Info)</option>
                    <option value="discount">خصم وعرض (Discount)</option>
                    <option value="new_product">منتج جديد (New Product)</option>
                    <option value="update">تحديث وتطوير (Update)</option>
                    <option value="promo">ترويج خاص (Promo)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">الأيقونة</label>
                  <select
                    value={form.icon}
                    onChange={(e) => setForm({ ...form, icon: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="Sparkles">نجوم لامعة (Sparkles)</option>
                    <option value="FileText">ملف / مستند (FileText)</option>
                    <option value="Tag">خصم (Tag)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">رابط مخصص (اختياري)</label>
                  <input
                    type="text"
                    value={form.link}
                    onChange={(e) => setForm({ ...form, link: e.target.value })}
                    placeholder="/apps أو رابط خارجي"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">ارتباط بمنتج (اختياري)</label>
                  <select
                    value={form.productId}
                    onChange={(e) => setForm({ ...form, productId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="">-- بدون ارتباط بمنتج --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.nameAr} ({p.slug})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">تاريخ البدء (Start At)</label>
                  <input
                    type="datetime-local"
                    value={form.startAt}
                    onChange={(e) => setForm({ ...form, startAt: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">تاريخ الانتهاء (End At)</label>
                  <input
                    type="datetime-local"
                    value={form.endAt}
                    onChange={(e) => setForm({ ...form, endAt: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">الأولوية (Priority - أعلى يظهر أولاً)</label>
                  <input
                    type="number"
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value, 10) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">ترتيب العرض (Display Order)</label>
                  <input
                    type="number"
                    value={form.displayOrder}
                    onChange={(e) => setForm({ ...form, displayOrder: parseInt(e.target.value, 10) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) => setForm({ ...form, active: e.target.checked })}
                    className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-sky-600 focus:ring-sky-500"
                  />
                  <span className="font-bold text-slate-300">إعلان فعال (Active)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.dismissible}
                    onChange={(e) => setForm({ ...form, dismissible: e.target.checked })}
                    className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-sky-600 focus:ring-sky-500"
                  />
                  <span className="font-bold text-slate-300">قابل للإغلاق (Dismissible)</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-white bg-sky-600 hover:bg-sky-500 disabled:opacity-50 transition-colors font-bold shadow-lg shadow-sky-600/20 cursor-pointer flex items-center gap-2"
                >
                  {submitting ? 'جاري الحفظ...' : 'حفظ الإعلان'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
