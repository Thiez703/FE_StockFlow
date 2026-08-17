import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Input, InputNumber, Select, Tooltip, App, Modal } from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  DeleteOutlined,
  ExclamationCircleFilled,
} from '@ant-design/icons';
import { usePermissions } from '@/hooks/usePermissions';
import DataTable from '@/components/ui/DataTable';
import TableEmptyState from '@/components/ui/TableEmptyState';
import StatusPill from '@/components/ui/StatusPill';
import FadeSection from '@/components/ui/FadeSection';
import DocCode from '@/components/ui/DocCode';
import { storageLocationApi, warehouseApi } from '@/api/warehouses';
import { getErrorMessage } from '@/utils/getErrorMessage';

const LOCATIONS_KEY = ['storage-locations'];
const WAREHOUSES_KEY = ['warehouses'];

/**
 * Calculate the next rowLabel + colIndex for a given warehouse.
 *
 * Storage grid layout: rows A, B, C, … with dynamic columns per row.
 * Finds the max column count across existing rows and uses that as the row width.
 * e.g. A-1, A-2, …, A-N, B-1, B-2, …
 */
function getNextSlot(existingLocations, warehouseId) {
  const wLocations = existingLocations.filter((l) => l.warehouseId === warehouseId);

  if (wLocations.length === 0) return { rowLabel: 'A', colIndex: 1 };

  // Find max columns per row and the last occupied slot
  let maxRowOrd = 0;
  let maxColInRow = 0;
  let maxColsPerRow = 0;

  for (const loc of wLocations) {
    const rowOrd = (loc.rowLabel ?? 'A').charCodeAt(0) - 65;
    if (loc.colIndex > maxColsPerRow) maxColsPerRow = loc.colIndex;
    if (rowOrd > maxRowOrd || (rowOrd === maxRowOrd && loc.colIndex > maxColInRow)) {
      maxRowOrd = rowOrd;
      maxColInRow = loc.colIndex;
    }
  }

  const colLimit = maxColsPerRow || 6;

  // Next slot
  if (maxColInRow < colLimit) {
    return { rowLabel: String.fromCharCode(65 + maxRowOrd), colIndex: maxColInRow + 1 };
  }
  // Move to next row
  return { rowLabel: String.fromCharCode(65 + maxRowOrd + 1), colIndex: 1 };
}

export default function LocationsTab() {
  const { message, modal } = App.useApp();
  const { canManageMasterData } = usePermissions();
  const queryClient = useQueryClient();

  const [keyword, setKeyword] = useState('');
  const [filterWarehouseId, setFilterWarehouseId] = useState(null);
  const [addWarehouseId, setAddWarehouseId] = useState(null);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: LOCATIONS_KEY,
    queryFn: storageLocationApi.getAll,
  });

  const { data: warehouses = [] } = useQuery({
    queryKey: WAREHOUSES_KEY,
    queryFn: warehouseApi.getAll,
  });

  const { mutate: addLocation, isPending: isAdding } = useMutation({
    mutationFn: (values) => storageLocationApi.create(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LOCATIONS_KEY });
      message.success('Đã thêm vị trí mới');
    },
    onError: (error) => message.error(getErrorMessage(error)),
  });

  const { mutate: updateLocation } = useMutation({
    mutationFn: ({ id, ...body }) => storageLocationApi.update(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LOCATIONS_KEY });
      message.success('Đã cập nhật vị trí');
    },
    onError: (error) => message.error(getErrorMessage(error)),
  });

  const { mutate: deleteLocation } = useMutation({
    mutationFn: (id) => storageLocationApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LOCATIONS_KEY });
      message.success('Đã xóa vị trí');
    },
    onError: (error) => message.error(getErrorMessage(error)),
  });

  const warehouseOptions = warehouses.map((w) => ({ value: w.id, label: `${w.code} — ${w.name}` }));
  const warehouseName = useMemo(
    () => Object.fromEntries(warehouses.map((w) => [w.id, w.name])),
    [warehouses],
  );

  const data = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return rows.filter((l) => {
      const okKw = !kw || [l.locationCode, l.rowLabel].some((v) => String(v ?? '').toLowerCase().includes(kw));
      const okWarehouse = !filterWarehouseId || l.warehouseId === filterWarehouseId;
      return okKw && okWarehouse;
    });
  }, [rows, keyword, filterWarehouseId]);

  const handleAdd = () => {
    const wId = addWarehouseId ?? warehouses[0]?.id;
    if (!wId) return;
    const { rowLabel, colIndex } = getNextSlot(rows, wId);
    addLocation({ warehouseId: wId, rowLabel, colIndex });
  };

  const handleDelete = (location) => {
    modal.confirm({
      title: 'Xác nhận xóa vị trí',
      icon: <ExclamationCircleFilled />,
      content: `Bạn có chắc chắn muốn xóa vị trí "${location.locationCode}"?`,
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Huỷ',
      onOk: () => deleteLocation(location.id),
    });
  };

  const columns = [
    {
      title: 'Mã vị trí',
      dataIndex: 'locationCode',
      width: 160,
      render: (c) => <DocCode>{c}</DocCode>,
    },
    {
      title: 'Hàng',
      dataIndex: 'rowLabel',
      width: 100,
      align: 'center',
      render: (r) => <span className="font-semibold text-ink">{r}</span>,
    },
    {
      title: 'Cột',
      dataIndex: 'colIndex',
      width: 100,
      align: 'center',
      render: (c) => <span className="text-ink">{c}</span>,
    },
    {
      title: 'Kho',
      dataIndex: 'warehouseId',
      width: 220,
      render: (id) => <span className="text-ink">{warehouseName[id] ?? '—'}</span>,
    },
    {
      title: 'Sức chứa (Thùng)',
      dataIndex: 'capacity',
      width: 160,
      align: 'center',
      render: (val, record) => (
        <InputNumber
          min={1}
          placeholder="Không giới hạn"
          value={val}
          disabled={!canManageMasterData}
          className="w-full"
          onChange={(v) => updateLocation({
            id: record.id,
            rowLabel: record.rowLabel,
            colIndex: record.colIndex,
            capacity: v || null,
          })}
        />
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      align: 'center',
      width: 130,
      render: (s) => <StatusPill status={s ?? 'ACTIVE'} />,
    },
    {
      title: '',
      key: 'action',
      align: 'center',
      width: 64,
      render: (_, r) => (
        <Tooltip title="Xóa vị trí">
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            disabled={!canManageMasterData}
            onClick={() => handleDelete(r)}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Top Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex flex-wrap items-center gap-4">
          <Input
            allowClear
            prefix={<SearchOutlined className="text-slate-400" />}
            placeholder="Tìm theo mã vị trí..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="w-full sm:w-80"
          />
          <Select
            allowClear
            placeholder="Lọc theo kho"
            className="w-full sm:w-64"
            options={warehouseOptions}
            value={filterWarehouseId}
            onChange={setFilterWarehouseId}
          />
        </div>
      </div>

      {/* Nội dung chính */}
      <div className="min-w-0 flex-1">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-4">
            <span className="text-sm text-ink-sub">{data.length} vị trí</span>
          </div>
          {canManageMasterData && (
            <div className="flex items-center gap-2">
              <Select
                placeholder="Chọn kho"
                className="w-48"
                options={warehouseOptions}
                value={addWarehouseId ?? warehouses[0]?.id ?? undefined}
                onChange={setAddWarehouseId}
              />
              <Tooltip title={warehouses.length ? '' : 'Cần có ít nhất một kho trước'}>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  loading={isAdding}
                  disabled={!warehouses.length}
                  onClick={handleAdd}
                >
                  Thêm vị trí
                </Button>
              </Tooltip>
            </div>
          )}
        </div>

        <FadeSection dataKey={data.map((l) => l.id).join(',')}>
          <DataTable
            columns={columns}
            dataSource={data}
            loading={isLoading}
            locale={{ emptyText: <TableEmptyState message="Không tìm thấy vị trí phù hợp" /> }}
          />
        </FadeSection>
      </div>
    </div>
  );
}
