import { useState } from 'react';
import { Modal, InputNumber, Button, App, Popconfirm } from 'antd';
import { PlusOutlined, CloseOutlined, CheckOutlined } from '@ant-design/icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { storageLocationApi } from '@/api/warehouses';
import { formatNumber } from '@/utils/formatCurrency';
import { getErrorMessage } from '@/utils/getErrorMessage';

function getCapacityColor(used, capacity) {
  if (capacity == null) return 'border-slate-200 bg-slate-50';
  const pct = Math.min(100, Math.round((used / capacity) * 100));
  if (pct >= 90) return 'border-red-300 bg-red-50';
  if (pct >= 70) return 'border-amber-300 bg-amber-50';
  return 'border-emerald-200 bg-emerald-50';
}

export default function WarehouseMapConfig({ open, onClose, rows, warehouseId }) {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [editingCell, setEditingCell] = useState(null);
  const [capacityValue, setCapacityValue] = useState(null);
  const [newRowCount, setNewRowCount] = useState(6);
  const [preview, setPreview] = useState(null);

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['dashboard', 'storage-map'] });
    queryClient.invalidateQueries({ queryKey: ['storage-locations'] });
  };

  const { mutate: updateCapacity, isPending: isUpdating } = useMutation({
    mutationFn: ({ id, rowLabel, colIndex, capacity }) =>
      storageLocationApi.update(id, { rowLabel, colIndex, capacity }),
    onSuccess: () => {
      invalidateAll();
      message.success('Cập nhật sức chứa thành công');
      setEditingCell(null);
    },
    onError: (err) => message.error(getErrorMessage(err)),
  });

  const { mutate: addLocation, isPending: isAdding } = useMutation({
    mutationFn: (values) => storageLocationApi.create(values),
    onSuccess: () => invalidateAll(),
    onError: (err) => message.error(getErrorMessage(err)),
  });

  const { mutate: deleteLocation } = useMutation({
    mutationFn: (id) => storageLocationApi.remove(id),
    onSuccess: () => {
      invalidateAll();
      message.success('Xoá vị trí thành công');
    },
    onError: (err) => message.error(getErrorMessage(err)),
  });

  const maxCols = Math.max(...rows.map((r) => r.cells.length), 0);
  const lastRowLabel = rows.length > 0 ? rows[rows.length - 1].rowLabel : null;
  const nextRowLabel = lastRowLabel ? String.fromCharCode(lastRowLabel.charCodeAt(0) + 1) : 'A';

  const handleAddCell = (rowLabel) => {
    const row = rows.find((r) => r.rowLabel === rowLabel);
    const nextCol = row ? Math.max(...row.cells.map((c) => c.colIndex), 0) + 1 : 1;
    addLocation({ warehouseId, rowLabel, colIndex: nextCol });
  };

  const handleShowPreview = () => {
    const count = newRowCount || 1;
    const selected = new Set();
    for (let i = 1; i <= count; i++) selected.add(i);
    setPreview({ rowLabel: nextRowLabel, count, selected });
  };

  const togglePreviewCell = (colIndex) => {
    setPreview((prev) => {
      if (!prev) return prev;
      const next = new Set(prev.selected);
      if (next.has(colIndex)) next.delete(colIndex);
      else next.add(colIndex);
      return { ...prev, selected: next };
    });
  };

  const handleConfirmPreview = () => {
    if (!preview || preview.selected.size === 0) {
      message.warning('Vui lòng chọn ít nhất 1 vị trí');
      return;
    }
    for (const colIndex of Array.from(preview.selected).sort((a, b) => a - b)) {
      addLocation({ warehouseId, rowLabel: preview.rowLabel, colIndex });
    }
    message.success(`Đã thêm ${preview.selected.size} vị trí vào dãy ${preview.rowLabel}`);
    setPreview(null);
  };

  const handleSaveCapacity = (cell) => {
    updateCapacity({
      id: cell.locationId,
      rowLabel: cell.rowLabel,
      colIndex: cell.colIndex,
      capacity: capacityValue || null,
    });
  };

  const handleDeleteCell = (cell) => {
    deleteLocation(cell.locationId);
  };

  return (
    <Modal
      title="Cấu hình bản đồ kho"
      open={open}
      onCancel={onClose}
      footer={null}
      width={Math.max(640, maxCols * 140 + 260)}
      centered
      destroyOnClose
    >
      <div className="mb-4 text-sm text-slate-500">
        Nhấn vào ô để cấu hình sức chứa. Nhấn <PlusOutlined className="text-[10px]" /> cuối dãy để thêm ô lẻ.
      </div>

      {/* Grid config view */}
      <div className="overflow-x-auto">
        <div className="min-w-full">
          {rows.map((row) => {
            // Build colIndex→cell map for position-accurate rendering
            const cellMap = {};
            let rowMaxCol = 0;
            for (const c of row.cells) {
              cellMap[c.colIndex] = c;
              if (c.colIndex > rowMaxCol) rowMaxCol = c.colIndex;
            }
            const totalCols = Math.max(rowMaxCol, maxCols);

            return (
              <div key={row.rowLabel} className="flex gap-2 mb-2 items-stretch">
                <div className="w-8 flex items-center justify-center font-black text-slate-500 bg-slate-100 rounded-lg text-sm shrink-0">
                  {row.rowLabel}
                </div>

                {Array.from({ length: totalCols }, (_, i) => {
                  const col = i + 1;
                  const cell = cellMap[col];

                  // Empty slot
                  if (!cell) {
                    return (
                      <div key={col} className="w-[140px] shrink-0 rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/30 p-2 flex flex-col items-center justify-center">
                        <button
                          className="text-slate-300 hover:text-blue-500 transition-colors"
                          onClick={() => addLocation({ warehouseId, rowLabel: row.rowLabel, colIndex: col })}
                          title={`Thêm vị trí ${row.rowLabel}-${col}`}
                        >
                          <PlusOutlined className="text-lg" />
                        </button>
                      </div>
                    );
                  }

                  const occupants = cell.occupants ?? [];
                  const isEmpty = !occupants.length;
                  const isEditing = editingCell === cell.locationId;
                  const used = cell.usedQuantity ?? 0;
                  const pct = cell.capacity != null ? Math.min(100, Math.round((used / cell.capacity) * 100)) : null;

                  return (
                    <div
                      key={col}
                      className={`relative w-[140px] shrink-0 rounded-lg border-2 p-2 transition-all cursor-pointer hover:shadow-md group ${
                        isEditing ? 'border-blue-400 bg-blue-50 shadow-lg ring-2 ring-blue-200' : getCapacityColor(used, cell.capacity)
                      }`}
                      onClick={() => {
                        if (!isEditing) {
                          setEditingCell(cell.locationId);
                          setCapacityValue(cell.capacity);
                        }
                      }}
                    >
                      {!isEditing && (
                        <Popconfirm
                          title={`Xoá vị trí ${cell.locationCode}?`}
                          onConfirm={(e) => { e.stopPropagation(); handleDeleteCell(cell); }}
                          onCancel={(e) => e.stopPropagation()}
                          okText="Xoá"
                          okType="danger"
                          cancelText="Huỷ"
                        >
                          <button
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-[9px] opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-600 z-10"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <CloseOutlined />
                          </button>
                        </Popconfirm>
                      )}

                      <div className="text-[11px] font-mono font-bold text-slate-600 mb-1">{cell.locationCode}</div>

                      {isEditing ? (
                        <div className="flex flex-col gap-1.5">
                          <InputNumber
                            size="small"
                            min={1}
                            placeholder="Sức chứa"
                            value={capacityValue}
                            onChange={setCapacityValue}
                            className="w-full"
                            autoFocus
                            onPressEnter={() => handleSaveCapacity(cell)}
                          />
                          <div className="flex gap-1">
                            <Button
                              size="small"
                              type="primary"
                              className="flex-1 text-[10px]"
                              loading={isUpdating}
                              onClick={(e) => { e.stopPropagation(); handleSaveCapacity(cell); }}
                            >
                              Lưu
                            </Button>
                            <Button
                              size="small"
                              className="flex-1 text-[10px]"
                              onClick={(e) => { e.stopPropagation(); setEditingCell(null); }}
                            >
                              Huỷ
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {!isEmpty && (
                            <div className="text-[10px] text-slate-500 truncate" title={occupants.map((o) => o.productName).join(', ')}>
                              {occupants.length} lô - {formatNumber(used)} thùng
                            </div>
                          )}
                          {isEmpty && <div className="text-[10px] text-slate-400 italic">Trống</div>}

                          {cell.capacity != null ? (
                            <div className="mt-1">
                              <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-emerald-500'
                                  }`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <div className="text-[9px] text-slate-400 mt-0.5 text-center">
                                {formatNumber(used)}/{formatNumber(cell.capacity)} ({pct}%)
                              </div>
                            </div>
                          ) : (
                            <div className="text-[9px] text-slate-300 mt-1 text-center italic">Chưa cấu hình</div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}

                <button
                  className="w-10 min-h-[60px] rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-all shrink-0"
                  onClick={() => handleAddCell(row.rowLabel)}
                  title={`Thêm ô vào cuối dãy ${row.rowLabel}`}
                >
                  <PlusOutlined />
                </button>
              </div>
            );
          })}

          {/* Preview row */}
          {preview && (
            <div className="flex flex-wrap gap-2 mb-2 items-stretch">
              <div className="w-8 flex items-center justify-center font-black text-blue-500 bg-blue-100 rounded-lg text-sm shrink-0">
                {preview.rowLabel}
              </div>

              {Array.from({ length: preview.count }, (_, i) => {
                const col = i + 1;
                const selected = preview.selected.has(col);
                return (
                  <div
                    key={col}
                    className={`relative w-[140px] shrink-0 rounded-lg border-2 p-2 transition-all cursor-pointer ${
                      selected
                        ? 'border-blue-400 bg-blue-50 shadow-md ring-2 ring-blue-200'
                        : 'border-dashed border-slate-300 bg-slate-50/50 opacity-50'
                    }`}
                    onClick={() => togglePreviewCell(col)}
                  >
                    {selected && (
                      <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[9px] shadow-sm z-10">
                        <CheckOutlined />
                      </div>
                    )}
                    <div className="text-[11px] font-mono font-bold text-slate-500 mb-1">
                      {preview.rowLabel}-{col}
                    </div>
                    <div className="text-[10px] text-slate-400 text-center">
                      {selected ? 'Đã chọn' : 'Bỏ qua'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {preview && (
            <div className="flex gap-2 mb-4 ml-10">
              <Button
                type="primary"
                size="small"
                icon={<CheckOutlined />}
                loading={isAdding}
                onClick={handleConfirmPreview}
              >
                Xác nhận tạo {preview.selected.size} vị trí
              </Button>
              <Button size="small" onClick={() => setPreview(null)}>
                Huỷ
              </Button>
              <span className="text-[12px] text-slate-400 self-center ml-2">
                Nhấn vào ô để chọn/bỏ chọn
              </span>
            </div>
          )}

          {/* Add new row */}
          {!preview && (
            <div className="flex gap-2 mb-2 items-center">
              <div className="w-8 shrink-0" />
              <div className="flex items-center gap-2 rounded-lg border-2 border-dashed border-slate-300 px-3 py-2 hover:border-blue-300 transition-colors">
                <span className="text-sm text-slate-500 whitespace-nowrap">Thêm dãy {nextRowLabel} với</span>
                <InputNumber
                  min={1}
                  max={20}
                  size="small"
                  value={newRowCount}
                  onChange={(v) => setNewRowCount(v || 1)}
                  className="w-16"
                />
                <span className="text-sm text-slate-500">vị trí</span>
                <Button
                  type="primary"
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={handleShowPreview}
                >
                  Xem trước
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
