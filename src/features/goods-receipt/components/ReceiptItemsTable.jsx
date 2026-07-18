import { Card, Button, Select, InputNumber, Empty } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useFormContext, useFieldArray, Controller, useWatch } from 'react-hook-form';
import { formatCurrency } from '@/utils/formatCurrency';
import { emptyItem } from '@/features/goods-receipt/schemas/goodsReceiptSchema';

// Dữ liệu mẫu — thay bằng API sau. `price` dùng để tự điền đơn giá khi chọn sản phẩm.
const PRODUCTS = [
  { value: 'CC-330', label: 'Coca-Cola lon 330ml', price: 8000 },
  { value: 'PP-15L', label: 'Pepsi chai 1.5L', price: 15000 },
  { value: 'ST-330', label: 'Sting dâu lon 330ml', price: 9000 },
  { value: 'AQ-500', label: 'Aquafina 500ml', price: 5000 },
  { value: 'RB-250', label: 'Red Bull lon 250ml', price: 12000 },
];

// Một dòng sản phẩm. Tách riêng để dùng hook useWatch tính thành tiền theo dòng.
function ItemRow({ index, control, errors, setValue, onRemove, removable }) {
  const [quantity, unitPrice] = useWatch({
    control,
    name: [`items.${index}.quantity`, `items.${index}.unitPrice`],
  });
  const lineTotal = (Number(quantity) || 0) * (Number(unitPrice) || 0);
  const rowErr = errors?.items?.[index];

  return (
    <div className="grid grid-cols-12 items-start gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0 hover:bg-slate-50/60">
      {/* Sản phẩm */}
      <div className="col-span-12 md:col-span-5">
        <span className="mb-1 block text-xs font-medium text-slate-400 md:hidden">Sản phẩm</span>
        <Controller
          name={`items.${index}.productId`}
          control={control}
          render={({ field }) => (
            <Select
              {...field}
              showSearch
              optionFilterProp="label"
              placeholder="Chọn sản phẩm"
              options={PRODUCTS}
              status={rowErr?.productId ? 'error' : ''}
              className="w-full"
              onChange={(value) => {
                field.onChange(value);
                const product = PRODUCTS.find((p) => p.value === value);
                if (product) setValue(`items.${index}.unitPrice`, product.price);
              }}
            />
          )}
        />
      </div>

      {/* Số lượng */}
      <div className="col-span-4 md:col-span-2">
        <span className="mb-1 block text-xs font-medium text-slate-400 md:hidden">Số lượng</span>
        <Controller
          name={`items.${index}.quantity`}
          control={control}
          render={({ field }) => (
            <InputNumber
              {...field}
              min={1}
              className="w-full"
              status={rowErr?.quantity ? 'error' : ''}
            />
          )}
        />
      </div>

      {/* Đơn giá */}
      <div className="col-span-8 md:col-span-2">
        <span className="mb-1 block text-xs font-medium text-slate-400 md:hidden">Đơn giá</span>
        <Controller
          name={`items.${index}.unitPrice`}
          control={control}
          render={({ field }) => (
            <InputNumber
              {...field}
              min={0}
              step={1000}
              className="w-full"
              status={rowErr?.unitPrice ? 'error' : ''}
              formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
              parser={(v) => v?.replace(/\./g, '')}
            />
          )}
        />
      </div>

      {/* Thành tiền */}
      <div className="col-span-8 self-center md:col-span-2 md:text-right">
        <span className="mb-1 block text-xs font-medium text-slate-400 md:hidden">Thành tiền</span>
        <span className="font-semibold text-slate-800">{formatCurrency(lineTotal)}</span>
      </div>

      {/* Xóa */}
      <div className="col-span-4 flex justify-end self-center md:col-span-1">
        <Button
          type="text"
          danger
          aria-label="Xóa dòng"
          icon={<DeleteOutlined />}
          disabled={!removable}
          onClick={onRemove}
        />
      </div>
    </div>
  );
}

/**
 * Bảng danh sách sản phẩm của phiếu nhập — thêm/xóa dòng động bằng useFieldArray.
 */
export default function ReceiptItemsTable() {
  const {
    control,
    setValue,
    formState: { errors },
  } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const itemsError = errors?.items?.message || errors?.items?.root?.message;

  return (
    <Card
      title="Danh sách sản phẩm"
      className="border-slate-200/80 shadow-sm"
      styles={{ header: { borderBottom: '1px solid #f1f5f9' }, body: { padding: 0 } }}
      extra={
        <Button
          type="primary"
          ghost
          icon={<PlusOutlined />}
          onClick={() => append(emptyItem)}
        >
          Thêm dòng
        </Button>
      }
    >
      {/* Tiêu đề cột (chỉ hiện trên màn hình rộng) */}
      <div className="hidden grid-cols-12 gap-3 border-b border-slate-100 bg-slate-50/70 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-400 md:grid">
        <span className="col-span-5">Sản phẩm</span>
        <span className="col-span-2">Số lượng</span>
        <span className="col-span-2">Đơn giá</span>
        <span className="col-span-2 text-right">Thành tiền</span>
        <span className="col-span-1" />
      </div>

      {fields.length === 0 ? (
        <div className="py-10">
          <Empty description="Chưa có sản phẩm nào" />
        </div>
      ) : (
        fields.map((field, index) => (
          <ItemRow
            key={field.id}
            index={index}
            control={control}
            errors={errors}
            setValue={setValue}
            onRemove={() => remove(index)}
            removable={fields.length > 1}
          />
        ))
      )}

      {itemsError && (
        <p className="m-0 px-4 py-3 text-sm text-rose-600">{itemsError}</p>
      )}
    </Card>
  );
}
