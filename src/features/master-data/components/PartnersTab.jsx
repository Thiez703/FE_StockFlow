import { useEffect, useState } from 'react';
import { Button, Tabs, Input, Form, Modal, Select, Tag, Tooltip, App } from 'antd';
import { PlusOutlined, EditOutlined, SearchOutlined } from '@ant-design/icons';
import { usePermissions } from '@/hooks/usePermissions';
import FilterBar from '@/components/ui/FilterBar';
import DataTable from '@/components/ui/DataTable';
import DocCode from '@/components/ui/DocCode';
import StatusPill from '@/components/ui/StatusPill';
import { SUPPLIERS, CUSTOMERS } from '@/mock/partners';

export default function PartnersTab() {
  const { message } = App.useApp();
  const { canManageMasterData } = usePermissions();
  const [tab, setTab] = useState('suppliers');
  const [suppliers, setSuppliers] = useState(SUPPLIERS);
  const [customers, setCustomers] = useState(CUSTOMERS);
  const [keyword, setKeyword] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

  const isSupplier = tab === 'suppliers';
  const rows = isSupplier ? suppliers : customers;
  const kw = keyword.trim().toLowerCase();
  const data = rows.filter(
    (r) => !kw || [r.name, r.code, r.phone].some((v) => String(v).toLowerCase().includes(kw)),
  );

  useEffect(() => {
    if (open) form.setFieldsValue(editing ?? { status: 'active', type: 'Sỉ' });
  }, [open, editing, form]);

  const handleOk = async () => {
    const values = await form.validateFields();
    const setRows = isSupplier ? setSuppliers : setCustomers;
    if (editing) {
      setRows((prev) => prev.map((r) => (r.id === editing.id ? { ...r, ...values } : r)));
      message.success('Đã cập nhật đối tác');
    } else {
      const prefix = isSupplier ? 'NCC' : 'KH';
      const id = `${prefix}-${String(rows.length + 1).padStart(3, '0')}`;
      setRows((prev) => [{ id, code: id, ...values }, ...prev]);
      message.success('Đã thêm đối tác');
    }
    setOpen(false);
  };

  const actionCol = {
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
  };

  const supplierColumns = [
    { title: 'Mã', dataIndex: 'code', width: 110, render: (c) => <DocCode muted>{c}</DocCode> },
    { title: 'Nhà cung cấp', dataIndex: 'name', render: (n) => <span className="font-medium text-ink">{n}</span> },
    { title: 'Điện thoại', dataIndex: 'phone', width: 140 },
    { title: 'Mã số thuế', dataIndex: 'taxCode', width: 130, render: (t) => <span className="mono text-ink-sub">{t}</span> },
    { title: 'Địa chỉ', dataIndex: 'address', className: '!text-ink-sub', ellipsis: true },
    { title: 'Trạng thái', dataIndex: 'status', align: 'center', width: 130, render: (s) => <StatusPill status={s} /> },
    actionCol,
  ];

  const customerColumns = [
    { title: 'Mã', dataIndex: 'code', width: 110, render: (c) => <DocCode muted>{c}</DocCode> },
    { title: 'Khách hàng', dataIndex: 'name', render: (n) => <span className="font-medium text-ink">{n}</span> },
    {
      title: 'Loại',
      dataIndex: 'type',
      align: 'center',
      width: 90,
      render: (t) => (
        <Tag bordered={false} color={t === 'Sỉ' ? 'blue' : 'default'}>
          {t}
        </Tag>
      ),
    },
    { title: 'Điện thoại', dataIndex: 'phone', width: 140 },
    { title: 'Địa chỉ', dataIndex: 'address', className: '!text-ink-sub', ellipsis: true },
    { title: 'Trạng thái', dataIndex: 'status', align: 'center', width: 130, render: (s) => <StatusPill status={s} /> },
    actionCol,
  ];

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <Tabs
          activeKey={tab}
          onChange={(k) => {
            setTab(k);
            setKeyword('');
          }}
          items={[
            { key: 'suppliers', label: `Nhà cung cấp (${suppliers.length})` },
            { key: 'customers', label: `Khách hàng (${customers.length})` },
          ]}
          className="!mb-0"
        />
        {canManageMasterData && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            {isSupplier ? 'Thêm nhà cung cấp' : 'Thêm khách hàng'}
          </Button>
        )}
      </div>

      <FilterBar extra={<span className="text-sm text-ink-sub">{data.length} đối tác</span>}>
        <Input
          allowClear
          prefix={<SearchOutlined className="text-slate-400" />}
          placeholder="Tìm theo tên, mã, điện thoại..."
          className="w-full sm:w-80"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
      </FilterBar>

      <DataTable columns={isSupplier ? supplierColumns : customerColumns} dataSource={data} />

      <Modal
        open={open}
        title={`${editing ? 'Sửa' : 'Thêm'} ${isSupplier ? 'nhà cung cấp' : 'khách hàng'}`}
        okText={editing ? 'Lưu thay đổi' : 'Thêm mới'}
        cancelText="Huỷ"
        onCancel={() => setOpen(false)}
        onOk={handleOk}
        width={560}
        destroyOnHidden
        maskClosable={false}
      >
        <Form form={form} layout="vertical" requiredMark={false} className="mt-2">
          <Form.Item name="name" label={isSupplier ? 'Tên nhà cung cấp' : 'Tên khách hàng'} rules={[{ required: true, message: 'Nhập tên' }]}>
            <Input placeholder="Nhập tên đối tác" />
          </Form.Item>
          <div className="grid grid-cols-2 gap-x-4">
            <Form.Item name="phone" label="Điện thoại" rules={[{ required: true, message: 'Nhập số điện thoại' }]}>
              <Input placeholder="0901 234 567" />
            </Form.Item>
            {isSupplier ? (
              <Form.Item name="taxCode" label="Mã số thuế">
                <Input placeholder="0300583659" />
              </Form.Item>
            ) : (
              <Form.Item name="type" label="Loại khách">
                <Select
                  options={[
                    { value: 'Sỉ', label: 'Sỉ' },
                    { value: 'Lẻ', label: 'Lẻ' },
                  ]}
                />
              </Form.Item>
            )}
          </div>
          {isSupplier && (
            <Form.Item name="email" label="Email">
              <Input placeholder="sales@company.vn" />
            </Form.Item>
          )}
          <Form.Item name="address" label="Địa chỉ">
            <Input placeholder="Số nhà, đường, quận, thành phố" />
          </Form.Item>
          <Form.Item name="status" label="Trạng thái">
            <Select
              options={[
                { value: 'active', label: 'Hoạt động' },
                { value: 'inactive', label: 'Ngừng hợp tác' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
