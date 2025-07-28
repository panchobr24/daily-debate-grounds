# Configuração do Google OAuth no Supabase

## 🚨 Problema Atual
O erro "Unsupported provider: provider is not enabled" indica que o Google OAuth não está configurado no Supabase.

## 📋 Passo a Passo Completo

### Passo 1: Configurar no Google Cloud Console

1. **Acesse o Google Cloud Console**
   - Vá para [console.cloud.google.com](https://console.cloud.google.com/)
   - Faça login com sua conta Google

2. **Criar/Selecionar Projeto**
   - Clique no seletor de projeto no topo
   - Clique em "Novo Projeto" ou selecione um existente
   - Dê um nome como "Turf App"

3. **Habilitar Google+ API**
   - Vá para "APIs & Services" > "Library"
   - Procure por "Google+ API" ou "Google Identity"
   - Clique em "Enable"

4. **Criar Credenciais OAuth**
   - Vá para "APIs & Services" > "Credentials"
   - Clique em "Create Credentials" > "OAuth 2.0 Client IDs"
   - Selecione "Web application"

5. **Configurar OAuth Client**
   - **Name**: `Turf App`
   - **Authorized JavaScript origins**:
     ```
     http://localhost:8081
     http://localhost:3000
     https://jvwpsbbaulvnicjhaesi.supabase.co
     ```
   - **Authorized redirect URIs**:
     ```
     http://localhost:8081/auth/callback
     http://localhost:3000/auth/callback
     https://jvwpsbbaulvnicjhaesi.supabase.co/auth/v1/callback
     ```

6. **Anotar Credenciais**
   - **Client ID**: (copie este valor)
   - **Client Secret**: (copie este valor)

### Passo 2: Configurar no Supabase Dashboard

1. **Acesse o Supabase Dashboard**
   - Vá para [supabase.com/dashboard](https://supabase.com/dashboard)
   - Selecione o projeto: `jvwpsbbaulvnicjhaesi`

2. **Configurar Authentication**
   - Vá para "Authentication" no menu lateral
   - Clique em "Providers"

3. **Habilitar Google**
   - Encontre "Google" na lista de providers
   - Clique no toggle para habilitar
   - Preencha os campos:
     - **Client ID**: (cole o Client ID do Google)
     - **Client Secret**: (cole o Client Secret do Google)

4. **Salvar Configuração**
   - Clique em "Save"
   - Aguarde alguns segundos para a configuração ser aplicada

### Passo 3: Testar a Configuração

1. **No seu projeto local**
   - Execute `npm run dev`
   - Vá para a página de login
   - Clique em "Show Debug" (se estiver em desenvolvimento)
   - Clique em "Test Google OAuth"

2. **Verificar Console**
   - Abra o DevTools (F12)
   - Vá para a aba Console
   - Procure por mensagens de erro ou sucesso

## 🔧 URLs Importantes

### Para o seu projeto:
- **Supabase URL**: `https://jvwpsbbaulvnicjhaesi.supabase.co`
- **Redirect URI**: `https://jvwpsbbaulvnicjhaesi.supabase.co/auth/v1/callback`
- **JavaScript Origin**: `https://jvwpsbbaulvnicjhaesi.supabase.co`

### Para desenvolvimento local:
- **Local URL**: `http://localhost:8081`
- **Local Redirect**: `http://localhost:8081/auth/callback`

## 🚨 Solução de Problemas

### Erro: "Unsupported provider: provider is not enabled"
**Solução:**
1. Verifique se o Google OAuth está habilitado no Supabase Dashboard
2. Confirme se o Client ID e Client Secret estão corretos
3. Aguarde alguns minutos após salvar a configuração

### Erro: "Invalid redirect URI"
**Solução:**
1. Adicione todas as URLs de redirecionamento no Google Cloud Console
2. Inclua URLs para desenvolvimento local e produção
3. Verifique se não há espaços extras nas URLs

### Erro: "Access blocked"
**Solução:**
1. Verifique se a API do Google+ está habilitada
2. Confirme se as credenciais estão corretas
3. Verifique se o projeto está ativo no Google Cloud Console

## 🧪 Teste de Configuração

Após configurar, você pode testar usando o componente de debug na página de login:

1. Vá para `/auth`
2. Clique em "Show Debug" (apenas em desenvolvimento)
3. Clique em "Test Google OAuth"
4. Verifique o resultado no console

## 📞 Suporte

Se ainda houver problemas:
1. Verifique os logs no console do navegador
2. Confirme se todas as URLs estão corretas
3. Aguarde alguns minutos após salvar as configurações
4. Tente limpar o cache do navegador 