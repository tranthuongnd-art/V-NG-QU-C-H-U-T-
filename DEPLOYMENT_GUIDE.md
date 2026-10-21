# 👑 VƯƠNG QUỐC SỐ HỮU TỈ – TOÁN 7
## Hướng Dẫn Vận Hành & Triển Khai Kỹ Thuật

Ứng dụng game giáo dục phiêu lưu khối hộp 2.5D ôn tập toàn diện **Chương I: Số Hữu Tỉ** (Sách giáo khoa *Kết nối tri thức với cuộc sống*).

---

### 1. HAI CHẾ ĐỘ HOẠT ĐỘNG (OPERATING MODES)

#### Chế độ A: Chơi Thử (Trial Mode) – Mặc định sẵn sàng
- **Đặc điểm**: Chạy ngay lập tức không cần đăng ký tài khoản hay cấu hình Firebase.
- **Biển báo**: Luôn hiển thị thanh thông báo rõ ràng `CHƠI THỬ – Không đồng bộ tài khoản`.
- **Phạm vi hoạt động**: Toàn bộ 5 hòn đảo, toàn bộ câu đố toán học (đặt trụ cầu trên trục số, xếp phiến đá đầm lầy, điều khiển thang máy cơ khí, khóa lũy thừa, phong ấn vương miện) và Bảng Quản Lý Giáo Viên đều chạy mượt mà trực tiếp trên trình duyệt.

#### Chế độ B: Trực Tuyến (Online Mode) – Khi cấu hình Firebase
- **Đặc điểm**: Dữ liệu tiến trình, mạng sống, XP và nhật ký từng lượt nộp bài của học sinh được đồng bộ thời gian thực lên Cloud Firestore.
- **Kích hoạt**: Cung cấp các biến môi trường trong file `.env` (xem `.env.example`).

---

### 2. CẤU TRÚC 5 VÙNG & CƠ CHẾ TOÁN HỌC

1. **Vùng 1 – Bến Khởi Nguyên**:
   - *Kiến thức*: Nhận biết, biểu diễn số hữu tỉ trên trục số, số đối.
   - *Cơ chế*: Đặt trụ cầu trên trục số. Đặt đúng làm trồi lên trụ cầu gỗ và các nhịp cầu bắc qua vực sương mù.
   - *Chẩn đoán sai*: Chỉ rõ sai số đối, sai hướng trái/phải số 0.

2. **Vùng 2 – Rừng Thứ Tự**:
   - *Kiến thức*: So sánh, sắp xếp số hữu tỉ âm, dương và số 0.
   - *Cơ chế*: Sắp xếp các phiến đá theo thứ tự từ bé đến lớn. Khi đúng, nhân vật bước qua từng phiến đá an toàn.

3. **Vùng 3 – Xưởng Phép Tính**:
   - *Kiến thức*: Bốn phép tính $+$, $-$, $\times$, $\div$ số hữu tỉ.
   - *Cơ chế*:
     - Nạp dung dịch năng lượng: Cân bằng từ mức âm lên mức $+1$.
     - Thang máy cơ khí: Tính số vòng quay bánh răng để thang nâng từ độ cao $-3/4$ lên $+1/2$.
     - Phép chia nghịch đảo bánh răng: $(-3/5) \div (-6/10) = 1$.

4. **Vùng 4 – Tháp Lũy Thừa**:
   - *Kiến thức*: Nhân chia lũy thừa cùng cơ số, lũy thừa của lũy thừa, phân biệt dấu ngoặc $(-a)^2$ và $-a^2$.
   - *Cơ chế*: Ghép bánh răng điện áp và mở 2 khóa năng lượng. Phản hồi chỉ rõ nhầm phép nhân số mũ thay vì cộng số mũ.

5. **Vùng 5 – Thành Vương Miện**:
   - *Kiến thức*: Tính hợp lý (tính chất phân phối $a(b+c)$), bài toán thực tiễn biến thiên nhiệt độ và giải phương trình tìm ẩn $x$.
   - *Cơ chế*: Phá giải 3 phong ấn phong vương, trao Vương Miện Hoàng Gia với pháo hoa và chứng nhận vinh danh.

---

### 3. TÀI KHOẢN HỌC SINH & BẢNG QUẢN LÝ GIÁO VIÊN

- **Mã học sinh nội bộ**: Học sinh không cần cung cấp email cá nhân. Giáo viên cấp mã định danh duy nhất (ví dụ: `7A10-01`, `7A10-02`...).
- **Nhập danh sách học sinh bằng CSV**:
  - Hỗ trợ xem trước (preview) và kiểm tra trùng mã trước khi lưu.
  - Định dạng: `STT,MaHS,HoVaTen,BietDanh,Lop`
- **Xuất báo cáo Excel**:
  - Tích hợp chuẩn **UTF-8 BOM (`\uFEFF`)** giúp mở file CSV trực tiếp bằng Microsoft Excel tại Việt Nam mà không bị lỗi font tiếng Việt.
- **Phân loại thành thạo học sinh**:
  - *Chưa làm*
  - *Đúng lần đầu (Không dùng gợi ý)*
  - *Đúng lần đầu (Có dùng gợi ý)*
  - *Đúng sau khi thử lại*
  - Đánh giá thành thạo chỉ kích hoạt khi có tối thiểu 5 lượt làm thật (tránh đánh đồng điểm số với độ thuần thục).

---

### 4. BẢO MẬT & FIRESTORE RULES (`firestore.rules`)

File `firestore.rules` đã được thiết lập nghiêm ngặt:
- Học sinh chỉ có quyền đọc tài khoản của mình và ghi thêm lượt nộp bài (`attempts`), không được sửa đổi nhật ký lịch sử đã gửi.
- Giáo viên có quyền quản lý toàn bộ học sinh trong lớp mình quản lý.
- Điểm XP và trạng thái nhiệm vụ được bảo vệ chống client giả mạo điểm số.
