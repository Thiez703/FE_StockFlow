import { motion } from 'framer-motion';

// Toạ độ 2 hàng hộp trên mỗi kệ (dùng chung cho cả 2 giá kệ trái/phải).
const BOX_ROWS = [
  { shelfY: 80, boxes: [6, 44, 82] },
  { shelfY: 124, boxes: [6, 44, 82] },
];

function ShelfRack({ originX, delayOffset = 0 }) {
  return (
    <g transform={`translate(${originX}, 0)`}>
      {/* Chân kệ */}
      <line x1="0" y1="40" x2="0" y2="150" stroke="#ffffff" strokeOpacity="0.18" strokeWidth="2" />
      <line x1="120" y1="40" x2="120" y2="150" stroke="#ffffff" strokeOpacity="0.18" strokeWidth="2" />
      {/* Thanh kệ */}
      <line x1="0" y1="80" x2="120" y2="80" stroke="#ffffff" strokeOpacity="0.25" strokeWidth="2.5" />
      <line x1="0" y1="124" x2="120" y2="124" stroke="#ffffff" strokeOpacity="0.25" strokeWidth="2.5" />

      {/* Hộp hàng — mỗi hộp float lên xuống độc lập, so le theo delay */}
      {BOX_ROWS.map((row, rowIdx) =>
        row.boxes.map((boxX, boxIdx) => {
          const delay = delayOffset + rowIdx * 0.4 + boxIdx * 0.25;
          return (
            <motion.g
              key={`${rowIdx}-${boxIdx}`}
              initial={{ y: 0 }}
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut', delay }}
            >
              <rect
                x={boxX}
                y={row.shelfY - 26}
                width="30"
                height="26"
                rx="3"
                fill="#ffffff"
                fillOpacity="0.09"
                stroke="#ffffff"
                strokeOpacity="0.25"
              />
            </motion.g>
          );
        }),
      )}
    </g>
  );
}

function Forklift() {
  return (
    <motion.g
      initial={{ x: -10 }}
      animate={{ x: [-10, 300, -10] }}
      transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
    >
      <g transform="translate(20, 128)">
        {/* Càng nâng + kiện hàng */}
        <rect x="-14" y="6" width="16" height="3" fill="#F59E0B" fillOpacity="0.8" />
        <rect x="-14" y="14" width="16" height="3" fill="#F59E0B" fillOpacity="0.8" />
        <rect x="-16" y="-16" width="4" height="34" fill="#F59E0B" fillOpacity="0.6" />
        <rect x="-13" y="-8" width="14" height="14" rx="2" fill="#F59E0B" fillOpacity="0.85" />
        {/* Thân xe nâng */}
        <rect x="0" y="0" width="26" height="18" rx="3" fill="#8fa8d8" fillOpacity="0.9" />
        <rect x="4" y="-14" width="14" height="16" rx="2" fill="#8fa8d8" fillOpacity="0.7" />
        {/* Bánh xe */}
        <circle cx="6" cy="20" r="4" fill="#0A1E3F" />
        <circle cx="20" cy="20" r="4" fill="#0A1E3F" />
      </g>
    </motion.g>
  );
}

/**
 * Minh hoạ kho vận động (giá kệ + hộp hàng float + xe nâng di chuyển + tia quét
 * theo dõi thời gian thực) cho bảng thương hiệu của AuthLayout. Thuần SVG +
 * framer-motion, không phụ thuộc ảnh ngoài.
 */
export default function WarehouseScene({ className = '' }) {
  return (
    <svg
      viewBox="0 0 400 190"
      preserveAspectRatio="xMidYMax slice"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="scanBeam" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#8fa8d8" stopOpacity="0" />
          <stop offset="50%" stopColor="#8fa8d8" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#8fa8d8" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Sàn kho */}
      <line x1="10" y1="150" x2="390" y2="150" stroke="#ffffff" strokeOpacity="0.15" strokeWidth="1.5" />

      <ShelfRack originX={30} delayOffset={0} />
      <ShelfRack originX={250} delayOffset={0.6} />

      {/* Tia quét — gợi ý theo dõi tồn kho thời gian thực */}
      <motion.rect
        y="40"
        width="50"
        height="112"
        fill="url(#scanBeam)"
        initial={{ x: -50 }}
        animate={{ x: [-50, 400] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'linear', repeatDelay: 2.5 }}
      />

      <Forklift />
    </svg>
  );
}
