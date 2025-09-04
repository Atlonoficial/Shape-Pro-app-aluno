# 🔔 CONFIGURAÇÃO ONESIGNAL PARA PRODUÇÃO

## 📋 PRÉ-REQUISITOS
- Conta no OneSignal (https://app.onesignal.com)
- Conta Google Cloud Console 
- Apple Developer Account (para iOS)

---

## 🚀 PASSOS OBRIGATÓRIOS

### **1. Criar App no OneSignal**
1. Acesse https://app.onesignal.com
2. Click "New App/Website"
3. **App Name:** Shape Pro
4. Selecionar **Google Android (FCM)** e **Apple iOS**

### **2. Configurar Android (FCM)**
1. No OneSignal, em **Platform Settings** → **Google Android (FCM)**
2. Acesse Google Cloud Console: https://console.cloud.google.com
3. Criar novo projeto ou usar existente
4. **APIs & Services** → **Credentials**
5. **Create Credentials** → **Service Account Key**
6. Download do arquivo `.json`
7. Upload do arquivo no OneSignal
8. **Copiar Project Number** (não o Project ID)

### **3. Configurar iOS**
1. No OneSignal, em **Platform Settings** → **Apple iOS**
2. **iOS Push Certificate:**
   - Acesse Apple Developer Portal
   - **Certificates, Identifiers & Profiles**
   - **Certificates** → **+** → **Apple Push Notification service SSL**
   - **App ID:** app.lovable.d46ecb0f56a1441da5d5bac293c0288a
   - Download certificado `.cer`
   - Converter para `.p12` usando Keychain Access
   - Upload no OneSignal

### **4. Obter Credenciais**
Após configurar Android e iOS no OneSignal:

```bash
# No OneSignal Dashboard → Settings → Keys & IDs:
OneSignal App ID: [COPIAR DAQUI]
REST API Key: [COPIAR DAQUI]

# Do Google Cloud Console:
Project Number: [COPIAR DAQUI]
```

### **5. Atualizar capacitor.config.ts**
```typescript
plugins: {
  OneSignal: {
    appId: "SEU_ONESIGNAL_APP_ID_REAL",
    googleProjectNumber: "SEU_PROJECT_NUMBER_REAL"
  },
  // ... resto da configuração
}
```

---

## 🧪 TESTAR NOTIFICAÇÕES

### **Android:**
```bash
npm run build
npx cap sync android
npx cap run android
```

### **iOS:**
```bash
npm run build  
npx cap sync ios
npx cap run ios
```

### **Web (Desenvolvimento):**
```bash
npm run dev
# Testar notificações web no navegador
```

---

## ⚠️ PONTOS CRÍTICOS

### **🔐 Segurança:**
- **NUNCA** commitar credenciais no Git
- Usar variáveis de ambiente em produção
- Backup seguro do certificado iOS `.p12`

### **📱 Permissões:**
- **Android:** Automático com OneSignal
- **iOS:** Usuário deve aceitar ao abrir o app

### **🌐 Domínios:**
- Notificações web: configurar domínio no OneSignal
- HTTPS obrigatório para notificações web

---

## 🎯 CHECKLIST FINAL

- [ ] App criado no OneSignal
- [ ] Android FCM configurado
- [ ] iOS certificado configurado  
- [ ] App ID e Project Number obtidos
- [ ] `capacitor.config.ts` atualizado
- [ ] Build Android funcionando
- [ ] Build iOS funcionando
- [ ] Notificações testadas em device real
- [ ] Credenciais salvas em local seguro

---

## 📞 SUPORTE

Em caso de problemas:
- OneSignal Docs: https://documentation.onesignal.com
- OneSignal Support: https://onesignal.com/support
- Google Cloud Support: https://cloud.google.com/support