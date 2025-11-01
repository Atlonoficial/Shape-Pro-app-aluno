# Shape Pro - ProGuard Rules for Production Build
# Otimizado para reduzir tamanho do APK e melhorar performance

# ============================================================
# CONFIGURAÇÕES BÁSICAS
# ============================================================

# Preservar números de linha para stack traces
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# Preservar annotations
-keepattributes *Annotation*

# Preservar assinaturas genéricas
-keepattributes Signature

# Preservar informações de exceptions
-keepattributes Exceptions

# ============================================================
# CAPACITOR & CORDOVA
# ============================================================

# Manter todas as classes do Capacitor
-keep class com.getcapacitor.** { *; }
-keepclassmembers class com.getcapacitor.** { *; }

# Manter todas as classes de plugins Cordova
-keep class org.apache.cordova.** { *; }
-keepclassmembers class org.apache.cordova.** { *; }

# Manter WebView JavaScript interfaces
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# ============================================================
# ONESIGNAL PUSH NOTIFICATIONS
# ============================================================

# Manter classes do OneSignal
-keep class com.onesignal.** { *; }
-dontwarn com.onesignal.**

# Manter Google Play Services (usado pelo OneSignal)
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.android.gms.**

# Firebase Cloud Messaging
-keep class com.google.firebase.** { *; }
-dontwarn com.google.firebase.**

# ============================================================
# SUPABASE & NETWORKING
# ============================================================

# OkHttp (usado pelo Supabase)
-dontwarn okhttp3.**
-dontwarn okio.**
-keep class okhttp3.** { *; }
-keep class okio.** { *; }

# Retrofit (se usado)
-dontwarn retrofit2.**
-keep class retrofit2.** { *; }

# ============================================================
# ANDROIDX & SUPPORT LIBRARIES
# ============================================================

-keep class androidx.** { *; }
-keep interface androidx.** { *; }
-dontwarn androidx.**

# ============================================================
# KOTLIN
# ============================================================

-keep class kotlin.** { *; }
-keep class kotlin.Metadata { *; }
-dontwarn kotlin.**
-keepclassmembers class **$WhenMappings {
    <fields>;
}

# ============================================================
# GSON / JSON
# ============================================================

-keepattributes Signature
-keepattributes *Annotation*
-dontwarn sun.misc.**
-keep class com.google.gson.** { *; }
-keep class * implements com.google.gson.TypeAdapter
-keep class * implements com.google.gson.TypeAdapterFactory
-keep class * implements com.google.gson.JsonSerializer
-keep class * implements com.google.gson.JsonDeserializer

# ============================================================
# OTIMIZAÇÕES ADICIONAIS
# ============================================================

# Remover logs em produção
-assumenosideeffects class android.util.Log {
    public static boolean isLoggable(java.lang.String, int);
    public static int v(...);
    public static int i(...);
    public static int w(...);
    public static int d(...);
    public static int e(...);
}

# Otimizar strings
-optimizations !code/simplification/string

# Remover código morto
-optimizations !code/simplification/arithmetic,!field/*,!class/merging/*
