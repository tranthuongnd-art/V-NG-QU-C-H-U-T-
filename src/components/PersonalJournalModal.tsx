import React, { useState } from 'react';
import { StudentProfile } from '../types/game';
import { ZONES_METADATA } from '../data/zonesData';
import { playTapSound } from '../utils/soundEffects';

interface PersonalJournalModalProps {
  profile: StudentProfile;
  onClose: () => void;
}

export const PersonalJournalModal: React.FC<PersonalJournalModalProps> = ({ profile, onClose }) => {
  const [activeTab, setActiveTab] = useState<'CRYSTALS' | 'LORE' | 'FORMULAS'>('CRYSTALS');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-[#140e2e] rounded-2xl border border-purple-800/60 shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#1b123d] border-b border-purple-800/60">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">📖</span>
            <div>
              <h2 className="text-base font-bold font-display text-white">
                NHẬT KÝ HÀNH TRÌNH SỐ HỮU TỈ
              </h2>
              <p className="text-xs text-purple-300">
                Hiệp Sĩ: {profile.nickname} · {profile.xp} XP · {profile.crystals}/5 Tinh Thạch
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              playTapSound();
              onClose();
            }}
            className="text-xs px-3 py-1.5 rounded-lg bg-purple-900/40 hover:bg-purple-800/60 text-purple-200 transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-2 px-6 pt-3 bg-[#171035] border-b border-purple-900/50">
          <button
            onClick={() => {
              playTapSound();
              setActiveTab('CRYSTALS');
            }}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer ${
              activeTab === 'CRYSTALS'
                ? 'bg-[#140e2e] text-cyan-400 border-t-2 border-cyan-400'
                : 'text-purple-300/70 hover:text-white'
            }`}
          >
            💎 Tinh Thạch Đã Thu Thập
          </button>
          <button
            onClick={() => {
              playTapSound();
              setActiveTab('FORMULAS');
            }}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer ${
              activeTab === 'FORMULAS'
                ? 'bg-[#140e2e] text-cyan-400 border-t-2 border-cyan-400'
                : 'text-purple-300/70 hover:text-white'
            }`}
          >
            📜 Bí Kíp Kiến Thức Chương I
          </button>
          <button
            onClick={() => {
              playTapSound();
              setActiveTab('LORE');
            }}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer ${
              activeTab === 'LORE'
                ? 'bg-[#140e2e] text-cyan-400 border-t-2 border-cyan-400'
                : 'text-purple-300/70 hover:text-white'
            }`}
          >
            🗺️ Truyền Thuyết 5 Đảo
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {activeTab === 'CRYSTALS' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5].map((zId) => {
                const zone = ZONES_METADATA[zId as 1 | 2 | 3 | 4 | 5];
                const isCollected = profile.crystals >= zId;

                return (
                  <div
                    key={zId}
                    className={`p-4 rounded-xl border flex flex-col items-center text-center transition-all ${
                      isCollected
                        ? 'bg-purple-950/40 border-cyan-500/50 shadow-lg shadow-purple-900/30'
                        : 'bg-slate-900/40 border-slate-800 opacity-60'
                    }`}
                  >
                    <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl mb-2 bg-purple-900/50 border border-purple-700/50">
                      {isCollected ? (zId === 5 && profile.hasCrown ? '👑' : '💎') : '🔒'}
                    </div>
                    <h4 className="text-xs font-bold text-white mb-0.5">{zone.crystalName}</h4>
                    <span className="text-[10px] text-purple-300 font-mono mb-2">Vùng {zId}: {zone.name}</span>
                    <p className="text-[11px] text-slate-300 line-clamp-3">
                      {isCollected ? zone.description : 'Hãy vượt qua cả 3 nhiệm vụ tại đảo để giải phóng tinh thạch này!'}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'FORMULAS' && (
            <div className="space-y-4 text-xs text-slate-200">
              <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-800/40">
                <h4 className="text-sm font-bold text-cyan-300 mb-1">
                  1. Số Hữu Tỉ & Số Đối
                </h4>
                <p className="text-slate-300">
                  Số hữu tỉ là số viết được dưới dạng phân số <code className="text-amber-300 font-mono font-bold">a/b</code> với <code className="text-amber-300 font-mono">a, b ∈ ℤ, b ≠ 0</code>.
                </p>
                <p className="mt-1">
                  Số đối của <code className="text-cyan-300 font-mono">a/b</code> là <code className="text-cyan-300 font-mono">-a/b</code>. Hai số đối nhau cách đều điểm 0 trên trục số.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-800/40">
                <h4 className="text-sm font-bold text-emerald-300 mb-1">
                  2. Cộng, Trừ, Nhân, Chia Số Hữu Tỉ
                </h4>
                <ul className="space-y-1 list-disc list-inside text-slate-300">
                  <li><span className="font-semibold text-white">Cộng / Trừ:</span> Quy đồng mẫu số rồi cộng hoặc trừ tử số với nhau.</li>
                  <li><span className="font-semibold text-white">Nhân:</span> Tử nhân với tử, mẫu nhân với mẫu: <code className="font-mono text-amber-300">(a/b) · (c/d) = (a·c)/(b·d)</code>.</li>
                  <li><span className="font-semibold text-white">Chia:</span> Nhân với phân số nghịch đảo: <code className="font-mono text-amber-300">(a/b) : (c/d) = (a/b) · (d/c)</code>.</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-800/40">
                <h4 className="text-sm font-bold text-pink-300 mb-1">
                  3. Quy Tắc Lũy Thừa Quan Trọng
                </h4>
                <ul className="space-y-1 text-slate-300 font-mono">
                  <li>• Nhân cùng cơ số: <span className="text-amber-300">xᵐ · xⁿ = xᵐ⁺ⁿ</span> (cộng số mũ)</li>
                  <li>• Chia cùng cơ số: <span className="text-amber-300">xᵐ : xⁿ = xᵐ⁻ⁿ</span> (trừ số mũ)</li>
                  <li>• Lũy thừa của lũy thừa: <span className="text-amber-300">(xᵐ)ⁿ = xᵐ ˣ ⁿ</span> (nhân số mũ)</li>
                  <li>• Cẩn thận dấu ngoặc: <span className="text-cyan-300">(-3)² = 9</span> (dương), nhưng <span className="text-rose-400">-3² = -9</span> (âm)!</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-800/40">
                <h4 className="text-sm font-bold text-yellow-300 mb-1">
                  4. Tính Hợp Lý (Tính Chất Phân Phối)
                </h4>
                <p className="font-mono text-amber-300">
                  a · b + a · c = a · (b + c)
                </p>
                <p className="mt-1 text-slate-300">
                  Nhóm các phân số có cùng mẫu hoặc thừa số chung để tính nhanh và hạn chế sai sót.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'LORE' && (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((zId) => {
                const zone = ZONES_METADATA[zId as 1 | 2 | 3 | 4 | 5];
                return (
                  <div key={zId} className="p-4 rounded-xl bg-[#1a123a] border border-purple-900/60">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-cyan-400 text-xs">Vùng {zId}:</span>
                      <h4 className="font-display font-bold text-white text-sm">{zone.name}</h4>
                    </div>
                    <p className="text-xs text-purple-200/90 italic mb-2">"{zone.lore}"</p>
                    <p className="text-xs text-slate-300">{zone.description}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
