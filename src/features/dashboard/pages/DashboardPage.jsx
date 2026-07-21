import { Select } from 'antd';
import { FileSyncOutlined, ExportOutlined } from '@ant-design/icons';
import PageHeader from '@/components/ui/PageHeader';
import QuickActionsBar from '@/features/dashboard/components/QuickActionsBar';
import KpiHero from '@/features/dashboard/components/KpiHero';
import StatCard from '@/features/dashboard/components/StatCard';
import InventoryTrendChart from '@/features/dashboard/components/InventoryTrendChart';
import AlertsPanel from '@/features/dashboard/components/AlertsPanel';
import RecentActivities from '@/features/dashboard/components/RecentActivities';
import { formatNumber } from '@/utils/formatCurrency';
import { KPIS } from '@/mock/dashboard';

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Bảng điều khiển"
        subtitle="Tổng quan hoạt động kho hàng hôm nay, 18/07/2026"
        breadcrumb={[{ title: 'Tổng quan' }, { title: 'Bảng điều khiển' }]}
        extra={
          <Select
            defaultValue="today"
            className="w-36"
            options={[
              { value: 'today', label: 'Hôm nay' },
              { value: 'week', label: 'Tuần này' },
              { value: 'month', label: 'Tháng này' },
            ]}
          />
        }
      />

      <div className="mb-4">
        <QuickActionsBar />
      </div>

      {/* Hàng 1: KPI hero + 2 KPI phụ. Dưới xl: 2 card nằm ngang gọn gàng (không bị ép
          chiều cao vì KpiHero xếp trên, full width). Từ xl trở lên, 2 khối nằm cạnh
          nhau nên xếp 2 card dọc thành 2 hàng bằng nhau (grid-rows-2, tường minh) để
          lấp đúng chiều cao KpiHero bằng chính khối card, không dựa vào stretch ngầm. */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-6">
          <KpiHero />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:col-span-6 xl:grid-cols-1 xl:grid-rows-2">
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
