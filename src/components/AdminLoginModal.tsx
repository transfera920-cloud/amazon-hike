import React, { useState } from 'react';
import { Lock, User, KeyRound, Eye, EyeOff, X, AlertCircle } from 'lucide-react';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { ADMIN_EMAIL } from '../data/adminConfig';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, username.trim(), password);
      if (cred.user.email !== ADMIN_EMAIL) {
        await signOut(auth);
        setErrorMsg('此帳號沒有後台管理權限。');
        return;
      }
      setUsername('');
      setPassword('');
      onLoginSuccess();
    } catch (err) {
      console.warn('Admin login failed', err);
      setErrorMsg('帳號或密碼錯誤，請重新輸入！');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setErrorMsg(null);
    onClose();
  };

  return (
    <div className="admin-modal-root fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-[#1e293b] text-white px-6 py-4 flex justify-between items-center border-b border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/30 text-emerald-400 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base">後台管理員登入</h3>
              <p className="text-[11px] text-slate-300">請輸入管理帳號與密碼以進行網站內容維護</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3.5 py-2.5 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-gray-500" />
              <span>管理員 Email</span>
            </label>
            <input
              type="email"
              required
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="請輸入管理員 Email"
              className="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-gray-500" />
              <span>登入密碼</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="請輸入密碼"
                className="w-full border border-gray-300 px-3 py-2 pr-10 rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                title={showPassword ? '隱藏密碼' : '顯示密碼'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-lg shadow-sm transition flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>{loading ? '登入中…' : '驗證並登入後台'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
