import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';

type Tab = 'cleaning' | 'delivery' | 'sms';
type RinseDropLocation = 'front' | 'concierge' | 'other';
type SMSOption = 'all' | 'scheduling' | 'service';

export default function Preferences() {
  const [activeTab, setActiveTab] = useState<Tab>('cleaning');
  const [detergent, setDetergent] = useState('Tide');
  const [fabricSoftener, setFabricSoftener] = useState(false);
  const [oxiClean, setOxiClean] = useState(false);
  const [starch, setStarch] = useState('None');
  const [rushService, setRushService] = useState(false);
  const [rinseDropLocation, setRinseDropLocation] = useState<RinseDropLocation>('front');
  const [doNotRing, setDoNotRing] = useState(false);
  const [smsOption, setSmsOption] = useState<SMSOption>('all');

  return (
    <div className="min-h-screen bg-white" dir="ltr">
      {/* Header */}
      <div className="sticky top-0 bg-white px-4 md:px-8 lg:px-12 py-4 z-10">
        <Link href="/" className="inline-block hover:opacity-70 transition-opacity">
          <ArrowLeft size={24} className="text-gray-900" strokeWidth={2} />
        </Link>
      </div>

      <div className="max-w-3xl mx-auto px-4 md:px-8 lg:px-12 pb-8">
        {/* Title */}
        <h1 className="text-2xl md:text-3xl text-gray-900 mb-6 md:mb-8">Preferences</h1>

        {/* Tabs */}
        <div className="flex gap-8 md:gap-10 mb-8 md:mb-10 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('cleaning')}
            className={`pb-3 text-base md:text-lg transition-colors relative ${
              activeTab === 'cleaning'
                ? 'text-gray-900 font-medium'
                : 'text-gray-400'
            }`}
          >
            Cleaning
            {activeTab === 'cleaning' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('delivery')}
            className={`pb-3 text-base md:text-lg transition-colors relative ${
              activeTab === 'delivery'
                ? 'text-gray-900 font-medium'
                : 'text-gray-400'
            }`}
          >
            Delivery
            {activeTab === 'delivery' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('sms')}
            className={`pb-3 text-base md:text-lg transition-colors relative ${
              activeTab === 'sms'
                ? 'text-gray-900 font-medium'
                : 'text-gray-400'
            }`}
          >
            SMS
            {activeTab === 'sms' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900"></div>
            )}
          </button>
        </div>

        {/* Cleaning Tab */}
        {activeTab === 'cleaning' && (
          <div className="space-y-8 md:space-y-10">
            {/* WASH & FOLD */}
            <div>
              <h2 className="text-xs font-bold text-gray-900 tracking-wider mb-5 md:mb-6">WASH & FOLD</h2>
              
              {/* Detergent */}
              <div className="mb-6 md:mb-8">
                <h3 className="text-gray-900 text-base md:text-lg mb-3">Detergent</h3>
                <div className="space-y-2">
                  {['Tide', 'All Free Clear', 'Seventh Generation'].map((option) => (
                    <label key={option} className="flex items-center gap-3 cursor-pointer">
                      <div className="relative">
                        <input
                          type="radio"
                          name="detergent"
                          value={option}
                          checked={detergent === option}
                          onChange={(e) => setDetergent(e.target.value)}
                          className="sr-only peer"
                        />
                        <div className="w-5 h-5 md:w-6 md:h-6 rounded-full border-2 border-gray-300 peer-checked:border-[#EBA050] peer-checked:border-[6px] transition-all"></div>
                      </div>
                      <span className="text-gray-900 text-sm md:text-base">{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Fabric Softener */}
              <div className="flex items-center justify-between py-4 border-b border-gray-100">
                <div>
                  <h3 className="text-gray-900 text-base md:text-lg mb-1">Fabric softener</h3>
                  <p className="text-gray-500 text-sm md:text-base">Add to all my orders.</p>
                </div>
                <label className="relative inline-block w-12 h-6 md:w-14 md:h-7">
                  <input 
                    type="checkbox" 
                    checked={fabricSoftener}
                    onChange={(e) => setFabricSoftener(e.target.checked)}
                    className="peer sr-only" 
                  />
                  <span className="block w-full h-full bg-gray-300 rounded-full peer-checked:bg-[#EBA050] transition-colors cursor-pointer"></span>
                  <span className="absolute left-1 top-1 w-4 h-4 md:w-5 md:h-5 bg-white rounded-full transition-transform peer-checked:translate-x-6"></span>
                </label>
              </div>

              {/* OxiClean */}
              <div className="flex items-center justify-between py-4">
                <div>
                  <h3 className="text-gray-900 text-base md:text-lg mb-1">OxiClean</h3>
                  <p className="text-gray-500 text-sm md:text-base">Add to all my orders.</p>
                </div>
                <label className="relative inline-block w-12 h-6 md:w-14 md:h-7">
                  <input 
                    type="checkbox" 
                    checked={oxiClean}
                    onChange={(e) => setOxiClean(e.target.checked)}
                    className="peer sr-only" 
                  />
                  <span className="block w-full h-full bg-gray-300 rounded-full peer-checked:bg-[#EBA050] transition-colors cursor-pointer"></span>
                  <span className="absolute left-1 top-1 w-4 h-4 md:w-5 md:h-5 bg-white rounded-full transition-transform peer-checked:translate-x-6"></span>
                </label>
              </div>
            </div>

            {/* DRY CLEANING */}
            <div>
              <h2 className="text-xs font-bold text-gray-900 tracking-wider mb-5 md:mb-6">DRY CLEANING</h2>
              
              {/* Starch */}
              <div>
                <h3 className="text-gray-900 text-base md:text-lg mb-3">Starch</h3>
                <div className="space-y-2">
                  {['None', 'Light', 'Medium', 'Heavy'].map((option) => (
                    <label key={option} className="flex items-center gap-3 cursor-pointer">
                      <div className="relative">
                        <input
                          type="radio"
                          name="starch"
                          value={option}
                          checked={starch === option}
                          onChange={(e) => setStarch(e.target.value)}
                          className="sr-only peer"
                        />
                        <div className="w-5 h-5 md:w-6 md:h-6 rounded-full border-2 border-gray-300 peer-checked:border-[#EBA050] peer-checked:border-[6px] transition-all"></div>
                      </div>
                      <span className="text-gray-900 text-sm md:text-base">{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delivery Tab */}
        {activeTab === 'delivery' && (
          <div className="space-y-8 md:space-y-10">
            {/* RUSH SERVICES */}
            <div>
              <h2 className="text-xs font-bold text-gray-900 tracking-wider mb-5 md:mb-6">RUSH SERVICES</h2>
              
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-gray-900 text-base md:text-lg">Wash & Fold</h3>
                    <span className="text-[#1D6076] text-sm md:text-base font-medium">$9.95</span>
                  </div>
                  <p className="text-gray-500 text-sm md:text-base">Add Next-Day Rush Service to all my orders.</p>
                </div>
                <label className="relative inline-block w-12 h-6 md:w-14 md:h-7 ml-4 shrink-0">
                  <input 
                    type="checkbox" 
                    checked={rushService}
                    onChange={(e) => setRushService(e.target.checked)}
                    className="peer sr-only" 
                  />
                  <span className="block w-full h-full bg-gray-300 rounded-full peer-checked:bg-[#EBA050] transition-colors cursor-pointer"></span>
                  <span className="absolute left-1 top-1 w-4 h-4 md:w-5 md:h-5 bg-white rounded-full transition-transform peer-checked:translate-x-6"></span>
                </label>
              </div>
            </div>

            {/* ADDRESS INSTRUCTIONS */}
            <div>
              <h2 className="text-xs font-bold text-gray-900 tracking-wider mb-5 md:mb-6">ADDRESS INSTRUCTIONS</h2>
              
              {/* Rinse Drop */}
              <div className="mb-8 md:mb-10">
                <h3 className="text-gray-900 text-base md:text-lg mb-2">Rinse Drop</h3>
                <p className="text-gray-500 text-sm md:text-base mb-4 md:mb-5 leading-relaxed">
                  With Rinse Drop, Valets pick up and deliver your orders without you being present. To enable, select where your orders should be delivered:
                </p>
                
                <div className="flex gap-2 md:gap-3">
                  <button
                    onClick={() => setRinseDropLocation('front')}
                    className={`flex-1 py-3 md:py-4 px-3 md:px-4 rounded-xl text-sm md:text-base font-medium transition-all ${
                      rinseDropLocation === 'front'
                        ? 'bg-gray-900 text-white'
                        : 'bg-white border border-gray-200 text-gray-900 hover:border-gray-300'
                    }`}
                  >
                    Front door
                  </button>
                  <button
                    onClick={() => setRinseDropLocation('concierge')}
                    className={`flex-1 py-3 md:py-4 px-3 md:px-4 rounded-xl text-sm md:text-base font-medium transition-all ${
                      rinseDropLocation === 'concierge'
                        ? 'bg-gray-900 text-white'
                        : 'bg-white border border-gray-200 text-gray-900 hover:border-gray-300'
                    }`}
                  >
                    Concierge
                  </button>
                  <button
                    onClick={() => setRinseDropLocation('other')}
                    className={`flex-1 py-3 md:py-4 px-3 md:px-4 rounded-xl text-sm md:text-base font-medium transition-all ${
                      rinseDropLocation === 'other'
                        ? 'bg-gray-900 text-white'
                        : 'bg-white border border-gray-200 text-gray-900 hover:border-gray-300'
                    }`}
                  >
                    Other place
                  </button>
                </div>
              </div>

              {/* Arrival */}
              <div>
                <h3 className="text-gray-900 text-base md:text-lg mb-2">Arrival</h3>
                <p className="text-gray-500 text-sm md:text-base mb-4">
                  Sleeping children or pets? Ensure that your Valet does not ring your doorbell.
                </p>
                
                <div className="flex items-center justify-between">
                  <h4 className="text-gray-900 text-base md:text-lg">Do not ring doorbell</h4>
                  <label className="relative inline-block w-12 h-6 md:w-14 md:h-7">
                    <input 
                      type="checkbox" 
                      checked={doNotRing}
                      onChange={(e) => setDoNotRing(e.target.checked)}
                      className="peer sr-only" 
                    />
                    <span className="block w-full h-full bg-gray-300 rounded-full peer-checked:bg-[#EBA050] transition-colors cursor-pointer"></span>
                    <span className="absolute left-1 top-1 w-4 h-4 md:w-5 md:h-5 bg-white rounded-full transition-transform peer-checked:translate-x-6"></span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SMS Tab */}
        {activeTab === 'sms' && (
          <div>
            <p className="text-gray-700 text-sm md:text-base leading-relaxed mb-8 md:mb-10">
              We use your phone number primarily to text you about your order status, Valet arrival time, and other important information regarding your order.
            </p>

            <div>
              <h2 className="text-xs font-bold text-gray-900 tracking-wider mb-5 md:mb-6">RECEIVE THE FOLLOWING TEXT NOTIFICATIONS:</h2>
              
              <div className="space-y-5 md:space-y-6">
                {/* All */}
                <label className="flex items-start gap-3 cursor-pointer">
                  <div className="relative pt-0.5">
                    <input
                      type="radio"
                      name="sms"
                      value="all"
                      checked={smsOption === 'all'}
                      onChange={(e) => setSmsOption(e.target.value as SMSOption)}
                      className="sr-only peer"
                    />
                    <div className="w-5 h-5 md:w-6 md:h-6 rounded-full border-2 border-gray-300 peer-checked:border-[#EBA050] peer-checked:border-[6px] transition-all"></div>
                  </div>
                  <div>
                    <div className="text-gray-900 text-base md:text-lg mb-1">All</div>
                    <div className="text-gray-500 text-sm md:text-base">Promotional, scheduling, and service.</div>
                  </div>
                </label>

                {/* Scheduling and service only */}
                <label className="flex items-start gap-3 cursor-pointer">
                  <div className="relative pt-0.5">
                    <input
                      type="radio"
                      name="sms"
                      value="scheduling"
                      checked={smsOption === 'scheduling'}
                      onChange={(e) => setSmsOption(e.target.value as SMSOption)}
                      className="sr-only peer"
                    />
                    <div className="w-5 h-5 md:w-6 md:h-6 rounded-full border-2 border-gray-300 peer-checked:border-[#EBA050] peer-checked:border-[6px] transition-all"></div>
                  </div>
                  <div>
                    <div className="text-gray-900 text-base md:text-lg mb-1">Scheduling and service only</div>
                    <button className="text-[#EBA050] text-sm md:text-base hover:underline">See an example</button>
                  </div>
                </label>

                {/* Service only */}
                <label className="flex items-start gap-3 cursor-pointer">
                  <div className="relative pt-0.5">
                    <input
                      type="radio"
                      name="sms"
                      value="service"
                      checked={smsOption === 'service'}
                      onChange={(e) => setSmsOption(e.target.value as SMSOption)}
                      className="sr-only peer"
                    />
                    <div className="w-5 h-5 md:w-6 md:h-6 rounded-full border-2 border-gray-300 peer-checked:border-[#EBA050] peer-checked:border-[6px] transition-all"></div>
                  </div>
                  <div>
                    <div className="text-gray-900 text-base md:text-lg mb-1">Service only</div>
                    <button className="text-[#EBA050] text-sm md:text-base hover:underline">Learn more</button>
                  </div>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}