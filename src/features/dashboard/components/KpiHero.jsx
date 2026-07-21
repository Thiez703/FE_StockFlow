import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpOutlined, DatabaseOutlined, AppstoreOutlined, ContainerOutlined } from '@ant-design/icons';
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
  const [hoverIndex, setHoverIndex] = useState(null);
  const activeIndex = hoverIndex ?? 0;

  return (
    <div className="relative h-full overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#0A1E3F_0%,#12356B_60%,#1E3A8A_100%)] p-6 text-white">
      {/* Glow ánh sáng tạo chiều sâu — nền tối giản, không hoạ tiết */}
      <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-royal-500/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-amber/20 blur-3xl" />

      <div className="relative">
        <div className="flex items-center gap-2 text-[13px] font-medium text-[#a9c1ee]">
          <DatabaseOutlined /> Tổng giá trị tồn kho
        </div>
        <span className="shelf-line mt-2 block" />
        <div className="mt-3 text-[34px] font-bold leading-none tracking-tight">
          {formatCurrency(KPIS.totalInventoryValue)}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 rounded-full bg-[#16a34a]/25 px-2 py-0.5 font-semibold text-[#86efac]">
            <ArrowUpOutlined /> 6,4%
          </span>
          <span className="text-[#a9c1ee]">so với tháng trước</span>
        </div>

        {/* Sparkline giá trị tồn theo tháng — hover hiện tooltip trượt mượt */}
        <div className="relative mt-6" onMouseLeave={() => setHoverIndex(null)}>
          <div className="flex h-16 items-end gap-1.5">
            {TREND.map((t, i) => (
              <div
                key={t.label}
                className={`flex-1 rounded-t transition-colors duration-150 ${
                  hoverIndex === i
                    ? 'bg-[linear-gradient(180deg,#93B4FB,#3B74F5)]'
                    : 'bg-[linear-gradient(180deg,#3B74F5,#1E5AF0)]'
                }`}
                style={{ height: `${(t.stock / maxStock) * 100}%` }}
                onMouseEnter={() => setHoverIndex(i)}
              />
            ))}
          </div>

          <motion.div
            className="pointer-events-none absolute bottom-full mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-ink shadow-lg"
            initial={false}
            animate={{
              left: `${((activeIndex + 0.5) / TREND.length) * 100}%`,
              opacity: hoverIndex !== null ? 1 : 0,
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
          >
            {TREND[activeIndex].label} · {formatNumber(TREND[activeIndex].stock)} tr
            <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-white" />
          </motion.div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4 border-t border-white/10 pt-4">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-[15px]">
              <AppstoreOutlined />
            </span>
            <div>
              <div className="text-lg font-bold leading-tight">{formatNumber(INVENTORY.length)}</div>
              <div className="text-xs text-[#a9c1ee]">Mặt hàng đang tồn</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-[15px]">
              <ContainerOutlined />
            </span>
            <div>
              <div className="text-lg font-bold leading-tight">{formatNumber(LOTS.length)}</div>
              <div className="text-xs text-[#a9c1ee]">Lô hàng theo dõi</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
