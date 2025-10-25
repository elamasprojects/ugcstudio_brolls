
export enum View {
  Video = 'video',
  Image = 'image',
  Library = 'library',
}

export interface BrollAsset {
  id: string;
  type: 'image' | 'video';
  url: string;
  prompt: string;
  originalImageUrl?: string;
}
