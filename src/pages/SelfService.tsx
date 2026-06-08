import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { MonitorSmartphone, Wrench, CheckCircle2, ChevronRight, AlertCircle } from 'lucide-react';

export const SelfService: React.FC = () => {
  const [step, setStep] = useState(1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Self-Service Portal</h1>
        <p className="text-muted-foreground mt-1">Request new equipment or report issues with your current gear.</p>
      </div>

      <Tabs defaultValue="request" className="w-full">
        <TabsList className="w-full max-w-md bg-secondary/50 border border-border">
          <TabsTrigger value="request" className="flex-1 data-[state=active]:bg-card data-[state=active]:text-primary">Request Equipment</TabsTrigger>
          <TabsTrigger value="maintenance" className="flex-1 data-[state=active]:bg-card data-[state=active]:text-primary">Maintenance Tickets</TabsTrigger>
        </TabsList>

        <TabsContent value="request" className="mt-6">
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="border-b border-border bg-secondary/30">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-foreground">New Reservation Request</CardTitle>
                  <CardDescription>Follow the steps to request hardware.</CardDescription>
                </div>
                {/* Stepper */}
                <div className="hidden sm:flex items-center gap-2 text-sm">
                  <span className={`font-medium ${step >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>1. Category</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  <span className={`font-medium ${step >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>2. Selection</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  <span className={`font-medium ${step >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>3. Details</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {step === 1 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                  <h3 className="text-lg font-medium text-foreground">What do you need?</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {['Laptop', 'Monitor', 'Peripheral'].map((cat) => (
                      <div 
                        key={cat}
                        className="p-6 rounded-lg border-2 border-border bg-secondary/20 hover:border-primary hover:bg-primary/5 cursor-pointer transition-all flex flex-col items-center text-center gap-3"
                        onClick={() => setStep(2)}
                      >
                        <MonitorSmartphone className="w-8 h-8 text-primary" />
                        <span className="font-semibold text-foreground">{cat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-foreground">Select an available Laptop</h3>
                    <Button variant="ghost" size="sm" onClick={() => setStep(1)}>Back</Button>
                  </div>
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center justify-between p-4 rounded-lg border border-border bg-secondary/10 hover:bg-secondary transition-colors cursor-pointer" onClick={() => setStep(3)}>
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-card rounded shadow-sm border border-border">
                            <MonitorSmartphone className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">MacBook Pro 14" (Standard Issue)</p>
                            <p className="text-sm text-muted-foreground">M3 Pro, 18GB RAM, 512GB SSD</p>
                          </div>
                        </div>
                        <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20">Available</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-foreground">Finalize Request</h3>
                    <Button variant="ghost" size="sm" onClick={() => setStep(2)}>Back</Button>
                  </div>
                  <div className="grid gap-4 max-w-xl">
                    <div className="space-y-2">
                      <Label htmlFor="date" className="text-foreground">Required By Date</Label>
                      <Input type="date" id="date" className="bg-card border-border" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notes" className="text-foreground">Justification / Notes</Label>
                      <textarea 
                        id="notes" 
                        rows={4}
                        className="w-full p-3 rounded-md bg-card border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="Why do you need this equipment?"
                      ></textarea>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
            {step === 3 && (
              <CardFooter className="border-t border-border bg-secondary/30 p-6 flex justify-end">
                <Button className="bg-primary text-primary-foreground">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Submit Request
                </Button>
              </CardFooter>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Kanban Columns */}
            {['Pending', 'In Progress', 'Resolved'].map((col, index) => (
              <div key={col} className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    {index === 0 && <AlertCircle className="w-4 h-4 text-amber-500" />}
                    {index === 1 && <Wrench className="w-4 h-4 text-blue-500" />}
                    {index === 2 && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                    {col}
                  </h3>
                  <Badge variant="secondary" className="bg-secondary text-muted-foreground">{index === 0 ? 2 : 1}</Badge>
                </div>
                
                {/* Mock Ticket Card */}
                {index === 0 && (
                  <Card className="border-border bg-card shadow-sm cursor-pointer hover:border-primary/50 transition-colors">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge className="bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border-rose-500/20">Critical</Badge>
                        <span className="text-xs text-muted-foreground font-mono">#TKT-892</span>
                      </div>
                      <p className="font-medium text-sm text-foreground">Screen flickering randomly</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MonitorSmartphone className="w-3 h-3" />
                        Dell UltraSharp 32"
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
