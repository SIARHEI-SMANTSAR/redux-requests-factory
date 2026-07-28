export type Page = 'single' | 'batch';

export const pageFromPath = (pathname: string): Page =>
  pathname.startsWith('/batch') ? 'batch' : 'single';
