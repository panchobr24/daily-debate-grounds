import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Mail } from 'lucide-react';

interface DatabaseErrorProps {
  onRetry: () => void;
  onClose: () => void;
}

export function DatabaseError({ onRetry, onClose }: DatabaseErrorProps) {
  return (
    <Card className="w-full max-w-md bg-card/95 backdrop-blur-sm border-turf-purple/20">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <AlertTriangle className="h-12 w-12 text-red-500" />
        </div>
        <CardTitle className="text-xl font-bold text-turf-purple">
          Erro no Servidor
        </CardTitle>
        <CardDescription>
          Houve um problema técnico ao criar sua conta
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">
            <p>Este erro pode ser causado por:</p>
            <ul className="mt-2 space-y-1">
              <li>• Problema temporário no servidor</li>
              <li>• Sobrecarga do sistema</li>
              <li>• Manutenção em andamento</li>
            </ul>
          </div>
          
          <div className="text-sm text-muted-foreground">
            <p><strong>Soluções:</strong></p>
            <ul className="mt-2 space-y-1">
              <li>• Tente novamente em alguns minutos</li>
              <li>• Verifique sua conexão com a internet</li>
              <li>• Use um email diferente temporariamente</li>
            </ul>
          </div>
        </div>

        <div className="space-y-2">
          <Button 
            onClick={onRetry}
            className="w-full"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Tentar Novamente
          </Button>
          
          <Button 
            onClick={onClose}
            variant="outline"
            className="w-full"
          >
            Voltar
          </Button>
        </div>

        <div className="text-xs text-muted-foreground text-center">
          <p>Se o problema persistir, entre em contato com o suporte.</p>
        </div>
      </CardContent>
    </Card>
  );
} 