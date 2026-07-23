import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Button, Input, Select, Progress, Tag, Form, Modal, Tooltip, App } from 'antd';
import { PlusOutlined, EditOutlined, SearchOutlined } from '@ant-design/icons';
import { usePermissions } from '@/hooks/usePermissions';
import { useColumnSort } from '@/hooks/useColumnSort';
import DataTable from '@/components/ui/DataTable';
import FilterSidebar from '@/components/ui/FilterSidebar';
import TableEmptyState from '@/components/ui/TableEmptyState';
import DocCode from '@/components/ui/DocCode';
import StatusPill from '@/components/ui/StatusPill';
import { LOCATIONS } from '@/mock/locations';

const ZONE_OPTIONS = ['Khu A', 'Khu B', 'Khu C', 'Khu tạm'].map((z) => ({ value: z, label: z }));
const STATUS_OPTIONS = [
  { value: 'active', label: 'Hoạt động' },
  { value: 'maintenance', label: 'Bảo trì' },
];

export default function LocationsTab() {
  const { message } = App.useApp();
  const { canManageMasterData } = usePermissions();
  const [rows, setRows] = useState(LOCATIONS);
  const [keyword, setKeyword] = useState('');
  const [zone, setZone] = useState(null);
  const [status, setStatus] = useState(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();
  const { sortableTitle, sortRows } = useColumnSort();

  const data = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    const filtered = rows.filter((l) => {
      const okKw = !kw || [l.code, l.type].some((v) => v.toLowerCase().includes(kw));
      const okZone = !zone || l.zone === zone;
      const okStatus = !status || l.status === status;
      return okKw && okZone && okStatus;
    });
    return sortRows(filtered);
  }, [rows, keyword, zone, status, sortRows]);

  const hasActiveFilters = Boolean(keyword || zone || status);
  const clearFilters = () => {
    setKeyword('');
    setZone(null);
    setStatus(null);
  };

  useEffect(() => {
    if (open) form.setFieldsValue(editing ?? { zone: 'Khu A', status: 'active', used: 0, capacity: 100 });
  }, [open, editing, form]);

  const openAdd = () => {
    setEditing(null);
    setOpen(true);
  };

  const handleOk = async () => {
    const v = await form.validateFields();
    if (editing) {
      setRows((prev) => prev.map((l) => (l.id === editing.id ? { ...l, ...v } : l)));
      message.success('Đã cập nhật vị trí');
    } else {
      setRows((prev) => [
        { id: `LOC-${String(rows.length + 1).padStart(3, '0')}`, rack: '—', bin: '—', ...v },
        ...prev,
      ]);
      message.success('Đã thêm vị trí');
    }
    setOpen(false);
  };

  const columns = [
    { title: 'Mã vị trí', dataIndex: 'code', width: 130, render: (c) => <DocCode>{c}</DocCode> },
    { title: 'Khu', dataIndex: 'zone', width: 110 },
    { title: 'Kệ', dataIndex: 'rack', align: 'center', width: 100, render: (r) => <span className="text-ink-sub">{r}</span> },
    { title: 'Ô', dataIndex: 'bin', align: 'center', width: 90, render: (b) => <span className="text-ink-sub">{b}</span> },
    { title: 'Nhóm hàng', dataIndex: 'type', render: (t) => <span className="text-ink">{t}</span> },
    {
      title: sortableTitle('Mức lấp đầy', 'used'),
      dataIndex: 'used',
      width: 240,
      render: (used) => (
        <div className="flex items-center gap-2">
          <Progress
            percent={used}
            size="small"
            className="min-w-0 flex-1"
            strokeColor={used >= 85 ? '#dc2626' : used >= 60 ? '#f59e0b' : '#1e5af0'}
          />
          {used >= 85 && (
            <Tag bordered={false} color={used >= 95 ? 'red' : 'orange'} className="!m-0 shrink-0">
              {used >= 95 ? 'Đầy kho' : 'Gần đầy'}
            </Tag>
          )}
        </div>
      ),
    },
    { title: 'Trạng thái', dataIndex: 'status', align: 'center', width: 130, render: (s) => <StatusPill status={s} /> },
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
      <div className="flex flex-col gap-4 lg:flex-row">
        {/* Sidebar bộ lọc */}
        <FilterSidebar hasActiveFilters={hasActiveFilters} onClear={clearFilters}>
          <Input
            allowClear
            prefix={<SearchOutlined className="text-slate-400" />}
            placeholder="Tìm theo mã, nhóm hàng..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <Select allowClear placeholder="Khu" className="w-full" options={ZONE_OPTIONS} value={zone} onChange={setZone} />
          <Select allowClear placeholder="Trạng thái" className="w-full" options={STATUS_OPTIONS} value={status} onChange={setStatus} />
        </FilterSidebar>

        {/* Danh sách vị trí */}
        <div className="min-w-0 flex-1">
          <div className="mb-4 flex items-center justify-between gap-3">
            <span className="text-sm text-ink-sub">{data.length} vị trí</span>
            {canManageMasterData && (
              <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>
                Thêm vị trí
              </Button>
            )}
          </div>

          <motion.div
            key={data.map((l) => l.id).join(',')}
            initial={{ opacity: 0.4 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <DataTable
              columns={columns}
              dataSource={data}
              locale={{ emptyText: <TableEmptyState message="Không tìm thấy vị trí phù hợp" /> }}
            />
          </motion.div>
        </div>
      </div>

      <Modal
        open={open}
        title={editing ? 'Sửa vị trí' : 'Thêm vị trí'}
        okText={editing ? 'Lưu thay đổi' : 'Thêm mới'}
        cancelText="Huỷ"
        onCancel={() => setOpen(false)}
        onOk={handleOk}
        destroyOnHidden
        maskClosable={false}
      >
        <Form form={form} layout="vertical" requiredMark={false} className="mt-2">
          <div className="grid grid-cols-2 gap-x-4">
            <Form.Item name="code" label="Mã vị trí" rules={[{ required: true, message: 'Nhập mã' }]}>
              <Input placeholder="A-01-04" />
            </Form.Item>
            <Form.Item name="zone" label="Khu" rules={[{ required: true }]}>
              <Select options={ZONE_OPTIONS} />
            </Form.Item>
            <Form.Item name="type" label="Nhóm hàng" rules={[{ required: true, message: 'Nhập nhóm hàng' }]}>
              <Input placeholder="Bia lon" />
            </Form.Item>
            <Form.Item name="status" label="Trạng thái">
              <Select options={STATUS_OPTIONS} />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </>
  );
}
