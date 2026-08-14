import { Card, Button, Select, InputNumber, Empty } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useFormContext, useFieldArray, Controller, useWatch } from 'react-hook-form';
import { formatCurrency } from '@/utils/formatCurrency';
const PRODUCT_OPTIONS = [];

const DEFAULT_ITEM = { productId: undefined, quantity: 1, unitPrice: 0 };

// Một dòng hàng — useWatch để tính thành tiền theo dòng ngay tại UI.
function ItemRow({ name, index, control, errors, onRemove, removable }) {
  const [quantity, unitPrice] = useWatch({
    control,
    name: [`${name}.${index}.quantity`, `${name}.${index}.unitPrice`],
  });
  const lineTotal = (Number(quantity) || 0) * (Number(unitPrice) || 0);
  const rowErr = errors?.[name]?.[index];

  return (
    <div className="grid grid-cols-12 items-start gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0 hover:bg-slate-50/60">
      <div className="col-span-12 md:col-span-5">
        <span className="mb-1 block text-xs font-medium text-slate-400 md:hidden">Sản phẩm</span>
        <Controller
          name={`${name}.${index}.productId`}
          control={control}
          render={({ field }) => (
            <Select
              {...field}
              showSearch
              optionFilterProp="label"
              placeholder="Chọn sản phẩm"
              options={PRODUCT_OPTIONS}
              status={rowErr?.productId ? 'error' : ''}
              className="w-full"
              onChange={(value) => {
                field.onChange(value);
              }}
            />
          )}
        />
      </div>

      <div className="col-span-4 md:col-span-2">
        <span className="mb-1 block text-xs font-medium text-slate-400 md:hidden">Số lượng</span>
        <Controller
          name={`${name}.${index}.quantity`}
          control={control}
          render={({ field }) => (
            <InputNumber {...field} min={1} className="w-full" status={rowErr?.quantity ? 'error' : ''} />
          )}
        />
      </div>

      <div className="col-span-8 md:col-span-2">
        <span className="mb-1 block text-xs font-medium text-slate-400 md:hidden">Đơn giá</span>
        <Controller
          name={`${name}.${index}.unitPrice`}
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

      <div className="col-span-8 self-center md:col-span-2 md:text-right">
        <span className="mb-1 block text-xs font-medium text-slate-400 md:hidden">Thành tiền</span>
        <span className="font-semibold text-ink">{formatCurrency(lineTotal)}</span>
      </div>

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
 * Bảng dòng hàng dùng chung cho phiếu nhập & phiếu xuất (RHF useFieldArray).
 * Thành tiền từng dòng và trạng thái lỗi hiển thị ngay tại UI.
 *
 * @param {string} [name]        Tên field mảng trong form (mặc định 'items').
 * @param {object} [emptyItem]   Giá trị dòng mới khi bấm "Thêm dòng".
 * @param {string} [title]
 */
export default function LineItemsTable({ name = 'items', emptyItem = DEFAULT_ITEM, title = 'Danh sách sản phẩm' }) {
  const {
    control,
    formState: { errors },
  } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name });
  const arrErr = errors?.[name]?.message || errors?.[name]?.root?.message;

  return (
    <Card
      title={title}
      className="border-hair"
      styles={{ header: { borderBottom: '1px solid #f1f5f9' }, body: { padding: 0 } }}
      extra={
        <Button type="primary" ghost icon={<PlusOutlined />} onClick={() => append(emptyItem)}>
          Thêm dòng
        </Button>
      }
    >
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
            name={name}
            index={index}
            control={control}
            errors={errors}
            onRemove={() => remove(index)}
            removable={fields.length > 1}
          />
        ))
      )}

      {arrErr && <p className="m-0 px-4 py-3 text-sm text-rose-600">{arrErr}</p>}
    </Card>
  );
}
