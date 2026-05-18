import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Bell, Moon, Globe, Shield, Palette } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  fetchSettings,
  updateSettings
} from "../../store/slices/userSlice";

import { toggleTheme } from "../../store/slices/uiSlice";

import { Card, Button, LoginRequired } from "../../components/ui";

export default function Settings() {
  const dispatch = useDispatch();
  const { settings, isLoading } = useSelector((state) => state.user);
  const theme = useSelector((state) => state.ui.theme);

  useEffect(() => {
    dispatch(fetchSettings());
  }, [dispatch]);

  const handleToggle = async (key) => {
    const newValue = !settings?.preferences?.[key];

    try {
      await dispatch(updateSettings({
        ...settings?.preferences,
        [key]: newValue,
      })).unwrap();
      toast.success('Cập nhật thành công!');
    } catch (err) {
      toast.error('Cập nhật thất bại');
    }
  };

  const handleThemeChange = async (newTheme) => {
    dispatch(toggleTheme());
  };

  const SettingItem = ({ icon: Icon, title, description, children }) => (
    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
      <div className="flex items-center gap-4">
        <div className="p-2 bg-white dark:bg-gray-700 rounded-lg">
          <Icon className="w-5 h-5 text-primary-600" />
        </div>
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{title}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );

  return (
    <LoginRequired title="Cài đặt" message="Bạn cần đăng nhập để xem cài đặt">
      <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cài đặt</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Quản lý cài đặt ứng dụng</p>
      </div>

      <Card title="Giao diện">
        <div className="space-y-4">
          <SettingItem
            icon={Palette}
            title="Chế độ tối"
            description="Bật chế độ tối cho ứng dụng"
          >
            <button
              onClick={() => dispatch(toggleTheme())}
              className={`relative w-12 h-6 rounded-full transition-colors ${theme === 'dark' ? 'bg-primary-500' : 'bg-gray-300'
                }`}
            >
              <div
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${theme === 'dark' ? 'translate-x-7' : 'translate-x-1'
                  }`}
              />
            </button>
          </SettingItem>
        </div>
      </Card>

      <Card title="Thông báo">
        <div className="space-y-4">
          <SettingItem
            icon={Bell}
            title="Thông báo Email"
            description="Nhận thông báo qua email"
          >
            <button
              onClick={() => handleToggle('email')}
              className={`relative w-12 h-6 rounded-full transition-colors ${settings?.preferences?.notifications?.email ? 'bg-primary-500' : 'bg-gray-300'
                }`}
            >
              <div
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings?.preferences?.notifications?.email ? 'translate-x-7' : 'translate-x-1'
                  }`}
              />
            </button>
          </SettingItem>

          <SettingItem
            icon={Bell}
            title="Thông báo đẩy"
            description="Nhận thông báo trên trình duyệt"
          >
            <button
              onClick={() => handleToggle('push')}
              className={`relative w-12 h-6 rounded-full transition-colors ${settings?.preferences?.notifications?.push ? 'bg-primary-500' : 'bg-gray-300'
                }`}
            >
              <div
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings?.preferences?.notifications?.push ? 'translate-x-7' : 'translate-x-1'
                  }`}
              />
            </button>
          </SettingItem>

          <SettingItem
            icon={Bell}
            title="Cảnh báo giao dịch"
            description="Nhận thông báo khi có giao dịch mới"
          >
            <button
              onClick={() => handleToggle('transactionAlerts')}
              className={`relative w-12 h-6 rounded-full transition-colors ${settings?.preferences?.notifications?.transactionAlerts ? 'bg-primary-500' : 'bg-gray-300'
                }`}
            >
              <div
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings?.preferences?.notifications?.transactionAlerts ? 'translate-x-7' : 'translate-x-1'
                  }`}
              />
            </button>
          </SettingItem>
        </div>
      </Card>

      <Card title="Ngôn ngữ & Địa phương">
        <div className="space-y-4">
          <SettingItem
            icon={Globe}
            title="Ngôn ngữ"
            description="Chọn ngôn ngữ hiển thị"
          >
            <select className="px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm">
              <option value="vi">Tiếng Việt</option>
              <option value="en">English</option>
            </select>
          </SettingItem>

          <SettingItem
            icon={Globe}
            title="Đơn vị tiền tệ"
            description="Chọn đơn vị tiền tệ mặc định"
          >
            <select className="px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm">
              <option value="VND">VND (Việt Nam Đồng)</option>
              <option value="USD">USD (US Dollar)</option>
              <option value="EUR">EUR (Euro)</option>
            </select>
          </SettingItem>
        </div>
      </Card>

      <Card title="Bảo mật">
        <div className="space-y-4">
          <SettingItem
            icon={Shield}
            title="Xác thực hai yếu tố"
            description="Tăng cường bảo mật tài khoản"
          >
            <button
              onClick={() => handleToggle('twoFactorEnabled')}
              className={`relative w-12 h-6 rounded-full transition-colors ${settings?.security?.twoFactorEnabled ? 'bg-primary-500' : 'bg-gray-300'
                }`}
            >
              <div
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings?.security?.twoFactorEnabled ? 'translate-x-7' : 'translate-x-1'
                  }`}
              />
            </button>
          </SettingItem>
        </div>
      </Card>

      <Card title="Quyền riêng tư">
        <div className="space-y-4">
          <SettingItem
            icon={Globe}
            title="Hiển thị số dư"
            description="Cho phép hiển thị số dư tài khoản"
          >
            <button
              onClick={() => handleToggle('showBalance')}
              className={`relative w-12 h-6 rounded-full transition-colors ${settings?.preferences?.privacy?.showBalance ? 'bg-primary-500' : 'bg-gray-300'
                }`}
            >
              <div
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings?.preferences?.privacy?.showBalance ? 'translate-x-7' : 'translate-x-1'
                  }`}
              />
            </button>
          </SettingItem>

          <SettingItem
            icon={Globe}
            title="Hiển thị giao dịch"
            description="Cho phép xem lịch sử giao dịch"
          >
            <button
              onClick={() => handleToggle('showTransactions')}
              className={`relative w-12 h-6 rounded-full transition-colors ${settings?.preferences?.privacy?.showTransactions ? 'bg-primary-500' : 'bg-gray-300'
                }`}
            >
              <div
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings?.preferences?.privacy?.showTransactions ? 'translate-x-7' : 'translate-x-1'
                  }`}
              />
            </button>
          </SettingItem>
        </div>
      </Card>
    </div>
    </LoginRequired>
  );
}
