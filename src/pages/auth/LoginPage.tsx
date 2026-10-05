import React, { useState } from 'react';
import { useUserAuth } from '../../context/UserAuthContext.tsx';
import { Lock, Mail, ArrowRight, AlertCircle, LogIn } from 'lucide-react';

interface LoginPageProps {
  onNavigate?: (path: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { login } = useUserAuth();

  const handleNav = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new Event('popstate'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'فشل تسجيل الدخول. يرجى التأكد من البيانات المدخلة');
        return;
      }

      login(data.token, data.user);
      handleNav('/account');
    } catch (err: any) {
      setError('حدث خطأ بالاتصال بالخادم. يرجى المحاولة لاحقاً');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-slate-50">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-xl border border-slate-100 text-start">
        <div className="mb-6 text-center">
          <div className="h-12 w-12 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center mx-auto mb-3">
            <LogIn className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">تسجيل الدخول</h1>
          <p className="text-xs text-slate-500 mt-1">مرحباً بك مجدداً في متجر كيان للحلول والمنتجات الرقمية</p>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl bg-rose-50 p-3 text-xs text-rose-800 border border-rose-200 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="font-bold text-slate-700">البريد الإلكتروني *</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full rounded-xl border border-slate-200 p-3 ps-10 bg-white font-medium focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-hidden"
              />
              <Mail className="h-4 w-4 text-slate-400 absolute start-3 top-3.5" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700">كلمة المرور *</label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-200 p-3 ps-10 bg-white font-medium focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-hidden"
              />
              <Lock className="h-4 w-4 text-slate-400 absolute start-3 top-3.5" />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-sky-600 py-3 text-xs font-bold text-white hover:bg-sky-500 shadow-md shadow-sky-600/20 transition-all disabled:opacity-50 mt-2"
          >
            {submitting ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-100 text-center text-xs text-slate-500">
          ليس لديك حساب بعد؟{' '}
          <button onClick={() => handleNav('/register')} className="font-bold text-sky-600 hover:text-sky-700">
            إنشاء حساب جديد
          </button>
        </div>
      </div>
    </div>
  );
};
