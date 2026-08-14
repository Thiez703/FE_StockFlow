import { useState, useMemo } from 'react';
import { Card, Button, InputNumber, Input, Empty, Spin, Popconfirm, Drawer, Modal, Select, Segmented } from 'antd';
import { PlusOutlined, DeleteOutlined, CheckCircleFilled, UnorderedListOutlined, AppstoreOutlined } from '@ant-design/icons';
import { formatNumber } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/date';
import { useIsMobile } from '@/hooks/useIsMobile';
import MobileQuantityInput from '@/components/ui/MobileQuantityInput';
import { REASON_OPTIONS } from '@/features/abnormal-stocks/constants/reasonTypes';
import StorageMapSelector from '@/components/ui/StorageMapSelector';

function ProductSelectionList({ productOptions, currentProductId, onSelect, onClose }) {
  const [search, setSearch] = useState('');
  const filtered = productOptions.filter((p) => p.label.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex h-full flex-col gap-3">
      <Input.Search
        placeholder="Tìm kiếm sản phẩm..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        allowClear
      />
      <div className="flex max-h-[50vh] flex-col gap-2 overflow-y-auto pr-1">
        {filtered.length === 0 && <div className="py-4 text-center text-slate-400">Không tìm thấy sản phẩm.</div>}
        {filtered.map((p) => {
          const isSelected = p.value === currentProductId;
          return (
            <button
              key={p.value}
              type="button"
              onClick={() => {
                onSelect(p.value);
                onClose();
              }}
              className={`flex flex-col rounded-xl border-2 p-3 text-left transition-colors ${
                isSelected ? 'border-royal bg-blue-50/50' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex w-full items-center justify-between">
                <span className="font-bold text-slate-800">{p.label}</span>
                {isSelected && <span className="font-bold text-royal">✓</span>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function LotSelectionCards({ cells, productId, currentCellKey, onSelect, onClose }) {
  const lotCells = cells.filter((c) => c.productId === productId);

  return (
    <div className="flex flex-col gap-2">
      {lotCells.map((c) => {
        const selected = c.key === currentCellKey;
        return (
          <button
            key={c.key}
            type="button"
            onClick={() => {
              onSelect(c.key);
              onClose();
            }}
            className={`flex w-full flex-col gap-1 rounded-xl border-2 p-3 text-left transition-colors active:bg-slate-50 ${
              selected ? 'border-royal bg-blue-50/50' : 'border-hair bg-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="mono text-sm font-bold text-ink">{c.lotCode}</span>
              {selected && <CheckCircleFilled className="ml-auto text-royal" />}
            </div>
            <div className="flex items-center gap-4 text-xs text-ink-sub">
              <span>
                Vị trí: <strong className="text-ink">{c.locationCode}</strong>
              </span>
              {c.expDate && (
                <span>
                  HSD: <strong className="text-ink">{formatDate(c.expDate)}</strong>
                </span>
              )}
              <span>
                Tồn: <strong className="text-ink">{formatNumber(c.quantity)}</strong>
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export default function AbnormalLineItemsTable({ rows, cells, cellByKey, isLoading, onPatchRow, onAddRow, onRemoveRow }) {
  const isMobile = useIsMobile();
  const [manualLotSelection, setManualLotSelection] = useState({});
  const [lotModal, setLotModal] = useState({ open: false, rowKey: null, productId: null });
  const [productModal, setProductModal] = useState({ open: false, rowKey: null });
  const [lotViewMode, setLotViewMode] = useState('list'); // 'list' | 'map'

  const toggleManualLot = (rowKey, show) => {
    setManualLotSelection((prev) => ({ ...prev, [rowKey]: show }));
  };

  const productOptions = useMemo(() => {
    const map = new Map();
    cells.forEach((c) => {
      if (!map.has(c.productId)) {
        map.set(c.productId, {
          value: c.productId,
          label: `${c.productCode} — ${c.productName}`,
        });
      }
    });
    return Array.from(map.values());
  }, [cells]);

  const cellOptions = useMemo(
    () =>
      cells.map((c) => ({
        value: c.key,
        productId: c.productId,
        label:
          `${c.locationCode} · ${c.lotCode}` +
          (c.expDate ? ` · HSD ${formatDate(c.expDate)}` : '') +
          ` — ${c.productName} (tồn ${formatNumber(c.quantity)})`,
      })),
    [cells]
  );

  const totalQty = rows.reduce((sum, r) => sum + (r.cellKey ? r.quantity || 0 : 0), 0);

  const handleSelectProduct = (rowKey, productId) => {
    onPatchRow(rowKey, { cellKey: undefined });
    // Tự động mở modal chọn lô sau khi chọn sản phẩm
    setTimeout(() => {
      setLotModal({ open: true, rowKey, productId });
    }, 150);
  };

  const handleSelectLot = (rowKey, cellKey) => {
    const next = cellByKey.get(cellKey);
    onPatchRow(rowKey, {
      cellKey,
      quantity: Math.min(1, next?.quantity ?? 1),
    });
  };

  const renderMobileRow = (r) => {
    const cell = r.cellKey ? cellByKey.get(r.cellKey) : null;

    return (
      <div key={r.key} className="rounded-xl border border-hair bg-white p-3">
        <div className="mb-3">
          <span className="mb-1.5 block text-xs font-semibold text-slate-400">Sản phẩm</span>
          {(() => {
            const product = productOptions.find((p) => p.value === cell?.productId);
            return (
              <Button
                type="dashed"
                onClick={() => setProductModal({ open: true, rowKey: r.key })}
                className="flex min-h-[44px] w-full items-center justify-between px-3 text-left"
              >
                <span className="truncate">{product?.label || 'Bấm chọn sản phẩm...'}</span>
              </Button>
            );
          })()}
        </div>

        {cell && (
          <div className="mb-3">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400">Lô hàng & Vị trí</span>
              <button
                type="button"
                onClick={() => setLotModal({ open: true, rowKey: r.key, productId: cell.productId })}
                className="ml-auto border-0 bg-transparent text-xs font-semibold text-royal active:text-royal-500"
              >
                Đổi lô
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-2">
              <span className="mono text-sm font-bold text-ink">{cell.lotCode}</span>
              <span className="text-xs text-ink-sub">· {cell.locationCode}</span>
              {cell.expDate && <span className="text-xs text-ink-sub">· HSD {formatDate(cell.expDate)}</span>}
            </div>
          </div>
        )}

        {cell && (
          <div className="mb-3">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Số lượng</span>
              <span className="text-xs text-ink-sub">Tồn: {formatNumber(cell.quantity)}</span>
            </div>
            <MobileQuantityInput
              value={r.quantity}
              onChange={(v) => onPatchRow(r.key, { quantity: v ?? 1 })}
              min={1}
              max={cell.quantity}
            />
          </div>
        )}

        {cell && (
          <div className="mb-3">
            <span className="mb-1.5 block text-xs font-semibold text-slate-400">Loại bất thường</span>
            <Select
              placeholder="Chọn loại"
              options={REASON_OPTIONS}
              value={r.reasonType}
              onChange={(v) => onPatchRow(r.key, { reasonType: v })}
              className="w-full"
            />
          </div>
        )}

        {cell && (
          <div className="mb-3">
            <span className="mb-1.5 block text-xs font-semibold text-slate-400">Diễn giải</span>
            <Input
              placeholder="VD: Thùng bị móp khi bốc dỡ"
              value={r.note}
              onChange={(e) => onPatchRow(r.key, { note: e.target.value })}
            />
          </div>
        )}

        {rows.length > 1 && (
          <div className="mt-3 flex justify-end">
            {r.cellKey ? (
              <Popconfirm
                title="Xóa dòng này?"
                description="Dòng đã có dữ liệu, bạn có chắc chắn muốn xóa?"
                onConfirm={() => onRemoveRow(r.key)}
                okText="Xóa"
                cancelText="Hủy"
                okButtonProps={{ danger: true }}
              >
                <Button type="text" danger size="small" icon={<DeleteOutlined />} className="min-h-[44px]">
                  Xóa dòng
                </Button>
              </Popconfirm>
            ) : (
              <Button
                type="text"
                danger
                size="small"
                icon={<DeleteOutlined />}
                onClick={() => onRemoveRow(r.key)}
                className="min-h-[44px]"
              >
                Xóa dòng
              </Button>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderDesktopRow = (r) => {
    const cell = r.cellKey ? cellByKey.get(r.cellKey) : null;
    const isManual = manualLotSelection[r.key];

    return (
      <div key={r.key} className="border-b border-slate-100 last:border-b-0">
        <div className="grid grid-cols-12 items-start gap-3 px-4 py-3">
          <div className="col-span-12 md:col-span-4">
            {!isManual ? (
              <Button
                type="dashed"
                onClick={() => setProductModal({ open: true, rowKey: r.key })}
                className="flex min-h-[40px] w-full items-center justify-between px-3 text-left"
              >
                <span className="truncate">
                  {productOptions.find((p) => p.value === cell?.productId)?.label || 'Bấm chọn sản phẩm...'}
                </span>
              </Button>
            ) : (
              <div className="flex flex-col items-start gap-2">
                <Button
                  type="dashed"
                  onClick={() => setLotModal({ open: true, rowKey: r.key, productId: cell.productId })}
                  className="flex w-full justify-between text-left"
                >
                  <span className="text-slate-500">Bấm để chọn lô hàng khác...</span>
                </Button>
              </div>
            )}

            {cell && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-ink-sub">
                <span className="rounded bg-slate-100 px-1.5 py-0.5 font-medium text-slate-600">
                  Lô: {cell.lotCode}
                </span>
                <span className="rounded bg-slate-100 px-1.5 py-0.5 font-medium text-slate-600">
                  Vị trí: {cell.locationCode}
                </span>
                {!isManual ? (
                  <span
                    className="ml-auto cursor-pointer text-[11px] font-medium text-blue-500 hover:text-blue-600"
                    onClick={() => toggleManualLot(r.key, true)}
                  >
                    Chọn lô khác
                  </span>
                ) : (
                  <span
                    className="ml-auto cursor-pointer text-[11px] font-medium text-slate-400 hover:text-slate-600"
                    onClick={() => {
                      toggleManualLot(r.key, false);
                    }}
                  >
                    Hủy chọn lô khác
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="col-span-6 md:col-span-2">
            <span className="mb-1 block text-xs font-medium text-slate-400 md:hidden">Số lượng</span>
            <InputNumber
              min={1}
              max={cell?.quantity ?? undefined}
              value={r.quantity}
              onChange={(v) => onPatchRow(r.key, { quantity: v ?? 1 })}
              className="w-full"
              disabled={!cell}
            />
            {cell && <div className="mt-1 text-right text-xs text-ink-sub">Tồn: {formatNumber(cell.quantity)}</div>}
          </div>

          <div className="col-span-6 md:col-span-2">
            <span className="mb-1 block text-xs font-medium text-slate-400 md:hidden">Loại bất thường</span>
            <Select
              placeholder="Chọn loại"
              options={REASON_OPTIONS}
              value={r.reasonType}
              onChange={(v) => onPatchRow(r.key, { reasonType: v })}
              className="w-full"
              disabled={!cell}
            />
          </div>

          <div className="col-span-8 md:col-span-3">
            <span className="mb-1 block text-xs font-medium text-slate-400 md:hidden">Diễn giải</span>
            <Input
              placeholder="VD: Thùng bị móp khi bốc dỡ"
              value={r.note}
              onChange={(e) => onPatchRow(r.key, { note: e.target.value })}
              disabled={!cell}
            />
          </div>

          <div className="col-span-4 flex justify-end self-center md:col-span-1">
            {r.cellKey ? (
              <Popconfirm
                title="Xóa dòng này?"
                description="Dòng đã có dữ liệu, bạn có chắc chắn muốn xóa?"
                onConfirm={() => onRemoveRow(r.key)}
                okText="Xóa"
                cancelText="Hủy"
                okButtonProps={{ danger: true }}
                disabled={rows.length <= 1}
              >
                <Button type="text" danger size="small" icon={<DeleteOutlined />} disabled={rows.length <= 1} />
              </Popconfirm>
            ) : (
              <Button
                type="text"
                danger
                size="small"
                icon={<DeleteOutlined />}
                disabled={rows.length <= 1}
                onClick={() => onRemoveRow(r.key)}
              />
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Card
        title={<span className="text-base font-bold text-slate-800">Chi tiết hàng bất thường</span>}
        className="overflow-hidden rounded-2xl border-0 bg-white shadow-sm ring-1 ring-slate-200/60 [&_.ant-card-head-title]:!whitespace-normal [&_.ant-card-head-wrapper]:flex-wrap [&_.ant-card-head-wrapper]:gap-y-2"
        styles={{ header: { borderBottom: '1px solid #f8fafc', padding: '16px 24px' }, body: { padding: isMobile ? 12 : 0 } }}
        extra={
          <Button
            type="primary"
            size={isMobile ? 'large' : 'middle'}
            ghost
            icon={<PlusOutlined />}
            disabled={!cells.length}
            onClick={onAddRow}
            className={isMobile ? 'min-h-[44px]' : ''}
          >
            Thêm dòng
          </Button>
        }
      >
        {!isMobile && (
          <div className="hidden grid-cols-12 gap-3 border-b border-slate-100 bg-slate-50/80 px-4 py-3 text-[12px] font-bold uppercase tracking-wider text-slate-500 md:grid">
            <span className="col-span-4">Vị trí · Lô · Sản phẩm</span>
            <span className="col-span-2 text-right">Số lượng</span>
            <span className="col-span-2">Loại bất thường</span>
            <span className="col-span-3">Diễn giải</span>
            <span className="col-span-1" />
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spin tip="Đang tải tồn kho hiện tại..." />
          </div>
        ) : !cells.length ? (
          <div className="py-10">
            <Empty description="Kho chưa có lô hàng nào để ghi nhận bất thường" />
          </div>
        ) : isMobile ? (
          <div className="flex flex-col gap-3">{rows.map(renderMobileRow)}</div>
        ) : (
          rows.map(renderDesktopRow)
        )}

        <div className={`flex items-center justify-between border-t border-slate-100 px-4 py-3 ${isMobile ? 'mt-3' : ''}`}>
          <span className="text-sm text-ink-sub">Tổng số lượng bất thường</span>
          <span className="mono font-semibold text-[#b91c1c]">{formatNumber(totalQty)}</span>
        </div>
      </Card>

      {/* Mobile/Desktop: Modal/Drawer chọn lô */}
      {isMobile ? (
        <Drawer
          open={lotModal.open}
          onClose={() => setLotModal({ open: false, rowKey: null, productId: null })}
          placement="bottom"
          height="85vh"
          title={
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-ink">Chọn vị trí & lô</span>
              <Segmented
                options={[
                  { value: 'list', icon: <UnorderedListOutlined /> },
                  { value: 'map', icon: <AppstoreOutlined /> },
                ]}
                value={lotViewMode}
                onChange={setLotViewMode}
                size="small"
              />
            </div>
          }
          styles={{ body: { padding: '8px 16px 16px' } }}
          className="rounded-t-2xl"
        >
          {lotModal.productId && (
            lotViewMode === 'list' ? (
              <LotSelectionCards
                cells={cells}
                productId={lotModal.productId}
                currentCellKey={rows.find((r) => r.key === lotModal.rowKey)?.cellKey}
                onSelect={(cellKey) => handleSelectLot(lotModal.rowKey, cellKey)}
                onClose={() => setLotModal({ open: false, rowKey: null, productId: null })}
              />
            ) : (
              <StorageMapSelector
                productIdFilter={lotModal.productId}
                currentCellKey={rows.find((r) => r.key === lotModal.rowKey)?.cellKey}
                onSelect={(cellKey) => {
                  handleSelectLot(lotModal.rowKey, cellKey);
                  setLotModal({ open: false, rowKey: null, productId: null });
                }}
              />
            )
          )}
        </Drawer>
      ) : (
        <Modal
          open={lotModal.open}
          onCancel={() => setLotModal({ open: false, rowKey: null, productId: null })}
          title={
            <div className="flex items-center justify-between pr-8">
              <span className="text-lg font-bold text-slate-800">Chọn vị trí & lô hàng</span>
              <Segmented
                options={[
                  { label: 'Danh sách', value: 'list', icon: <UnorderedListOutlined /> },
                  { label: 'Sơ đồ kho', value: 'map', icon: <AppstoreOutlined /> },
                ]}
                value={lotViewMode}
                onChange={setLotViewMode}
              />
            </div>
          }
          footer={null}
          width={lotViewMode === 'map' ? 900 : 600}
          centered
        >
          <div className="mt-4 max-h-[70vh] overflow-y-auto pr-2">
            {lotModal.productId && (
              lotViewMode === 'list' ? (
                <LotSelectionCards
                  cells={cells}
                  productId={lotModal.productId}
                  currentCellKey={rows.find((r) => r.key === lotModal.rowKey)?.cellKey}
                  onSelect={(cellKey) => handleSelectLot(lotModal.rowKey, cellKey)}
                  onClose={() => setLotModal({ open: false, rowKey: null, productId: null })}
                />
              ) : (
                <StorageMapSelector
                  productIdFilter={lotModal.productId}
                  currentCellKey={rows.find((r) => r.key === lotModal.rowKey)?.cellKey}
                  onSelect={(cellKey) => {
                    handleSelectLot(lotModal.rowKey, cellKey);
                    setLotModal({ open: false, rowKey: null, productId: null });
                  }}
                />
              )
            )}
          </div>
        </Modal>
      )}

      {/* Modal/Drawer chọn sản phẩm */}
      {productModal.open &&
        (isMobile ? (
          <Drawer
            open={productModal.open}
            onClose={() => setProductModal({ open: false, rowKey: null })}
            placement="bottom"
            height="80vh"
            title={<span className="text-base font-bold text-ink">Chọn sản phẩm</span>}
            styles={{ body: { padding: '16px' } }}
            className="rounded-t-2xl"
          >
            <ProductSelectionList
              productOptions={productOptions}
              currentProductId={
                rows.find((r) => r.key === productModal.rowKey)?.cellKey
                  ? cellByKey.get(rows.find((r) => r.key === productModal.rowKey)?.cellKey)?.productId
                  : null
              }
              onSelect={(pid) => handleSelectProduct(productModal.rowKey, pid)}
              onClose={() => setProductModal({ open: false, rowKey: null })}
            />
          </Drawer>
        ) : (
          <Modal
            open={productModal.open}
            onCancel={() => setProductModal({ open: false, rowKey: null })}
            title={<span className="text-lg font-bold text-slate-800">Chọn sản phẩm</span>}
            footer={null}
            width={500}
            centered
          >
            <div className="mt-4">
              <ProductSelectionList
                productOptions={productOptions}
                currentProductId={
                  rows.find((r) => r.key === productModal.rowKey)?.cellKey
                    ? cellByKey.get(rows.find((r) => r.key === productModal.rowKey)?.cellKey)?.productId
                    : null
                }
                onSelect={(pid) => handleSelectProduct(productModal.rowKey, pid)}
                onClose={() => setProductModal({ open: false, rowKey: null })}
              />
            </div>
          </Modal>
        ))}
    </>
  );
}
