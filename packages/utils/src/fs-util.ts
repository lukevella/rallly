import * as fs from 'fs';

export const readFile = (file: string|undefined): string|null => {
  if (file != null && file != undefined && file.length > 0) {
    try {
      return fs.readFileSync(file, { encoding: 'utf-8' });
    } catch (e) {
      throw new Error('Secrets file could not be found at the specified path');
    }
  }
  return null;
};
