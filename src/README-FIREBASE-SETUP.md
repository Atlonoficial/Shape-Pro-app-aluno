# Configuração do Firebase - Shape Pro

## 1. Configuração do Projeto Firebase

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Crie um novo projeto ou use um existente
3. Ative os seguintes serviços:
   - Authentication
   - Cloud Firestore
   - Cloud Messaging
   - Storage

## 2. Configuração de Autenticação

1. No Firebase Console, vá para **Authentication > Sign-in method**
2. Ative os seguintes provedores:
   - Email/Password
   - Google (opcional)
   - Apple (opcional, para iOS)

## 3. Configuração do Firestore

1. Vá para **Firestore Database**
2. Crie um banco de dados em modo de produção
3. Configure as regras de segurança:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Workouts - students can read assigned workouts, teachers can manage all
    match /workouts/{workoutId} {
      allow read: if request.auth != null && 
        (request.auth.uid in resource.data.assignedTo || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.userType == 'teacher');
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.userType == 'teacher';
    }
    
    // Similar rules for nutrition, progress, notifications
    match /nutrition/{planId} {
      allow read: if request.auth != null && 
        (request.auth.uid in resource.data.assignedTo || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.userType == 'teacher');
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.userType == 'teacher';
    }
    
    match /progress/{progressId} {
      allow read, write: if request.auth != null && 
        (resource.data.userId == request.auth.uid || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.userType == 'teacher');
    }
    
    match /notifications/{notificationId} {
      allow read: if request.auth != null && request.auth.uid in resource.data.targetUsers;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.userType == 'teacher';
    }
  }
}
```

## 4. Configuração do Cloud Messaging

1. Vá para **Project Settings > Cloud Messaging**
2. Gere um par de chaves VAPID
3. Anote a chave pública VAPID

## 5. Atualizar Configurações no Código

1. **Firebase Config** (`src/lib/firebase.ts`):
   ```javascript
   const firebaseConfig = {
     apiKey: "SUA_API_KEY",
     authDomain: "SEU_PROJETO.firebaseapp.com",
     projectId: "SEU_PROJECT_ID",
     storageBucket: "SEU_PROJETO.appspot.com",
     messagingSenderId: "SEU_SENDER_ID",
     appId: "SEU_APP_ID"
   };
   ```

2. **VAPID Key** (`src/components/notifications/PushNotifications.tsx`):
   ```javascript
   const token = await getToken(messaging, {
     vapidKey: 'SUA_VAPID_KEY_PUBLICA'
   });
   ```

3. **Service Worker** (`public/firebase-messaging-sw.js`):
   - Atualize com as mesmas configurações do Firebase

## 6. Configuração para Capacitor (Apps Nativos)

### Android
1. Baixe o arquivo `google-services.json` do Firebase Console
2. Coloque o arquivo na pasta `android/app/`

### iOS
1. Baixe o arquivo `GoogleService-Info.plist` do Firebase Console
2. Coloque o arquivo na pasta `ios/App/App/`

## 7. Comandos para Deploy

### Primeira configuração:
```bash
# Instalar dependências
npm install

# Adicionar plataformas nativas
npx cap add android
npx cap add ios

# Build do projeto
npm run build

# Sincronizar com plataformas nativas
npx cap sync
```

### Para executar:
```bash
# Android
npx cap run android

# iOS (requer Mac + Xcode)
npx cap run ios
```

## 8. Estrutura do Banco de Dados

```
/users/{userId}
  - uid: string
  - email: string
  - name: string
  - userType: 'student' | 'teacher'
  - createdAt: timestamp
  - lastLogin: timestamp
  - profileComplete: boolean

/workouts/{workoutId}
  - name: string
  - description: string
  - exercises: Exercise[]
  - duration: number
  - calories: number
  - difficulty: string
  - muscleGroup: string
  - assignedTo: string[] (user IDs)
  - createdBy: string (teacher ID)
  - createdAt: timestamp
  - updatedAt: timestamp

/nutrition/{planId}
  - name: string
  - description: string
  - meals: Meal[]
  - totalCalories: number
  - assignedTo: string[]
  - createdBy: string
  - createdAt: timestamp
  - updatedAt: timestamp

/progress/{progressId}
  - userId: string
  - workoutId?: string
  - mealId?: string
  - type: 'workout' | 'weight' | 'meal' | 'measurement'
  - value: number
  - unit: string
  - notes?: string
  - date: timestamp

/notifications/{notificationId}
  - title: string
  - message: string
  - type: 'workout' | 'meal' | 'reminder' | 'achievement' | 'general'
  - targetUsers: string[]
  - isRead: boolean
  - createdAt: timestamp
  - scheduledFor?: timestamp
```

## 9. Testando a Integração

1. **Autenticação**: Teste login/registro
2. **Firestore**: Verifique se dados são salvos/carregados
3. **Push Notifications**: Teste notificações no dispositivo
4. **Offline**: Teste funcionamento sem internet

## 10. Deploy para Produção

1. Configure regras de segurança do Firestore
2. Configure domínios autorizados na autenticação
3. Gere builds de produção para Android/iOS
4. Publique nas lojas (Google Play Store / App Store)

---

**Importante**: Lembre-se de nunca committar as chaves e configurações reais do Firebase no repositório público. Use variáveis de ambiente ou arquivos de configuração separados para produção.