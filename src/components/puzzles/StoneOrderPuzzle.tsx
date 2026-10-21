import React, { useState, useEffect, useRef } from 'react';
import { TaskVariation } from '../../types/game';
import { playSuccessChime, playErrorBoop, playTapSound, playStepSound } from '../../utils/soundEffects';

interface StoneItem {
  label: string;
  value: number;
}

interface StoneOrderPuzzleProps {
  task: TaskVariation;
  onSuccess: (attemptData: { userAnswer: string; hintCount: number }) => void;
  onFailure: (attemptData: { userAnswer: string; hintCount: number; errorFeedback: string }) => void;
  onExit: () => void;
  lives: number;
}

// Helper to scramble stones so they are guaranteed not already sorted
function scrambleStones(stones: StoneItem[]): StoneItem[] {
  if (stones.length <= 1) return [...stones];
  let shuffled = [...stones].sort(() => 0.5 - Math.random());

  // Check if inadvertently already sorted
  let isSorted = true;
  for (let i = 0; i < shuffled.length - 1; i++) {
    if (shuffled[i].value > shuffled[i + 1].value) {
      isSorted = false;
      break;
    }
  }

  // If already sorted, reverse it or swap first two items
  if (isSorted && shuffled.length >= 2) {
    const temp = shuffled[0];
    shuffled[0] = shuffled[1];
    shuffled[1] = temp;
  }
  return shuffled;
}

export const StoneOrderPuzzle: React.FC<StoneOrderPuzzleProps> = ({
  task,
  onSuccess,
  onFailure,
  onExit,
  lives,
}) => {
  const initialStones: StoneItem[] = task.contextData.stones || [];

  const [currentOrder, setCurrentOrder] = useState<StoneItem[]>(() => scrambleStones(initialStones));
  const [selectedStoneIndex, setSelectedStoneIndex] = useState<number | null>(null);
  const [hintsRevealed, setHintsRevealed] = useState<number>(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [activeWalkIndex, setActiveWalkIndex] = useState<number>(-1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const stepIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Reset state whenever task changes
  useEffect(() => {
    const stones: StoneItem[] = task.contextData.stones || [];
    setCurrentOrder(scrambleStones(stones));
    setSelectedStoneIndex(null);
    setHintsRevealed(0);
    setFeedback(null);
    setActiveWalkIndex(-1);
    setIsSubmitting(false);

    return () => {
      if (stepIntervalRef.current) {
        clearInterval(stepIntervalRef.current);
      }
    };
  }, [task.id]);

  // Click to select and swap two stones
  const handleSelectStone = (index: number) => {
    if (activeWalkIndex >= 0 || isSubmitting) return;
    playTapSound();
    if (selectedStoneIndex === null) {
      setSelectedStoneIndex(index);
    } else if (selectedStoneIndex === index) {
      setSelectedStoneIndex(null);
    } else {
      const updated = [...currentOrder];
      const temp = updated[selectedStoneIndex];
      updated[selectedStoneIndex] = updated[index];
      updated[index] = temp;
      setCurrentOrder(updated);
      setSelectedStoneIndex(null);
    }
  };

  // Move stone left or right
  const moveStone = (index: number, direction: 'left' | 'right') => {
    if (activeWalkIndex >= 0 || isSubmitting) return;
    playTapSound();
    const newIndex = direction === 'left' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= currentOrder.length) return;

    const updated = [...currentOrder];
    const temp = updated[index];
    updated[index] = updated[newIndex];
    updated[newIndex] = temp;
    setCurrentOrder(updated);
  };

  const handleRevealHint = () => {
    if (hintsRevealed < task.hints.length) {
      playTapSound();
      setHintsRevealed((prev) => prev + 1);
    }
  };

  const handleSubmit = () => {
    if (isSubmitting || activeWalkIndex >= 0) return;
    setIsSubmitting(true);
    playTapSound();

    const submittedLabels = currentOrder.map((s) => s.label);
    const userAnswerStr = submittedLabels.join(' < ');

    // Check if monotonic increasing: each value <= next value
    let isCorrect = true;
    for (let i = 0; i < currentOrder.length - 1; i++) {
      if (currentOrder[i].value > currentOrder[i + 1].value) {
        isCorrect = false;
        break;
      }
    }

    if (isCorrect) {
      setFeedback('🌿 Hoàn hảo! Con đường đá thăng hoa đã vững chắc. Nhân vật đang bước qua!');
      playSuccessChime();

      // Animate character stepping across each stone
      let stepIdx = 0;
      stepIntervalRef.current = setInterval(() => {
        if (stepIdx < currentOrder.length) {
          setActiveWalkIndex(stepIdx);
          playStepSound();
          stepIdx++;
        } else {
          if (stepIntervalRef.current) {
            clearInterval(stepIntervalRef.current);
          }
          setTimeout(() => {
            onSuccess({ userAnswer: userAnswerStr, hintCount: hintsRevealed });
          }, 800);
        }
      }, 350);
    } else {
      let wrongPair = '';
      for (let i = 0; i < currentOrder.length - 1; i++) {
        if (currentOrder[i].value > currentOrder[i + 1].value) {
          wrongPair = `Phiến đá "${currentOrder[i].label}" có giá trị lớn hơn phiến đá "${currentOrder[i + 1].label}" đứng sau nó.`;
          break;
        }
      }

      const errorMsg = `Thứ tự chưa đúng từ bé đến lớn. ${wrongPair} Hãy kiểm tra lại dấu âm và quy đồng mẫu số!`;
      setFeedback(`❌ ${errorMsg}`);
      playErrorBoop();
      onFailure({
        userAnswer: userAnswerStr,
        hintCount: hintsRevealed,
        errorFeedback: errorMsg,
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto p-4 sm:p-6 bg-[#0e2118] rounded-2xl border-2 border-emerald-700/60 shadow-2xl text-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 sm:pb-4 mb-4 border-b border-emerald-800/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl sm:text-3xl">🌿</span>
            <h2 className="text-base sm:text-xl md:text-2xl font-black font-display text-emerald-100">
              Vùng 2 – Nhiệm vụ {task.taskIndex}/3: {task.title}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-emerald-300 font-medium mt-1">{task.skillLabel}</p>
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
      <div className="p-4 sm:p-5 rounded-2xl bg-emerald-950/60 border-2 border-emerald-700/60 mb-5 shadow-lg">
        <p className="text-xs sm:text-sm md:text-base font-medium text-emerald-200">{task.description}</p>
        <p className="text-base sm:text-xl md:text-2xl font-black text-amber-300 mt-2.5 leading-snug drop-shadow-sm">
          {task.prompt}
        </p>
        <p className="text-xs sm:text-sm text-emerald-300/80 mt-2 font-medium">
          💡 <span className="font-bold text-teal-300">Cách chơi:</span> Nhấp vào 2 phiến đá bất kỳ để đổi vị trí, hoặc bấm nút mũi tên ◀ ▶ bên dưới.
        </p>
      </div>

      {/* Visual Stone Stepping Path - BIG STONES & NUMBERS */}
      <div className="relative p-4 sm:p-6 rounded-2xl bg-[#06150f] border-2 border-emerald-800/50 mb-5 overflow-hidden shadow-inner">
        <div className="flex items-center justify-between mb-4 text-xs sm:text-sm text-emerald-300 font-bold font-mono">
          <span className="flex items-center gap-1">◀ Bé nhất</span>
          <span className="text-teal-200">Đường đá qua đầm lầy</span>
          <span className="flex items-center gap-1">Lớn nhất ▶</span>
        </div>

        {/* Stepping Stones Array - LARGE CARDS */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5 py-6 sm:py-8">
          {currentOrder.map((stone, idx) => {
            const isStepped = activeWalkIndex === idx;
            const isSelected = selectedStoneIndex === idx;

            return (
              <div
                key={`${stone.label}-${idx}`}
                className={`relative flex flex-col items-center transition-all duration-300 ${
                  isStepped ? '-translate-y-3 scale-110' : ''
                }`}
              >
                {/* Stepping Character Indicator */}
                {isStepped && (
                  <div className="absolute -top-12 text-3xl animate-bounce">
                    🚶
                  </div>
                )}

                {/* 2.5D Stepping Stone Plate - ENLARGED FOR PHONE SCREENS */}
                <div
                  onClick={() => handleSelectStone(idx)}
                  className={`relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-2xl bg-gradient-to-b from-emerald-800 via-emerald-900 to-[#0a2016] border-2 sm:border-3 shadow-xl flex flex-col items-center justify-center p-2 cursor-pointer transition-all active:scale-95 ${
                    isSelected
                      ? 'border-yellow-400 ring-4 ring-yellow-400/50 scale-105 shadow-yellow-500/40 bg-emerald-700'
                      : 'border-emerald-400/70 hover:border-emerald-300'
                  }`}
                  title="Nhấp vào để chọn hoặc đổi vị trí"
                >
                  <span className={`text-[10px] sm:text-xs font-mono font-bold px-2 py-0.5 rounded-full ${isSelected ? 'bg-yellow-400 text-slate-950' : 'text-emerald-300/80 bg-black/30'}`}>
                    {isSelected ? '⚡ Đang chọn' : `Đá #${idx + 1}`}
                  </span>
                  <span className="text-xl sm:text-2xl md:text-3xl font-black font-math text-white tracking-wide my-1 drop-shadow-md">
                    {stone.label}
                  </span>
                  <span className="text-[10px] sm:text-xs text-emerald-300/80 font-mono font-bold">
                    ≈ {stone.value.toFixed(2)}
                  </span>
                </div>

                {/* Reorder Arrow Controls - BIG TAP TARGETS */}
                <div className="flex items-center gap-1.5 mt-2.5">
                  <button
                    type="button"
                    disabled={idx === 0 || activeWalkIndex >= 0}
                    onClick={() => moveStone(idx, 'left')}
                    className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-sm sm:text-base font-black rounded-xl bg-emerald-900/80 hover:bg-emerald-700 active:bg-emerald-600 disabled:opacity-20 text-emerald-100 border border-emerald-500 cursor-pointer transition-all shadow-md"
                    title="Sang trái"
                  >
                    ◀
                  </button>
                  <button
                    type="button"
                    disabled={idx === currentOrder.length - 1 || activeWalkIndex >= 0}
                    onClick={() => moveStone(idx, 'right')}
                    className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-sm sm:text-base font-black rounded-xl bg-emerald-900/80 hover:bg-emerald-700 active:bg-emerald-600 disabled:opacity-20 text-emerald-100 border border-emerald-500 cursor-pointer transition-all shadow-md"
                    title="Sang phải"
                  >
                    ▶
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Current Ordering Summary - LARGE DISPLAY */}
        <div className="text-center font-mono text-xs sm:text-sm md:text-base text-emerald-200 bg-emerald-950/80 py-2.5 px-3 rounded-xl border border-emerald-700/60 mt-2">
          Đường đá hiện tại: <span className="font-black text-amber-300 text-sm sm:text-lg">{currentOrder.map((s) => s.label).join('  <  ')}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-5">
        <button
          type="button"
          onClick={() => {
            playTapSound();
            setCurrentOrder(scrambleStones(initialStones));
          }}
          disabled={activeWalkIndex >= 0}
          className="text-xs sm:text-sm font-bold px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 transition-colors cursor-pointer text-center"
        >
          🔄 Xáo trộn lại
        </button>

        <button
          onClick={handleSubmit}
          disabled={isSubmitting || activeWalkIndex >= 0}
          className="px-8 py-3.5 rounded-xl font-black text-base sm:text-lg tracking-wide text-white bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 disabled:opacity-50 shadow-xl shadow-emerald-950/60 cursor-pointer active:scale-95 transition-all min-h-[48px] text-center"
        >
          {activeWalkIndex >= 0 ? '🚶 Đang Bước Qua...' : 'Xác Nhận Thứ Tự Đá'}
        </button>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-4 rounded-xl mb-4 text-xs sm:text-sm md:text-base font-bold border-2 ${
            feedback.includes('Hoàn hảo')
              ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
              : 'bg-rose-950/80 border-rose-500 text-rose-200'
          }`}
        >
          {feedback}
        </div>
      )}

      {/* Step-by-Step Hint System */}
      <div className="p-4 rounded-xl bg-emerald-950/30 border-2 border-emerald-900/60">
        <div className="flex items-center justify-between">
          <span className="text-xs sm:text-sm font-bold text-emerald-200 flex items-center gap-1.5">
            💡 Gợi ý quy đồng & so sánh ({hintsRevealed}/{task.hints.length})
          </span>
          {hintsRevealed < task.hints.length && (
            <button
              onClick={handleRevealHint}
              className="text-xs sm:text-sm font-bold text-teal-300 hover:text-teal-200 underline cursor-pointer p-1"
            >
              Xem gợi ý bước {hintsRevealed + 1}
            </button>
          )}
        </div>

        {hintsRevealed > 0 && (
          <ul className="mt-2.5 space-y-2 text-xs sm:text-sm md:text-base text-slate-200">
            {task.hints.slice(0, hintsRevealed).map((hint, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-emerald-400 font-black">›</span>
                <span className="leading-relaxed">{hint}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
