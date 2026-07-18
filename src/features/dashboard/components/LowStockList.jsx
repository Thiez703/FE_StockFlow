import { Card, Progress, Tag, Button } from 'antd';
import { useNavigate } from 'react-router-dom';

// Dữ liệu mẫu — thay bằng API sau.
const ITEMS = [
  { name: 'Coca-Cola lon 330ml', sku: 'CC-330', stock: 24, threshold: 200 },
  { name: 'Pepsi chai 1.5L', sku: 'PP-15L', stock: 58, threshold: 150 },
  { name: 'Sting dâu 330ml', sku: 'ST-330', stock: 0, threshold: 120 },
  { name: 'Aquafina 500ml', sku: 'AQ-500', stock: 96, threshold: 300 },
];

export default function LowStockList() {
  const navigate = useNavigate();

  return (
    <Card
      className="h-full border-slate-200/80 shadow-sm"
      styles={{ body: { padding: 22 } }}
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="m-0 text-base font-semibold text-slate-900">Sắp hết hàng</h3>
          <p className="mt-1 mb-0 text-sm text-slate-500">Cần nhập bổ sung</p>
        </div>
        <Tag color="error" bordered={false} className="font-semibold">
          {ITEMS.filter((i) => i.stock === 0 || i.stock / i.threshold < 0.2).length} mặt hàng
        </Tag>
      </div>

      <ul className="m-0 flex list-none flex-col gap-4 p-0">
        {ITEMS.map((item) => {
          const percent = Math.round((item.stock / item.threshold) * 100);
          const out = item.stock === 0;
          return (
            <li key={item.sku}>
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium text-slate-700">
                  {item.name}
                </span>
                <span className="shrink-0 text-xs font-semibold text-slate-500">
                  {item.stock}/{item.threshold}
                </span>
              </div>
              <Progress
                percent={percent}
                showInfo={false}
                size="small"
                strokeColor={out ? '#dc2626' : percent < 20 ? '#f59e0b' : '#2563eb'}
                className="!mb-0"
              />
            </li>
          );
        })}
      </ul>

      <Button
        block
        className="mt-5"
        onClick={() => navigate('/goods-receipt/create')}
      >
        Tạo phiếu nhập bổ sung
      </Button>
    </Card>
  );
}
