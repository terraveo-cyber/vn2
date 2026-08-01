import React from 'react';
import { 
  Mail, 
  Globe, 
  X, 
  Smartphone, 
  BookOpen, 
  Wrench, 
  PenTool, 
  Accessibility, 
  ExternalLink,
  MessageSquare
} from 'lucide-react';

interface ContactDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ContactDirectoryModal: React.FC<ContactDirectoryModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const contacts = [
    {
      id: 'translator',
      title: 'Verba Nova II App Support',
      email: 'translator@verbanovae.com',
      subject: 'ATTN: VERBA NOVA II TRANSLATOR!!',
      icon: BookOpen,
      badge: 'THIS APP',
      badgeColor: 'bg-[#d4af37]/20 text-[#d4af37] border-[#d4af37]/40',
      description: 'Inquiries, feedback, and feature requests specifically for Verba Nova II translator.'
    },
    {
      id: 'mobile-app',
      title: 'Illuminated Adaptive E-Works Mobile Editor',
      email: 'illuminatedadaptivee-works@verbanovae.com',
      subject: 'ATTN: ILLUMINATED ADAPTIVE E-WORKS!!',
      icon: Smartphone,
      badge: 'MOBILE EDITOR',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      description: 'Questions or support regarding the Illuminated Adaptive E-Works mobile editing application.'
    },
    {
      id: 'support-issues',
      title: 'Software & Application Technical Issues',
      email: 'mason@verbanovae.com',
      subject: 'ATTN: MASON / SOFTWARE SUPPORT!!',
      icon: Wrench,
      badge: 'TECH SUPPORT',
      badgeColor: 'bg-red-500/20 text-red-300 border-red-500/40',
      description: 'Report technical bugs, system errors, or software integration issues with Mason.'
    },
    {
      id: 'ebook-editing',
      title: 'Authors & Publishers Ebook Editing Services',
      email: 'info@verbanovae.com',
      subject: 'ATTN: INFO / EBOOK EDITING INQUIRY!!',
      icon: PenTool,
      badge: 'EDITING & PUBLISHING',
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
      description: 'Professional ebook formatting, classical translation editing, and publishing inquiries.'
    },
    {
      id: 'accessible-services',
      title: 'Accessible Ebook Services & Published Translations',
      email: 'app@verbanovae.com',
      subject: 'ATTN: APP!!',
      icon: Accessibility,
      badge: 'ACCESSIBLE EBOOKS',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      description: 'Inquire about screen-reader accessible ebook files and published modern translated works.'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#161616] border border-[#333] rounded-2xl shadow-2xl max-w-2xl w-full text-[#e0e0e0] flex flex-col max-h-[90vh] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#282828] bg-[#121212]">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-[#d4af37]/15 text-[#d4af37] border border-[#d4af37]/30">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#f0f0f0] flex items-center space-x-2">
                <span>Verba Nova Directory & Contact Links</span>
              </h2>
              <p className="text-xs text-[#888]">
                Direct contact email routing with automated target subject headers
              </p>
            </div>
          </div>

          <button 
            onClick={onClose} 
            className="text-[#888] hover:text-white p-1.5 rounded-lg hover:bg-[#222] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Website Banner */}
        <div className="px-6 py-3 bg-[#181818] border-b border-[#262626] flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2 text-[#aaa]">
            <Globe className="w-4 h-4 text-[#d4af37]" />
            <span>Official Website: <strong className="text-white font-mono">verbanovae.com</strong></span>
          </div>

          <a 
            href="https://verbanovae.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="px-3 py-1 rounded bg-[#252525] hover:bg-[#333] text-[#d4af37] border border-[#d4af37]/40 font-semibold text-[11px] transition flex items-center space-x-1"
          >
            <span>Visit verbanovae.com</span>
            <ExternalLink className="w-3 h-3 ml-0.5" />
          </a>
        </div>

        {/* Contact Email List */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1 bg-[#141414]">
          {contacts.map((item) => {
            const IconComp = item.icon;
            const mailtoUrl = `mailto:${item.email}?subject=${encodeURIComponent(item.subject)}`;

            return (
              <a
                key={item.id}
                href={mailtoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-4 rounded-xl bg-[#1c1c1c] hover:bg-[#242424] border border-[#2d2d2d] hover:border-[#d4af37]/50 transition-all shadow-md group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 rounded-lg bg-[#252525] text-[#d4af37] border border-[#333] shrink-0 mt-0.5">
                      <IconComp className="w-4 h-4" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-sm text-[#f0f0f0] group-hover:text-[#d4af37] transition-colors">
                          {item.title}
                        </h3>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${item.badgeColor}`}>
                          {item.badge}
                        </span>
                      </div>

                      <p className="text-xs text-[#999] leading-relaxed">
                        {item.description}
                      </p>

                      <div className="pt-1 flex flex-wrap items-center gap-x-3 text-[11px] text-[#aaa] font-mono">
                        <span className="text-emerald-400 font-semibold">{item.email}</span>
                        <span className="text-[#555]">•</span>
                        <span className="text-[#888]">Subject: <strong className="text-amber-300 font-normal">{item.subject}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="px-3 py-1.5 rounded-lg bg-[#282828] group-hover:bg-[#d4af37] group-hover:text-black text-[#ccc] text-xs font-semibold transition shrink-0 flex items-center space-x-1 border border-[#383838] group-hover:border-[#d4af37]">
                    <Mail className="w-3.5 h-3.5" />
                    <span>Send Email</span>
                  </div>
                </div>
              </a>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-[#121212] border-t border-[#262626] flex items-center justify-between text-xs text-[#777]">
          <div className="flex items-center space-x-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>All inquiries are routed to our central support team at <strong>verbanovae.com</strong></span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#252525] hover:bg-[#333] text-[#e0e0e0] font-medium transition"
          >
            Close Directory
          </button>
        </div>

      </div>
    </div>
  );
};
