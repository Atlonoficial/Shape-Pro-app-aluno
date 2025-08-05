# 🔥 Guia Completo de Configuração do Firebase - Shape Pro

## 📋 Checklist de Configuração

### 1. Criar Projeto Firebase
- [ ] Acesse [Firebase Console](https://console.firebase.google.com/)
- [ ] Clique em "Adicionar projeto"
- [ ] Nome: `shape-pro-app` (ou seu nome preferido)
- [ ] Desabilite Google Analytics (opcional para desenvolvimento)
- [ ] Clique em "Criar projeto"

### 2. Configurar Authentication
- [ ] Vá para **Authentication** > **Sign-in method**
- [ ] Ative **Email/Password**
- [ ] (Opcional) Ative **Google** e **Apple** para login social

### 3. Configurar Firestore Database
- [ ] Vá para **Firestore Database**
- [ ] Clique em "Criar banco de dados"
- [ ] Escolha **Modo de produção**
- [ ] Selecione uma localização próxima (ex: `southamerica-east1`)
- [ ] Clique em "Concluído"

### 4. Configurar Storage
- [ ] Vá para **Storage**
- [ ] Clique em "Começar"
- [ ] Escolha **Modo de produção**
- [ ] Selecione a mesma localização do Firestore
- [ ] Clique em "Concluído"

### 5. Configurar Cloud Messaging
- [ ] Vá para **Cloud Messaging**
- [ ] Clique em "Configurar"
- [ ] Gere as **VAPID keys**:
  - Vá para **Configurações do projeto** > **Cloud Messaging**
  - Na seção "Configuração da Web", clique em "Gerar par de chaves"
  - Copie a chave VAPID gerada

### 6. Obter Credenciais do Projeto
- [ ] Vá para **Configurações do projeto** (ícone de engrenagem)
- [ ] Role até **Seus aplicativos**
- [ ] Clique em **</> Web**
- [ ] Registre o app com o nome `Shape Pro`
- [ ] **NÃO** marque "Configurar Firebase Hosting"
- [ ] Clique em "Registrar app"
- [ ] **COPIE AS CREDENCIAIS** mostradas

## 🔧 Atualizar Código com Credenciais Reais

### 1. Arquivo `src/lib/firebase.ts`
Substitua as linhas com os valores reais:

```typescript
const firebaseConfig = {
  apiKey: "SUA_API_KEY_AQUI",
  authDomain: "SEU_PROJECT_ID.firebaseapp.com",
  projectId: "SEU_PROJECT_ID",
  storageBucket: "SEU_PROJECT_ID.appspot.com",
  messagingSenderId: "SEU_SENDER_ID",
  appId: "SEU_APP_ID",
  measurementId: "SUA_MEASUREMENT_ID" // Opcional
};
```

### 2. Arquivo `public/firebase-messaging-sw.js`
Atualize com as mesmas credenciais:

```javascript
const firebaseConfig = {
  apiKey: "SUA_API_KEY_AQUI",
  authDomain: "SEU_PROJECT_ID.firebaseapp.com",
  projectId: "SEU_PROJECT_ID",
  storageBucket: "SEU_PROJECT_ID.appspot.com",
  messagingSenderId: "SEU_SENDER_ID",
  appId: "SEU_APP_ID"
};
```

### 3. Arquivo `src/components/notifications/PushNotifications.tsx`
Substitua pela sua VAPID key:

```typescript
vapidKey: 'SUA_VAPID_KEY_AQUI'
```

## 🛡️ Configurar Regras de Segurança

### 1. Firestore Rules
- [ ] Vá para **Firestore Database** > **Regras**
- [ ] Copie e cole o conteúdo do arquivo `src/lib/firebase-security-rules.txt`
- [ ] Clique em **Publicar**

### 2. Storage Rules
- [ ] Vá para **Storage** > **Regras**
- [ ] Substitua pelas seguintes regras:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Avatars - usuários podem fazer upload de seus próprios avatares
    match /avatars/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Fotos de progresso - usuários podem fazer upload de suas próprias fotos
    match /progress/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Vídeos de exercícios - apenas professores podem fazer upload
    match /exercises/{teacherId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.userType == 'teacher';
    }
    
    // Documentos - usuários podem fazer upload de seus próprios documentos
    match /documents/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 📱 Configuração para Aplicativo Nativo

### 1. Android (`google-services.json`)
- [ ] Vá para **Configurações do projeto**
- [ ] Na seção **Seus aplicativos**, clique em "Adicionar app" > **Android**
- [ ] Package name: `app.lovable.d46ecb0f56a1441da5d5bac293c0288a`
- [ ] Baixe o arquivo `google-services.json`
- [ ] Coloque em: `android/app/google-services.json`

### 2. iOS (`GoogleService-Info.plist`)
- [ ] Na seção **Seus aplicativos**, clique em "Adicionar app" > **iOS**
- [ ] Bundle ID: `app.lovable.d46ecb0f56a1441da5d5bac293c0288a`
- [ ] Baixe o arquivo `GoogleService-Info.plist`
- [ ] Coloque em: `ios/App/App/GoogleService-Info.plist`

## 🗄️ Estrutura do Banco de Dados

O sistema criará automaticamente as seguintes coleções:

### `/users/{userId}`
```
{
  uid: string,
  email: string,
  name: string,
  userType: 'student' | 'teacher',
  createdAt: timestamp,
  lastLogin: timestamp,
  profileComplete: boolean,
  preferences: {
    notifications: boolean,
    theme: string,
    language: string
  },
  stats: {
    totalWorkouts: number,
    totalCaloriesBurned: number,
    averageWorkoutDuration: number,
    streakDays: number
  }
}
```

### `/workouts/{workoutId}`
```
{
  name: string,
  description: string,
  exercises: Exercise[],
  duration: number,
  calories: number,
  difficulty: 'beginner' | 'intermediate' | 'advanced',
  muscleGroup: string,
  assignedTo: string[], // user IDs
  createdBy: string, // teacher ID
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### `/nutrition/{nutritionId}`
```
{
  name: string,
  description: string,
  meals: Meal[],
  totalCalories: number,
  assignedTo: string[], // user IDs
  createdBy: string, // teacher ID
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### `/progress/{progressId}`
```
{
  userId: string,
  type: 'workout' | 'weight' | 'meal' | 'measurement',
  value: number,
  unit: string,
  notes: string,
  date: timestamp
}
```

### `/notifications/{notificationId}`
```
{
  title: string,
  message: string,
  type: 'workout' | 'meal' | 'reminder' | 'achievement' | 'general',
  targetUsers: string[],
  isRead: boolean,
  createdAt: timestamp
}
```

## 🧪 Testar a Configuração

### 1. Teste de Authentication
- [ ] Registrar novo usuário
- [ ] Fazer login
- [ ] Fazer logout

### 2. Teste de Firestore
- [ ] Verificar se dados do usuário são criados
- [ ] Testar sincronização em tempo real

### 3. Teste de Storage
- [ ] Fazer upload de imagem de perfil
- [ ] Verificar se arquivo é salvo corretamente

### 4. Teste de Push Notifications
- [ ] Permitir notificações no navegador
- [ ] Verificar se token FCM é gerado
- [ ] Enviar notificação de teste pelo console

## 🚀 Deploy e Produção

### 1. Variáveis de Ambiente (Opcional)
Se quiser usar variáveis de ambiente:

```bash
VITE_FIREBASE_API_KEY=sua_api_key
VITE_FIREBASE_AUTH_DOMAIN=seu_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu_project_id
VITE_FIREBASE_STORAGE_BUCKET=seu_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
VITE_FIREBASE_APP_ID=seu_app_id
```

### 2. Build Nativo
```bash
# Instalar dependências
npm install

# Build do projeto
npm run build

# Sincronizar com plataformas nativas
npx cap sync

# Executar no Android
npx cap run android

# Executar no iOS
npx cap run ios
```

## ⚠️ Segurança e Boas Práticas

- [ ] **NUNCA** commite credenciais reais no GitHub público
- [ ] Use variáveis de ambiente para produção
- [ ] Configure regras de segurança restritivas
- [ ] Monitore uso e custos no Firebase Console
- [ ] Configure alertas de faturamento
- [ ] Faça backup regular dos dados do Firestore

## 🆘 Troubleshooting

### Erro: "Firebase API key is invalid"
- Verifique se copiou a API key corretamente
- Certifique-se de que o projeto Firebase está ativo

### Erro: "Permission denied"
- Verifique as regras de segurança do Firestore
- Certifique-se de que o usuário está autenticado

### Notificações não funcionam
- Verifique se a VAPID key está correta
- Certifique-se de que Cloud Messaging está habilitado
- Verifique se o service worker está registrado

### Build nativo falha
- Certifique-se de que os arquivos de configuração estão nos lugares corretos
- Execute `npx cap sync` após mudanças
- Verifique se as dependências do Capacitor estão instaladas

## 📞 Suporte

Se tiver problemas:
1. Verifique o console do navegador para erros
2. Consulte a [documentação do Firebase](https://firebase.google.com/docs)
3. Verifique os logs no Firebase Console

---

**Última atualização:** 2024-01-XX
**Versão:** 1.0