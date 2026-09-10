export interface LectureLink {
  text: string;
  url: string;
}

export interface ChapterItem {
  name: string;
  links: LectureLink[];
}

export interface SubjectItem {
  name: string;
  chapters: ChapterItem[];
  shortName?: string;
  icon?: string;
}

export interface FlatVideoItem {
  id: string;
  text: string;
  url: string;
  subName: string;
  chapName: string;
  type: 'bunny' | 'youtube';
}

export interface PlaybackAuthResponse {
  success: boolean;
  playbackUrl?: string;
  expiresAt?: number;
  error?: string;
  message?: string;
}

export interface UserStats {
  totalChapters: number;
  completedChapters: number;
  totalClasses: number;
  completedClasses: number;
}

export interface LectureItem {
  id: string;
  title?: string;
  text?: string;
  subject: string;
  chapter: string;
  type: 'bunny' | 'youtube';
  rawUrl?: string;
  url?: string;
  duration?: string;
  teacher?: string;
}

export interface AuthSimulationState {
  isAuthenticated: boolean;
  userRole: 'student' | 'guest';
  hasCourseAccess: boolean;
  tokenExpiresAt: number | null;
  activeToken: string | null;
}

