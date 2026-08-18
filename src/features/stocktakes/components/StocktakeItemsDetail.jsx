import DocCode from '@/components/ui/DocCode';

/**
 * Giá trị chênh lệch (đếm thực tế - hệ thống): xanh khi dư, đỏ khi thiếu, xám khi khớp.
 * Dùng cả ở cột "Tổng chênh lệch" và trong bảng chi tiết dòng hàng bên dưới.
 */
export function DiffValue({ value }) {
  if (value == null || isNaN(value)) return <span className="text-ink-sub">—</span>;
  const cls = value === 0 ? 'text-ink-sub' : value > 0 ? 'text-[#15803d]' : 'text-[#b91c1c]';
  return <span className={`mono font-semibold ${cls}`}>{value > 0 ? `+${value}` : value}</span>;
}

/**
 * Bảng chi tiết dòng hàng khi mở rộng 1 phiếu kiểm kê qua `expandedRowRender`.
 * Dùng chung giữa StocktakesPage và ReportsPage (cùng nguồn dữ liệu STOCKTAKES).
 */
export default function StocktakeItemsDetail({ items, note }) {
  return (
    <div className="rounded-lg bg-slate-50/70 p-1">
      {note && (
        <p className="m-0 px-3 pb-2 pt-2 text-sm text-ink-sub">
          <span className="font-semibold text-ink">Ghi chú: </span>
          {note}
        </p>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-ink-sub">
              <th className="px-3 py-2 font-semibold">Sản phẩm</th>
              <th className="px-3 py-2 font-semibold">Lô</th>
              <th className="px-3 py-2 font-semibold">Vị trí</th>
              <th className="px-3 py-2 text-right font-semibold">Tồn hệ thống</th>
              <th className="px-3 py-2 text-right font-semibold whitespace-nowrap">Số lượng thực tế</th>
              <th className="px-3 py-2 text-right font-semibold">Hư hỏng</th>
              <th className="px-3 py-2 text-right font-semibold">Lệch</th>
              <th className="px-3 py-2 font-semibold">Ghi chú</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={i} className="border-t border-slate-200/70">
                <td className="px-3 py-2 text-ink">{it.productName}</td>
                <td className="px-3 py-2"><DocCode muted>{it.lot}</DocCode></td>
                <td className="px-3 py-2"><span className="mono text-ink-sub">{it.location}</span></td>
                <td className="px-3 py-2 text-right mono">{it.systemQty}</td>
                <td className="px-3 py-2 text-right">
                  {it.countedQty != null ? (
                    <span className="mono">{it.countedQty}</span>
                  ) : (
                    <span className="text-orange-600 bg-orange-50 px-2 py-0.5 rounded text-[11px] font-medium border border-orange-200">
                      Chưa kiểm tra số lượng thực tế
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-right mono">
                  {it.damagedQty > 0 ? (
                    <span className="text-[#b91c1c] font-semibold">{it.damagedQty}</span>
                  ) : (
                    <span className="text-ink-sub">0</span>
                  )}
                </td>
                <td className="px-3 py-2 text-right">
                  {it.countedQty != null ? (
                    <DiffValue value={it.systemQty - it.countedQty} />
                  ) : (
                    <span className="text-ink-sub">—</span>
                  )}
                </td>
                <td className="px-3 py-2 text-ink-sub max-w-[200px] truncate">{it.note || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
