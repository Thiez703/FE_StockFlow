import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Input, Select, Form, Modal, Tooltip, App } from 'antd';
import { PlusOutlined, EditOutlined, SearchOutlined, StopOutlined, CheckCircleOutlined } from '@ant-design/icons';
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

export default function LocationsTab() {
  const { message } = App.useApp();
  const { canManageMasterData } = usePermissions();
  const queryClient = useQueryClient();

  const [keyword, setKeyword] = useState('');
  const [warehouseId, setWarehouseId] = useState(null);
  const [zone, setZone] = useState(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

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

  const { mutate: toggleLocationStatus } = useMutation({
    mutationFn: ({ id, active }) =>
      active ? storageLocationApi.deactivate(id) : storageLocationApi.activate(id),
    onSuccess: (_data, { active }) => {
      queryClient.invalidateQueries({ queryKey: LOCATIONS_KEY });
      message.success(active ? 'Đã vô hiệu hóa vị trí' : 'Đã kích hoạt lại vị trí');
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
      width: 96,
      render: (_, r) => {
        const active = (r.status ?? 'ACTIVE') === 'ACTIVE';
        return (
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
            <Tooltip title={active ? 'Vô hiệu hóa' : 'Kích hoạt lại'}>
              <Button
                type="text"
                danger={active}
                icon={active ? <StopOutlined /> : <CheckCircleOutlined />}
                disabled={!canManageMasterData}
                onClick={() => toggleLocationStatus({ id: r.id, active })}
              />
            </Tooltip>
          </div>
        );
      },
    },
  ];

  return (
    <>
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
              placeholder="Kho"
              className="w-full sm:w-64"
              options={warehouseOptions}
              value={warehouseId}
              onChange={setWarehouseId}
            />
            <Select allowClear placeholder="Khu" className="w-full sm:w-48" options={zoneOptions} value={zone} onChange={setZone} />
          </div>
        </div>

        {/* Nội dung chính */}
        <div className="min-w-0 flex-1">
          <div className="mb-4 flex items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div className="flex items-center gap-4">
              <span className="text-sm text-ink-sub">{data.length} vị trí</span>
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
        </Form>
      </Modal>
    </>
  );
}
