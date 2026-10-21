import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, InputNumber, App, Popconfirm, Spin, Alert } from 'antd';
import {
  PlusOutlined,
  CloseOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import { usePermissions } from '@/hooks/usePermissions';
import { storageLocationApi } from '@/api/warehouses';
import { formatNumber } from '@/utils/formatCurrency';
import { getErrorMessage } from '@/utils/getErrorMessage';
import { DEFAULT_WAREHOUSE_ID } from '@/constants/warehouse';

const LOCATIONS_KEY = ['storage-locations'];

function getCapacityColor(capacity) {
  if (capacity == null) return 'border-slate-200 bg-slate-50';
  return 'border-emerald-200 bg-emerald-50';
}

export default function LocationsTab() {
  const { message } = App.useApp();
  const { canManageMasterData } = usePermissions();
  const queryClient = useQueryClient();
  const [editingCell, setEditingCell] = useState(null);
  const [capacityValue, setCapacityValue] = useState(null);
  const [newRowCount, setNewRowCount] = useState(6);
  // Preview state: { rowLabel, count, selected: Set<colIndex> }
  const [preview, setPreview] = useState(null);

  const { data: allLocations = [], isLoading, isError, error } = useQuery({
    queryKey: LOCATIONS_KEY,
    queryFn: storageLocationApi.getAll,
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: LOCATIONS_KEY });
    queryClient.invalidateQueries({ queryKey: ['dashboard', 'storage-map'] });
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
    },
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

  // Group flat locations into grid rows, build a colIndex→cell map per row
  const { rows, maxCols } = useMemo(() => {
    const wLocations = allLocations.filter((l) => l.warehouseId === DEFAULT_WAREHOUSE_ID);

    const rowMap = {};
    let mc = 0;
    for (const loc of wLocations) {
      const label = loc.rowLabel ?? 'A';
      if (!rowMap[label]) rowMap[label] = {};
      rowMap[label][loc.colIndex] = loc;
      if (loc.colIndex > mc) mc = loc.colIndex;
    }

    const sortedRows = Object.keys(rowMap)
      .sort()
      .map((label) => ({
        rowLabel: label,
        cellMap: rowMap[label],
        maxCol: Math.max(...Object.keys(rowMap[label]).map(Number)),
      }));

    return { rows: sortedRows, maxCols: mc };
  }, [allLocations]);

  const lastRowLabel = rows.length > 0 ? rows[rows.length - 1].rowLabel : null;
  const nextRowLabel = lastRowLabel ? String.fromCharCode(lastRowLabel.charCodeAt(0) + 1) : 'A';

  // Add a single cell at the end of a row
  const handleAddCell = (rowLabel) => {
    const row = rows.find((r) => r.rowLabel === rowLabel);
    const nextCol = row ? row.maxCol + 1 : 1;
    addLocation({ warehouseId: DEFAULT_WAREHOUSE_ID, rowLabel, colIndex: nextCol });
  };

  // Show preview row
  const handleShowPreview = () => {
    const count = newRowCount || 1;
    const selected = new Set();
    for (let i = 1; i <= count; i++) selected.add(i);
    setPreview({ rowLabel: nextRowLabel, count, selected });
  };

  // Toggle a preview cell selection
  const togglePreviewCell = (colIndex) => {
    setPreview((prev) => {
      if (!prev) return prev;
      const next = new Set(prev.selected);
      if (next.has(colIndex)) next.delete(colIndex);
      else next.add(colIndex);
      return { ...prev, selected: next };
    });
  };

  // Confirm preview — create only selected cells
  const handleConfirmPreview = () => {
    if (!preview || preview.selected.size === 0) {
      message.warning('Vui lòng chọn ít nhất 1 vị trí');
      return;
    }
    for (const colIndex of Array.from(preview.selected).sort((a, b) => a - b)) {
      addLocation({ warehouseId: DEFAULT_WAREHOUSE_ID, rowLabel: preview.rowLabel, colIndex });
    }
    message.success(`Đã thêm ${preview.selected.size} vị trí vào dãy ${preview.rowLabel}`);
    setPreview(null);
  };

  const handleSaveCapacity = (cell) => {
    updateCapacity({
      id: cell.id,
      rowLabel: cell.rowLabel,
      colIndex: cell.colIndex,
      capacity: capacityValue || null,
    });
  };

  const handleDeleteCell = (cell) => {
    deleteLocation(cell.id);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[300px] bg-white rounded-xl border border-slate-200 shadow-sm">
        <Spin size="large" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <Alert type="error" showIcon message="Không tải được dữ liệu vị trí" description={getErrorMessage(error)} />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 md:p-6">
      <div className="mb-4 text-sm text-slate-500">
        Nhấn vào ô để cấu hình sức chứa. Nhấn <PlusOutlined className="text-[10px]" /> cuối dãy để thêm ô lẻ.
      </div>

      {/* Grid config view */}
      <div className="overflow-x-auto">
        <div className="min-w-full">
          {rows.map((row) => {
            const totalCols = Math.max(row.maxCol, maxCols);
            return (
              <div key={row.rowLabel} className="flex gap-2 mb-2 items-stretch">
                {/* Row label */}
                <div className="w-8 flex items-center justify-center font-black text-slate-500 bg-slate-100 rounded-lg text-sm shrink-0">
                  {row.rowLabel}
                </div>

                {/* Render each column slot */}
                {Array.from({ length: totalCols }, (_, i) => {
                  const col = i + 1;
                  const cell = row.cellMap[col];

                  // Empty slot — no location at this position
                  if (!cell) {
                    return (
                      <div key={col} className="w-[140px] shrink-0 rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/30 p-2 flex flex-col items-center justify-center">
                        {canManageMasterData ? (
                          <button
                            className="text-slate-300 hover:text-blue-500 transition-colors"
                            onClick={() => addLocation({ warehouseId: DEFAULT_WAREHOUSE_ID, rowLabel: row.rowLabel, colIndex: col })}
                            title={`Thêm vị trí ${row.rowLabel}-${col}`}
                          >
                            <PlusOutlined className="text-lg" />
                          </button>
                        ) : (
                          <span className="text-[9px] text-slate-300">—</span>
                        )}
                      </div>
                    );
                  }

                  const isEditing = editingCell === cell.id;

                  return (
                    <div
                      key={col}
                      className={`relative w-[140px] shrink-0 rounded-lg border-2 p-2 transition-all cursor-pointer hover:shadow-md group ${
                        isEditing ? 'border-blue-400 bg-blue-50 shadow-lg ring-2 ring-blue-200' : getCapacityColor(cell.capacity)
                      }`}
                      onClick={() => {
                        if (!isEditing && canManageMasterData) {
                          setEditingCell(cell.id);
                          setCapacityValue(cell.capacity);
                        }
                      }}
                    >
                      {/* Delete single cell button */}
                      {canManageMasterData && !isEditing && (
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
                          {cell.capacity != null ? (
                            <div className="text-[10px] text-slate-500 text-center">
                              Sức chứa: <span className="font-bold">{formatNumber(cell.capacity)}</span>
                            </div>
                          ) : (
                            <div className="text-[9px] text-slate-300 text-center italic">Chưa cấu hình</div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}

                {/* Add cell button at end of row */}
                {canManageMasterData && (
                  <button
                    className="w-10 min-h-[60px] rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-all shrink-0"
                    onClick={() => handleAddCell(row.rowLabel)}
                    title={`Thêm ô vào cuối dãy ${row.rowLabel}`}
                  >
                    <PlusOutlined />
                  </button>
                )}
              </div>
            );
          })}

          {/* Preview row — chưa lưu, cho user chọn vị trí */}
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

          {/* Preview actions */}
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
              <Button
                size="small"
                onClick={() => setPreview(null)}
              >
                Huỷ
              </Button>
              <span className="text-[12px] text-slate-400 self-center ml-2">
                Nhấn vào ô để chọn/bỏ chọn
              </span>
            </div>
          )}

          {/* Add new row — chỉ hiện khi không có preview */}
          {canManageMasterData && !preview && (
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

          {rows.length === 0 && !preview && !canManageMasterData && (
            <div className="text-center text-slate-400 py-12">
              Chưa có vị trí nào.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
