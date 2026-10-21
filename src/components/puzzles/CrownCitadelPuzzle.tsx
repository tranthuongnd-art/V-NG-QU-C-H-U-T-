import React, { useState, useEffect } from 'react';
import { TaskVariation } from '../../types/game';
import { parseRationalInput, areFractionsEquivalent, formatFractionText, diagnoseRationalError } from '../../utils/mathUtils';
import { playSuccessChime, playErrorBoop, playTapSound, playCrownFanfare } from '../../utils/soundEffects';
import confetti from 'canvas-confetti';

interface CrownCitadelPuzzleProps {
  task: TaskVariation;
  onSuccess: (attemptData: { userAnswer: string; hintCount: number }) => void;
  onFailure: (attemptData: { userAnswer: string; hintCount: number; errorFeedback: string }) => void;
  onExit: () => void;
  lives: number;
}

export const CrownCitadelPuzzle: React.FC<CrownCitadelPuzzleProps> = ({
  task,
  onSuccess,
  onFailure,
  onExit,
  lives,
}) => {
  const [inputVal, setInputVal] = useState<string>('');
  const [hintsRevealed, setHintsRevealed] = useState<number>(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSuccessAnim, setIsSuccessAnim] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Reset state when advancing task
  useEffect(() => {
    setInputVal('');
    setHintsRevealed(0);
    setFeedback(null);
    setIsSuccessAnim(false);
    setIsSubmitting(false);
  }, [task.id]);

  const handleRevealHint = () => {
    if (hintsRevealed < task.hints.length) {
      playTapSound();
      setHintsRevealed((prev) => prev + 1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const handleSubmit = (forcedVal?: string) => {
    if (isSubmitting || isSuccessAnim) return;
    setIsSubmitting(true);
    playTapSound();

    const valToParse = (forcedVal !== undefined ? forcedVal : inputVal).trim();
    const parsed = parseRationalInput(valToParse);
    if (!parsed.isValid || !parsed.fraction) {
      setFeedback(parsed.errorMessage || 'Vui lòng nhập đáp án hợp lệ!');
      playErrorBoop();
      setIsSubmitting(false);
      return;
    }

    let isCorrect = false;
    let expectedFrac = { num: 0, den: 1 };

    if (task.taskIndex === 1) {
      expectedFrac = task.contextData.expectedAnswer || { num: 0, den: 1 };
      isCorrect = areFractionsEquivalent(parsed.fraction, expectedFrac);
    } else if (task.taskIndex === 2) {
      const expRaw = task.contextData.expectedAnswer ?? 1.25;
      const exp = parseRationalInput(expRaw.toString());
      if (exp.fraction) {
        expectedFrac = exp.fraction;
        isCorrect = areFractionsEquivalent(parsed.fraction, expectedFrac);
      }
    } else {
      expectedFrac = task.contextData.expectedAnswer || { num: -1, den: 2 };
      isCorrect = areFractionsEquivalent(parsed.fraction, expectedFrac);
    }

    if (isCorrect) {
      playSuccessChime();
      setIsSuccessAnim(true);

      if (task.taskIndex === 3) {
        // Grand Final Coronation!
        setFeedback('👑 VINH QUANG TỐI THƯỢNG! Phong ấn cuối cùng đã vỡ tan! Vương Miện Số Hữu Tỉ đã thuộc về em!');
        playCrownFanfare();
        try {
          confetti({
            particleCount: 160,
            spread: 100,
            origin: { y: 0.6 },
          });
        } catch (e) {
          // ignore
        }
      } else {
        setFeedback(`✨ Chính xác tuyệt đối! Phong ấn số ${task.taskIndex}/3 đã được hóa giải thành công.`);
      }

      setTimeout(() => {
        onSuccess({ userAnswer: valToParse, hintCount: hintsRevealed });
      }, 1800);
    } else {
      const diag = diagnoseRationalError(parsed.fraction, expectedFrac);
      setFeedback(`❌ Chưa chính xác: ${diag}`);
      playErrorBoop();
      onFailure({
        userAnswer: valToParse,
        hintCount: hintsRevealed,
        errorFeedback: diag,
      });
      setIsSubmitting(false);
    }
  };

  const quickChips =
    task.taskIndex === 1
      ? ['0', '7/11', '1', '5/5']
      : task.taskIndex === 2
      ? ['1.25', '5/4', '1.25°C', '1.5', '-1']
      : ['-1/2', '-0.5', '1/2', '-3/6', '-5/6'];

  return (
    <div className="relative w-full max-w-4xl mx-auto p-4 sm:p-6 bg-[#211606] rounded-2xl border-2 border-amber-600/70 shadow-2xl text-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 sm:pb-4 mb-4 border-b border-amber-800/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl sm:text-3xl">👑</span>
            <h2 className="text-base sm:text-xl md:text-2xl font-black font-display text-amber-100">
              Vùng 5 – Nhiệm vụ {task.taskIndex}/3: {task.title}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-amber-300 font-medium mt-1">{task.skillLabel}</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="text-xs sm:text-sm px-3 py-1.5 rounded-xl bg-red-950/80 border border-red-700 text-red-200 font-mono font-bold flex items-center gap-1 shadow-md">
            <span>{lives}</span>
            <span>❤️</span>
          </div>
          <button
            onClick={() => {
              playTapSound();
              onExit();
            }}
            className="text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition-colors cursor-pointer border border-slate-700 active:scale-95"
          >
            Đảo ‹
          </button>
        </div>
      </div>

      {/* Task Prompt Box */}
      <div className="p-4 sm:p-5 rounded-2xl bg-amber-950/60 border-2 border-amber-700/60 mb-5 shadow-lg">
        <p className="text-xs sm:text-sm md:text-base font-medium text-amber-200">{task.description}</p>
        <p className="text-base sm:text-xl md:text-2xl font-black text-yellow-300 mt-2.5 leading-snug drop-shadow-sm">
          {task.prompt}
        </p>
      </div>

      {/* Visual Citadel Shrine - LARGER CROWN FOR PHONES */}
      <div className="relative p-6 sm:p-8 rounded-2xl bg-[#120a02] border-2 border-amber-900/60 mb-5 overflow-hidden flex flex-col items-center justify-center shadow-inner">
        {/* Floating Altar with the Golden Crown */}
        <div className="relative py-4 sm:py-6 flex flex-col items-center">
          <div className={`transition-all duration-700 ${isSuccessAnim ? 'scale-130' : 'scale-100'} animate-float`}>
            <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-amber-500/15 border-3 border-amber-400/50 flex items-center justify-center shadow-2xl shadow-amber-500/40">
              <span className="text-6xl sm:text-7xl md:text-8xl filter drop-shadow-[0_0_20px_rgba(251,191,36,0.9)]">
                👑
              </span>
            </div>
          </div>

          <div className="mt-4 text-xs sm:text-sm md:text-base font-mono font-bold text-amber-300 text-center">
            {task.taskIndex === 1 && 'Phong Ấn 1/3: Tính Hợp Lý & Phân Phối'}
            {task.taskIndex === 2 && 'Phong Ấn 2/3: Đo Đạc Biến Thiên Thực Tế'}
            {task.taskIndex === 3 && 'Phong Ấn 3/3: Bảo Tọa Vương Miện Tối Cao'}
          </div>
        </div>
      </div>

      {/* Input & Direct Controls */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-xs sm:text-sm md:text-base font-bold text-amber-200 mb-1.5">
            Nhập kết quả (phân số như <code className="text-yellow-300 font-mono font-bold bg-amber-950 px-1.5 py-0.5 rounded">-1/2</code> hoặc số thập phân <code className="text-yellow-300 font-mono font-bold bg-amber-950 px-1.5 py-0.5 rounded">1.25</code>):
          </label>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="VD: 0 hoặc 1.25 hoặc -1/2..."
              className="flex-1 px-4 py-3 sm:py-3.5 bg-amber-950/80 border-2 border-amber-700 rounded-xl text-white font-mono font-bold text-base sm:text-xl focus:outline-none focus:border-yellow-400 shadow-inner"
            />
            <button
              onClick={() => handleSubmit()}
              disabled={isSubmitting || isSuccessAnim}
              className="px-6 sm:px-8 py-3.5 rounded-xl font-black text-base sm:text-lg tracking-wide text-white bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-700 hover:from-amber-500 hover:to-yellow-400 disabled:opacity-50 shadow-xl shadow-amber-950/60 cursor-pointer active:scale-95 transition-all min-h-[48px]"
            >
              {isSuccessAnim ? '✓ Phong Ấn Đã Hóa Giải!' : 'Phá Giải Phong Ấn [Enter]'}
            </button>
          </div>
        </div>

        {/* Quick input chips */}
        <div>
          <span className="text-xs sm:text-sm text-amber-300 font-bold block mb-1.5">Chọn nhanh đáp án gợi ý:</span>
          <div className="flex items-center gap-2 flex-wrap">
            {quickChips.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => {
                  setInputVal(chip);
                  handleSubmit(chip);
                }}
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm md:text-base font-bold rounded-xl bg-amber-900/80 hover:bg-amber-800 text-yellow-200 border-2 border-amber-700 font-mono cursor-pointer transition-all active:scale-95 shadow-sm min-h-[40px]"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-4 rounded-xl mb-4 text-xs sm:text-sm md:text-base font-bold border-2 ${
            feedback.includes('Chính xác') || feedback.includes('VINH QUANG')
              ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
              : 'bg-rose-950/80 border-rose-500 text-rose-200'
          }`}
        >
          {feedback}
        </div>
      )}

      {/* Step-by-Step Hint System */}
      <div className="p-4 rounded-xl bg-amber-950/30 border-2 border-amber-900/60">
        <div className="flex items-center justify-between">
          <span className="text-xs sm:text-sm font-bold text-amber-200 flex items-center gap-1.5">
            💡 Gợi ý tư duy toán học ({hintsRevealed}/{task.hints.length})
          </span>
          {hintsRevealed < task.hints.length && (
            <button
              onClick={handleRevealHint}
              className="text-xs sm:text-sm font-bold text-yellow-300 hover:text-yellow-200 underline cursor-pointer p-1"
            >
              Xem gợi ý bước {hintsRevealed + 1}
            </button>
          )}
        </div>

        {hintsRevealed > 0 && (
          <ul className="mt-2.5 space-y-2 text-xs sm:text-sm md:text-base text-slate-200">
            {task.hints.slice(0, hintsRevealed).map((hint, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-amber-400 font-black">›</span>
                <span className="leading-relaxed">{hint}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
