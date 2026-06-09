import * as React from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost' | 'icon'
  size?: 'default' | 'sm' | 'icon'
}

export function Button({ className, variant = 'primary', size = 'default', children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 font-semibold transition-all rounded-full cursor-pointer disabled:opacity-50',
        variant === 'primary' && 'bg-[#122e53] text-white hover:bg-[#0d2240] shadow-sm',
        variant === 'outline' && 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50',
        variant === 'ghost' && 'bg-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-800',
        variant === 'icon' && 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-500 rounded-lg',
        size === 'default' && 'px-5 py-2 text-sm h-9',
        size === 'sm' && 'px-4 py-1.5 text-xs h-8',
        size === 'icon' && 'w-9 h-9 p-0',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}