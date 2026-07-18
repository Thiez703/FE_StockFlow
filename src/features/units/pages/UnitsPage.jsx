import { useEffect, useState } from 'react';
import { Button, Form, Input, InputNumber, Modal, Select, Tag, Tooltip, App } from 'antd';
import { PlusOutlined, EditOutlined } from '@ant-design/icons';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import DocCode from '@/components/ui/DocCode';
import { UNITS } from '@/mock/units';

export default function UnitsPage() {
  const { message } = App.useApp();
  const [rows, setRows] = useState(UNITS);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) form.setFieldsValue(editing ?? { baseUnit: 'Lon', ratio: 1 });
  }, [open, editing, form]);

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
    { title: 'Quy về', dataIndex: 'baseUnit', align: 'center', width: 120 },
    {
      title: 'Tỷ lệ quy đổi',
      dataIndex: 'ratio',
      align: 'right',
      width: 150,
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
      <PageHeader
        title="Đơn vị tính"
        subtitle="Đơn vị đóng gói và tỷ lệ quy đổi về đơn vị cơ sở"
        breadcrumb={[{ title: 'Dữ liệu nền' }, { title: 'Đơn vị tính' }]}
        extra={
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
        }
      />

      <DataTable columns={columns} dataSource={rows} pagination={false} />

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
