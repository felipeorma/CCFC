export interface TeamInfo {
  logo: string;
  fill: string;
  border: string;
}

export const teamInfo: Record<string, TeamInfo> = {
  'Cavalry FC': {
    logo: 'https://upload.wikimedia.org/wikipedia/en/c/c2/Cavalry_FC_logo.svg',
    fill: 'rgba(200, 16, 46, 0.6)',
    border: '#C8102E'
  },
  'Cavalry': {
    logo: 'https://upload.wikimedia.org/wikipedia/en/c/c2/Cavalry_FC_logo.svg',
    fill: 'rgba(200, 16, 46, 0.6)',
    border: '#C8102E'
  },
  'Forge FC': {
    logo: 'https://upload.wikimedia.org/wikipedia/en/b/bf/Forge_FC_logo.svg',
    fill: 'rgba(255, 140, 0, 0.6)',
    border: '#FF8C00'
  },
  'Forge': {
    logo: 'https://upload.wikimedia.org/wikipedia/en/b/bf/Forge_FC_logo.svg',
    fill: 'rgba(255, 140, 0, 0.6)',
    border: '#FF8C00'
  },
  'Atlético Ottawa': {
    logo: 'https://upload.wikimedia.org/wikipedia/en/e/e4/Atl%C3%A9tico_Ottawa_logo.svg',
    fill: 'rgba(39, 46, 97, 0.6)',
    border: '#272E61'
  },
  'Atletico Ottawa': {
    logo: 'https://upload.wikimedia.org/wikipedia/en/e/e4/Atl%C3%A9tico_Ottawa_logo.svg',
    fill: 'rgba(39, 46, 97, 0.6)',
    border: '#272E61'
  },
  'Ottawa': {
    logo: 'https://upload.wikimedia.org/wikipedia/en/e/e4/Atl%C3%A9tico_Ottawa_logo.svg',
    fill: 'rgba(39, 46, 97, 0.6)',
    border: '#272E61'
  },
  'Pacific FC': {
    logo: 'https://upload.wikimedia.org/wikipedia/en/1/1f/Pacific_FC_logo.svg',
    fill: 'rgba(106, 64, 153, 0.6)',
    border: '#6A4099'
  },
  'Pacific': {
    logo: 'https://upload.wikimedia.org/wikipedia/en/1/1f/Pacific_FC_logo.svg',
    fill: 'rgba(106, 64, 153, 0.6)',
    border: '#6A4099'
  },
  'Valour FC': {
    logo: 'https://upload.wikimedia.org/wikipedia/commons/6/6f/Valour_FC.svg',
    fill: 'rgba(122, 0, 60, 0.6)',
    border: '#7A003C'
  },
  'Valour': {
    logo: 'https://upload.wikimedia.org/wikipedia/commons/6/6f/Valour_FC.svg',
    fill: 'rgba(122, 0, 60, 0.6)',
    border: '#7A003C'
  },
  'York United FC': {
    logo: 'https://upload.wikimedia.org/wikipedia/en/7/79/Inter_Toronto_FC.png',
    fill: 'rgba(0, 122, 51, 0.6)',
    border: '#007A33'
  },
  'York United': {
    logo: 'https://upload.wikimedia.org/wikipedia/en/7/79/Inter_Toronto_FC.png',
    fill: 'rgba(0, 122, 51, 0.6)',
    border: '#007A33'
  },
  'Inter Toronto': {
    logo: 'https://upload.wikimedia.org/wikipedia/en/7/79/Inter_Toronto_FC.png',
    fill: 'rgba(0, 122, 51, 0.6)',
    border: '#007A33'
  },
  'HFX Wanderers FC': {
    logo: 'https://upload.wikimedia.org/wikipedia/en/0/00/HFX_Wanderers_FC_logo.svg',
    fill: 'rgba(0, 99, 190, 0.6)',
    border: '#0063BE'
  },
  'HFX Wanderers': {
    logo: 'https://upload.wikimedia.org/wikipedia/en/0/00/HFX_Wanderers_FC_logo.svg',
    fill: 'rgba(0, 99, 190, 0.6)',
    border: '#0063BE'
  },
  'HFX': {
    logo: 'https://upload.wikimedia.org/wikipedia/en/0/00/HFX_Wanderers_FC_logo.svg',
    fill: 'rgba(0, 99, 190, 0.6)',
    border: '#0063BE'
  },
  'Wanderers': {
    logo: 'https://upload.wikimedia.org/wikipedia/en/0/00/HFX_Wanderers_FC_logo.svg',
    fill: 'rgba(0, 99, 190, 0.6)',
    border: '#0063BE'
  },
  'Halifax': {
    logo: 'https://upload.wikimedia.org/wikipedia/en/0/00/HFX_Wanderers_FC_logo.svg',
    fill: 'rgba(0, 99, 190, 0.6)',
    border: '#0063BE'
  },
  'Halifax Wanderers': {
    logo: 'https://upload.wikimedia.org/wikipedia/en/0/00/HFX_Wanderers_FC_logo.svg',
    fill: 'rgba(0, 99, 190, 0.6)',
    border: '#0063BE'
  },
  'Vancouver FC': {
    logo: 'https://upload.wikimedia.org/wikipedia/en/7/7c/Vancouver_FC_logo.png',
    fill: 'rgba(0, 175, 176, 0.6)',
    border: '#00AFB0'
  },
  'Vancouver': {
    logo: 'https://upload.wikimedia.org/wikipedia/en/7/7c/Vancouver_FC_logo.png',
    fill: 'rgba(0, 175, 176, 0.6)',
    border: '#00AFB0'
  }
};

export const teamLogos: Record<string, string> = Object.fromEntries(
  Object.entries(teamInfo).map(([key, value]) => [key, value.logo])
);

export const getTeamLogo = (teamName: string): string | undefined => {
  if (!teamName) return undefined;

  const info = getTeamInfo(teamName);
  return info?.logo;
};

export const getTeamInfo = (teamName: string): TeamInfo | undefined => {
  if (!teamName) return undefined;

  const exactMatch = teamInfo[teamName];
  if (exactMatch) return exactMatch;

  const normalizedName = teamName.toLowerCase().trim();

  for (const [key, info] of Object.entries(teamInfo)) {
    if (key.toLowerCase() === normalizedName) {
      return info;
    }
  }

  for (const [key, info] of Object.entries(teamInfo)) {
    if (normalizedName.includes(key.toLowerCase()) || key.toLowerCase().includes(normalizedName)) {
      return info;
    }
  }

  return undefined;
};
