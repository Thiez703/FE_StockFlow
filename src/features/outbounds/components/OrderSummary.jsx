import { Card } from 'antd';
import { useWatch } from 'react-hook-form';
import { formatCurrency, formatNumber } from '@/utils/formatCurrency';

export default function OrderSummary({ control }) {
  const items = useWatch({ control, name: 'items' }) ?? [];
  const totalQty = items.reduce((s, it) => s + (Number(it?.quantity) || 0), 0);
  const totalAmount = items.reduce(
    (s, it) => s + (Number(it?.quantity) || 0) * (Number(it?.unitPrice) || 0),
    0,
  );

  return (
    <Card className="border-hair" styles={{ body: { padding: 22 } }}>
      <h3 className="m-0 text-base font-semibold text-ink">Tổng kết phiếu</h3>
      <div className="mt-4 flex flex-col gap-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-ink-sub">Số mặt hàng</span>
          <span className="font-medium text-ink">{items.length} sản phẩm</span>
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
