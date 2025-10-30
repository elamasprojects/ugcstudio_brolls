
export enum View {
  Video = 'video',
  Image = 'image',
  Library = 'library',
  Script = 'script',
  Analyzer = 'analyzer',
  Voiceover = 'voiceover',
}

export interface BrollAsset {
  id: string;
  type: 'image' | 'video' | 'audio';
  url: string;
  prompt: string;
  originalImageUrl?: string;
}
