import { useState } from 'react';
import { Modal, InputNumber, Button, App, Popconfirm } from 'antd';
import { DeleteOutlined, ArrowRightOutlined, ArrowDownOutlined } from '@ant-design/icons';
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
    onSuccess: () => {
      invalidateAll();
      message.success('Thêm vị trí mới thành công');
    },
    onError: (err) => message.error(getErrorMessage(err)),
  });

  const { mutate: deleteLocation, isPending: isDeleting } = useMutation({
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

  const handleAddRow = () => {
    const colCount = maxCols || 6;
    for (let i = 1; i <= colCount; i++) {
      addLocation({ warehouseId, rowLabel: nextRowLabel, colIndex: i });
    }
  };

  const handleAddColumn = () => {
    const newColIndex = maxCols + 1;
    for (const row of rows) {
      addLocation({ warehouseId, rowLabel: row.rowLabel, colIndex: newColIndex });
    }
  };

  const handleSaveCapacity = (cell) => {
    updateCapacity({
      id: cell.locationId,
      rowLabel: cell.rowLabel,
      colIndex: cell.colIndex,
      capacity: capacityValue || null,
    });
  };

  const handleDeleteLastRow = () => {
    if (rows.length === 0) return;
    const lastRow = rows[rows.length - 1];
    const emptyCells = lastRow.cells.filter((c) => !c.occupants?.length);
    if (emptyCells.length !== lastRow.cells.length) {
      message.warning('Không thể xoá dãy đang có hàng tồn kho');
      return;
    }
    for (const cell of lastRow.cells) {
      deleteLocation(cell.locationId);
    }
  };

  const handleDeleteLastColumn = () => {
    if (maxCols <= 1) return;
    const lastColCells = rows.map((r) => r.cells[r.cells.length - 1]).filter(Boolean);
    const hasOccupants = lastColCells.some((c) => c.occupants?.length > 0);
    if (hasOccupants) {
      message.warning('Không thể xoá cột đang có hàng tồn kho');
      return;
    }
    for (const cell of lastColCells) {
      deleteLocation(cell.locationId);
    }
  };

  return (
    <Modal
      title="Cấu hình bản đồ kho"
      open={open}
      onCancel={onClose}
      footer={null}
      width={Math.max(640, maxCols * 140 + 200)}
      centered
      destroyOnClose
    >
      <div className="mb-4 text-sm text-slate-500">
        Nhấn vào ô để cấu hình sức chứa. Sử dụng các nút bên dưới để mở rộng hoặc thu gọn bản đồ kho.
      </div>

      {/* Grid config view */}
      <div className="overflow-x-auto">
        <div className="min-w-full">
          {/* Column headers */}
          <div className="flex gap-2 mb-2 ml-10">
            {Array.from({ length: maxCols }, (_, i) => (
              <div key={i} className="flex-1 min-w-[100px] text-center text-[11px] font-bold text-slate-400 uppercase">
                Cột {i + 1}
              </div>
            ))}
          </div>

          {rows.map((row) => (
            <div key={row.rowLabel} className="flex gap-2 mb-2 items-stretch">
              {/* Row label */}
              <div className="w-8 flex items-center justify-center font-black text-slate-500 bg-slate-100 rounded-lg text-sm shrink-0">
                {row.rowLabel}
              </div>

              {/* Cells */}
              {row.cells.map((cell) => {
                const occupants = cell.occupants ?? [];
                const isEmpty = !occupants.length;
                const isEditing = editingCell === cell.locationId;
                const used = cell.usedQuantity ?? 0;
                const pct = cell.capacity != null ? Math.min(100, Math.round((used / cell.capacity) * 100)) : null;

                return (
                  <div
                    key={cell.locationCode}
                    className={`flex-1 min-w-[100px] rounded-lg border-2 p-2 transition-all cursor-pointer hover:shadow-md ${
                      isEditing ? 'border-blue-400 bg-blue-50 shadow-lg ring-2 ring-blue-200' : getCapacityColor(used, cell.capacity)
                    }`}
                    onClick={() => {
                      if (!isEditing) {
                        setEditingCell(cell.locationId);
                        setCapacityValue(cell.capacity);
                      }
                    }}
                  >
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
            </div>
          ))}
        </div>
      </div>

      {/* Expansion controls */}
      <div className="mt-6 pt-4 border-t border-slate-200">
        <div className="text-sm font-semibold text-slate-700 mb-3">Mở rộng bản đồ kho</div>
        <div className="flex flex-wrap gap-3">
          <Button
            icon={<ArrowDownOutlined />}
            onClick={handleAddRow}
            loading={isAdding}
          >
            Thêm dãy {nextRowLabel} (chiều dọc)
          </Button>
          <Button
            icon={<ArrowRightOutlined />}
            onClick={handleAddColumn}
            loading={isAdding}
          >
            Thêm cột {maxCols + 1} (chiều ngang)
          </Button>

          <div className="flex-1" />

          {rows.length > 1 && (
            <Popconfirm
              title={`Xoá dãy ${lastRowLabel}?`}
              description="Tất cả vị trí trong dãy này sẽ bị xoá"
              onConfirm={handleDeleteLastRow}
              okText="Xoá"
              okType="danger"
              cancelText="Huỷ"
            >
              <Button danger icon={<DeleteOutlined />} loading={isDeleting}>
                Xoá dãy {lastRowLabel}
              </Button>
            </Popconfirm>
          )}
          {maxCols > 1 && (
            <Popconfirm
              title={`Xoá cột ${maxCols}?`}
              description="Tất cả vị trí ở cột này sẽ bị xoá"
              onConfirm={handleDeleteLastColumn}
              okText="Xoá"
              okType="danger"
              cancelText="Huỷ"
            >
              <Button danger icon={<DeleteOutlined />} loading={isDeleting}>
                Xoá cột {maxCols}
              </Button>
            </Popconfirm>
          )}
        </div>
      </div>
    </Modal>
  );
}
