import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Form, Input, Modal, Select, Tooltip, App } from 'antd';
import { PlusOutlined, EditOutlined, StopOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { usePermissions } from '@/hooks/usePermissions';
import DataTable from '@/components/ui/DataTable';
import DocCode from '@/components/ui/DocCode';
import FilterBar from '@/components/ui/FilterBar';
import FadeSection from '@/components/ui/FadeSection';
import StatusPill from '@/components/ui/StatusPill';
import { unitApi } from '@/api/units';
import { getErrorMessage } from '@/utils/getErrorMessage';

const UNITS_KEY = ['units'];

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Hoạt động' },
  { value: 'INACTIVE', label: 'Ngừng' },
];

// Backend chỉ lưu { code, name, status } cho đơn vị tính. Các cột "Quy về",
// "Tỷ lệ quy đổi", "Ghi chú" của bản mock đã bỏ vì không có nguồn dữ liệu —
// quy đổi thuộc về ProductUnit (/api/products/{id}/units), chưa có API sản phẩm.
export default function UnitsTab() {
  const { message } = App.useApp();
  const { canManageMasterData } = usePermissions();
  const queryClient = useQueryClient();

  const [status, setStatus] = useState(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

  const { data: rows = [], isLoading } = useQuery({
    queryKey: UNITS_KEY,
    queryFn: unitApi.getAll,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: UNITS_KEY });

  const { mutate: saveUnit, isPending: isSaving } = useMutation({
    mutationFn: ({ id, values }) => (id ? unitApi.update(id, values) : unitApi.create(values)),
    onSuccess: (_data, { id }) => {
      invalidate();
      message.success(id ? 'Đã cập nhật đơn vị' : 'Đã thêm đơn vị tính');
      setOpen(false);
    },
    onError: (error) => message.error(getErrorMessage(error)),
  });

  const { mutate: toggleStatus } = useMutation({
    mutationFn: ({ id, active }) => (active ? unitApi.deactivate(id) : unitApi.activate(id)),
    onSuccess: (_data, { active }) => {
      invalidate();
      message.success(active ? 'Đã ngừng sử dụng đơn vị' : 'Đã kích hoạt lại đơn vị');
    },
    onError: (error) => message.error(getErrorMessage(error)),
  });

  const data = useMemo(
    () => rows.filter((u) => !status || u.status === status),
    [rows, status],
  );

  useEffect(() => {
    if (open) form.setFieldsValue(editing ?? { code: '', name: '' });
  }, [open, editing, form]);

  const handleOk = async () => {
    const values = await form.validateFields();
    saveUnit({ id: editing?.id, values: { code: values.code, name: values.name } });
  };

  const columns = [
    { title: 'Mã', dataIndex: 'code', width: 160, render: (c) => <DocCode muted>{c}</DocCode> },
    {
      title: 'Tên đơn vị',
      dataIndex: 'name',
      render: (name) => <span className="font-medium text-ink">{name}</span>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      align: 'center',
      width: 140,
      render: (s) => <StatusPill status={s} />,
    },
    {
      title: '',
      key: 'action',
      align: 'center',
      width: 96,
      render: (_, r) => {
        const active = r.status === 'ACTIVE';
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
            <Tooltip title={active ? 'Ngừng sử dụng' : 'Kích hoạt lại'}>
              <Button
                type="text"
                danger={active}
                icon={active ? <StopOutlined /> : <CheckCircleOutlined />}
                disabled={!canManageMasterData}
                onClick={() => toggleStatus({ id: r.id, active })}
              />
            </Tooltip>
          </div>
        );
      },
    },
  ];

  return (
    <>
      <FilterBar
        extra={
          canManageMasterData && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditing(null);
                setOpen(true);
              }}
            >
              Thêm đơn vị
            </Button>
          )
        }
      >
        <span className="text-sm text-ink-sub">Đơn vị đóng gói dùng chung cho toàn hệ thống</span>
        <Select
          allowClear
          placeholder="Trạng thái"
          className="w-full sm:w-40"
          options={STATUS_OPTIONS}
          value={status}
          onChange={setStatus}
        />
      </FilterBar>

      <FadeSection dataKey={data.map((u) => u.id).join(',')}>
        <DataTable
          className="units-table"
          columns={columns}
          dataSource={data}
          loading={isLoading}
          pagination={false}
        />
      </FadeSection>

      <Modal
        open={open}
        title={editing ? 'Sửa đơn vị tính' : 'Thêm đơn vị tính'}
        okText={editing ? 'Lưu thay đổi' : 'Thêm mới'}
        cancelText="Huỷ"
        confirmLoading={isSaving}
        onCancel={() => setOpen(false)}
        onOk={handleOk}
        destroyOnHidden
        maskClosable={false}
      >
        <Form form={form} layout="vertical" requiredMark={false} className="mt-2">
          <div className="grid grid-cols-2 gap-x-4">
            <Form.Item
              name="name"
              label="Tên đơn vị"
              rules={[
                { required: true, message: 'Nhập tên' },
                { max: 20, message: 'Tối đa 20 ký tự' },
              ]}
            >
              <Input placeholder="VD: Thùng" />
            </Form.Item>
            <Form.Item
              name="code"
              label="Mã"
              rules={[
                { required: true, message: 'Nhập mã' },
                { max: 10, message: 'Tối đa 10 ký tự' },
              ]}
            >
              <Input placeholder="THUNG" />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </>
  );
}
