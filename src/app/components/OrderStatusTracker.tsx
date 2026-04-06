import { AlertCircle, Package, CheckCircle, Truck } from 'lucide-react';

interface Step {
  label: string;
  icon: typeof AlertCircle;
  color: string;
}

const steps: Step[] = [
  { label: 'New Order', icon: AlertCircle, color: 'bg-[#1D6076]' },
  { label: 'In Progress', icon: Package, color: 'bg-[#EBA050]' },
  { label: 'Ready', icon: CheckCircle, color: 'bg-green-500' },
  { label: 'Delivered', icon: Truck, color: 'bg-gray-500' },
];

interface OrderStatusTrackerProps {
  currentStatus: 'new' | 'in_progress' | 'ready' | 'delivered';
}

export function OrderStatusTracker({ currentStatus }: OrderStatusTrackerProps) {
  const statusMap = {
    new: 0,
    in_progress: 1,
    ready: 2,
    delivered: 3,
  };

  const currentIndex = statusMap[currentStatus];

  return (
    <div className="flex items-center justify-between px-2">
      {steps.map((step, index) => {
        const Icon = step.icon;
        const isCompleted = index <= currentIndex;
        const isActive = index === currentIndex;

        return (
          <div key={index} className="flex flex-col items-center flex-1">
            {/* Line before */}
            {index > 0 && (
              <div className="absolute -translate-x-1/2 h-1 left-0 right-0 -z-10" style={{ width: '25%', right: `${75 - (index - 1) * 25}%` }}>
                <div className={`h-full ${isCompleted ? 'bg-[#1D6076]' : 'bg-gray-300'}`} />
              </div>
            )}
            
            {/* Icon */}
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center mb-2 ${
                isCompleted ? 'bg-[#1D6076]' : 'bg-gray-300'
              } ${isActive ? 'ring-4 ring-[#1D6076]/20' : ''}`}
            >
              <Icon size={20} className="text-white" strokeWidth={2} />
            </div>
            
            {/* Label */}
            <p
              className={`text-xs text-center font-medium ${
                isCompleted ? 'text-gray-900' : 'text-gray-400'
              }`}
            >
              {step.label}
            </p>
          </div>
        );
      })}
    </div>
  );
}