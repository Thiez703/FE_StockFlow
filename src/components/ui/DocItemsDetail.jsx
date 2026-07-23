import DocCode from '@/components/ui/DocCode';
import { formatCurrency, formatNumber } from '@/utils/formatCurrency';

/**
 * Bảng chi tiết dòng hàng khi mở rộng 1 phiếu (nhập/xuất) qua `expandedRowRender`.
 */
export default function DocItemsDetail({ items }) {
  return (
    <div className="rounded-lg bg-slate-50/70 p-1">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-ink-sub">
            <th className="px-3 py-2 font-semibold">Sản phẩm</th>
            <th className="px-3 py-2 font-semibold">Lô</th>
            <th className="px-3 py-2 font-semibold">ĐVT</th>
            <th className="px-3 py-2 text-right font-semibold">SL</th>
            <th className="px-3 py-2 text-right font-semibold">Đơn giá</th>
            <th className="px-3 py-2 text-right font-semibold">Thành tiền</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, i) => (
            <tr key={i} className="border-t border-slate-200/70">
              <td className="px-3 py-2 text-ink">{it.productName}</td>
              <td className="px-3 py-2"><DocCode muted>{it.lot}</DocCode></td>
              <td className="px-3 py-2 text-ink-sub">{it.unit}</td>
              <td className="px-3 py-2 text-right mono">{formatNumber(it.quantity)}</td>
              <td className="px-3 py-2 text-right mono">{formatCurrency(it.unitPrice)}</td>
              <td className="px-3 py-2 text-right font-semibold text-ink">
                {formatCurrency(it.quantity * it.unitPrice)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
