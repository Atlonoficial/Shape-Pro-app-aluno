const fs = require('fs');
const glob = require('glob');

// Buscar TODOS os arquivos .ts e .tsx (incluindo lib/)
const files = glob.sync('src/**/*.{ts,tsx}', { ignore: '**/node_modules/**' });

let totalReplacements = 0;
let filesModified = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let modified = false;
  
  // Verificar se já tem import do logger
  const hasLoggerImport = content.includes("from '@/lib/logger'") || 
                          content.includes('from "@/lib/logger"');
  
  // Contar ocorrências ANTES
  const consoleMatches = content.match(/console\.(log|error|warn|info|debug)\(/g);
  const countBefore = consoleMatches ? consoleMatches.length : 0;
  
  // Substituir console.* por logger.*
  const newContent = content
    .replace(/console\.log\(/g, 'logger.info(')
    .replace(/console\.error\(/g, 'logger.error(')
    .replace(/console\.warn\(/g, 'logger.warn(')
    .replace(/console\.info\(/g, 'logger.info(')
    .replace(/console\.debug\(/g, 'logger.debug(');
  
  if (newContent !== content) {
    modified = true;
    content = newContent;
    
    // Adicionar import se não existir
    if (!hasLoggerImport) {
      const importStatement = "import { logger } from '@/lib/logger';\n";
      if (content.includes('import')) {
        // Adicionar após último import
        const lastImportIndex = content.lastIndexOf('import');
        const lineEndIndex = content.indexOf('\n', lastImportIndex);
        content = content.slice(0, lineEndIndex + 1) + importStatement + content.slice(lineEndIndex + 1);
      } else {
        // Adicionar no início
        content = importStatement + content;
      }
    }
    
    // Contar DEPOIS
    const afterMatches = content.match(/console\./g);
    const countAfter = afterMatches ? afterMatches.length : 0;
    
    totalReplacements += (countBefore - countAfter);
    filesModified++;
  }
  
  if (modified) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`✅ ${file}: ${countBefore} console.* → 0`);
  }
});

console.log(`\n🎉 Substituição concluída!`);
console.log(`📝 Arquivos modificados: ${filesModified}`);
console.log(`🔄 Total de substituições: ${totalReplacements}`);
