import React, { useState, useMemo } from 'react';
import { StudentProfile, TaskAttempt, ClassGroup, SkillCategory } from '../types/game';
import { playTapSound } from '../utils/soundEffects';

interface TeacherDashboardProps {
  students: StudentProfile[];
  attempts: TaskAttempt[];
  classes: ClassGroup[];
  onAddStudent: (newStudent: Omit<StudentProfile, 'id' | 'xp' | 'crystals' | 'lives' | 'maxLives' | 'currentZone' | 'unlockedZones' | 'completedTaskIds' | 'firstAttemptSuccessTaskIds' | 'hintsViewedTaskIds' | 'hasCrown' | 'lastActive'>) => void;
  onImportStudents: (studentsList: Array<{ studentCode: string; fullName: string; nickname: string; classId: string }>) => void;
  onResetPassword: (studentId: string) => void;
  onClose: () => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  students,
  attempts,
  classes,
  onAddStudent,
  onImportStudents,
  onResetPassword,
  onClose,
}) => {
  // Tabs: 'ROSTER' | 'ATTEMPTS_LOG' | 'SKILL_ANALYTICS' | 'IMPORT_CSV'
  const [activeTab, setActiveTab] = useState<'ROSTER' | 'ATTEMPTS_LOG' | 'SKILL_ANALYTICS' | 'IMPORT_CSV'>('ROSTER');

  // Filters
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStudentForDetail, setSelectedStudentForDetail] = useState<StudentProfile | null>(null);

  // Single Add Form State
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newCode, setNewCode] = useState<string>('');
  const [newName, setNewName] = useState<string>('');
  const [newNick, setNewNick] = useState<string>('');
  const [newClassId, setNewClassId] = useState<string>(classes[0]?.id || 'class_7a10');
  const [formError, setFormError] = useState<string | null>(null);

  // CSV Import State
  const [csvText, setCsvText] = useState<string>(
`STT,MaHS,HoVaTen,BietDanh,Lop
1,7A10-06,Nguyễn Văn An,An Sấm Sét,class_7a10
2,7A10-07,Trần Thị Mai,Mai Ngọc Bích,class_7a10
3,7A10-08,Lê Hoàng Nam,Nam Thợ Máy,class_7a10`
  );
  const [csvPreview, setCsvPreview] = useState<Array<{ studentCode: string; fullName: string; nickname: string; classId: string; error?: string }>>([]);
  const [csvError, setCsvError] = useState<string | null>(null);

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchClass = selectedClassId === 'all' || s.classId === selectedClassId;
      const query = searchQuery.toLowerCase().trim();
      const matchQuery =
        !query ||
        s.fullName.toLowerCase().includes(query) ||
        s.studentCode.toLowerCase().includes(query) ||
        s.nickname.toLowerCase().includes(query);
      return matchClass && matchQuery;
    });
  }, [students, selectedClassId, searchQuery]);

  // Attempts filtered for student detail or global log
  const filteredAttempts = useMemo(() => {
    if (selectedStudentForDetail) {
      return attempts.filter((a) => a.studentId === selectedStudentForDetail.id);
    }
    return attempts;
  }, [attempts, selectedStudentForDetail]);

  // Skill Analytics
  const skillStats = useMemo(() => {
    const stats: Record<
      string,
      {
        total: number;
        correctFirstTryNoHint: number;
        correctFirstTryWithHint: number;
        correctAfterRetry: number;
        incorrect: number;
      }
    > = {};

    attempts.forEach((att) => {
      if (!stats[att.skillLabel]) {
        stats[att.skillLabel] = {
          total: 0,
          correctFirstTryNoHint: 0,
          correctFirstTryWithHint: 0,
          correctAfterRetry: 0,
          incorrect: 0,
        };
      }
      const s = stats[att.skillLabel];
      s.total++;
      if (att.isCorrect) {
        if (att.attemptNumber === 1 && att.hintsUsedCount === 0) {
          s.correctFirstTryNoHint++;
        } else if (att.attemptNumber === 1 && att.hintsUsedCount > 0) {
          s.correctFirstTryWithHint++;
        } else {
          s.correctAfterRetry++;
        }
      } else {
        s.incorrect++;
      }
    });

    return stats;
  }, [attempts]);

  // Parse CSV Preview
  const handlePreviewCsv = () => {
    setCsvError(null);
    const lines = csvText.trim().split('\n').filter((l) => l.trim().length > 0);
    if (lines.length < 2) {
      setCsvError('Tệp CSV cần ít nhất dòng tiêu đề và 1 dòng dữ liệu học sinh!');
      return;
    }

    const header = lines[0].toLowerCase().split(',').map((h) => h.trim());
    const codeIdx = header.findIndex((h) => h.includes('mahs') || h.includes('mã hs') || h.includes('code'));
    const nameIdx = header.findIndex((h) => h.includes('hovaten') || h.includes('họ') || h.includes('name'));
    const nickIdx = header.findIndex((h) => h.includes('bietdanh') || h.includes('biệt danh') || h.includes('nick'));
    const classIdx = header.findIndex((h) => h.includes('lop') || h.includes('lớp') || h.includes('class'));

    if (codeIdx === -1 || nameIdx === -1) {
      setCsvError('Không tìm thấy cột "MaHS" và "HoVaTen" trong dòng tiêu đề!');
      return;
    }

    const previewList: Array<{ studentCode: string; fullName: string; nickname: string; classId: string; error?: string }> = [];
    const seenCodes = new Set(students.map((s) => s.studentCode.toLowerCase()));

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map((p) => p.trim());
      const sCode = parts[codeIdx] || '';
      const sName = parts[nameIdx] || '';
      const sNick = nickIdx !== -1 && parts[nickIdx] ? parts[nickIdx] : sName.split(' ').pop() || 'Hiệp Sĩ';
      const sClass = classIdx !== -1 && parts[classIdx] ? parts[classIdx] : 'class_7a10';

      let err: string | undefined;
      if (!sCode || !sName) {
        err = 'Thiếu mã hoặc họ tên';
      } else if (seenCodes.has(sCode.toLowerCase())) {
        err = 'Mã học sinh đã tồn tại!';
      }

      previewList.push({
        studentCode: sCode,
        fullName: sName,
        nickname: sNick,
        classId: sClass,
        error: err,
      });

      if (!err) {
        seenCodes.add(sCode.toLowerCase());
      }
    }

    setCsvPreview(previewList);
  };

  const handleConfirmImportCsv = () => {
    const validStudents = csvPreview.filter((p) => !p.error);
    if (validStudents.length === 0) {
      setCsvError('Không có học sinh hợp lệ nào để nhập!');
      return;
    }

    onImportStudents(
      validStudents.map((v) => ({
        studentCode: v.studentCode,
        fullName: v.fullName,
        nickname: v.nickname,
        classId: v.classId,
      }))
    );
    setCsvPreview([]);
    setActiveTab('ROSTER');
  };

  // Export CSV Report with UTF-8 BOM
  const handleExportCSV = () => {
    playTapSound();
    let csv = '\uFEFF'; // UTF-8 BOM for Microsoft Excel in Vietnamese
    csv += 'STT,Mã Học Sinh,Họ Và Tên,Biệt Danh,Lớp,Số Vùng Hoàn Thành,XP,Tinh Thạch,Vương Miện,Hoạt Động Gần Nhất\n';

    filteredStudents.forEach((st, idx) => {
      const clsName = classes.find((c) => c.id === st.classId)?.name || '7A10';
      const zonesCount = st.completedTaskIds.length;
      csv += `${idx + 1},"${st.studentCode}","${st.fullName}","${st.nickname}","${clsName}",${zonesCount}/15,${st.xp},${st.crystals}/5,"${st.hasCrown ? 'Đã Nhận' : 'Chưa'}",${st.lastActive}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Bao_Cao_Tien_Do_Toan7_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-6xl max-h-[92vh] flex flex-col bg-[#121624] rounded-2xl border border-slate-700 shadow-2xl text-slate-100 overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#191f33] border-b border-slate-700">
          <div className="flex items-center gap-3">
            <span className="text-2xl">👨‍🏫</span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold font-display text-white">
                  BẢNG QUẢN LÝ GIÁO VIÊN – TOÁN 7
                </h1>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 font-mono flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Đồng bộ Trực Tuyến Firestore
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Chương I: Số Hữu Tỉ · Nhận kết quả thời gian thực từ mọi thiết bị học sinh
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white flex items-center gap-1.5 shadow transition-colors cursor-pointer"
            >
              📥 Xuất CSV (Excel)
            </button>
            <button
              onClick={() => {
                playTapSound();
                onClose();
              }}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 pt-3 bg-[#161c2e] border-b border-slate-800">
          <button
            onClick={() => {
              playTapSound();
              setActiveTab('ROSTER');
              setSelectedStudentForDetail(null);
            }}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer ${
              activeTab === 'ROSTER' && !selectedStudentForDetail
                ? 'bg-[#121624] text-cyan-400 border-t-2 border-cyan-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            📋 Danh Sách Học Sinh ({students.length})
          </button>
          <button
            onClick={() => {
              playTapSound();
              setActiveTab('ATTEMPTS_LOG');
            }}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer ${
              activeTab === 'ATTEMPTS_LOG'
                ? 'bg-[#121624] text-cyan-400 border-t-2 border-cyan-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            📜 Nhật Ký Trả Lời Chi Tiết ({attempts.length})
          </button>
          <button
            onClick={() => {
              playTapSound();
              setActiveTab('SKILL_ANALYTICS');
            }}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer ${
              activeTab === 'SKILL_ANALYTICS'
                ? 'bg-[#121624] text-cyan-400 border-t-2 border-cyan-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            📊 Thống Kê Theo Kỹ Năng
          </button>
          <button
            onClick={() => {
              playTapSound();
              setActiveTab('IMPORT_CSV');
            }}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer ${
              activeTab === 'IMPORT_CSV'
                ? 'bg-[#121624] text-cyan-400 border-t-2 border-cyan-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            📂 Nhập Danh Sách CSV
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-6 overflow-y-auto">
          {/* TAB 1: ROSTER */}
          {activeTab === 'ROSTER' && (
            <div>
              {/* Controls bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  {/* Class Filter */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-300">
                    <span>Lớp:</span>
                    <select
                      value={selectedClassId}
                      onChange={(e) => setSelectedClassId(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white font-medium text-xs focus:outline-none"
                    >
                      <option value="all">Tất cả các lớp</option>
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Search input */}
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm theo tên hoặc mã HS..."
                    className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400 w-52"
                  />
                </div>

                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-cyan-700 hover:bg-cyan-600 text-white shadow transition-colors cursor-pointer"
                >
                  + Thêm Học Sinh
                </button>
              </div>

              {/* Roster Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#161c2e]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#1c233a] text-slate-400 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Mã HS</th>
                      <th className="py-2.5 px-3">Họ và Tên</th>
                      <th className="py-2.5 px-3">Biệt Danh</th>
                      <th className="py-2.5 px-3">Lớp</th>
                      <th className="py-2.5 px-3">Vùng Mở</th>
                      <th className="py-2.5 px-3 text-right">XP</th>
                      <th className="py-2.5 px-3 text-center">Tinh Thạch</th>
                      <th className="py-2.5 px-3 text-center">Vương Miện</th>
                      <th className="py-2.5 px-3">Lần hoạt động</th>
                      <th className="py-2.5 px-3 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-8 text-center text-slate-500">
                          Chưa tìm thấy học sinh nào phù hợp.
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((st) => {
                        const cls = classes.find((c) => c.id === st.classId)?.name || '7A10';
                        return (
                          <tr key={st.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="py-2.5 px-3 font-mono font-bold text-cyan-300">
                              {st.studentCode}
                            </td>
                            <td className="py-2.5 px-3 font-medium text-white">{st.fullName}</td>
                            <td className="py-2.5 px-3 text-purple-300">{st.nickname}</td>
                            <td className="py-2.5 px-3 text-slate-400">{cls}</td>
                            <td className="py-2.5 px-3">
                              <span className="font-mono font-medium text-amber-300">
                                Vùng {st.currentZone}/5
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-math font-bold text-amber-400">
                              {st.xp}
                            </td>
                            <td className="py-2.5 px-3 text-center font-math text-cyan-300">
                              {st.crystals}/5 💎
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {st.hasCrown ? '👑 Đã Nhận' : '—'}
                            </td>
                            <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                              {st.lastActive}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => {
                                    playTapSound();
                                    setSelectedStudentForDetail(st);
                                    setActiveTab('ATTEMPTS_LOG');
                                  }}
                                  className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 text-[11px] cursor-pointer"
                                  title="Xem nhật ký bài làm"
                                >
                                  Nhật ký
                                </button>
                                <button
                                  onClick={() => {
                                    playTapSound();
                                    onResetPassword(st.id);
                                  }}
                                  className="px-2 py-1 rounded bg-amber-950/80 hover:bg-amber-900 border border-amber-800 text-amber-300 text-[11px] cursor-pointer"
                                  title="Cấp lại mật khẩu"
                                >
                                  Đổi MK
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: ATTEMPTS LOG */}
          {activeTab === 'ATTEMPTS_LOG' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {selectedStudentForDetail
                      ? `Nhật ký bài làm: ${selectedStudentForDetail.fullName} (${selectedStudentForDetail.studentCode})`
                      : 'Toàn bộ lượt nộp bài của học sinh (Cập nhật thời gian thực)'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Phân loại: Đúng lần đầu không gợi ý · Đúng lần đầu có gợi ý · Đúng sau khi thử lại · Chưa đúng
                  </p>
                </div>

                {selectedStudentForDetail && (
                  <button
                    onClick={() => setSelectedStudentForDetail(null)}
                    className="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                  >
                    Xem tất cả học sinh
                  </button>
                )}
              </div>

              {/* Attempts Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#161c2e]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#1c233a] text-slate-400 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Thời điểm</th>
                      <th className="py-2.5 px-3">Học Sinh</th>
                      <th className="py-2.5 px-3">Kỹ Năng</th>
                      <th className="py-2.5 px-3">Đáp Án Học Sinh</th>
                      <th className="py-2.5 px-3 text-center">Lượt Thử</th>
                      <th className="py-2.5 px-3 text-center">Gợi Ý</th>
                      <th className="py-2.5 px-3">Đánh Giá Phân Loại</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {filteredAttempts.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-500">
                          Chưa có lượt nộp bài nào được ghi nhận. Học sinh làm thử thách tại các đảo sẽ hiển thị tại đây.
                        </td>
                      </tr>
                    ) : (
                      filteredAttempts.map((att) => {
                        const student = students.find((s) => s.id === att.studentId);
                        let categoryBadge = '';
                        let badgeColor = '';

                        if (att.isCorrect) {
                          if (att.attemptNumber === 1 && att.hintsUsedCount === 0) {
                            categoryBadge = 'Đúng lần đầu (Không gợi ý)';
                            badgeColor = 'bg-emerald-950 text-emerald-300 border-emerald-800';
                          } else if (att.attemptNumber === 1 && att.hintsUsedCount > 0) {
                            categoryBadge = `Đúng lần đầu (${att.hintsUsedCount} gợi ý)`;
                            badgeColor = 'bg-cyan-950 text-cyan-300 border-cyan-800';
                          } else {
                            categoryBadge = `Đúng sau thử lại (Lần ${att.attemptNumber})`;
                            badgeColor = 'bg-amber-950 text-amber-300 border-amber-800';
                          }
                        } else {
                          categoryBadge = 'Chưa đúng (Đã mất 1 mạng)';
                          badgeColor = 'bg-rose-950 text-rose-300 border-rose-800';
                        }

                        return (
                          <tr key={att.attemptId} className="hover:bg-slate-800/40 transition-colors">
                            <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                              {att.timestamp}
                            </td>
                            <td className="py-2.5 px-3 font-medium text-white">
                              {student?.fullName || att.studentId}
                              <span className="block text-[10px] text-slate-400 font-mono">
                                {student?.studentCode}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-purple-300">
                              {att.skillLabel}
                              <span className="block text-[10px] text-slate-400 font-mono">
                                Vùng {att.zoneId}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-mono font-bold text-white">
                              {att.userAnswer}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono font-medium">
                              Lần {att.attemptNumber}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono">
                              {att.hintsUsedCount > 0 ? `${att.hintsUsedCount} bước` : 'Không'}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className={`inline-block px-2.5 py-1 rounded text-[11px] font-medium border ${badgeColor}`}>
                                {categoryBadge}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: SKILL ANALYTICS */}
          {activeTab === 'SKILL_ANALYTICS' && (
            <div>
              <div className="mb-4">
                <h3 className="text-sm font-bold text-white">
                  Thống Kê Kỹ Năng & Lỗi Thường Gặp (Chương I - Số Hữu Tỉ)
                </h3>
                <p className="text-xs text-slate-400">
                  Dựa trên số lượt làm thật của học sinh. Tiêu chí: Tối thiểu 5 lượt làm mỗi kỹ năng để đánh giá mức độ thành thạo.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.keys(skillStats).length === 0 ? (
                  <div className="col-span-2 py-8 text-center text-slate-500 bg-[#161c2e] rounded-xl border border-slate-800">
                    Chưa đủ dữ liệu bài làm để tổng hợp kỹ năng.
                  </div>
                ) : (
                  Object.entries(skillStats).map(([skillTitle, data]) => {
                    const passRate = data.total > 0 ? Math.round(((data.total - data.incorrect) / data.total) * 100) : 0;
                    const hasEnoughData = data.total >= 5;

                    return (
                      <div key={skillTitle} className="p-4 rounded-xl bg-[#161c2e] border border-slate-800">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-xs font-bold text-cyan-300">{skillTitle}</h4>
                          <span className="text-[11px] text-slate-400 font-mono">
                            Tổng: {data.total} lượt nộp
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden flex mb-3">
                          <div
                            style={{ width: `${(data.correctFirstTryNoHint / (data.total || 1)) * 100}%` }}
                            className="bg-emerald-500 h-full"
                            title="Đúng lần đầu không gợi ý"
                          />
                          <div
                            style={{ width: `${(data.correctFirstTryWithHint / (data.total || 1)) * 100}%` }}
                            className="bg-cyan-500 h-full"
                            title="Đúng lần đầu có gợi ý"
                          />
                          <div
                            style={{ width: `${(data.correctAfterRetry / (data.total || 1)) * 100}%` }}
                            className="bg-amber-500 h-full"
                            title="Đúng sau thử lại"
                          />
                          <div
                            style={{ width: `${(data.incorrect / (data.total || 1)) * 100}%` }}
                            className="bg-rose-500 h-full"
                            title="Chưa đúng"
                          />
                        </div>

                        {/* Breakdown Numbers */}
                        <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                          <div className="flex items-center justify-between">
                            <span className="text-emerald-400">● Đúng lần đầu (ko gợi ý):</span>
                            <span className="font-mono font-bold">{data.correctFirstTryNoHint}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-cyan-400">● Đúng lần đầu (có gợi ý):</span>
                            <span className="font-mono font-bold">{data.correctFirstTryWithHint}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-amber-400">● Đúng sau thử lại:</span>
                            <span className="font-mono font-bold">{data.correctAfterRetry}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-rose-400">● Lỗi/Chưa đúng:</span>
                            <span className="font-mono font-bold">{data.incorrect}</span>
                          </div>
                        </div>

                        {/* Mastery Indicator */}
                        <div className="mt-3 pt-2 border-t border-slate-800 text-[11px] flex items-center justify-between">
                          <span className="text-slate-400">Mức độ thành thạo:</span>
                          {hasEnoughData ? (
                            <span className={`font-semibold ${passRate >= 80 ? 'text-emerald-400' : passRate >= 60 ? 'text-amber-400' : 'text-rose-400'}`}>
                              {passRate}% ({passRate >= 80 ? 'Thành thạo tốt' : passRate >= 60 ? 'Cần củng cố' : 'Nhiều lỗi sai'})
                            </span>
                          ) : (
                            <span className="text-slate-500 italic">Chưa đủ dữ liệu (cần $\ge$ 5 lượt)</span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 4: IMPORT CSV */}
          {activeTab === 'IMPORT_CSV' && (
            <div className="max-w-2xl mx-auto">
              <h3 className="text-sm font-bold text-white mb-1">
                Nhập Danh Sách Học Sinh Bằng CSV
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Dán nội dung CSV với các cột: <code className="text-cyan-300 font-mono">STT,MaHS,HoVaTen,BietDanh,Lop</code>
              </p>

              <textarea
                rows={6}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 font-mono text-xs text-white focus:outline-none focus:border-cyan-400"
              />

              <div className="flex items-center gap-3 mt-3">
                <button
                  onClick={handlePreviewCsv}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-700 hover:bg-slate-600 text-white cursor-pointer"
                >
                  Kiểm tra & Xem trước
                </button>
              </div>

              {csvError && (
                <div className="mt-3 p-3 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-300 text-xs">
                  {csvError}
                </div>
              )}

              {/* Preview Table */}
              {csvPreview.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-xs font-bold text-cyan-300 mb-2">
                    Xem trước kết quả kiểm tra ({csvPreview.length} dòng):
                  </h4>
                  <div className="overflow-x-auto rounded-lg border border-slate-700">
                    <table className="w-full text-left text-xs bg-slate-900">
                      <thead className="bg-slate-800 text-slate-400">
                        <tr>
                          <th className="p-2">Mã HS</th>
                          <th className="p-2">Họ Và Tên</th>
                          <th className="p-2">Biệt Danh</th>
                          <th className="p-2">Trạng Thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {csvPreview.map((item, i) => (
                          <tr key={i}>
                            <td className="p-2 font-mono text-cyan-300">{item.studentCode}</td>
                            <td className="p-2 text-white">{item.fullName}</td>
                            <td className="p-2 text-purple-300">{item.nickname}</td>
                            <td className="p-2">
                              {item.error ? (
                                <span className="text-rose-400 font-medium">⚠️ {item.error}</span>
                              ) : (
                                <span className="text-emerald-400 font-medium">✓ Hợp lệ</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={handleConfirmImportCsv}
                      className="px-5 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow"
                    >
                      Xác Nhận Tạo {csvPreview.filter((p) => !p.error).length} Tài Khoản
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal: Add Single Student */}
        {showAddModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60">
            <div className="w-full max-w-md p-6 rounded-2xl bg-[#1b2238] border border-slate-700 shadow-2xl">
              <h3 className="text-sm font-bold text-white mb-3">Thêm Học Sinh Mới</h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Mã Học Sinh (Duy nhất):</label>
                  <input
                    type="text"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    placeholder="VD: 7A10-12"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Họ và Tên:</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="VD: Phạm Minh Đức"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Biệt danh trong game:</label>
                  <input
                    type="text"
                    value={newNick}
                    onChange={(e) => setNewNick(e.target.value)}
                    placeholder="VD: Đức Phù Thủy Số"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Lớp:</label>
                  <select
                    value={newClassId}
                    onChange={(e) => setNewClassId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {formError && (
                <div className="mt-3 text-xs text-rose-400">{formError}</div>
              )}

              <div className="flex items-center justify-end gap-2 mt-5">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 text-xs rounded bg-slate-800 text-slate-300"
                >
                  Hủy
                </button>
                <button
                  onClick={() => {
                    if (!newCode.trim() || !newName.trim()) {
                      setFormError('Vui lòng nhập đầy đủ mã HS và họ tên!');
                      return;
                    }
                    if (students.some((s) => s.studentCode.toLowerCase() === newCode.trim().toLowerCase())) {
                      setFormError('Mã học sinh đã tồn tại!');
                      return;
                    }
                    onAddStudent({
                      studentCode: newCode.trim(),
                      fullName: newName.trim(),
                      nickname: newNick.trim() || newName.trim().split(' ').pop() || 'Hiệp Sĩ',
                      classId: newClassId,
                      avatarColor: '#06b6d4',
                    });
                    setNewCode('');
                    setNewName('');
                    setNewNick('');
                    setFormError(null);
                    setShowAddModal(false);
                  }}
                  className="px-4 py-1.5 text-xs font-bold rounded bg-cyan-600 hover:bg-cyan-500 text-white"
                >
                  Lưu Học Sinh
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
