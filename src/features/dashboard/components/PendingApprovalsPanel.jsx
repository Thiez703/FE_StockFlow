import { Card, Button, Spin, Empty, Badge } from 'antd';
import {
  AuditOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import DocCode from '@/components/ui/DocCode';
import { formatDateTime } from '@/utils/date';
import { stocktakeApi } from '@/api/stocktakes';
import { DEFAULT_WAREHOUSE_ID } from '@/constants/warehouse';

export default function PendingApprovalsPanel() {
  const navigate = useNavigate();

  const { data: stocktakesPage, isLoading } = useQuery({
    queryKey: ['dashboard', 'pending-stocktakes', DEFAULT_WAREHOUSE_ID],
    queryFn: () => stocktakeApi.getAll(DEFAULT_WAREHOUSE_ID, { status: 'PENDING', size: 50 }),
  });

  const pendingItems = (stocktakesPage?.content?.filter(i => i.status === 'PENDING') ?? [])
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const totalPending = pendingItems.length;

  return (
    <Card className="h-full border-hair flex flex-col" styles={{ body: { padding: 0, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 } }}>
      <div className="flex items-center justify-between px-5 py-4 shrink-0">
        <h3 className="m-0 text-base font-semibold text-ink">
          Phiếu chờ duyệt
          {totalPending > 0 && (
            <Badge count={totalPending} className="ml-2" color="#3b82f6" />
          )}
        </h3>
      </div>

      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex justify-center items-center h-full min-h-[150px]"><Spin /></div>
        ) : pendingItems.length === 0 ? (
          <div className="flex justify-center items-center h-full min-h-[150px]">
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<span className="text-sm text-ink-sub">Không có phiếu chờ duyệt</span>} />
          </div>
        ) : (
          <ul className="m-0 flex list-none flex-col p-0">
            {pendingItems.map((item) => (
              <li
                key={`STOCKTAKE-${item.id}`}
                className="flex items-center gap-3 border-t border-slate-100 px-5 py-3.5 transition-colors hover:bg-slate-50/70 cursor-pointer"
                onClick={() => navigate(`/stocktakes`)}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#fef3c7] text-[#b45309]">
                  <AuditOutlined />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">Kiểm kê</span>
                    <DocCode muted>{item.code}</DocCode>
                  </div>
                  <div className="text-xs text-ink-sub">
                    Tạo lúc {formatDateTime(item.createdAt)} bởi {item.createdBy || 'Hệ thống'}
                  </div>
                </div>
                <div className="shrink-0">
                  <Button size="small" type="primary" ghost>Chi tiết</Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
