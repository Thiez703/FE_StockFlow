import { useMemo, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Button, App } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import DocCode from '@/components/ui/DocCode';
import TableEmptyState from '@/components/ui/TableEmptyState';
import FadeSection from '@/components/ui/FadeSection';
import { transferApi } from '@/api/transfers';
import { formatDate } from '@/utils/date';
import { DEFAULT_WAREHOUSE_ID } from '@/constants/warehouse';
import { usePermissions } from '@/hooks/usePermissions';

const PAGE_SIZE = 10;

export default function TransfersPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const { canCreateTransfer } = usePermissions();

  const { data, isLoading } = useQuery({
    queryKey: ['transfers', page],
    queryFn: () => transferApi.getAll({ warehouseId: DEFAULT_WAREHOUSE_ID, page, size: PAGE_SIZE, sort: 'createdAt,desc' }),
    placeholderData: keepPreviousData,
  });

  const rows = data?.content ?? [];
  const total = data?.totalElements ?? 0;

  const columns = [
    {
      title: 'Mã phiếu',
      dataIndex: 'code',
      width: 140,
      render: (c) => <DocCode>{c}</DocCode>,
    },
    {
      title: 'Người tạo',
      dataIndex: 'createdByName',
      width: 180,
    },
    {
      title: 'Ghi chú',
      dataIndex: 'note',
      ellipsis: true,
      render: (v) => v || <span className="text-slate-400">—</span>,
    },
    {
      title: 'Số dòng',
      dataIndex: 'details',
      width: 100,
      align: 'center',
      render: (d) => d?.length ?? 0,
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      width: 160,
      render: (v) => formatDate(v),
    },
  ];

  const expandedRowRender = (record) => {
    const details = record.details ?? [];
    return (
      <div className="rounded-lg bg-slate-50/70 p-1">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-ink-sub">
              <th className="px-3 py-2 font-semibold">Sản phẩm</th>
              <th className="px-3 py-2 font-semibold">Lô</th>
              <th className="px-3 py-2 font-semibold">Từ vị trí</th>
              <th className="px-3 py-2 font-semibold">Đến vị trí</th>
              <th className="px-3 py-2 text-right font-semibold">Số lượng</th>
            </tr>
          </thead>
          <tbody>
            {details.map((d, i) => (
              <tr key={i} className="border-t border-slate-200/70">
                <td className="px-3 py-2 text-ink">{d.productName}</td>
                <td className="px-3 py-2"><DocCode muted>{d.lotCode}</DocCode></td>
                <td className="px-3 py-2"><DocCode muted>{d.fromLocationCode}</DocCode></td>
                <td className="px-3 py-2"><DocCode muted>{d.toLocationCode}</DocCode></td>
                <td className="px-3 py-2 text-right mono font-semibold">{d.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <>
      <PageHeader
        title="Điều chuyển vị trí"
        subtitle="Quản lý phiếu điều chuyển hàng giữa các vị trí trong kho"
        breadcrumb={[{ title: 'Kiểm soát' }, { title: 'Điều chuyển' }]}
        extra={
          canCreateTransfer && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/transfers/create')}>
              Tạo phiếu điều chuyển
            </Button>
          )
        }
      />

      <div className="mt-4">
        <FadeSection dataKey={rows.map((r) => r.id).join(',')}>
          <DataTable
            columns={columns}
            dataSource={rows}
            loading={isLoading}
            expandable={{ expandedRowRender }}
            pagination={{
              current: page + 1,
              pageSize: PAGE_SIZE,
              total,
              onChange: (p) => setPage(p - 1),
              showSizeChanger: false,
            }}
            locale={{ emptyText: <TableEmptyState message="Chưa có phiếu điều chuyển nào" /> }}
          />
        </FadeSection>
      </div>
    </>
  );
}
