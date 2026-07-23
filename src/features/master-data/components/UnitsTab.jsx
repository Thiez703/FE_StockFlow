import { useEffect, useMemo, useState } from 'react';
import { Button, Form, Input, InputNumber, Modal, Select, Tag, Tooltip, App } from 'antd';
import { PlusOutlined, EditOutlined } from '@ant-design/icons';
import { usePermissions } from '@/hooks/usePermissions';
import { useColumnSort } from '@/hooks/useColumnSort';
import FilterBar from '@/components/ui/FilterBar';
import DataTable from '@/components/ui/DataTable';
import DocCode from '@/components/ui/DocCode';
import { UNITS } from '@/mock/units';

const BASE_UNIT_COLOR = { Lon: 'gold', Chai: 'blue' };

export default function UnitsTab() {
  const { message } = App.useApp();
  const { canManageMasterData } = usePermissions();
  const [rows, setRows] = useState(UNITS);
  const [baseUnit, setBaseUnit] = useState(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();
  const { sortableTitle, sortRows } = useColumnSort();

  useEffect(() => {
    if (open) form.setFieldsValue(editing ?? { baseUnit: 'Lon', ratio: 1 });
  }, [open, editing, form]);

  const data = useMemo(() => {
    const filtered = rows.filter((u) => !baseUnit || u.baseUnit === baseUnit);
    return sortRows(filtered);
  }, [rows, baseUnit, sortRows]);

  const openAdd = () => {
    setEditing(null);
    setOpen(true);
  };

  const handleOk = async () => {
    const values = await form.validateFields();
    if (editing) {
      setRows((prev) => prev.map((u) => (u.id === editing.id ? { ...u, ...values } : u)));
      message.success('Đã cập nhật đơn vị');
    } else {
      setRows((prev) => [
        { id: `DV-${String(rows.length + 1).padStart(2, '0')}`, isBase: values.ratio === 1, ...values },
        ...prev,
      ]);
      message.success('Đã thêm đơn vị tính');
    }
    setOpen(false);
  };

  const columns = [
    { title: 'Mã', dataIndex: 'code', width: 140, render: (c) => <DocCode muted>{c}</DocCode> },
    {
      title: 'Tên đơn vị',
      dataIndex: 'name',
      render: (name, r) => (
        <span className="font-medium text-ink">
          {name}
          {r.isBase && (
            <Tag bordered={false} color="blue" className="ml-2">
              Cơ sở
            </Tag>
          )}
        </span>
      ),
    },
    {
      title: 'Quy về',
      dataIndex: 'baseUnit',
      align: 'center',
      width: 120,
      render: (b) => (
        <Tag bordered={false} color={BASE_UNIT_COLOR[b]}>
          {b}
        </Tag>
      ),
    },
    {
      title: sortableTitle('Tỷ lệ quy đổi', 'ratio'),
      dataIndex: 'ratio',
      align: 'right',
      width: 170,
      render: (ratio, r) => (
        <span className="mono text-ink">
          1 {r.name} = {ratio} {r.baseUnit}
        </span>
      ),
    },
    { title: 'Ghi chú', dataIndex: 'note', className: '!text-ink-sub' },
    {
      title: '',
      key: 'action',
      align: 'center',
      width: 56,
      render: (_, r) => (
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
      ),
    },
  ];

  return (
    <>
      <FilterBar
        extra={
          canManageMasterData && (
            <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>
              Thêm đơn vị
            </Button>
          )
        }
      >
        <span className="text-sm text-ink-sub">Đơn vị đóng gói và tỷ lệ quy đổi về đơn vị cơ sở</span>
        <Select
          allowClear
          placeholder="Quy về"
          className="w-full sm:w-40"
          options={[
            { value: 'Lon', label: 'Lon' },
            { value: 'Chai', label: 'Chai' },
          ]}
          value={baseUnit}
          onChange={setBaseUnit}
        />
      </FilterBar>

      <DataTable
        className="units-table"
        rowClassName={(r) => (r.isBase ? 'unit-row-base' : '')}
        columns={columns}
        dataSource={data}
        pagination={false}
      />

      <Modal
        open={open}
        title={editing ? 'Sửa đơn vị tính' : 'Thêm đơn vị tính'}
        okText={editing ? 'Lưu thay đổi' : 'Thêm mới'}
        cancelText="Huỷ"
        onCancel={() => setOpen(false)}
        onOk={handleOk}
        destroyOnHidden
        maskClosable={false}
      >
        <Form form={form} layout="vertical" requiredMark={false} className="mt-2">
          <div className="grid grid-cols-2 gap-x-4">
            <Form.Item name="name" label="Tên đơn vị" rules={[{ required: true, message: 'Nhập tên' }]}>
              <Input placeholder="VD: Thùng" />
            </Form.Item>
            <Form.Item name="code" label="Mã" rules={[{ required: true, message: 'Nhập mã' }]}>
              <Input placeholder="THUNG-LON" />
            </Form.Item>
            <Form.Item name="baseUnit" label="Quy về đơn vị cơ sở" rules={[{ required: true }]}>
              <Select
                options={[
                  { value: 'Lon', label: 'Lon' },
                  { value: 'Chai', label: 'Chai' },
                ]}
              />
            </Form.Item>
            <Form.Item name="ratio" label="Tỷ lệ quy đổi" rules={[{ required: true, message: 'Nhập tỷ lệ' }]}>
              <InputNumber min={1} className="w-full" />
            </Form.Item>
          </div>
          <Form.Item name="note" label="Ghi chú">
            <Input placeholder="VD: Thùng 24 lon" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
