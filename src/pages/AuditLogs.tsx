import React, { useEffect, useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
} from '@/components/ui/dialog';
import type { AuditLog, AuditAction } from '@/types';
import { ShieldAlert, Eye } from 'lucide-react';
import { apiClient } from '@/api/apiClient';

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<AuditLog[]>('/auditlog');
      setLogs(response.data || []);
    } catch (err) {
      console.error('Failed to load audit logs', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getActionBadge = (action: AuditAction) => {
    switch (action) {
      case 'Created':
        return <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20">Created</Badge>;
      case 'Updated':
        return <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/20">Updated</Badge>;
      case 'Deleted':
        return <Badge className="bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border-rose-500/20">Deleted</Badge>;
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  const renderJsonPretty = (jsonStr?: string) => {
    if (!jsonStr) return <span className="text-muted-foreground italic text-xs">No records</span>;
    try {
      const parsed = JSON.parse(jsonStr);
      return (
        <pre className="text-xs font-mono p-3 bg-secondary/80 rounded border border-border text-foreground overflow-auto max-h-[250px]">
          {JSON.stringify(parsed, null, 2)}
        </pre>
      );
    } catch {
      return (
        <pre className="text-xs font-mono p-3 bg-secondary/80 rounded border border-border text-foreground overflow-auto max-h-[250px]">
          {jsonStr}
        </pre>
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Security Audit Logs</h1>
          <p className="text-muted-foreground mt-1">Review system changes, asset modifications, and operator history.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-muted-foreground animate-pulse">Loading audit journal...</div>
        </div>
      ) : (
        <div className="border border-border rounded-lg bg-card overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead>Timestamp</TableHead>
                <TableHead>Entity Type</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity ID</TableHead>
                <TableHead>Performed By</TableHead>
                <TableHead className="text-right">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No logs found.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => {
                  const userName = log.performed_by 
                    ? `${log.performed_by.first_name} ${log.performed_by.last_name}` 
                    : 'System Admin';

                  return (
                    <TableRow key={log.id} className="border-border hover:bg-secondary/30 transition-colors">
                      <TableCell className="text-muted-foreground text-sm font-mono">
                        {new Date(log.performed_at).toLocaleString()}
                      </TableCell>
                      <TableCell className="font-medium text-foreground">{log.entity_type}</TableCell>
                      <TableCell>{getActionBadge(log.action)}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{log.entity_id}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{userName}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          onClick={() => setSelectedLog(log)} 
                          size="sm" 
                          variant="outline" 
                          className="border-border hover:bg-secondary flex items-center gap-1 ml-auto"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View Data
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Log Details Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="sm:max-w-2xl border-border bg-card">
          <DialogHeader>
            <DialogTitle className="text-lg text-foreground flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-primary" />
              Audit Transaction Data
            </DialogTitle>
            <DialogDescription>
              Inspection of state changes recorded on {selectedLog && new Date(selectedLog.performed_at).toLocaleString()}.
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4 text-sm bg-secondary/30 p-3 rounded border border-border">
                <div>
                  <span className="text-xs text-muted-foreground uppercase block font-semibold">Entity Type</span>
                  <span className="text-foreground font-medium">{selectedLog.entity_type}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground uppercase block font-semibold">Entity Unique ID</span>
                  <span className="font-mono text-xs text-foreground block truncate">{selectedLog.entity_id}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground uppercase block font-semibold">Action Performed</span>
                  <span className="mt-0.5 block">{getActionBadge(selectedLog.action)}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground uppercase block font-semibold">Operator</span>
                  <span className="text-foreground font-medium block">
                    {selectedLog.performed_by 
                      ? `${selectedLog.performed_by.first_name} ${selectedLog.performed_by.last_name} (${selectedLog.performed_by.email})` 
                      : 'System Admin'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Before State (Old Values)</label>
                  {renderJsonPretty(selectedLog.old_values)}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">After State (New Values)</label>
                  {renderJsonPretty(selectedLog.new_values)}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
