export type SourceBadgeVariant = "default" | "secondary" | "outline";

export function getSourceBadgeVariant(source: string): SourceBadgeVariant {
  const variants: Record<string, SourceBadgeVariant> = {
    mattspickleball: 'default',
    pickleballeffect: 'secondary',
    pickleballstudio: 'outline',
  };

  return variants[source] || 'outline';
}
