#!/bin/bash

# 🔔 Script de Teste OneSignal - Shape Pro
# BUILD 28 - Testes automatizados de notificações push

set -e

echo "🔔 ============================================"
echo "   OneSignal Test Suite - Shape Pro"
echo "============================================"
echo ""

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurações
SUPABASE_URL="https://bqbopkqzkavhmenjlhab.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxYm9wa3F6a2F2aG1lbmpsaGFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MjEwMTQsImV4cCI6MjA3MDQ5NzAxNH0.AeqAVWHVqyAn7wxNvHeuQFkJREHUTB9fZP22qpv73d0"
EDGE_FUNCTION_URL="$SUPABASE_URL/functions/v1/send-push-notification"

# Função para printar com cor
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# TESTE 1: Edge Function está respondendo?
echo "📡 TESTE 1: Verificando Edge Function..."
echo "-------------------------------------------"

RESPONSE=$(curl -s -X POST "$EDGE_FUNCTION_URL" \
  -H "Content-Type: application/json" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -d '{
    "title": "Teste Automatizado BUILD 28",
    "message": "Script de teste OneSignal",
    "target_users": ["test-user-id"]
  }')

echo "Response: $RESPONSE"

if echo "$RESPONSE" | grep -q "error"; then
    if echo "$RESPONSE" | grep -q "No player IDs found"; then
        print_warning "Edge Function funcionando, mas sem Player IDs no banco"
        echo "           Isso é esperado se nenhum usuário aceitou permissões ainda"
    elif echo "$RESPONSE" | grep -q "Missing OneSignal API credentials"; then
        print_error "Secrets não configurados no Supabase Vault!"
        echo ""
        print_info "Configure os seguintes secrets:"
        echo "           1. ONESIGNAL_API_KEY"
        echo "           2. ONESIGNAL_APP_ID"
        echo "           https://supabase.com/dashboard/project/bqbopkqzkavhmenjlhab/settings/vault/secrets"
        exit 1
    else
        print_error "Erro desconhecido na Edge Function"
    fi
else
    print_success "Edge Function respondeu com sucesso!"
fi

echo ""

# TESTE 2: Verificar usuários com Player IDs
echo "👥 TESTE 2: Verificando Player IDs no banco..."
echo "-------------------------------------------"

print_info "Executando query SQL via Supabase REST API..."

QUERY_RESPONSE=$(curl -s -X POST "$SUPABASE_URL/rest/v1/rpc/check_player_ids" \
  -H "Content-Type: application/json" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" 2>&1 || echo "query_failed")

if echo "$QUERY_RESPONSE" | grep -q "query_failed"; then
    print_warning "Não foi possível verificar Player IDs via API"
    print_info "Verifique manualmente no Supabase Dashboard:"
    echo "           SELECT id, email, onesignal_player_id FROM profiles WHERE onesignal_player_id IS NOT NULL;"
else
    print_success "Consulta executada (verifique logs acima)"
fi

echo ""

# TESTE 3: Verificar Service Workers
echo "🔧 TESTE 3: Verificando arquivos necessários..."
echo "-------------------------------------------"

if [ -f "public/OneSignalSDKWorker.js" ]; then
    print_success "Service Worker encontrado: public/OneSignalSDKWorker.js"
else
    print_error "Service Worker NÃO encontrado!"
fi

if [ -f "android/app/src/main/assets/public/OneSignalSDKWorker.js" ]; then
    print_success "Service Worker Android encontrado"
else
    print_warning "Service Worker Android NÃO encontrado (ok se não for mobile)"
fi

if [ -f "src/lib/push.ts" ]; then
    print_success "Biblioteca push.ts encontrada"
else
    print_error "src/lib/push.ts NÃO encontrado!"
fi

echo ""

# TESTE 4: Verificar variáveis de ambiente
echo "🔑 TESTE 4: Verificando configuração local..."
echo "-------------------------------------------"

if [ -f ".env" ]; then
    if grep -q "VITE_ONESIGNAL_APP_ID" .env; then
        APP_ID=$(grep VITE_ONESIGNAL_APP_ID .env | cut -d '=' -f 2 | tr -d '"' | tr -d ' ')
        if [ "$APP_ID" == "be1bd1f4-bd4f-4dc9-9c33-7b9f7fe5dc82" ]; then
            print_success "VITE_ONESIGNAL_APP_ID configurado corretamente"
        else
            print_error "APP_ID incorreto: $APP_ID"
        fi
    else
        print_error "VITE_ONESIGNAL_APP_ID não encontrado no .env"
    fi
else
    print_warning "Arquivo .env não encontrado"
fi

echo ""

# RESUMO FINAL
echo "📊 ============================================"
echo "   RESUMO DOS TESTES"
echo "============================================"
echo ""

print_info "Próximos passos:"
echo "   1. Configure os secrets no Supabase Vault (se ainda não fez)"
echo "   2. Abra o app em um dispositivo real e aceite permissões"
echo "   3. Verifique os logs no console para confirmar Player ID"
echo "   4. Execute este script novamente após ter Player IDs"
echo ""

print_info "Documentação completa:"
echo "   docs/ONESIGNAL_CONFIG.md"
echo ""

print_success "Testes concluídos! ✨"
