#!/usr/bin/env node

/**
 * Script para analisar uso de rotas da API no frontend
 * 
 * Execução:
 *   node scripts/analyze-api-usage.js
 * 
 * Saída:
 *   - Lista de todas as funções API definidas em src/lib/api.ts
 *   - Onde cada função é importada e usada
 *   - Funções não utilizadas
 *   - Relatório de uso por componente
 */

const fs = require('fs');
const path = require('path');

// Configurações
const API_FILE = 'src/lib/api.ts';
const SRC_DIR = 'src';
const EXCLUDE_DIRS = ['node_modules', 'dist', 'build', '.git'];
const EXCLUDE_FILES = ['api.ts']; // Não contar definições no próprio arquivo

// Cores para terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Extrai todas as funções exportadas de api.ts
function extractApiFunctions(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const functions = [];
  
  // Regex para capturar funções exportadas
  const exportRegex = /export\s+(?:async\s+)?(?:const|function)\s+(\w+)/g;
  let match;
  
  while ((match = exportRegex.exec(content)) !== null) {
    const funcName = match[1];
    // Ignora 'api' (axios instance) e tipos/interfaces
    if (funcName !== 'api' && funcName !== 'API_BASE_URL') {
      functions.push(funcName);
    }
  }
  
  return functions.sort();
}

// Busca recursivamente por arquivos .ts, .tsx, .js, .jsx
function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!EXCLUDE_DIRS.includes(file)) {
        findFiles(filePath, fileList);
      }
    } else {
      if (/\.(ts|tsx|js|jsx)$/.test(file) && !EXCLUDE_FILES.includes(file)) {
        fileList.push(filePath);
      }
    }
  });
  
  return fileList;
}

// Busca uso de uma função específica em um arquivo
function findUsageInFile(filePath, funcName) {
  const content = fs.readFileSync(filePath, 'utf8');
  const usages = [];
  
  // Verifica se o arquivo importa a função
  const importRegex = new RegExp(`import\\s+{[^}]*\\b${funcName}\\b[^}]*}\\s+from\\s+["']@/lib/api["']`, 'g');
  const hasImport = importRegex.test(content);
  
  if (!hasImport) {
    return usages;
  }
  
  // Busca usos da função (chamadas)
  const lines = content.split('\n');
  const usageRegex = new RegExp(`\\b${funcName}\\s*\\(`, 'g');
  
  lines.forEach((line, index) => {
    if (usageRegex.test(line)) {
      usages.push({
        line: index + 1,
        content: line.trim(),
      });
    }
  });
  
  return usages;
}

// Analisa uso de todas as funções
function analyzeApiUsage() {
  console.log(`${colors.bright}${colors.blue}🔍 Analisando uso de rotas da API...${colors.reset}\n`);
  
  // Extrai funções da API
  console.log(`${colors.cyan}📖 Lendo funções de ${API_FILE}...${colors.reset}`);
  const apiFunctions = extractApiFunctions(API_FILE);
  console.log(`${colors.green}✓ ${apiFunctions.length} funções encontradas${colors.reset}\n`);
  
  // Busca arquivos no projeto
  console.log(`${colors.cyan}📂 Procurando arquivos no projeto...${colors.reset}`);
  const files = findFiles(SRC_DIR);
  console.log(`${colors.green}✓ ${files.length} arquivos para analisar${colors.reset}\n`);
  
  // Mapeia uso de cada função
  console.log(`${colors.cyan}🔎 Analisando uso das funções...${colors.reset}\n`);
  
  const usageMap = {};
  const unusedFunctions = [];
  
  apiFunctions.forEach(funcName => {
    usageMap[funcName] = [];
    
    files.forEach(file => {
      const usages = findUsageInFile(file, funcName);
      if (usages.length > 0) {
        usageMap[funcName].push({
          file: file.replace(/\\/g, '/'),
          usages: usages,
        });
      }
    });
    
    if (usageMap[funcName].length === 0) {
      unusedFunctions.push(funcName);
    }
  });
  
  return { usageMap, unusedFunctions, totalFunctions: apiFunctions.length };
}

// Gera relatório em Markdown
function generateMarkdownReport(usageMap, unusedFunctions, totalFunctions) {
  let report = `# 📊 Relatório de Uso de Rotas da API\n\n`;
  report += `**Data de Geração**: ${new Date().toLocaleString('pt-BR')}\n\n`;
  report += `## 📈 Resumo Executivo\n\n`;
  report += `- **Total de funções API**: ${totalFunctions}\n`;
  report += `- **Funções utilizadas**: ${totalFunctions - unusedFunctions.length}\n`;
  report += `- **Funções não utilizadas**: ${unusedFunctions.length}\n`;
  report += `- **Taxa de utilização**: ${((totalFunctions - unusedFunctions.length) / totalFunctions * 100).toFixed(1)}%\n\n`;
  
  report += `---\n\n`;
  
  // Funções não utilizadas
  if (unusedFunctions.length > 0) {
    report += `## ⚠️ Funções Não Utilizadas (${unusedFunctions.length})\n\n`;
    report += `**Estas funções podem ser removidas do código:**\n\n`;
    unusedFunctions.forEach(func => {
      report += `- \`${func}\`\n`;
    });
    report += `\n---\n\n`;
  }
  
  // Funções utilizadas com detalhes
  const usedFunctions = Object.entries(usageMap).filter(([_, usage]) => usage.length > 0);
  
  if (usedFunctions.length > 0) {
    report += `## ✅ Funções Utilizadas (${usedFunctions.length})\n\n`;
    
    usedFunctions.forEach(([funcName, locations]) => {
      const totalUsages = locations.reduce((sum, loc) => sum + loc.usages.length, 0);
      report += `### \`${funcName}\`\n\n`;
      report += `**Total de usos**: ${totalUsages} em ${locations.length} arquivo(s)\n\n`;
      
      locations.forEach(location => {
        report += `#### 📁 \`${location.file}\`\n\n`;
        location.usages.forEach(usage => {
          report += `- **Linha ${usage.line}**: \`${usage.content.substring(0, 100)}${usage.content.length > 100 ? '...' : ''}\`\n`;
        });
        report += `\n`;
      });
      
      report += `---\n\n`;
    });
  }
  
  // Estatísticas por arquivo
  report += `## 📂 Uso por Arquivo\n\n`;
  
  const fileUsage = {};
  Object.entries(usageMap).forEach(([funcName, locations]) => {
    locations.forEach(location => {
      if (!fileUsage[location.file]) {
        fileUsage[location.file] = [];
      }
      fileUsage[location.file].push(funcName);
    });
  });
  
  const sortedFiles = Object.entries(fileUsage)
    .sort((a, b) => b[1].length - a[1].length);
  
  sortedFiles.forEach(([file, functions]) => {
    report += `### \`${file}\`\n\n`;
    report += `**${functions.length} função(ões) usada(s)**:\n\n`;
    functions.forEach(func => {
      report += `- \`${func}\`\n`;
    });
    report += `\n`;
  });
  
  return report;
}

// Exibe relatório no console
function displayConsoleReport(usageMap, unusedFunctions, totalFunctions) {
  console.log(`\n${colors.bright}${colors.green}✅ Análise concluída!${colors.reset}\n`);
  console.log(`${colors.bright}═══════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}📊 RESUMO EXECUTIVO${colors.reset}`);
  console.log(`${colors.bright}═══════════════════════════════════════════════════${colors.reset}\n`);
  
  console.log(`${colors.bright}Total de funções API:${colors.reset} ${totalFunctions}`);
  console.log(`${colors.green}${colors.bright}Funções utilizadas:${colors.reset} ${totalFunctions - unusedFunctions.length}`);
  console.log(`${colors.red}${colors.bright}Funções não utilizadas:${colors.reset} ${unusedFunctions.length}`);
  console.log(`${colors.yellow}${colors.bright}Taxa de utilização:${colors.reset} ${((totalFunctions - unusedFunctions.length) / totalFunctions * 100).toFixed(1)}%\n`);
  
  if (unusedFunctions.length > 0) {
    console.log(`${colors.bright}${colors.red}⚠️  FUNÇÕES NÃO UTILIZADAS (${unusedFunctions.length})${colors.reset}`);
    console.log(`${colors.bright}═══════════════════════════════════════════════════${colors.reset}\n`);
    unusedFunctions.forEach(func => {
      console.log(`${colors.red}  ✗ ${func}${colors.reset}`);
    });
    console.log('');
  }
  
  // Top 10 arquivos com mais chamadas de API
  const fileUsage = {};
  Object.entries(usageMap).forEach(([funcName, locations]) => {
    locations.forEach(location => {
      if (!fileUsage[location.file]) {
        fileUsage[location.file] = { count: 0, functions: new Set() };
      }
      fileUsage[location.file].count += location.usages.length;
      fileUsage[location.file].functions.add(funcName);
    });
  });
  
  const topFiles = Object.entries(fileUsage)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10);
  
  if (topFiles.length > 0) {
    console.log(`${colors.bright}${colors.cyan}📈 TOP 10 ARQUIVOS COM MAIS CHAMADAS DE API${colors.reset}`);
    console.log(`${colors.bright}═══════════════════════════════════════════════════${colors.reset}\n`);
    
    topFiles.forEach(([file, data], index) => {
      const shortFile = file.replace('src/', '');
      console.log(`${colors.bright}${index + 1}.${colors.reset} ${colors.cyan}${shortFile}${colors.reset}`);
      console.log(`   ${colors.yellow}${data.count} chamadas${colors.reset} | ${colors.green}${data.functions.size} funções diferentes${colors.reset}`);
    });
    console.log('');
  }
}

// Função principal
function main() {
  try {
    const { usageMap, unusedFunctions, totalFunctions } = analyzeApiUsage();
    
    // Exibe relatório no console
    displayConsoleReport(usageMap, unusedFunctions, totalFunctions);
    
    // Gera relatório em Markdown
    const report = generateMarkdownReport(usageMap, unusedFunctions, totalFunctions);
    const reportPath = 'API_USAGE_REPORT.md';
    fs.writeFileSync(reportPath, report);
    
    console.log(`${colors.bright}${colors.green}✓ Relatório detalhado salvo em: ${reportPath}${colors.reset}\n`);
    
    if (unusedFunctions.length > 0) {
      console.log(`${colors.yellow}${colors.bright}💡 Dica:${colors.reset} Revise as funções não utilizadas no relatório para decidir se podem ser removidas.\n`);
    }
    
  } catch (error) {
    console.error(`${colors.red}${colors.bright}❌ Erro:${colors.reset} ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

// Executa
main();
