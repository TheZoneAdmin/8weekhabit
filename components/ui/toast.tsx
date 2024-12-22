import { CheckCircle, XCircle } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error';
}

export const Toast = ({ message, type = 'success' }: ToastProps) => (
  <div className={`fixed bottom-20 left-4 right-4 md:left-auto md:right-8 md:w-auto 
    ${type === 'success' ? 'bg-green-800' : 'bg-red-800'} 
    text-white p-4 rounded-lg shadow-lg z-50 animate-slide-up`}
  >
    <div className="flex items-center gap-2">
      {type === 'success' ? 
        <CheckCircle className="w-5 h-5" /> : 
        <XCircle className="w-5 h-5" />
      }
      <p className="text-sm">{message}</p>
    </div>
  </div>
);
