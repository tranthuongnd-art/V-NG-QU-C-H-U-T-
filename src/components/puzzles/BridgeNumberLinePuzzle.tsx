import React, { useState, useEffect } from 'react';
import { TaskVariation } from '../../types/game';
import { parseRationalInput, areFractionsEquivalent, formatFractionText, diagnoseRationalError } from '../../utils/mathUtils';
import { playSuccessChime, playErrorBoop, playTapSound, playStepSound } from '../../utils/soundEffects';

interface BridgeNumberLinePuzzleProps {
  task: TaskVariation;
  onSuccess: (attemptData: { userAnswer: string; hintCount: number }) => void;
  onFailure: (attemptData: { userAnswer: string; hintCount: number; errorFeedback: string }) => void;
  onExit: () => void;
  lives: number;
}

export const BridgeNumberLinePuzzle: React.FC<BridgeNumberLinePuzzleProps> = ({
  task,
  onSuccess,
  onFailure,
  onExit,
  lives,
}) => {
  const [selectedX, setSelectedX] = useState<number>(0);
  const [inputVal, setInputVal] = useState<string>('0');
  const [hintsRevealed, setHintsRevealed] = useState<number>(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSuccessAnim, setIsSuccessAnim] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Reset state when advancing task
  useEffect(() => {
    setSelectedX(0);
    setInputVal('0');
    setHintsRevealed(0);
    setFeedback(null);
    setIsSuccessAnim(false);
    setIsSubmitting(false);
  }, [task.id]);

  const minScale = task.contextData.minScale ?? -2;
  const maxScale = task.contextData.maxScale ?? 2.5;
  const step = task.contextData.step ?? 0.25;

  // Sync slider change with input field
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setSelectedX(val);

    const fracMap: Record<number, string> = {
      '-2': '-2',
      '-1.75': '-7/4',
      '-1.5': '-3/2',
      '-1.25': '-5/4',
      '-1': '-1',
      '-0.75': '-3/4',
      '-0.5': '-1/2',
      '-0.25': '-1/4',
      '0': '0',
      '0.25': '1/4',
      '0.5': '1/2',
      '0.75': '3/4',
      '1': '1',
      '1.25': '5/4',
      '1.5': '3/2',
      '1.75': '7/4',
      '2': '2',
      '2.25': '9/4',
      '2.5': '5/2',
    };

    const key = Math.round(val * 100) / 100;
    if (fracMap[key] !== undefined) {
      setInputVal(fracMap[key]);
    } else {
      setInputVal(val.toString());
    }
  };

  // Sync text input with slider if valid
  const handleTextInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setInputVal(text);
    const parsed = parseRationalInput(text);
    if (parsed.isValid && parsed.decimalValue !== undefined) {
      if (parsed.decimalValue >= minScale && parsed.decimalValue <= maxScale) {
        setSelectedX(parsed.decimalValue);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const handleRevealHint = () => {
    if (hintsRevealed < task.hints.length) {
      playTapSound();
      setHintsRevealed((prev) => prev + 1);
    }
  };

  const handleSubmit = () => {
    if (isSubmitting || isSuccessAnim) return;
    setIsSubmitting(true);
    playTapSound();

    const parsed = parseRationalInput(inputVal);
    if (!parsed.isValid || !parsed.fraction) {
      setFeedback(parsed.errorMessage || 'Vui lòng kiểm tra lại số vừa nhập!');
      playErrorBoop();
      setIsSubmitting(false);
      return;
    }

    let expectedFrac = {
      num: task.contextData.expectedNumerator ?? 0,
      den: task.contextData.expectedDenominator ?? 1,
    };
    if (task.contextData.expectedDecimal !== undefined) {
      const parsedExp = parseRationalInput(task.contextData.expectedDecimal.toString());
      if (parsedExp.fraction) {
        expectedFrac = parsedExp.fraction;
      }
    }

    const isCorrect = areFractionsEquivalent(parsed.fraction, expectedFrac);

    if (isCorrect) {
      setFeedback(`🎉 Chính xác! Trụ cầu đã mọc lên vững chắc tại vị trí ${formatFractionText(parsed.fraction)}.`);
      playSuccessChime();
      setIsSuccessAnim(true);
      setTimeout(() => {
        playStepSound();
      }, 400);
      setTimeout(() => {
        onSuccess({ userAnswer: inputVal, hintCount: hintsRevealed });
      }, 1500);
    } else {
      const errorDiag = diagnoseRationalError(parsed.fraction, expectedFrac);
      setFeedback(`❌ Chưa chính xác: ${errorDiag}`);
      playErrorBoop();
      onFailure({
        userAnswer: inputVal,
        hintCount: hintsRevealed,
        errorFeedback: errorDiag,
      });
      setIsSubmitting(false);
    }
  };

  const pct = Math.max(0, Math.min(100, ((selectedX - minScale) / (maxScale - minScale)) * 100));
  const zeroPct = Math.max(0, Math.min(100, ((0 - minScale) / (maxScale - minScale)) * 100));

  const quickChips = ['-7/4', '-3/2', '-5/4', '-3/4', '-1/2', '0', '1/2', '3/4', '1.25', '3/2', '7/4'];

  return (
    <div className="relative w-full max-w-4xl mx-auto p-4 sm:p-6 bg-[#161033] rounded-2xl border-2 border-purple-700/60 shadow-2xl text-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 sm:pb-4 mb-4 border-b border-purple-800/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl sm:text-3xl">🌉</span>
            <h2 className="text-base sm:text-xl md:text-2xl font-black font-display text-purple-100">
              Vùng 1 – Nhiệm vụ {task.taskIndex}/3: {task.title}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-purple-300 font-medium mt-1">{task.skillLabel}</p>
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

      {/* Task Prompt Box - High Readability for Mobile */}
      <div className="p-4 sm:p-5 rounded-2xl bg-purple-950/60 border-2 border-purple-700/60 mb-5 shadow-lg">
        <p className="text-xs sm:text-sm md:text-base font-medium text-purple-200">{task.description}</p>
        <p className="text-base sm:text-xl md:text-2xl font-black text-amber-300 mt-2.5 leading-snug drop-shadow-sm">
          {task.prompt}
        </p>
      </div>

      {/* Visual 2.5D Bridge Abyss & Number Line */}
      <div className="relative p-4 sm:p-6 rounded-2xl bg-[#0c0822] border-2 border-purple-800/50 mb-5 overflow-hidden shadow-inner">
        {/* Sky / Abyss Backdrop */}
        <div className="relative h-48 sm:h-56 w-full flex flex-col justify-end items-center pb-10">
          {/* Distant islands on left and right */}
          <div className="absolute left-0 bottom-8 w-28 sm:w-36 h-20 bg-[#24174d] rounded-tr-3xl border-t-2 border-r-2 border-purple-500/60 shadow-lg" />
          <div className="absolute right-0 bottom-8 w-28 sm:w-36 h-20 bg-[#24174d] rounded-tl-3xl border-t-2 border-l-2 border-purple-500/60 shadow-lg" />

          {/* Abyssal clouds */}
          <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-purple-900/40 to-transparent pointer-events-none" />

          {/* Rising 3D Bridge Pillar */}
          <div
            className="absolute bottom-8 transition-all duration-300 ease-out flex flex-col items-center pointer-events-none z-10"
            style={{ left: `calc(${pct}% - 20px)` }}
          >
            {/* Value Tag above pillar - LARGE AND CLEAR */}
            <div className="mb-1.5 px-3 py-1 rounded-xl text-sm sm:text-base md:text-lg font-mono font-black bg-cyan-950 border-2 border-cyan-400 text-cyan-200 shadow-xl shadow-cyan-950/80">
              {inputVal || selectedX}
            </div>

            {/* Pillar Head / Bracket */}
            <div className="w-10 sm:w-12 h-3.5 bg-amber-400 rounded-sm shadow-md" />

            {/* Pillar Column */}
            <div
              className={`w-6 sm:w-8 transition-all duration-700 ${
                isSuccessAnim ? 'h-28 sm:h-32 bg-gradient-to-b from-amber-400 via-amber-500 to-amber-700' : 'h-18 sm:h-22 bg-slate-700'
              } border-x-2 border-slate-900`}
            />

            {/* Pillar Footing */}
            <div className="w-12 sm:w-14 h-3 bg-slate-800 rounded-sm shadow-md" />
          </div>

          {/* If success: Bridge deck extending between islands */}
          {isSuccessAnim && (
            <div className="absolute bottom-20 inset-x-12 sm:inset-x-20 h-5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 border-y-2 border-yellow-200 rounded shadow-2xl animate-pulse flex items-center justify-around z-20">
              <span className="text-xs sm:text-sm font-bold text-amber-950">════</span>
              <span className="text-xs sm:text-sm font-bold text-amber-950">════</span>
              <span className="text-xs sm:text-sm font-bold text-amber-950">════</span>
            </div>
          )}

          {/* The Mathematical Number Line Axis - BOLDER TICK MARKS & LABELS */}
          <div className="relative w-full h-1.5 bg-purple-400 rounded my-2">
            {/* Center Origin Mark 0 */}
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-yellow-400 rounded-full shadow-lg border-2 border-white ring-2 ring-yellow-400/50"
              style={{ left: `${zeroPct}%` }}
              title="Điểm gốc 0"
            />

            {/* Scale divisions */}
            {[-2, -1.5, -1, -0.5, 0, 0.5, 1, 1.5, 2, 2.5].map((num) => {
              if (num < minScale || num > maxScale) return null;
              const pos = ((num - minScale) / (maxScale - minScale)) * 100;
              const isOrigin = num === 0;
              return (
                <div key={num} className="absolute -translate-x-1/2" style={{ left: `${pos}%` }}>
                  <div className={`w-0.5 sm:w-1 ${isOrigin ? 'h-5 bg-yellow-300' : 'h-3.5 bg-purple-300'} -mt-1`} />
                  <span className={`text-xs sm:text-sm font-bold font-mono block text-center mt-1.5 ${isOrigin ? 'text-yellow-300 font-black' : 'text-purple-200'}`}>
                    {num}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Large Touch Slider for Mobile */}
        <div className="mt-6 px-1">
          <input
            type="range"
            min={minScale}
            max={maxScale}
            step={step}
            value={selectedX}
            onChange={handleSliderChange}
            className="w-full accent-cyan-400 h-3.5 bg-purple-950 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-xs sm:text-sm text-purple-300/80 font-bold font-mono mt-1 px-1">
            <span>{minScale}</span>
            <span className="text-cyan-300">Kéo thanh trượt để di chuyển trụ cầu</span>
            <span>+{maxScale}</span>
          </div>
        </div>
      </div>

      {/* Input & Direct Controls - BIG BUTTONS & TEXT */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-xs sm:text-sm md:text-base font-bold text-purple-200 mb-1.5">
            Nhập vị trí hoặc chọn phân số đối (ví dụ: <code className="text-cyan-300 font-mono font-bold bg-purple-950 px-1.5 py-0.5 rounded">-3/4</code>, <code className="text-cyan-300 font-mono font-bold bg-purple-950 px-1.5 py-0.5 rounded">-0.75</code>):
          </label>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <input
              type="text"
              value={inputVal}
              onChange={handleTextInput}
              onKeyDown={handleKeyDown}
              placeholder="VD: -3/4 hoặc -0.75"
              className="flex-1 px-4 py-3 sm:py-3.5 bg-purple-950/80 border-2 border-purple-600 rounded-xl text-white font-mono font-bold text-base sm:text-xl focus:outline-none focus:border-cyan-400 shadow-inner"
            />
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || isSuccessAnim}
              className="px-6 sm:px-8 py-3.5 rounded-xl font-black text-base sm:text-lg tracking-wide text-white bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 disabled:opacity-50 shadow-xl shadow-purple-950/60 cursor-pointer active:scale-95 transition-all min-h-[48px]"
            >
              {isSuccessAnim ? '✓ Đã Dựng Trụ!' : 'Xác Nhận [Enter]'}
            </button>
          </div>
        </div>

        {/* Quick fraction chips - Large Touch Targets */}
        <div>
          <span className="text-xs sm:text-sm text-purple-300 font-bold block mb-1.5">Chọn nhanh phân số thường gặp:</span>
          <div className="flex items-center gap-2 flex-wrap">
            {quickChips.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => {
                  setInputVal(chip);
                  const parsed = parseRationalInput(chip);
                  if (parsed.isValid && parsed.decimalValue !== undefined) {
                    setSelectedX(parsed.decimalValue);
                  }
                }}
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm md:text-base font-bold rounded-xl bg-purple-900/80 hover:bg-purple-700 text-purple-100 border-2 border-purple-600 font-mono cursor-pointer transition-all active:scale-95 shadow-sm min-h-[40px]"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Feedback Alert - Large & Legible */}
      {feedback && (
        <div
          className={`p-4 rounded-xl mb-4 text-xs sm:text-sm md:text-base font-bold border-2 ${
            feedback.includes('Chính xác')
              ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
              : 'bg-rose-950/80 border-rose-500 text-rose-200'
          }`}
        >
          {feedback}
        </div>
      )}

      {/* Step-by-Step Hint System */}
      <div className="p-4 rounded-xl bg-purple-950/30 border-2 border-purple-900/60">
        <div className="flex items-center justify-between">
          <span className="text-xs sm:text-sm font-bold text-purple-200 flex items-center gap-1.5">
            💡 Gợi ý giải toán ({hintsRevealed}/{task.hints.length})
          </span>
          {hintsRevealed < task.hints.length && (
            <button
              onClick={handleRevealHint}
              className="text-xs sm:text-sm font-bold text-cyan-300 hover:text-cyan-200 underline cursor-pointer p-1"
            >
              Xem gợi ý bước {hintsRevealed + 1}
            </button>
          )}
        </div>

        {hintsRevealed > 0 && (
          <ul className="mt-2.5 space-y-2 text-xs sm:text-sm md:text-base text-slate-200">
            {task.hints.slice(0, hintsRevealed).map((hint, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-cyan-400 font-black">›</span>
                <span className="leading-relaxed">{hint}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
