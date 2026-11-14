import type { HTMLAttributes } from 'react';
export function Badge({className='',...props}:HTMLAttributes<HTMLSpanElement>) {
  return <span {...props} className={`cf-badge ${className}`.trim()} />;
}
