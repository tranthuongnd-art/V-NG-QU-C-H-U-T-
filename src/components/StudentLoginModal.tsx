import React, { useState } from 'react';
import { StudentProfile } from '../types/game';
import { playTapSound, playSuccessChime } from '../utils/soundEffects';

interface StudentLoginModalProps {
  currentProfile: StudentProfile;
  studentsList: StudentProfile[];
  onSwitchStudent: (studentCode: string) => Promise<void>;
  onUnlockAllZones: () => void;
  onClose: () => void;
  isOnline: boolean;
}

export const StudentLoginModal: React.FC<StudentLoginModalProps> = ({
  currentProfile,
  studentsList,
  onSwitchStudent,
  onUnlockAllZones,
  onClose,
  isOnline,
}) => {
  const [inputCode, setInputCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [notice, setNotice] = useState<string | null>(null);

  const handleLogin = async (codeToUse?: string) => {
    const code = codeToUse || inputCode.trim();
    if (!code) {
      setNotice('Vui lòng nhập mã học sinh (ví dụ: 7A10-01)!');
      return;
    }
    playTapSound();
    setIsLoading(true);
    setNotice(null);

    try {
      await onSwitchStudent(code);
      playSuccessChime();
      setNotice(`✓ Đã đăng nhập và đồng bộ dữ liệu cho mã: ${code.toUpperCase()}`);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (e) {
      setNotice('Lỗi khi đồng bộ dữ liệu.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg p-6 bg-[#161033] rounded-2xl border border-purple-800/60 shadow-2xl text-slate-100 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-purple-900/60">
          <div className="flex items-center gap-2">
            <span className="text-xl">📲</span>
            <div>
              <h2 className="text-base font-bold font-display text-white">
                Đồng Bộ Thiết Bị & Đổi Học Sinh
              </h2>
              <p className="text-[11px] text-purple-300">
                {isOnline
                  ? '🟢 Đã kết nối Cloud Firestore – Dữ liệu đồng bộ trực tiếp về máy Giáo Viên'
                  : 'Chế độ Chơi Thử cục bộ'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              playTapSound();
              onClose();
            }}
            className="text-xs text-slate-400 hover:text-white cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Current logged-in student info */}
        <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-800/50 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold text-white shadow"
              style={{ backgroundColor: currentProfile.avatarColor }}
            >
              7
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">{currentProfile.fullName}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
                  {currentProfile.studentCode}
                </span>
              </div>
              <span className="text-[11px] text-purple-300">
                Biệt danh: <b className="text-amber-300">{currentProfile.nickname}</b> · Vùng {currentProfile.currentZone}/5 · {currentProfile.xp} XP
              </span>
            </div>
          </div>
        </div>

        {/* Quick Unlock All Zones Button */}
        <div className="p-3 rounded-xl bg-gradient-to-r from-amber-950/70 to-purple-950/70 border border-amber-600/50 mb-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-amber-200 block">
              ⚡ Chơi Đến Cuối – Mở Khóa Tự Do Cả 5 Vùng
            </span>
            <span className="text-[10px] text-slate-300">
              Nhấn nút này để mở ngay Vùng 3, 4, 5 nếu bạn muốn trải nghiệm toàn bộ hành trình!
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              playSuccessChime();
              onUnlockAllZones();
              setNotice('🎉 Đã mở khóa tự do toàn bộ 5 hòn đảo!');
              setTimeout(() => onClose(), 800);
            }}
            className="px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-600 hover:bg-amber-500 text-white shadow cursor-pointer transition-transform active:scale-95"
          >
            Mở Khóa Ngay
          </button>
        </div>

        {/* Input Student Code */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-purple-200 mb-1">
            Nhập Mã Học Sinh để đồng bộ từ máy khác:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              placeholder="VD: 7A10-01 hoặc mã của em..."
              className="flex-1 px-3 py-2 bg-purple-950/70 border border-purple-700/60 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-cyan-400"
            />
            <button
              type="button"
              disabled={isLoading || !inputCode.trim()}
              onClick={() => handleLogin()}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white disabled:opacity-50 cursor-pointer shadow"
            >
              {isLoading ? 'Đang tải...' : 'Đăng Nhập'}
            </button>
          </div>
        </div>

        {notice && (
          <div className="mb-3 p-2.5 rounded-lg text-xs font-medium bg-emerald-950/80 border border-emerald-700 text-emerald-200">
            {notice}
          </div>
        )}

        {/* Quick Pick from Class Roster */}
        <div className="flex-1 overflow-y-auto">
          <span className="text-xs font-semibold text-purple-300 block mb-2">
            Hoặc chọn nhanh học sinh trong lớp 7A10:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {studentsList.map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => handleLogin(st.studentCode)}
                className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  st.id === currentProfile.id
                    ? 'border-cyan-400 bg-cyan-950/40 text-white'
                    : 'border-purple-900/60 bg-purple-950/30 hover:bg-purple-900/40 text-slate-300'
                }`}
              >
                <div>
                  <span className="text-xs font-bold block">{st.fullName}</span>
                  <span className="text-[10px] text-purple-300 font-mono">{st.studentCode} · {st.nickname}</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-purple-900/80 text-amber-300 font-mono">
                  Vùng {st.currentZone}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-3 mt-3 border-t border-purple-900/50">
          <button
            onClick={() => {
              playTapSound();
              onClose();
            }}
            className="px-4 py-1.5 text-xs rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
