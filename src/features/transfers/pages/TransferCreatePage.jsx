import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Select, InputNumber, App, Popconfirm, Modal, Drawer } from 'antd';
import { ArrowLeftOutlined, PlusOutlined, DeleteOutlined, SwapOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

import PageHeader from '@/components/ui/PageHeader';
import StorageMapSelector from '@/components/ui/StorageMapSelector';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useInventorySnapshot } from '@/hooks/useInventorySnapshot';
import { transferApi } from '@/api/transfers';
import { DEFAULT_WAREHOUSE_ID } from '@/constants/warehouse';
import { getErrorMessage } from '@/utils/getErrorMessage';
import { formatNumber } from '@/utils/formatCurrency';

function emptyRow() {
  return { id: Date.now() + Math.random(), productId: null, lotId: null, fromLocationId: null, fromLocationCode: null, toLocationId: null, toLocationCode: null, quantity: 1 };
}

export default function TransferCreatePage() {
  const isMobile = useIsMobile();
  const { message } = App.useApp();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [rows, setRows] = useState([emptyRow()]);
  const [note, setNote] = useState('');
  const [mapModal, setMapModal] = useState({ open: false, rowId: null, type: null, productId: null, fromLocationId: null });

  const { cells, isLoading: loadingSnap } = useInventorySnapshot();

  const cellByKey = useMemo(() => new Map(cells.map((c) => [c.key, c])), [cells]);

  // Distinct products from inventory
  const productOptions = useMemo(() => {
    const map = new Map();
    cells.forEach(c => { if (!map.has(c.productId)) map.set(c.productId, { value: c.productId, label: `${c.productCode} — ${c.productName}` }); });
    return [...map.values()];
  }, [cells]);

  const patchRow = (id, patch) => setRows(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r));
  const removeRow = (id) => setRows(prev => prev.filter(r => r.id !== id));

  const { mutate: save, isPending } = useMutation({
    mutationFn: (payload) => transferApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'storage-map'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-snapshot'] });
      message.success('Đã tạo phiếu điều chuyển');
      navigate('/transfers');
    },
    onError: (err) => message.error(getErrorMessage(err)),
  });

  const canSubmit = rows.every(r => r.productId && r.lotId && r.fromLocationId && r.toLocationId && r.quantity > 0);

  const handleSubmit = () => {
    save({
      warehouseId: DEFAULT_WAREHOUSE_ID,
      note: note || null,
      details: rows.map(r => ({
        productId: r.productId,
        lotId: r.lotId,
        fromLocationId: r.fromLocationId,
        toLocationId: r.toLocationId,
        quantity: r.quantity,
      })),
    });
  };

  const handleSelectFrom = (rowId, cellKey) => {
    const cell = cellByKey.get(cellKey);
    if (!cell) return;
    patchRow(rowId, {
      productId: cell.productId,
      lotId: cell.lotId,
      fromLocationId: cell.locationId,
      fromLocationCode: cell.locationCode,
      quantity: Math.min(1, cell.quantity),
      toLocationId: null,
      toLocationCode: null,
    });
    setMapModal({ open: false, rowId: null, type: null, productId: null, fromLocationId: null });
  };

  const handleSelectTo = (rowId, locationId) => {
    // Find location code from the storage map data (cells might have it)
    const anyCell = cells.find(c => c.locationId === locationId);
    patchRow(rowId, { toLocationId: locationId, toLocationCode: anyCell?.locationCode || locationId });
    setMapModal({ open: false, rowId: null, type: null, productId: null, fromLocationId: null });
  };

  const renderMapModal = () => {
    if (!mapModal.open) return null;

    const isFrom = mapModal.type === 'from';
    const row = rows.find(r => r.id === mapModal.rowId);

    const handleSelect = (value) => {
      if (isFrom) {
        handleSelectFrom(mapModal.rowId, value);
      } else {
        handleSelectTo(mapModal.rowId, value);
      }
    };

    const excludeIds = isFrom ? undefined : new Set([mapModal.fromLocationId].filter(Boolean));

    // Build pickedLocations from other rows
    const currentRowIdx = rows.findIndex(r => r.id === mapModal.rowId);
    const pickedLocations = rows
      .map((r, idx) => {
        if (idx === currentRowIdx) return null;
        if (isFrom) {
          if (!r.fromLocationId || !r.lotId) return null;
          const fromCell = cells.find(c => c.lotId === r.lotId && c.locationId === r.fromLocationId);
          return { locationId: r.fromLocationId, cellKey: `${r.lotId}-${r.fromLocationId}`, rowIndex: idx, productName: fromCell?.productName };
        } else {
          if (!r.toLocationId) return null;
          return { locationId: r.toLocationId, productId: r.productId, rowIndex: idx };
        }
      })
      .filter(Boolean);

    const mapContent = (
      <StorageMapSelector
        selectionMode={isFrom ? 'cell' : 'location'}
        productIdFilter={isFrom ? mapModal.productId : undefined}
        currentValue={isFrom ? (row?.lotId && row?.fromLocationId ? `${row.lotId}-${row.fromLocationId}` : undefined) : row?.toLocationId}
        currentProductId={!isFrom ? row?.productId : undefined}
        highlightEmpty={!isFrom}
        excludeLocationIds={excludeIds}
        inventoryCells={!isFrom ? cells : undefined}
        onSelect={handleSelect}
        pickedLocations={pickedLocations}
      />
    );

    const title = isFrom ? 'Chọn vị trí nguồn (lấy hàng)' : 'Chọn vị trí đích (chuyển đến)';

    if (isMobile) {
      return (
        <Drawer
          open
          onClose={() => setMapModal({ open: false, rowId: null, type: null, productId: null, fromLocationId: null })}
          placement="bottom"
          height="85vh"
          title={<span className="text-base font-bold text-ink">{title}</span>}
          styles={{ body: { padding: '8px 16px 16px' } }}
          className="rounded-t-2xl"
        >
          {mapContent}
        </Drawer>
      );
    }

    return (
      <Modal
        open
        onCancel={() => setMapModal({ open: false, rowId: null, type: null, productId: null, fromLocationId: null })}
        title={<span className="text-lg font-bold text-slate-800">{title}</span>}
        footer={null}
        width={900}
        centered
      >
        <div className="mt-4 max-h-[70vh] overflow-y-auto pr-2">
          {mapContent}
        </div>
      </Modal>
    );
  };

  return (
    <>
      <PageHeader
        title="Tạo phiếu điều chuyển"
        subtitle="Chuyển hàng từ vị trí này sang vị trí khác trong kho"
        breadcrumb={[{ title: 'Kiểm soát' }, { title: 'Điều chuyển', href: '/transfers' }, { title: 'Tạo mới' }]}
        extra={
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/transfers')}>
            Quay lại
          </Button>
        }
      />

      <div className="mt-4 bg-white rounded-xl border border-slate-200 shadow-sm p-4 md:p-6">
        {/* Note */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-600 mb-1">Ghi chú</label>
          <input
            className="w-full md:w-96 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Lý do điều chuyển (không bắt buộc)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        {/* Lines */}
        <div className="flex flex-col gap-4">
          {rows.map((r, idx) => {
            const fromCell = r.lotId && r.fromLocationId
              ? cells.find(c => c.lotId === r.lotId && c.locationId === r.fromLocationId)
              : null;

            return (
              <div key={r.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase">Dòng {idx + 1}</span>
                  {rows.length > 1 && (
                    <Button type="text" danger icon={<DeleteOutlined />} onClick={() => removeRow(r.id)} />
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                  {/* Vị trí nguồn */}
                  <div className="md:col-span-4">
                    <span className="mb-1 block text-xs font-medium text-slate-500">Từ vị trí (nguồn)</span>
                    <Button
                      type="dashed"
                      icon={<EnvironmentOutlined />}
                      onClick={() => setMapModal({ open: true, rowId: r.id, type: 'from', productId: null, fromLocationId: null })}
                      className={`w-full text-left flex items-center gap-2 min-h-[40px] ${r.fromLocationId ? 'text-slate-700' : 'text-slate-400'}`}
                    >
                      {fromCell ? (
                        <span className="truncate">
                          <strong>{fromCell.locationCode}</strong> · Lô {fromCell.lotCode} · {fromCell.productName} ({formatNumber(fromCell.quantity)} Thùng)
                        </span>
                      ) : (
                        <span>Bấm chọn trên sơ đồ kho...</span>
                      )}
                    </Button>
                  </div>

                  {/* Vị trí đích */}
                  <div className="md:col-span-4">
                    <span className="mb-1 block text-xs font-medium text-slate-500">Đến vị trí (đích)</span>
                    <Button
                      type="dashed"
                      icon={<EnvironmentOutlined />}
                      disabled={!r.fromLocationId}
                      onClick={() => setMapModal({ open: true, rowId: r.id, type: 'to', productId: r.productId, fromLocationId: r.fromLocationId })}
                      className={`w-full text-left flex items-center gap-2 min-h-[40px] ${r.toLocationId ? 'text-slate-700' : 'text-slate-400'}`}
                    >
                      {r.toLocationCode ? (
                        <span><strong>{r.toLocationCode}</strong></span>
                      ) : (
                        <span>{r.fromLocationId ? 'Bấm chọn trên sơ đồ kho...' : 'Chọn nguồn trước'}</span>
                      )}
                    </Button>
                  </div>

                  {/* Số lượng */}
                  <div className="md:col-span-3">
                    <span className="mb-1 block text-xs font-medium text-slate-500">
                      Số lượng {fromCell ? `(tối đa ${formatNumber(fromCell.quantity)})` : ''}
                    </span>
                    <InputNumber
                      min={1}
                      max={fromCell?.quantity ?? 99999}
                      value={r.quantity}
                      onChange={(v) => patchRow(r.id, { quantity: v ?? 1 })}
                      className="w-full"
                      disabled={!r.fromLocationId}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <Button icon={<PlusOutlined />} onClick={() => setRows(prev => [...prev, emptyRow()])}>
            Thêm dòng
          </Button>

          <Popconfirm
            title="Xác nhận tạo phiếu điều chuyển?"
            onConfirm={handleSubmit}
            okText="Xác nhận"
            cancelText="Hủy"
            disabled={!canSubmit}
          >
            <Button
              type="primary"
              icon={<SwapOutlined />}
              loading={isPending}
              disabled={!canSubmit}
              size="large"
            >
              Tạo phiếu điều chuyển
            </Button>
          </Popconfirm>
        </div>
      </div>

      {renderMapModal()}
    </>
  );
}
