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
import AbnormalLineItemsTable from '@/features/abnormal-stocks/components/AbnormalLineItemsTable';
import { abnormalStockApi } from '@/api/abnormalStocks';
import { DEFAULT_WAREHOUSE_ID } from '@/constants/warehouse';
import { getErrorMessage } from '@/utils/getErrorMessage';
import { formatNumber } from '@/utils/formatCurrency';
import { formatDate, today } from '@/utils/date';
import { toVoucher } from '@/utils/voucher';
import { useIsMobile } from '@/hooks/useIsMobile';

const newRow = () => ({
  key: Math.random().toString(36).slice(2, 9),
  cellKey: undefined,
  quantity: 1,
  reasonType: undefined,
  note: '',
});

export default function AbnormalStockCreatePage() {
  const isMobile = useIsMobile();
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

  const patchRow = (key, patch) => setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const removeRow = (key) => setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.key !== key) : prev));

  const { mutate: save, isPending: isSaving } = useMutation({
    mutationFn: (payload) => abnormalStockApi.create(payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['abnormal-stocks', DEFAULT_WAREHOUSE_ID] });
      if (res.status === 'APPROVED') {
        queryClient.invalidateQueries({ queryKey: ['dashboard', 'storage-map'] });
        queryClient.invalidateQueries({ queryKey: ['inventory'] });
        queryClient.invalidateQueries({ queryKey: ['inventory-snapshot'] });
        message.success('Đã lưu và tự động duyệt biên bản hàng bất thường');
      } else {
        message.success('Đã lưu biên bản hàng bất thường, chờ duyệt');
      }
      setCreated(toAbnormalRecord(res));
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
          className="border-hair border-t-4 border-t-rose-500"
          styles={{ header: { borderBottom: '1px solid #f1f5f9' } }}
        >
          <Form layout="vertical" component={false}>
            <div className="grid grid-cols-1 gap-x-5 sm:grid-cols-3">
              <Form.Item label="Ngày lập">
                <Input value={formatDate(today())} readOnly variant="filled" className="mono" />
              </Form.Item>
              {/* Người lập lấy từ token ở backend, không sửa được tại đây. */}
              <Form.Item label="Người phát hiện / lập biên bản" className="!mb-0">
                <Input value={fullName ?? '—'} readOnly variant="filled" />
              </Form.Item>
            </div>
          </Form>
        </Card>

        <AbnormalLineItemsTable
          rows={rows}
          cells={cells}
          cellByKey={cellByKey}
          isLoading={isLoading}
          onPatchRow={patchRow}
          onAddRow={() => setRows((p) => [...p, newRow()])}
          onRemoveRow={removeRow}
        />

        {/* Action bar — sticky bottom */}
        <div className={`sticky bottom-0 z-10 border-t border-slate-200 bg-white/95 backdrop-blur-sm shadow-[0_-4px_12px_rgba(0,0,0,0.05)] py-4 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3 ${isMobile ? 'px-2' : 'px-1'}`}>
          <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-3 ml-2">
            {!isMobile && (
              <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-bold bg-rose-50 text-rose-700 ring-1 ring-rose-200 uppercase tracking-wide">
                <span className="relative flex h-2 w-2 mr-1">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                </span>
                Đang lập bất thường
              </span>
            )}
            <div className="text-center text-xs text-slate-400 sm:text-left">
              Tồn kho chỉ bị trừ sau khi biên bản được duyệt.
            </div>
          </div>
          <Button size="large" onClick={() => navigate('/abnormal-stocks')} className="order-2 sm:order-none">
            Hủy
          </Button>
          <Popconfirm
            title={<span className="font-bold text-rose-700 uppercase">LƯU BIÊN BẢN HÀNG BẤT THƯỜNG?</span>}
            description="Biên bản sẽ được gửi đi chờ duyệt."
            onConfirm={submit}
            okText="Xác nhận"
            cancelText="Hủy"
            disabled={!cells.length}
            okButtonProps={{ className: '!bg-rose-600 hover:!bg-rose-500' }}
          >
            <Button
              type="primary"
              size="large"
              icon={<CheckOutlined />}
              loading={isSaving}
              disabled={!cells.length}
              className="min-w-[180px] font-bold rounded-xl shadow-rose-500/20 shadow-lg !bg-rose-600 hover:!bg-rose-500 !border-none order-1 sm:order-none"
            >
              Lưu biên bản
            </Button>
          </Popconfirm>
        </div>
      </div>
    </>
  );
}
