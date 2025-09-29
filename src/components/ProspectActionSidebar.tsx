import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, FileText, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TraiterProspectForm } from './TraiterProspectForm';
import { ModifierProspectForm } from './ModifierProspectForm';

interface ProspectActionSidebarProps {
  prospect: any;
  prospectEmail: string;
  onSuccess?: () => void;
  onClose: () => void;
  defaultTab?: 'modifier' | 'traiter';
}

export const ProspectActionSidebar: React.FC<ProspectActionSidebarProps> = ({
  prospect,
  prospectEmail,
  onSuccess,
  onClose,
  defaultTab = 'modifier',
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab);

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ 
        duration: 0.35,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className="fixed top-0 right-0 h-full w-[480px] bg-background border-l border-border shadow-xl z-50"
    >
      <div className="flex flex-col h-full">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold">Actions Prospect</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {prospectEmail}
          </p>
        </div>

        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'modifier' | 'traiter')} className="h-full flex flex-col">
            <TabsList className="mx-4 mt-4 grid w-auto grid-cols-2">
              <TabsTrigger value="modifier" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Modifier
              </TabsTrigger>
              <TabsTrigger value="traiter" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Traiter
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-hidden">
              <TabsContent value="modifier" className="h-full mt-0 data-[state=active]:flex data-[state=active]:flex-col">
                <div className="flex-1 overflow-y-auto p-4">
                  <ModifierProspectForm
                    prospect={prospect}
                    onSuccess={onSuccess}
                    onClose={onClose}
                  />
                </div>
              </TabsContent>

              <TabsContent value="traiter" className="h-full mt-0 data-[state=active]:flex data-[state=active]:flex-col">
                <div className="flex-1 overflow-y-auto p-4">
                  <TraiterProspectForm
                    prospectEmail={prospectEmail}
                    onSuccess={onSuccess}
                    onClose={onClose}
                  />
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </motion.div>
  );
};