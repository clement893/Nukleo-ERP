import { clsx } from 'clsx';

interface DividerProps {
  className?: string;
  vertical?: boolean;
  label?: string;
}

export default function Divider({
  className,
  vertical = false,
  label,
}: DividerProps) {
  if (vertical) {
    return (
      <div
        className={clsx('w-px bg-gray-200 self-stretch', className)}
        role="separator"
      />
    );
  }

  if (label) {
    return (
      <div className={clsx('relative flex items-center py-4', className)}>
        <div className="flex-grow border-t border-gray-200" />
        <span className="px-4 text-sm text-gray-500">{label}</span>
        <div className="flex-grow border-t border-gray-200" />
      </div>
    );
  }

  return (
    <hr
      className={clsx('border-t border-gray-200', className)}
      role="separator"
    />
  );
}

