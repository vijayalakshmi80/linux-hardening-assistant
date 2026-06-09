/**
 * File service for storing generated fix scripts on disk.
 */

import fs from 'fs';
import path from 'path';
import { config } from '../config/env';
import { logger } from '../config/logger';

export async function saveFixScript(script: string, suffix: string): Promise<string> {
  const dir = config.reportStorage;
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const filename = `fix_${suffix}_${Date.now()}.sh`;
  const filepath = path.join(dir, filename);

  fs.writeFileSync(filepath, script, 'utf8');
  logger.debug(`Fix script saved: ${filepath}`);

  return filename;
}
