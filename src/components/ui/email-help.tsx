import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Info, Clock, Mail } from 'lucide-react';

interface EmailHelpProps {
  onClose: () => void;
}

export function EmailHelp({ onClose }: EmailHelpProps) {
  const [showDetails, setShowDetails] = useState(false);

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
              </ul>
              <p className="mt-2">
                O tempo de liberação varia, mas geralmente é de 5-15 minutos.
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
            Entendi
          </Button>
          <Button 
            onClick={() => window.location.reload()}
            className="flex-1"
          >
            Tentar Novamente
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 