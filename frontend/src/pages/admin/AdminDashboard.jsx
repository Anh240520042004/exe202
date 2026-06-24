import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAdminDashboard } from '../../store/dashboardSlice';
import { documentService } from '../../services/api';
import {
  Users,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  BookOpen,
  Download,
  Clock,
  CalendarDays,
} from 'lucide-react';

const ORDER_STATUS_LABELS = {
  pending: 'Chờ xử lý',
  processing: 'Đang xử lý',
  completed: 'Hoàn thành',
  failed: 'Thất bại',
  refunded: 'Đã hoàn tiền',
  paid: 'Đã thanh toán',
};

const ORDER_STATUS_CLASSES = {
  pending: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  refunded: 'bg-gray-100 text-gray-700',
  paid: 'bg-emerald-100 text-emerald-700',
};

const formatCurrency = (value) => new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
}).format(value || 0);

const formatCompactCurrency = (value) => {
  const amount = Number(value) || 0;

  if (amount >= 1000000000) {
    return `${(amount / 1000000000).toFixed(1)} tỷ`;
  }

  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)} triệu`;
  }

  if (amount >= 1000) {
    return `${Math.round(amount / 1000)} nghìn`;
  }

  return amount.toLocaleString('vi-VN');
};

const formatCount = (value) => (Number(value) || 0).toLocaleString('vi-VN');

const getOrderStatusKey = (order) => order?.status || order?.paymentStatus || 'pending';
const getOrderStatusLabel = (order) => ORDER_STATUS_LABELS[getOrderStatusKey(order)] || 'Không xác định';
const getOrderStatusClassName = (order) => ORDER_STATUS_CLASSES[getOrderStatusKey(order)] || 'bg-gray-100 text-gray-700';

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const [marketplaceDocumentTotal, setMarketplaceDocumentTotal] = useState(null);

  const { admin, isLoading } = useSelector(
    (state) => state.dashboard
  );

  useEffect(() => {
    dispatch(fetchAdminDashboard());

    let isMounted = true;
    documentService.getAll({ limit: 1 })
      .then((response) => {
        if (!isMounted) return;
        const total = response.data?.data?.pagination?.total;
        if (Number.isFinite(total)) {
          setMarketplaceDocumentTotal(total);
        }
      })
      .catch(() => {
        if (isMounted) setMarketplaceDocumentTotal(null);
      });

    return () => {
      isMounted = false;
    };
  }, [dispatch]);

  if (isLoading || !admin) {
    return (
      <div className="min-h-screen p-8">
        <div className="animate-pulse space-y-8">
          <div className="h-8 w-64 bg-gray-300 dark:bg-gray-700 rounded" />

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-32 bg-gray-300 dark:bg-gray-700 rounded-2xl"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const {
    overview,
    stats,
    charts,
    recentOrders,
    popularDocuments,
  } = admin;

  return (
    <div className="min-h-screen">
      <div className="glass-card border-b dark:border-gray-700 px-8 py-6">
        <h1 className="text-2xl font-bold">Bảng điều khiển quản trị</h1>
        <p className="text-gray-500">
          Tổng quan hoạt động của nền tảng
        </p>
      </div>

      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <OverviewCard
            icon={<Users />}
            label="Tổng người dùng"
            value={formatCount(overview?.totalUsers || 0)}
            subtext={`${formatCount(overview?.activeUsers || 0)} đang hoạt động`}
            color="blue"
          />

          <OverviewCard
            icon={<BookOpen />}
            label="Tài liệu"
            value={formatCount(marketplaceDocumentTotal ?? stats?.documentStats?.activeMarketplace ?? stats?.documentStats?.total ?? overview?.totalDocuments ?? 0)}
            subtext={`${formatCount(stats?.documentStats?.totalDownloads || overview?.documentStats?.totalDownloads || 0)} lượt tải`}
            color="purple"
          />

          <OverviewCard
            icon={<Clock />}
            label="Đơn chờ xử lý"
            value={formatCount(stats?.orderStats?.pending || overview?.orderStats?.pending || 0)}
            subtext="Đang chờ xác nhận"
            color="yellow"
          />

          <OverviewCard
            icon={<ShoppingCart />}
            label="Tổng đơn hàng"
            value={formatCount(overview?.totalOrders || 0)}
            subtext={`${formatCount(stats?.orderStats?.completed || overview?.orderStats?.completed || 0)} đã hoàn thành`}
            color="green"
          />

          <OverviewCard
            icon={<DollarSign />}
            label="Doanh thu"
            value={formatCurrency(overview?.totalRevenue || 0)}
            subtext="Từ các đơn hàng đã thanh toán"
            color="orange"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <OverviewCard
            icon={<CalendarDays />}
            label="Người dùng mới hôm nay"
            value={formatCount(overview?.usersToday || 0)}
            subtext="Tài khoản tạo mới trong ngày"
            color="blue"
          />
          <OverviewCard
            icon={<Users />}
            label="Người dùng mới tháng này"
            value={formatCount(overview?.usersThisMonth || 0)}
            subtext={`${formatCount(overview?.totalUsers || 0)} tổng người dùng`}
            color="purple"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <MetricBarChart
            title="Doanh thu 6 tháng gần nhất"
            icon={<TrendingUp className="text-green-500" />}
            data={charts?.monthlyRevenue || []}
            labelKey="month"
            valueKey="revenue"
            barClassName="bg-gradient-to-t from-green-600 via-green-500 to-emerald-300 shadow-green-500/25"
            legend="Doanh thu"
            valueFormatter={formatCompactCurrency}
            summaryLabel="Tổng cộng"
            summaryFormatter={formatCurrency}
          />

          <MetricBarChart
            title="Tăng trưởng người dùng 6 tháng gần nhất"
            icon={<Users className="text-blue-500" />}
            data={charts?.userGrowth || []}
            labelKey="month"
            valueKey="users"
            barClassName="bg-gradient-to-t from-blue-600 via-blue-500 to-cyan-300 shadow-blue-500/25"
            legend="Người dùng mới"
            valueFormatter={formatCount}
            summaryLabel="Tổng mới"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <UserBarChart
            title="Người dùng mới theo ngày"
            subtitle="30 ngày gần nhất"
            data={charts?.dailyUserSignups || []}
            labelKey="date"
            minColumnWidth={34}
          />
          <UserBarChart
            title="Người dùng mới theo tháng"
            subtitle="24 tháng gần nhất"
            data={charts?.monthlyUserSignups || charts?.userGrowth || []}
            labelKey="month"
            minColumnWidth={54}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="p-6 border-b dark:border-gray-700">
              <h2 className="font-bold">Đơn hàng gần đây</h2>
            </div>

            <div className="divide-y dark:divide-gray-700">
              {recentOrders?.slice(0, 5).map((order) => (
                <div
                  key={order._id}
                  className="p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={order.user?.avatar}
                      alt=""
                      className="w-10 h-10 rounded-full"
                    />

                    <div>
                      <p className="font-medium">
                        {order.user?.name}
                      </p>

                      <p className="text-sm text-gray-500">
                        {formatCount(order.documents?.length || 0)} tài liệu
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-bold">
                      {formatCurrency(order.totalAmount || 0)}
                    </p>

                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${getOrderStatusClassName(order)}`}
                    >
                      {getOrderStatusLabel(order)}
                    </span>
                  </div>
                </div>
              ))}

              {(!recentOrders ||
                recentOrders.length === 0) && (
                  <div className="p-8 text-center text-gray-500">
                    Chưa có đơn hàng gần đây
                  </div>
                )}
            </div>
          </div>

          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="p-6 border-b dark:border-gray-700">
              <h2 className="font-bold">
                Tài liệu phổ biến
              </h2>
            </div>

            <div className="divide-y dark:divide-gray-700">
              {popularDocuments
                ?.slice(0, 5)
                .map((doc, i) => (
                  <div
                    key={doc._id}
                    className="p-4 flex items-center gap-3"
                  >
                    <span className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {i + 1}
                    </span>

                    <img
                      src={
                        doc.previewImages?.[0] ||
                        `https://picsum.photos/seed/${doc._id}/50/50`
                      }
                      alt=""
                      className="w-12 h-12 rounded-xl object-cover"
                    />

                    <div className="flex-1">
                      <p className="font-medium line-clamp-1">
                        {doc.title}
                      </p>

                      <p className="text-sm text-gray-500">
                        {doc.subjectCode}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-bold text-orange-500">
                        {formatCount(doc.salesCount)} lượt bán
                      </p>

                      <p className="text-xs text-gray-400 flex items-center gap-1 justify-end">
                        <Download size={12} />
                        {formatCount(doc.downloads)} lượt tải
                      </p>
                    </div>
                  </div>
                ))}

              {(!popularDocuments ||
                popularDocuments.length === 0) && (
                  <div className="p-8 text-center text-gray-500">
                    Chưa có tài liệu phổ biến
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const OverviewCard = ({
  icon,
  label,
  value,
  subtext,
  color,
}) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
    green: 'from-green-500 to-emerald-500',
    orange: 'from-orange-500 to-red-500',
    yellow: 'from-yellow-500 to-orange-500',
  };

  return (
    <div className="glass-card rounded-2xl p-5 flex items-center gap-4 bg-white/95 border border-slate-200/90 dark:bg-slate-900/85 dark:border-white/10 shadow-sm">
      <div
        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center flex-shrink-0`}
      >
        {React.cloneElement(icon, {
          className: 'text-white',
          size: 24,
        })}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-0.5">
          {label}
        </p>

        <p className="text-xl font-bold text-slate-900 dark:text-white whitespace-nowrap leading-tight overflow-hidden text-ellipsis">
          {value}
        </p>

        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-1">
          {subtext}
        </p>
      </div>
    </div>
  );
};

const buildAxisTicks = (maxValue) => {
  const safeMax = Math.max(maxValue, 1);
  return [safeMax, Math.ceil(safeMax * 0.75), Math.ceil(safeMax * 0.5), Math.ceil(safeMax * 0.25), 0]
    .filter((value, index, values) => values.indexOf(value) === index);
};

const MetricBarChart = ({
  title,
  icon,
  data,
  labelKey,
  valueKey,
  barClassName,
  legend,
  valueFormatter = (value) => value,
  summaryLabel = 'Tổng cộng',
  summaryFormatter = valueFormatter,
}) => {
  const maxValue = Math.max(...(data?.map((item) => item[valueKey] || 0) || [0]), 1);
  const total = data?.reduce((sum, item) => sum + (item[valueKey] || 0), 0) || 0;

  return (
    <div className="glass-card rounded-2xl p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-4 gap-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          {icon}
          {title}
        </h2>
        <span className="text-xs text-gray-500 text-right">{summaryLabel}: {summaryFormatter(total)}</span>
      </div>

      <div className="h-64 grid grid-cols-[2rem_minmax(0,1fr)] gap-3">
        <div className="flex flex-col justify-between pb-7 text-[10px] text-gray-500">
          {buildAxisTicks(maxValue).map((value) => (
            <span key={value} className="text-right">{valueFormatter(value)}</span>
          ))}
        </div>

        <div className="relative min-w-0 overflow-hidden">
          <div className="absolute inset-x-0 top-0 bottom-7 flex flex-col justify-between">
            {[0, 1, 2, 3, 4].map((line) => (
              <div key={line} className="border-t border-white/10" />
            ))}
          </div>

          <div
            className="relative h-full grid items-end gap-2 px-2 pb-7"
            style={{ gridTemplateColumns: `repeat(${Math.max(data?.length || 1, 1)}, minmax(0, 1fr))` }}
          >
            {data?.map((item, index) => {
              const value = item[valueKey] || 0;
              const height = (value / maxValue) * 100;

              return (
                <div key={`${item[labelKey]}-${index}`} className="h-full flex flex-col items-center justify-end gap-2 group relative min-w-0">
                  <span className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-medium text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    {valueFormatter(value)}
                  </span>
                  <div
                    className={`w-full max-w-10 rounded-t-xl transition-all hover:opacity-90 shadow-lg ${
                      value === 0 ? 'bg-gray-700/45 shadow-none' : barClassName
                    }`}
                    style={{ height: `${value === 0 ? 6 : Math.max(height, 14)}%` }}
                  />
                  <span className="max-w-full truncate text-[10px] font-semibold text-gray-500">
                    {item[labelKey]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t dark:border-gray-700">
        <span className="inline-flex items-center gap-2 text-xs text-gray-500">
          <span className="w-3 h-3 rounded bg-primary-400" />
          {legend}
        </span>
        <span className="inline-flex items-center gap-2 text-xs text-gray-500">
          <span className="w-3 h-3 rounded bg-gray-700" />
          Không có dữ liệu
        </span>
      </div>
    </div>
  );
};

const UserBarChart = ({ title, subtitle, data, labelKey, minColumnWidth = 42 }) => {
  const maxUsers = Math.max(...(data?.map((item) => item.users) || [0]), 1);
  const chartWidth = Math.max((data?.length || 1) * minColumnWidth, 520);

  return (
    <div className="glass-card rounded-2xl p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Users className="text-blue-500" />
          {title}
        </h2>
        <span className="text-xs text-gray-500">{subtitle}</span>
      </div>

      <div className="h-64 grid grid-cols-[2rem_minmax(0,1fr)] gap-3">
        <div className="flex flex-col justify-between pb-7 text-[10px] text-gray-500">
          {buildAxisTicks(maxUsers).map((value) => (
            <span key={value} className="text-right">{formatCount(value)}</span>
          ))}
        </div>

        <div className="min-w-0 overflow-x-auto overflow-y-hidden pb-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-white/5">
          <div className="relative h-full" style={{ width: `${chartWidth}px` }}>
            <div className="absolute inset-x-0 top-0 bottom-7 flex flex-col justify-between">
              {[0, 1, 2, 3, 4].map((line) => (
                <div key={line} className="border-t border-white/10" />
              ))}
            </div>

            <div
              className="relative h-full grid items-end gap-1 px-2 pb-7"
              style={{ gridTemplateColumns: `repeat(${Math.max(data?.length || 1, 1)}, minmax(0, 1fr))` }}
            >
              {data?.map((item, i) => {
                const height = (item.users / maxUsers) * 100;
                const mentorHeight = ((item.mentors || 0) / maxUsers) * 100;

                return (
                  <div key={`${item[labelKey]}-${i}`} className="h-full flex flex-col items-center justify-end gap-2 min-w-0 group relative">
                    <span className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-medium text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      {formatCount(item.users || 0)}
                    </span>
                    <div className="h-full w-full min-w-0 flex items-end justify-center gap-0.5">
                      <div
                        className={`w-[54%] max-w-7 rounded-t-xl transition-all shadow-lg ${
                          item.users
                            ? 'bg-gradient-to-t from-blue-600 via-blue-500 to-cyan-300 shadow-blue-500/25'
                            : 'bg-gray-700/45 shadow-none'
                        }`}
                        style={{ height: `${item.users ? Math.max(height, 14) : 6}%` }}
                        title={`${formatCount(item.users || 0)} người dùng`}
                      />
                      <div
                        className={`w-[18%] max-w-2 rounded-t transition-all ${
                          item.mentors
                            ? 'bg-gradient-to-t from-purple-600 to-fuchsia-300'
                            : 'bg-gray-700/45'
                        }`}
                        style={{ height: `${item.mentors ? Math.max(mentorHeight, 14) : 6}%` }}
                        title={`${formatCount(item.mentors || 0)} cố vấn`}
                      />
                    </div>
                    <span className="text-[10px] font-semibold text-gray-500 truncate max-w-full">{item[labelKey]}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t dark:border-gray-700 text-xs text-gray-500">
        <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-500" />Người dùng</span>
        <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded bg-purple-500" />Cố vấn</span>
      </div>
    </div>
  );
};

export default AdminDashboard;
