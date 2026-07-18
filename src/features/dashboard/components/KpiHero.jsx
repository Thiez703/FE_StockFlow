import { ArrowUpOutlined, DatabaseOutlined } from '@ant-design/icons';
import { formatCurrency, formatNumber } from '@/utils/formatCurrency';
import { KPIS, TREND } from '@/mock/dashboard';
import { INVENTORY } from '@/mock/inventory';
import { LOTS } from '@/mock/lots';

/**
 * KPI "hero" nổi bật: Tổng giá trị tồn kho — thẻ nền navy gradient, số lớn,
 * kèm sparkline tĩnh (giá trị tồn theo tháng) và vài chỉ số phụ.
 */
export default function KpiHero() {
  const maxStock = Math.max(...TREND.map((t) => t.stock));

  return (
    <div className="relative h-full overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#0A1E3F_0%,#12356B_60%,#1E3A8A_100%)] p-6 text-white">
      {/* Hoạ tiết kệ kho mờ ở nền */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-col gap-3 p-6 opacity-[0.06]">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-6 rounded bg-white" />
        ))}
      </div>

      <div className="relative">
        <div className="flex items-center gap-2 text-[13px] font-medium text-[#a9c1ee]">
          <DatabaseOutlined /> Tổng giá trị tồn kho
        </div>
        <div className="mt-2 text-[34px] font-bold leading-none tracking-tight">
          {formatCurrency(KPIS.totalInventoryValue)}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 rounded-full bg-[#16a34a]/25 px-2 py-0.5 font-semibold text-[#86efac]">
            <ArrowUpOutlined /> 6,4%
          </span>
          <span className="text-[#a9c1ee]">so với tháng trước</span>
        </div>

        {/* Sparkline giá trị tồn theo tháng */}
        <div className="mt-6 flex h-16 items-end gap-1.5">
          {TREND.map((t) => (
            <div
              key={t.label}
              className="flex-1 rounded-t bg-[linear-gradient(180deg,#3B74F5,#1E5AF0)]"
              style={{ height: `${(t.stock / maxStock) * 100}%` }}
              title={`${t.label}: ${t.stock} tr`}
            />
          ))}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4 border-t border-white/10 pt-4">
          <div>
            <div className="text-lg font-bold">{formatNumber(INVENTORY.length)}</div>
            <div className="text-xs text-[#a9c1ee]">Mặt hàng đang tồn</div>
          </div>
          <div>
            <div className="text-lg font-bold">{formatNumber(LOTS.length)}</div>
            <div className="text-xs text-[#a9c1ee]">Lô hàng theo dõi</div>
          </div>
        </div>
      </div>
    </div>
  );
}
