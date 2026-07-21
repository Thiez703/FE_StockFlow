import { Card, Select, Button } from 'antd';
import {
  SearchOutlined,
  ImportOutlined,
  ExportOutlined,
  ShoppingCartOutlined,
  AuditOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { PRODUCT_OPTIONS } from '@/mock/products';

const ACTIONS = [
  { label: 'Tạo phiếu nhập', icon: <ImportOutlined />, to: '/inbounds/create' },
  { label: 'Tạo phiếu xuất', icon: <ExportOutlined />, to: '/outbounds/create' },
  { label: 'Bán lẻ tại kho', icon: <ShoppingCartOutlined />, to: '/retail' },
  { label: 'Kiểm kê', icon: <AuditOutlined />, to: '/stocktakes/create' },
];

/**
 * Toolbar tiện ích trên Dashboard: tìm sản phẩm nhảy thẳng tới Tra cứu tồn (đã lọc
 * sẵn) + các nút tắt cho nghiệp vụ tạo phiếu hằng ngày.
 */
export default function QuickActionsBar() {
  const navigate = useNavigate();

  return (
    <Card className="border-hair" styles={{ body: { padding: 16 } }}>
      <div className="flex flex-wrap items-center gap-3">
        <Select
          showSearch
          allowClear
          placeholder="Tìm sản phẩm để xem tồn kho..."
          className="w-full sm:w-80"
          suffixIcon={<SearchOutlined className="text-slate-400" />}
          options={PRODUCT_OPTIONS}
          filterOption={(input, option) => {
            const kw = input.toLowerCase();
            return option.label.toLowerCase().includes(kw) || option.sku.toLowerCase().includes(kw);
          }}
          onChange={(_, option) => {
            if (option) navigate(`/inventory?q=${encodeURIComponent(option.sku)}`);
          }}
        />

        <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
          {ACTIONS.map((a) => (
            <Button key={a.to} icon={a.icon} onClick={() => navigate(a.to)}>
              {a.label}
            </Button>
          ))}
        </div>
      </div>
    </Card>
  );
}
