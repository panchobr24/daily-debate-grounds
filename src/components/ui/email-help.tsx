import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Info, Clock, Mail, RefreshCw, Database } from 'lucide-react';

interface EmailHelpProps {
  onClose: () => void;
}

export function EmailHelp({ onClose }: EmailHelpProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [showTechnicalSolution, setShowTechnicalSolution] = useState(false);

  return (
    <Card className="w-full max-w-md bg-card/95 backdrop-blur-sm border-turf-purple/20">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <AlertCircle className="h-12 w-12 text-orange-500" />
        </div>
        <CardTitle className="text-xl font-bold text-turf-purple">
          Email já está em uso
        </CardTitle>
        <CardDescription>
          Este email já está registrado em nossa plataforma
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Possíveis causas:</p>
              <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                <li>• Você já tem uma conta com este email</li>
                <li>• Alguém já registrou este email</li>
                <li>• Você deletou uma conta anteriormente</li>
                <li>• Dados órfãos no banco de dados</li>
              </ul>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-orange-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Se você deletou uma conta:</p>
              <p className="text-xs text-muted-foreground mt-1">
                Pode levar alguns minutos para que o email seja liberado. Tente novamente em 5-10 minutos.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Mail className="h-5 w-5 text-green-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Soluções:</p>
              <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                <li>• Use um email diferente</li>
                <li>• Aguarde alguns minutos e tente novamente</li>
                <li>• Faça login se você já tem uma conta</li>
                <li>• Contate o suporte se o problema persistir</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Button 
            onClick={() => setShowDetails(!showDetails)}
            variant="outline"
            className="w-full"
          >
            {showDetails ? "Ocultar detalhes" : "Ver detalhes técnicos"}
          </Button>
          
          {showDetails && (
            <div className="text-xs text-muted-foreground p-3 bg-muted rounded-md">
              <p className="font-medium mb-2">Por que isso acontece?</p>
              <p className="mb-2">
                Quando uma conta é deletada, o Supabase mantém o email "reservado" 
                temporariamente por questões de segurança. Isso previne:
              </p>
              <ul className="space-y-1">
                <li>• Reutilização imediata por terceiros</li>
                <li>• Problemas de segurança</li>
                <li>• Conflitos de dados</li>
                <li>• Dados órfãos no banco</li>
              </ul>
              <p className="mt-2">
                O tempo de liberação varia, mas geralmente é de 5-15 minutos.
              </p>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Button 
            onClick={() => setShowTechnicalSolution(!showTechnicalSolution)}
            variant="outline"
            className="w-full"
          >
            {showTechnicalSolution ? "Ocultar solução técnica" : "Solução técnica (Admin)"}
          </Button>
          
          {showTechnicalSolution && (
            <div className="text-xs text-muted-foreground p-3 bg-muted rounded-md">
              <div className="flex items-start gap-2 mb-3">
                <Database className="h-4 w-4 text-blue-500 mt-0.5" />
                <div>
                  <p className="font-medium mb-1">Para administradores:</p>
                  <p className="mb-2">
                    Execute este comando no SQL Editor do Supabase:
                  </p>
                </div>
              </div>
              
              <div className="bg-background p-2 rounded border text-xs font-mono overflow-x-auto">
                <code>
                  SELECT public.force_cleanup_deleted_users();
                </code>
              </div>
              
              <p className="mt-2 text-xs">
                Isso limpará todos os dados órfãos e permitirá a reutilização de emails.
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={onClose}
            variant="outline"
            className="flex-1"
          >
            Fechar
          </Button>
          <Button 
            onClick={() => {
              // Try to refresh the page to see if the issue is resolved
              window.location.reload();
            }}
            className="flex-1"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar Novamente
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 