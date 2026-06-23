import React, { useState, useEffect } from 'react';
import { mentorService } from '../../services/api';
import { Crown, Search, X, UserMinus, Plus, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, Button, Modal, Badge } from '../../components/ui';

export default function AdminMentorSuggestions() {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingSlot, setUpdatingSlot] = useState(null);

  useEffect(() => {
    fetchMentors();
  }, []);

  const fetchMentors = async () => {
    try {
      setLoading(true);
      const res = await mentorService.getAdminSuggestions();
      if (res.data?.success) {
        setMentors(res.data.data || []);
      } else {
        toast.error('Không thể lấy danh sách mentor');
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRank = async (mentorId, rank) => {
    setUpdatingSlot(rank || 'remove');
    try {
      const res = await mentorService.updateSuggestionRank(mentorId, rank);
      if (res.data?.success) {
        toast.success(rank ? `Đã đề xuất mentor vào vị trí ${rank}` : 'Đã gỡ đề xuất mentor');
        await fetchMentors();
        setShowModal(false);
      } else {
        toast.error(res.data?.message || 'Không thể cập nhật đề xuất');
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra khi cập nhật');
    } finally {
      setUpdatingSlot(null);
    }
  };

  const openAssignModal = (slotNum) => {
    setSelectedSlot(slotNum);
    setSearchTerm('');
    setShowModal(true);
  };

  // Lọc danh sách mentor cho modal tìm kiếm
  const filteredMentors = mentors.filter(mentor => {
    const matchesSearch = 
      mentor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mentor.email?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Tìm mentor cho từng slot 1 -> 10
  const getMentorInSlot = (slotNum) => {
    return mentors.find(m => m.mentorProfile?.featuredRank === slotNum);
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 glass-hero glass-hero-purple px-6 py-8 rounded-2xl">
        <div>
          <h1 className="text-3xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
            <Crown className="w-8 h-8 text-amber-500 fill-amber-400" />
            Quản lý Đề xuất Top Mentor
          </h1>
          <p className="text-sm text-slate-700 dark:text-gray-300 mt-2 max-w-2xl">
            Admin có thể thiết lập thứ tự hiển thị của 10 mentor nổi bật nhất. Thứ tự này sẽ được hiển thị ưu tiên tại mục "Top mentor" của trang Mentors và mục "Mentor Nổi Bật" ở trang chủ.
          </p>
        </div>
        <div className="flex-shrink-0">
          <Badge variant="warning" className="text-sm py-1.5 px-3 border border-amber-400/30">
            Tính năng Admin
          </Badge>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="glass-card h-48 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(10)].map((_, index) => {
            const slotNum = index + 1;
            const mentor = getMentorInSlot(slotNum);

            return (
              <Card 
                key={slotNum} 
                className={`relative overflow-hidden border transition-all duration-300 flex flex-col justify-between min-h-[220px] ${
                  mentor 
                    ? 'border-amber-400/40 bg-amber-400/5 shadow-lg shadow-amber-500/5' 
                    : 'border-dashed border-gray-300 dark:border-white/10 bg-white/20 dark:bg-white/5'
                }`}
                noPadding
              >
                {/* Badge chỉ số vị trí */}
                <div className="absolute top-2 left-2 w-7 h-7 rounded-full bg-slate-900/80 text-white flex items-center justify-center font-bold text-xs shadow-md border border-white/20 z-10">
                  #{slotNum}
                </div>

                <div className="p-4 pt-8 flex flex-col items-center text-center flex-1">
                  {mentor ? (
                    <>
                      <div className="relative group">
                        <img 
                          src={mentor.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${mentor.name}`} 
                          alt={mentor.name} 
                          className="w-16 h-16 rounded-full object-cover border-2 border-amber-400/60 shadow-md group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-900 rounded-full p-0.5 border border-white">
                          <Crown className="w-3.5 h-3.5 fill-current" />
                        </div>
                      </div>

                      <h3 className="font-bold text-sm text-slate-900 dark:text-white mt-3 line-clamp-1 hover:text-amber-500 transition-colors" title={mentor.name}>
                        {mentor.name}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate w-full mt-0.5">
                        {mentor.mentorProfile?.title || 'Mentor'}
                      </p>
                      
                      {mentor.mentorProfile?.expertise?.length > 0 && (
                        <div className="flex flex-wrap gap-1 justify-center mt-2">
                          {mentor.mentorProfile.expertise.slice(0, 2).map((exp, i) => (
                            <Badge key={i} variant="primary" size="sm" className="text-[10px] py-0 px-1.5">
                              {exp}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full py-4 text-gray-400 dark:text-gray-500">
                      <div className="w-12 h-12 rounded-full border-2 border-dashed border-gray-300 dark:border-white/10 flex items-center justify-center mb-2">
                        <Plus className="w-5 h-5 text-gray-400" />
                      </div>
                      <span className="text-xs font-semibold">Chưa có đề xuất</span>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500">Vị trí {slotNum}</span>
                    </div>
                  )}
                </div>

                {/* Actions ở góc dưới */}
                <div className="p-3 border-t glass-divider w-full bg-black/5 dark:bg-white/5 flex gap-2">
                  {mentor ? (
                    <>
                      <Button
                        size="xs"
                        variant="danger"
                        onClick={() => handleUpdateRank(mentor._id, null)}
                        disabled={updatingSlot !== null}
                        className="w-full flex items-center justify-center gap-1 py-1.5 text-xs"
                      >
                        <UserMinus className="w-3.5 h-3.5" />
                        Gỡ đề xuất
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="xs"
                      variant="primary"
                      onClick={() => openAssignModal(slotNum)}
                      className="w-full flex items-center justify-center gap-1 py-1.5 text-xs bg-primary-500/80 hover:bg-primary-500 text-white font-medium"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Đề xuất
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal Chọn Mentor */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={`Chọn Mentor cho Vị trí #${selectedSlot}`}
        size="lg"
      >
        <div className="space-y-4">
          {/* Ô tìm kiếm */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm mentor theo tên hoặc email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="glass-input w-full pl-10 pr-4 py-2.5"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Danh sách mentor */}
          <div className="max-h-96 overflow-y-auto space-y-2 pr-1 scrollbar-hide">
            {filteredMentors.length > 0 ? (
              filteredMentors.map((mentor) => {
                const currentRank = mentor.mentorProfile?.featuredRank;
                const isAssigned = currentRank !== null && currentRank !== undefined;
                const isCurrentlyAssignedToThisSlot = currentRank === selectedSlot;

                return (
                  <div 
                    key={mentor._id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-200 ${
                      isCurrentlyAssignedToThisSlot
                        ? 'border-amber-400 bg-amber-400/5'
                        : isAssigned 
                          ? 'border-gray-200 dark:border-white/5 bg-gray-100/50 dark:bg-white/5 opacity-75' 
                          : 'border-gray-100 dark:border-white/5 bg-white/40 dark:bg-white/5 hover:border-primary-400/40 hover:bg-primary-500/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img 
                        src={mentor.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${mentor.name}`} 
                        alt={mentor.name} 
                        className="w-10 h-10 rounded-full object-cover border border-white/20"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                            {mentor.name}
                          </p>
                          {isAssigned && (
                            <Badge variant="warning" size="sm" className="text-[10px] py-0 px-1">
                              Vị trí {currentRank}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {mentor.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isCurrentlyAssignedToThisSlot ? (
                        <span className="text-xs font-semibold text-amber-500 flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 fill-current" />
                          Đang chọn
                        </span>
                      ) : (
                        <Button
                          size="xs"
                          variant={isAssigned ? 'outline' : 'primary'}
                          onClick={() => handleUpdateRank(mentor._id, selectedSlot)}
                          disabled={updatingSlot !== null}
                          className="text-xs py-1.5 px-3"
                        >
                          {isAssigned ? 'Chuyển sang vị trí này' : 'Gán vị trí này'}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-500">
                Không tìm thấy mentor nào phù hợp.
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
