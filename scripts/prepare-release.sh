#!/bin/bash
# Shape Pro - Release Preparation Script
# BUILD 29 (v4.0.0)

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  Shape Pro - Release Preparation                          ║"
echo "║  BUILD 29 (v4.0.0)                                        ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Step 1: Clean previous builds
echo -e "${BLUE}[1/6]${NC} 🧹 Limpando builds anteriores..."
if [ -d "android/app/build" ]; then
    rm -rf android/app/build
    echo -e "${GREEN}✓${NC} Android build limpo"
fi
if [ -d "ios/App/build" ]; then
    rm -rf ios/App/build
    echo -e "${GREEN}✓${NC} iOS build limpo"
fi
if [ -d "dist" ]; then
    rm -rf dist
    echo -e "${GREEN}✓${NC} Dist limpo"
fi
echo ""

# Step 2: Install dependencies
echo -e "${BLUE}[2/6]${NC} 📦 Instalando dependências..."
npm install
echo -e "${GREEN}✓${NC} Dependências instaladas"
echo ""

# Step 3: Build web application
echo -e "${BLUE}[3/6]${NC} 🏗️  Building aplicação web..."
npm run build
echo -e "${GREEN}✓${NC} Build concluído"
echo ""

# Step 4: Sync with native platforms
echo -e "${BLUE}[4/6]${NC} 🔄 Sincronizando com plataformas nativas..."
npx cap sync
echo -e "${GREEN}✓${NC} Sync concluído"
echo ""

# Step 5: Verify versions
echo -e "${BLUE}[5/6]${NC} ✅ Verificando versões..."

ERRORS=0

# Check Android build.gradle
if grep -q "versionCode 29" android/app/build.gradle; then
    echo -e "${GREEN}✓${NC} Android versionCode: 29"
else
    echo -e "${RED}✗${NC} Android versionCode incorreto (esperado: 29)"
    ERRORS=$((ERRORS + 1))
fi

if grep -q 'versionName "4.0.0"' android/app/build.gradle; then
    echo -e "${GREEN}✓${NC} Android versionName: 4.0.0"
else
    echo -e "${RED}✗${NC} Android versionName incorreto (esperado: 4.0.0)"
    ERRORS=$((ERRORS + 1))
fi

# Check capacitor.config.json
if grep -q '"version": "29"' android/app/src/main/assets/capacitor.config.json; then
    echo -e "${GREEN}✓${NC} Capacitor version: 29"
else
    echo -e "${RED}✗${NC} Capacitor version incorreto (esperado: 29)"
    ERRORS=$((ERRORS + 1))
fi

# Check capacitor.config.ts
if grep -q 'CFBundleShortVersionString: "4.0.0"' capacitor.config.ts; then
    echo -e "${GREEN}✓${NC} iOS CFBundleShortVersionString: 4.0.0"
else
    echo -e "${RED}✗${NC} iOS CFBundleShortVersionString incorreto (esperado: 4.0.0)"
    ERRORS=$((ERRORS + 1))
fi

if grep -q "CFBundleVersion: '29'" capacitor.config.ts; then
    echo -e "${GREEN}✓${NC} iOS CFBundleVersion: 29"
else
    echo -e "${RED}✗${NC} iOS CFBundleVersion incorreto (esperado: 29)"
    ERRORS=$((ERRORS + 1))
fi

# Check iOS entitlements
if grep -q '<string>production</string>' ios/App/App/App.entitlements; then
    echo -e "${GREEN}✓${NC} iOS aps-environment: production"
else
    echo -e "${RED}✗${NC} iOS aps-environment incorreto (esperado: production)"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# Step 6: Summary
if [ $ERRORS -eq 0 ]; then
    echo -e "${BLUE}[6/6]${NC} ${GREEN}✅ BUILD 29 (v4.0.0) pronto para release!${NC}"
    echo ""
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║  Próximos Passos                                          ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""
    echo -e "${YELLOW}📱 Android (Google Play):${NC}"
    echo "  1. cd android"
    echo "  2. ./gradlew bundleRelease"
    echo "  3. Upload: app/build/outputs/bundle/release/app-release.aab"
    echo ""
    echo -e "${YELLOW}🍎 iOS (App Store):${NC}"
    echo "  1. npx cap open ios"
    echo "  2. Product → Archive (Xcode)"
    echo "  3. Organizer → Distribute App → App Store Connect"
    echo ""
    echo -e "${BLUE}📚 Documentação:${NC}"
    echo "  - docs/BUILD_29_v4.0.0_RELEASE.md"
    echo "  - scripts/android-release-build.md"
    echo "  - scripts/ios-release-build.md"
    echo ""
    exit 0
else
    echo -e "${BLUE}[6/6]${NC} ${RED}❌ Encontrados $ERRORS erro(s) de versão!${NC}"
    echo ""
    echo -e "${YELLOW}Por favor, verifique os arquivos acima e corrija as versões.${NC}"
    echo ""
    exit 1
fi
