import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircleFilled } from '@ant-design/icons';
import Logo from '@/components/ui/Logo';
import WarehouseScene from '@/components/illustrations/WarehouseScene';

const HIGHLIGHTS = [
  'Theo dõi tồn kho theo thời gian thực',
  'Quản lý phiếu nhập / xuất chặt chẽ',
  'Báo cáo trực quan cho nhà phân phối',
];

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

/**
 * Layout cho các trang xác thực (đăng nhập, quên mật khẩu...).
 * Chia đôi màn hình: bảng thương hiệu (nền xanh, có minh hoạ kho vận động) bên
 * trái, nội dung form bên phải. Trên mobile chỉ hiện phần form.
 */
export default function AuthLayout() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Bảng thương hiệu — ẩn trên mobile */}
      <div className="relative hidden w-1/2 overflow-hidden bg-[linear-gradient(150deg,#0A1E3F_0%,#12356B_55%,#1E5AF0_120%)] lg:flex">
        {/* Quầng sáng nền — trôi chậm để nền không tĩnh */}
        <motion.div
          className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-white/10"
          animate={{ x: [0, 20, 0], y: [0, 15, 0], scale: [1, 1.08, 1] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-white/5"
          animate={{ x: [0, -15, 0], y: [0, -10, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Minh hoạ kho vận: kệ hàng float + xe nâng di chuyển + tia quét */}
        <WarehouseScene
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[52%] w-full opacity-90 mask-[linear-gradient(to_bottom,transparent,black_30%)]"
        />

        <motion.div
          className="relative z-10 flex flex-1 flex-col justify-between p-12 text-white"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={itemVariants} className="w-fit rounded-xl bg-white/10 px-3 py-2 backdrop-blur-sm">
            <Logo variant="dark" to={null} />
          </motion.div>

          <div className="max-w-md">
            <motion.h2 variants={itemVariants} className="text-3xl font-bold leading-snug">
              Hệ thống quản lý kho cho doanh nghiệp phân phối bia – nước giải khát.
            </motion.h2>
            <ul className="mt-8 space-y-4">
              {HIGHLIGHTS.map((text) => (
                <motion.li key={text} variants={itemVariants} className="flex items-center gap-3 text-[#c7d6f5]">
                  <CheckCircleFilled className="text-[#8fa8d8]" />
                  <span>{text}</span>
                </motion.li>
              ))}
            </ul>
          </div>

          <motion.p variants={itemVariants} className="text-sm text-[#8fa8d8]">
            © {new Date().getFullYear()} StockFlow. Bảo lưu mọi quyền.
          </motion.p>
        </motion.div>
      </div>

      {/* Vùng form */}
      <div className="flex flex-1 items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-[400px]">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
