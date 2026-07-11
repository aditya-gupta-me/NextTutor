import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

function walk(dir: string, files: string[] = []): string[] {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
        walk(p, files);
    } else if (p.endsWith('.tsx') || p.endsWith('.ts')) {
        files.push(p);
    }
  }
  return files;
}

describe('Boxicons SVG Migration', () => {
    const srcDir = path.resolve(__dirname, '..');
    const allFiles = walk(srcDir);

    it('should not have boxicons.min.css in layout.tsx', () => {
        const layoutPath = path.join(srcDir, 'app', 'layout.tsx');
        expect(fs.existsSync(layoutPath)).toBe(true);
        const layoutContent = fs.readFileSync(layoutPath, 'utf8');
        expect(layoutContent).not.toContain('boxicons.min.css');
    });

    it('should not have any legacy <i className="bx ..."> tags in components or pages', () => {
        let hasLegacyTags = false;
        const legacyRegex = /<i\s+[^>]*className=[\"'{`]+(?:[^\"'}`]*?\s+)?bx(?:-[a-z0-9-]+)?[\s\"'}`]+[^>]*(?:>\s*<\/i>|\/>)/;

        const filesWithErrors: string[] = [];

        for (const file of allFiles) {
            // BoxIcon.tsx is allowed to have the fallback <i> tag
            if (file.endsWith('BoxIcon.tsx')) continue;

            const content = fs.readFileSync(file, 'utf8');
            if (legacyRegex.test(content)) {
                hasLegacyTags = true;
                filesWithErrors.push(file);
            }
        }

        expect(filesWithErrors).toEqual([]);
        expect(hasLegacyTags).toBe(false);
    });
});
