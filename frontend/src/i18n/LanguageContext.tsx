import React, { createContext, useContext, useState, useEffect, useMemo } from 'react'
import type { Language, TranslationDict } from './types'
import { en } from './en'
import { zhCN } from './zh-CN'

interface LanguageContextValue {
  language: Language
  setLanguage: (lang: Language) => void
  t: TranslationDict
}

const STORAGE_KEY = 'avafence_lang'

const LanguageContext = createContext<LanguageContextValue | null>(null)

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved === 'zh' || saved === 'zh-CN') return 'zh'
        if (saved === 'en') return 'en'
      } catch {}
    }
    return 'en'
  })

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, lang)
      } catch (e) {
        console.warn('Failed to save language preference:', e)
      }
    }
  }

  // Sync if storage changes in another tab
  useEffect(() => {
    if (typeof window === 'undefined') return
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        if (e.newValue === 'zh' || e.newValue === 'zh-CN') setLanguageState('zh')
        else if (e.newValue === 'en') setLanguageState('en')
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const t = useMemo(() => {
    return language === 'zh' ? zhCN : en
  }, [language])

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t
    }),
    [language, t]
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useTranslation(): LanguageContextValue {
  const ctx = useContext(LanguageContext)
  if (!ctx) {
    throw new Error('useTranslation must be used within a LanguageProvider')
  }
  return ctx
}
