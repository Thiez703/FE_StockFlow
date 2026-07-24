import { Modal } from 'antd';

/**
 * Modal xem chi tiết 1 phiếu (nhập/xuất/kiểm kê...) dùng chung: tiêu đề là mã phiếu,
 * `fields` là các cặp nhãn/giá trị thông tin chung (ngày, người tạo, trạng thái...),
 * `children` là nội dung chi tiết dòng hàng (DocItemsDetail/StocktakeItemsDetail...).
 */
export default function DocDetailModal({ open, onClose, title, fields, children }) {
  const safeFields = fields ?? [];
  return (
    <Modal open={open} onCancel={onClose} footer={null} title={title} width={720} destroyOnHidden>
      {safeFields.length > 0 && (
        <div className="mb-4 grid grid-cols-2 gap-x-4 gap-y-3 rounded-lg bg-slate-50/70 p-3 text-sm sm:grid-cols-3">
          {safeFields.map((f) => (
            <div key={f.label} className="min-w-0">
              <div className="text-xs text-ink-sub">{f.label}</div>
              <div className="truncate font-medium text-ink">{f.value}</div>
            </div>
          ))}
        </div>
      )}
      {children}
    </Modal>
  );
}
