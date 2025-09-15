#!/usr/bin/env node

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

// Read all .user.js files in the root directory
const userscriptFiles = readdirSync('.')
  .filter(file => file.endsWith('.user.js'))
  .sort();

// Extract metadata from userscript files
function extractMetadata(filePath) {
  const content = readFileSync(filePath, 'utf8');
  const metadataMatch = content.match(/\/\/ ==UserScript==([\s\S]*?)\/\/ ==\/UserScript==/);
  
  if (!metadataMatch) {
    return null;
  }

  const metadata = {};
  const metadataContent = metadataMatch[1];
  
  // Extract common metadata fields
  const nameMatch = metadataContent.match(/\/\/ @name\s+(.+)/);
  const descriptionMatch = metadataContent.match(/\/\/ @description\s+(.+)/);
  const versionMatch = metadataContent.match(/\/\/ @version\s+(.+)/);
  const authorMatch = metadataContent.match(/\/\/ @author\s+(.+)/);
  const matchMatches = metadataContent.match(/\/\/ @match\s+(.+)/g);
  
  if (nameMatch) metadata.name = nameMatch[1].trim();
  if (descriptionMatch) metadata.description = descriptionMatch[1].trim();
  if (versionMatch) metadata.version = versionMatch[1].trim();
  if (authorMatch) metadata.author = authorMatch[1].trim();
  if (matchMatches) {
    metadata.matches = matchMatches.map(match => 
      match.replace(/\/\/ @match\s+/, '').trim()
    );
  }
  
  return metadata;
}

// Generate catalog content
let catalogContent = `# ☠️ 4ndr0tools ☠️

A modular userscript suite for digital emancipation.

## Script Catalog

| Script | Description | Version |
|--------|-------------|---------|
`;

userscriptFiles.forEach(file => {
  const metadata = extractMetadata(file);
  if (metadata) {
    const name = metadata.name || file.replace('.user.js', '');
    const description = metadata.description || 'No description available';
    const version = metadata.version || 'Unknown';
    
    catalogContent += `| [${name}](${file}) | ${description} | ${version} |\n`;
  }
});

catalogContent += `
## Installation

1. Install a userscript manager like [Tampermonkey](https://www.tampermonkey.net/) or [Greasemonkey](https://www.greasespot.net/)
2. Click on any script link above
3. Your userscript manager should prompt you to install the script

## License

MIT License - See individual scripts for specific licensing information.
`;

// Write the updated README.md
writeFileSync('README.md', catalogContent);
console.log('Script catalog updated successfully!');
