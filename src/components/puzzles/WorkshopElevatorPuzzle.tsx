import React, { useState, useEffect, useRef } from 'react';
import { TaskVariation } from '../../types/game';
import { parseRationalInput, areFractionsEquivalent, formatFractionText, diagnoseRationalError } from '../../utils/mathUtils';
import { playSuccessChime, playErrorBoop, playTapSound, playStepSound } from '../../utils/soundEffects';

interface WorkshopElevatorPuzzleProps {
  task: TaskVariation;
  onSuccess: (attemptData: { userAnswer: string; hintCount: number }) => void;
  onFailure: (attemptData: { userAnswer: string; hintCount: number; errorFeedback: string }) => void;
  onExit: () => void;
  lives: number;
}

export const WorkshopElevatorPuzzle: React.FC<WorkshopElevatorPuzzleProps> = ({
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

  // For Task 2 elevator mechanical simulation
  const [elevatorClimb, setElevatorClimb] = useState<number>(0);
  const climbTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Reset state when advancing task
  useEffect(() => {
    setInputVal('');
    setHintsRevealed(0);
    setFeedback(null);
    setIsSuccessAnim(false);
    setIsSubmitting(false);
    setElevatorClimb(0);

    return () => {
      if (climbTimerRef.current) {
        clearInterval(climbTimerRef.current);
      }
    };
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
    let expectedFrac = { num: 1, den: 1 };

    if (task.taskIndex === 1) {
      // Mana energy flask: expected 3/2 or 1.5
      expectedFrac = task.contextData.expectedAnswer;
      isCorrect = areFractionsEquivalent(parsed.fraction, expectedFrac);
    } else if (task.taskIndex === 2) {
      // Elevator revolutions: expected 5
      const expectedNum = typeof task.contextData.expectedAnswer === 'number'
        ? task.contextData.expectedAnswer
        : task.contextData.expectedAnswer?.num ?? 5;
      expectedFrac = { num: expectedNum, den: 1 };
      isCorrect = areFractionsEquivalent(parsed.fraction, expectedFrac);
    } else {
      // Inverse division: expected 1
      expectedFrac = task.contextData.expectedAnswer;
      isCorrect = areFractionsEquivalent(parsed.fraction, expectedFrac);
    }

    if (isCorrect) {
      setFeedback('⚙️ Tuyệt đỉnh! Bộ máy xưởng đã hoạt động trơn tru với công suất tối đa!');
      playSuccessChime();
      setIsSuccessAnim(true);

      // Animate elevator or flask filling
      if (task.taskIndex === 2) {
        let step = 0;
        climbTimerRef.current = setInterval(() => {
          if (step <= 5) {
            setElevatorClimb(step);
            playStepSound();
            step++;
          } else {
            if (climbTimerRef.current) {
              clearInterval(climbTimerRef.current);
            }
            setTimeout(() => {
              onSuccess({ userAnswer: valToParse, hintCount: hintsRevealed });
            }, 800);
          }
        }, 250);
      } else {
        setTimeout(() => {
          onSuccess({ userAnswer: valToParse, hintCount: hintsRevealed });
        }, 1500);
      }
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
      ? ['3/2', '1.5', '1', '1/2', '-3/2']
      : task.taskIndex === 2
      ? ['5', '4', '6', '5 nhịp', '3']
      : ['1', '-1', '9/25', '25/9', '0'];

  return (
    <div className="relative w-full max-w-4xl mx-auto p-4 sm:p-6 bg-[#0a1a2e] rounded-2xl border-2 border-sky-700/60 shadow-2xl text-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 sm:pb-4 mb-4 border-b border-sky-800/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl sm:text-3xl">⚙️</span>
            <h2 className="text-base sm:text-xl md:text-2xl font-black font-display text-sky-100">
              Vùng 3 – Nhiệm vụ {task.taskIndex}/3: {task.title}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-sky-300 font-medium mt-1">{task.skillLabel}</p>
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
      <div className="p-4 sm:p-5 rounded-2xl bg-sky-950/60 border-2 border-sky-700/60 mb-5 shadow-lg">
        <p className="text-xs sm:text-sm md:text-base font-medium text-sky-200">{task.description}</p>
        <p className="text-base sm:text-xl md:text-2xl font-black text-amber-300 mt-2.5 leading-snug drop-shadow-sm">
          {task.prompt}
        </p>
      </div>

      {/* Interactive Visual Mechanism - LARGER FOR PHONES */}
      <div className="relative p-4 sm:p-6 rounded-2xl bg-[#040e1a] border-2 border-sky-800/50 mb-5 overflow-hidden shadow-inner">
        {task.taskIndex === 1 && (
          /* Visual Energy Flask Simulation */
          <div className="flex flex-col md:flex-row items-center justify-around gap-6 py-4">
            <div className="flex flex-col items-center">
              <span className="text-xs sm:text-sm font-bold text-sky-300 mb-2 font-mono">Bình Năng Lượng Thủy Ngân</span>
              {/* Glass Tube Flask */}
              <div className="relative w-32 sm:w-36 h-60 sm:h-64 rounded-full bg-slate-900/90 border-4 border-sky-500/60 overflow-hidden flex flex-col justify-end p-1.5 shadow-2xl">
                {/* Level Markings */}
                <div className="absolute inset-y-0 right-3 flex flex-col justify-between py-4 text-xs sm:text-sm font-mono font-bold text-sky-300 pointer-events-none">
                  <span>+1.0 (Đích)</span>
                  <span>+0.5</span>
                  <span>0.0</span>
                  <span>-0.5 (Hiện tại)</span>
                  <span>-1.0</span>
                </div>

                {/* Fluid Liquid inside flask */}
                <div
                  className={`w-full rounded-b-full transition-all duration-700 ${
                    isSuccessAnim
                      ? 'h-[85%] bg-gradient-to-t from-cyan-500 via-amber-400 to-yellow-300'
                      : 'h-[30%] bg-gradient-to-t from-sky-700 to-cyan-500 opacity-90'
                  }`}
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 max-w-sm text-xs sm:text-sm text-sky-200">
              <div className="p-4 rounded-xl bg-sky-900/50 border-2 border-sky-600/50 shadow-md">
                <span className="font-bold text-amber-300 text-sm sm:text-base">Phương trình năng lượng:</span>
                <p className="font-math mt-1.5 text-xl sm:text-2xl font-black text-cyan-300">(-1/2) + x = 1</p>
                <p className="mt-2 text-slate-200 leading-relaxed font-medium">
                  Cần tìm số hạng <span className="font-mono font-black text-amber-300 text-base">x</span> để đưa mực dung dịch từ mức âm (-1/2) vọt lên đỉnh chuẩn +1.
                </p>
              </div>
            </div>
          </div>
        )}

        {task.taskIndex === 2 && (
          /* Visual Gear Elevator Simulation */
          <div className="flex flex-col md:flex-row items-center justify-around gap-6 py-4">
            <div className="relative w-44 sm:w-48 h-64 sm:h-72 bg-slate-900/90 rounded-2xl border-2 border-sky-500 p-2 flex flex-col justify-between overflow-hidden shadow-2xl">
              {/* Shaft marks */}
              <div className="absolute inset-y-0 right-3 flex flex-col justify-between py-3 text-xs sm:text-sm font-mono font-bold text-sky-300 pointer-events-none">
                <span>+1/2 (Đích)</span>
                <span>+1/4</span>
                <span>0</span>
                <span>-1/4</span>
                <span>-2/4</span>
                <span>-3/4 (Bắt đầu)</span>
              </div>

              {/* Guide rails */}
              <div className="absolute left-8 inset-y-0 w-1.5 bg-slate-700" />
              <div className="absolute left-18 inset-y-0 w-1.5 bg-slate-700" />

              {/* Elevator Carriage */}
              <div
                className="absolute left-4 w-24 h-12 bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 border-2 border-amber-200 rounded-xl shadow-xl flex items-center justify-center text-xs sm:text-sm font-black text-slate-950 transition-all duration-300"
                style={{
                  bottom: `${14 + (elevatorClimb / 5) * 195}px`,
                }}
              >
                🛗 Thang
              </div>
            </div>

            <div className="flex flex-col gap-3 max-w-sm text-xs sm:text-sm text-sky-200">
              <div className="p-4 rounded-xl bg-sky-900/50 border-2 border-sky-600/50 shadow-md">
                <span className="font-bold text-amber-300 text-sm sm:text-base">Hệ truyền động trục xoay:</span>
                <p className="font-math mt-1 text-sm sm:text-base">
                  Vị trí đầu: <span className="text-rose-300 font-bold">-3/4</span> → Đích: <span className="text-emerald-300 font-bold">+1/2</span>
                </p>
                <p className="mt-2 text-slate-200 leading-relaxed font-medium">
                  Mỗi nhịp bánh răng nâng thang lên <span className="font-mono font-bold text-cyan-300">1/4</span> đơn vị. Khoảng cách cần đi: 1/2 - (-3/4) = 5/4 đơn vị.
                </p>
              </div>
            </div>
          </div>
        )}

        {task.taskIndex === 3 && (
          /* Visual Fraction Gears Multiplication Simulation */
          <div className="flex flex-col items-center justify-center py-6 gap-5">
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-dashed border-sky-400 animate-spin flex items-center justify-center bg-sky-950 font-math text-base sm:text-xl font-black text-white shadow-lg">
                -3/5
              </div>
              <span className="text-3xl sm:text-4xl font-black text-amber-400">÷</span>
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-dashed border-amber-400 animate-spin flex items-center justify-center bg-amber-950 font-math text-base sm:text-xl font-black text-white shadow-lg">
                -6/10
              </div>
              <span className="text-3xl sm:text-4xl font-black text-white">=</span>
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-3 border-emerald-400 flex items-center justify-center bg-emerald-950/80 font-math text-2xl sm:text-3xl font-black text-emerald-300 shadow-xl">
                {isSuccessAnim ? '1' : '?'}
              </div>
            </div>
            <p className="text-xs sm:text-sm text-sky-300 font-mono font-bold mt-2">
              💡 Chia cho phân số là nhân với phân số nghịch đảo!
            </p>
          </div>
        )}
      </div>

      {/* Input & Direct Controls */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-xs sm:text-sm md:text-base font-bold text-sky-200 mb-1.5">
            Nhập kết quả (chấp nhận phân số <code className="text-amber-300 font-mono font-bold bg-sky-950 px-1.5 py-0.5 rounded">3/2</code>, số thập phân <code className="text-amber-300 font-mono font-bold bg-sky-950 px-1.5 py-0.5 rounded">1.5</code>, số nguyên):
          </label>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="VD: 3/2 hoặc 1.5 hoặc 5..."
              className="flex-1 px-4 py-3 sm:py-3.5 bg-sky-950/80 border-2 border-sky-600 rounded-xl text-white font-mono font-bold text-base sm:text-xl focus:outline-none focus:border-cyan-400 shadow-inner"
            />
            <button
              onClick={() => handleSubmit()}
              disabled={isSubmitting || isSuccessAnim}
              className="px-6 sm:px-8 py-3.5 rounded-xl font-black text-base sm:text-lg tracking-wide text-white bg-gradient-to-r from-sky-600 to-amber-600 hover:from-sky-500 hover:to-amber-500 disabled:opacity-50 shadow-xl shadow-sky-950/60 cursor-pointer active:scale-95 transition-all min-h-[48px]"
            >
              {isSuccessAnim ? '✓ Động Cơ Hoạt Động!' : 'Kích Hoạt Cỗ Máy [Enter]'}
            </button>
          </div>
        </div>

        {/* Quick input chips */}
        <div>
          <span className="text-xs sm:text-sm text-sky-300 font-bold block mb-1.5">Chọn nhanh đáp án gợi ý:</span>
          <div className="flex items-center gap-2 flex-wrap">
            {quickChips.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => {
                  setInputVal(chip);
                  handleSubmit(chip);
                }}
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm md:text-base font-bold rounded-xl bg-sky-900/80 hover:bg-sky-700 text-sky-100 border-2 border-sky-600 font-mono cursor-pointer transition-all active:scale-95 shadow-sm min-h-[40px]"
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
            feedback.includes('Tuyệt đỉnh')
              ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
              : 'bg-rose-950/80 border-rose-500 text-rose-200'
          }`}
        >
          {feedback}
        </div>
      )}

      {/* Step-by-Step Hint System */}
      <div className="p-4 rounded-xl bg-sky-950/30 border-2 border-sky-900/60">
        <div className="flex items-center justify-between">
          <span className="text-xs sm:text-sm font-bold text-sky-200 flex items-center gap-1.5">
            💡 Gợi ý quy tắc tính toán ({hintsRevealed}/{task.hints.length})
          </span>
          {hintsRevealed < task.hints.length && (
            <button
              onClick={handleRevealHint}
              className="text-xs sm:text-sm font-bold text-sky-300 hover:text-sky-200 underline cursor-pointer p-1"
            >
              Xem gợi ý bước {hintsRevealed + 1}
            </button>
          )}
        </div>

        {hintsRevealed > 0 && (
          <ul className="mt-2.5 space-y-2 text-xs sm:text-sm md:text-base text-slate-200">
            {task.hints.slice(0, hintsRevealed).map((hint, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-sky-400 font-black">›</span>
                <span className="leading-relaxed">{hint}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
