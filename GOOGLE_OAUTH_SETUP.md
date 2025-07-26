# Configuração do Google OAuth no Supabase

## Passo 1: Configurar no Google Cloud Console

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Vá para "APIs & Services" > "Credentials"
4. Clique em "Create Credentials" > "OAuth 2.0 Client IDs"
5. Configure:
   - Application type: Web application
   - Name: Turf App
   - Authorized JavaScript origins: `https://jvwpsbbaulvnicjhaesi.supabase.co`
   - Authorized redirect URIs: `https://jvwpsbbaulvnicjhaesi.supabase.co/auth/v1/callback`
6. Anote o Client ID e Client Secret

## Passo 2: Configurar no Supabase Dashboard

1. Acesse [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá para "Authentication" > "Providers"
4. Encontre "Google" e clique em "Enable"
5. Preencha:
   - Client ID: (do Google Cloud Console)
   - Client Secret: (do Google Cloud Console)
6. Salve as configurações

## Passo 3: Verificar configuração

Após configurar, o login com Google deve funcionar corretamente.

## URLs importantes para o seu projeto:

- **Supabase URL**: `https://jvwpsbbaulvnicjhaesi.supabase.co`
- **Redirect URI**: `https://jvwpsbbaulvnicjhaesi.supabase.co/auth/v1/callback`
- **JavaScript Origin**: `https://jvwpsbbaulvnicjhaesi.supabase.co` 