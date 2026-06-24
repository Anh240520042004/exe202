import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { transactionService } from "../../services/transactionService";

import {
  Card,
  Button,
  Input,
  Select
} from "../../components/ui";

const categoryOptions = [
  { value: 'salary', label: 'Lương' },
  { value: 'investment', label: 'Đầu tư' },
  { value: 'food', label: 'Ăn uống' },
  { value: 'transport', label: 'Di chuyển' },
  { value: 'shopping', label: 'Mua sắm' },
  { value: 'bills', label: 'Hóa đơn' },
  { value: 'entertainment', label: 'Giải trí' },
  { value: 'health', label: 'Sức khỏe' },
  { value: 'education', label: 'Giáo dục' },
  { value: 'other', label: 'Khác' },
];

const typeOptions = [
  { value: 'income', label: 'Thu nhập' },
  { value: 'expense', label: 'Chi tiêu' },
];

const statusOptions = [
  { value: 'completed', label: 'Hoàn thành' },
  { value: 'pending', label: 'Đang xử lý' },
  { value: 'failed', label: 'Thất bại' },
  { value: 'cancelled', label: 'Đã hủy' },
];

export default function CreateTransaction() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    type: 'expense',
    category: 'other',
    description: '',
    status: 'completed',
    date: new Date().toISOString().split('T')[0],
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('Vui lòng nhập số tiền hợp lệ');
      return;
    }

    try {
      setLoading(true);
      await transactionService.create({
        ...formData,
        amount: parseFloat(formData.amount),
        date: new Date(formData.date),
      });
      toast.success('Tạo giao dịch thành công!');
      navigate('/transactions');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Tạo giao dịch thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/transactions')}
          className="p-2 glass-nav-hover rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Thêm giao dịch mới</h1>
          <p className="text-slate-600 dark:text-slate-300 mt-1 font-medium">Nhập thông tin giao dịch của bạn</p>
        </div>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Select
              label="Loại giao dịch"
              options={typeOptions}
              name="type"
              value={formData.type}
              onChange={handleChange}
            />
            
            <Input
              label="Số tiền (VND)"
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="0"
              min="0"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Select
              label="Danh mục"
              options={categoryOptions}
              name="category"
              value={formData.category}
              onChange={handleChange}
            />
            
            <Select
              label="Trạng thái"
              options={statusOptions}
              name="status"
              value={formData.status}
              onChange={handleChange}
            />
          </div>

          <Input
            label="Mô tả"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Nhập mô tả giao dịch (tùy chọn)"
          />

          <Input
            label="Ngày giao dịch"
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
          />

          <div className="flex justify-end gap-3 pt-4 border-t glass-divider border">
            <Button type="button" variant="secondary" onClick={() => navigate('/transactions')}>
              Hủy
            </Button>
            <Button type="submit" className="gap-2" isLoading={loading}>
              <Save className="w-4 h-4" />
              Tạo giao dịch
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
