import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueries } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { motion, animate } from 'framer-motion';
import dayjs from 'dayjs';

import PageHeader from '@/components/ui/PageHeader';
import { reportApi } from '@/api/reports';
import { stocktakeApi } from '@/api/stocktakes';
import { inventoryApi } from '@/api/inventory';
import { DEFAULT_WAREHOUSE_ID } from '@/constants/warehouse';
import { formatCurrency, formatNumber } from '@/utils/formatCurrency';


// Custom hook for animated numbers
function AnimatedNumber({ value }) {
  const nodeRef = React.useRef(null);
  
  React.useEffect(() => {
    const node = nodeRef.current;
    if (node) {
      const controls = animate(0, value, {
        duration: 1.5,
        onUpdate(v) {
          node.textContent = formatCurrency(Math.round(v)).replace('đ', '').trim();
        }
      });
      return () => controls.stop();
    }
  }, [value]);
  
  return <span ref={nodeRef}>{formatCurrency(0).replace('đ', '').trim()}</span>;
}

export default function AccountantDashboard() {
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);
  
  // Date range for current month
  const from = dayjs().startOf('month').toISOString();
  const to = dayjs().endOf('month').toISOString();

  // Fetch Data
  const { data: nxtData } = useQuery({
    queryKey: ['inventory-summary', from, to],
    queryFn: () => reportApi.getInventorySummary({ from, to, page: 0, size: 500 }),
  });

  const { data: varianceData } = useQuery({
    queryKey: ['stocktake-variance', from, to],
    queryFn: () => reportApi.getStocktakeVariance({ from, to, page: 0, size: 100 }),
  });

  const { data: stocktakesData } = useQuery({
    queryKey: ['pending-stocktakes'],
    queryFn: () => stocktakeApi.getAll(DEFAULT_WAREHOUSE_ID, { page: 0, size: 100, sort: 'createdAt,desc' }),
  });

  const { data: inventoryData } = useQuery({
    queryKey: ['inventory-all'],
    queryFn: () => inventoryApi.getAll({ page: 0, size: 500 }),
  });

  // Derived Data
  const { totalInventoryValue, totalInbound, totalOutbound, nxtList } = useMemo(() => {
    const list = nxtData?.content || [];
    let closingValue = 0;
    let inboundValue = 0;
    let outboundValue = 0;
    
    list.forEach(item => {
      closingValue += item.closingValue || 0;
      inboundValue += item.inboundValue || 0;
      outboundValue += item.outboundValue || 0;
    });

    return { totalInventoryValue: closingValue, totalInbound: inboundValue, totalOutbound: outboundValue, nxtList: list };
  }, [nxtData]);

  const varianceCount = varianceData?.totalElements || 0;

  // Generate last 6 months date ranges
  const past6Months = useMemo(() => {
    return Array.from({ length: 6 }).map((_, i) => {
      const m = dayjs().subtract(i, 'month');
      return { 
        start: m.startOf('month'), 
        end: m.endOf('month'),
        name: m.format('MM/YYYY')
      };
    }).reverse();
  }, []);

  // Fetch history for 6 months
  const historyQueries = useQueries({
    queries: past6Months.map(({ start, end }) => ({
      queryKey: ['inventory-summary', start.toISOString(), end.toISOString()],
      queryFn: () => reportApi.getInventorySummary({ 
        from: start.toISOString(), 
        to: end.toISOString(), 
        page: 0, 
        size: 500 
      }),
    }))
  });

  // For charts
  const monthlyData = useMemo(() => {
    return past6Months.map((m, i) => {
      const q = historyQueries[i];
      let inbound = 0;
      let outbound = 0;
      
      if (q.data?.content) {
        let totalValIn = 0;
        let totalValOut = 0;
        let totalQtyIn = 0;
        let totalQtyOut = 0;
        
        q.data.content.forEach(item => {
          totalValIn += item.inboundValue || 0;
          totalValOut += item.outboundValue || 0;
          totalQtyIn += item.inboundQty || 0;
          totalQtyOut += item.outboundQty || 0;
        });
        
        // Trực quan hoá: Nếu các phiếu nhập có đơn giá = 0 (tổng tiền = 0)
        // nhưng lại có số lượng nhập thật sự, biểu đồ sẽ vẽ theo số lượng để dễ nhìn.
        inbound = totalValIn > 0 ? totalValIn : totalQtyIn;
        outbound = totalValOut > 0 ? totalValOut : totalQtyOut;
      }
      
      return {
        name: m.name,
        inbound,
        outbound,
      };
    });
  }, [past6Months, historyQueries]);

  const categoryData = useMemo(() => {
    // Group by category (since we don't have category, we group by first word of product name)
    const groups = {};
    nxtList.forEach(item => {
      const cat = (item.productName || 'Khác').split(' ')[0];
      if (!groups[cat]) groups[cat] = 0;
      groups[cat] += item.closingValue || 0;
    });
    
    const sorted = Object.entries(groups)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
      
    const top5 = sorted.slice(0, 5);
    const otherValue = sorted.slice(5).reduce((sum, item) => sum + item.value, 0);
    
    if (otherValue > 0) {
      top5.push({ name: 'Khác', value: otherValue });
    }
    
    const total = top5.reduce((sum, item) => sum + item.value, 0) || 1;
    
    let currentAngle = 0;
    const colors = ['#0f172a', '#1e293b', '#334155', '#475569', '#64748b', '#94a3b8'];
    
    return top5.map((item, index) => {
      const percentage = (item.value / total) * 100;
      const angle = (percentage / 100) * 360;
      const data = {
        ...item,
        percentage,
        startAngle: currentAngle,
        endAngle: currentAngle + angle,
        color: colors[index % colors.length]
      };
      currentAngle += angle;
      return data;
    });
  }, [nxtList]);

  // SVG Donut calculation
  const getCoordinatesForPercent = (percent) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  const pendingTasks = useMemo(() => {
    const stocktakes = stocktakesData?.content || [];
    return stocktakes.filter(st => st.status === 'PENDING').slice(0, 5);
  }, [stocktakesData]);

  const deadStock = useMemo(() => {
    return [...nxtList]
      .filter(item => (item.inboundQty === 0 && item.outboundQty === 0 && item.closingValue > 0))
      .sort((a, b) => b.closingValue - a.closingValue)
      .slice(0, 5);
  }, [nxtList]);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <PageHeader 
        title="Dashboard Kế Toán" 
        breadcrumb={[{ title: 'Dashboard' }]}
      />
      
      <div className="px-6 space-y-6">
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-slate-900 to-slate-700 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl"></div>
          <div className="relative z-10">
            <h1 className="text-3xl font-bold tracking-tight mb-2">
              Xin chào, {user?.fullName || 'Kế toán viên'}
            </h1>
            <p className="text-slate-300 text-lg">
              Hôm nay là {dayjs().format('DD/MM/YYYY')}. Tổng giá trị tồn kho hiện tại đạt 
              <span className="font-semibold text-emerald-400 ml-1">{formatCurrency(totalInventoryValue)}</span>.
            </p>
          </div>
        </motion.div>

        {/* KPI Cards */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <KpiCard 
            label="Tổng giá trị tồn kho" 
            value={totalInventoryValue} 
            suffix=" đ"
            trend="+2.5%" 
            isPositive={true}
          />
          <KpiCard 
            label="Tổng nhập trong kỳ" 
            value={totalInbound} 
            suffix=" đ"
          />
          <KpiCard 
            label="Tổng xuất trong kỳ" 
            value={totalOutbound} 
            suffix=" đ"
          />
          <KpiCard 
            label="Chênh lệch kiểm kê" 
            value={varianceCount} 
            suffix=" mục"
            trend={varianceCount > 0 ? "Cần xử lý" : "Khớp"}
            isPositive={varianceCount === 0}
            isWarning={varianceCount > 0}
            formatAsCurrency={false}
          />
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column - 2/3 */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Bar Chart */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-slate-800">Nhập / Xuất (6 Tháng Gần Nhất)</h3>
                <div className="flex space-x-4 text-sm">
                  <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-slate-800 mr-2"></div> Nhập</div>
                  <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-slate-400 mr-2"></div> Xuất</div>
                </div>
              </div>
              <div className="relative h-64 pt-4 mt-4">
                {/* Grid Lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-8 text-slate-300 text-xs">
                  <div className="border-b border-slate-100 border-dashed w-full flex-1"></div>
                  <div className="border-b border-slate-100 border-dashed w-full flex-1"></div>
                  <div className="border-b border-slate-100 border-dashed w-full flex-1"></div>
                  <div className="border-b border-slate-200 w-full flex-1"></div>
                </div>

                <div className="absolute inset-0 flex items-end justify-between gap-2 pb-8">
                  {monthlyData.map((d, i) => {
                    // Nếu giá trị = 0, thử lấy số lượng để có dữ liệu vẽ cột (trường hợp chưa nhập đơn giá)
                    const maxVal = Math.max(...monthlyData.map(m => Math.max(m.inbound, m.outbound))) || 1;
                    const inHeight = Math.max((d.inbound / maxVal) * 100, 0);
                    const outHeight = Math.max((d.outbound / maxVal) * 100, 0);
                    
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center group z-10 h-full justify-end">
                        <div className="w-full flex justify-center items-end gap-1 h-full pb-1">
                          <motion.div 
                            initial={{ height: 0 }}
                            animate={{ height: `${inHeight}%` }}
                            transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
                            className="w-full max-w-[24px] bg-slate-800 rounded-t-sm relative min-h-[4px] cursor-pointer hover:bg-slate-700 transition-colors shadow-sm"
                          >
                            <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs py-1 px-2 rounded whitespace-nowrap z-20 pointer-events-none shadow-md">
                              {formatCurrency(d.inbound)}
                            </div>
                          </motion.div>
                          <motion.div 
                            initial={{ height: 0 }}
                            animate={{ height: `${outHeight}%` }}
                            transition={{ duration: 1, delay: 0.6 + i * 0.1 }}
                            className="w-full max-w-[24px] bg-slate-400 rounded-t-sm relative min-h-[4px] cursor-pointer hover:bg-slate-500 transition-colors shadow-sm"
                          >
                            <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs py-1 px-2 rounded whitespace-nowrap z-20 pointer-events-none shadow-md">
                              {formatCurrency(d.outbound)}
                            </div>
                          </motion.div>
                        </div>
                        <div className="text-xs font-medium text-slate-500 mt-2 absolute -bottom-6">{d.name.split('/')[0]}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>

            {/* Donut Chart */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-center gap-8"
            >
              <div className="flex-1 w-full">
                <h3 className="text-lg font-semibold text-slate-800 mb-6">Cơ cấu Giá trị tồn kho</h3>
                <div className="flex flex-col gap-3">
                  {categoryData.length === 0 ? (
                    <div className="text-sm text-slate-500">Chưa có dữ liệu</div>
                  ) : (
                    categoryData.map((cat, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }}></div>
                          <span className="text-sm font-medium text-slate-700">{cat.name}</span>
                        </div>
                        <div className="flex gap-4 items-center">
                          <span className="text-sm text-slate-500 font-mono">{formatCurrency(cat.value)}</span>
                          <span className="text-xs font-semibold w-10 text-right">{cat.percentage.toFixed(1)}%</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              <div className="relative w-48 h-48 flex-shrink-0">
                <svg viewBox="-1 -1 2 2" className="w-full h-full transform -rotate-90">
                  {categoryData.map((slice, i) => {
                    const startPercent = slice.startAngle / 360;
                    const endPercent = slice.endAngle / 360;
                    const [startX, startY] = getCoordinatesForPercent(startPercent);
                    const [endX, endY] = getCoordinatesForPercent(endPercent);
                    const largeArcFlag = endPercent - startPercent > 0.5 ? 1 : 0;
                    const pathData = [
                      `M ${startX} ${startY}`,
                      `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
                    ].join(' ');
                    
                    return (
                      <motion.path
                        key={i}
                        d={pathData}
                        fill="none"
                        stroke={slice.color}
                        strokeWidth="0.4"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.5, delay: 0.5 }}
                      />
                    );
                  })}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center rounded-full">
                  <span className="text-xs text-slate-500">Tổng</span>
                  <span className="text-sm font-bold text-slate-800 tracking-tighter">
                    {formatNumber(totalInventoryValue / 1000000)}M
                  </span>
                </div>
              </div>
            </motion.div>

          </div>

          {/* Right Column - 1/3 */}
          <div className="space-y-6">
            
            {/* Tasks Panel */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"
            >
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Việc cần xử lý</h3>
              
              {pendingTasks.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  Không có công việc nào cần xử lý.
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingTasks.map(task => (
                    <div 
                      key={task.id}
                      onClick={() => navigate('/stocktakes')}
                      className="group p-4 border border-slate-100 rounded-xl hover:border-slate-300 hover:shadow-sm cursor-pointer transition-all flex items-start gap-3"
                    >
                      <div className="mt-1 w-2 h-2 rounded-full bg-rose-500 flex-shrink-0"></div>
                      <div>
                        <div className="font-semibold text-sm text-slate-800 group-hover:text-slate-900 transition-colors">
                          Duyệt phiếu kiểm kê {task.code}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          Tạo bởi {task.createdBy} • {dayjs(task.createdAt).format('DD/MM')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Dead Stock */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"
            >
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Top 5 Hàng đọng vốn</h3>
              
              {deadStock.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  Không có dữ liệu hàng đọng vốn.
                </div>
              ) : (
                <div className="space-y-4">
                  {deadStock.map((item, i) => (
                    <div key={i} className="flex justify-between items-center border-b border-slate-50 last:border-0 pb-3 last:pb-0">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-800 line-clamp-1" title={item.productName}>
                          {item.productName}
                        </span>
                        <span className="text-xs text-slate-500">{item.productCode} • Tồn: {item.closingQty}</span>
                      </div>
                      <span className="text-sm font-mono font-medium text-slate-700 whitespace-nowrap pl-2">
                        {formatCurrency(item.closingValue)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

          </div>
        </div>
      </div>
    </div>
  );
}

// Subcomponents
const KpiCard = ({ label, value, suffix, trend, isPositive, isWarning, formatAsCurrency = true }) => {
  return (
    <motion.div 
      variants={{
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
      }}
      className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 relative overflow-hidden group"
    >
      {/* Subtle background texture/gradient */}
      <div className="absolute -right-10 -top-10 w-32 h-32 bg-slate-50 rounded-full opacity-50 group-hover:scale-110 transition-transform duration-500"></div>
      
      <div className="relative z-10">
        <div className="text-sm font-semibold text-slate-500 mb-2">{label}</div>
        <div className="text-3xl font-bold tracking-tight text-slate-800 flex items-baseline font-mono">
          {formatAsCurrency ? (
            <AnimatedNumber value={value} />
          ) : (
            <span>{value}</span>
          )}
          <span className="text-base text-slate-400 ml-1 tracking-normal">{suffix}</span>
        </div>
        
        {trend && (
          <div className="mt-4 flex items-center">
            <span className={`text-xs font-semibold px-2 py-1 rounded-md ${
              isWarning ? 'bg-amber-100 text-amber-700' :
              isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
            }`}>
              {trend}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
};
