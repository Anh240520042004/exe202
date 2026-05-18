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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="animate-pulse space-y-8">
          <div className="h-8 w-64 bg-gray-300 dark:bg-gray-700 rounded" />

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-32 bg-gray-300 dark:bg-gray-700 rounded-xl"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const {
    overview,
    charts,
    recentOrders,
    popularDocuments,
    popularMentors,
  } = admin;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-8 py-6">
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
            subtext={`${overview?.documentStats?.totalDownloads || 0} downloads`}
            color="purple"
          />

          <OverviewCard
            icon={<Clock />}
            label="Pending Orders"
            value={overview?.orderStats?.pending || 0}
            subtext="Chờ xác nhận"
            color="yellow"
          />

          <OverviewCard
            icon={<ShoppingCart />}
            label="Total Orders"
            value={overview?.totalOrders || 0}
            subtext={`${overview?.orderStats?.completed || 0} completed`}
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

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="text-green-500" />
              Revenue (Last 6 Months)
            </h2>

            <div className="h-64 flex items-end justify-around gap-2">
              {charts?.monthlyRevenue?.map((month, i) => {
                const maxRevenue = Math.max(
                  ...(charts?.monthlyRevenue?.map(
                    (m) => m.revenue
                  ) || [1])
                );

                const height =
                  (month.revenue / maxRevenue) * 100;

                return (
                  <div
                    key={i}
                    className="flex flex-col items-center gap-2 flex-1"
                  >
                    <div
                      className="w-full bg-gradient-to-t from-green-500 to-emerald-400 rounded-t-lg transition-all hover:opacity-80"
                      style={{
                        height: `${Math.max(height, 5)}%`,
                      }}
                    />

                    <span className="text-xs text-gray-500">
                      {month.month}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* User Growth Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Users className="text-blue-500" />
              User Growth (Last 6 Months)
            </h2>

            <div className="h-64 flex items-end justify-around gap-2">
              {charts?.userGrowth?.map((month, i) => {
                const maxUsers = Math.max(
                  ...(charts?.userGrowth?.map(
                    (m) => m.users
                  ) || [1])
                );

                const height =
                  (month.users / maxUsers) * 100;

                return (
                  <div
                    key={i}
                    className="flex flex-col items-center gap-2 flex-1"
                  >
                    <div
                      className="w-full bg-gradient-to-t from-blue-500 to-cyan-400 rounded-t-lg transition-all hover:opacity-80"
                      style={{
                        height: `${Math.max(height, 5)}%`,
                      }}
                    />

                    <span className="text-xs text-gray-500">
                      {month.month}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden">
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
          <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden">
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
                      className="w-12 h-12 rounded-lg object-cover"
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
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-4">
        <div
          className={`w-14 h-14 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center`}
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

export default AdminDashboard;