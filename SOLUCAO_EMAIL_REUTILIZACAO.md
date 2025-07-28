# Solução para Problema de Reutilização de Email

## Problema
Você deletou uma conta mas não consegue criar uma nova com o mesmo email, mesmo após aguardar horas.

## Causas do Problema

1. **Dados Órfãos**: Quando uma conta é deletada, podem ficar registros nas tabelas do banco de dados sem correspondência na tabela `auth.users`
2. **Reserva Temporária**: O Supabase mantém emails "reservados" por questões de segurança
3. **Cache do Sistema**: O sistema pode manter informações em cache

## Soluções

### Solução Imediata (Recomendada)

1. **Acesse o painel do Supabase**:
   - Vá para https://supabase.com/dashboard
   - Selecione seu projeto
   - Vá para "SQL Editor"

2. **Execute o script de limpeza**:
   ```sql
   -- Execute este comando para limpar dados órfãos
   SELECT public.force_cleanup_deleted_users();
   ```

3. **Verifique se funcionou**:
   ```sql
   -- Verifique se há dados órfãos restantes
   SELECT 
     'profiles' as table_name,
     COUNT(*) as orphaned_count
   FROM public.profiles 
   WHERE user_id NOT IN (SELECT id FROM auth.users)
   UNION ALL
   SELECT 
     'messages' as table_name,
     COUNT(*) as orphaned_count
   FROM public.messages 
   WHERE user_id NOT IN (SELECT id FROM auth.users);
   ```

### Solução Alternativa (Se a primeira não funcionar)

1. **Execute o script completo**:
   ```sql
   -- Execute o script FORCE_EMAIL_REUSE_CLEANUP.sql
   -- Este script faz uma limpeza mais agressiva
   ```

2. **Ou execute manualmente**:
   ```sql
   -- Limpe dados órfãos manualmente
   DELETE FROM public.profiles 
   WHERE user_id NOT IN (SELECT id FROM auth.users);
   
   DELETE FROM public.messages 
   WHERE user_id NOT IN (SELECT id FROM auth.users);
   
   DELETE FROM public.message_reactions 
   WHERE user_id NOT IN (SELECT id FROM auth.users);
   
   DELETE FROM public.mentions 
   WHERE user_id NOT IN (SELECT id FROM auth.users);
   
   DELETE FROM public.notifications 
   WHERE user_id NOT IN (SELECT id FROM auth.users);
   ```

### Solução para Email Específico

Se você sabe qual email está causando problemas:

```sql
-- Substitua 'seu-email@exemplo.com' pelo email real
SELECT public.manual_delete_user_by_email('seu-email@exemplo.com');
```

## Verificação

Após executar a limpeza, você pode verificar se o email está disponível:

```sql
-- Verifique se o email pode ser reutilizado
SELECT public.can_reuse_email('seu-email@exemplo.com');
```

## Prevenção

Para evitar esse problema no futuro:

1. **Sempre use a função de deletar conta** da aplicação
2. **Aguarde alguns minutos** após deletar antes de tentar criar nova conta
3. **Execute limpeza regular** dos dados órfãos

## Comandos Úteis

### Verificar dados órfãos:
```sql
SELECT 
  'profiles' as table_name,
  COUNT(*) as orphaned_count
FROM public.profiles 
WHERE user_id NOT IN (SELECT id FROM auth.users)
UNION ALL
SELECT 
  'messages' as table_name,
  COUNT(*) as orphaned_count
FROM public.messages 
WHERE user_id NOT IN (SELECT id FROM auth.users);
```

### Forçar limpeza:
```sql
SELECT public.force_cleanup_deleted_users();
```

### Verificar email específico:
```sql
SELECT public.can_reuse_email('email@exemplo.com');
```

## Se o Problema Persistir

1. **Aguarde 15-30 minutos** após executar a limpeza
2. **Tente usar um email temporário** para testar
3. **Verifique se há outros usuários** com o mesmo email
4. **Contate o suporte** se o problema persistir por mais de 1 hora

## Notas Técnicas

- O Supabase mantém emails reservados por questões de segurança
- A limpeza remove dados órfãos que podem impedir a reutilização
- O cache do sistema pode levar alguns minutos para atualizar
- Sempre execute a limpeza como administrador do projeto

## Arquivos Relacionados

- `FORCE_EMAIL_REUSE_CLEANUP.sql` - Script completo de limpeza
- `supabase/migrations/20250728030000-force-email-reuse-cleanup.sql` - Migração automática
- `src/components/ui/email-help.tsx` - Componente de ajuda atualizado 