import { useMemo, useState } from 'react';
import { Input, Button, Select, Empty, InputNumber, App } from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  DeleteOutlined,
  ShoppingCartOutlined,
  CheckCircleOutlined,
  ThunderboltFilled,
} from '@ant-design/icons';
import PageHeader from '@/components/ui/PageHeader';
import DocCode from '@/components/ui/DocCode';
import { PRODUCTS } from '@/mock/products';
import { LOTS } from '@/mock/lots';
import { CUSTOMER_OPTIONS } from '@/mock/partners';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/date';

const ACTIVE_PRODUCTS = PRODUCTS.filter((p) => p.status === 'active');

// Gợi ý lô theo FEFO: lô còn hạn, HSD sớm nhất cho mỗi sản phẩm.
const FEFO = ACTIVE_PRODUCTS.reduce((map, p) => {
  const lot = LOTS.filter((l) => l.productId === p.id && l.status === 'active')
    .sort((a, b) => a.expDate.localeCompare(b.expDate))[0];
  map[p.id] = lot;
  return map;
}, {});

export default function RetailPage() {
  const { message } = App.useApp();
  const [keyword, setKeyword] = useState('');
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState('KH-006');

  const products = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return ACTIVE_PRODUCTS.filter(
      (p) => !kw || [p.name, p.sku, p.barcode].some((v) => v.toLowerCase().includes(kw)),
    );
  }, [keyword]);

  const addToCart = (product) => {
    setCart((prev) => {
      const found = prev.find((i) => i.id === product.id);
      if (found) return prev.map((i) => (i.id === product.id ? { ...i, qty: i.qty + 1 } : i));
      return [...prev, { id: product.id, name: product.name, price: product.price, unit: product.baseUnit, qty: 1 }];
    });
  };

  const setQty = (id, qty) =>
    setCart((prev) => prev.map((i) => (i.id === id ? { ...i, qty: Math.max(1, qty || 1) } : i)));
  const removeItem = (id) => setCart((prev) => prev.filter((i) => i.id !== id));

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const totalQty = cart.reduce((s, i) => s + i.qty, 0);

  const checkout = () => {
    if (!cart.length) {
      message.warning('Giỏ hàng đang trống');
      return;
    }
    message.success(`Đã hoàn tất bán lẻ — thu ${formatCurrency(total)}`);
    setCart([]);
  };

  return (
    <>
      <PageHeader
        title="Bán lẻ tại kho"
        subtitle="Màn hình POS — bán nhanh, gợi ý lô theo FEFO"
        breadcrumb={[{ title: 'Nghiệp vụ kho' }, { title: 'Bán lẻ tại kho' }]}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* Trái: tìm & chọn sản phẩm */}
        <div className="lg:col-span-3">
          <Input
            allowClear
            size="large"
            prefix={<SearchOutlined className="text-slate-400" />}
            placeholder="Quét mã vạch hoặc tìm sản phẩm để thêm nhanh..."
            className="mb-4"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />

          {products.length === 0 ? (
            <div className="rounded-2xl border border-hair bg-white py-16">
              <Empty description="Không tìm thấy sản phẩm" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {products.map((p) => {
                const lot = FEFO[p.id];
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => addToCart(p)}
                    className="group flex flex-col rounded-2xl border border-hair bg-white p-3 text-left transition-all hover:-translate-y-0.5 hover:border-royal hover:shadow-md"
                  >
                    <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-tint text-royal">
                      <ShoppingCartOutlined />
                    </div>
                    <div className="line-clamp-2 min-h-[40px] text-sm font-semibold text-ink">{p.name}</div>
                    <div className="mt-1 text-royal">
                      <span className="text-base font-bold">{formatCurrency(p.price)}</span>
                      <span className="text-xs text-ink-sub"> / {p.baseUnit}</span>
                    </div>
                    {lot && (
                      <div className="mt-2 flex items-center gap-1 text-[11px] text-ink-sub">
                        <ThunderboltFilled className="text-amber" />
                        FEFO: <DocCode muted className="!text-[11px]">{lot.code}</DocCode> · HSD {formatDate(lot.expDate)}
                      </div>
                    )}
                    <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-royal opacity-0 transition-opacity group-hover:opacity-100">
                      <PlusOutlined /> Thêm vào giỏ
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Phải: giỏ hàng */}
        <div className="lg:col-span-2">
          <div className="flex flex-col rounded-2xl border border-hair bg-white lg:sticky lg:top-24">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <h3 className="m-0 flex items-center gap-2 text-base font-semibold text-ink">
                <ShoppingCartOutlined className="text-royal" /> Giỏ hàng
              </h3>
              <span className="rounded-full bg-tint px-2 py-0.5 text-xs font-semibold text-royal">
                {totalQty} sản phẩm
              </span>
            </div>

            <div className="app-scroll max-h-[46vh] overflow-y-auto px-2 py-2">
              {cart.length === 0 ? (
                <div className="py-10">
                  <Empty description="Chưa có sản phẩm trong giỏ" />
                </div>
              ) : (
                cart.map((i) => (
                  <div key={i.id} className="flex items-center gap-2 rounded-xl px-2 py-2 hover:bg-slate-50">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-ink">{i.name}</div>
                      <div className="text-xs text-ink-sub">{formatCurrency(i.price)} / {i.unit}</div>
                    </div>
                    <InputNumber
                      size="small"
                      min={1}
                      value={i.qty}
                      onChange={(v) => setQty(i.id, v)}
                      className="!w-16"
                    />
                    <div className="w-24 text-right text-sm font-semibold text-ink">
                      {formatCurrency(i.price * i.qty)}
                    </div>
                    <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={() => removeItem(i.id)} />
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-slate-100 px-4 py-3">
              <Select
                className="mb-3 w-full"
                options={CUSTOMER_OPTIONS}
                value={customer}
                onChange={setCustomer}
                placeholder="Chọn khách hàng"
              />
              <div className="flex items-end justify-between">
                <span className="text-sm text-ink-sub">Tổng thanh toán</span>
                <span className="text-[28px] font-bold leading-none text-royal">{formatCurrency(total)}</span>
              </div>
              <Button
                type="primary"
                size="large"
                icon={<CheckCircleOutlined />}
                className="!mt-4 !h-12 !text-base"
                onClick={checkout}
                block
              >
                Hoàn tất bán hàng
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
