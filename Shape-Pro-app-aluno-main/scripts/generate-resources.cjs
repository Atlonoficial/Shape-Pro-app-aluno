#!/usr/bin/env node

/**
 * Shape Pro - Resource Generator
 * 
 * Gera automaticamente splash screens e ícones para Android e iOS
 * usando cordova-res a partir das imagens fonte em public/
 * 
 * Uso: npm run resources
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Cores para logs
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.cyan);
}

function execCommand(command, description) {
  try {
    logInfo(`${description}...`);
    execSync(command, { stdio: 'inherit' });
    logSuccess(`${description} - Concluído`);
    return true;
  } catch (error) {
    logError(`${description} - Falhou`);
    return false;
  }
}

function checkCordovaRes() {
  try {
    execSync('cordova-res --version', { stdio: 'pipe' });
    return true;
  } catch (error) {
    return false;
  }
}

function createDirectories() {
  const dirs = [
    'resources',
    'resources/android',
    'resources/ios',
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      logSuccess(`Criado: ${dir}/`);
    }
  });
}

function copyImages() {
  const sourceImage = 'public/splash-source-black.png';
  
  if (!fs.existsSync(sourceImage)) {
    logError(`Imagem fonte não encontrada: ${sourceImage}`);
    logInfo('Certifique-se de ter o arquivo splash-source-black.png em public/');
    process.exit(1);
  }

  const copies = [
    { src: sourceImage, dest: 'resources/splash.png' },
    { src: sourceImage, dest: 'resources/icon.png' },
    { src: sourceImage, dest: 'resources/ios/splash.png' },
  ];

  copies.forEach(({ src, dest }) => {
    fs.copyFileSync(src, dest);
    const stats = fs.statSync(dest);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    logSuccess(`Copiado: ${dest} (${sizeMB} MB)`);
  });
}

function validateImageSize() {
  const splashPath = 'resources/splash.png';
  const stats = fs.statSync(splashPath);
  const sizeMB = stats.size / (1024 * 1024);

  if (sizeMB < 1 || sizeMB > 10) {
    logWarning(`Tamanho da imagem: ${sizeMB.toFixed(2)} MB (esperado: 2-3 MB)`);
    logWarning('Verifique se a imagem tem 2732x2732px');
  } else {
    logSuccess(`Tamanho da imagem validado: ${sizeMB.toFixed(2)} MB`);
  }
}

function generateResources() {
  logInfo('Gerando resources para Android e iOS...\n');

  const androidSuccess = execCommand(
    'cordova-res android --skip-config --copy',
    'Gerando resources Android'
  );

  const iosSuccess = execCommand(
    'cordova-res ios --skip-config --copy',
    'Gerando resources iOS'
  );

  return androidSuccess && iosSuccess;
}

function printSummary() {
  console.log('\n' + '='.repeat(60));
  log('📱 Resources Gerados com Sucesso!', colors.bright + colors.green);
  console.log('='.repeat(60) + '\n');

  logInfo('Próximos passos:');
  console.log('  1. npm run build');
  console.log('  2. npx cap sync android');
  console.log('  3. npx cap sync ios');
  console.log('  4. npx cap run android (ou npx cap open ios)\n');

  logInfo('Arquivos gerados:');
  console.log('  • android/app/src/main/res/mipmap-*/');
  console.log('  • android/app/src/main/res/drawable-*/');
  console.log('  • ios/App/App/Assets.xcassets/AppIcon.appiconset/');
  console.log('  • ios/App/App/Assets.xcassets/Splash.imageset/\n');
}

// Main execution
async function main() {
  console.log('\n' + '='.repeat(60));
  log('🚀 Shape Pro - Resource Generator', colors.bright + colors.cyan);
  console.log('='.repeat(60) + '\n');

  // 1. Verificar cordova-res
  if (!checkCordovaRes()) {
    logError('cordova-res não encontrado!');
    logInfo('Instale com: npm install -g cordova-res');
    process.exit(1);
  }
  logSuccess('cordova-res encontrado');

  // 2. Criar diretórios
  createDirectories();

  // 3. Copiar imagens
  copyImages();

  // 4. Validar tamanho
  validateImageSize();

  // 5. Gerar resources
  const success = generateResources();

  // 6. Mostrar resumo
  if (success) {
    printSummary();
    process.exit(0);
  } else {
    logError('Falha ao gerar resources');
    process.exit(1);
  }
}

main();
