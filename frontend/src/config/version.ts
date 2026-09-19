export interface VersionInfo {
  version: string
  name: string
  date: string
  description: string
}

export const CURRENT_VERSION: VersionInfo = {
  version: '1.0.0',
  name: 'Baseline English UI',
  date: '2026-09-19',
  description: 'Initial Hackathon Live Release (Verified on Avalanche Fuji C-Chain)'
}

export const VERSION_HISTORY: VersionInfo[] = [
  {
    version: '1.0.0',
    name: 'Baseline English UI',
    date: '2026-09-19',
    description: 'Initial Hackathon Live Release (Verified on Avalanche Fuji C-Chain)'
  }
]
