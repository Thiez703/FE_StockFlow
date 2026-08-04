import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Input, Select, Form, Modal, Tooltip, App, Segmented } from 'antd';
import { PlusOutlined, EditOutlined, SearchOutlined, AppstoreOutlined, UnorderedListOutlined, DeleteOutlined } from '@ant-design/icons';
import { usePermissions } from '@/hooks/usePermissions';
import DataTable from '@/components/ui/DataTable';
import FilterSidebar from '@/components/ui/FilterSidebar';
import TableEmptyState from '@/components/ui/TableEmptyState';
import FadeSection from '@/components/ui/FadeSection';
import DocCode from '@/components/ui/DocCode';
import { storageLocationApi, warehouseApi } from '@/api/warehouses';
import { getErrorMessage } from '@/utils/getErrorMessage';

const LOCATIONS_KEY = ['storage-locations'];
const WAREHOUSES_KEY = ['warehouses'];

const ROWS = ['A', 'B', 'C', 'D', 'E', 'F'];
const COLS = Array.from({ length: 6 }, (_, i) => String(i + 1).padStart(2, '0'));

function WarehouseMap({ warehouseId, locations, onCellClick }) {
  if (!warehouseId) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 flex flex-col items-center justify-center">
        <TableEmptyState message="Vui lòng chọn một kho bên trái để xem sơ đồ" />
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl overflow-x-auto shadow-inner">
      <div className="min-w-[860px] bg-white p-8 rounded-lg shadow-sm border border-slate-300 relative mx-auto">
        <div className="absolute top-0 left-0 w-full h-3 bg-slate-800 rounded-t-lg opacity-10"></div>
        <div className="absolute bottom-0 left-0 w-full h-3 bg-slate-800 rounded-b-lg opacity-10"></div>
        
        <div className="text-center mb-8">
          <div className="inline-block px-8 py-2 bg-slate-100 rounded-b-lg border-b-2 border-x-2 border-slate-200 font-bold text-slate-400 tracking-widest uppercase text-sm -mt-8">
            Cửa chính / Khu vực xuất nhập
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {ROWS.map(row => (
            <div key={row} className="flex gap-4">
              <div className="w-10 flex items-center justify-center font-bold text-slate-400 bg-slate-50 rounded border border-slate-100">{row}</div>
              <div className="flex-1 flex gap-12 relative">
                {/* Lối đi ở giữa */}
                <div className="absolute left-1/2 top-0 bottom-0 w-8 -ml-4 flex items-center justify-center border-x-2 border-dashed border-slate-100 bg-slate-50/50">
                  {row === 'C' && <span className="text-[10px] font-bold text-slate-300 tracking-widest rotate-90 whitespace-nowrap">LỐI ĐI</span>}
                </div>

                <div className="flex-1 grid grid-cols-3 gap-3">
                  {COLS.slice(0, 3).map(col => {
                    const code = `${row}-${col}`;
                    const loc = locations.find(l => l.locationCode === code);
                    const isOccupied = !!loc;
                    return (
                      <Tooltip key={code} title={isOccupied ? `Đã thiết lập: ${code}` : `Trống: Bấm để thêm ${code}`}>
                        <button
                          onClick={() => onCellClick(code, row, loc)}
                          className={`h-16 rounded-md border-2 transition-all flex flex-col items-center justify-center cursor-pointer relative overflow-hidden group ${
                            isOccupied 
                              ? 'border-blue-500 bg-blue-50 hover:bg-blue-100 shadow-sm' 
                              : 'border-dashed border-slate-300 bg-transparent hover:border-blue-400 hover:bg-blue-50'
                          }`}
                        >
                          <span className={`text-[11px] font-mono font-bold transition-colors ${isOccupied ? 'text-blue-700' : 'text-slate-400 group-hover:text-blue-500'}`}>
                            {code}
                          </span>
                          {isOccupied && (
                            <div className="absolute bottom-0 w-full h-1.5 bg-blue-500 group-hover:h-2 transition-all" />
                          )}
                          {!isOccupied && (
                            <PlusOutlined className="text-blue-400 opacity-0 group-hover:opacity-100 mt-1 transition-opacity text-xs" />
                          )}
                        </button>
                      </Tooltip>
                    );
                  })}
                </div>
                
                <div className="flex-1 grid grid-cols-3 gap-3">
                  {COLS.slice(3, 6).map(col => {
                    const code = `${row}-${col}`;
                    const loc = locations.find(l => l.locationCode === code);
                    const isOccupied = !!loc;
                    return (
                      <Tooltip key={code} title={isOccupied ? `Đã thiết lập: ${code}` : `Trống: Bấm để thêm ${code}`}>
                        <button
                          onClick={() => onCellClick(code, row, loc)}
                          className={`h-16 rounded-md border-2 transition-all flex flex-col items-center justify-center cursor-pointer relative overflow-hidden group ${
                            isOccupied 
                              ? 'border-blue-500 bg-blue-50 hover:bg-blue-100 shadow-sm' 
                              : 'border-dashed border-slate-300 bg-transparent hover:border-blue-400 hover:bg-blue-50'
                          }`}
                        >
                          <span className={`text-[11px] font-mono font-bold transition-colors ${isOccupied ? 'text-blue-700' : 'text-slate-400 group-hover:text-blue-500'}`}>
                            {code}
                          </span>
                          {isOccupied && (
                            <div className="absolute bottom-0 w-full h-1.5 bg-blue-500 group-hover:h-2 transition-all" />
                          )}
                          {!isOccupied && (
                            <PlusOutlined className="text-blue-400 opacity-0 group-hover:opacity-100 mt-1 transition-opacity text-xs" />
                          )}
                        </button>
                      </Tooltip>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-8 flex items-center justify-center gap-6 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-dashed border-slate-300 rounded-sm"></div>
            <span>Vị trí trống</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-500 bg-blue-50 rounded-sm"></div>
            <span>Đã thiết lập</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LocationsTab() {
  const { message } = App.useApp();
  const { canManageMasterData } = usePermissions();
  const queryClient = useQueryClient();

  const [keyword, setKeyword] = useState('');
  const [warehouseId, setWarehouseId] = useState(null);
  const [zone, setZone] = useState(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewMode, setViewMode] = useState('map'); // 'map' | 'list'
  const [form] = Form.useForm();
  const [modal, contextHolder] = Modal.useModal();

  const { data: rows = [], isLoading } = useQuery({
    queryKey: LOCATIONS_KEY,
    queryFn: storageLocationApi.getAll,
  });

  const { data: warehouses = [] } = useQuery({
    queryKey: WAREHOUSES_KEY,
    queryFn: warehouseApi.getAll,
  });

  const { mutate: saveLocation, isPending: isSaving } = useMutation({
    mutationFn: ({ id, values }) =>
      id
        ? storageLocationApi.update(id, { locationCode: values.locationCode, zoneCode: values.zoneCode })
        : storageLocationApi.create(values),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: LOCATIONS_KEY });
      message.success(id ? 'Đã cập nhật vị trí' : 'Đã thêm vị trí');
      setOpen(false);
    },
    onError: (error) => message.error(getErrorMessage(error)),
  });

  const { mutate: deleteLocation } = useMutation({
    mutationFn: storageLocationApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LOCATIONS_KEY });
      message.success('Đã xoá vị trí');
      setOpen(false);
    },
    onError: (error) => message.error(getErrorMessage(error)),
  });

  const warehouseOptions = warehouses.map((w) => ({ value: w.id, label: `${w.code} — ${w.name}` }));
  const warehouseName = useMemo(
    () => Object.fromEntries(warehouses.map((w) => [w.id, w.name])),
    [warehouses],
  );

  const zoneOptions = useMemo(() => {
    const zones = [...new Set(rows.map((l) => l.zoneCode).filter(Boolean))].sort();
    return zones.map((z) => ({ value: z, label: z }));
  }, [rows]);

  const data = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return rows.filter((l) => {
      const okKw = !kw || [l.locationCode, l.zoneCode].some((v) => String(v ?? '').toLowerCase().includes(kw));
      const okWarehouse = !warehouseId || l.warehouseId === warehouseId;
      const okZone = !zone || l.zoneCode === zone;
      return okKw && okWarehouse && okZone;
    });
  }, [rows, keyword, warehouseId, zone]);

  const hasActiveFilters = Boolean(keyword || warehouseId || zone);
  const clearFilters = () => {
    setKeyword('');
    setWarehouseId(null);
    setZone(null);
  };

  useEffect(() => {
    if (open && editing) {
      form.setFieldsValue(editing);
    } else if (open && !editing) {
      const currentLoc = form.getFieldValue('locationCode');
      if (!currentLoc) {
        form.setFieldsValue({ warehouseId: warehouseId ?? warehouses[0]?.id });
      }
    } else if (!open) {
      form.resetFields();
    }
  }, [open, editing, warehouseId, warehouses, form]);

  const handleOk = async () => {
    const v = await form.validateFields();
    saveLocation({
      id: editing?.id,
      values: {
        warehouseId: v.warehouseId,
        locationCode: v.locationCode,
        zoneCode: v.zoneCode ?? null,
      },
    });
  };

  const handleCellClick = (code, row, existingLoc) => {
    if (!canManageMasterData) return;
    if (existingLoc) {
      setEditing(existingLoc);
    } else {
      setEditing(null);
      form.setFieldsValue({
        warehouseId,
        locationCode: code,
        zoneCode: `Khu ${row}`,
      });
    }
    setOpen(true);
  };

  const columns = [
    {
      title: 'Mã vị trí',
      dataIndex: 'locationCode',
      width: 160,
      render: (c) => <DocCode>{c}</DocCode>,
    },
    {
      title: 'Kho',
      dataIndex: 'warehouseId',
      width: 220,
      render: (id) => <span className="text-ink">{warehouseName[id] ?? '—'}</span>,
    },
    {
      title: 'Khu',
      dataIndex: 'zoneCode',
      width: 140,
      render: (z) => <span className="text-ink-sub">{z || '—'}</span>,
    },
    {
      title: '',
      key: 'action',
      align: 'center',
      width: 56,
      render: (_, r) => (
        <div className="flex items-center justify-center">
          <Tooltip title="Sửa">
            <Button
              type="text"
              icon={<EditOutlined />}
              disabled={!canManageMasterData}
              onClick={() => {
                setEditing(r);
                setOpen(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Xoá">
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              disabled={!canManageMasterData}
              onClick={() => {
                modal.confirm({
                  title: 'Xoá vị trí này?',
                  content: `Bạn có chắc chắn muốn xoá vị trí ${r.locationCode}?`,
                  okText: 'Xoá',
                  okType: 'danger',
                  cancelText: 'Huỷ',
                  onOk: () => deleteLocation(r.id),
                });
              }}
            />
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <>
      {contextHolder}
      <div className="flex flex-col gap-4">
        {/* Top Filter Bar */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex flex-wrap items-center gap-4">
            <Input
              allowClear
              prefix={<SearchOutlined className="text-slate-400" />}
              placeholder="Tìm theo mã vị trí, khu..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full sm:w-80"
            />
            <Select
              allowClear
              placeholder="Kho (Bắt buộc để xem sơ đồ)"
              className="w-full sm:w-64"
              options={warehouseOptions}
              value={warehouseId}
              onChange={setWarehouseId}
            />
            {viewMode === 'list' && (
              <Select allowClear placeholder="Khu" className="w-full sm:w-48" options={zoneOptions} value={zone} onChange={setZone} />
            )}
          </div>
        </div>

        {/* Nội dung chính */}
        <div className="min-w-0 flex-1">
          <div className="mb-4 flex items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div className="flex items-center gap-4">
              <Segmented
                options={[
                  { label: 'Sơ đồ kho', value: 'map', icon: <AppstoreOutlined /> },
                  { label: 'Danh sách', value: 'list', icon: <UnorderedListOutlined /> },
                ]}
                value={viewMode}
                onChange={setViewMode}
              />
              {viewMode === 'list' && <span className="text-sm text-ink-sub">{data.length} vị trí</span>}
            </div>
            {canManageMasterData && (
              <Tooltip title={warehouses.length ? '' : 'Cần có ít nhất một kho trước'}>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  disabled={!warehouses.length}
                  onClick={() => {
                    setEditing(null);
                    form.resetFields();
                    setOpen(true);
                  }}
                >
                  Thêm vị trí
                </Button>
              </Tooltip>
            )}
          </div>

          <FadeSection dataKey={`${viewMode}-${data.map((l) => l.id).join(',')}`}>
            {viewMode === 'map' ? (
              <WarehouseMap warehouseId={warehouseId} locations={data} onCellClick={handleCellClick} />
            ) : (
              <DataTable
                columns={columns}
                dataSource={data}
                loading={isLoading}
                locale={{ emptyText: <TableEmptyState message="Không tìm thấy vị trí phù hợp" /> }}
              />
            )}
          </FadeSection>
        </div>
      </div>

      <Modal centered
        open={open}
        title={editing ? 'Sửa vị trí' : 'Thêm vị trí'}
        okText={editing ? 'Lưu thay đổi' : 'Thêm mới'}
        cancelText="Huỷ"
        confirmLoading={isSaving}
        onCancel={() => setOpen(false)}
        onOk={handleOk}
        destroyOnHidden
        maskClosable={false}
      >
        <Form form={form} layout="vertical" requiredMark={false} className="mt-2">
          <Form.Item name="warehouseId" label="Kho" rules={[{ required: true, message: 'Chọn kho' }]}>
            <Select options={warehouseOptions} disabled={!!editing} placeholder="Chọn kho" />
          </Form.Item>
          <div className="grid grid-cols-2 gap-x-4">
            <Form.Item name="locationCode" label="Mã vị trí" rules={[{ required: true, message: 'Nhập mã' }]}>
              <Input placeholder="A-01-04" />
            </Form.Item>
            <Form.Item name="zoneCode" label="Khu">
              <Input placeholder="Khu A" />
            </Form.Item>
          </div>
          {editing && canManageMasterData && (
            <div className="flex justify-end mt-2">
              <Button 
                danger 
                type="text" 
                icon={<DeleteOutlined />} 
                onClick={() => {
                  modal.confirm({
                    title: 'Xoá vị trí này?',
                    content: `Bạn có chắc chắn muốn xoá vị trí ${editing.locationCode}?`,
                    okText: 'Xoá',
                    okType: 'danger',
                    cancelText: 'Huỷ',
                    onOk: () => deleteLocation(editing.id),
                  });
                }}
              >
                Xoá vị trí này
              </Button>
            </div>
          )}
        </Form>
      </Modal>
    </>
  );
}
