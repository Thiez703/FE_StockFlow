import { Select } from 'antd';
import {
  SearchOutlined,
  ImportOutlined,
  ExportOutlined,
  AuditOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { PRODUCT_OPTIONS } from '@/mock/products';

const ACTIONS = [
  {
    label: 'Nhập hàng',
    desc: 'Tạo phiếu nhập từ NCC',
    icon: <ImportOutlined />,
    to: '/inbounds/create',
    colorClass: 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 hover:border-blue-300 hover:-translate-y-1',
    iconBg: 'bg-white text-blue-500',
  },
  {
    label: 'Xuất hàng',
    desc: 'Tạo phiếu xuất bán/trả',
    icon: <ExportOutlined />,
    to: '/outbounds/create',
    colorClass: 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100 hover:border-amber-300 hover:-translate-y-1',
    iconBg: 'bg-white text-amber-500',
  },
  {
    label: 'Kiểm kê',
    desc: 'Đếm và đối chiếu tồn',
    icon: <AuditOutlined />,
    to: '/stocktakes/create',
    colorClass: 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 hover:-translate-y-1',
    iconBg: 'bg-white text-emerald-500',
  },
];

export default function QuickActionsBar() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col lg:flex-row gap-3">
      {/* Thanh tìm kiếm */}
      <div className="flex-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm flex items-center">
        <Select
          showSearch
          allowClear
          bordered={false}
          placeholder="Tra cứu nhanh tồn kho sản phẩm..."
          className="w-full text-base"
          size="large"
          suffixIcon={<SearchOutlined className="text-slate-400 text-lg" />}
          options={PRODUCT_OPTIONS}
          filterOption={(input, option) => {
            const kw = input.toLowerCase();
            return option.label.toLowerCase().includes(kw) || option.sku.toLowerCase().includes(kw);
          }}
          onChange={(_, option) => {
            if (option) navigate(`/inventory?q=${encodeURIComponent(option.sku)}`);
          }}
        />
      </div>

      {/* Các nút hành động */}
      <div className="flex flex-wrap sm:flex-nowrap gap-3 shrink-0">
        {ACTIONS.map((a) => (
          <button
            key={a.to}
            onClick={() => navigate(a.to)}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-3 rounded-xl px-5 py-2.5 border transition-all duration-200 shadow-sm ${a.colorClass}`}
          >
            <span className="text-xl">{a.icon}</span>
            <span className="font-bold text-base whitespace-nowrap">{a.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
