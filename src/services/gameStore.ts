import { StudentProfile, TaskAttempt, ClassGroup, ZoneId, TaskVariation } from '../types/game';
import { db, isFirebaseOnline, handleFirestoreError, OperationType } from './firebaseConfig';
import { doc, setDoc, getDoc, collection, onSnapshot } from 'firebase/firestore';

const INITIAL_CLASSES: ClassGroup[] = [
  {
    id: 'class_7a10',
    name: '7A10',
    teacherName: 'Thầy Trần Thương',
    schoolYear: '2026-2027',
    createdAt: '2026-10-20',
    studentCount: 5,
  },
];

const INITIAL_STUDENTS: StudentProfile[] = [
  {
    id: 'student_1',
    studentCode: '7A10-01',
    fullName: 'Trần Minh Khôi',
    nickname: 'Khôi Tia Chớp',
    classId: 'class_7a10',
    avatarColor: '#06b6d4',
    xp: 150,
    crystals: 1,
    lives: 5,
    maxLives: 5,
    currentZone: 2,
    unlockedZones: [1, 2],
    completedTaskIds: ['z1_t1', 'z1_t2', 'z1_t3'],
    firstAttemptSuccessTaskIds: ['z1_t1', 'z1_t2'],
    hintsViewedTaskIds: ['z1_t3'],
    hasCrown: false,
    lastActive: '2026-10-20 20:15',
  },
  {
    id: 'student_2',
    studentCode: '7A10-02',
    fullName: 'Lê Bảo Châu',
    nickname: 'Châu Pha Lê',
    classId: 'class_7a10',
    avatarColor: '#8b5cf6',
    xp: 320,
    crystals: 3,
    lives: 4,
    maxLives: 5,
    currentZone: 4,
    unlockedZones: [1, 2, 3, 4],
    completedTaskIds: ['z1_t1', 'z1_t2', 'z1_t3', 'z2_t1', 'z2_t2', 'z2_t3', 'z3_t1', 'z3_t2'],
    firstAttemptSuccessTaskIds: ['z1_t1', 'z2_t1', 'z3_t1'],
    hintsViewedTaskIds: ['z3_t2'],
    hasCrown: false,
    lastActive: '2026-10-20 21:40',
  },
  {
    id: 'student_3',
    studentCode: '7A10-03',
    fullName: 'Hoàng Anh Quân',
    nickname: 'Quân Chiến Binh',
    classId: 'class_7a10',
    avatarColor: '#f59e0b',
    xp: 75,
    crystals: 0,
    lives: 5,
    maxLives: 5,
    currentZone: 1,
    unlockedZones: [1],
    completedTaskIds: ['z1_t1'],
    firstAttemptSuccessTaskIds: ['z1_t1'],
    hintsViewedTaskIds: [],
    hasCrown: false,
    lastActive: '2026-10-20 18:30',
  },
  {
    id: 'student_4',
    studentCode: '7A10-04',
    fullName: 'Đỗ Mai Linh',
    nickname: 'Linh Tinh Tú',
    classId: 'class_7a10',
    avatarColor: '#10b981',
    xp: 550,
    crystals: 5,
    lives: 5,
    maxLives: 5,
    currentZone: 5,
    unlockedZones: [1, 2, 3, 4, 5],
    completedTaskIds: ['z1_t1', 'z1_t2', 'z1_t3', 'z2_t1', 'z2_t2', 'z2_t3', 'z3_t1', 'z3_t2', 'z3_t3', 'z4_t1', 'z4_t2', 'z4_t3', 'z5_t1', 'z5_t2', 'z5_t3'],
    firstAttemptSuccessTaskIds: ['z1_t1', 'z1_t2', 'z2_t1', 'z3_t1', 'z4_t1', 'z4_t2', 'z5_t1'],
    hintsViewedTaskIds: ['z3_t3', 'z5_t3'],
    hasCrown: true,
    lastActive: '2026-10-20 22:10',
  },
  {
    id: 'student_5',
    studentCode: '7A10-05',
    fullName: 'Nguyễn Tuấn Kiệt',
    nickname: 'Kiệt Bách Khoa',
    classId: 'class_7a10',
    avatarColor: '#f43f5e',
    xp: 0,
    crystals: 0,
    lives: 5,
    maxLives: 5,
    currentZone: 1,
    unlockedZones: [1],
    completedTaskIds: [],
    firstAttemptSuccessTaskIds: [],
    hintsViewedTaskIds: [],
    hasCrown: false,
    lastActive: 'Chưa vào chơi',
  },
];

const INITIAL_ATTEMPTS: TaskAttempt[] = [
  {
    attemptId: 'att_01',
    studentId: 'student_1',
    taskId: 'z1_t1',
    zoneId: 1,
    skill: 'SO_DOI_TRUC_SO',
    skillLabel: 'Nhận biết & biểu diễn số đối trên trục số',
    userAnswer: '-3/4',
    isCorrect: true,
    attemptNumber: 1,
    hintsUsedCount: 0,
    feedbackText: 'Chính xác hoàn toàn!',
    timestamp: '2026-10-20 20:05',
  },
  {
    attemptId: 'att_02',
    studentId: 'student_2',
    taskId: 'z2_t1',
    zoneId: 2,
    skill: 'SO_SANH_SAP_XEP',
    skillLabel: 'So sánh và sắp xếp số hữu tỉ',
    userAnswer: '-2/3 < -1/2 < 0 < 1/6',
    isCorrect: true,
    attemptNumber: 1,
    hintsUsedCount: 0,
    feedbackText: 'Chính xác',
    timestamp: '2026-10-20 21:10',
  },
];

export class GameStorageService {
  private students: StudentProfile[];
  private attempts: TaskAttempt[];
  private classes: ClassGroup[];
  private currentStudentId: string;
  private changeListeners: Array<() => void> = [];

  constructor() {
    this.classes = INITIAL_CLASSES;
    this.students = INITIAL_STUDENTS;
    this.attempts = INITIAL_ATTEMPTS;

    // Check localStorage for saved active student code
    const savedCode = localStorage.getItem('active_student_code');
    const matched = this.students.find((s) => s.studentCode === savedCode);
    this.currentStudentId = matched ? matched.id : this.students[0].id;

    // Initialize real-time cloud listeners if Firestore is active
    this.setupCloudSync();
  }

  public subscribe(cb: () => void): () => void {
    this.changeListeners.push(cb);
    return () => {
      this.changeListeners = this.changeListeners.filter((l) => l !== cb);
    };
  }

  private notify() {
    this.changeListeners.forEach((cb) => cb());
  }

  /**
   * Set up real-time bidirectional Cloud Firestore listeners
   */
  private setupCloudSync() {
    if (!isFirebaseOnline || !db) return;

    try {
      // 1. Listen to real-time student updates
      onSnapshot(
        collection(db, 'students'),
        (snapshot) => {
          if (!snapshot.empty) {
            const cloudStudents: StudentProfile[] = [];
            snapshot.forEach((d) => {
              cloudStudents.push(d.data() as StudentProfile);
            });

            // Merge cloud students with existing list
            cloudStudents.forEach((cs) => {
              const idx = this.students.findIndex((s) => s.studentCode === cs.studentCode || s.id === cs.id);
              if (idx >= 0) {
                this.students[idx] = { ...this.students[idx], ...cs };
              } else {
                this.students.push(cs);
              }
            });
            this.notify();
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, 'students');
        }
      );

      // 2. Listen to real-time attempt logs for teacher view
      onSnapshot(
        collection(db, 'attempts'),
        (snapshot) => {
          if (!snapshot.empty) {
            const cloudAttempts: TaskAttempt[] = [];
            snapshot.forEach((d) => {
              cloudAttempts.push(d.data() as TaskAttempt);
            });

            // Deduplicate attempts
            const map = new Map<string, TaskAttempt>();
            [...this.attempts, ...cloudAttempts].forEach((a) => {
              map.set(a.attemptId, a);
            });
            this.attempts = Array.from(map.values()).sort(
              (a, b) => b.timestamp.localeCompare(a.timestamp)
            );
            this.notify();
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, 'attempts');
        }
      );
    } catch (err) {
      console.warn('Real-time sync listener notice:', err);
    }
  }

  public getClasses(): ClassGroup[] {
    return [...this.classes];
  }

  public getStudents(): StudentProfile[] {
    return [...this.students];
  }

  public getAttempts(): TaskAttempt[] {
    return [...this.attempts];
  }

  public getCurrentStudent(): StudentProfile {
    const student = this.students.find((s) => s.id === this.currentStudentId);
    return student || this.students[0];
  }

  public setCurrentStudent(studentId: string) {
    this.currentStudentId = studentId;
    const current = this.getCurrentStudent();
    if (current) {
      localStorage.setItem('active_student_code', current.studentCode);
    }
    this.notify();
  }

  /**
   * Log in or switch to a student using their Student Code (e.g. "7A10-01" or a new code)
   * Automatically pulls and syncs with Cloud Firestore so student can play on any device!
   */
  public async switchStudentByCode(studentCode: string): Promise<StudentProfile> {
    const trimmed = studentCode.trim().toUpperCase();

    // 1. Check local list
    let student = this.students.find((s) => s.studentCode.toUpperCase() === trimmed);

    // 2. If not found locally, try fetching directly from Firestore
    if (!student && isFirebaseOnline && db) {
      try {
        const snap = await getDoc(doc(db, 'students', trimmed));
        if (snap.exists()) {
          student = snap.data() as StudentProfile;
          this.students.push(student);
        }
      } catch (err) {
        console.warn('Firestore fetch student note:', err);
      }
    }

    // 3. If still not found, create a new student with this code!
    if (!student) {
      student = {
        id: `student_${Date.now()}_${trimmed.replace(/[^A-Z0-9]/gi, '_')}`,
        studentCode: trimmed,
        fullName: `Học Sinh ${trimmed}`,
        nickname: `Hiệp Sĩ ${trimmed}`,
        classId: 'class_7a10',
        avatarColor: '#06b6d4',
        xp: 0,
        crystals: 0,
        lives: 5,
        maxLives: 5,
        currentZone: 1,
        unlockedZones: [1],
        completedTaskIds: [],
        firstAttemptSuccessTaskIds: [],
        hintsViewedTaskIds: [],
        hasCrown: false,
        lastActive: 'Vừa đăng nhập',
      };
      this.students.push(student);
    }

    this.setCurrentStudent(student.id);
    this.syncStudentToCloud(student);
    return student;
  }

  /**
   * Unlocks all 5 zones for the current student so they can explore to the very end immediately!
   */
  public unlockAllZones(): StudentProfile {
    const student = this.getCurrentStudent();
    const updated: StudentProfile = {
      ...student,
      unlockedZones: [1, 2, 3, 4, 5],
      currentZone: 5,
      lastActive: 'Mở khóa tự do 5 vùng',
    };
    this.updateProfile(updated);
    return updated;
  }

  public updateProfile(updated: Partial<StudentProfile>) {
    this.students = this.students.map((st) => {
      if (st.id === this.currentStudentId) {
        const next = { ...st, ...updated };
        this.syncStudentToCloud(next);
        return next;
      }
      return st;
    });
    this.notify();
  }

  public addStudent(newStudent: Omit<StudentProfile, 'id' | 'xp' | 'crystals' | 'lives' | 'maxLives' | 'currentZone' | 'unlockedZones' | 'completedTaskIds' | 'firstAttemptSuccessTaskIds' | 'hintsViewedTaskIds' | 'hasCrown' | 'lastActive'>) {
    const created: StudentProfile = {
      ...newStudent,
      id: `student_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      xp: 0,
      crystals: 0,
      lives: 5,
      maxLives: 5,
      currentZone: 1,
      unlockedZones: [1],
      completedTaskIds: [],
      firstAttemptSuccessTaskIds: [],
      hintsViewedTaskIds: [],
      hasCrown: false,
      lastActive: 'Vừa tạo',
    };
    this.students = [created, ...this.students];
    this.syncStudentToCloud(created);
    this.notify();
  }

  public recordAttempt(
    task: TaskVariation,
    userAnswer: string,
    isCorrect: boolean,
    hintsUsedCount: number,
    feedbackText: string
  ): { updatedProfile: StudentProfile; isFirstCompletion: boolean; xpEarned: number } {
    const student = this.getCurrentStudent();
    const taskBaseId = task.id.split('_').slice(0, 2).join('_'); // e.g. "z1_t1"

    // Calculate attempt number for this student on this task
    const priorAttempts = this.attempts.filter(
      (a) => a.studentId === student.id && a.taskId.startsWith(taskBaseId)
    );
    const attemptNumber = priorAttempts.length + 1;

    // Log the new attempt
    const newAttempt: TaskAttempt = {
      attemptId: `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      studentId: student.id,
      taskId: task.id,
      zoneId: task.zoneId,
      skill: task.skill,
      skillLabel: task.skillLabel,
      userAnswer,
      isCorrect,
      attemptNumber,
      hintsUsedCount,
      feedbackText,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toISOString().slice(0, 10),
    };
    this.attempts = [newAttempt, ...this.attempts];

    // Push attempt immediately to Cloud Firestore
    this.syncAttemptToCloud(newAttempt);

    let xpEarned = 0;
    const isFirstCompletion = isCorrect && !student.completedTaskIds.includes(taskBaseId);

    if (isCorrect) {
      if (isFirstCompletion) {
        // Base task reward: +30 XP
        xpEarned = 30;
        if (hintsUsedCount === 0 && attemptNumber === 1) {
          xpEarned += 15; // Bonus for independent first-try mastery
        }
      }

      const nextCompleted = Array.from(new Set([...student.completedTaskIds, taskBaseId]));

      // Check if all tasks in this zone are completed to unlock next zone and award crystal!
      const currentZoneCompletedTasks = nextCompleted.filter((tId) => tId.startsWith(`z${task.zoneId}_`));
      const hasZoneCrystal = currentZoneCompletedTasks.length >= 2; // Unlock smoothly when progressing

      const nextCrystals = Math.max(student.crystals, hasZoneCrystal ? task.zoneId : student.crystals);
      const nextUnlockedZones: ZoneId[] = [...student.unlockedZones];
      if (task.zoneId < 5 && !nextUnlockedZones.includes((task.zoneId + 1) as ZoneId)) {
        nextUnlockedZones.push((task.zoneId + 1) as ZoneId);
        xpEarned += 50; // Zone clear bonus
      }

      const hasWonCrown = student.hasCrown || (task.zoneId === 5 && currentZoneCompletedTasks.length >= 3);

      const updatedStudent: StudentProfile = {
        ...student,
        xp: student.xp + xpEarned,
        crystals: nextCrystals,
        completedTaskIds: nextCompleted,
        unlockedZones: nextUnlockedZones,
        currentZone: Math.min(5, Math.max(student.currentZone, (task.zoneId + 1) as ZoneId)) as ZoneId,
        hasCrown: hasWonCrown,
        lastActive: 'Vừa xong',
      };

      if (attemptNumber === 1 && !student.firstAttemptSuccessTaskIds.includes(taskBaseId)) {
        updatedStudent.firstAttemptSuccessTaskIds = [...student.firstAttemptSuccessTaskIds, taskBaseId];
      }
      if (hintsUsedCount > 0 && !student.hintsViewedTaskIds.includes(taskBaseId)) {
        updatedStudent.hintsViewedTaskIds = [...student.hintsViewedTaskIds, taskBaseId];
      }

      this.updateProfile(updatedStudent);
      return { updatedProfile: updatedStudent, isFirstCompletion, xpEarned };
    } else {
      // Deduct 1 life on wrong answer
      const updatedStudent: StudentProfile = {
        ...student,
        lives: Math.max(0, student.lives - 1),
        lastActive: 'Vừa xong',
      };
      this.updateProfile(updatedStudent);
      return { updatedProfile: updatedStudent, isFirstCompletion: false, xpEarned: 0 };
    }
  }

  public healStudentLives(): StudentProfile {
    const student = this.getCurrentStudent();
    const updated: StudentProfile = {
      ...student,
      lives: student.maxLives,
    };
    this.updateProfile(updated);
    return updated;
  }

  /**
   * Sync single student document to Cloud Firestore
   */
  private async syncStudentToCloud(student: StudentProfile) {
    if (!isFirebaseOnline || !db) return;
    try {
      await setDoc(doc(db, 'students', student.id), student, { merge: true });
      // Also index by studentCode for easy cross-device sign-in lookup
      await setDoc(doc(db, 'students', student.studentCode), student, { merge: true });
    } catch (err) {
      console.warn('Sync student to cloud notice:', err);
    }
  }

  /**
   * Sync single attempt document to Cloud Firestore
   */
  private async syncAttemptToCloud(attempt: TaskAttempt) {
    if (!isFirebaseOnline || !db) return;
    try {
      await setDoc(doc(db, 'attempts', attempt.attemptId), attempt);
    } catch (err) {
      console.warn('Sync attempt to cloud notice:', err);
    }
  }
}

export const gameStorage = new GameStorageService();
