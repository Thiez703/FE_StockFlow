import { Table } from 'antd';

/**
 * Bảng dữ liệu enterprise dùng chung: header dính (sticky), sọc chẵn/lẻ tinh tế,
 * hover nổi nhẹ (định nghĩa ở index.css qua class .enterprise-table), phân trang dưới.
 * Truyền thẳng mọi prop của AntD Table; cột số nên đặt align="right" tại trang.
 */
export default function DataTable({ className = '', pagination, scroll, ...props }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-hair bg-white">
      <Table
        size="middle"
        sticky
        rowKey="id"
        className={`enterprise-table ${className}`}
        scroll={scroll ?? { x: 'max-content' }}
        pagination={
          pagination === false
            ? false
            : {
                pageSize: 8,
                showSizeChanger: false,
                showTotal: (total) => `${total} bản ghi`,
                ...pagination,
              }
        }
        {...props}
      />
    </div>
  );
}
