import React, { useEffect } from 'react';
import { StudentProfile } from '../types/game';
import { playCrownFanfare, playTapSound } from '../utils/soundEffects';
import confetti from 'canvas-confetti';

interface VictoryScreenModalProps {
  profile: StudentProfile;
  onContinue: () => void;
}

export const VictoryScreenModal: React.FC<VictoryScreenModalProps> = ({ profile, onContinue }) => {
  useEffect(() => {
    playCrownFanfare();
    try {
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.5 },
      });
    } catch (e) {
      // ignore
    }
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-2xl p-8 bg-gradient-to-b from-[#2a1705] to-[#120801] rounded-3xl border-2 border-amber-500/80 shadow-2xl text-slate-100 text-center overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-yellow-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Crown Icon */}
        <div className="relative w-28 h-28 mx-auto rounded-full bg-gradient-to-b from-amber-400 to-yellow-600 border-4 border-yellow-200 flex items-center justify-center text-6xl shadow-2xl shadow-amber-500/50 mb-4 animate-bounce">
          👑
        </div>

        <span className="text-xs font-mono font-bold uppercase tracking-widest text-amber-300">
          CHỨNG NHẬN VINH DANH HOÀNG GIA
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-white mt-1 mb-2">
          ĐẠI VƯƠNG SỐ HỮU TỈ LỚP 7
        </h1>
        <p className="text-xs sm:text-sm text-amber-200/90 max-w-lg mx-auto mb-6">
          Chúc mừng hiệp sĩ <span className="font-bold text-white underline">{profile.nickname}</span> đã xuất sắc hoàn thành toàn bộ 5 hòn đảo kỳ ảo và tinh thông Chương I - Số Hữu Tỉ!
        </p>

        {/* Certificate Frame */}
        <div className="p-4 rounded-2xl bg-black/40 border border-amber-500/40 text-left grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="flex flex-col">
            <span className="text-[10px] text-amber-400 font-mono">Tổng Điểm XP</span>
            <span className="text-lg font-bold font-math text-white">{profile.xp} XP</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-amber-400 font-mono">Tinh Thạch</span>
            <span className="text-lg font-bold font-math text-cyan-300">{profile.crystals}/5 💎</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-amber-400 font-mono">Nhiệm Vụ Đã Xong</span>
            <span className="text-lg font-bold font-math text-emerald-300">
              {profile.completedTaskIds.length}/15
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-amber-400 font-mono">Vương Miện</span>
            <span className="text-lg font-bold text-yellow-300">Đã Sở Hữu 👑</span>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-center gap-3">
          <button
            onClick={() => {
              playTapSound();
              onContinue();
            }}
            className="px-8 py-3 rounded-xl font-bold text-sm tracking-wide text-white bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 shadow-xl shadow-amber-950/60 cursor-pointer active:scale-95 transition-all"
          >
            Tiếp Tục Hành Trình Khám Phá
          </button>
        </div>
      </div>
    </div>
  );
};
