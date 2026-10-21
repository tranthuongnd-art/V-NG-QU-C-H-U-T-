import React, { useState, useEffect } from 'react';
import { TaskVariation } from '../../types/game';
import { playSuccessChime, playErrorBoop, playTapSound } from '../../utils/soundEffects';

interface TowerPowerPuzzleProps {
  task: TaskVariation;
  onSuccess: (attemptData: { userAnswer: string; hintCount: number }) => void;
  onFailure: (attemptData: { userAnswer: string; hintCount: number; errorFeedback: string }) => void;
  onExit: () => void;
  lives: number;
}

export const TowerPowerPuzzle: React.FC<TowerPowerPuzzleProps> = ({
  task,
  onSuccess,
  onFailure,
  onExit,
  lives,
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [inputVal, setInputVal] = useState<string>('');
  const [hintsRevealed, setHintsRevealed] = useState<number>(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSuccessAnim, setIsSuccessAnim] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Reset state when advancing task
  useEffect(() => {
    setSelectedAnswer('');
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

  const handleSubmit = (forcedAnswer?: string) => {
    if (isSubmitting || isSuccessAnim) return;
    setIsSubmitting(true);
    playTapSound();

    const answerToTest = (forcedAnswer || selectedAnswer || inputVal.trim())
      .replace(/^[nNmM]\s*=\s*/, '') // Strip "n =", "n="
      .trim();

    if (!answerToTest) {
      setFeedback('Vui lòng chọn hoặc nhập đáp án!');
      playErrorBoop();
      setIsSubmitting(false);
      return;
    }

    let isCorrect = false;
    let errorDetail = '';

    // Extract first integer from string if any
    const matchNum = answerToTest.match(/-?\d+/);
    const parsedNum = matchNum ? parseInt(matchNum[0], 10) : NaN;

    if (task.taskIndex === 1) {
      // (-2)^3 * (-2)^2 = (-2)^n => expectedN = 5
      const expectedN = task.contextData.expectedN ?? 5;
      if (parsedNum === expectedN) {
        isCorrect = true;
      } else if (parsedNum === 6) {
        errorDetail = 'Em đã nhân hai số mũ (3 × 2 = 6) thay vì cộng! Khi nhân hai lũy thừa cùng cơ số: xᵐ × xⁿ = xᵐ⁺ⁿ.';
      } else {
        errorDetail = `Số mũ ${answerToTest} chưa đúng. Khi nhân hai lũy thừa cùng cơ số, giữ nguyên cơ số và CỘNG các số mũ: n = 3 + 2 = 5.`;
      }
    } else if (task.taskIndex === 2) {
      // Dual locks: A = (-3)^2 = 9, B = -3^2 = -9
      const expectedOpt = (task.contextData.expectedOption || 'A').toUpperCase();
      const userUpper = answerToTest.toUpperCase();
      if (userUpper === expectedOpt || answerToTest.includes('(-3)')) {
        isCorrect = true;
      } else {
        errorDetail = 'Em chọn sai khóa! Biểu thức -3² không có ngoặc nghĩa là -(3²) = -9. Chỉ có (-3)² có dấu ngoặc mới mang ý nghĩa (-3) × (-3) = +9!';
      }
    } else {
      // [(-1/2)^2]^3 = (-1/2)^n => expectedN = 6
      const expectedN = task.contextData.expectedN ?? 6;
      if (parsedNum === expectedN) {
        isCorrect = true;
      } else if (parsedNum === 5) {
        errorDetail = 'Em đã cộng hai số mũ (2 + 3 = 5)! Đây là lũy thừa của lũy thừa, quy tắc là NHÂN hai số mũ: (xᵐ)ⁿ = xᵐ ˣ ⁿ (2 × 3 = 6).';
      } else {
        errorDetail = `Số mũ ${answerToTest} chưa đúng. Quy tắc lũy thừa của lũy thừa: n = 2 × 3 = 6.`;
      }
    }

    if (isCorrect) {
      setFeedback('⚡ Xuất sắc! Nguồn năng lượng sấm sét đã kích hoạt toàn bộ tháp lũy thừa!');
      playSuccessChime();
      setIsSuccessAnim(true);
      setTimeout(() => {
        onSuccess({ userAnswer: answerToTest, hintCount: hintsRevealed });
      }, 1500);
    } else {
      setFeedback(`❌ ${errorDetail}`);
      playErrorBoop();
      onFailure({
        userAnswer: answerToTest,
        hintCount: hintsRevealed,
        errorFeedback: errorDetail,
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto p-4 sm:p-6 bg-[#130f30] rounded-2xl border-2 border-indigo-700/60 shadow-2xl text-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 sm:pb-4 mb-4 border-b border-indigo-800/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl sm:text-3xl">⚡</span>
            <h2 className="text-base sm:text-xl md:text-2xl font-black font-display text-indigo-100">
              Vùng 4 – Nhiệm vụ {task.taskIndex}/3: {task.title}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-indigo-300 font-medium mt-1">{task.skillLabel}</p>
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
      <div className="p-4 sm:p-5 rounded-2xl bg-indigo-950/60 border-2 border-indigo-700/60 mb-5 shadow-lg">
        <p className="text-xs sm:text-sm md:text-base font-medium text-indigo-200">{task.description}</p>
        <p className="text-base sm:text-xl md:text-2xl font-black text-amber-300 mt-2.5 leading-snug drop-shadow-sm">
          {task.prompt}
        </p>
      </div>

      {/* Visual Energy Core Mechanism - BIG POWER FORMULAS */}
      <div className="relative p-4 sm:p-6 rounded-2xl bg-[#09061c] border-2 border-indigo-800/50 mb-5 overflow-hidden shadow-inner">
        {task.taskIndex === 1 && (
          <div className="flex flex-col items-center justify-center py-6 sm:py-8 gap-6 sm:gap-8">
            <div className="flex items-center gap-3 sm:gap-5 flex-wrap justify-center">
              <div className="p-4 sm:p-5 rounded-2xl bg-indigo-950 border-3 border-indigo-400 font-math text-2xl sm:text-3xl md:text-4xl font-black text-white shadow-xl shadow-indigo-500/20">
                (-2)³
              </div>
              <span className="text-3xl sm:text-4xl font-black text-pink-400">×</span>
              <div className="p-4 sm:p-5 rounded-2xl bg-indigo-950 border-3 border-indigo-400 font-math text-2xl sm:text-3xl md:text-4xl font-black text-white shadow-xl shadow-indigo-500/20">
                (-2)²
              </div>
              <span className="text-3xl sm:text-4xl font-black text-white">=</span>
              <div className="p-4 sm:p-5 rounded-2xl bg-purple-950/90 border-3 border-pink-400 font-math text-2xl sm:text-3xl md:text-4xl font-black text-white flex items-center shadow-xl">
                (-2)<sup className="text-amber-400 text-3xl sm:text-4xl md:text-5xl font-black ml-1">{isSuccessAnim ? '5' : (inputVal || 'n')}</sup>
              </div>
            </div>

            <div>
              <span className="text-xs sm:text-sm text-indigo-300 font-bold block text-center mb-2">Nhấp chọn nhanh số mũ n:</span>
              <div className="flex items-center justify-center gap-3 sm:gap-4">
                {[4, 5, 6].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      setInputVal(opt.toString());
                      handleSubmit(opt.toString());
                    }}
                    className="px-6 sm:px-8 py-3.5 rounded-2xl font-math font-black text-lg sm:text-xl md:text-2xl bg-indigo-900/80 hover:bg-indigo-600 border-2 border-indigo-400 text-white cursor-pointer transition-all active:scale-95 shadow-lg min-h-[48px]"
                  >
                    n = {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {task.taskIndex === 2 && (
          <div className="flex flex-col items-center justify-center py-6 sm:py-8 gap-6">
            <span className="text-xs sm:text-sm font-bold text-indigo-200 font-mono text-center">
              ⚡ Khóa Năng Lượng: Biểu thức nào có kết quả chính xác bằng +9?
            </span>

            {/* DUAL LOCKS A & B - HUGE TOUCH BUTTONS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 w-full max-w-xl">
              {/* Option A */}
              <button
                type="button"
                onClick={() => {
                  setSelectedAnswer('A');
                  handleSubmit('A');
                }}
                className={`p-6 sm:p-8 rounded-2xl border-3 transition-all cursor-pointer flex flex-col items-center gap-3 active:scale-95 ${
                  selectedAnswer === 'A'
                    ? 'border-cyan-400 bg-cyan-950/80 shadow-2xl shadow-cyan-500/40 ring-4 ring-cyan-400/50 scale-102'
                    : 'border-indigo-600/80 bg-indigo-950/50 hover:bg-indigo-900/60 shadow-lg'
                }`}
              >
                <div className="w-14 h-14 rounded-full bg-indigo-800 border-2 border-indigo-400 flex items-center justify-center text-2xl font-black text-amber-300 shadow-md">
                  A
                </div>
                <span className="text-3xl sm:text-4xl md:text-5xl font-math font-black text-white tracking-wide">
                  (-3)²
                </span>
                <span className="text-xs sm:text-sm font-bold text-cyan-200 bg-indigo-950/90 px-3 py-1 rounded-lg border border-indigo-600/60 text-center">
                  Có ngoặc: (-3) × (-3)
                </span>
              </button>

              {/* Option B */}
              <button
                type="button"
                onClick={() => {
                  setSelectedAnswer('B');
                  handleSubmit('B');
                }}
                className={`p-6 sm:p-8 rounded-2xl border-3 transition-all cursor-pointer flex flex-col items-center gap-3 active:scale-95 ${
                  selectedAnswer === 'B'
                    ? 'border-cyan-400 bg-cyan-950/80 shadow-2xl shadow-cyan-500/40 ring-4 ring-cyan-400/50 scale-102'
                    : 'border-indigo-600/80 bg-indigo-950/50 hover:bg-indigo-900/60 shadow-lg'
                }`}
              >
                <div className="w-14 h-14 rounded-full bg-indigo-800 border-2 border-indigo-400 flex items-center justify-center text-2xl font-black text-amber-300 shadow-md">
                  B
                </div>
                <span className="text-3xl sm:text-4xl md:text-5xl font-math font-black text-white tracking-wide">
                  -3²
                </span>
                <span className="text-xs sm:text-sm font-bold text-pink-200 bg-indigo-950/90 px-3 py-1 rounded-lg border border-indigo-600/60 text-center">
                  Không ngoặc: -(3 × 3)
                </span>
              </button>
            </div>
          </div>
        )}

        {task.taskIndex === 3 && (
          <div className="flex flex-col items-center justify-center py-6 sm:py-8 gap-6 sm:gap-8">
            <div className="flex items-center gap-3 sm:gap-5 flex-wrap justify-center">
              <div className="p-4 sm:p-5 rounded-2xl bg-indigo-950 border-3 border-indigo-400 font-math text-2xl sm:text-3xl md:text-4xl font-black text-white shadow-xl shadow-indigo-500/20">
                [(-1/2)²]³
              </div>
              <span className="text-3xl sm:text-4xl font-black text-white">=</span>
              <div className="p-4 sm:p-5 rounded-2xl bg-purple-950/90 border-3 border-pink-400 font-math text-2xl sm:text-3xl md:text-4xl font-black text-white flex items-center shadow-xl">
                (-1/2)<sup className="text-amber-400 text-3xl sm:text-4xl md:text-5xl font-black ml-1">{isSuccessAnim ? '6' : (inputVal || 'n')}</sup>
              </div>
            </div>

            <div>
              <span className="text-xs sm:text-sm text-indigo-300 font-bold block text-center mb-2">Nhấp chọn giá trị n:</span>
              <div className="flex items-center justify-center gap-3 sm:gap-4">
                {[5, 6, 8].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      setInputVal(opt.toString());
                      handleSubmit(opt.toString());
                    }}
                    className="px-6 sm:px-8 py-3.5 rounded-2xl font-math font-black text-lg sm:text-xl md:text-2xl bg-indigo-900/80 hover:bg-indigo-600 border-2 border-indigo-400 text-white cursor-pointer transition-all active:scale-95 shadow-lg min-h-[48px]"
                  >
                    n = {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Direct Input fallback for Task 1 & 3 */}
      {task.taskIndex !== 2 && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm md:text-base font-bold text-indigo-200">Hoặc tự gõ n:</span>
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="VD: 5"
              className="w-28 sm:w-32 px-4 py-2.5 sm:py-3 bg-indigo-950/90 border-2 border-indigo-600 rounded-xl text-white font-mono font-black text-lg text-center focus:outline-none focus:border-cyan-400 shadow-inner"
            />
          </div>

          <button
            onClick={() => handleSubmit()}
            disabled={isSubmitting || isSuccessAnim}
            className="px-6 sm:px-8 py-3.5 rounded-xl font-black text-base sm:text-lg tracking-wide text-white bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 disabled:opacity-50 shadow-xl shadow-indigo-950/60 cursor-pointer active:scale-95 transition-all min-h-[48px]"
          >
            {isSuccessAnim ? '✓ Đã Mở Khóa!' : 'Xác Nhận Số Mũ [Enter]'}
          </button>
        </div>
      )}

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-4 rounded-xl mb-4 text-xs sm:text-sm md:text-base font-bold border-2 ${
            feedback.includes('Xuất sắc')
              ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
              : 'bg-rose-950/80 border-rose-500 text-rose-200'
          }`}
        >
          {feedback}
        </div>
      )}

      {/* Step-by-Step Hint System */}
      <div className="p-4 rounded-xl bg-indigo-950/30 border-2 border-indigo-900/60">
        <div className="flex items-center justify-between">
          <span className="text-xs sm:text-sm font-bold text-indigo-200 flex items-center gap-1.5">
            💡 Gợi ý quy tắc lũy thừa ({hintsRevealed}/{task.hints.length})
          </span>
          {hintsRevealed < task.hints.length && (
            <button
              onClick={handleRevealHint}
              className="text-xs sm:text-sm font-bold text-pink-300 hover:text-pink-200 underline cursor-pointer p-1"
            >
              Xem gợi ý bước {hintsRevealed + 1}
            </button>
          )}
        </div>

        {hintsRevealed > 0 && (
          <ul className="mt-2.5 space-y-2 text-xs sm:text-sm md:text-base text-slate-200">
            {task.hints.slice(0, hintsRevealed).map((hint, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-pink-400 font-black">›</span>
                <span className="leading-relaxed">{hint}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
