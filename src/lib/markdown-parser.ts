export function extractFeatures(markdown: string): Array<{id: string, name: string, description: string}> {
  const sections = extractSections(markdown);
  const coreFeaturesSection = sections['3. Core Features'] || '';

  const features: Array<{id: string, name: string, description: string}> = [];
  const lines = coreFeaturesSection.split('\n');
  
  let isTable = false;
  
  for (const line of lines) {
    if (line.trim().startsWith('| # |')) {
      isTable = true;
      continue;
    }
    if (isTable && line.trim().startsWith('|---')) {
      continue;
    }
    
    if (isTable && line.trim().startsWith('|')) {
      const parts = line.split('|').map(s => s.trim());
      if (parts.length >= 4) {
        const id = parts[1];
        const name = parts[2];
        const description = parts[3];
        if (id && name) {
          features.push({ id, name, description });
        }
      }
    }
  }

  return features;
}

export function extractSections(markdown: string): Record<string, string> {
  const sections: Record<string, string> = {};
  const lines = markdown.split('\n');
  
  let currentSection = '';
  let currentContent: string[] = [];
  
  for (const line of lines) {
    if (line.match(/^##\s+/)) {
      if (currentSection) {
        sections[currentSection] = currentContent.join('\n').trim();
      }
      currentSection = line.replace(/^##\s+/, '').trim();
      currentContent = [];
    } else if (currentSection) {
      currentContent.push(line);
    }
  }
  
  if (currentSection) {
    sections[currentSection] = currentContent.join('\n').trim();
  }
  
  return sections;
}

export function replaceSection(markdown: string, sectionName: string, newContent: string): string {
  const regex = new RegExp(`(##\\s+${sectionName}\\s*\\n)([\\s\\S]*?)(?=\\n##\\s+|$)`, 'i');
  return markdown.replace(regex, `$1${newContent}\n`);
}

export function appendBreakdown(markdown: string, featureName: string, breakdownContent: string): string {
  const section8Title = '## 8. Feature Breakdown & Tasks';
  const breakdownItem = `### ${featureName}\n${breakdownContent}\n`;
  
  if (markdown.includes(section8Title)) {
    return markdown + '\n' + breakdownItem;
  } else {
    return markdown + '\n\n' + section8Title + '\n\n' + breakdownItem;
  }
}

export function getBreakdownStatus(markdown: string, features: Array<{id: string, name: string}>): Record<string, boolean> {
  const status: Record<string, boolean> = {};
  const sections = extractSections(markdown);
  const breakdownSection = sections['8. Feature Breakdown & Tasks'] || '';
  
  for (const feature of features) {
    status[feature.id] = breakdownSection.includes(`### ${feature.name}`);
  }
  
  return status;
}
