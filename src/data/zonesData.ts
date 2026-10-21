import { ZoneId, TaskVariation, SkillCategory } from '../types/game';

export interface ZoneConfig {
  id: ZoneId;
  name: string;
  subtitle: string;
  themeColor: string;
  accentColor: string;
  crystalName: string;
  description: string;
  lore: string;
  icon: string;
  islandCoordinates: { x: number; y: number };
}

export const ZONES_METADATA: Record<ZoneId, ZoneConfig> = {
  1: {
    id: 1,
    name: 'Bến Khởi Nguyên',
    subtitle: 'Khám phá Số Hữu Tỉ & Trục Số',
    themeColor: '#7c3aed', // Purple
    accentColor: '#06b6d4', // Cyan
    crystalName: 'Tinh Thạch Khởi Nguyên',
    description: 'Nơi trục số vũ trụ trải dài qua màn sương tím. Dựng các trụ cầu toán học vững chắc để kết nối các đảo nổi.',
    lore: 'Tương truyền tại bến nước huyền diệu này, mỗi số hữu tỉ đều có một vị trí thiêng liêng trên trục số và một số đối phản chiếu bên kia số 0.',
    icon: 'Anchor',
    islandCoordinates: { x: 180, y: 380 },
  },
  2: {
    id: 2,
    name: 'Rừng Thứ Tự',
    subtitle: 'So sánh & Sắp xếp Đá Bay',
    themeColor: '#059669', // Emerald
    accentColor: '#10b981', // Jade green
    crystalName: 'Tinh Thạch Trật Tự',
    description: 'Khu rừng nguyên sinh nơi các phiến đá trôi lơ lửng mất cân bằng. Hãy sắp xếp chúng từ bé đến lớn để tạo lối đi an toàn.',
    lore: 'Luật của Rừng Thứ Tự: Số âm càng xa số 0 thì càng nhỏ; số dương càng xa số 0 thì càng lớn.',
    icon: 'Compass',
    islandCoordinates: { x: 400, y: 260 },
  },
  3: {
    id: 3,
    name: 'Xưởng Phép Tính',
    subtitle: 'Bốn Phép Tính & Cân Bằng Năng Lượng',
    themeColor: '#0284c7', // Sky Blue
    accentColor: '#f59e0b', // Amber Gear
    crystalName: 'Tinh Thạch Năng Lượng',
    description: 'Xưởng cơ khí kỳ diệu vận hành bằng cộng, trừ, nhân, chia số hữu tỉ. Điều khiển thang máy và bình dung dịch năng lượng.',
    lore: 'Người thợ máy cổ đại đã khắc ghi: Quy đồng mẫu số là chìa khóa mở van cộng trừ; nhân tử với tử, mẫu với mẫu để kích hoạt động cơ.',
    icon: 'Cog',
    islandCoordinates: { x: 650, y: 390 },
  },
  4: {
    id: 4,
    name: 'Tháp Lũy Thừa',
    subtitle: 'Quy Tắc Lũy Thừa & Dấu Ngoặc',
    themeColor: '#4f46e5', // Indigo
    accentColor: '#ec4899', // Pinkish violet
    crystalName: 'Tinh Thạch Sức Mạnh',
    description: 'Ngọn tháp điện trường chứa những cỗ máy khuếch đại lũy thừa. Phân biệt chính xác cơ số âm, dấu ngoặc và số mũ.',
    lore: 'Hãy cẩn thận: (-a)^2 là bình phương của cả số âm (ra số dương), còn -a^2 là số đối của bình phương (ra số âm)!',
    icon: 'Zap',
    islandCoordinates: { x: 920, y: 250 },
  },
  5: {
    id: 5,
    name: 'Thành Vương Miện',
    subtitle: 'Tính Hợp Lý & Phong Ấn Tối Cao',
    themeColor: '#d97706', // Gold
    accentColor: '#fbbf24', // Yellow Gold
    crystalName: 'Vương Miện Số Hữu Tỉ',
    description: 'Điện thờ nguy nga nơi ngự trị Vương Miện Hoàng Gia. Vận dụng tính hợp lý và giải quyết bài toán thực tiễn để đăng quang.',
    lore: 'Chỉ người nắm vững toàn bộ Chương I - Số hữu tỉ mới có thể gỡ 3 phong ấn cổ xưa và nhận vương miện danh dự.',
    icon: 'Crown',
    islandCoordinates: { x: 1180, y: 360 },
  },
};

/**
 * Tasks templates with variation generators for each zone.
 * Guarantees mathematical accuracy and educational alignment with Vietnamese Grade 7 textbook.
 */
export function getZoneTasks(zoneId: ZoneId, seed: number = Date.now()): TaskVariation[] {
  if (zoneId === 1) {
    // Variations for Zone 1: Bến Khởi Nguyên
    const mod = seed % 3;
    const v1Target = mod === 0 ? { num: -3, den: 4, text: '-3/4', opp: '3/4' } :
                     mod === 1 ? { num: -1, den: 2, text: '-1/2', opp: '1/2' } :
                                 { num: -5, den: 4, text: '-5/4', opp: '5/4' };

    const v2Target = mod === 0 ? { num: 5, den: 4, text: '5/4 (hoặc 1.25)' } :
                     mod === 1 ? { num: 3, den: 2, text: '3/2 (hoặc 1.5)' } :
                                 { num: 7, den: 4, text: '7/4 (hoặc 1.75)' };

    const v3Target = mod === 0 ? { num: -7, den: 4, text: '-7/4', oppTarget: '1.25', oppVal: { num: -5, den: 4 } } :
                     mod === 1 ? { num: -3, den: 2, text: '-3/2', oppTarget: '0.75', oppVal: { num: -3, den: 4 } } :
                                 { num: -2, den: 1, text: '-2', oppTarget: '1.5', oppVal: { num: -3, den: 2 } };

    return [
      {
        id: `z1_t1_${seed}`,
        zoneId: 1,
        taskIndex: 1,
        title: 'Trụ Cầu Số Đối',
        description: 'Vực sâu ngăn cách đảo đầu tiên. Dựng trụ cầu tại số đối của phân số được chỉ định để nhịp cầu vươn tới.',
        skill: 'SO_DOI_TRUC_SO',
        skillLabel: 'Nhận biết & biểu diễn số đối trên trục số',
        prompt: `Hãy đặt trụ cầu tại SỐ ĐỐI của phân số ${v1Target.opp} trên trục số.`,
        contextData: {
          givenValue: v1Target.opp,
          expectedNumerator: v1Target.num,
          expectedDenominator: v1Target.den,
          expectedDisplay: v1Target.text,
          minScale: -2,
          maxScale: 2,
          step: 0.25,
        },
        hints: [
          `Hai số đối nhau có tổng bằng 0 và nằm ở hai phía đối xứng qua điểm 0 trên trục số.`,
          `Số đối của a/b là -a/b. Số đối của ${v1Target.opp} chính là -${v1Target.opp}.`,
          `Trên trục số, điểm 0 ở giữa, di chuyển sang bên TRÁI một khoảng bằng ${v1Target.opp} để đặt trụ tại ${v1Target.text}.`,
        ],
        correctAnswerSummary: `${v1Target.text}`,
      },
      {
        id: `z1_t2_${seed}`,
        zoneId: 1,
        taskIndex: 2,
        title: 'Trụ Cầu Dương',
        description: 'Vách đá tiếp theo cần một trụ neo vững chắc tại số hữu tỉ dương lớn hơn 1.',
        skill: 'BIEU_DIEN_SO_HUU_TI',
        skillLabel: 'Biểu diễn số hữu tỉ trên trục số',
        prompt: `Đặt trụ cầu chính xác tại vị trí phân số ${v2Target.text}.`,
        contextData: {
          expectedNumerator: v2Target.num,
          expectedDenominator: v2Target.den,
          expectedDisplay: v2Target.text,
          minScale: -1,
          maxScale: 2.5,
          step: 0.25,
        },
        hints: [
          `Phân số có tử số lớn hơn mẫu số nên giá trị lớn hơn 1.`,
          `Đổi sang hỗn số: ${v2Target.num}/${v2Target.den} = ${Math.floor(v2Target.num / v2Target.den)} + ${v2Target.num % v2Target.den}/${v2Target.den}.`,
          `Chia mỗi đơn vị thành 4 phần bằng nhau, đếm ${v2Target.num} vạch từ số 0 sang bên phải.`,
        ],
        correctAnswerSummary: `${v2Target.text}`,
      },
      {
        id: `z1_t3_${seed}`,
        zoneId: 1,
        taskIndex: 3,
        title: 'Khóa Cầu Đôi Vượt Vực',
        description: 'Để mở cổng sang đảo Rừng Thứ Tự, hãy xác định số đối của số thập phân âm.',
        skill: 'SO_DOI_TRUC_SO',
        skillLabel: 'Số đối của số thập phân & phân số',
        prompt: `Đặt mỏ neo tại vị trí số đối của -${v3Target.oppTarget}.`,
        contextData: {
          givenDecimal: `-${v3Target.oppTarget}`,
          expectedDecimal: parseFloat(v3Target.oppTarget),
          minScale: -2,
          maxScale: 2,
          step: 0.25,
        },
        hints: [
          `Số đối của số âm -x là số dương +x.`,
          `Số đối của -${v3Target.oppTarget} chính là +${v3Target.oppTarget}.`,
          `Vị trí nằm ở bên phải điểm 0, cách 0 một đoạn ${v3Target.oppTarget} đơn vị.`,
        ],
        correctAnswerSummary: `${v3Target.oppTarget}`,
      },
    ];
  }

  if (zoneId === 2) {
    // Variations for Zone 2: Rừng Thứ Tự
    const sets = [
      {
        items: [
          { label: '-2/3', value: -2 / 3 },
          { label: '1/6', value: 1 / 6 },
          { label: '-1/2', value: -1 / 2 },
          { label: '0', value: 0 },
        ],
      },
      {
        items: [
          { label: '-3/4', value: -0.75 },
          { label: '-1.2', value: -1.2 },
          { label: '2/5', value: 0.4 },
          { label: '0.8', value: 0.8 },
        ],
      },
      {
        items: [
          { label: '-5/6', value: -5 / 6 },
          { label: '-1', value: -1 },
          { label: '-1/3', value: -1 / 3 },
          { label: '1/2', value: 0.5 },
          { label: '2/3', value: 2 / 3 },
        ],
      },
    ];

    return [
      {
        id: `z2_t1_${seed}`,
        zoneId: 2,
        taskIndex: 1,
        title: 'Lối Mòn Bốn Phiến Đá',
        description: 'Bốn phiến đá đang nằm lộn xộn. Hãy sắp xếp chúng theo thứ tự từ BÉ ĐẾN LỚN để tạo đường đi vững chãi.',
        skill: 'SO_SANH_SAP_XEP',
        skillLabel: 'So sánh và sắp xếp số hữu tỉ',
        prompt: 'Kéo hoặc chọn các phiến đá để sắp xếp theo thứ tự TỪ BÉ ĐẾN LỚN (nhỏ nhất đứng đầu):',
        contextData: {
          stones: sets[0].items,
          expectedOrder: [...sets[0].items].sort((a, b) => a.value - b.value).map((i) => i.label),
        },
        hints: [
          'Số hữu tỉ âm luôn nhỏ hơn 0, và 0 luôn nhỏ hơn số hữu tỉ dương.',
          'So sánh hai số âm: quy đồng mẫu số của -2/3 = -4/6 và -1/2 = -3/6. Vì -4 < -3 nên -2/3 < -1/2.',
          'Thứ tự đúng từ bé đến lớn: -2/3 < -1/2 < 0 < 1/6.',
        ],
        correctAnswerSummary: '-2/3 < -1/2 < 0 < 1/6',
      },
      {
        id: `z2_t2_${seed}`,
        zoneId: 2,
        taskIndex: 2,
        title: 'Phiến Đá Hỗn Hợp Thập Phân',
        description: 'Kết hợp cả phân số và số thập phân. Sắp xếp thứ tự để đánh thức dòng chảy ngọc lục bảo.',
        skill: 'SO_SANH_SAP_XEP',
        skillLabel: 'So sánh phân số và số thập phân',
        prompt: 'Sắp xếp 4 phiến đá sau theo thứ tự TỪ BÉ ĐẾN LỚN:',
        contextData: {
          stones: sets[1].items,
          expectedOrder: [...sets[1].items].sort((a, b) => a.value - b.value).map((i) => i.label),
        },
        hints: [
          'Có thể đổi phân số ra số thập phân để so sánh: -3/4 = -0.75; 2/5 = 0.4.',
          'Với số âm: -1.2 < -0.75 (vì |-1.2| = 1.2 > 0.75).',
          'Thứ tự đúng: -1.2 < -3/4 < 2/5 < 0.8.',
        ],
        correctAnswerSummary: '-1.2 < -3/4 < 2/5 < 0.8',
      },
      {
        id: `z2_t3_${seed}`,
        zoneId: 2,
        taskIndex: 3,
        title: 'Cầu Đá Thăng Hoa',
        description: 'Vực sâu nhất của Rừng Thứ Tự đòi hỏi 5 phiến đá được xếp hoàn hảo.',
        skill: 'SO_SANH_SAP_XEP',
        skillLabel: 'So sánh nhiều số hữu tỉ',
        prompt: 'Sắp xếp cả 5 phiến đá từ BÉ NHẤT đến LỚN NHẤT:',
        contextData: {
          stones: sets[2].items,
          expectedOrder: [...sets[2].items].sort((a, b) => a.value - b.value).map((i) => i.label),
        },
        hints: [
          'Phân loại số âm: -1, -5/6, -1/3 và số dương: 1/2, 2/3.',
          'Quy đồng các số âm mẫu số chung là 6: -1 = -6/6; -5/6; -1/3 = -2/6. Do đó: -1 < -5/6 < -1/3.',
          'Với số dương: 1/2 = 3/6 < 2/3 = 4/6. Kết hợp lại ta được thứ tự hoàn chỉnh.',
        ],
        correctAnswerSummary: '-1 < -5/6 < -1/3 < 1/2 < 2/3',
      },
    ];
  }

  if (zoneId === 3) {
    // Zone 3: Xưởng Phép Tính
    return [
      {
        id: `z3_t1_${seed}`,
        zoneId: 3,
        taskIndex: 1,
        title: 'Bình Cân Bằng Năng Lượng',
        description: 'Bình mana đang ở mức âm (-1/2 đơn vị). Cần nạp thêm chính xác bao nhiêu đơn vị để năng lượng đạt chuẩn +1?',
        skill: 'CONG_TRU_SO_HUU_TI',
        skillLabel: 'Phép cộng và trừ số hữu tỉ',
        prompt: 'Bình có -1/2 đơn vị, cần thêm x đơn vị để đạt 1 (tức là: -1/2 + x = 1). Tìm x:',
        contextData: {
          currentMana: { num: -1, den: 2 },
          targetMana: { num: 1, den: 1 },
          expectedAnswer: { num: 3, den: 2 }, // 1 - (-1/2) = 3/2 = 1.5
        },
        hints: [
          'Để tìm số hạng chưa biết trong phép cộng: x = Tổng - Số hạng đã biết.',
          'x = 1 - (-1/2) = 1 + 1/2.',
          'Quy đồng mẫu số: 1 + 1/2 = 2/2 + 1/2 = 3/2 (hoặc 1.5).',
        ],
        correctAnswerSummary: '3/2 (hoặc 1.5)',
      },
      {
        id: `z3_t2_${seed}`,
        zoneId: 3,
        taskIndex: 2,
        title: 'Thang Máy Bánh Răng Cơ Học',
        description: 'Thang máy đang ở độ cao -3/4. Mỗi vòng quay bánh răng nâng thang lên 1/4 đơn vị. Cần quay bao nhiêu nhịp để thang đạt độ cao 1/2?',
        skill: 'NHAN_CHIA_SO_HUU_TI',
        skillLabel: 'Phép nhân và chia số hữu tỉ',
        prompt: 'Thang máy ở vị trí -3/4, mỗi nhịp nâng 1/4. Cần bao nhiêu nhịp để đạt vị trí 1/2?',
        contextData: {
          startHeight: { num: -3, den: 4 },
          targetHeight: { num: 1, den: 2 },
          stepSize: { num: 1, den: 4 },
          expectedAnswer: 5, // (1/2 - (-3/4)) / (1/4) = (5/4) / (1/4) = 5
        },
        hints: [
          'Khoảng cách cần nâng là: Độ cao đích - Độ cao ban đầu = 1/2 - (-3/4).',
          '1/2 - (-3/4) = 2/4 + 3/4 = 5/4 đơn vị.',
          'Số nhịp cần nâng = Khoảng cách / Mỗi nhịp = (5/4) : (1/4) = 5 nhịp.',
        ],
        correctAnswerSummary: '5 nhịp',
      },
      {
        id: `z3_t3_${seed}`,
        zoneId: 3,
        taskIndex: 3,
        title: 'Máy Phát Phân Số Nghịch Đảo',
        description: 'Kích hoạt cổng dịch chuyển bằng phép chia hai số hữu tỉ âm.',
        skill: 'NHAN_CHIA_SO_HUU_TI',
        skillLabel: 'Nhân chia hai số hữu tỉ mang dấu âm',
        prompt: 'Tính giá trị của phép chia: (-3/5) : (-6/10) = ?',
        contextData: {
          expression: '(-3/5) : (-6/10)',
          expectedAnswer: { num: 1, den: 1 }, // (-3/5) * (-10/6) = 30/30 = 1
        },
        hints: [
          'Muốn chia cho một phân số, ta nhân với phân số nghịch đảo của nó: (-3/5) * (-10/6).',
          'Hai số cùng dấu âm nhân với nhau sẽ cho kết quả là số dương.',
          'Rút gọn: (-3/5) * (-5/3) = 1.',
        ],
        correctAnswerSummary: '1',
      },
    ];
  }

  if (zoneId === 4) {
    // Zone 4: Tháp Lũy Thừa
    return [
      {
        id: `z4_t1_${seed}`,
        zoneId: 4,
        taskIndex: 1,
        title: 'Bánh Răng Lũy Thừa Cùng Cơ Số',
        description: 'Ghép nối trục quay: Khi nhân hai lũy thừa cùng cơ số, hãy tìm số mũ của bánh răng năng lượng.',
        skill: 'LUY_THUA_CUNG_CO_SO',
        skillLabel: 'Nhân hai lũy thừa cùng cơ số',
        prompt: 'Cho biểu thức: (-2)³ × (-2)² = (-2)ⁿ. Hãy tìm giá trị của n:',
        contextData: {
          base: -2,
          m: 3,
          p: 2,
          expectedN: 5,
        },
        hints: [
          'Quy tắc nhân hai lũy thừa cùng cơ số: xᵐ × xⁿ = xᵐ⁺ⁿ (giữ nguyên cơ số, cộng các số mũ).',
          'Ở đây cơ số là (-2), số mũ là 3 và 2.',
          'Số mũ mới n = 3 + 2 = 5.',
        ],
        correctAnswerSummary: '5',
      },
      {
        id: `z4_t2_${seed}`,
        zoneId: 4,
        taskIndex: 2,
        title: 'Bẫy Dấu Ngoặc & Cơ Số Âm',
        description: 'Hai khóa năng lượng trông rất giống nhau nhưng giá trị hoàn toàn khác nhau. Chọn đúng khóa có giá trị là 9.',
        skill: 'DAU_NGOAC_LUY_THUA',
        skillLabel: 'Phân biệt cơ số âm có ngoặc và không ngoặc',
        prompt: 'Trong hai biểu thức A = (-3)² và B = -3², biểu thức nào có giá trị bằng 9?',
        contextData: {
          optionA: '(-3)²',
          valA: 9,
          optionB: '-3²',
          valB: -9,
          expectedOption: 'A',
        },
        hints: [
          'Biểu thức (-3)² có dấu ngoặc: cơ số là (-3), nghĩa là (-3) × (-3) = 9 (số âm bình phương ra số dương).',
          'Biểu thức -3² không có ngoặc bao quanh dấu trừ: nghĩa là -(3²) = -(3 × 3) = -9.',
          'Do đó biểu thức có giá trị bằng 9 là A (tức là (-3)²).',
        ],
        correctAnswerSummary: 'A (tức (-3)²)',
      },
      {
        id: `z4_t3_${seed}`,
        zoneId: 4,
        taskIndex: 3,
        title: 'Lũy Thừa Của Lũy Thừa & Phép Chia',
        description: 'Mở khóa đỉnh tháp với quy tắc lũy thừa của lũy thừa.',
        skill: 'LUY_THUA_CUA_LUY_THUA',
        skillLabel: 'Lũy thừa của lũy thừa & chia cùng cơ số',
        prompt: 'Cho biểu thức: [(-1/2)²]³ = (-1/2)ⁿ. Tìm số mũ n:',
        contextData: {
          innerPower: 2,
          outerPower: 3,
          expectedN: 6,
        },
        hints: [
          'Quy tắc lũy thừa của lũy thừa: (xᵐ)ⁿ = xᵐ ˣ ⁿ (giữ nguyên cơ số, nhân hai số mũ).',
          'Ở đây số mũ bên trong là 2, số mũ bên ngoài là 3.',
          'n = 2 × 3 = 6.',
        ],
        correctAnswerSummary: '6',
      },
    ];
  }

  // Zone 5: Thành Vương Miện
  return [
    {
      id: `z5_t1_${seed}`,
      zoneId: 5,
      taskIndex: 1,
      title: 'Phong Ấn Tính Hợp Lý',
      description: 'Phong ấn thứ nhất yêu cầu tính giá trị biểu thức bằng cách sử dụng tính chất phân phối một cách hợp lý nhất.',
      skill: 'TINH_HOP_LY',
      skillLabel: 'Tính hợp lý bằng tính chất phân phối',
      prompt: 'Tính nhanh giá trị biểu thức: (7/11) × (3/5) + (7/11) × (2/5) - (7/11) = ?',
      contextData: {
        expression: '(7/11) × (3/5) + (7/11) × (2/5) - (7/11)',
        expectedAnswer: { num: 0, den: 1 }, // (7/11) * (3/5 + 2/5 - 1) = 7/11 * 0 = 0
      },
      hints: [
        'Nhận thấy (7/11) là thừa số chung xuất hiện trong cả ba hạng tử.',
        'Đặt 7/11 làm thừa số chung: (7/11) × (3/5 + 2/5 - 1).',
        'Tính trong ngoặc: 3/5 + 2/5 = 5/5 = 1, và 1 - 1 = 0. Do đó (7/11) × 0 = 0.',
      ],
      correctAnswerSummary: '0',
    },
    {
      id: `z5_t2_${seed}`,
      zoneId: 5,
      taskIndex: 2,
      title: 'Thực Địa Biến Thiên Nhiệt Độ',
      description: 'Ứng dụng số hữu tỉ trong bài toán thực tế đo nhiệt độ trên tháp vương miện.',
      skill: 'TOAN_THUC_TIEN',
      skillLabel: 'Ứng dụng số hữu tỉ vào bài toán thực tiễn',
      prompt: 'Nhiệt độ đỉnh tháp lúc 6h sáng là -2.5°C. Đến 9h sáng, nhiệt độ tăng thêm 1.5°C. Đến 12h trưa, trời nắng ấm tăng tiếp 2.25°C. Hỏi nhiệt độ lúc 12h trưa là bao nhiêu °C?',
      contextData: {
        initialTemp: -2.5,
        change1: 1.5,
        change2: 2.25,
        expectedAnswer: 1.25, // -2.5 + 1.5 + 2.25 = -1 + 2.25 = 1.25
      },
      hints: [
        'Lập biểu thức tính nhiệt độ lúc 12h: (-2.5) + 1.5 + 2.25.',
        'Tính từng bước: (-2.5) + 1.5 = -1.',
        'Sau đó: -1 + 2.25 = 1.25°C (hoặc dạng phân số 5/4).',
      ],
      correctAnswerSummary: '1.25 (hoặc 5/4)',
    },
    {
      id: `z5_t3_${seed}`,
      zoneId: 5,
      taskIndex: 3,
      title: 'Khóa Vương Miện Hoàng Gia',
      description: 'Phong ấn cuối cùng để mở bảo tọa Vương Miện Số Hữu Tỉ. Tìm x thỏa mãn đẳng thức:',
      skill: 'CONG_TRU_SO_HUU_TI',
      skillLabel: 'Tìm ẩn x trong biểu thức số hữu tỉ',
      prompt: 'Tìm x biết: x - (1/3) = -5/6',
      contextData: {
        equation: 'x - 1/3 = -5/6',
        expectedAnswer: { num: -1, den: 2 }, // x = -5/6 + 1/3 = -5/6 + 2/6 = -3/6 = -1/2
      },
      hints: [
        'Muốn tìm số bị trừ x, ta lấy hiệu cộng với số trừ: x = -5/6 + 1/3.',
        'Quy đồng mẫu số chung là 6: 1/3 = 2/6.',
        'x = -5/6 + 2/6 = (-5 + 2)/6 = -3/6. Rút gọn ta được x = -1/2 (hoặc -0.5).',
      ],
      correctAnswerSummary: '-1/2 (hoặc -0.5)',
    },
  ];
}
