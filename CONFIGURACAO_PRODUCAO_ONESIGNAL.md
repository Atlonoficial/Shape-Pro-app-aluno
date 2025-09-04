# Configuração de Produção - OneSignal

## 🎯 Checklist de Configuração para Produção

### **1. OneSignal Dashboard Setup**

#### **Criar App OneSignal:**
1. Acesse [onesignal.com](https://onesignal.com) e crie conta
2. Clique em "New App/Website"
3. Nome: "Shape Pro" 
4. Selecione as plataformas: Web, Android, iOS

#### **Configurar Web Push:**
1. No dashboard OneSignal > Settings > Platforms > Web Push
2. Escolha "Typical Site" 
3. Site Name: "Shape Pro"
4. Site URL: `https://seu-dominio.com` (seu dominio real)
5. Auto Resubscribe: Ativado
6. Permission Message: "Receba notificações importantes do seu treino"

#### **Configurar Android:**
1. No dashboard OneSignal > Settings > Platforms > Android
2. Firebase Server Key: (obter do Firebase Console)
3. Firebase Sender ID: (obter do Firebase Console)

#### **Configurar iOS:**
1. No dashboard OneSignal > Settings > Platforms > iOS
2. Upload Apple Push Certificate (.p12 ou .p8)
3. Bundle ID: `app.lovable.d46ecb0f56a1441da5d5bac293c0288a`

### **2. Firebase Console Setup (Android)**

#### **Criar Projeto Firebase:**
1. Acesse [console.firebase.google.com](https://console.firebase.google.com)
2. Crie novo projeto: "shape-pro"
3. Ative Google Analytics (opcional)

#### **Configurar Android App:**
1. Project Settings > Add App > Android
2. Package name: `app.lovable.d46ecb0f56a1441da5d5bac293c0288a`
3. App nickname: "Shape Pro"
4. Download `google-services.json`

#### **Habilitar FCM:**
1. Project Settings > Cloud Messaging
2. Copiar **Server Key** e **Sender ID**
3. Configurar no OneSignal Dashboard

### **3. Apple Developer Setup (iOS)**

#### **Gerar Certificado Push:**
1. Acesse [developer.apple.com](https://developer.apple.com)
2. Certificates, Identifiers & Profiles
3. Identifiers > App IDs > Criar novo
4. Bundle ID: `app.lovable.d46ecb0f56a1441da5d5bac293c0288a`
5. Capabilities > Push Notifications (ativar)

#### **Gerar Push Certificate:**
1. Certificates > Create > Apple Push Services
2. Select App ID criado acima
3. Upload CSR file
4. Download certificate e converter para .p12

### **4. Atualizar Secrets no Supabase**

#### **No Dashboard Supabase:**
1. Acesse: https://supabase.com/dashboard/project/bqbopkqzkavhmenjlhab/settings/functions
2. Atualizar secrets:

```bash
# Substituir pelos valores reais do OneSignal Dashboard
ONESIGNAL_APP_ID=sua_app_id_real_do_onesignal
ONESIGNAL_API_KEY=sua_rest_api_key_do_onesignal
```

### **5. Atualizar Código**

#### **capacitor.config.ts:**
```typescript
plugins: {
  OneSignal: {
    appId: "SUA_APP_ID_REAL_ONESIGNAL",
    googleProjectNumber: "SEU_FIREBASE_SENDER_ID"
  }
}
```

#### **Adicionar google-services.json:**
- Colocar arquivo baixado do Firebase em: `android/app/google-services.json`

### **6. Build e Deploy**

#### **Para Android:**
```bash
npm run build
npx cap sync android
npx cap run android
```

#### **Para iOS:**
```bash
npm run build
npx cap sync ios
npx cap run ios
```

#### **Para Web:**
```bash
npm run build
# Deploy no seu servidor/Vercel/Netlify
```

### **7. Teste em Produção**

#### **Testar Web:**
1. Deploy em domínio real (não localhost)
2. Aceitar permissão de notificação
3. Enviar teste pelo dashboard professor

#### **Testar Mobile:**
1. Instalar app em dispositivo físico
2. Aceitar permissões push
3. Enviar teste pelo dashboard professor

### **8. Validação Final**

- [ ] Web push funcionando em domínio real
- [ ] Android push funcionando em dispositivo físico  
- [ ] iOS push funcionando em dispositivo físico
- [ ] Dashboard professor enviando notificações
- [ ] Deep links funcionando corretamente
- [ ] Player IDs sendo salvos automaticamente
- [ ] Logs de notificação aparecendo no Supabase

## 🔧 Solução de Problemas

### **Web não recebe notificações:**
- Verificar se domínio é HTTPS
- Verificar se OneSignalSDKWorker.js está acessível
- Verificar console do navegador para erros

### **Android não recebe notificações:**
- Verificar google-services.json está correto
- Verificar Firebase Server Key no OneSignal
- Testar em dispositivo físico (não emulador)

### **iOS não recebe notificações:**
- Verificar certificado .p12 no OneSignal
- Verificar Bundle ID está correto
- Testar em dispositivo físico (não simulador)

### **Dashboard não consegue enviar:**
- Verificar secrets ONESIGNAL_* no Supabase
- Verificar logs da edge function
- Verificar se professor tem estudantes cadastrados

## 📞 Suporte

Se precisar de ajuda com a configuração, consulte:
- [Documentação OneSignal](https://documentation.onesignal.com/)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Capacitor Push Notifications](https://capacitorjs.com/docs/guides/push-notifications-firebase)