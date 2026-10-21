export type ZoneId = 1 | 2 | 3 | 4 | 5;

export interface Fraction {
  num: number;
  den: number;
}

export type SkillCategory =
  | 'SO_DOI_TRUC_SO'
  | 'BIEU_DIEN_SO_HUU_TI'
  | 'SO_SANH_SAP_XEP'
  | 'CONG_TRU_SO_HUU_TI'
  | 'NHAN_CHIA_SO_HUU_TI'
  | 'LUY_THUA_CUNG_CO_SO'
  | 'DAU_NGOAC_LUY_THUA'
  | 'LUY_THUA_CUA_LUY_THUA'
  | 'TINH_HOP_LY'
  | 'TOAN_THUC_TIEN';

export interface TaskVariation {
  id: string;
  zoneId: ZoneId;
  taskIndex: number; // 1, 2, 3
  title: string;
  description: string;
  skill: SkillCategory;
  skillLabel: string;
  prompt: string;
  contextData: any;
  hints: string[];
  correctAnswerSummary: string;
}

export interface TaskAttempt {
  attemptId: string;
  studentId: string;
  taskId: string;
  zoneId: ZoneId;
  skill: SkillCategory;
  skillLabel: string;
  userAnswer: string;
  isCorrect: boolean;
  attemptNumber: number;
  hintsUsedCount: number;
  feedbackText: string;
  timestamp: string;
}

export interface StudentProfile {
  id: string;
  studentCode: string;
  fullName: string;
  nickname: string;
  classId: string;
  avatarColor: string; // hex
  xp: number;
  crystals: number;
  lives: number;
  maxLives: number;
  currentZone: ZoneId;
  unlockedZones: ZoneId[];
  completedTaskIds: string[];
  firstAttemptSuccessTaskIds: string[];
  hintsViewedTaskIds: string[];
  hasCrown: boolean;
  lastActive: string;
  mustChangePassword?: boolean;
}

export interface ClassGroup {
  id: string;
  name: string; // e.g. "7A10"
  teacherName: string;
  schoolYear: string;
  createdAt: string;
  studentCount: number;
}

export type AppMode = 'TRIAL' | 'ONLINE';
export type ViewScreen = 'GAME_WORLD' | 'TASK_PUZZLE' | 'TEACHER_DASHBOARD' | 'JOURNAL' | 'RECOVERY_SHRINE' | 'VICTORY_SCREEN';
