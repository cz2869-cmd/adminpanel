'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/desk', label: 'Stats' },
  { href: '/profiles', label: 'Profiles' },
  { href: '/suggestions', label: 'Suggestions' },
  { href: '/votes', label: 'Votes' },
]

export default function DeskNav() {
  const pathname = usePathname()

  return (
    <nav className="nav">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={pathname === link.href ? 'active' : undefined}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  )
}
