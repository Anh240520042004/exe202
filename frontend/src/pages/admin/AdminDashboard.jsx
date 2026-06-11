import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAdminDashboard } from '../../store/dashboardSlice';
import { Link } from 'react-router-dom';
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

const AdminDashboard = () => {
  const dispatch = useDispatch();

  const { admin, isLoading } = useSelector(
    (state) => state.dashboard
  );

  useEffect(() => {
    dispatch(fetchAdminDashboard());
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
    popularMentors,
  } = admin;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="glass-card border-b dark:border-gray-700 px-8 py-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-500">
          Overview of your platform
        </p>
      </div>

      <div className="p-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <OverviewCard
            icon={<Users />}
            label="Total Users"
            value={overview?.totalUsers || 0}
            subtext={`${overview?.activeUsers || 0} active`}
            color="blue"
          />

          <OverviewCard
            icon={<BookOpen />}
            label="Documents"
            value={overview?.totalDocuments || 0}
            subtext={`${stats?.documentStats?.totalDownloads || overview?.documentStats?.totalDownloads || 0} downloads`}
            color="purple"
          />

          <OverviewCard
            icon={<Clock />}
            label="Pending Orders"
            value={stats?.orderStats?.pending || overview?.orderStats?.pending || 0}
            subtext="Chờ xác nhận"
            color="yellow"
          />

          <OverviewCard
            icon={<ShoppingCart />}
            label="Total Orders"
            value={overview?.totalOrders || 0}
            subtext={`${stats?.orderStats?.completed || overview?.orderStats?.completed || 0} completed`}
            color="green"
          />

          <OverviewCard
            icon={<DollarSign />}
            label="Revenue"
            value={`${(
              (overview?.totalRevenue || 0) / 1000000
            ).toFixed(1)}M`}
            subtext="VND"
            color="orange"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <OverviewCard
            icon={<CalendarDays />}
            label="Users Today"
            value={overview?.usersToday || 0}
            subtext="New accounts today"
            color="blue"
          />
          <OverviewCard
            icon={<Users />}
            label="Users This Month"
            value={overview?.usersThisMonth || 0}
            subtext={`${overview?.totalUsers || 0} total users`}
            color="purple"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <MetricBarChart
            title="Revenue (Last 6 Months)"
            icon={<TrendingUp className="text-green-500" />}
            data={charts?.monthlyRevenue || []}
            labelKey="month"
            valueKey="revenue"
            barClassName="bg-gradient-to-t from-green-600 via-green-500 to-emerald-300 shadow-green-500/25"
            legend="Revenue"
            valueFormatter={formatCurrencyShort}
          />

          <MetricBarChart
            title="User Growth (Last 6 Months)"
            icon={<Users className="text-blue-500" />}
            data={charts?.userGrowth || []}
            labelKey="month"
            valueKey="users"
            barClassName="bg-gradient-to-t from-blue-600 via-blue-500 to-cyan-300 shadow-blue-500/25"
            legend="New users"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <UserBarChart
            title="New Users By Day"
            subtitle="Last 30 days"
            data={charts?.dailyUserSignups || []}
            labelKey="date"
            minColumnWidth={34}
          />
          <UserBarChart
            title="New Users By Month"
            subtitle="Last 24 months"
            data={charts?.monthlyUserSignups || charts?.userGrowth || []}
            labelKey="month"
            minColumnWidth={54}
          />
        </div>

        {/* Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="p-6 border-b dark:border-gray-700">
              <h2 className="font-bold">Recent Orders</h2>
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
                        {order.documents?.length || 0} items
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-bold">
                      {order.totalAmount?.toLocaleString()}đ
                    </p>

                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${order.status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : order.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}

              {(!recentOrders ||
                recentOrders.length === 0) && (
                  <div className="p-8 text-center text-gray-500">
                    No recent orders
                  </div>
                )}
            </div>
          </div>

          {/* Popular Documents */}
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="p-6 border-b dark:border-gray-700">
              <h2 className="font-bold">
                Popular Documents
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
                        {doc.salesCount} sales
                      </p>

                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <Download size={12} />
                        {doc.downloads}
                      </p>
                    </div>
                  </div>
                ))}

              {(!popularDocuments ||
                popularDocuments.length === 0) && (
                  <div className="p-8 text-center text-gray-500">
                    No popular documents
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
    <div className="glass-card rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-4">
        <div
          className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center`}
        >
          {React.cloneElement(icon, {
            className: 'text-white',
            size: 24,
          })}
        </div>

        <div>
          <p className="text-sm text-gray-500">
            {label}
          </p>

          <p className="text-2xl font-bold">
            {value}
          </p>

          <p className="text-xs text-gray-400">
            {subtext}
          </p>
        </div>
      </div>
    </div>
  );
};

const formatCurrencyShort = (value) => {
  if (!value) return '0';
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${Math.round(value / 1000)}K`;
  return value.toLocaleString('vi-VN');
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
}) => {
  const maxValue = Math.max(...(data?.map((item) => item[valueKey] || 0) || [0]), 1);
  const total = data?.reduce((sum, item) => sum + (item[valueKey] || 0), 0) || 0;

  return (
    <div className="glass-card rounded-2xl p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          {icon}
          {title}
        </h2>
        <span className="text-xs text-gray-500">{valueFormatter(total)} total</span>
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
          No data
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
            <span key={value} className="text-right">{value}</span>
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
                      {item.users || 0}
                    </span>
                    <div className="h-full w-full min-w-0 flex items-end justify-center gap-0.5">
                      <div
                        className={`w-[54%] max-w-7 rounded-t-xl transition-all shadow-lg ${
                          item.users
                            ? 'bg-gradient-to-t from-blue-600 via-blue-500 to-cyan-300 shadow-blue-500/25'
                            : 'bg-gray-700/45 shadow-none'
                        }`}
                        style={{ height: `${item.users ? Math.max(height, 14) : 6}%` }}
                        title={`${item.users || 0} users`}
                      />
                      <div
                        className={`w-[18%] max-w-2 rounded-t transition-all ${
                          item.mentors
                            ? 'bg-gradient-to-t from-purple-600 to-fuchsia-300'
                            : 'bg-gray-700/45'
                        }`}
                        style={{ height: `${item.mentors ? Math.max(mentorHeight, 14) : 6}%` }}
                        title={`${item.mentors || 0} mentors`}
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
        <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-500" />Total</span>
        <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded bg-purple-500" />Mentor</span>
      </div>
    </div>
  );
};

export default AdminDashboard;
