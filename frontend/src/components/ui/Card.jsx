import { cn } from '../../lib/cn.js';

export function Card({ as: Tag = 'div', className, children, ...props }) {
  return (
    <Tag className={cn('rounded-card bg-surface shadow-card ring-1 ring-line/70', className)} {...props}>
      {children}
    </Tag>
  );
}
