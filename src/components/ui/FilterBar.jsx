/**
 * Thanh lọc phía trên bảng: khung trắng bo góc chứa các control (ô tìm kiếm,
 * select trạng thái, khoảng ngày...). Chỉ là layout — control cụ thể do trang truyền vào.
 * `extra` hiển thị dồn về bên phải (vd nút phụ, bộ đếm kết quả).
 */
export default function FilterBar({ children, extra, className = '' }) {
  return (
    <div
      className={`mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-hair bg-white p-3 ${className}`}
    >
      {children}
      {extra && <div className="ml-auto flex items-center gap-2">{extra}</div>}
    </div>
  );
}
