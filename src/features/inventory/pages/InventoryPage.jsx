import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Input, Select, Spin, Alert, Button, Tag, Radio } from 'antd';
import { SearchOutlined, DatabaseOutlined, HistoryOutlined, BoxPlotOutlined, EnvironmentOutlined, BarcodeOutlined, ClockCircleOutlined, AppstoreOutlined, BarsOutlined } from '@ant-design/icons';
import PageHeader from '@/components/ui/PageHeader';
import FilterBar from '@/components/ui/FilterBar';
import TableEmptyState from '@/components/ui/TableEmptyState';
import FadeSection from '@/components/ui/FadeSection';
import { StaggerList, StaggerItem } from '@/components/ui/StaggerList';
import StatCard from '@/features/dashboard/components/StatCard';
import AccessDenied from '@/components/feedback/AccessDenied';
import { usePermissions } from '@/hooks/usePermissions';
import { inventoryApi } from '@/api/inventory';
import { productApi } from '@/api/products';
import { storageLocationApi } from '@/api/warehouses';
import { DEFAULT_WAREHOUSE_ID } from '@/constants/warehouse';
import { getErrorMessage } from '@/utils/getErrorMessage';
import { formatNumber } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/date';

const PAGE_SIZE = 50;

export default function InventoryPage() {
  const navigate = useNavigate();
  const { canViewInventory } = usePermissions();
  const [searchParams] = useSearchParams();
  const [keyword, setKeyword] = useState(searchParams.get('q') ?? '');
  const [productId, setProductId] = useState(null);
  const [locationId, setLocationId] = useState(null);
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const [viewMode, setViewMode] = useState('detailed'); // 'detailed' | 'grouped'

  // Danh sách sản phẩm & vị trí cho bộ lọc
  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => productApi.getAll(),
  });
  const { data: locations = [] } = useQuery({
    queryKey: ['locations', DEFAULT_WAREHOUSE_ID],
    queryFn: () => storageLocationApi.getByWarehouse(DEFAULT_WAREHOUSE_ID),
  });

  const productOptions = useMemo(
    () => products.map((p) => ({ value: p.id, label: `${p.code} – ${p.name}` })),
    [products],
  );
  const locationOptions = useMemo(
    () => locations.map((l) => ({ value: l.id, label: l.locationCode })),
    [locations],
  );

  // Tồn kho — phân trang server
  const queryParams = useMemo(() => {
    const p = { page, size: PAGE_SIZE };
    if (productId) p.productId = productId;
    if (locationId && viewMode === 'detailed') p.locationId = locationId;
    return p;
  }, [page, productId, locationId, viewMode]);

  const {
    data: inventoryPage,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['inventory', viewMode, queryParams],
    queryFn: () => viewMode === 'grouped' ? inventoryApi.getByProduct(queryParams) : inventoryApi.getAll(queryParams),
    placeholderData: keepPreviousData,
  });

  const isArrayResponse = Array.isArray(inventoryPage);
  const totalElements = isArrayResponse ? inventoryPage.length : (inventoryPage?.totalElements ?? 0);
  const totalPages = isArrayResponse ? 1 : (inventoryPage?.totalPages ?? 0);

  // Client-side keyword filter (API không hỗ trợ keyword search)
  const data = useMemo(() => {
    const allItems = isArrayResponse ? inventoryPage : (inventoryPage?.content ?? []);
    const processedItems = allItems.map(i => ({ 
      ...i, 
      id: i.id ?? i.productId,
      quantity: i.quantity ?? i.totalQuantity ?? i.totalQty ?? 0
    }));
    const kw = keyword.trim().toLowerCase();
    if (!kw) return processedItems;
    return processedItems.filter((i) =>
      [i.productName, i.productCode, i.lotCode, i.locationCode].some(
        (v) => String(v ?? '').toLowerCase().includes(kw),
      ),
    );
  }, [inventoryPage, keyword, isArrayResponse]);

  const totalQty = data.reduce((s, i) => s + (i.quantity ?? 0), 0);

  const selected = data.find((i) => i.id === selectedId) ?? data[0] ?? null;

  const maxQty = useMemo(() => Math.max(0, ...data.map(i => i.quantity || 0)), [data]);

  // Reset page khi đổi filter
  const handleProductChange = (v) => {
    setProductId(v ?? null);
    setPage(0);
    setSelectedId(null);
  };
  const handleLocationChange = (v) => {
    setLocationId(v ?? null);
    setPage(0);
    setSelectedId(null);
  };

  if (!canViewInventory) return <AccessDenied />;

  return (
    <>
      <PageHeader
        title="Tra cứu tồn"
        subtitle="Tồn kho hiện tại theo sản phẩm – lô – vị trí"
        breadcrumb={[{ title: 'Tồn kho & Báo cáo' }, { title: 'Tra cứu tồn' }]}
      />

      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard title="Số dòng tồn" value={formatNumber(totalElements)} suffix="dòng" icon={<DatabaseOutlined />} tone="blue" compact />
        <StatCard title="Tổng tồn (trang này)" value={formatNumber(totalQty)} suffix="đơn vị" icon={<DatabaseOutlined />} tone="green" compact />
        <StatCard title="Trang" value={`${page + 1} / ${totalPages || 1}`} icon={<DatabaseOutlined />} tone="blue" compact />
      </div>

      <FilterBar>
        <Radio.Group
          value={viewMode}
          onChange={(e) => {
            setViewMode(e.target.value);
            setPage(0);
            setSelectedId(null);
          }}
          optionType="button"
          buttonStyle="solid"
          className="shrink-0 hidden sm:inline-flex"
        >
          <Radio.Button value="detailed"><BarsOutlined /> Tồn lô</Radio.Button>
          <Radio.Button value="grouped"><AppstoreOutlined /> Tồn sản phẩm</Radio.Button>
        </Radio.Group>
        <Input
          allowClear
          prefix={<SearchOutlined className="text-slate-400" />}
          placeholder="Tìm sản phẩm, mã, lô..."
          className="w-full sm:min-w-[200px] sm:max-w-xs sm:flex-1"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <Select
          allowClear
          showSearch
          optionFilterProp="label"
          placeholder="Sản phẩm"
          className="w-full sm:w-56"
          options={productOptions}
          value={productId}
          onChange={handleProductChange}
        />
        <Select
          allowClear
          showSearch
          optionFilterProp="label"
          placeholder="Vị trí"
          className="w-full sm:w-36"
          options={locationOptions}
          value={locationId}
          onChange={handleLocationChange}
          disabled={viewMode === 'grouped'}
        />
      </FilterBar>

      {isError && (
        <Alert className="mb-4" type="error" showIcon message="Không tải được dữ liệu tồn kho" description={getErrorMessage(error)} />
      )}

      {isLoading ? (
        <div className="flex justify-center py-20"><Spin size="large" /></div>
      ) : (
        <FadeSection dataKey={data.map((i) => i.id).join(',')}>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[400px_1fr]">
            {/* Danh sách — chọn 1 dòng để xem chi tiết ở panel bên phải */}
            <div className="flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-5 py-4">
                <span className="text-[15px] font-bold text-slate-700">Kết quả tra cứu <Tag color="blue" className="ml-2 rounded-full border-none">{data.length}</Tag></span>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Tổng <span className="text-slate-700">{formatNumber(totalQty)}</span></span>
              </div>
              <div className="app-scroll max-h-[650px] overflow-y-auto p-3">
                {data.length === 0 ? (
                  <TableEmptyState message="Không tìm thấy dòng tồn phù hợp" />
                ) : (
                  <StaggerList className="m-0 flex list-none flex-col gap-2 p-0">
                    {data.map((item) => {
                      const active = selected?.id === item.id;
                      const pct = maxQty > 0 ? (item.quantity / maxQty) * 100 : 0;
                      return (
                        <StaggerItem
                          key={item.id}
                          onClick={() => setSelectedId(item.id)}
                          className={`relative cursor-pointer overflow-hidden rounded-xl border p-3.5 transition-all duration-300 ${
                            active 
                              ? 'border-blue-400 bg-blue-50/30 shadow-sm ring-1 ring-blue-400/20' 
                              : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          {/* Visual quantity bar background */}
                          <div 
                            className={`absolute left-0 top-0 bottom-0 transition-all duration-700 ease-out opacity-20 ${active ? 'bg-blue-300' : 'bg-slate-200'}`}
                            style={{ width: `${pct}%` }}
                          />
                          
                          <div className="relative z-10 flex items-center justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className={`truncate text-[14px] font-semibold transition-colors ${active ? 'text-blue-900' : 'text-slate-800'}`}>
                                {item.productName}
                              </div>
                              <div className="mono mt-1 truncate text-[11px] uppercase tracking-wider font-medium text-slate-400">
                                {item.productCode}
                              </div>
                            </div>
                            <div className="flex flex-col items-end shrink-0">
                              <span className={`mono text-lg font-black leading-none ${active ? 'text-blue-600' : 'text-slate-700'}`}>
                                {formatNumber(item.quantity)}
                              </span>
                              <span className="text-[9px] uppercase tracking-widest font-bold text-slate-400 mt-1">Số lượng</span>
                            </div>
                          </div>
                          
                          <div className="relative z-10 mt-3 flex items-center gap-4 text-xs font-medium">
                            {viewMode === 'detailed' ? (
                              <>
                                <div className="flex items-center gap-1.5 text-slate-500 bg-white/60 px-2 py-0.5 rounded-md border border-slate-100 backdrop-blur-sm shadow-sm">
                                  <BarcodeOutlined className={active ? 'text-blue-500' : 'text-slate-400'} />
                                  <span className="mono">{item.lotCode}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-slate-500 bg-white/60 px-2 py-0.5 rounded-md border border-slate-100 backdrop-blur-sm shadow-sm">
                                  <EnvironmentOutlined className={active ? 'text-emerald-500' : 'text-slate-400'} />
                                  <span className="mono">{item.locationCode}</span>
                                </div>
                              </>
                            ) : (
                              <div className="flex items-center gap-1.5 text-slate-500 bg-white/60 px-2 py-0.5 rounded-md border border-slate-100 backdrop-blur-sm shadow-sm">
                                <BoxPlotOutlined className={active ? 'text-purple-500' : 'text-slate-400'} />
                                <span>Tồn tổng hợp</span>
                              </div>
                            )}
                          </div>
                        </StaggerItem>
                      );
                    })}
                  </StaggerList>
                )}
              </div>
              {/* Phân trang */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-4 py-3">
                  <Button size="small" disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="rounded-lg font-medium">
                    Trang trước
                  </Button>
                  <span className="text-xs font-semibold text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">
                    {page + 1} / {totalPages}
                  </span>
                  <Button size="small" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)} className="rounded-lg font-medium">
                    Trang sau
                  </Button>
                </div>
              )}
            </div>

            {/* Panel chi tiết sản phẩm đang chọn */}
            <div className="flex flex-col">
              {!selected ? (
                <div className="flex-1 rounded-2xl border border-slate-200 bg-white flex items-center justify-center p-8 shadow-sm">
                  <TableEmptyState message="Vui lòng chọn một dòng tồn kho để xem chi tiết" />
                </div>
              ) : (
                <div className="flex-1 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
                  {/* Header Detail */}
                  <div className="bg-gradient-to-br from-slate-800 to-slate-900 px-8 py-8 text-white relative overflow-hidden">
                    <div className="absolute right-0 top-0 opacity-10 transform translate-x-1/4 -translate-y-1/4">
                      <BoxPlotOutlined style={{ fontSize: '180px' }} />
                    </div>
                    <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold tracking-widest uppercase text-blue-200 backdrop-blur-md border border-white/10">
                          Mã SP: <span className="mono text-white">{selected.productCode}</span>
                        </div>
                        <h2 className="m-0 mt-1 text-2xl lg:text-3xl font-extrabold tracking-tight text-white leading-tight">
                          {selected.productName}
                        </h2>
                      </div>
                      <Button type="primary" size="large" className="rounded-xl font-semibold bg-blue-500 hover:bg-blue-400 border-none shadow-lg shadow-blue-500/30" icon={<HistoryOutlined />} onClick={() => navigate(`/stock-card?productId=${selected.productId}`)}>
                        Xem Thẻ kho
                      </Button>
                    </div>
                  </div>

                  {/* Body Detail */}
                  <div className="p-8 flex-1 bg-slate-50/30">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                      
                      {/* Quantity Highlight */}
                      <div className="col-span-1 md:col-span-2 bg-white border border-blue-100 rounded-2xl p-6 shadow-sm relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-transparent opacity-50"></div>
                        <div className="relative z-10 flex items-center justify-between">
                          <div>
                            <div className="text-[11px] font-bold uppercase tracking-widest text-blue-400 mb-1">Hiện có trong kho</div>
                            <div className="flex items-baseline gap-2">
                              <span className="mono text-5xl font-black text-blue-600 tracking-tighter">{formatNumber(selected.quantity)}</span>
                              <span className="text-sm font-semibold text-slate-400">đơn vị</span>
                            </div>
                          </div>
                          <div className="h-16 w-16 rounded-full bg-blue-100/50 flex items-center justify-center text-blue-500 text-3xl group-hover:scale-110 transition-transform duration-500">
                            <DatabaseOutlined />
                          </div>
                        </div>
                      </div>

                      {/* Info Cards */}
                      {viewMode === 'detailed' ? (
                        <>
                          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center text-lg"><EnvironmentOutlined /></div>
                              <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Vị trí lưu trữ</div>
                            </div>
                            <div className="mono text-lg font-bold text-slate-800">{selected.locationCode}</div>
                            <div className="mt-1 text-[13px] text-slate-500 font-medium">Kho: {selected.warehouseCode}</div>
                          </div>

                          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center text-lg"><BarcodeOutlined /></div>
                              <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Lô hàng</div>
                            </div>
                            <div className="mono text-lg font-bold text-slate-800">{selected.lotCode}</div>
                            <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                              ID Hệ thống: {selected.lotId}
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="col-span-1 md:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col items-center justify-center text-center text-slate-500 min-h-[120px]">
                          <BoxPlotOutlined className="text-3xl text-slate-300 mb-2" />
                          <span className="text-sm">Đang xem ở chế độ Tồn sản phẩm. Chọn "Tồn lô" để xem tồn chi tiết theo lô và vị trí.</span>
                        </div>
                      )}

                      <div className="col-span-1 md:col-span-2 mt-2 flex items-center justify-center gap-2 text-xs font-medium text-slate-400">
                        <ClockCircleOutlined />
                        Dữ liệu cập nhật lần cuối vào lúc {formatDate(selected.updatedAt, 'HH:mm - DD/MM/YYYY')}
                      </div>

                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </FadeSection>
      )}
    </>
  );
}
