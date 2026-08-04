export function extractFeatures(markdown: string): Array<{id: string, name: string, description: string}> {
  const sections = extractSections(markdown);
  const frKey = Object.keys(sections).find((k) => /Functional Requirements/i.test(k));
  const frSection = frKey ? sections[frKey] : '';

  const features: Array<{id: string, name: string, description: string}> = [];
  const lines = frSection.split('\n');
  
  let isTable = false;
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^\|[ ]*#/.test(trimmed) || /^\|.*ID/i.test(trimmed)) {
      isTable = true;
      continue;
    }
    if (isTable && /^\|[\s:|-]+\|/.test(trimmed)) {
      continue; // separator row
    }
    
    if (isTable && trimmed.startsWith('|')) {
      const raw = trimmed.split('|').map(s => s.trim());
      const id = raw[1] || '';
      const name = raw[2] || '';
      const description = raw[3] || '';
      if (id && name && !/^ID$/i.test(id)) {
        features.push({ id, name, description });
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
  const nums = [...markdown.matchAll(/^##\s+(\d+)\./gm)].map((m) => parseInt(m[1], 10));
  const nextNum = nums.length ? Math.max(...nums) + 1 : 8;
  const section8Title = `## ${nextNum}. Feature Breakdown & Tasks`;
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
  const breakdownKey = Object.keys(sections).find((k) => k.includes('Feature Breakdown & Tasks')) || '';
  const breakdownSection = sections[breakdownKey] || '';
  
  for (const feature of features) {
    status[feature.id] = breakdownSection.includes(`### ${feature.name}`);
  }
  
  return status;
}
