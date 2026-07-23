import { DatePicker, Button, App } from 'antd';
import { FileExcelOutlined } from '@ant-design/icons';
import PageHeader from '@/components/ui/PageHeader';
import { usePermissions } from '@/hooks/usePermissions';
import AccessDenied from '@/components/feedback/AccessDenied';
import DataTable from '@/components/ui/DataTable';
import DocCode from '@/components/ui/DocCode';
import StatusPill from '@/components/ui/StatusPill';
import InventoryTrendChart from '@/features/dashboard/components/InventoryTrendChart';
import { TREND } from '@/mock/dashboard';
import { STOCKTAKES } from '@/mock/stocktakes';
import { formatNumber } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/date';

const { RangePicker } = DatePicker;

const totalDiff = (items) => items.reduce((s, it) => s + (it.countedQty - it.systemQty), 0);

function DiffValue({ value }) {
  const cls = value === 0 ? 'text-ink-sub' : value > 0 ? 'text-[#15803d]' : 'text-[#b91c1c]';
  return <span className={`mono font-semibold ${cls}`}>{value > 0 ? `+${value}` : value}</span>;
}

export default function ReportsPage() {
  const { message } = App.useApp();
  const { canViewReports } = usePermissions();

  // FIX 5f — STAFF không được xem báo cáo.
  if (!canViewReports) return <AccessDenied />;

  const nxtColumns = [
    { title: 'Kỳ', dataIndex: 'label', render: (l) => <span className="font-medium text-ink">Tháng {l.replace('T', '')}</span> },
    { title: 'Nhập (tr.đ)', dataIndex: 'inbound', align: 'right', render: (v) => <span className="mono text-[#15803d]">{formatNumber(v)}</span> },
    { title: 'Xuất (tr.đ)', dataIndex: 'outbound', align: 'right', render: (v) => <span className="mono text-[#b45309]">{formatNumber(v)}</span> },
    { title: 'Tồn cuối (tr.đ)', dataIndex: 'stock', align: 'right', render: (v) => <span className="mono font-semibold text-navy-700">{formatNumber(v)}</span> },
  ];

  const varianceColumns = [
    { title: 'Mã phiếu', dataIndex: 'code', width: 150, render: (c) => <DocCode>{c}</DocCode> },
    { title: 'Ngày', dataIndex: 'date', align: 'center', width: 120, render: (d) => <span className="mono text-ink-sub">{formatDate(d)}</span> },
    { title: 'Số dòng', dataIndex: 'items', align: 'center', width: 90, render: (i) => i.length },
    { title: 'Tổng chênh lệch', dataIndex: 'items', key: 'diff', align: 'right', width: 140, render: (i) => <DiffValue value={totalDiff(i)} /> },
    { title: 'Trạng thái', dataIndex: 'status', align: 'center', width: 130, render: (s) => <StatusPill status={s} /> },
  ];

  const exportExcel = () => message.info('Tính năng xuất Excel chỉ khả dụng trong bản đầy đủ.');

  return (
    <>
      <PageHeader
        title="Báo cáo"
        subtitle="Nhập – Xuất – Tồn theo kỳ và chênh lệch kiểm kê"
        breadcrumb={[{ title: 'Tồn kho & Báo cáo' }, { title: 'Báo cáo' }]}
        extra={
          <>
            <RangePicker format="DD/MM/YYYY" />
            {canViewReports && (
              <Button icon={<FileExcelOutlined />} onClick={exportExcel}>
                Xuất Excel
              </Button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <InventoryTrendChart />
        <div>
          <h3 className="mb-3 text-base font-semibold text-ink">Bảng Nhập – Xuất – Tồn</h3>
          <DataTable columns={nxtColumns} dataSource={TREND.map((t, i) => ({ id: i, ...t }))} pagination={false} />
        </div>
      </div>

      <div className="mt-4">
        <h3 className="mb-3 text-base font-semibold text-ink">Chênh lệch kiểm kê</h3>
        <DataTable columns={varianceColumns} dataSource={STOCKTAKES} pagination={false} />
      </div>
    </>
  );
}
