import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert, Card, Form, Input, InputNumber, Select, Button, Empty, Spin, App, Popconfirm } from 'antd';
import { ArrowLeftOutlined, PlusOutlined, DeleteOutlined, CheckOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import PageHeader from '@/components/ui/PageHeader';
import VoucherResult from '@/components/ui/VoucherResult';
import AccessDenied from '@/components/feedback/AccessDenied';
import { usePermissions } from '@/hooks/usePermissions';
import { useInventorySnapshot } from '@/hooks/useInventorySnapshot';
import { toAbnormalRecord } from '@/features/abnormal-stocks/utils/mapAbnormalStock';
import { REASON_OPTIONS } from '@/features/abnormal-stocks/constants/reasonTypes';
import { abnormalStockApi } from '@/api/abnormalStocks';
import { DEFAULT_WAREHOUSE_ID } from '@/constants/warehouse';
import { getErrorMessage } from '@/utils/getErrorMessage';
import { formatNumber } from '@/utils/formatCurrency';
import { formatDate, TODAY } from '@/utils/date';
import { toVoucher } from '@/utils/voucher';

let rowSeq = 1;
const newRow = () => ({
  key: `r${rowSeq++}`,
  cellKey: undefined,
  quantity: 1,
  reasonType: undefined,
  note: '',
});

export default function AbnormalStockCreatePage() {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fullName = useSelector((state) => state.auth.user?.fullName);
  const { canCreateAbnormal } = usePermissions();

  // Chỉ ghi nhận được trên lô đang thực sự nằm ở một vị trí: backend nhận cặp
  // (lotId, locationId) chứ không nhận productId.
  // Không đủ quyền thì khỏi gọi, endpoint chắc chắn trả 403.
  const { cells, isLoading, isError, error, refetch } = useInventorySnapshot(undefined, {
    enabled: canCreateAbnormal,
  });

  const [rows, setRows] = useState([newRow()]);
  // Có giá trị => đã lưu, chuyển sang xem tờ biên bản server trả về.
  const [created, setCreated] = useState(null);

  const cellByKey = useMemo(() => new Map(cells.map((c) => [c.key, c])), [cells]);

  const cellOptions = useMemo(
    () =>
      cells.map((c) => ({
        value: c.key,
        label: `${c.locationCode} · ${c.lotCode} — ${c.productName} (tồn ${formatNumber(c.quantity)})`,
      })),
    [cells],
  );

  const patchRow = (key, patch) => setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const removeRow = (key) => setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.key !== key) : prev));

  const totalQty = rows.reduce((sum, r) => sum + (r.cellKey ? r.quantity || 0 : 0), 0);

  const { mutate: save, isPending: isSaving } = useMutation({
    mutationFn: (payload) => abnormalStockApi.create(payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['abnormal-stocks', DEFAULT_WAREHOUSE_ID] });
      setCreated(toAbnormalRecord(res));
      message.success('Đã lưu biên bản hàng bất thường, chờ duyệt');
      window.scrollTo({ top: 0 });
    },
    onError: (err) => message.error(getErrorMessage(err)),
  });

  const submit = () => {
    const filled = rows.filter((r) => r.cellKey);
    if (!filled.length) {
      message.error('Cần ghi nhận ít nhất 1 dòng hàng.');
      return;
    }
    if (filled.some((r) => !r.reasonType)) {
      message.error('Mỗi dòng phải chọn loại bất thường.');
      return;
    }
    if (filled.some((r) => !r.quantity || r.quantity < 1)) {
      message.error('Số lượng bất thường phải lớn hơn 0.');
      return;
    }

    save({
      warehouseId: DEFAULT_WAREHOUSE_ID,
      details: filled.map((r) => {
        const cell = cellByKey.get(r.cellKey);
        return {
          lotId: cell.lotId,
          locationId: cell.locationId,
          quantity: r.quantity,
          reasonType: r.reasonType,
          note: r.note.trim() || null,
        };
      }),
    });
  };

  const startNew = () => {
    setRows([newRow()]);
    setCreated(null);
    // Tồn đã đổi sau khi duyệt phiếu trước, lấy lại ảnh chụp mới.
    refetch();
  };

  // Đặt sau toàn bộ hook để không vi phạm rules-of-hooks.
  if (!canCreateAbnormal) return <AccessDenied />;

  if (created) {
    return (
      <>
        <div className="no-print">
          <PageHeader
            title="Biên bản hàng bất thường đã lập"
            breadcrumb={[
              { title: 'Kiểm soát' },
              { title: 'Hàng bất thường', href: '/abnormal-stocks' },
              { title: 'Kết quả' },
            ]}
          />
        </div>
        <VoucherResult
          voucher={toVoucher('abnormal', created)}
          title="Đã lưu biên bản hàng bất thường, chờ duyệt"
          onEdit={() => setCreated(null)}
          onNew={startNew}
          listPath="/abnormal-stocks"
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Lập biên bản hàng bất thường"
        subtitle="Ghi nhận hàng hư hỏng, mất, hết hạn theo từng lô tại từng vị trí"
        breadcrumb={[
          { title: 'Kiểm soát' },
          { title: 'Hàng bất thường', href: '/abnormal-stocks' },
          { title: 'Lập biên bản' },
        ]}
        extra={
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/abnormal-stocks')}>
            Quay lại
          </Button>
        }
      />

      {isError && (
        <Alert
          className="mb-4"
          type="error"
          showIcon
          message="Không tải được tồn kho hiện tại"
          // Spring trả 403 với body chỉ có chữ "Forbidden" — nói rõ nguyên nhân
          // để người dùng khỏi tưởng là lỗi mạng.
          description={
            error?.response?.status === 403
              ? 'Máy chủ chưa cho vai trò của bạn lập biên bản hàng bất thường. Hiện chỉ Quản lý kho, Kế toán và Nhân viên kho lập được.'
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
          className="border-hair"
          styles={{ header: { borderBottom: '1px solid #f1f5f9' } }}
        >
          <Form layout="vertical" component={false}>
            <div className="grid grid-cols-1 gap-x-5 sm:grid-cols-3">
              <Form.Item label="Ngày lập">
                <Input value={formatDate(TODAY)} readOnly variant="filled" className="mono" />
              </Form.Item>
              {/* Người lập lấy từ token ở backend, không sửa được tại đây. */}
              <Form.Item label="Người phát hiện / lập biên bản" className="!mb-0">
                <Input value={fullName ?? '—'} readOnly variant="filled" />
              </Form.Item>
            </div>
          </Form>
        </Card>

        <Card
          title="Chi tiết hàng bất thường"
          className="border-hair"
          styles={{ header: { borderBottom: '1px solid #f1f5f9' }, body: { padding: 0 } }}
          extra={
            <Button
              type="primary"
              ghost
              icon={<PlusOutlined />}
              disabled={!cells.length}
              onClick={() => setRows((p) => [...p, newRow()])}
            >
              Thêm dòng
            </Button>
          }
        >
          <div className="hidden grid-cols-12 gap-3 border-b border-slate-100 bg-slate-50/70 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-400 md:grid">
            <span className="col-span-4">Vị trí · Lô · Sản phẩm</span>
            <span className="col-span-2 text-right">Số lượng</span>
            <span className="col-span-2">Loại bất thường</span>
            <span className="col-span-3">Diễn giải</span>
            <span className="col-span-1" />
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Spin tip="Đang tải tồn kho hiện tại..." />
            </div>
          ) : !cells.length ? (
            <div className="py-10">
              <Empty description="Kho chưa có lô hàng nào để ghi nhận bất thường" />
            </div>
          ) : (
            rows.map((r) => {
              const cell = r.cellKey ? cellByKey.get(r.cellKey) : null;
              return (
                <div
                  key={r.key}
                  className="grid grid-cols-12 items-start gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0"
                >
                  <div className="col-span-12 md:col-span-4">
                    <span className="mb-1 block text-xs font-medium text-slate-400 md:hidden">
                      Vị trí · Lô · Sản phẩm
                    </span>
                    <Select
                      showSearch
                      optionFilterProp="label"
                      placeholder="Chọn vị trí đang chứa lô hàng"
                      options={cellOptions}
                      value={r.cellKey}
                      // Đổi vị trí thì kẹp lại số lượng cho khỏi vượt tồn ở ô mới.
                      onChange={(v) => {
                        const next = cellByKey.get(v);
                        patchRow(r.key, {
                          cellKey: v,
                          quantity: Math.min(r.quantity || 1, next?.quantity ?? 1),
                        });
                      }}
                      className="w-full"
                    />
                  </div>
                  <div className="col-span-6 md:col-span-2">
                    <span className="mb-1 block text-xs font-medium text-slate-400 md:hidden">Số lượng</span>
                    <InputNumber
                      min={1}
                      max={cell?.quantity ?? undefined}
                      value={r.quantity}
                      onChange={(v) => patchRow(r.key, { quantity: v ?? 1 })}
                      className="w-full"
                      disabled={!cell}
                    />
                    {cell && (
                      <div className="mt-1 text-right text-xs text-ink-sub">
                        Tồn: {formatNumber(cell.quantity)}
                      </div>
                    )}
                  </div>
                  <div className="col-span-6 md:col-span-2">
                    <span className="mb-1 block text-xs font-medium text-slate-400 md:hidden">Loại bất thường</span>
                    <Select
                      placeholder="Chọn loại"
                      options={REASON_OPTIONS}
                      value={r.reasonType}
                      onChange={(v) => patchRow(r.key, { reasonType: v })}
                      className="w-full"
                    />
                  </div>
                  <div className="col-span-10 md:col-span-3">
                    <span className="mb-1 block text-xs font-medium text-slate-400 md:hidden">Diễn giải</span>
                    <Input
                      placeholder="VD: Thùng bị móp khi bốc dỡ"
                      value={r.note}
                      onChange={(e) => patchRow(r.key, { note: e.target.value })}
                    />
                  </div>
                  <div className="col-span-2 flex justify-end md:col-span-1">
                    <Popconfirm
                      title="Xóa dòng này?"
                      description="Xác nhận xóa dòng khỏi biên bản?"
                      onConfirm={() => removeRow(r.key)}
                      okText="Xóa"
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
            <span className="text-sm text-ink-sub">Tổng số lượng bất thường</span>
            <span className="mono font-semibold text-[#b91c1c]">{formatNumber(totalQty)}</span>
          </div>
        </Card>

        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end">
          <span className="text-center text-xs text-slate-400 sm:mr-auto sm:text-left">
            Tồn kho chỉ bị trừ sau khi biên bản được duyệt.
          </span>
          <Popconfirm
            title="Lưu biên bản?"
            description="Biên bản sẽ được gửi đi chờ duyệt."
            onConfirm={submit}
            okText="Xác nhận"
            cancelText="Hủy"
            disabled={!cells.length}
          >
            <Button
              type="primary"
              size="large"
              icon={<CheckOutlined />}
              loading={isSaving}
              disabled={!cells.length}
            >
              Lưu biên bản
            </Button>
          </Popconfirm>
        </div>
      </div>
    </>
  );
}
