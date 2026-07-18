import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Card, App } from 'antd';
import { ArrowLeftOutlined, SaveOutlined, CheckOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/ui/PageHeader';
import ReceiptGeneralInfo from '@/features/goods-receipt/components/ReceiptGeneralInfo';
import ReceiptItemsTable from '@/features/goods-receipt/components/ReceiptItemsTable';
import {
  goodsReceiptSchema,
  emptyItem,
} from '@/features/goods-receipt/schemas/goodsReceiptSchema';
import { formatCurrency, formatNumber } from '@/utils/formatCurrency';

// Sinh mã phiếu tạm cho demo.
function generateCode() {
  return `PN-2026-0${Math.floor(100 + Math.random() * 900)}`;
}

// Thẻ tổng kết — theo dõi `items` để tính tổng theo thời gian thực.
function OrderSummary({ control }) {
  const items = useWatch({ control, name: 'items' }) ?? [];
  const totalQty = items.reduce((sum, it) => sum + (Number(it?.quantity) || 0), 0);
  const totalAmount = items.reduce(
    (sum, it) => sum + (Number(it?.quantity) || 0) * (Number(it?.unitPrice) || 0),
    0,
  );

  const rows = [
    { label: 'Số mặt hàng', value: `${items.length} sản phẩm` },
    { label: 'Tổng số lượng', value: `${formatNumber(totalQty)} thùng/lon` },
  ];

  return (
    <Card className="border-slate-200/80 shadow-sm" styles={{ body: { padding: 22 } }}>
      <h3 className="m-0 text-base font-semibold text-slate-900">Tổng kết phiếu</h3>
      <div className="mt-4 flex flex-col gap-3">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between text-sm">
            <span className="text-slate-500">{r.label}</span>
            <span className="font-medium text-slate-800">{r.value}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-dashed border-slate-200 pt-4">
        <span className="text-sm font-medium text-slate-600">Tổng giá trị</span>
        <span className="text-xl font-bold text-blue-600">{formatCurrency(totalAmount)}</span>
      </div>
    </Card>
  );
}

export default function GoodsReceiptCreatePage() {
  const { message } = App.useApp();
  const navigate = useNavigate();

  const methods = useForm({
    resolver: zodResolver(goodsReceiptSchema),
    defaultValues: {
      code: generateCode(),
      supplierId: undefined,
      warehouseId: undefined,
      receiptDate: null,
      note: '',
      items: [emptyItem],
    },
  });

  const onSubmit = (values) => {
    // Demo: log dữ liệu hợp lệ. Thực tế sẽ gọi API tạo phiếu.
    console.log('Goods receipt payload:', values);
    message.success('Đã tạo phiếu nhập kho thành công!');
  };

  const onError = () => {
    message.error('Vui lòng kiểm tra lại các trường bắt buộc.');
  };

  return (
    <FormProvider {...methods}>
      <PageHeader
        title="Tạo phiếu nhập kho"
        subtitle="Ghi nhận hàng hóa nhập vào kho từ nhà cung cấp"
        breadcrumb={[
          { title: 'Bảng điều khiển', href: '/dashboard' },
          { title: 'Nhập kho' },
          { title: 'Tạo phiếu' },
        ]}
        extra={
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
            Quay lại
          </Button>
        }
      />

      <form onSubmit={methods.handleSubmit(onSubmit, onError)}>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div className="flex flex-col gap-4 xl:col-span-2">
            <ReceiptGeneralInfo />
            <ReceiptItemsTable />
          </div>

          <div className="xl:col-span-1">
            <div className="flex flex-col gap-4 xl:sticky xl:top-6">
              <OrderSummary control={methods.control} />

              <Card
                className="border-slate-200/80 shadow-sm"
                styles={{ body: { padding: 22 } }}
              >
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  icon={<CheckOutlined />}
                  loading={methods.formState.isSubmitting}
                  block
                >
                  Hoàn tất nhập kho
                </Button>
                <Button
                  size="large"
                  icon={<SaveOutlined />}
                  className="!mt-3"
                  onClick={() => message.info('Đã lưu nháp phiếu nhập.')}
                  block
                >
                  Lưu nháp
                </Button>
                <p className="mt-4 mb-0 text-center text-xs text-slate-400">
                  Kiểm tra kỹ số lượng và đơn giá trước khi hoàn tất.
                </p>
              </Card>
            </div>
          </div>
        </div>
      </form>
    </FormProvider>
  );
}
