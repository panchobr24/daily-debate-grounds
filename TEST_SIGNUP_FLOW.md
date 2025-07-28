# Teste do Fluxo de Registro

## Como Testar:

### 1. **Teste Básico (sem username)**
- Email: `teste@exemplo.com`
- Senha: `123456`
- Username: **deixe vazio**
- Clique em "Sign Up"

### 2. **Teste com Username**
- Email: `teste2@exemplo.com`
- Senha: `123456`
- Username: `teste123`
- Clique em "Sign Up"

### 3. **Verifique os Logs**
Procure por:
```
=== SIGNUP START DEBUG ===
Form submitted at: [timestamp]
Email: [email]
Password: ***
Username: [username]
Loading state: false
Is checking username: false
```

### 4. **Logs Esperados**
Se funcionar corretamente, você deve ver:
```
All validations passed, proceeding with signup...
Set loading to true
Calling signUp function...
SignUp result: { error: null, user: {...} }
=== SIGNUP SUCCESS DEBUG ===
Signup successful, showing verification screen
Setting verification email and showing verification screen
OTP code generated successfully
=== END SIGNUP SUCCESS ===
```

### 5. **Se Não Funcionar**
- Verifique se há erros no console
- Verifique se o botão está sendo clicado (deve aparecer "Signing up...")
- Verifique se há validações falhando

### 6. **Problemas Comuns**
- **Botão não responde**: Verifique se `loading` está sendo definido
- **Validação falha**: Verifique os logs de username
- **Tela OTP não aparece**: Verifique se `showEmailVerification` está sendo definido

## Debug Commands
Execute no console do navegador:
```javascript
// Verificar estado atual
console.log('Current state:', {
  email: document.querySelector('#signup-email')?.value,
  password: document.querySelector('#signup-password')?.value,
  username: document.querySelector('#username')?.value,
  loading: false // será true se estiver carregando
});
``` 