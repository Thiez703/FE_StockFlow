import { Card, Button } from 'antd';
import {
  ImportOutlined,
  ExportOutlined,
  AuditOutlined,
  WarningOutlined,
  FileSyncOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import DocCode from '@/components/ui/DocCode';
import StatusPill from '@/components/ui/StatusPill';
import { formatCurrency } from '@/utils/formatCurrency';
import { RECENT_ACTIVITIES } from '@/mock/dashboard';

// Icon + màu + đích điều hướng theo loại hoạt động.
const KIND = {
  inbound: { icon: <ImportOutlined />, tone: 'bg-tint text-royal', to: '/inbounds' },
  outbound: { icon: <ExportOutlined />, tone: 'bg-[#dcfce7] text-[#15803d]', to: '/outbounds' },
  stocktake: { icon: <AuditOutlined />, tone: 'bg-[#fef3c7] text-[#b45309]', to: '/stocktakes' },
  abnormal: { icon: <WarningOutlined />, tone: 'bg-[#fee2e2] text-[#b91c1c]', to: '/abnormal-stocks' },
};

// Dự phòng khi gặp loại hoạt động chưa được khai báo trong KIND — không bao giờ
// crash UI. Ở dev, in cảnh báo để phát hiện thiếu ánh xạ ngay khi code, tránh
// việc lỗi âm thầm trôi vào production.
const DEFAULT_KIND = { icon: <FileSyncOutlined />, tone: 'bg-slate-100 text-slate-500', to: '/logs' };

function resolveKind(kind) {
  const found = KIND[kind];
  if (!found && import.meta.env.DEV) {
    console.warn(`[RecentActivities] Chưa khai báo icon/màu cho loại hoạt động "${kind}" trong KIND.`);
  }
  return found ?? DEFAULT_KIND;
}

/**
 * Bảng "Hoạt động gần đây" trên Dashboard — dòng thời gian nghiệp vụ nhập/xuất/kiểm kê.
 */
export default function RecentActivities() {
  const navigate = useNavigate();

  return (
    <Card className="border-hair" styles={{ body: { padding: 0 } }}>
      <div className="flex items-center justify-between px-5 py-4">
        <h3 className="m-0 text-base font-semibold text-ink">Hoạt động gần đây</h3>
        <Button type="link" className="!px-0" onClick={() => navigate('/logs')}>
          Nhật ký <RightOutlined className="text-[10px]" />
        </Button>
      </div>

      <ul className="m-0 flex list-none flex-col p-0">
        {RECENT_ACTIVITIES.map((a) => {
          const kind = resolveKind(a.kind);
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
                  <DocCode>{a.code}</DocCode>
                  <StatusPill status={a.status} />
                </div>
                <p className="m-0 truncate text-sm text-ink-sub">
                  {a.title} · {a.user}
                </p>
              </div>
              <div className="hidden shrink-0 text-right sm:block">
                {a.amount != null && (
                  <div className="text-sm font-semibold text-ink">{formatCurrency(a.amount)}</div>
                )}
                <div className="text-xs text-ink-sub">{a.time}</div>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
