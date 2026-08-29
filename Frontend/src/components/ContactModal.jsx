import React, { useState } from 'react';
import { X, Send, Mail, User, MessageSquare, CheckCircle, Sparkles } from 'lucide-react';

export default function ContactModal({ isOpen, onClose }) {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', message: '' });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setForm({ name: '', email: '', message: '' });
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#071A1D]/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#0B2426] rounded-3xl shadow-2xl border border-[#214A47] p-6 sm:p-8 overflow-hidden text-white">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#071A1D] hover:bg-[#214A47] text-[#B9C9C6] hover:text-white flex items-center justify-center transition-colors border border-[#214A47]"
        >
          <X className="w-4 h-4" />
        </button>

        {submitted ? (
          <div className="py-10 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-[#35E6A1]/20 text-[#35E6A1] border border-[#35E6A1]/40 flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white">Message Received!</h3>
            <p className="text-sm text-[#B9C9C6]">
              Thanks for reaching out! Our travel team will get back to you shortly.
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#35E6A1] mb-1">
              <Sparkles className="w-4 h-4" />
              <span>We'd Love to Hear From You</span>
            </div>
            <h3 className="text-2xl font-black text-white mb-1">Get in Touch</h3>
            <p className="text-xs sm:text-sm text-[#B9C9C6] mb-6">
              Have questions about TravelGenie AI or need a custom trip consultation? Send us a message.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#B9C9C6] mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#35E6A1]" /> Your Name
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-4 py-3 rounded-xl border border-[#214A47] bg-[#071A1D] text-sm text-white placeholder-[#B9C9C6]/50 focus:outline-none focus:ring-2 focus:ring-[#35E6A1]/40 focus:border-[#35E6A1] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#B9C9C6] mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#35E6A1]" /> Email Address
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="e.g. rahul@example.com"
                  className="w-full px-4 py-3 rounded-xl border border-[#214A47] bg-[#071A1D] text-sm text-white placeholder-[#B9C9C6]/50 focus:outline-none focus:ring-2 focus:ring-[#35E6A1]/40 focus:border-[#35E6A1] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#B9C9C6] mb-1.5 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-[#35E6A1]" /> Message
                </label>
                <textarea
                  rows="3"
                  required
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Tell us what you need..."
                  className="w-full px-4 py-3 rounded-xl border border-[#214A47] bg-[#071A1D] text-sm text-white placeholder-[#B9C9C6]/50 focus:outline-none focus:ring-2 focus:ring-[#35E6A1]/40 focus:border-[#35E6A1] transition-all"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#35E6A1] to-[#4FFFC0] hover:from-[#4FFFC0] hover:to-[#35E6A1] text-[#071A1D] font-black text-sm shadow-lg shadow-[#35E6A1]/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Send Message</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
