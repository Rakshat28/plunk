export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: Language[] = [
  {code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸'},
  {code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱'},
];

export const DEFAULT_LANGUAGE = 'en';

export function isValidLanguageCode(code: string): boolean {
  return SUPPORTED_LANGUAGES.some(lang => lang.code === code);
}

export function getLanguageByCode(code: string): Language | undefined {
  return SUPPORTED_LANGUAGES.find(lang => lang.code === code);
}
