'use client';
import { usePathname } from 'next/navigation';

const LINKS = [
  ['/admin', 'Dashboard'],
  ['/admin/products', 'Products & map'],
  ['/admin/content', 'Site text'],
  ['/admin/messages', 'Messages'],
  ['/admin/analytics', 'Analytics'],
  ['/admin/settings', 'Settings']
];

export default function Nav({ unread }) {
  const path = usePathname();
  return (
    <nav className="a-nav" aria-label="Admin">
      {LINKS.map(([href, label]) => {
        const on = href === '/admin' ? path === '/admin' : path.startsWith(href);
        return (
          <a key={href} href={href} aria-current={on ? 'page' : undefined}>
            {label}
            {href === '/admin/messages' && unread > 0 && <span className="a-badge" aria-label={`${unread} unread`}>{unread}</span>}
          </a>
        );
      })}
    </nav>
  );
}
