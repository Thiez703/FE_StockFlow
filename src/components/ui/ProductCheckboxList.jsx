import { useState, useMemo } from 'react';
import { Input, Button, Checkbox, Tag } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';

// Rotating tag colors for visual distinction
const TAG_COLORS = ['blue', 'green', 'purple', 'orange', 'cyan', 'magenta', 'geekblue', 'lime', 'gold', 'volcano'];

/**
 * Unified product selection with checkboxes.
 * Supports selecting one or multiple products at once.
 *
 * Props:
 * - productOptions: Array of { value, label, unit?, categoryName? }
 * - selectedProductIds: Set of already-selected product IDs (from existing rows)
 * - onAdd(productIds): callback with array of selected product IDs
 * - onClose(): close modal/drawer
 * - singleMode: if true, select one and immediately call onAdd([id]) + onClose()
 */
export default function ProductCheckboxList({
  productOptions = [],
  selectedProductIds = new Set(),
  onAdd,
  onClose,
  singleMode = false,
}) {
  const [search, setSearch] = useState('');
  const [checked, setChecked] = useState(new Set());

  const filtered = useMemo(() => {
    const kw = search.trim().toLowerCase();
    if (!kw) return productOptions;
    return productOptions.filter((p) =>
      p.label.toLowerCase().includes(kw)
    );
  }, [productOptions, search]);

  const handleToggle = (id) => {
    if (singleMode) {
      onAdd([id]);
      onClose();
      return;
    }
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAddAll = () => {
    if (checked.size === 0) return;
    onAdd([...checked]);
    onClose();
  };

  const handleSelectAll = () => {
    const allIds = filtered.filter((p) => !selectedProductIds.has(p.value)).map((p) => p.value);
    setChecked(new Set(allIds));
  };

  const handleDeselectAll = () => {
    setChecked(new Set());
  };

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Search bar */}
      <Input
        prefix={<SearchOutlined className="text-slate-400" />}
        placeholder="Tìm kiếm sản phẩm..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        allowClear
        size="large"
      />

      {/* Batch actions (multi mode) */}
      {!singleMode && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button size="small" type="link" onClick={handleSelectAll} className="!px-0">
              Chọn tất cả
            </Button>
            <span className="text-slate-300">|</span>
            <Button size="small" type="link" onClick={handleDeselectAll} className="!px-0">
              Bỏ chọn
            </Button>
          </div>
          <span className="text-xs text-slate-400">
            {checked.size > 0 && (
              <Tag color="blue" className="!mr-0">{checked.size} đã chọn</Tag>
            )}
          </span>
        </div>
      )}

      {/* Product list */}
      <div className="flex flex-col gap-1.5 max-h-[50vh] overflow-y-auto pr-1">
        {filtered.length === 0 && (
          <div className="text-center py-8 text-slate-400">Không tìm thấy sản phẩm.</div>
        )}
        {filtered.map((p, idx) => {
          const isAlreadyInRows = selectedProductIds.has(p.value);
          const isChecked = checked.has(p.value);
          const tagColor = TAG_COLORS[idx % TAG_COLORS.length];

          return (
            <div
              key={p.value}
              onClick={() => !isAlreadyInRows && handleToggle(p.value)}
              className={`flex items-center gap-3 rounded-xl border-2 px-3 py-2.5 transition-all ${
                isAlreadyInRows
                  ? 'border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed'
                  : isChecked
                    ? 'border-blue-400 bg-blue-50/60 shadow-sm cursor-pointer'
                    : 'border-slate-200 bg-white hover:border-slate-300 cursor-pointer'
              }`}
            >
              {!singleMode && (
                <Checkbox
                  checked={isChecked}
                  disabled={isAlreadyInRows}
                  className="pointer-events-none"
                />
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`font-bold text-sm ${isAlreadyInRows ? 'text-slate-400' : 'text-slate-800'}`}>
                    {p.label}
                  </span>
                  {isAlreadyInRows && (
                    <Tag color="default" bordered={false} className="!text-[10px] !mr-0">Đã thêm</Tag>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  {p.unit && (
                    <Tag color={tagColor} bordered={false} className="!text-[10px] !mr-0">
                      {p.unit}
                    </Tag>
                  )}
                  {p.categoryName && (
                    <span className="text-[11px] text-slate-400">{p.categoryName}</span>
                  )}
                </div>
              </div>

              {singleMode && !isAlreadyInRows && (
                <span className="text-blue-500 text-xs font-bold">Chọn</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Add button (multi mode) */}
      {!singleMode && (
        <div className="pt-2 border-t border-slate-200">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            block
            disabled={checked.size === 0}
            onClick={handleAddAll}
          >
            Thêm {checked.size > 0 ? `${checked.size} sản phẩm` : 'sản phẩm đã chọn'}
          </Button>
        </div>
      )}
    </div>
  );
}
