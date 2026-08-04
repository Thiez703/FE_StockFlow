import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Form, Input, Modal, Select, Tooltip, App, Segmented } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  StopOutlined,
  CheckCircleOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { usePermissions } from '@/hooks/usePermissions';
import DataTable from '@/components/ui/DataTable';
import DocCode from '@/components/ui/DocCode';
import TableEmptyState from '@/components/ui/TableEmptyState';
import FadeSection from '@/components/ui/FadeSection';
import StatusPill from '@/components/ui/StatusPill';
import { unitApi } from '@/api/units';
import { getErrorMessage } from '@/utils/getErrorMessage';

const UNITS_KEY = ['units'];

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Hoạt động' },
  { value: 'INACTIVE', label: 'Ngừng' },
];

export default function UnitsTab() {
  const { message } = App.useApp();
  const { canManageMasterData } = usePermissions();
  const queryClient = useQueryClient();

  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewMode, setViewMode] = useState('card');
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

  const data = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return rows.filter((u) => {
      const okKw = !kw || [u.name, u.code].some((v) => String(v ?? '').toLowerCase().includes(kw));
      const okStatus = !status || u.status === status;
      return okKw && okStatus;
    });
  }, [rows, keyword, status]);

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
      <div className="flex flex-col gap-4">
        {/* Top Filter Bar */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex flex-wrap items-center gap-4">
            <Input
              allowClear
              prefix={<SearchOutlined className="text-slate-400" />}
              placeholder="Tìm tên, mã đơn vị..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full sm:w-80"
            />
            <Select
              allowClear
              placeholder="Trạng thái"
              className="w-full sm:w-48"
              options={STATUS_OPTIONS}
              value={status}
              onChange={setStatus}
            />
          </div>
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div className="flex items-center gap-4">
              <Segmented
                options={[
                  { value: 'card', icon: <AppstoreOutlined /> },
                  { value: 'table', icon: <UnorderedListOutlined /> },
                ]}
                value={viewMode}
                onChange={setViewMode}
              />
              <span className="text-sm text-slate-500 font-medium">Đơn vị đóng gói chung ({data.length})</span>
            </div>
            {canManageMasterData && (
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
            )}
          </div>

          <FadeSection dataKey={`${viewMode}-${data.map((u) => u.id).join(',')}`}>
            {viewMode === 'table' ? (
              <DataTable
                className="units-table"
                columns={columns}
                dataSource={data}
                loading={isLoading}
                pagination={false}
                locale={{ emptyText: <TableEmptyState message="Không tìm thấy đơn vị phù hợp" /> }}
              />
            ) : data.length === 0 ? (
              <TableEmptyState message="Không tìm thấy đơn vị tính phù hợp" />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
                {data.map((u) => {
                  const active = u.status === 'ACTIVE';
                  return (
                    <div key={u.id} className={`group relative bg-white border rounded-2xl p-5 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col items-center justify-center gap-4 ${active ? 'border-slate-200 hover:border-blue-400' : 'border-slate-200 bg-slate-50 opacity-80'}`}>
                      <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex bg-white/90 backdrop-blur-md rounded-xl p-0.5 shadow-sm border border-slate-100">
                        <Tooltip title="Sửa">
                          <Button type="text" size="small" icon={<EditOutlined className="text-blue-600" />} disabled={!canManageMasterData} onClick={() => { setEditing(u); setOpen(true); }} />
                        </Tooltip>
                        <Tooltip title={active ? 'Ngừng sử dụng' : 'Kích hoạt lại'}>
                          <Button type="text" size="small" danger={active} icon={active ? <StopOutlined /> : <CheckCircleOutlined className="text-green-500" />} disabled={!canManageMasterData} onClick={() => toggleStatus({ id: u.id, active })} />
                        </Tooltip>
                      </div>

                      <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-sm bg-gradient-to-br ${active ? 'from-blue-50 to-indigo-100 text-indigo-600' : 'from-slate-100 to-slate-200 text-slate-500'}`}>
                        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                        </svg>
                      </div>
                      <div className="text-center w-full min-w-0">
                        <div className="font-bold text-slate-800 text-lg truncate">{u.name}</div>
                        <div className="text-xs font-mono font-semibold text-blue-600/70 mt-1">{u.code}</div>
                      </div>
                      {!active && (
                        <div className="absolute top-3 left-3">
                          <div className="w-2.5 h-2.5 rounded-full bg-red-400 shadow-sm" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </FadeSection>
        </div>
      </div>

      <Modal centered
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
