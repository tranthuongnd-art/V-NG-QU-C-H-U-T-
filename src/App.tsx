import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ZoneId, StudentProfile, TaskVariation, AppMode, ViewScreen, TaskAttempt, ClassGroup } from './types/game';
import { ZONES_METADATA, getZoneTasks } from './data/zonesData';
import { gameStorage } from './services/gameStore';
import { isFirebaseOnline } from './services/firebaseConfig';
import { WorldCanvas25D } from './components/WorldCanvas25D';
import { BridgeNumberLinePuzzle } from './components/puzzles/BridgeNumberLinePuzzle';
import { StoneOrderPuzzle } from './components/puzzles/StoneOrderPuzzle';
import { WorkshopElevatorPuzzle } from './components/puzzles/WorkshopElevatorPuzzle';
import { TowerPowerPuzzle } from './components/puzzles/TowerPowerPuzzle';
import { CrownCitadelPuzzle } from './components/puzzles/CrownCitadelPuzzle';
import { TeacherDashboard } from './components/TeacherDashboard';
import { PersonalJournalModal } from './components/PersonalJournalModal';
import { AvatarCustomizerModal } from './components/AvatarCustomizerModal';
import { RecoveryShrineModal } from './components/RecoveryShrineModal';
import { VictoryScreenModal } from './components/VictoryScreenModal';
import { StudentLoginModal } from './components/StudentLoginModal';
import { soundManager } from './utils/soundEffects';

export default function App() {
  const [appMode, setAppMode] = useState<AppMode>(isFirebaseOnline ? 'ONLINE' : 'TRIAL');
  const [viewScreen, setViewScreen] = useState<ViewScreen>('GAME_WORLD');

  // Modals state
  const [isJournalOpen, setIsJournalOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isTeacherOpen, setIsTeacherOpen] = useState<boolean>(false);
  const [isStudentLoginOpen, setIsStudentLoginOpen] = useState<boolean>(false);

  // Student state
  const [profile, setProfile] = useState<StudentProfile>(() => gameStorage.getCurrentStudent());
  const [studentsList, setStudentsList] = useState<StudentProfile[]>(() => gameStorage.getStudents());
  const [attemptsList, setAttemptsList] = useState<TaskAttempt[]>(() => gameStorage.getAttempts());
  const [classesList, setClassesList] = useState<ClassGroup[]>(() => gameStorage.getClasses());

  // Active Zone & Task
  const [activeZoneId, setActiveZoneId] = useState<ZoneId>(profile.currentZone || 1);
  const [currentTaskIndex, setCurrentTaskIndex] = useState<number>(0);
  const [taskSeed, setTaskSeed] = useState<number>(() => Date.now());

  // Check Firebase status on mount
  useEffect(() => {
    if (isFirebaseOnline) {
      setAppMode('ONLINE');
    } else {
      setAppMode('TRIAL');
    }
  }, []);

  // Initialize SoundManager on first user interaction
  useEffect(() => {
    const handleFirstInteraction = () => {
      soundManager.startBGM();
      window.removeEventListener('pointerdown', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };
    window.addEventListener('pointerdown', handleFirstInteraction, { once: true });
    window.addEventListener('keydown', handleFirstInteraction, { once: true });
    return () => {
      window.removeEventListener('pointerdown', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };
  }, []);

  // Sync profile state helper
  const refreshStorageData = useCallback(() => {
    setProfile(gameStorage.getCurrentStudent());
    setStudentsList(gameStorage.getStudents());
    setAttemptsList(gameStorage.getAttempts());
    setClassesList(gameStorage.getClasses());
  }, []);

  // Subscribe to real-time storage/cloud changes
  useEffect(() => {
    const unsub = gameStorage.subscribe(() => {
      refreshStorageData();
    });
    return unsub;
  }, [refreshStorageData]);

  // Current tasks for active zone
  const activeZoneTasks: TaskVariation[] = useMemo(() => {
    return getZoneTasks(activeZoneId, taskSeed);
  }, [activeZoneId, taskSeed]);

  const currentTask: TaskVariation | undefined = activeZoneTasks[currentTaskIndex];

  // Navigate to task puzzle
  const handleEnterTask = (zoneId: ZoneId, taskIdx?: number) => {
    setActiveZoneId(zoneId);
    if (taskIdx !== undefined) {
      setCurrentTaskIndex(taskIdx);
    } else {
      const zoneTasks = getZoneTasks(zoneId, taskSeed);
      let firstIncompleteIndex = 0;
      for (let i = 0; i < zoneTasks.length; i++) {
        const baseId = `z${zoneId}_t${i + 1}`;
        if (!profile.completedTaskIds.includes(baseId)) {
          firstIncompleteIndex = i;
          break;
        }
      }
      setCurrentTaskIndex(firstIncompleteIndex);
    }
    setViewScreen('TASK_PUZZLE');
  };

  // Puzzle success handler
  const handlePuzzleSuccess = (attemptData: { userAnswer: string; hintCount: number }) => {
    if (!currentTask) return;

    const { updatedProfile, isFirstCompletion, xpEarned } = gameStorage.recordAttempt(
      currentTask,
      attemptData.userAnswer,
      true,
      attemptData.hintCount,
      'Chính xác'
    );

    refreshStorageData();

    // Check if next task exists in this zone
    if (currentTaskIndex < activeZoneTasks.length - 1) {
      setTimeout(() => {
        setCurrentTaskIndex((prev) => prev + 1);
      }, 1000);
    } else {
      // Zone completed!
      if (activeZoneId === 5 && (updatedProfile.hasCrown || updatedProfile.completedTaskIds.filter(id => id.startsWith('z5_')).length >= 3)) {
        setTimeout(() => {
          setViewScreen('VICTORY_SCREEN');
        }, 1500);
      } else {
        // Return to world view with new zone unlocked!
        setTimeout(() => {
          if (activeZoneId < 5) {
            const nextZone = (activeZoneId + 1) as ZoneId;
            setActiveZoneId(nextZone);
            setCurrentTaskIndex(0);
          }
          setViewScreen('GAME_WORLD');
        }, 1500);
      }
    }
  };

  // Puzzle failure handler
  const handlePuzzleFailure = (attemptData: { userAnswer: string; hintCount: number; errorFeedback: string }) => {
    if (!currentTask) return;

    const { updatedProfile } = gameStorage.recordAttempt(
      currentTask,
      attemptData.userAnswer,
      false,
      attemptData.hintCount,
      attemptData.errorFeedback
    );

    refreshStorageData();

    // Check if lives reached 0
    if (updatedProfile.lives <= 0) {
      setTimeout(() => {
        setViewScreen('RECOVERY_SHRINE');
      }, 1000);
    }
  };

  // Recovery shrine heal
  const handleHealStudent = () => {
    gameStorage.healStudentLives();
    refreshStorageData();
    setViewScreen('GAME_WORLD');
  };

  // Update profile
  const handleUpdateProfile = (updated: Partial<StudentProfile>) => {
    gameStorage.updateProfile(updated);
    refreshStorageData();
  };

  // Switch student by student code (Cross-device cloud sync)
  const handleSwitchStudent = async (studentCode: string) => {
    await gameStorage.switchStudentByCode(studentCode);
    refreshStorageData();
  };

  // Unlock all zones so player can play to the end immediately
  const handleUnlockAllZones = () => {
    const updated = gameStorage.unlockAllZones();
    refreshStorageData();
    setActiveZoneId(updated.currentZone);
  };

  // Teacher dashboard student operations
  const handleAddStudent = (newSt: any) => {
    gameStorage.addStudent(newSt);
    refreshStorageData();
  };

  const handleImportStudents = (studentsList: Array<{ studentCode: string; fullName: string; nickname: string; classId: string }>) => {
    studentsList.forEach((s) => {
      gameStorage.addStudent({
        studentCode: s.studentCode,
        fullName: s.fullName,
        nickname: s.nickname,
        classId: s.classId,
        avatarColor: '#06b6d4',
      });
    });
    refreshStorageData();
  };

  const handleResetPassword = (studentId: string) => {
    const student = studentsList.find((s) => s.id === studentId);
    alert(`[Mật khẩu mới đã cấp] Học sinh ${student?.fullName} (${student?.studentCode}) đã được đặt lại mật khẩu thành: "Toan7@2026". Học sinh sẽ được yêu cầu đổi mật khẩu ở lần đăng nhập tiếp theo.`);
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#0a0618] text-slate-100 flex flex-col font-sans select-none">
      {/* Operating Mode Informational Banner */}
      {appMode === 'ONLINE' ? (
        <aside aria-label="Thông báo chế độ trực tuyến" className="bg-emerald-950/90 border-b border-emerald-800/80 px-3 sm:px-4 py-1.5 flex items-center justify-between text-xs sm:text-sm text-emerald-200 z-40">
          <div className="flex items-center gap-2">
            <span className="font-black text-emerald-300">🟢 TRỰC TUYẾN CLOUD:</span>
            <span>
              Mã <b className="font-mono text-cyan-300 font-black">{profile.studentCode}</b> ({profile.nickname})
            </span>
          </div>
          <button
            onClick={() => setIsStudentLoginOpen(true)}
            className="text-cyan-300 hover:text-white underline font-mono font-bold text-xs sm:text-sm cursor-pointer p-1"
          >
            Đổi mã học sinh ›
          </button>
        </aside>
      ) : (
        <aside aria-label="Thông báo chế độ chơi thử" className="bg-amber-950/80 border-b border-amber-800/60 px-3 sm:px-4 py-1.5 flex items-center justify-between text-xs sm:text-sm text-amber-200 z-40">
          <div className="flex items-center gap-2">
            <span className="font-black text-amber-300">⚠️ CHƠI THỬ:</span>
            <span>Không đồng bộ tài khoản</span>
          </div>
          <button
            onClick={() => setIsStudentLoginOpen(true)}
            className="text-amber-300 hover:text-white underline font-mono font-bold text-xs sm:text-sm cursor-pointer p-1"
          >
            Đăng nhập mã học sinh ›
          </button>
        </aside>
      )}

      {/* Main View Screen Content */}
      <div className="relative flex-1 w-full h-full overflow-hidden">
        {/* Screen 1: 2.5D World Map */}
        {viewScreen === 'GAME_WORLD' && (
          <WorldCanvas25D
            currentZone={activeZoneId}
            unlockedZones={profile.unlockedZones}
            profile={profile}
            onSelectZone={(zId) => setActiveZoneId(zId)}
            onEnterTask={handleEnterTask}
            onOpenJournal={() => setIsJournalOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenTeacher={() => setIsTeacherOpen(true)}
            onOpenStudentLogin={() => setIsStudentLoginOpen(true)}
            appMode={appMode}
          />
        )}

        {/* Screen 2: Task Puzzle Workspace */}
        {viewScreen === 'TASK_PUZZLE' && currentTask && (
          <div className="w-full h-full flex flex-col items-center p-4 overflow-y-auto bg-[#0a0618]">
            {/* Top Zone Navigation & Stepper Header - ENLARGED FOR PHONES */}
            <div className="w-full max-w-4xl flex items-center justify-between mb-4 p-2 sm:p-2.5 rounded-2xl bg-[#140e30]/90 border-2 border-purple-800/80 backdrop-blur-md shadow-xl flex-wrap gap-2">
              <button
                onClick={() => setViewScreen('GAME_WORLD')}
                className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-700 active:scale-95 min-h-[40px]"
              >
                <span className="text-base font-black">‹</span>
                <span>Bản đồ đảo</span>
              </button>

              {/* Task 1, 2, 3 Stepper */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                {activeZoneTasks.map((t, idx) => {
                  const baseId = `z${activeZoneId}_t${idx + 1}`;
                  const isDone = profile.completedTaskIds.includes(baseId);
                  const isCurrent = currentTaskIndex === idx;

                  return (
                    <button
                      key={t.id}
                      onClick={() => setCurrentTaskIndex(idx)}
                      className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm md:text-base font-bold flex items-center gap-1.5 transition-all cursor-pointer min-h-[40px] active:scale-95 ${
                        isCurrent
                          ? 'bg-purple-600 text-white shadow-xl ring-2 sm:ring-3 ring-cyan-400 font-black'
                          : isDone
                          ? 'bg-emerald-950/80 border border-emerald-500 text-emerald-200 hover:bg-emerald-900'
                          : 'bg-purple-950/60 border border-purple-700/60 text-purple-200 hover:bg-purple-900'
                      }`}
                      title={`Chuyển sang Nhiệm vụ ${idx + 1}: ${t.title}`}
                    >
                      <span className="font-black">{isDone ? '✓' : isCurrent ? '⚡' : '⚪'}</span>
                      <span>Nhiệm vụ {idx + 1}</span>
                    </button>
                  );
                })}
              </div>

              {/* Next Zone or Victory shortcut if qualified */}
              <div className="flex items-center gap-2">
                {activeZoneId < 5 && profile.unlockedZones.includes((activeZoneId + 1) as ZoneId) ? (
                  <button
                    onClick={() => {
                      setActiveZoneId((activeZoneId + 1) as ZoneId);
                      setCurrentTaskIndex(0);
                    }}
                    className="px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm md:text-base font-black bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-lg cursor-pointer transition-all flex items-center gap-1.5 min-h-[40px] active:scale-95"
                    title={`Chuyển đến Vùng ${activeZoneId + 1}`}
                  >
                    <span>Vùng {activeZoneId + 1}</span>
                    <span>›</span>
                  </button>
                ) : activeZoneId === 5 && (profile.hasCrown || profile.completedTaskIds.filter(id => id.startsWith('z5_')).length >= 3) ? (
                  <button
                    onClick={() => setViewScreen('VICTORY_SCREEN')}
                    className="px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm md:text-base font-black bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 shadow-xl cursor-pointer transition-all flex items-center gap-1.5 min-h-[40px] active:scale-95"
                  >
                    <span>👑 Lễ Đăng Quang</span>
                  </button>
                ) : null}
              </div>
            </div>

            {/* Zone 1: Bến Khởi Nguyên */}
            {activeZoneId === 1 && (
              <BridgeNumberLinePuzzle
                task={currentTask}
                onSuccess={handlePuzzleSuccess}
                onFailure={handlePuzzleFailure}
                onExit={() => setViewScreen('GAME_WORLD')}
                lives={profile.lives}
              />
            )}

            {/* Zone 2: Rừng Thứ Tự */}
            {activeZoneId === 2 && (
              <StoneOrderPuzzle
                task={currentTask}
                onSuccess={handlePuzzleSuccess}
                onFailure={handlePuzzleFailure}
                onExit={() => setViewScreen('GAME_WORLD')}
                lives={profile.lives}
              />
            )}

            {/* Zone 3: Xưởng Phép Tính */}
            {activeZoneId === 3 && (
              <WorkshopElevatorPuzzle
                task={currentTask}
                onSuccess={handlePuzzleSuccess}
                onFailure={handlePuzzleFailure}
                onExit={() => setViewScreen('GAME_WORLD')}
                lives={profile.lives}
              />
            )}

            {/* Zone 4: Tháp Lũy Thừa */}
            {activeZoneId === 4 && (
              <TowerPowerPuzzle
                task={currentTask}
                onSuccess={handlePuzzleSuccess}
                onFailure={handlePuzzleFailure}
                onExit={() => setViewScreen('GAME_WORLD')}
                lives={profile.lives}
              />
            )}

            {/* Zone 5: Thành Vương Miện */}
            {activeZoneId === 5 && (
              <CrownCitadelPuzzle
                task={currentTask}
                onSuccess={handlePuzzleSuccess}
                onFailure={handlePuzzleFailure}
                onExit={() => setViewScreen('GAME_WORLD')}
                lives={profile.lives}
              />
            )}
          </div>
        )}

        {/* Screen 3: Recovery Shrine Modal */}
        {viewScreen === 'RECOVERY_SHRINE' && (
          <RecoveryShrineModal
            onHeal={handleHealStudent}
            onExitToWorld={() => setViewScreen('GAME_WORLD')}
          />
        )}

        {/* Screen 4: Coronation Victory Screen */}
        {viewScreen === 'VICTORY_SCREEN' && (
          <VictoryScreenModal
            profile={profile}
            onContinue={() => setViewScreen('GAME_WORLD')}
          />
        )}
      </div>

      {/* Global Modals */}
      {isJournalOpen && (
        <PersonalJournalModal
          profile={profile}
          onClose={() => setIsJournalOpen(false)}
        />
      )}

      {isSettingsOpen && (
        <AvatarCustomizerModal
          profile={profile}
          onUpdateProfile={handleUpdateProfile}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      {isTeacherOpen && (
        <TeacherDashboard
          students={studentsList}
          attempts={attemptsList}
          classes={classesList}
          onAddStudent={handleAddStudent}
          onImportStudents={handleImportStudents}
          onResetPassword={handleResetPassword}
          onClose={() => setIsTeacherOpen(false)}
        />
      )}

      {isStudentLoginOpen && (
        <StudentLoginModal
          currentProfile={profile}
          studentsList={studentsList}
          onSwitchStudent={handleSwitchStudent}
          onUnlockAllZones={handleUnlockAllZones}
          onClose={() => setIsStudentLoginOpen(false)}
          isOnline={appMode === 'ONLINE'}
        />
      )}
    </main>
  );
}
