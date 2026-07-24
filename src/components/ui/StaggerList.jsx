import { motion } from 'framer-motion';

// Dùng chung cho mọi danh sách dạng thẻ (không phải bảng) muốn hiệu ứng xuất hiện
// lần lượt từng dòng khi tải/lọc lại, thay vì hiện cứng cùng lúc.
const containerVariants = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const itemVariants = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

export function StaggerList({ as = 'ul', className, children }) {
  const Comp = motion[as] ?? motion.ul;
  return (
    <Comp variants={containerVariants} initial="hidden" animate="show" className={className}>
      {children}
    </Comp>
  );
}

export function StaggerItem({ as = 'li', className, onClick, children }) {
  const Comp = motion[as] ?? motion.li;
  return (
    <Comp variants={itemVariants} className={className} onClick={onClick}>
      {children}
    </Comp>
  );
}
