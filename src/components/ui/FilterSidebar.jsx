import { Button } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Khung sidebar bộ lọc dùng chung (tiêu đề "Bộ lọc" + nút "Xoá lọc" khi có
 * filter đang bật). Control cụ thể do trang truyền vào qua children.
 */
export default function FilterSidebar({ hasActiveFilters, onClear, children }) {
  return (
    <aside className="w-full shrink-0 lg:w-64">
      <div className="flex flex-col gap-3 rounded-2xl border border-hair bg-white p-4">
        <div className="flex items-center justify-between">
          <h4 className="m-0 text-sm font-semibold text-ink">Bộ lọc</h4>
          <AnimatePresence>
            {hasActiveFilters && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <Button type="link" size="small" className="!px-0" onClick={onClear}>
                  Xoá lọc
                </Button>
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        {children}
      </div>
    </aside>
  );
}
