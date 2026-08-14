import { Select } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
const PRODUCT_OPTIONS = [];

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


    </div>
  );
}
