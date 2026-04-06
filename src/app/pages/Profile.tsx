import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { ChangePasswordModal } from '../components/ChangePasswordModal';

export default function Profile() {
  const router = useRouter();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: 'Basel',
    lastName: 'Ahmed',
    email: 'baselahmed363@gmail.com',
    phone: '(213) 355-7664',
    address: '1425 Ellinwood St, Des Plaines',
    apt: '',
    instructions: '',
  });

  const handleChangePassword = async () => {
    await new Promise((r) => setTimeout(r, 900));
    toast.success('Password updated successfully.');
  };

  return (
    <div className="min-h-screen bg-white" dir="ltr">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 md:px-8 lg:px-12 py-4 z-10">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          <button onClick={() => router.back()} className="hover:opacity-70 transition-opacity">
            <ArrowLeft size={24} className="text-gray-900" strokeWidth={2} />
          </button>
          <h1 className="text-xs font-bold text-gray-900 tracking-wider absolute left-1/2 transform -translate-x-1/2">PROFILE</h1>
          <div className="w-6"></div> {/* Spacer for centering */}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 md:px-8 lg:px-12 py-6 md:py-8">
        {/* Name Fields */}
        <div className="grid grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-5">
          <div>
            <label className="text-gray-400 text-sm md:text-base mb-2 block">First name</label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="w-full bg-gray-50 border-0 rounded-xl px-4 py-4 md:px-5 md:py-5 text-gray-900 text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-[#1D6076]"
            />
          </div>
          <div>
            <label className="text-gray-400 text-sm md:text-base mb-2 block">Last name</label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className="w-full bg-gray-50 border-0 rounded-xl px-4 py-4 md:px-5 md:py-5 text-gray-900 text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-[#1D6076]"
            />
          </div>
        </div>

        {/* Email */}
        <div className="mb-4 md:mb-5">
          <label className="text-gray-400 text-sm md:text-base mb-2 block">Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full bg-gray-50 border-0 rounded-xl px-4 py-4 md:px-5 md:py-5 text-gray-900 text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-[#1D6076]"
          />
        </div>

        {/* Phone */}
        <div className="mb-8 md:mb-12">
          <label className="text-gray-400 text-sm md:text-base mb-2 block">Phone number</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full bg-gray-50 border-0 rounded-xl px-4 py-4 md:px-5 md:py-5 text-gray-900 text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-[#1D6076]"
          />
        </div>

        {/* Address Section */}
        <h2 className="text-xs font-bold text-gray-900 tracking-wider mb-5 md:mb-6">ADDRESS</h2>

        {/* Address */}
        <div className="mb-4 md:mb-5">
          <label className="text-gray-400 text-sm md:text-base mb-2 block">Address</label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="w-full bg-gray-50 border-0 rounded-xl px-4 py-4 md:px-5 md:py-5 text-gray-900 text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-[#1D6076]"
          />
        </div>

        {/* Apt # */}
        <div className="mb-4 md:mb-5">
          <label className="text-gray-400 text-sm md:text-base mb-2 block">Apt # (Optional)</label>
          <input
            type="text"
            value={formData.apt}
            onChange={(e) => setFormData({ ...formData, apt: e.target.value })}
            placeholder=""
            className="w-full bg-gray-50 border-0 rounded-xl px-4 py-4 md:px-5 md:py-5 text-gray-900 text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-[#1D6076] placeholder-gray-300"
          />
        </div>

        {/* Address Instructions */}
        <div className="mb-8 md:mb-12">
          <label className="text-gray-400 text-sm md:text-base mb-2 block">Address instructions</label>
          <textarea
            value={formData.instructions}
            onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
            rows={3}
            placeholder=""
            className="w-full bg-gray-50 border-0 rounded-xl px-4 py-4 md:px-5 md:py-5 text-gray-900 text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-[#1D6076] placeholder-gray-300 resize-none"
          />
        </div>

        {/* Account Help Section */}
        <h2 className="text-xs font-bold text-gray-900 tracking-wider mb-5 md:mb-6">ACCOUNT HELP</h2>

        <div className="space-y-4 md:space-y-5">
          <button
            onClick={() => setShowChangePassword(true)}
            className="text-[#EBA050] text-base md:text-lg font-medium hover:underline"
          >
            Change password
          </button>
          <br />
          <button className="text-[#EBA050] text-base md:text-lg font-medium hover:underline">
            Request account deletion
          </button>
        </div>

        {/* Bottom Spacer */}
        <div className="h-20"></div>
      </div>

      <ChangePasswordModal
        open={showChangePassword}
        onClose={() => setShowChangePassword(false)}
        onSubmit={handleChangePassword}
      />
    </div>
  );
}
