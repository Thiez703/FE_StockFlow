import { Card } from 'antd';
import { formatCurrency, formatNumber } from '@/utils/formatCurrency';

/** Thẻ tóm tắt bên phải màn hình lập phiếu. Chỉ đếm dòng đã chọn được vị trí. */
export default function OrderSummary({ rows = [] }) {
  const filled = rows.filter((r) => r.cellKey);
  const totalQty = filled.reduce((s, r) => s + (Number(r.quantity) || 0), 0);
  const totalAmount = filled.reduce(
    (s, r) => s + (Number(r.quantity) || 0) * (Number(r.unitPrice) || 0),
    0,
  );

  return (
    <Card className="border-hair" styles={{ body: { padding: 22 } }}>
      <h3 className="m-0 text-base font-semibold text-ink">Tổng kết phiếu</h3>
      <div className="mt-4 flex flex-col gap-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-ink-sub">Số dòng hàng</span>
          <span className="font-medium text-ink">{filled.length} dòng</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-ink-sub">Tổng số lượng</span>
          <span className="font-medium text-ink">{formatNumber(totalQty)} đơn vị</span>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between rule-dashed-top pt-4">
        <span className="text-sm font-medium text-ink-sub">Tổng giá trị</span>
        <span className="text-xl font-bold text-royal">{formatCurrency(totalAmount)}</span>
      </div>
    </Card>
  );
}
