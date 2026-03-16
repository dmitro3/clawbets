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

export default function NavMenu() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 border-b border-[#1a1a2e]/60 bg-[#050507]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3.5">
        {/* Logo */}
        <a href="/" className="flex items-center gap-3 group">
          <Logo size={36} />
          <span className="text-xl font-bold tracking-tight text-white">
            Claw<span className="gradient-text">Bets</span>
          </span>
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
            className="ml-2 px-3.5 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-all font-mono text-xs"
          >
            GitHub ↗
          </a>
          <div className="ml-3">
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
