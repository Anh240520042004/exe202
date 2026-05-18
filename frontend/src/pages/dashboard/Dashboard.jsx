import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight,
  CreditCard, PiggyBank, DollarSign, Plus
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { dashboardService } from "../../services/dashboardService";

import {
  Card,
  StatCard,
  Button,
  Badge,
  CardSkeleton
} from "../../components/ui";

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
  }).format(amount);
};

const categoryLabels = {
  salary: 'Lương',
  investment: 'Đầu tư',
  food: 'Ăn uống',
  transport: 'Di chuyển',
  shopping: 'Mua sắm',
  bills: 'Hóa đơn',
  entertainment: 'Giải trí',
  health: 'Sức khỏe',
  education: 'Giáo dục',
  other: 'Khác',
};

const categoryColors = {
  salary: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  investment: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  food: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  transport: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  shopping: 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400',
  bills: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
  entertainment: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
  health: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  education: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400',
  other: 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400',
};

export default function Dashboard() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await dashboardService.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Xin chào, {user?.name?.split(' ').pop()}!
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Chào mừng bạn quay trở lại FPTAIEZ
          </p>
        </div>
        <Link to="/transactions/create">
          <Button className="gap-2">
            <Plus className="w-5 h-5" />
            Giao dịch mới
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Số dư"
          value={formatCurrency(stats?.balance || 0)}
          icon={Wallet}
          color="primary"
          trend={`${stats?.balance >= 0 ? '+' : ''}${formatCurrency(stats?.balance || 0)}`}
          trendUp={stats?.balance >= 0}
        />
        <StatCard
          title="Thu nhập"
          value={formatCurrency(stats?.totalIncome || 0)}
          icon={TrendingUp}
          color="success"
          trend="+12%"
          trendUp={true}
        />
        <StatCard
          title="Chi tiêu"
          value={formatCurrency(stats?.totalExpense || 0)}
          icon={TrendingDown}
          color="danger"
          trend="-5%"
          trendUp={false}
        />
        <StatCard
          title="Tổng giao dịch"
          value={stats?.totalTransactions || 0}
          icon={CreditCard}
          color="info"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card 
          title="Giao dịch gần đây" 
          subtitle="Những giao dịch mới nhất của bạn"
          headerAction={
            <Link to="/transactions" className="text-sm text-primary-600 hover:text-primary-700">
              Xem tất cả
            </Link>
          }
        >
          <div className="space-y-4">
            {stats?.recentTransactions?.length > 0 ? (
              stats.recentTransactions.map((transaction) => (
                <div
                  key={transaction._id}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      transaction.type === 'income' 
                        ? 'bg-green-100 dark:bg-green-900/30' 
                        : 'bg-red-100 dark:bg-red-900/30'
                    }`}>
                      {transaction.type === 'income' ? (
                        <ArrowUpRight className="w-5 h-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <ArrowDownRight className="w-5 h-5 text-red-600 dark:text-red-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {transaction.description || categoryLabels[transaction.category]}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(transaction.date).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${
                      transaction.type === 'income' 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}
                      {formatCurrency(transaction.amount)}
                    </p>
                    <Badge 
                      variant={
                        transaction.status === 'completed' ? 'success' :
                        transaction.status === 'pending' ? 'warning' : 'danger'
                      }
                      size="sm"
                    >
                      {transaction.status === 'completed' ? 'Hoàn thành' :
                       transaction.status === 'pending' ? 'Đang xử lý' : 'Thất bại'}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <PiggyBank className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Chưa có giao dịch nào</p>
                <Link to="/transactions/create" className="text-primary-600 hover:underline mt-2 inline-block">
                  Tạo giao dịch đầu tiên
                </Link>
              </div>
            )}
          </div>
        </Card>

        <Card 
          title="Chi tiêu theo danh mục" 
          subtitle="Tổng quan các khoản chi"
        >
          <div className="space-y-4">
            {stats?.byCategory?.filter(c => c._id.type === 'expense').length > 0 ? (
              stats.byCategory
                .filter(c => c._id.type === 'expense')
                .sort((a, b) => b.total - a.total)
                .slice(0, 6)
                .map((cat) => {
                  const maxTotal = Math.max(...stats.byCategory.filter(c => c._id.type === 'expense').map(c => c.total));
                  const percentage = (cat.total / maxTotal) * 100;
                  
                  return (
                    <div key={cat._id.category} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-lg text-xs font-medium ${categoryColors[cat._id.category]}`}>
                            {categoryLabels[cat._id.category]}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatCurrency(cat.total)}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-red-500 to-red-400 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })
            ) : (
              <div className="text-center py-8 text-gray-500">
                <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Chưa có dữ liệu chi tiêu</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-primary-500 to-primary-700 border-0">
          <div className="flex items-center justify-between">
            <div className="text-white">
              <p className="text-primary-100">Ngân sách tháng</p>
              <p className="text-3xl font-bold mt-1">{formatCurrency(50000000)}</p>
              <p className="text-primary-200 text-sm mt-2">Còn lại: {formatCurrency((stats?.balance || 0) % 50000000)}</p>
            </div>
            <div className="p-4 bg-white/20 rounded-xl">
              <PiggyBank className="w-8 h-8 text-white" />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-700 border-0">
          <div className="flex items-center justify-between">
            <div className="text-white">
              <p className="text-green-100">Mục tiêu tiết kiệm</p>
              <p className="text-3xl font-bold mt-1">{formatCurrency(100000000)}</p>
              <p className="text-green-200 text-sm mt-2">Đã đạt: 45%</p>
            </div>
            <div className="p-4 bg-white/20 rounded-xl">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-accent-500 to-accent-700 border-0">
          <div className="flex items-center justify-between">
            <div className="text-white">
              <p className="text-accent-100">Thu nhập tháng</p>
              <p className="text-3xl font-bold mt-1">{formatCurrency(stats?.totalIncome || 0)}</p>
              <p className="text-accent-200 text-sm mt-2">Tăng 12% so với tháng trước</p>
            </div>
            <div className="p-4 bg-white/20 rounded-xl">
              <DollarSign className="w-8 h-8 text-white" />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
