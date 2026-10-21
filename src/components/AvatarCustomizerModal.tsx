import React, { useState, useEffect } from 'react';
import { StudentProfile } from '../types/game';
import { soundManager, playTapSound } from '../utils/soundEffects';

interface AvatarCustomizerModalProps {
  profile: StudentProfile;
  onUpdateProfile: (updated: Partial<StudentProfile>) => void;
  onClose: () => void;
}

const COLOR_OPTIONS = [
  { label: 'Ngọc Lam Biển', hex: '#06b6d4' },
  { label: 'Thạch Anh Tím', hex: '#8b5cf6' },
  { label: 'Hổ Phách Vàng', hex: '#f59e0b' },
  { label: 'Lục Bảo Rừng', hex: '#10b981' },
  { label: 'Hồng Ngọc Đỏ', hex: '#f43f5e' },
  { label: 'Xanh Vũ Trụ', hex: '#3b82f6' },
];

export const AvatarCustomizerModal: React.FC<AvatarCustomizerModalProps> = ({
  profile,
  onUpdateProfile,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'AVATAR' | 'SOUND'>('AVATAR');
  const [nickname, setNickname] = useState<string>(profile.nickname || 'Hiệp Sĩ Số Học');
  const [selectedColor, setSelectedColor] = useState<string>(profile.avatarColor || '#06b6d4');

  // Audio settings from SoundManager
  const [audioSettings, setAudioSettings] = useState(() => soundManager.getSettings());

  useEffect(() => {
    const unsubscribe = soundManager.subscribe((settings) => {
      setAudioSettings({ ...settings });
    });
    return unsubscribe;
  }, []);

  const handleToggleBgm = () => {
    soundManager.toggleBGM();
    setAudioSettings(soundManager.getSettings());
  };

  const handleToggleSfx = () => {
    soundManager.toggleSFX();
    setAudioSettings(soundManager.getSettings());
  };

  const handleBgmVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    soundManager.setBGMVolume(val);
    setAudioSettings(soundManager.getSettings());
  };

  const handleSfxVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    soundManager.setSFXVolume(val);
    setAudioSettings(soundManager.getSettings());
  };

  const handleSave = () => {
    playTapSound();
    onUpdateProfile({
      nickname: nickname.trim() || 'Hiệp Sĩ Số Học',
      avatarColor: selectedColor,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg p-6 bg-[#161033] rounded-2xl border border-purple-800/60 shadow-2xl text-slate-100 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-purple-900/60">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚙️</span>
            <h2 className="text-base font-bold font-display text-purple-200">
              Cài Đặt & Quản Lý Âm Thanh
            </h2>
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

        {/* Tab switcher */}
        <div className="flex items-center gap-2 mb-4 bg-purple-950/40 p-1 rounded-xl border border-purple-900/50">
          <button
            type="button"
            onClick={() => {
              playTapSound();
              setActiveTab('AVATAR');
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'AVATAR'
                ? 'bg-purple-800 text-white shadow-sm'
                : 'text-purple-300/70 hover:text-white'
            }`}
          >
            🎨 Nhân Vật & Tên
          </button>
          <button
            type="button"
            onClick={() => {
              playTapSound();
              setActiveTab('SOUND');
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'SOUND'
                ? 'bg-cyan-700 text-white shadow-sm'
                : 'text-purple-300/70 hover:text-white'
            }`}
          >
            🎵 Âm Thanh & Nhạc Nền
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto pr-1">
          {activeTab === 'AVATAR' && (
            <div>
              {/* 2.5D Avatar Live Preview */}
              <div className="flex flex-col items-center justify-center p-5 bg-[#0c0822] rounded-xl border border-purple-900/40 mb-4">
                <div className="relative flex flex-col items-center animate-float">
                  {profile.hasCrown && (
                    <span className="text-xl -mb-1 filter drop-shadow">👑</span>
                  )}
                  {/* Cube Head */}
                  <div className="w-10 h-10 bg-yellow-300 rounded border-2 border-slate-900 flex flex-col items-center justify-center relative shadow-md">
                    <div className="flex gap-2 mb-1">
                      <div className="w-1.5 h-1.5 bg-slate-900 rounded-full" />
                      <div className="w-1.5 h-1.5 bg-slate-900 rounded-full" />
                    </div>
                    <div className="w-3 h-0.5 bg-slate-900 rounded-full" />
                  </div>

                  {/* Cube Body with selected color */}
                  <div
                    className="w-12 h-10 rounded border-2 border-slate-900 shadow-md -mt-0.5 flex items-center justify-center"
                    style={{ backgroundColor: selectedColor }}
                  >
                    <span className="text-[10px] font-mono text-white/90">7</span>
                  </div>

                  {/* Legs */}
                  <div className="flex gap-1.5 -mt-0.5">
                    <div className="w-4 h-6 bg-slate-800 border-x border-b border-slate-950 rounded-b-sm" />
                    <div className="w-4 h-6 bg-slate-800 border-x border-b border-slate-950 rounded-b-sm" />
                  </div>
                </div>

                <span className="mt-3 text-xs font-bold font-display text-white">
                  {nickname || 'Hiệp Sĩ Số Học'}
                </span>
                <span className="text-[10px] text-purple-400/80 font-mono">Mã HS: {profile.studentCode}</span>
              </div>

              {/* Nickname Input */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-purple-300 mb-1">
                  Biệt danh trong game:
                </label>
                <input
                  type="text"
                  value={nickname}
                  maxLength={20}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Nhập tên gọi..."
                  className="w-full px-3 py-2 bg-purple-950/70 border border-purple-700/60 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Color Palette Selector */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-purple-300 mb-2">
                  Màu áo hiệp sĩ:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => {
                        playTapSound();
                        setSelectedColor(c.hex);
                      }}
                      className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                        selectedColor === c.hex
                          ? 'border-cyan-400 bg-cyan-950/40 text-cyan-200 shadow-sm'
                          : 'border-purple-900/60 bg-purple-950/30 text-slate-300 hover:bg-purple-900/40'
                      }`}
                    >
                      <div
                        className="w-4 h-4 rounded-full border border-black/30 shadow-inner"
                        style={{ backgroundColor: c.hex }}
                      />
                      <span className="truncate text-[11px]">{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'SOUND' && (
            <div className="space-y-4">
              {/* SoundManager BGM section */}
              <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-900/60">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                      🌌 Nhạc Nền Không Gian Kỳ Ảo (BGM)
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Hòa thanh vũ trụ êm dịu tổng hợp qua Web Audio, giúp tập trung giải toán.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleBgm}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                      audioSettings.bgmEnabled
                        ? 'bg-cyan-600 hover:bg-cyan-500 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {audioSettings.bgmEnabled ? '🔊 ĐANG BẬT' : '🔇 ĐANG TẮT'}
                  </button>
                </div>

                {/* BGM Volume Slider */}
                <div className="mt-3">
                  <div className="flex justify-between text-[11px] text-purple-300 mb-1">
                    <span>Âm lượng nhạc nền</span>
                    <span className="font-mono">{Math.round(audioSettings.bgmVolume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    disabled={!audioSettings.bgmEnabled}
                    value={audioSettings.bgmVolume}
                    onChange={handleBgmVolumeChange}
                    className="w-full accent-cyan-400 h-1.5 bg-purple-950 rounded-lg cursor-pointer disabled:opacity-40"
                  />
                </div>
              </div>

              {/* SoundManager SFX section */}
              <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-900/60">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      ⚡ Hiệu Ứng Âm Thanh Tương Tác (SFX)
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Âm thanh phản hồi khi trả lời đúng, sai, nạp năng lượng và nhận thưởng.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleSfx}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                      audioSettings.sfxEnabled
                        ? 'bg-amber-600 hover:bg-amber-500 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {audioSettings.sfxEnabled ? '🔊 ĐANG BẬT' : '🔇 ĐANG TẮT'}
                  </button>
                </div>

                {/* SFX Volume Slider */}
                <div className="mt-3">
                  <div className="flex justify-between text-[11px] text-amber-300 mb-1">
                    <span>Âm lượng hiệu ứng</span>
                    <span className="font-mono">{Math.round(audioSettings.sfxVolume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    disabled={!audioSettings.sfxEnabled}
                    value={audioSettings.sfxVolume}
                    onChange={handleSfxVolumeChange}
                    className="w-full accent-amber-400 h-1.5 bg-purple-950 rounded-lg cursor-pointer disabled:opacity-40"
                  />
                </div>

                {/* Test SFX buttons */}
                <div className="mt-3 pt-3 border-t border-purple-900/40">
                  <span className="text-[10px] text-slate-400 block mb-2">Thử nghiệm âm thanh tương tác:</span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => soundManager.playCorrect()}
                      className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-700/60 hover:bg-emerald-900/60 cursor-pointer"
                    >
                      ✓ Thử âm ĐÚNG
                    </button>
                    <button
                      type="button"
                      onClick={() => soundManager.playWrong()}
                      className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-rose-950 text-rose-300 border border-rose-700/60 hover:bg-rose-900/60 cursor-pointer"
                    >
                      ✗ Thử âm SAI
                    </button>
                    <button
                      type="button"
                      onClick={() => soundManager.playReward()}
                      className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-700/60 hover:bg-cyan-900/60 cursor-pointer"
                    >
                      💎 Thử NHẬN THƯỞNG
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer save button */}
        <div className="flex justify-end gap-2 pt-3 mt-2 border-t border-purple-900/50">
          <button
            onClick={() => {
              playTapSound();
              onClose();
            }}
            className="px-4 py-2 text-xs rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
          >
            Đóng
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white shadow-lg shadow-purple-950/50 cursor-pointer"
          >
            Lưu Cài Đặt
          </button>
        </div>
      </div>
    </div>
  );
};
