/** Build the cacheable avatar URL for an employee (null if no photo). */
export function avatarUrl(e: {
  id: string;
  avatar: string | null;
  updatedAt: Date;
}): string | null {
  return e.avatar ? `/avatar/${e.id}?v=${e.updatedAt.getTime()}` : null;
}
