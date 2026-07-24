/**
 * Ép remount 1 khối nội dung (thường là DataTable) mỗi khi tập dữ liệu hiển thị
 * đổi (đổi bộ lọc, đổi trang, đổi lựa chọn...), để hiệu ứng "cascade" từng dòng
 * của `.enterprise-table` (định nghĩa ở index.css) chạy lại từ đầu. `dataKey`
 * phải là 1 chuỗi ổn định đại diện cho tập dữ liệu hiện tại (vd danh sách id nối
 * lại bằng dấu phẩy).
 */
export default function FadeSection({ dataKey, children }) {
  return <div key={dataKey}>{children}</div>;
}
