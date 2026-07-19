import { useMemo, useState } from 'react';
import { Input, Select, Tag } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import PageHeader from '@/components/ui/PageHeader';
import FilterBar from '@/components/ui/FilterBar';
import DataTable from '@/components/ui/DataTable';
import AccessDenied from '@/components/feedback/AccessDenied';
import { usePermissions } from '@/hooks/usePermissions';
import { LOGS, LOG_ACTIONS } from '@/mock/logs';

const ACTION_COLOR = {
  'Tạo': 'blue',
  'Cập nhật': 'cyan',
  'Duyệt': 'green',
  'Từ chối': 'red',
  'Xoá': 'volcano',
  'Đăng nhập': 'default',
  'Huỷ': 'gold',
};

export default function LogsPage() {
  const { canViewLogs } = usePermissions();
  const [keyword, setKeyword] = useState('');
  const [action, setAction] = useState(null);

  const data = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return LOGS.filter((l) => {
      const okKw = !kw || [l.user, l.target].some((v) => v.toLowerCase().includes(kw));
      const okAction = !action || l.action === action;
      return okKw && okAction;
    });
  }, [keyword, action]);

  // FIX 5e — chỉ ADMIN mới xem được nhật ký.
  if (!canViewLogs) return <AccessDenied />;

  const columns = [
    { title: 'Thời gian', dataIndex: 'time', width: 160, render: (t) => <span className="mono text-ink-sub">{t}</span> },
    { title: 'Người dùng', dataIndex: 'user', width: 160, render: (u) => <span className="mono font-medium text-navy-700">@{u}</span> },
    {
      title: 'Hành động',
      dataIndex: 'action',
      width: 140,
      render: (a) => <Tag bordered={false} color={ACTION_COLOR[a]}>{a}</Tag>,
    },
    { title: 'Đối tượng', dataIndex: 'target', render: (t) => <span className="text-ink">{t}</span> },
    {
      title: 'Mã đối tượng',
      dataIndex: 'entity_id',
      width: 130,
      render: (id) => (
        <span className="mono text-ink-sub">{id != null ? id : '—'}</span>
      ),
    },
    { title: 'IP', dataIndex: 'ip', width: 130, align: 'right', render: (ip) => <span className="mono text-ink-sub">{ip}</span> },
  ];

  return (
    <>
      <PageHeader
        title="Nhật ký hoạt động"
        subtitle="Lịch sử thao tác của người dùng trên hệ thống"
        breadcrumb={[{ title: 'Hệ thống' }, { title: 'Nhật ký hoạt động' }]}
      />

      <FilterBar extra={<span className="text-sm text-ink-sub">{data.length} bản ghi</span>}>
        <Input
          allowClear
          prefix={<SearchOutlined className="text-slate-400" />}
          placeholder="Tìm theo người dùng, đối tượng..."
          className="w-full sm:w-72"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <Select
          allowClear
          placeholder="Hành động"
          className="w-full sm:w-44"
          options={LOG_ACTIONS.map((a) => ({ value: a, label: a }))}
          value={action}
          onChange={setAction}
        />
      </FilterBar>

      <DataTable columns={columns} dataSource={data} pagination={{ pageSize: 10, showSizeChanger: false, showTotal: (t) => `${t} bản ghi` }} />
    </>
  );
}
