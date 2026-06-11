
import { Badge } from '@/components/ui/badge';
export const getRoleBadge = (role: string, _isFr: boolean) => {
  const styles: Record<string, string> = {
    Admin: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
    Manager: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    Employee: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    Tester: 'bg-sky-500/10 text-sky-500 border-sky-500/20'
  };
  return <Badge variant='outline' className={styles[role] + ' backdrop-blur-sm'}>{role}</Badge>;
};
