import { Card, Table, Tag, Button, Avatar } from 'antd';
import { formatCurrency } from '@/utils/formatCurrency';

// Dữ liệu mẫu — thay bằng API sau.
const DATA = [
  { key: '1', code: 'PN-2026-0148', supplier: 'Suntory PepsiCo', date: '18/07/2026', total: 42500000, status: 'completed' },
  { key: '2', code: 'PN-2026-0147', supplier: 'Coca-Cola VN', date: '18/07/2026', total: 31800000, status: 'pending' },
  { key: '3', code: 'PN-2026-0146', supplier: 'Tân Hiệp Phát', date: '17/07/2026', total: 18200000, status: 'completed' },
  { key: '4', code: 'PN-2026-0145', supplier: 'URC Việt Nam', date: '17/07/2026', total: 9600000, status: 'draft' },
];

const STATUS = {
  completed: { color: 'success', label: 'Hoàn tất' },
  pending: { color: 'processing', label: 'Chờ duyệt' },
  draft: { color: 'default', label: 'Nháp' },
};

const columns = [
  {
    title: 'Mã phiếu',
    dataIndex: 'code',
    render: (code) => <span className="font-semibold text-blue-600">{code}</span>,
  },
  {
    title: 'Nhà cung cấp',
    dataIndex: 'supplier',
    render: (name) => (
      <div className="flex items-center gap-2">
        <Avatar size={28} className="!bg-slate-100 !text-xs !font-semibold !text-slate-600">
          {name.charAt(0)}
        </Avatar>
        <span className="text-slate-700">{name}</span>
      </div>
    ),
  },
  { title: 'Ngày nhập', dataIndex: 'date', className: 'text-slate-500' },
  {
    title: 'Giá trị',
    dataIndex: 'total',
    align: 'right',
    render: (total) => <span className="font-semibold text-slate-800">{formatCurrency(total)}</span>,
  },
  {
    title: 'Trạng thái',
    dataIndex: 'status',
    align: 'center',
    render: (status) => {
      const s = STATUS[status];
      return (
        <Tag color={s.color} bordered={false} className="font-medium">
          {s.label}
        </Tag>
      );
    },
  },
];

export default function RecentReceiptsTable() {
  return (
    <Card
      className="border-slate-200/80 shadow-sm"
      styles={{ body: { padding: 0 } }}
    >
      <div className="flex items-center justify-between px-5 py-4">
        <h3 className="m-0 text-base font-semibold text-slate-900">Phiếu nhập gần đây</h3>
        <Button type="link" className="!px-0 !font-medium">
          Xem tất cả
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={DATA}
        pagination={false}
        size="middle"
        scroll={{ x: 640 }}
      />
    </Card>
  );
}
