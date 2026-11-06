import { Platform } from 'react-native';

export const colors = {
  navy: '#1a365d',
  navyDeep: '#102542',
  navySoft: '#e8eef7',
  navyLine: '#c9d6e6',
  orange: '#f97316',
  orangeDeep: '#c2410c',
  orangeSoft: '#fff1e5',
  orangeInk: '#13233a',
  orangeHover: '#fb8a3c',
  bg: '#f3f4f6',
  surface: '#ffffff',
  surface2: '#fafbfc',
  line: '#e2e6ec',
  lineStrong: '#c7d0dc',
  ink: '#16202e',
  ink2: '#45566d',
  ink3: '#5c6b7f',
  green: '#157347',
  greenBg: '#e6f4ec',
  red: '#b42318',
  redBg: '#fdecea',
  amber: '#8a5308',
  amberBg: '#fdf0d5',
  mapBg: '#e9eee7',
  mapWater: '#c6dcea',
  mapBlock: '#dde5d9',
  mapInk: '#71816f',
  scrim: 'rgba(10,20,35,0.48)',
  handle: '#d5dbe3',
  msgOwner: '#e9edf2',
};

export const font = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
};

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
};

export const shadow = {
  card: Platform.select({
    web: { boxShadow: '0 8px 24px -14px rgba(16,37,66,0.32)' } as object,
    default: {
      shadowColor: colors.navyDeep,
      shadowOpacity: 0.18,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 8 },
      elevation: 4,
    },
  }),
  float: Platform.select({
    web: { boxShadow: '0 12px 30px -10px rgba(16,37,66,0.38)' } as object,
    default: {
      shadowColor: colors.navyDeep,
      shadowOpacity: 0.24,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 12 },
      elevation: 7,
    },
  }),
  sheet: Platform.select({
    web: { boxShadow: '0 -20px 44px -22px rgba(10,20,35,0.55)' } as object,
    default: {
      shadowColor: '#0a1423',
      shadowOpacity: 0.3,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: -12 },
      elevation: 16,
    },
  }),
};

export const PAGE_WIDTH = 480;
