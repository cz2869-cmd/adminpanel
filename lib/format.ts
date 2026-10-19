export function cafeName(name: string) {
  if (name === name.toUpperCase()) {
    return name
  }
  return name.replace(/\b([a-z])/g, (letter) => letter.toUpperCase())
}

export function personName(
  profile: { first_name: string | null; last_name: string | null } | null
) {
  const name = [profile?.first_name, profile?.last_name]
    .filter(Boolean)
    .join(' ')
    .trim()
  return name || 'Unnamed profile'
}

export function when(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}
