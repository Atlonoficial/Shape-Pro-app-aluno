#!/usr/bin/env node

/**
 * Shape Pro - Mobile Build Script
 * Script para automatizar o build e deploy mobile
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Cores para output do terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function execCommand(command, description) {
  log(`\n🔄 ${description}...`, 'blue');
  try {
    execSync(command, { stdio: 'inherit' });
    log(`✅ ${description} concluído!`, 'green');
  } catch (error) {
    log(`❌ Erro em: ${description}`, 'red');
    process.exit(1);
  }
}

function checkCapacitorConfig() {
  const configPath = path.join(process.cwd(), 'capacitor.config.ts');
  if (!fs.existsSync(configPath)) {
    log('❌ capacitor.config.ts não encontrado!', 'red');
    process.exit(1);
  }
  
  const config = fs.readFileSync(configPath, 'utf8');
  if (config.includes('server:') && !config.includes('// server:')) {
    log('⚠️  ATENÇÃO: Configuração de desenvolvimento detectada no capacitor.config.ts', 'yellow');
    log('   Para produção, certifique-se de comentar a seção server:', 'yellow');
    return false;
  }
  
  return true;
}

function main() {
  const args = process.argv.slice(2);
  const platform = args[0]; // 'ios' | 'android' | 'both'
  const isProduction = args.includes('--prod');
  
  log('🚀 Shape Pro - Build Mobile Script', 'cyan');
  log('=====================================', 'cyan');
  
  if (!platform || !['ios', 'android', 'both'].includes(platform)) {
    log('❌ Plataforma não especificada!', 'red');
    log('Uso: node scripts/build-mobile.js [ios|android|both] [--prod]', 'yellow');
    process.exit(1);
  }
  
  // Verificar configurações
  if (isProduction && !checkCapacitorConfig()) {
    log('⚠️  Continuando mesmo com configuração de desenvolvimento...', 'yellow');
  }
  
  // 1. Build do projeto web
  const buildCommand = isProduction ? 'npm run build' : 'npm run build';
  execCommand(buildCommand, 'Building web application');
  
  // 2. Sync com Capacitor
  execCommand('npx cap sync', 'Syncing with Capacitor');
  
  // 3. Build das plataformas específicas
  if (platform === 'ios' || platform === 'both') {
    log('\n📱 Preparando iOS...', 'magenta');
    
    if (!fs.existsSync('./ios')) {
      execCommand('npx cap add ios', 'Adding iOS platform');
    }
    
    execCommand('npx cap sync ios', 'Syncing iOS');
    
    if (isProduction) {
      log('🔨 Abrindo Xcode para build de produção...', 'blue');
      execCommand('npx cap open ios', 'Opening Xcode');
    } else {
      execCommand('npx cap run ios', 'Running on iOS simulator');
    }
  }
  
  if (platform === 'android' || platform === 'both') {
    log('\n🤖 Preparando Android...', 'magenta');
    
    if (!fs.existsSync('./android')) {
      execCommand('npx cap add android', 'Adding Android platform');
    }
    
    execCommand('npx cap sync android', 'Syncing Android');
    
    if (isProduction) {
      log('🔨 Abrindo Android Studio para build de produção...', 'blue');
      execCommand('npx cap open android', 'Opening Android Studio');
    } else {
      execCommand('npx cap run android', 'Running on Android emulator');
    }
  }
  
  // 4. Instruções finais
  log('\n🎉 Build concluído!', 'green');
  log('=====================================', 'cyan');
  
  if (isProduction) {
    log('\n📋 PRÓXIMOS PASSOS PARA PRODUÇÃO:', 'yellow');
    log('1. Configure certificados de assinatura', 'white');
    log('2. Atualize versão em capacitor.config.ts', 'white');
    log('3. Faça build de release no Xcode/Android Studio', 'white');
    log('4. Teste em dispositivos físicos', 'white');
    log('5. Upload para App Store Connect / Google Play Console', 'white');
  } else {
    log('\n📋 DEVELOPMENT BUILD:', 'yellow');
    log('Apps rodando em modo desenvolvimento', 'white');
    log('Para produção, use: --prod flag', 'white');
  }
}

if (require.main === module) {
  main();
}