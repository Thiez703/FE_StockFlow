import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Card,
  Form,
  Input,
  InputNumber,
  Button,
  Empty,
  Spin,
  Checkbox,
  App,
  Popconfirm,
} from 'antd';
import { ArrowLeftOutlined, DeleteOutlined, CheckOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { useIsMobile } from '@/hooks/useIsMobile';
import MobileQuantityInput from '@/components/ui/MobileQuantityInput';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import PageHeader from '@/components/ui/PageHeader';
import DocCode from '@/components/ui/DocCode';
import VoucherResult from '@/components/ui/VoucherResult';
import AccessDenied from '@/components/feedback/AccessDenied';
import { usePermissions } from '@/hooks/usePermissions';
import { useInventorySnapshot } from '@/hooks/useInventorySnapshot';
import { toStocktakeRecord } from '@/features/stocktakes/utils/mapStocktake';
import { stocktakeApi } from '@/api/stocktakes';
import { DEFAULT_WAREHOUSE_ID } from '@/constants/warehouse';
import { getErrorMessage } from '@/utils/getErrorMessage';
import { formatNumber } from '@/utils/formatCurrency';
import { formatDate, today } from '@/utils/date';
import { toVoucher } from '@/utils/voucher';

const DRAFT_STORAGE_KEY = 'stockflow.stocktake.draft';

function saveDraft(counts, excluded, note, damagedCounts, notes) {
  try {
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({ counts, excluded, note, damagedCounts, notes, savedAt: Date.now() }));
  } catch { /* quota exceeded — không chặn UX */ }
}

function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    // Bỏ draft quá 24 giờ
    if (Date.now() - data.savedAt > 24 * 60 * 60 * 1000) {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      return null;
    }
    return data;
  } catch { return null; }
}

function clearDraft() {
  localStorage.removeItem(DRAFT_STORAGE_KEY);
}

export default function StocktakeCreatePage() {
  const isMobile = useIsMobile();
  const { message } = App.useApp();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fullName = useSelector((state) => state.auth.user?.fullName);
  const { canCreateStocktake } = usePermissions();

  const { cells, isLoading, isError, error, isFetching, refetch } = useInventorySnapshot(undefined, {
    enabled: canCreateStocktake,
  });

  const location = useLocation();
  const inherited = location.state?.inheritFrom;

  // Load draft từ localStorage nếu có (ưu tiên inherited từ navigation state)
  const draft = useMemo(() => (inherited ? null : loadDraft()), [inherited]);

  const [note, setNote] = useState(() => draft?.note || inherited?.note || '');
  const [keyword, setKeyword] = useState('');
  const [counts, setCounts] = useState(() => {
    if (inherited?.items) {
      const init = {};
      inherited.items.forEach((d) => { init[`${d.lotId}-${d.locationId}`] = d.actualQty; });
      return init;
    }
    return draft?.counts || {};
  });
  const [damagedCounts, setDamagedCounts] = useState(() => draft?.damagedCounts || {});
  const [notes, setNotes] = useState(() => draft?.notes || {});
  const [excluded, setExcluded] = useState(() => draft?.excluded || []);
  const [created, setCreated] = useState(null);

  // Mobile: track dòng đang focus để auto-advance
  const [activeRowIdx, setActiveRowIdx] = useState(0);
  const activeRowRef = useRef(null);

  // Auto-save draft khi counts/excluded/note thay đổi
  useEffect(() => {
    if (Object.keys(counts).length > 0 || excluded.length > 0) {
      saveDraft(counts, excluded, note, damagedCounts, notes);
    }
  }, [counts, excluded, note, damagedCounts, notes]);

  const countOf = (cell) => counts[cell.key];

  const rows = useMemo(
    () => cells.filter((c) => !excluded.includes(c.key)),
    [cells, excluded],
  );

  const visibleRows = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return rows.filter((c) => {
      const okKw =
        !kw ||
        [c.productName, c.productCode, c.lotCode, c.locationCode].some((v) =>
          String(v ?? '').toLowerCase().includes(kw),
        );
      return okKw;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, keyword, counts]);

  const { mutate: save, isPending: isSaving } = useMutation({
    mutationFn: (payload) => stocktakeApi.create(payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['stocktakes', DEFAULT_WAREHOUSE_ID] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'storage-map'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setCreated(toStocktakeRecord(res));
      clearDraft();
      if (res.status === 'APPROVED') {
        message.success('Đã lưu và tự động duyệt biên bản kiểm kê');
      } else {
        message.success('Đã lưu biên bản kiểm kê, chờ duyệt');
      }
      window.scrollTo({ top: 0 });
    },
    onError: (err) => message.error(getErrorMessage(err)),
  });

  const countedCount = rows.filter((c) => counts[c.key] !== undefined).length;

  const submit = () => {
    if (!rows.length) {
      message.error('Cần kiểm kê ít nhất 1 vị trí.');
      return;
    }
    save({
      warehouseId: DEFAULT_WAREHOUSE_ID,
      note: note.trim() || null,
      details: rows.map((c) => ({
        lotId: c.lotId,
        locationId: c.locationId,
        actualQty: countOf(c) ?? null,
        damagedQty: damagedCounts[c.key] ?? 0,
        note: notes[c.key]?.trim() || null,
      })),
    });
  };

  const startNew = () => {
    setNote('');
    setCounts({});
    setDamagedCounts({});
    setNotes({});
    setExcluded([]);
    setCreated(null);
    clearDraft();
    refetch();
  };

  // Đặt sau toàn bộ hook để không vi phạm rules-of-hooks.
  if (!canCreateStocktake) return <AccessDenied />;

  if (created) {
    return (
      <>
        <div className="no-print">
          <PageHeader
            title="Biên bản kiểm kê đã lập"
            breadcrumb={[{ title: 'Kiểm soát' }, { title: 'Kiểm kê', href: '/stocktakes' }, { title: 'Kết quả' }]}
          />
        </div>
        <VoucherResult
          voucher={toVoucher('stocktake', created)}
          title="Đã lưu biên bản kiểm kê, chờ duyệt"
          onNew={startNew}
          listPath="/stocktakes"
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Lập biên bản kiểm kê"
        subtitle="Nhập số đếm thực tế theo từng vị trí, hệ thống tự tính chênh lệch"
        breadcrumb={[{ title: 'Kiểm soát' }, { title: 'Kiểm kê', href: '/stocktakes' }, { title: 'Lập phiếu' }]}
        extra={
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/stocktakes')}>
            Quay lại
          </Button>
        }
      />

      {isError && (
        <Alert
          className="mb-4"
          type="error"
          showIcon
          message="Không tải được tồn kho ban đầu"
          // Spring trả 403 với body chỉ có chữ "Forbidden" — nói rõ nguyên nhân
          // để người dùng khỏi tưởng là lỗi mạng.
          description={
            error?.response?.status === 403
              ? 'Máy chủ chưa cho vai trò của bạn lập biên bản kiểm kê. Hiện chỉ Quản lý kho, Kế toán và Nhân viên kho lập được.'
              : getErrorMessage(error)
          }
          action={
            <Button size="small" onClick={() => refetch()}>
              Thử lại
            </Button>
          }
        />
      )}

      <div className="flex flex-col gap-4">
        <Card
          title="Thông tin chung"
          className="border-hair border-t-4 border-t-indigo-500"
          styles={{ header: { borderBottom: '1px solid #f1f5f9' } }}
        >
          <Form layout="vertical" component={false}>
            <div className="grid grid-cols-1 gap-x-5 sm:grid-cols-2">

              <Form.Item label="Ngày kiểm kê">
                <Input value={formatDate(today())} readOnly variant="filled" className="mono" />
              </Form.Item>
              {/* Người kiểm lấy từ token ở backend, không sửa được tại đây. */}
              <Form.Item label="Người kiểm">
                <Input value={fullName ?? '—'} readOnly variant="filled" />
              </Form.Item>
              <Form.Item label="Lý do / phạm vi kiểm kê" className="!mb-0">
                <Input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="VD: Kiểm kê định kỳ quý III khu A"
                />
              </Form.Item>
            </div>
          </Form>
        </Card>

        <Card
          title="Bảng đếm thực tế"
          className="border-hair"
          styles={{ header: { borderBottom: '1px solid #f1f5f9' }, body: { padding: 0 } }}
          extra={
            <div className="flex flex-wrap items-center gap-3">
              <Input
                allowClear
                size="small"
                prefix={<SearchOutlined className="text-slate-400" />}
                placeholder="Tìm sản phẩm, lô, vị trí..."
                className="w-full sm:w-56"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
          }
        >
          <div className="hidden grid-cols-[2.5fr_1.5fr_1fr_1.2fr_1fr_2fr_auto] gap-3 border-b border-slate-100 bg-slate-50/70 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-400 md:grid">
            <span>Sản phẩm</span>
            <span>Lô</span>
            <span>Vị trí</span>
            <span className="text-right whitespace-nowrap">Số lượng thực tế</span>
            <span className="text-center">Hư hỏng</span>
            <span>Ghi chú</span>
            <span className="w-8"></span>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Spin tip="Đang tải tồn kho ban đầu..." />
            </div>
          ) : visibleRows.length === 0 ? (
            <div className="py-10">
              <Empty
                description={
                  rows.length === 0
                    ? 'Kho chưa có lô hàng nào để kiểm kê'
                    : 'Không có dòng nào khớp bộ lọc'
                }
              />
            </div>
          ) : isMobile ? (
            /* ─── MOBILE: card-based counting with auto-advance ─── */
            <div className="flex flex-col gap-3 p-3">
              {/* Progress indicator */}
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs">
                <span className="text-ink-sub">Tiến độ</span>
                <span className="font-bold text-ink">
                  {Object.keys(counts).length} / {visibleRows.length} đã đếm
                </span>
              </div>

              {visibleRows.map((c, idx) => {
                const counted = countOf(c);
                const isActive = idx === activeRowIdx;

                return (
                  <div
                    key={c.key}
                    ref={isActive ? activeRowRef : undefined}
                    className={`rounded-xl border-2 p-3 transition-colors ${
                      isActive ? 'border-royal bg-blue-50/30' : 'border-hair bg-white'
                    }`}
                    onClick={() => setActiveRowIdx(idx)}
                  >
                    {/* Product info */}
                    <div className="mb-2">
                      <div className="text-sm font-bold text-ink">{c.productName}</div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-ink-sub mt-0.5">
                        <span className="mono">{c.productCode}</span>
                        <span>· Lô: <strong>{c.lotCode || c.lot || 'N/A'}</strong></span>
                        <span>· {c.locationCode}</span>
                      </div>
                    </div>

                    {/* count input */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="text-[10px] font-semibold text-slate-400 uppercase mb-1">Số lượng thực tế</div>
                        <MobileQuantityInput
                          value={counted}
                          onChange={(v) => {
                            setCounts((prev) => ({ ...prev, [c.key]: v ?? undefined }));
                            if (idx < visibleRows.length - 1) {
                              setTimeout(() => {
                                setActiveRowIdx(idx + 1);
                                activeRowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              }, 300);
                            }
                          }}
                          min={0}
                        />
                      </div>
                    </div>

                    {/* Damaged qty + note */}
                    <div className="mt-2 flex items-center gap-3">
                      <div className="w-24 shrink-0">
                        <div className="text-[10px] font-semibold text-slate-400 uppercase mb-1">Hư hỏng</div>
                        <InputNumber
                          min={0}
                          max={counted}
                          value={damagedCounts[c.key] ?? 0}
                          onChange={(v) => setDamagedCounts((prev) => ({ ...prev, [c.key]: v ?? 0 }))}
                          className="w-full"
                          size="small"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="text-[10px] font-semibold text-slate-400 uppercase mb-1">Ghi chú</div>
                        <Input
                          size="small"
                          placeholder="Ghi chú..."
                          value={notes[c.key] ?? ''}
                          onChange={(e) => setNotes((prev) => ({ ...prev, [c.key]: e.target.value }))}
                        />
                      </div>
                    </div>

                    {/* Remove button */}
                    <div className="mt-2 flex justify-end">
                      <Button
                        type="text"
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={(e) => { e.stopPropagation(); setExcluded((prev) => [...prev, c.key]); }}
                        className="min-h-[44px]"
                      >
                        Bỏ qua
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* ─── DESKTOP: original grid layout ─── */
            visibleRows.map((c) => {
              const counted = countOf(c);
              const damaged = damagedCounts[c.key] ?? 0;
              return (
                <div
                  key={c.key}
                  className="grid grid-cols-[2.5fr_1.5fr_1fr_1.2fr_1fr_2fr_auto] items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0"
                >
                  <div>
                    <div className="font-medium text-ink">{c.productName}</div>
                    <div className="text-xs text-ink-sub">
                      {c.productCode}
                      {' — Thùng'}
                    </div>
                  </div>
                  <div>
                    <DocCode muted>{c.lotCode}</DocCode>
                  </div>
                  <div>
                    <span className="mono text-ink-sub">{c.locationCode}</span>
                  </div>
                  <div>
                    <InputNumber
                      min={0}
                      value={counted}
                      onChange={(v) => setCounts((prev) => ({ ...prev, [c.key]: v ?? undefined }))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <InputNumber
                      min={0}
                      max={counted}
                      value={damaged}
                      onChange={(v) => setDamagedCounts((prev) => ({ ...prev, [c.key]: v ?? 0 }))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <Input
                      size="small"
                      placeholder="Ghi chú..."
                      value={notes[c.key] ?? ''}
                      onChange={(e) => setNotes((prev) => ({ ...prev, [c.key]: e.target.value }))}
                    />
                  </div>
                  <div className="flex items-center justify-end">
                    <Popconfirm
                      title="Bỏ dòng này?"
                      description="Vị trí này sẽ không nằm trong biên bản kiểm kê."
                      onConfirm={() => setExcluded((prev) => [...prev, c.key])}
                      okText="Bỏ"
                      cancelText="Hủy"
                      okButtonProps={{ danger: true }}
                    >
                      <Button type="text" danger size="small" icon={<DeleteOutlined />} />
                    </Popconfirm>
                  </div>
                </div>
              );
            })
          )}

          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
            <span className="text-sm text-ink-sub">
              {countedCount}/{rows.length} vị trí đã đếm
              {excluded.length > 0 && `, ${excluded.length} vị trí đã bỏ`}
            </span>
          </div>
        </Card>

        {/* Action bar — sticky bottom */}
        <div className={`sticky bottom-0 z-10 border-t border-slate-200 bg-white/95 backdrop-blur-sm shadow-[0_-4px_12px_rgba(0,0,0,0.05)] py-4 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3 ${isMobile ? 'px-2' : 'px-1'}`}>
          <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-3 ml-2">
            {!isMobile && (
              <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-bold bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200 uppercase tracking-wide w-fit">
                <span className="relative flex h-2 w-2 mr-1">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
                Đang lập kiểm kê
              </span>
            )}
            <div className="text-center text-xs text-slate-400 sm:text-left">
              {excluded.length > 0 && (
                <Button type="link" size="small" className="!px-0" onClick={() => setExcluded([])}>
                  Khôi phục {excluded.length} vị trí đã bỏ
                </Button>
              )}
            </div>
          </div>
          <Button size="large" onClick={() => navigate('/stocktakes')} className="order-2 sm:order-none">
            Hủy
          </Button>
          <Popconfirm
            title={<span className="font-bold text-indigo-700 uppercase">LƯU BIÊN BẢN KIỂM KÊ?</span>}
            description={
              countedCount < rows.length
                ? `Còn ${rows.length - countedCount} vị trí chưa kiểm. Phiếu vẫn sẽ được lưu, các lô chưa kiểm sẽ hiển thị là chưa kiểm tra số lượng. Bạn chắc chắn muốn lưu?`
                : "Biên bản sẽ được gửi đi chờ duyệt."
            }
            onConfirm={submit}
            okText="Xác nhận"
            cancelText="Hủy"
            disabled={!rows.length}
            okButtonProps={{ className: '!bg-indigo-600 hover:!bg-indigo-500' }}
          >
            <Button 
              type="primary" 
              size="large" 
              icon={<CheckOutlined />} 
              loading={isSaving} 
              disabled={!rows.length}
              className="min-w-[180px] font-bold rounded-xl shadow-indigo-500/20 shadow-lg !bg-indigo-600 hover:!bg-indigo-500 !border-none order-1 sm:order-none"
            >
              Lưu biên bản kiểm kê
            </Button>
          </Popconfirm>
        </div>
      </div>
    </>
  );
}
