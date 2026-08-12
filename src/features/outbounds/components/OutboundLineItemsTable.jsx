import { useState, useMemo } from 'react';
import { Card, Button, Select, InputNumber, Input, Empty, Spin, Popconfirm, Tag, Tooltip, Drawer } from 'antd';
import { PlusOutlined, DeleteOutlined, CheckCircleFilled } from '@ant-design/icons';
import { formatCurrency, formatNumber } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/date';
import { useIsMobile } from '@/hooks/useIsMobile';
import MobileQuantityInput from '@/components/ui/MobileQuantityInput';

/**
 * Bảng dòng hàng của phiếu xuất.
 *
 * Backend nhận cặp (lotId, locationId) chứ không nhận productId, nên người lập
 * chọn thẳng một ô vị trí đang có hàng từ ảnh chụp tồn kho — giống màn hình kiểm
 * kê và hàng bất thường.
 *
 * FEFO (lô hết hạn sớm nhất phải xuất trước) được tính tại FE từ chính ảnh chụp
 * tồn: chọn lô khác lô FEFO của sản phẩm thì bắt buộc nhập lý do, nếu không
 * backend cũng trả 400.
 */
/**
 * Dạng thẻ (card) chọn lô trên mobile — thay cho Select dropdown.
 * Mỗi lô là 1 card lớn, dễ bấm, hiển thị: mã lô, HSD, tồn, badge FEFO.
 */
function MobileLotCards({ cells, productId, fefoLotIdByProduct, riskLotIds, currentCellKey, onSelect, onClose }) {
  const lotCells = cells.filter((c) => c.productId === productId);

  return (
    <div className="flex flex-col gap-2">
      {lotCells.map((c) => {
        const isFefo = fefoLotIdByProduct.get(c.productId) === c.lotId;
        const isRisk = riskLotIds?.has(c.lotId);
        const selected = c.key === currentCellKey;
        return (
          <button
            key={c.key}
            type="button"
            onClick={() => { onSelect(c.key); onClose(); }}
            className={`flex w-full flex-col gap-1 rounded-xl border-2 p-3 text-left transition-colors active:bg-slate-50 ${
              selected ? 'border-royal bg-blue-50/50' : 'border-hair bg-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="mono text-sm font-bold text-ink">{c.lotCode}</span>
              {isFefo && (
                <Tag color="green" bordered={false} className="!mr-0 !text-[11px]">
                  <CheckCircleFilled className="mr-1" />Gợi ý FEFO
                </Tag>
              )}
              {isRisk && (
                <Tag color="red" bordered={false} className="!mr-0 !text-[11px]">
                  Cảnh báo hết hạn
                </Tag>
              )}
              {selected && (
                <CheckCircleFilled className="ml-auto text-royal" />
              )}
            </div>
            <div className="flex items-center gap-4 text-xs text-ink-sub">
              <span>Vị trí: <strong className="text-ink">{c.locationCode}</strong></span>
              {c.expDate && (
                <span>HSD: <strong className={isRisk ? 'text-red-600' : 'text-ink'}>{formatDate(c.expDate)}</strong></span>
              )}
              <span>Tồn: <strong className="text-ink">{formatNumber(c.quantity)}</strong></span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export default function OutboundLineItemsTable({
  rows,
  cells,
  cellByKey,
  fefoLotIdByProduct,
  riskLotIds,
  isLoading,
  onPatchRow,
  onAddRow,
  onRemoveRow,
}) {
  const isMobile = useIsMobile();
  const [manualLotSelection, setManualLotSelection] = useState({});
  // Drawer state cho mobile lot selection
  const [lotDrawer, setLotDrawer] = useState({ open: false, rowKey: null, productId: null });
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

  const fefoCellKeyByProduct = useMemo(() => {
    const map = new Map();
    for (const c of cells) {
      if (fefoLotIdByProduct.get(c.productId) === c.lotId) {
        if (!map.has(c.productId)) {
          map.set(c.productId, c.key);
        }
      }
    }
    return map;
  }, [cells, fefoLotIdByProduct]);

  const cellOptions = useMemo(() => cells.map((c) => {
    const isFefo = fefoLotIdByProduct.get(c.productId) === c.lotId;
    return {
      value: c.key,
      productId: c.productId,
      label:
        `${c.locationCode} · ${c.lotCode}` +
        (c.expDate ? ` · HSD ${formatDate(c.expDate)}` : '') +
        ` — ${c.productName} (tồn ${formatNumber(c.quantity)})` +
        (isFefo ? ' · FEFO' : ''),
    };
  }), [cells, fefoLotIdByProduct]);

  const totalAmount = rows.reduce(
    (sum, r) => sum + (r.cellKey ? (r.quantity || 0) * (r.unitPrice || 0) : 0),
    0,
  );

  const handleSelectProduct = (rowKey, productId) => {
    const fefoKey = fefoCellKeyByProduct.get(productId);
    if (fefoKey) {
      const next = cellByKey.get(fefoKey);
      onPatchRow(rowKey, {
        cellKey: fefoKey,
        quantity: Math.min(1, next?.quantity ?? 1),
        overrideReason: '',
      });
    } else {
      onPatchRow(rowKey, { cellKey: undefined });
    }
  };

  const handleSelectLot = (rowKey, cellKey) => {
    const next = cellByKey.get(cellKey);
    onPatchRow(rowKey, {
      cellKey,
      quantity: Math.min(1, next?.quantity ?? 1),
      overrideReason: '',
    });
  };

  // ─── Helpers chung cho cả hai layout ───
  const renderRowData = (r) => {
    const cell = r.cellKey ? cellByKey.get(r.cellKey) : null;
    const fefoLotId = cell ? fefoLotIdByProduct.get(cell.productId) : null;
    const isOverride = !!cell && fefoLotId != null && cell.lotId !== fefoLotId;
    const overrideErr = isOverride && !r.overrideReason.trim();
    return { cell, fefoLotId, isOverride, overrideErr };
  };

  // ─── MOBILE: card-based layout ───
  const renderMobileRow = (r) => {
    const { cell, isOverride, overrideErr } = renderRowData(r);

    return (
      <div key={r.key} className="rounded-xl border border-hair bg-white p-3">
        {/* Sản phẩm */}
        <div className="mb-3">
          <span className="mb-1.5 block text-xs font-semibold text-slate-400">Sản phẩm</span>
          <Select
            showSearch
            optionFilterProp="label"
            placeholder="Tìm và chọn sản phẩm..."
            options={productOptions}
            value={cell?.productId}
            onChange={(pid) => handleSelectProduct(r.key, pid)}
            className="w-full"
          />
        </div>

        {/* Lô đã chọn + nút đổi lô */}
        {cell && (
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-slate-400">Lô hàng</span>
              <button
                type="button"
                onClick={() => setLotDrawer({ open: true, rowKey: r.key, productId: cell.productId })}
                className="ml-auto border-0 bg-transparent text-xs font-semibold text-royal active:text-royal-500"
              >
                Đổi lô
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-2">
              <span className="mono text-sm font-bold text-ink">{cell.lotCode}</span>
              <span className="text-xs text-ink-sub">· {cell.locationCode}</span>
              {cell.expDate && <span className="text-xs text-ink-sub">· HSD {formatDate(cell.expDate)}</span>}
              {isOverride ? (
                <Tag color="orange" bordered={false} className="!mr-0 !text-[11px]">Không FEFO</Tag>
              ) : (
                <Tag color="green" bordered={false} className="!mr-0 !text-[11px]">FEFO</Tag>
              )}
              {riskLotIds?.has(cell.lotId) && (
                <Tag color="red" bordered={false} className="!mr-0 !text-[11px]">Cảnh báo hết hạn</Tag>
              )}
            </div>
          </div>
        )}

        {/* Số lượng (mobile: +/- buttons) */}
        {cell && (
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1.5">
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

        {/* Đơn giá + thành tiền */}
        {cell && (
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <span className="mb-1 block text-xs font-semibold text-slate-400">Đơn giá</span>
              <InputNumber
                min={0}
                step={1000}
                value={r.unitPrice}
                onChange={(v) => onPatchRow(r.key, { unitPrice: v ?? 0 })}
                className="w-full"
                inputMode="decimal"
                formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                parser={(v) => v?.replace(/\./g, '')}
              />
            </div>
            <div className="flex-1 text-right">
              <span className="mb-1 block text-xs font-semibold text-slate-400">Thành tiền</span>
              <span className="text-base font-bold text-ink">
                {formatCurrency((r.quantity || 0) * (r.unitPrice || 0))}
              </span>
            </div>
          </div>
        )}

        {/* FEFO override reason */}
        {isOverride && (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
            <label className="mb-1.5 block text-xs font-semibold text-amber-700">
              Lý do chọn lô khác FEFO <span className="text-rose-500">*</span>
            </label>
            <Input.TextArea
              rows={2}
              placeholder="VD: Lô FEFO đã tách riêng cho đơn khác..."
              value={r.overrideReason}
              onChange={(e) => onPatchRow(r.key, { overrideReason: e.target.value })}
              status={overrideErr ? 'error' : ''}
            />
            {overrideErr && (
              <p className="m-0 mt-1 text-xs text-rose-500">Bắt buộc nhập lý do</p>
            )}
          </div>
        )}

        {/* Xóa dòng */}
        {rows.length > 1 && (
          <div className="mt-3 flex justify-end">
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
          </div>
        )}
      </div>
    );
  };

  // ─── DESKTOP: giữ nguyên grid-based layout ───
  const renderDesktopRow = (r) => {
    const { cell, isOverride, overrideErr } = renderRowData(r);
    const isManual = manualLotSelection[r.key];
    const lotOptionsForProduct = cell ? cellOptions.filter((o) => o.productId === cell.productId) : cellOptions;

    return (
      <div key={r.key} className="border-b border-slate-100 last:border-b-0">
        <div className="grid grid-cols-12 items-start gap-3 px-4 py-3">
          <div className="col-span-12 md:col-span-4">
            {!isManual ? (
              <Select
                showSearch
                optionFilterProp="label"
                placeholder="Chọn sản phẩm"
                options={productOptions}
                value={cell?.productId}
                onChange={(productId) => handleSelectProduct(r.key, productId)}
                className="w-full"
              />
            ) : (
              <Select
                showSearch
                optionFilterProp="label"
                placeholder="Chọn lô hàng khác"
                options={lotOptionsForProduct}
                value={r.cellKey}
                onChange={(v) => handleSelectLot(r.key, v)}
                className="w-full"
              />
            )}

            {cell && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-ink-sub">
                <span className="font-medium px-1.5 py-0.5 bg-slate-100 rounded text-slate-600">Lô: {cell.lotCode}</span>
                <span className="font-medium px-1.5 py-0.5 bg-slate-100 rounded text-slate-600">Vị trí: {cell.locationCode}</span>
                {isOverride ? (
                  <Tag color="orange" bordered={false} className="!mr-0 !text-[11px] ml-1">Không phải lô FEFO</Tag>
                ) : (
                  <Tag color="green" bordered={false} className="!mr-0 !text-[11px] ml-1">Lô FEFO</Tag>
                )}
                {riskLotIds?.has(cell.lotId) && (
                  <Tooltip title="Lô hàng có nguy cơ hết hạn trước khi bán hết">
                    <Tag color="red" bordered={false} className="!mr-0 !text-[11px] ml-1">Cảnh báo hết hạn</Tag>
                  </Tooltip>
                )}
                {!isManual ? (
                  <span className="text-blue-500 hover:text-blue-600 cursor-pointer text-[11px] ml-auto font-medium" onClick={() => toggleManualLot(r.key, true)}>
                    Chọn lô khác
                  </span>
                ) : (
                  <span className="text-slate-400 hover:text-slate-600 cursor-pointer text-[11px] ml-auto font-medium" onClick={() => {
                    toggleManualLot(r.key, false);
                    const fefoKey = fefoCellKeyByProduct.get(cell.productId);
                    if (fefoKey && fefoKey !== r.cellKey) {
                      const next = cellByKey.get(fefoKey);
                      onPatchRow(r.key, { cellKey: fefoKey, quantity: Math.min(r.quantity || 1, next?.quantity ?? 1), overrideReason: '' });
                    }
                  }}>
                    Hủy chọn lô khác
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="col-span-6 md:col-span-2">
            <span className="mb-1 block text-xs font-medium text-slate-400 md:hidden">Số lượng</span>
            <InputNumber min={1} max={cell?.quantity ?? undefined} value={r.quantity} onChange={(v) => onPatchRow(r.key, { quantity: v ?? 1 })} className="w-full" disabled={!cell} />
            {cell && <div className="mt-1 text-right text-xs text-ink-sub">Tồn: {formatNumber(cell.quantity)}</div>}
          </div>

          <div className="col-span-6 md:col-span-2">
            <span className="mb-1 block text-xs font-medium text-slate-400 md:hidden">Đơn giá</span>
            <InputNumber min={0} step={1000} value={r.unitPrice} onChange={(v) => onPatchRow(r.key, { unitPrice: v ?? 0 })} className="w-full" disabled={!cell} formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={(v) => v?.replace(/\./g, '')} />
          </div>

          <div className="col-span-8 self-center md:col-span-3 md:text-right">
            <span className="mb-1 block text-xs font-medium text-slate-400 md:hidden">Thành tiền</span>
            <span className="font-semibold text-ink">{formatCurrency((r.quantity || 0) * (r.unitPrice || 0))}</span>
          </div>

          <div className="col-span-4 flex justify-end self-center md:col-span-1">
            <Popconfirm title="Xóa dòng này?" description="Xác nhận xóa dòng khỏi phiếu xuất?" onConfirm={() => onRemoveRow(r.key)} okText="Xóa" cancelText="Hủy" okButtonProps={{ danger: true }} disabled={rows.length <= 1}>
              <Button type="text" danger size="small" icon={<DeleteOutlined />} disabled={rows.length <= 1} />
            </Popconfirm>
          </div>
        </div>

        {isOverride && (
          <div className="mx-4 mb-3 rounded-lg border border-amber/30 bg-amber/5 p-3">
            <label className="mb-1.5 block text-xs font-semibold text-amber-700">
              Lý do chọn lô khác lô FEFO <span className="text-rose-500">*</span>
            </label>
            <Input.TextArea rows={2} placeholder="VD: Lô FEFO đã tách riêng cho đơn khác..." value={r.overrideReason} onChange={(e) => onPatchRow(r.key, { overrideReason: e.target.value })} status={overrideErr ? 'error' : ''} />
            {overrideErr && <p className="m-0 mt-1 text-xs text-rose-500">Bắt buộc nhập lý do khi chọn lô khác lô FEFO</p>}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <Card
        title="Danh sách sản phẩm xuất"
        className="border-hair [&_.ant-card-head-title]:!whitespace-normal [&_.ant-card-head-wrapper]:flex-wrap [&_.ant-card-head-wrapper]:gap-y-2"
        styles={{ header: { borderBottom: '1px solid #f1f5f9' }, body: { padding: isMobile ? 12 : 0 } }}
        extra={
          <Button type="primary" ghost icon={<PlusOutlined />} disabled={!cells.length} onClick={onAddRow} className={isMobile ? 'min-h-[44px]' : ''}>
            Thêm dòng
          </Button>
        }
      >
        {/* Desktop header */}
        {!isMobile && (
          <div className="hidden grid-cols-12 gap-3 border-b border-slate-100 bg-slate-50/70 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-400 md:grid">
            <span className="col-span-4">Vị trí · Lô · Sản phẩm</span>
            <span className="col-span-2 text-right">Số lượng</span>
            <span className="col-span-2 text-right">Đơn giá</span>
            <span className="col-span-3 text-right">Thành tiền</span>
            <span className="col-span-1" />
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spin tip="Đang tải tồn kho hiện tại..." />
          </div>
        ) : !cells.length ? (
          <div className="py-10">
            <Empty description="Kho chưa có lô hàng nào để xuất" />
          </div>
        ) : isMobile ? (
          <div className="flex flex-col gap-3">
            {rows.map(renderMobileRow)}
          </div>
        ) : (
          rows.map(renderDesktopRow)
        )}

        <div className={`flex items-center justify-between border-t border-slate-100 px-4 py-3 ${isMobile ? 'mt-3' : ''}`}>
          <span className="text-sm text-ink-sub">Tổng giá trị phiếu</span>
          <span className="font-semibold text-ink">{formatCurrency(totalAmount)}</span>
        </div>
      </Card>

      {/* Mobile: bottom sheet chọn lô */}
      <Drawer
        open={lotDrawer.open}
        onClose={() => setLotDrawer({ open: false, rowKey: null, productId: null })}
        placement="bottom"
        height="70vh"
        title={<span className="text-base font-bold text-ink">Chọn lô hàng</span>}
        styles={{ body: { padding: '8px 16px 16px' } }}
        className="rounded-t-2xl"
      >
        {lotDrawer.productId && (
          <MobileLotCards
            cells={cells}
            productId={lotDrawer.productId}
            fefoLotIdByProduct={fefoLotIdByProduct}
            riskLotIds={riskLotIds}
            currentCellKey={rows.find((r) => r.key === lotDrawer.rowKey)?.cellKey}
            onSelect={(cellKey) => handleSelectLot(lotDrawer.rowKey, cellKey)}
            onClose={() => setLotDrawer({ open: false, rowKey: null, productId: null })}
          />
        )}
      </Drawer>
    </>
  );
}
