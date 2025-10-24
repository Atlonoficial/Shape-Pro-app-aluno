# BUILD 27.1 - Configuração iOS Universal Links

## ⚠️ AÇÃO NECESSÁRIA: Configurar Apple Team ID

### Passo 1: Obter seu Apple Team ID

1. Acesse: https://developer.apple.com/account
2. Faça login com sua conta Apple Developer
3. Vá em **"Membership"**
4. Copie o **Team ID** (exemplo: `ABC123DEF4`)

### Passo 2: Atualizar o arquivo apple-app-site-association

O arquivo `public/.well-known/apple-app-site-association` já foi criado, mas você precisa:

1. **Substituir `TEAMID` pelo seu Team ID real em 2 lugares:**
   - Linha 6: `"appID": "SEU_TEAM_ID.app.lovable.d46ecb0f56a1441da5d5bac293c0288a"`
   - Linha 16: `"SEU_TEAM_ID.app.lovable.d46ecb0f56a1441da5d5bac293c0288a"`

2. **Exemplo de como deve ficar (se seu Team ID for ABC123DEF4):**
   ```json
   "appID": "ABC123DEF4.app.lovable.d46ecb0f56a1441da5d5bac293c0288a"
   ```

### Passo 3: Deploy e Rebuild

1. **Fazer commit e push das alterações**
2. **Aguardar build do Lovable**
3. **Verificar se o arquivo está acessível:**
   ```
   https://d46ecb0f-56a1-441d-a5d5-bac293c0288a.lovableproject.com/.well-known/apple-app-site-association
   ```

4. **Rebuild do app iOS:**
   ```bash
   git pull
   npm install
   npx cap sync ios
   npx cap open ios
   ```

5. **No Xcode:**
   - Product → Clean Build Folder
   - Build e instalar no iPhone

### Passo 4: Testar

1. Abrir app Shape Pro no iPhone
2. Ir em Configurações
3. Clicar em "Conectar Strava"
4. ✅ Browser abre
5. ✅ Autorizar no Strava
6. ✅ **App Shape Pro abre automaticamente** (Universal Link funcionando!)
7. ✅ Strava conectado com sucesso

---

## ✅ Correções Implementadas

- ✅ Linha 210 de `useStravaIntegration.ts` corrigida
- ✅ Agora envia corretamente `platform: 'mobile'` ou `'web'`
- ✅ Backend receberá o parâmetro correto
- ✅ Arquivo `apple-app-site-association` já criado (você só precisa substituir TEAMID)

---

## 📝 Próximos Passos

1. **Obter seu Apple Team ID**
2. **Editar manualmente** `public/.well-known/apple-app-site-association`
3. **Substituir** as 2 ocorrências de `TEAMID`
4. **Fazer commit/push**
5. **Rebuild do app iOS**
6. **Testar no iPhone**

---

**Dúvidas? Me avise quando tiver o Team ID que eu posso fazer a substituição para você! 📱✨**
