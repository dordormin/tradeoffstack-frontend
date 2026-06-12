import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';

import { DatePicker } from '@/components/ui/date-picker';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { MonitorSmartphone, Wrench, CheckCircle2, ChevronRight, AlertCircle } from 'lucide-react';
import { CATEGORY_IMAGES } from '@/utils/assetImages';
import { useTranslation } from '@/context/LanguageContext';

export const SelfService: React.FC = () => {
  const { language } = useTranslation();
  const isFr = language === 'fr';
  const [step, setStep] = useState(1);
  const [requiredDate, setRequiredDate] = useState<string>('');

  const getCategoryLabel = (cat: string) => {
    if (!isFr) return cat;
    switch (cat) {
      case 'Laptop': return 'Ordinateur portable';
      case 'Monitor': return 'Écran';
      case 'Peripheral': return 'Périphérique';
      default: return cat;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {isFr ? 'Portail libre-service' : 'Self-Service Portal'}
        </h1>
        <p className="text-muted-foreground mt-1">
          {isFr ? 'Demandez de nouveaux équipements ou signalez des pannes avec votre matériel actuel.' : 'Request new equipment or report issues with your current gear.'}
        </p>
      </div>

      <Tabs defaultValue="request" className="w-full">
        <TabsList className="w-full max-w-md bg-secondary/50 border border-border">
          <TabsTrigger value="request" className="flex-1 data-[state=active]:bg-card data-[state=active]:text-primary cursor-pointer">
            {isFr ? 'Demander du matériel' : 'Request Equipment'}
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="flex-1 data-[state=active]:bg-card data-[state=active]:text-primary cursor-pointer">
            {isFr ? 'Tickets de maintenance' : 'Maintenance Tickets'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="request" className="mt-6">
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="border-b border-border bg-secondary/30">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-foreground">
                    {isFr ? 'Nouvelle demande de réservation' : 'New Reservation Request'}
                  </CardTitle>
                  <CardDescription>
                    {isFr ? 'Suivez les étapes pour demander du matériel.' : 'Follow the steps to request hardware.'}
                  </CardDescription>
                </div>
                {/* Stepper */}
                <div className="hidden sm:flex items-center gap-2 text-sm">
                  <span className={`font-medium ${step >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
                    {isFr ? '1. Catégorie' : '1. Category'}
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  <span className={`font-medium ${step >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
                    {isFr ? '2. Sélection' : '2. Selection'}
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  <span className={`font-medium ${step >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
                    {isFr ? '3. Détails' : '3. Details'}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {step === 1 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                  <h3 className="text-lg font-medium text-foreground">
                    {isFr ? 'De quoi avez-vous besoin ?' : 'What do you need?'}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {['Laptop', 'Monitor', 'Peripheral'].map((cat) => (
                      <div 
                        key={cat}
                        className="group overflow-hidden rounded-xl border border-border bg-card hover:border-primary/55 hover:shadow-md cursor-pointer transition-all flex flex-col"
                        onClick={() => setStep(2)}
                      >
                        <div className="h-32 w-full overflow-hidden bg-secondary border-b border-border">
                          <img 
                            src={CATEGORY_IMAGES[cat]} 
                            alt={cat} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <div className="p-4 flex flex-col items-center text-center gap-1">
                          <span className="font-semibold text-foreground group-hover:text-primary transition-colors text-base">
                            {getCategoryLabel(cat)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {isFr ? `Demander un ${getCategoryLabel(cat).toLowerCase()} standard` : `Request a standard issue ${cat.toLowerCase()}`}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-foreground">
                      {isFr ? 'Sélectionner un équipement disponible' : 'Select an available Asset'}
                    </h3>
                    <Button variant="ghost" size="sm" onClick={() => setStep(1)} className="cursor-pointer">
                      {isFr ? 'Retour' : 'Back'}
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center justify-between p-4 rounded-lg border border-border bg-secondary/10 hover:bg-secondary transition-colors cursor-pointer" onClick={() => setStep(3)}>
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded overflow-hidden border border-border bg-card flex-shrink-0">
                            <img 
                              src={CATEGORY_IMAGES.Laptop} 
                              alt="Laptop" 
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">MacBook Pro 14" ({isFr ? 'Standard' : 'Standard Issue'})</p>
                            <p className="text-sm text-muted-foreground">M3 Pro, 18GB RAM, 512GB SSD</p>
                          </div>
                        </div>
                        <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20">
                          {isFr ? 'Disponible' : 'Available'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-foreground">
                      {isFr ? 'Finaliser la demande' : 'Finalize Request'}
                    </h3>
                    <Button variant="ghost" size="sm" onClick={() => setStep(2)} className="cursor-pointer">
                      {isFr ? 'Retour' : 'Back'}
                    </Button>
                  </div>
                  <div className="grid gap-4 max-w-xl">
                    <div className="space-y-2">
                      <Label htmlFor="date" className="text-foreground">
                        {isFr ? 'Date requise' : 'Required By Date'}
                      </Label>
                      <DatePicker 
                        value={requiredDate} 
                        onChange={setRequiredDate} 
                        placeholder={isFr ? "Sélectionner une date" : "Select a date"} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notes" className="text-foreground">Justification / Notes</Label>
                      <textarea 
                        id="notes" 
                        rows={4}
                        className="w-full p-3 rounded-md bg-card border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder={isFr ? 'Pourquoi avez-vous besoin de cet équipement ?' : 'Why do you need this equipment?'}
                      ></textarea>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
            {step === 3 && (
              <CardFooter className="border-t border-border bg-secondary/30 p-6 flex justify-end">
                <Button className="bg-primary text-primary-foreground cursor-pointer">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  {isFr ? 'Soumettre la demande' : 'Submit Request'}
                </Button>
              </CardFooter>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Kanban Columns */}
            {['Pending', 'In Progress', 'Resolved'].map((col, index) => {
              let displayCol = col;
              if (isFr) {
                if (col === 'Pending') displayCol = 'En attente';
                else if (col === 'In Progress') displayCol = 'En cours';
                else if (col === 'Resolved') displayCol = 'Résolu';
              }
              return (
                <div key={col} className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-border">
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                      {index === 0 && <AlertCircle className="w-4 h-4 text-amber-500" />}
                      {index === 1 && <Wrench className="w-4 h-4 text-blue-500" />}
                      {index === 2 && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                      {displayCol}
                    </h3>
                    <Badge variant="secondary" className="bg-secondary text-muted-foreground">{index === 0 ? 2 : 1}</Badge>
                  </div>
                  
                  {/* Mock Ticket Card */}
                  {index === 0 && (
                    <Card className="border-border bg-card shadow-sm cursor-pointer hover:border-primary/55 transition-colors">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge className="bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border-rose-500/20">
                            {isFr ? 'Critique' : 'Critical'}
                          </Badge>
                          <span className="text-xs text-muted-foreground font-mono">#TKT-892</span>
                        </div>
                        <p className="font-medium text-sm text-foreground">
                          {isFr ? 'L\'écran clignote de manière aléatoire' : 'Screen flickering randomly'}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <MonitorSmartphone className="w-3 h-3" />
                          Dell UltraSharp 32"
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
