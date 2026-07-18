import { Button, Select } from 'antd';
import {
  DropboxOutlined,
  ImportOutlined,
  ExportOutlined,
  WarningOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/features/dashboard/components/StatCard';
import InventoryTrendChart from '@/features/dashboard/components/InventoryTrendChart';
import LowStockList from '@/features/dashboard/components/LowStockList';
import RecentReceiptsTable from '@/features/dashboard/components/RecentReceiptsTable';
import { formatCurrency, formatNumber } from '@/utils/formatCurrency';

export default function DashboardPage() {
  const navigate = useNavigate();

  return (
    <>
      <PageHeader
        title="Bảng điều khiển"
        subtitle="Tổng quan hoạt động kho hàng hôm nay, 18/07/2026"
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
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/goods-receipt/create')}
            >
              Tạo phiếu nhập
            </Button>
          </>
        }
      />

      {/* Thẻ số liệu */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Tổng sản phẩm"
          value={formatNumber(1284)}
          icon={<DropboxOutlined />}
          tone="blue"
          delta={4.2}
          deltaLabel="so với tháng trước"
        />
        <StatCard
          title="Nhập kho hôm nay"
          value={formatNumber(342)}
          icon={<ImportOutlined />}
          tone="green"
          delta={12.5}
          deltaLabel="so với hôm qua"
        />
        <StatCard
          title="Xuất kho hôm nay"
          value={formatNumber(268)}
          icon={<ExportOutlined />}
          tone="amber"
          delta={-3.1}
          deltaLabel="so với hôm qua"
        />
        <StatCard
          title="Giá trị tồn kho"
          value={formatCurrency(2480000000)}
          icon={<WarningOutlined />}
          tone="red"
          delta={1.8}
          deltaLabel="so với tuần trước"
        />
      </div>

      {/* Biểu đồ + cảnh báo tồn kho */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <InventoryTrendChart />
        </div>
        <div>
          <LowStockList />
        </div>
      </div>

      {/* Bảng phiếu nhập gần đây */}
      <div className="mt-4">
        <RecentReceiptsTable />
      </div>
    </>
  );
}
