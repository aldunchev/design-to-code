'use client'

import { Button } from '@/components/ui/button'
import { FileText, Camera } from 'lucide-react'

interface TabNavigationProps {
  activeTab: 'figma' | 'screenshot'
  onTabChange: (tab: 'figma' | 'screenshot') => void
  disabled?: boolean
}

export function TabNavigation({ activeTab, onTabChange, disabled }: TabNavigationProps) {
  return (
    <div className="flex space-x-1 rounded-lg bg-slate-100 p-1">
      <Button
        variant={activeTab === 'figma' ? 'default' : 'ghost'}
        size="sm"
        className={`flex-1 ${activeTab === 'figma' ? 'bg-primary shadow-sm' : ''}`}
        onClick={() => onTabChange('figma')}
        disabled={disabled}
      >
        <FileText className="mr-2 h-4 w-4" />
        Extract from Figma
      </Button>
      <Button
        variant={activeTab === 'screenshot' ? 'default' : 'ghost'}
        size="sm"
        className={`flex-1 ${activeTab === 'screenshot' ? 'bg-primary shadow-sm' : ''}`}
        onClick={() => onTabChange('screenshot')}
        disabled={disabled}
      >
        <Camera className="mr-2 h-4 w-4" />
        Analyze Components
      </Button>
    </div>
  )
}
