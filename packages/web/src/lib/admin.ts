export function isAdmin(userId: string): boolean {
  const adminIds = (import.meta.env.ADMIN_USER_IDS ?? '')
    .split(',')
    .map((id: string) => id.trim())
    .filter(Boolean);
  return adminIds.includes(userId);
}
