'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const groups = [
  {
    title: 'Desk',
    links: [
      { href: '/desk', label: 'Stats' },
      { href: '/profiles', label: 'Users' },
      { href: '/votes', label: 'Votes' },
    ],
  },
  {
    title: 'Generation',
    links: [
      { href: '/suggestions', label: 'AI media' },
      { href: '/requests', label: 'Requests' },
      { href: '/responses', label: 'Responses' },
      { href: '/examples', label: 'Examples' },
    ],
  },
  {
    title: 'Prompts',
    links: [
      { href: '/chains', label: 'Chains' },
      { href: '/steps', label: 'Steps' },
      { href: '/mix', label: 'Mix' },
      { href: '/terms', label: 'Terms' },
    ],
  },
  {
    title: 'Models',
    links: [
      { href: '/providers', label: 'Providers' },
      { href: '/models', label: 'Models' },
    ],
  },
  {
    title: 'Access',
    links: [
      { href: '/domains', label: 'Signup domains' },
      { href: '/whitelist', label: 'Allowed emails' },
    ],
  },
]

export default function DeskNav() {
  const pathname = usePathname()

  return (
    <nav className="nav">
      {groups.map((group) => (
        <div key={group.title}>
          <p className="navGroup">{group.title}</p>
          {group.links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={pathname === link.href ? 'active' : undefined}
            >
              {link.label}
            </Link>
          ))}
        </div>
      ))}
    </nav>
  )
}
