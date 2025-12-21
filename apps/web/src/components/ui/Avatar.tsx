import Image from 'next/image';
import { clsx } from 'clsx';

interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  status?: 'online' | 'offline' | 'away' | 'busy';
  onClick?: () => void;
}

export default function Avatar({
  src,
  alt,
  name,
  size = 'md',
  className,
  status,
  onClick,
}: AvatarProps) {
  const sizes = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
  };

  const statusSizes = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
    xl: 'w-4 h-4',
  };

  const statusColors = {
    online: 'bg-green-500',
    offline: 'bg-gray-400',
    away: 'bg-yellow-500',
    busy: 'bg-red-500',
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div
      className={clsx('relative inline-block', onClick && 'cursor-pointer', className)}
      onClick={onClick}
    >
      {src ? (
        <div className={clsx('rounded-full overflow-hidden', sizes[size])}>
          <Image
            src={src}
            alt={alt || name || 'Avatar'}
            width={64}
            height={64}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div
          className={clsx(
            'rounded-full bg-blue-600 text-white flex items-center justify-center font-medium',
            sizes[size]
          )}
        >
          {name ? getInitials(name) : '?'}
        </div>
      )}
      {status && (
        <span
          className={clsx(
            'absolute bottom-0 right-0 rounded-full border-2 border-white',
            statusSizes[size],
            statusColors[status]
          )}
        />
      )}
    </div>
  );
}

