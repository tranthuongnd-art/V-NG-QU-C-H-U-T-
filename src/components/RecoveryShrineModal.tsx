import React from 'react';
import { playSuccessChime, playTapSound } from '../utils/soundEffects';

interface RecoveryShrineModalProps {
  onHeal: () => void;
  onExitToWorld: () => void;
}

export const RecoveryShrineModal: React.FC<RecoveryShrineModalProps> = ({ onHeal, onExitToWorld }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-md p-6 bg-[#1a0f2b] rounded-2xl border border-red-800/60 shadow-2xl text-slate-100 text-center">
        {/* Shrine icon */}
        <div className="w-20 h-20 mx-auto rounded-full bg-red-950/60 border-2 border-red-500/50 flex items-center justify-center text-4xl mb-4 shadow-lg shadow-red-900/40 animate-pulse">
          💖
        </div>

        <h2 className="text-xl font-bold font-display text-red-200 mb-1">
          TRẠM HỒI SỨC HUYỀN BÍ
        </h2>
        <p className="text-xs text-purple-300 mb-4">
          Hiệp sĩ đã tạm thời kiệt sức sau những thử thách cam go. Đừng lo lắng!
        </p>

        <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-800/40 text-left text-xs space-y-2 mb-6">
          <div className="flex items-center gap-2 text-emerald-300">
            <span>✓</span>
            <span>Tiến trình hoàn thành và các tinh thạch vẫn được bảo toàn nguyên vẹn.</span>
          </div>
          <div className="flex items-center gap-2 text-cyan-300">
            <span>✓</span>
            <span>Số điểm XP đã tích lũy không hề bị mất.</span>
          </div>
          <div className="flex items-center gap-2 text-amber-300">
            <span>✓</span>
            <span>Suối nguồn sinh mệnh sẽ phục hồi đầy đủ 5 mạng ❤️ để tiếp tục hành trình!</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => {
              playTapSound();
              playSuccessChime();
              onHeal();
            }}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 hover:from-red-500 hover:to-pink-500 shadow-lg shadow-red-950/50 cursor-pointer active:scale-95 transition-all"
          >
            💖 Hồi Phục 5 Mạng Ngay
          </button>
          <button
            onClick={() => {
              playTapSound();
              onExitToWorld();
            }}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Về Lại Thế Giới
          </button>
        </div>
      </div>
    </div>
  );
};
