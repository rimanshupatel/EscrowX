'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  id: number;
  label: string;
  description?: string;
}

interface StepProgressProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

export function StepProgress({ steps, currentStep, className }: StepProgressProps) {
  return (
    <div className={cn('flex items-center gap-0', className)}>
      {steps.map((step, index) => {
        const isCompleted = step.id < currentStep;
        const isActive = step.id === currentStep;
        const isLast = index === steps.length - 1;

        return (
          <div key={step.id} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all duration-300',
                  isCompleted
                    ? 'bg-[#5B6BF8] border-[#5B6BF8] text-white'
                    : isActive
                    ? 'bg-white border-[#5B6BF8] text-[#5B6BF8] shadow-md shadow-[#5B6BF8]/20'
                    : 'bg-white border-[#E4E8F0] text-[#9CA3AF]'
                )}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : step.id}
              </div>
              <div className="flex flex-col items-center text-center">
                <span
                  className={cn(
                    'text-[11px] font-semibold uppercase tracking-[0.08em] whitespace-nowrap',
                    isActive ? 'text-[#5B6BF8]' : isCompleted ? 'text-[#0F1117]' : 'text-[#9CA3AF]'
                  )}
                >
                  {step.label}
                </span>
                {step.description && (
                  <span className="text-[10px] text-[#9CA3AF] max-w-20">{step.description}</span>
                )}
              </div>
            </div>

            {!isLast && (
              <div
                className={cn(
                  'flex-1 h-0.5 mx-3 mb-5 transition-all duration-500',
                  isCompleted ? 'bg-[#5B6BF8]' : 'bg-[#E4E8F0]'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
