'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Logo from '@/components/Logo'
import WalletButton from '@/components/WalletButton'

const navLinks = [
  { href: '/', label: 'Markets' },
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/agents', label: 'Agents' },
  { href: '/about', label: 'About' },
]

const socialLinks = [
  {
    label: 'X (Twitter)',
    href: 'https://x.com/clawbets',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    label: 'Telegram',
    href: 'https://t.me/clawbets',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8l-1.7 8.01c-.13.59-.47.73-.95.46l-2.62-1.93-1.26 1.22c-.14.14-.26.26-.53.26l.19-2.66 4.83-4.36c.21-.19-.05-.29-.32-.1L7.9 14.49l-2.57-.8c-.56-.17-.57-.56.12-.83l10.03-3.87c.46-.17.87.11.16.81z" />
      </svg>
    ),
  },
  {
    label: 'Discord',
    href: 'https://discord.gg/clawbets',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.033.055a19.908 19.908 0 0 0 5.993 3.03.077.077 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
      </svg>
    ),
  },
]

export default function NavMenu() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 border-b border-[#1a1a2e]/60 bg-[#050507]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3.5">
        {/* Logo */}
        <a href="/" className="flex items-center group">
          <Logo size={36} />
        </a>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1 text-sm">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="px-3.5 py-2 rounded-lg text-zinc-300 hover:text-white hover:bg-white/5 transition-all"
            >
              {link.label}
            </a>
          ))}
          <a
            href="https://github.com/Allen-Saji/clawbets"
            target="_blank"
            rel="noopener"
            className="ml-1 px-3.5 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-all font-mono text-xs"
          >
            GitHub ↗
          </a>
          {/* Social icons */}
          <div className="flex items-center gap-0.5 ml-1 border-l border-white/10 pl-2">
            {socialLinks.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener"
                aria-label={s.label}
                className="p-2 rounded-lg text-zinc-500 hover:text-[#06b6d4] hover:bg-white/5 transition-all"
              >
                {s.icon}
              </a>
            ))}
          </div>
          <div className="ml-2">
            <WalletButton />
          </div>
        </div>

        {/* Mobile: Wallet + Hamburger */}
        <div className="flex md:hidden items-center gap-2">
          <WalletButton />
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-lg text-white hover:bg-white/5 transition-all"
            aria-label="Toggle menu"
          >
            {isOpen ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="md:hidden overflow-hidden border-t border-[#1a1a2e]/60 bg-[#050507]/95"
          >
            <div className="px-4 py-3 flex flex-col gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2.5 rounded-lg text-white hover:bg-white/5 transition-all text-sm font-medium"
                >
                  {link.label}
                </a>
              ))}
              <a
                href="https://github.com/Allen-Saji/clawbets"
                target="_blank"
                rel="noopener"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-all font-mono text-xs"
              >
                GitHub ↗
              </a>
              {/* Social links row */}
              <div className="flex items-center gap-1 px-4 pt-2 border-t border-white/5 mt-1">
                {socialLinks.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener"
                    aria-label={s.label}
                    onClick={() => setIsOpen(false)}
                    className="p-2 rounded-lg text-zinc-400 hover:text-[#06b6d4] hover:bg-white/5 transition-all"
                  >
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
