import axiosClient from './axiosClient';

// Yêu cầu quyền ADMIN (@PreAuthorize ở backend).
//
// AuditLogResponse { id, actorEmail, actorFullName, action, entityType, entityId, detail, createdAt }
// Backend chưa ghi địa chỉ IP nên bảng nhật ký không có cột đó.
export const auditLogApi = {
  // Trả Page<T> của Spring. Lọc theo params: { userId, action, from, to, page, size, sort }
  // `from`/`to` là LocalDateTime dạng ISO, VD 2026-08-01T00:00:00.
  search: (params) => axiosClient.get('/audit-logs', { params }),
};
