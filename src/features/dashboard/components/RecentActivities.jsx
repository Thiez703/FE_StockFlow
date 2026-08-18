import { Card, Button, Spin } from 'antd';
import {
  ImportOutlined,
  ExportOutlined,
  AuditOutlined,
  FileSyncOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import DocCode from '@/components/ui/DocCode';
import { useQuery } from '@tanstack/react-query';
import { auditLogApi } from '@/api/auditLogs';
import { AUDIT_ACTION_LABEL, ENTITY_TYPE_LABEL } from '@/constants/auditActions';

// Icon + màu + đích điều hướng theo loại hoạt động.
const KIND = {
  inbound: { icon: <ImportOutlined />, tone: 'bg-tint text-royal', to: '/inbounds' },
  outbound: { icon: <ExportOutlined />, tone: 'bg-[#dcfce7] text-[#15803d]', to: '/outbounds' },
  stocktake: { icon: <AuditOutlined />, tone: 'bg-[#fef3c7] text-[#b45309]', to: '/stocktakes' },
  transfer: { icon: <FileSyncOutlined />, tone: 'bg-[#e0e7ff] text-[#4338ca]', to: '/transfers' },
};

const DEFAULT_KIND = { icon: <FileSyncOutlined />, tone: 'bg-slate-100 text-slate-500', to: '/logs' };

function resolveKind(action, entityType) {
  let key = '';
  const str = (action + ' ' + entityType).toLowerCase();
  if (str.includes('inbound')) key = 'inbound';
  else if (str.includes('outbound')) key = 'outbound';
  else if (str.includes('stocktake')) key = 'stocktake';
  else if (str.includes('transfer')) key = 'transfer';
  return KIND[key] || DEFAULT_KIND;
}

/**
 * Bảng "Hoạt động gần đây" trên Dashboard — dòng thời gian nghiệp vụ nhập/xuất/kiểm kê.
 */
export default function RecentActivities() {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['recent-activities'],
    queryFn: () => auditLogApi.search({ page: 0, size: 5, sort: 'createdAt,desc' }),
  });

  const logs = data?.content || [];

  return (
    <Card className="border-hair" styles={{ body: { padding: 0 } }}>
      <div className="flex items-center justify-between px-5 py-4">
        <h3 className="m-0 text-base font-semibold text-ink">Hoạt động gần đây</h3>
        <Button type="link" className="!px-0" onClick={() => navigate('/logs')}>
          Nhật ký <RightOutlined className="text-[10px]" />
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-5"><Spin /></div>
      ) : logs.length === 0 ? (
        <div className="p-5 text-center text-ink-sub">Chưa có hoạt động nào</div>
      ) : (
        <ul className="m-0 flex list-none flex-col p-0">
          {logs.map((a) => {
            const kind = resolveKind(a.action, a.entityType);
            return (
              <li
                key={a.id}
                className="flex items-center gap-3 border-t border-slate-100 px-5 py-3.5 transition-colors hover:bg-slate-50/70"
              >
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${kind.tone}`}>
                  {kind.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <DocCode>{AUDIT_ACTION_LABEL[a.action] || a.action}</DocCode>
                  </div>
                  <p className="m-0 truncate text-sm text-ink-sub" title={a.detail}>
                    {(() => {
                      if (a.action.startsWith('API_')) {
                        const actionName = a.action === 'API_POST' ? 'Tạo mới' : (a.action === 'API_DELETE' ? 'Xóa' : 'Cập nhật');
                        const entityName = ENTITY_TYPE_LABEL[a.entityType] || a.entityType;
                        return `${actionName} ${entityName.toLowerCase()}`;
                      }
                      return a.detail;
                    })()} · <span className="font-medium">{a.actorFullName}</span>
                  </p>
                </div>
                <div className="hidden shrink-0 text-right sm:block">
                  <div className="text-xs text-ink-sub">
                    {new Intl.DateTimeFormat('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      day: '2-digit',
                      month: '2-digit',
                    }).format(new Date(a.createdAt))}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
