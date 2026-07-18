import { Button, Select } from 'antd';
import {
  WarningOutlined,
  FieldTimeOutlined,
  FileSyncOutlined,
  ExportOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/ui/PageHeader';
import KpiHero from '@/features/dashboard/components/KpiHero';
import StatCard from '@/features/dashboard/components/StatCard';
import InventoryTrendChart from '@/features/dashboard/components/InventoryTrendChart';
import AlertsPanel from '@/features/dashboard/components/AlertsPanel';
import RecentActivities from '@/features/dashboard/components/RecentActivities';
import { formatNumber } from '@/utils/formatCurrency';
import { KPIS } from '@/mock/dashboard';

export default function DashboardPage() {
  const navigate = useNavigate();

  return (
    <>
      <PageHeader
        title="Bảng điều khiển"
        subtitle="Tổng quan hoạt động kho hàng hôm nay, 18/07/2026"
        breadcrumb={[{ title: 'Tổng quan' }, { title: 'Bảng điều khiển' }]}
        extra={
          <>
            <Select
              defaultValue="today"
              className="w-36"
              options={[
                { value: 'today', label: 'Hôm nay' },
                { value: 'week', label: 'Tuần này' },
                { value: 'month', label: 'Tháng này' },
              ]}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/inbounds/create')}>
              Tạo phiếu nhập
            </Button>
          </>
        }
      />

      {/* Hàng 1: KPI hero + 4 KPI phụ */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-5">
          <KpiHero />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:col-span-7">
          <StatCard
            title="Tồn dưới định mức"
            value={formatNumber(KPIS.lowStockCount)}
            suffix="mặt hàng"
            icon={<WarningOutlined />}
            tone="amber"
            hint="Cần lên đơn nhập bổ sung"
          />
          <StatCard
            title="Hàng cận hạn"
            value={formatNumber(KPIS.nearExpiryCount)}
            suffix="lô"
            icon={<FieldTimeOutlined />}
            tone="red"
            hint="Ưu tiên xuất theo FEFO"
          />
          <StatCard
            title="Phiếu chờ duyệt"
            value={formatNumber(KPIS.pendingDocs)}
            suffix="phiếu"
            icon={<FileSyncOutlined />}
            tone="blue"
            hint="Nhập / xuất / kiểm kê"
          />
          <StatCard
            title="Xuất hôm nay"
            value={formatNumber(KPIS.outboundToday)}
            suffix="thùng"
            icon={<ExportOutlined />}
            tone="green"
            delta={8.2}
            deltaLabel="so với hôm qua"
          />
        </div>
      </div>

      {/* Hàng 2: biểu đồ + cảnh báo */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <InventoryTrendChart />
        </div>
        <div>
          <AlertsPanel />
        </div>
      </div>

      {/* Hàng 3: hoạt động gần đây */}
      <div className="mt-4">
        <RecentActivities />
      </div>
    </>
  );
}
