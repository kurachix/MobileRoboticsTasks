import React, { useState, useRef } from 'react';
import { User } from '../types';
import { api } from '../api';
import { X, Upload, Lock, Check } from 'lucide-react';

interface ProfileModalProps {
  user: User;
  onClose: () => void;
  onUpdated: (updatedUser: User) => void;
}

const PRESET_AVATARS = [
  'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Atlas&backgroundColor=7c3aed',
  'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Nexus&backgroundColor=6d28d9',
  'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Orion&backgroundColor=4c1d95',
  'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Vortex&backgroundColor=9333ea',
  'https://api.dicebear.com/7.x/shapes/svg?seed=Cyber&backgroundColor=1e1b4b',
  'https://api.dicebear.com/7.x/shapes/svg?seed=Prism&backgroundColor=3b0764',
  'https://api.dicebear.com/7.x/identicon/svg?seed=Vector&backgroundColor=181822',
  'https://api.dicebear.com/7.x/identicon/svg?seed=Quantum&backgroundColor=2e1065',
];

export const ProfileModal: React.FC<ProfileModalProps> = ({ user, onClose, onUpdated }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedPreset, setSelectedPreset] = useState<string | null>(
    user.avatar_url && !user.avatar_url.startsWith('/uploads/') ? user.avatar_url : null
  );
  const [uploadedDataUrl, setUploadedDataUrl] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentPreview =
    uploadedDataUrl ||
    selectedPreset ||
    user.avatar_url ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}&backgroundColor=7c3aed`;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
      setError('Limite máximo de 5MB excedido.');
      e.target.value = '';
      return;
    }

    if (!/^image\/(png|jpeg|jpg|webp|gif)$/.test(file.type)) {
      setError('Formato inválido. Use PNG, JPG, WEBP ou GIF.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setUploadedDataUrl(reader.result);
        setSelectedPreset(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPreset = (url: string) => {
    setError(null);
    setSelectedPreset(url);
    setUploadedDataUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Informe sua senha.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const res = await api.updateProfile({
        password,
        avatarDataUrl: uploadedDataUrl,
        presetAvatarUrl: uploadedDataUrl ? null : selectedPreset || user.avatar_url,
      });
      onUpdated(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-[#0e0e16]/95 backdrop-blur-2xl border-t sm:border border-purple-500/20 shadow-[0_24px_80px_rgba(0,0,0,0.85)] overflow-hidden animate-modal-in max-h-[90dvh] flex flex-col"
      >
        <div className="absolute top-0 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-purple-500/60 to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-white/[0.06] shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rotate-45 rounded-[2px] bg-purple-600 shadow-[0_0_10px_rgba(147,51,234,0.7)]" />
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-100">
              Perfil
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-red-950/50 border border-red-500/30 text-red-300 text-xs text-center">
              {error}
            </div>
          )}

          {/* Avatar Preview & Upload Button */}
          <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-[#151520] border border-white/[0.06]">
            <img
              src={currentPreview}
              alt={user.name}
              className="w-16 h-16 rounded-2xl border-2 border-purple-500/50 object-cover bg-[#0b0b12] shadow-[0_0_20px_rgba(109,40,217,0.3)] shrink-0"
            />

            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-white truncate">{user.name}</div>
              <div className="text-[11px] font-mono text-zinc-400 truncate mb-2.5">{user.email}</div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-200 text-[11px] font-medium transition-all active:scale-95"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Subir foto (máx 5MB)</span>
              </button>
            </div>
          </div>

          {/* Predefined Avatars */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-2.5">
              Opções Predefinidas
            </label>
            <div className="grid grid-cols-4 gap-2.5">
              {PRESET_AVATARS.map(url => {
                const isSelected = !uploadedDataUrl && selectedPreset === url;
                return (
                  <button
                    key={url}
                    type="button"
                    onClick={() => handleSelectPreset(url)}
                    className={`relative group rounded-2xl p-1.5 bg-[#151520] border transition-all duration-200 flex items-center justify-center active:scale-95 ${
                      isSelected
                        ? 'border-purple-500 ring-2 ring-purple-500/40 scale-105'
                        : 'border-white/[0.06] hover:border-purple-500/40'
                    }`}
                  >
                    <img
                      src={url}
                      alt="Avatar"
                      className="w-12 h-12 rounded-xl object-cover"
                    />
                    {isSelected && (
                      <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-sm">
                        <Check className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Password Confirmation */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Confirmar com Senha
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Sua senha..."
                className="w-full pl-10 pr-4 py-3 sm:py-2.5 rounded-xl bg-[#151520] border border-white/[0.08] focus:border-purple-500 focus:outline-none text-base sm:text-xs text-zinc-100 placeholder-zinc-500 transition-colors"
                required
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-white/[0.06] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 sm:py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 sm:py-2 rounded-xl bg-gradient-to-r from-purple-700 to-violet-800 hover:from-purple-600 hover:to-violet-700 disabled:opacity-40 text-white text-xs font-semibold transition-all shadow-[0_4px_20px_rgba(109,40,217,0.4)] active:scale-95"
            >
              {isSaving ? '...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

