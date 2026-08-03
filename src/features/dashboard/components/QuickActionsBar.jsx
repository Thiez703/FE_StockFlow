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
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {ACTIONS.map((a) => (
          <button
            key={a.to}
            onClick={() => navigate(a.to)}
            className={`group flex flex-col items-start gap-1 rounded-2xl border p-5 transition-all duration-200 shadow-sm ${a.colorClass}`}
          >
            <div className="flex items-center gap-3 w-full">
              <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl shadow-sm text-xl transition-transform group-hover:scale-110 ${a.iconBg}`}>
                {a.icon}
              </span>
              <span className="font-bold text-lg text-slate-800">{a.label}</span>
            </div>
            <span className="text-sm font-medium opacity-80 mt-1">{a.desc}</span>
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <Select
          showSearch
          allowClear
          placeholder="Tra cứu nhanh tồn kho sản phẩm..."
          className="w-full lg:w-1/3"
          size="large"
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
      </div>
    </div>
  );
}
