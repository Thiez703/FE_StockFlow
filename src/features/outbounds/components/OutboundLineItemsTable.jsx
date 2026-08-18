import { useState, useMemo } from 'react';
import { Card, Button, InputNumber, Input, Empty, Spin, Popconfirm, Tag, Tooltip, Drawer, Modal, Segmented } from 'antd';
import { PlusOutlined, DeleteOutlined, CheckCircleFilled, UnorderedListOutlined, AppstoreOutlined, WarningOutlined } from '@ant-design/icons';
import { formatCurrency, formatNumber } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/date';
import { useIsMobile } from '@/hooks/useIsMobile';
import MobileQuantityInput from '@/components/ui/MobileQuantityInput';
import StorageMapSelector from '@/components/ui/StorageMapSelector';
import ProductCheckboxList from '@/components/ui/ProductCheckboxList';

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

function LotSelectionCards({ cells, productId, fefoLotIdByProduct, riskLotIds, currentValue, onSelect, onClose }) {
  const lotCells = cells.filter((c) => c.productId === productId);

  return (
    <div className="flex flex-col gap-2">
      {lotCells.map((c) => {
        const isFefo = fefoLotIdByProduct.get(c.productId) === c.lotId;
        const isRisk = riskLotIds?.has(c.lotId);
        const selected = c.key === currentValue;
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
  issueType,
  rows,
  cells,
  cellByKey,
  fefoLotIdByProduct,
  riskLotIds,
  inboundPriceMap = new Map(),
  isLoading,
  onPatchRow,
  onAddMultipleRows,
  onRemoveRow,
}) {
  const isMobile = useIsMobile();
  const [lotModal, setLotModal] = useState({ open: false, rowKey: null, productId: null });
  const [productModal, setProductModal] = useState({ open: false, rowKey: null });
  const [lotViewMode, setLotViewMode] = useState('map'); // 'list' | 'map'

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
    const latestInboundPrice = cell ? (inboundPriceMap.get(cell.lotId) ?? null) : null;
    const priceBelowInbound = latestInboundPrice != null && latestInboundPrice > 0 && r.unitPrice < latestInboundPrice;
    return { cell, fefoLotId, isOverride, overrideErr, latestInboundPrice, priceBelowInbound };
  };

  // ─── MOBILE: card-based layout ───
  const renderMobileRow = (r) => {
    const { cell, isOverride, overrideErr, latestInboundPrice, priceBelowInbound } = renderRowData(r);

    return (
      <div key={r.key} className="rounded-xl border border-hair bg-white p-3">
        {/* Sản phẩm */}
        <div className="mb-3">
          <span className="mb-1.5 block text-xs font-semibold text-slate-400">Sản phẩm</span>
          {(() => {
            const product = productOptions.find(p => p.value === cell?.productId);
            return (
              <Button
                type="dashed"
                onClick={() => setProductModal({ open: true, rowKey: r.key })}
                className="w-full text-left flex justify-between min-h-[44px] items-center px-3"
              >
                <span className="truncate">{product?.label || 'Bấm chọn sản phẩm...'}</span>
              </Button>
            );
          })()}
        </div>

        {/* Lô đã chọn + nút đổi lô */}
        {cell && (
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-slate-400">Lô hàng</span>
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
        {cell && issueType !== 'DISPOSAL' && (
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

        {/* Price below inbound warning */}
        {priceBelowInbound && (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2">
            <WarningOutlined className="text-rose-500 mt-0.5" />
            <span className="text-xs text-rose-700">
              Đơn giá xuất ({formatCurrency(r.unitPrice)}) thấp hơn giá nhập gần nhất ({formatCurrency(latestInboundPrice)}). Backend sẽ từ chối phiếu này.
            </span>
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

  // ─── DESKTOP: giữ nguyên grid-based layout ───
  const renderDesktopRow = (r) => {
    const { cell, isOverride, overrideErr, latestInboundPrice, priceBelowInbound } = renderRowData(r);

    return (
      <div key={r.key} className="border-b border-slate-100 last:border-b-0">
        <div className="grid grid-cols-12 items-start gap-3 px-4 py-3">
          <div className={`col-span-12 ${issueType === 'DISPOSAL' ? 'md:col-span-8' : 'md:col-span-4'}`}>
            <span className="mb-1 block text-xs font-medium text-slate-400 md:hidden">Sản phẩm</span>
            <div className="flex w-full overflow-hidden rounded-lg bg-slate-50 ring-1 ring-slate-200">
              <div
                className="flex flex-1 cursor-pointer items-center justify-between px-3 py-2 transition-colors hover:bg-slate-100"
                onClick={() => setProductModal({ open: true, rowKey: r.key })}
              >
                <div className="flex flex-col">
                  {cell ? (
                    <span className="font-semibold text-ink line-clamp-1">{productOptions.find((p) => p.value === cell.productId)?.label || 'Unknown Product'}</span>
                  ) : (
                    <span className="text-slate-400 font-medium">Bấm để chọn...</span>
                  )}
                </div>
                <AppstoreOutlined className="text-slate-400 ml-2" />
              </div>
            </div>

            {cell && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-ink-sub">
                <span className="font-medium px-1.5 py-0.5 bg-slate-100 rounded text-slate-600">Lô: {cell.lotCode || cell.lot || 'N/A'}</span>
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
                <span className="text-blue-500 hover:text-blue-600 cursor-pointer text-[11px] ml-auto font-medium" onClick={() => setLotModal({ open: true, rowKey: r.key, productId: cell.productId })}>
                  Chọn lô khác
                </span>
              </div>
            )}
          </div>

          <div className={`col-span-6 ${issueType === 'DISPOSAL' ? 'md:col-span-3' : 'md:col-span-2'}`}>
            <span className="mb-1 block text-xs font-medium text-slate-400 md:hidden">Số lượng</span>
            <InputNumber min={1} max={cell?.quantity ?? undefined} value={r.quantity} onChange={(v) => onPatchRow(r.key, { quantity: v ?? 1 })} className="w-full" disabled={!cell} />
            {cell && <div className="mt-1 text-right text-xs text-ink-sub">Tồn: {formatNumber(cell.quantity)}</div>}
          </div>

          {issueType !== 'DISPOSAL' && (
            <div className="col-span-6 md:col-span-2">
              <span className="mb-1 block text-xs font-medium text-slate-400 md:hidden">Đơn giá</span>
              <InputNumber min={0} step={1000} value={r.unitPrice} onChange={(v) => onPatchRow(r.key, { unitPrice: v ?? 0 })} className="w-full" disabled={!cell} formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={(v) => v?.replace(/\./g, '')} status={priceBelowInbound ? 'error' : ''} />
              {priceBelowInbound && (
                <Tooltip title={`Giá nhập gần nhất: ${formatCurrency(latestInboundPrice)}`}>
                  <p className="m-0 mt-1 text-[11px] text-rose-500 flex items-center gap-1">
                    <WarningOutlined /> Thấp hơn giá nhập
                  </p>
                </Tooltip>
              )}
            </div>
          )}

          {issueType !== 'DISPOSAL' && (
            <div className="col-span-8 self-center md:col-span-3 md:text-right">
              <span className="mb-1 block text-xs font-medium text-slate-400 md:hidden">Thành tiền</span>
              <span className="font-semibold text-ink">{formatCurrency((r.quantity || 0) * (r.unitPrice || 0))}</span>
            </div>
          )}

          <div className="col-span-4 flex justify-end self-center md:col-span-1">
            {r.cellKey ? (
              <Popconfirm title="Xóa dòng này?" description="Dòng đã có dữ liệu, bạn có chắc chắn muốn xóa?" onConfirm={() => onRemoveRow(r.key)} okText="Xóa" cancelText="Hủy" okButtonProps={{ danger: true }} disabled={rows.length <= 1}>
                <Button type="text" danger size="small" icon={<DeleteOutlined />} disabled={rows.length <= 1} />
              </Popconfirm>
            ) : (
              <Button type="text" danger size="small" icon={<DeleteOutlined />} disabled={rows.length <= 1} onClick={() => onRemoveRow(r.key)} />
            )}
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
        title={<span className="text-base font-bold text-slate-800">Danh sách sản phẩm xuất</span>}
        className="border-0 shadow-sm ring-1 ring-slate-200/60 rounded-2xl bg-white overflow-hidden [&_.ant-card-head-title]:!whitespace-normal [&_.ant-card-head-wrapper]:flex-wrap [&_.ant-card-head-wrapper]:gap-y-2"
        styles={{ header: { borderBottom: '1px solid #f8fafc', padding: '16px 24px' }, body: { padding: isMobile ? 12 : 0 } }}
        extra={
          <Button type="primary" size={isMobile ? 'large' : 'middle'} ghost icon={<PlusOutlined />} disabled={!cells.length} onClick={() => setProductModal({ open: true, rowKey: null })} className={isMobile ? 'min-h-[44px]' : ''}>
            Thêm dòng
          </Button>
        }
      >
        {/* Desktop header */}
        {!isMobile && (
          <div className="hidden grid-cols-12 gap-3 border-b border-slate-100 bg-slate-50/80 px-4 py-3 text-[12px] font-bold uppercase tracking-wider text-slate-500 md:grid">
            <span className={issueType === 'DISPOSAL' ? 'col-span-8' : 'col-span-4'}>Vị trí · Lô · Sản phẩm</span>
            <span className={`text-right ${issueType === 'DISPOSAL' ? 'col-span-3' : 'col-span-2'}`}>Số lượng</span>
            {issueType !== 'DISPOSAL' && <span className="col-span-2 text-right">Đơn giá</span>}
            {issueType !== 'DISPOSAL' && <span className="col-span-3 text-right">Thành tiền</span>}
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

        {issueType !== 'DISPOSAL' && (
          <div className={`flex items-center justify-between border-t border-slate-100 px-4 py-3 ${isMobile ? 'mt-3' : ''}`}>
            <span className="text-sm text-ink-sub">Tổng giá trị phiếu</span>
            <span className="font-semibold text-ink">{formatCurrency(totalAmount)}</span>
          </div>
        )}
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
                fefoLotIdByProduct={fefoLotIdByProduct}
                riskLotIds={riskLotIds}
                currentValue={rows.find((r) => r.key === lotModal.rowKey)?.cellKey}
                onSelect={(cellKey) => handleSelectLot(lotModal.rowKey, cellKey)}
                onClose={() => setLotModal({ open: false, rowKey: null, productId: null })}
              />
            ) : (
              <StorageMapSelector
                productIdFilter={lotModal.productId}
                currentValue={rows.find((r) => r.key === lotModal.rowKey)?.cellKey}
                pickedLocations={rows.filter(r => r.key !== lotModal.rowKey && r.cellKey).map((r) => {
                  const c = cellByKey.get(r.cellKey);
                  return { locationId: c?.locationId, cellKey: r.cellKey, rowIndex: rows.indexOf(r), productName: c?.productName };
                })}
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
                  fefoLotIdByProduct={fefoLotIdByProduct}
                  riskLotIds={riskLotIds}
                  currentValue={rows.find((r) => r.key === lotModal.rowKey)?.cellKey}
                  onSelect={(cellKey) => handleSelectLot(lotModal.rowKey, cellKey)}
                  onClose={() => setLotModal({ open: false, rowKey: null, productId: null })}
                />
              ) : (
                <StorageMapSelector
                  productIdFilter={lotModal.productId}
                  currentValue={rows.find((r) => r.key === lotModal.rowKey)?.cellKey}
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
      {productModal.open && (() => {
        const isSingle = productModal.rowKey != null;
        const closeModal = () => setProductModal({ open: false, rowKey: null });
        const existingProductIds = new Set(rows.map(r => cellByKey.get(r.cellKey)?.productId).filter(Boolean));

        const handleProductAdd = (pids) => {
            if (isSingle) {
                handleSelectProduct(productModal.rowKey, pids[0]);
            } else {
                onAddMultipleRows(pids);
            }
        };

        const content = (
          <ProductCheckboxList
            productOptions={productOptions}
            selectedProductIds={existingProductIds}
            onAdd={handleProductAdd}
            onClose={closeModal}
            singleMode={isSingle}
          />
        );

        return isMobile ? (
          <Drawer
            open
            onClose={closeModal}
            placement="bottom"
            height="85vh"
            title={<span className="text-base font-bold text-ink">Chọn sản phẩm</span>}
            styles={{ body: { padding: '16px' } }}
            className="rounded-t-2xl"
          >
            {content}
          </Drawer>
        ) : (
          <Modal
            open
            onCancel={closeModal}
            title={<span className="text-lg font-bold text-slate-800">Chọn sản phẩm</span>}
            footer={null}
            width={560}
            centered
          >
            <div className="mt-4">{content}</div>
          </Modal>
        );
      })()}
    </>
  );
}
