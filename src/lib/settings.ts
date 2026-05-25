import fs from 'fs';
import path from 'path';

import { SystemSettings, WaterRateRange } from '@/app/lib/mock-data';

const SETTINGS_FILE_PATH = path.join(process.cwd(), 'src', 'lib', 'server-settings.json');

const DEFAULT_SETTINGS: SystemSettings = {
  pawapayKey: process.env.PAWAPAY_API_KEY || '',
  pawapayMode: process.env.PAWAPAY_MODE || 'sandbox',
  portalUrl: 'https://dashboard.pawapay.io',
  waterRate: 2.5,
  companyName: 'My Water Bill',
  logo: '',
  primaryColor: '#2563eb',
  secondaryColor: '#0f172a',
  backgroundColor: '#020617',
  landingBgImage: 'https://picsum.photos/seed/water-landing/1920/1080',
  vatRate: 16.5,
  waterRateRanges: [
    { from: 0, to: null, price: 2.5 }
  ]
};

export function getSystemSettings(): SystemSettings {
  try {
    if (!fs.existsSync(SETTINGS_FILE_PATH)) {
      // Ensure directory exists
      fs.mkdirSync(path.dirname(SETTINGS_FILE_PATH), { recursive: true });
      fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(DEFAULT_SETTINGS, null, 2));
      return DEFAULT_SETTINGS;
    }
    const data = fs.readFileSync(SETTINGS_FILE_PATH, 'utf-8');
    return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
  } catch (error) {
    console.error('Error reading settings from file:', error);
    return DEFAULT_SETTINGS;
  }
}

export function saveSystemSettings(settings: Partial<SystemSettings>): SystemSettings {
  try {
    const current = getSystemSettings();
    const updated = { ...current, ...settings };
    fs.mkdirSync(path.dirname(SETTINGS_FILE_PATH), { recursive: true });
    fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(updated, null, 2));
    return updated;
  } catch (error) {
    console.error('Error writing settings to file:', error);
    throw new Error('Failed to persist settings on the server.');
  }
}
