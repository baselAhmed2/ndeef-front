"use client";

import Link from 'next/link';
import { ArrowLeft, MessageCircle, Mail, Phone, ChevronRight } from 'lucide-react';
import { useState } from "react";
import { ChatWidget } from "@/app/components/chat/ChatWidget";

const faqItems = [
  {
    question: 'How does Rinse work?',
    answer: 'We pickup your laundry, clean it professionally, and deliver it back to you.',
  },
  {
    question: 'What are your service areas?',
    answer: 'We currently serve major metropolitan areas. Check our website for availability.',
  },
  {
    question: 'How much does it cost?',
    answer: 'Pricing varies by service type. Visit our Services & Pricing page for details.',
  },
  {
    question: 'Can I cancel or reschedule?',
    answer: 'Yes! You can reschedule or cancel anytime before your pickup.',
  },
];

export default function Help() {
  const [chatOpen, setChatOpen] = useState(false);
  return (
    <div className="min-h-screen bg-white" dir="ltr">
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 md:px-8 lg:px-12 py-4 z-10">
        <Link href="/" className="inline-block hover:opacity-70 transition-opacity">
          <ArrowLeft size={24} className="text-gray-900" strokeWidth={2} />
        </Link>
      </div>

      <div className="max-w-3xl mx-auto px-4 md:px-8 lg:px-12 py-6 md:py-8">
        <h1 className="text-2xl md:text-3xl text-gray-900 mb-6 md:mb-8">Help & Support</h1>

        {/* Contact Options */}
        <div className="mb-8 md:mb-10">
          <h2 className="text-xs font-bold text-gray-900 tracking-wider mb-4 md:mb-5">CONTACT US</h2>
          <div className="space-y-3 md:space-y-4">
            <button
              type="button"
              onClick={() => setChatOpen(true)}
              className="w-full bg-white border border-gray-200 rounded-2xl p-4 md:p-5 flex items-center gap-4 hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 md:w-14 md:h-14 bg-[#1D6076]/10 rounded-xl flex items-center justify-center shrink-0">
                <MessageCircle size={20} className="text-[#1D6076] md:w-6 md:h-6" strokeWidth={2} />
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-gray-900 font-medium text-base md:text-lg">Live Chat</h3>
                <p className="text-sm md:text-base text-gray-600">Chat with our support team</p>
              </div>
              <ChevronRight size={20} className="text-gray-400 shrink-0" strokeWidth={2} />
            </button>

            <a href="mailto:support@rinse.com" className="block w-full bg-white border border-gray-200 rounded-2xl p-4 md:p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-[#1D6076]/10 rounded-xl flex items-center justify-center shrink-0">
                <Mail size={20} className="text-[#1D6076] md:w-6 md:h-6" strokeWidth={2} />
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-gray-900 font-medium text-base md:text-lg">Email</h3>
                <p className="text-sm md:text-base text-gray-600">support@rinse.com</p>
              </div>
              <ChevronRight size={20} className="text-gray-400 shrink-0" strokeWidth={2} />
            </a>

            <a href="tel:+15551234567" className="block w-full bg-white border border-gray-200 rounded-2xl p-4 md:p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-[#1D6076]/10 rounded-xl flex items-center justify-center shrink-0">
                <Phone size={20} className="text-[#1D6076] md:w-6 md:h-6" strokeWidth={2} />
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-gray-900 font-medium text-base md:text-lg">Phone</h3>
                <p className="text-sm md:text-base text-gray-600">+1 (555) 123-4567</p>
              </div>
              <ChevronRight size={20} className="text-gray-400 shrink-0" strokeWidth={2} />
            </a>
          </div>
        </div>

        {/* FAQ */}
        <div>
          <h2 className="text-xs font-bold text-gray-900 tracking-wider mb-4 md:mb-5">FREQUENTLY ASKED QUESTIONS</h2>
          <div className="space-y-3 md:space-y-4">
            {faqItems.map((item, index) => (
              <details key={index} className="bg-white border border-gray-200 rounded-2xl overflow-hidden group">
                <summary className="p-4 md:p-5 cursor-pointer flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <h3 className="text-gray-900 font-medium text-base md:text-lg pr-4">{item.question}</h3>
                  <ChevronRight size={20} className="text-gray-400 transform group-open:rotate-90 transition-transform shrink-0" strokeWidth={2} />
                </summary>
                <div className="px-4 md:px-5 pb-4 md:pb-5 text-sm md:text-base text-gray-600 leading-relaxed">
                  {item.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </div>

      {chatOpen && <ChatWidget onClose={() => setChatOpen(false)} />}
    </div>
  );
}