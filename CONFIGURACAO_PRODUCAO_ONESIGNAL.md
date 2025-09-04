# 🚨 CONFIGURAÇÃO OBRIGATÓRIA ONESIGNAL

## ⚠️ AÇÃO URGENTE NECESSÁRIA

Antes de exportar o projeto e fazer builds para as lojas, você **OBRIGATORIAMENTE** precisa configurar o OneSignal com credenciais reais.

---

## 📋 PASSOS OBRIGATÓRIOS

### **1. Criar Conta OneSignal**
1. Acesse: https://app.onesignal.com
2. Crie uma conta gratuita
3. Click em "New App/Website"
4. Nome: **Shape Pro**
5. Selecione: **Google Android (FCM)** + **Apple iOS**

### **2. Configurar Android (FCM)**
1. Acesse Google Cloud Console: https://console.cloud.google.com
2. Criar ou selecionar projeto
3. **APIs & Services** → **Credentials** 
4. **Create Credentials** → **Service Account Key**
5. Download arquivo `.json`
6. Upload no OneSignal
7. **COPIAR PROJECT NUMBER** (não Project ID!)

### **3. Configurar iOS**
1. Apple Developer Portal → **Certificates**
2. **+** → **Apple Push Notification service SSL**
3. App ID: `app.lovable.d46ecb0f56a1441da5d5bac293c0288a`
4. Download `.cer` → converter para `.p12`
5. Upload `.p12` no OneSignal

### **4. Obter Credenciais**
No OneSignal Dashboard → **Settings** → **Keys & IDs**:
- **App ID**: `[COPIAR E COLAR]`
- **REST API Key**: `[COPIAR E COLAR]`

Do Google Cloud Console:
- **Project Number**: `[COPIAR E COLAR]`

### **5. Atualizar capacitor.config.ts**
```typescript
OneSignal: {
  appId: "SEU_APP_ID_REAL_AQUI",
  googleProjectNumber: "SEU_PROJECT_NUMBER_REAL_AQUI"
}
```

---

## ⚡ PRÓXIMOS PASSOS

Após configurar OneSignal:

1. **Exportar projeto** → GitHub
2. **Git pull** do repositório
3. **npm install** 
4. **npm run build**
5. **npx cap sync**
6. **npx cap run android/ios**

---

## 🎯 STATUS ATUAL

- ✅ Firebase completamente removido
- ✅ Dependências limpas
- ⚠️ **OneSignal precisa ser configurado**
- ⚠️ **Credenciais reais obrigatórias**

**SEM ESSAS CONFIGURAÇÕES O APP NÃO FUNCIONARÁ NAS LOJAS!**