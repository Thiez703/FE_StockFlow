import { InboxOutlined } from '@ant-design/icons';

/**
 * Nội dung rỗng dùng chung cho `DataTable` khi bộ lọc không khớp dòng nào.
 */
export default function TableEmptyState({ message }) {
  return (
    <div className="flex flex-col items-center gap-3 py-10">
      <InboxOutlined className="text-3xl text-slate-300" />
      <p className="m-0 text-sm text-ink-sub">{message}</p>
    </div>
  );
}
