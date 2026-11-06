import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

type Shape = {
  paths?: string[];
  circles?: [number, number, number][];
  rects?: [number, number, number, number, number][];
  fill?: boolean;
};

const ICONS = {
  plus: { paths: ['M12 5v14M5 12h14'] },
  search: { paths: ['m20 20-3.4-3.4'], circles: [[11, 11, 7]] },
  filter: { paths: ['M4 5h16l-6 7.4V19l-4 2v-8.6Z'] },
  home: { paths: ['M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1Z'] },
  routes: {
    paths: ['M8.4 18H15a3.2 3.2 0 0 0 0-6.4H9a3.2 3.2 0 0 1 0-6.4h6.6'],
    circles: [
      [6, 18, 2.4],
      [18, 6, 2.4],
    ],
  },
  chat: { paths: ['M20 11.6a7.6 7.6 0 0 1-11 6.8L4.6 20l1.3-4A7.6 7.6 0 1 1 20 11.6Z'] },
  user: { paths: ['M5 20a7 7 0 0 1 14 0'], circles: [[12, 8, 3.4]] },
  back: { paths: ['m15 5-7 7 7 7'] },
  forward: { paths: ['m9 5 7 7-7 7'] },
  close: { paths: ['M6 6l12 12M18 6 6 18'] },
  check: { paths: ['m5 12 4.5 4.5L19 7'] },
  coins: {
    circles: [
      [9.5, 9.5, 5.4],
      [14.5, 14.5, 5.4],
    ],
  },
  camera: { paths: ['M4 8h3l2-3h6l2 3h3v11H4Z'], circles: [[12, 13, 3.2]] },
  pin: {
    paths: ['M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z'],
    circles: [[12, 10, 2.4]],
  },
  star: { paths: ['m12 3 2.6 5.6 6 .7-4.4 4.2 1.2 6-5.4-3-5.4 3 1.2-6L3.4 9.3l6-.7Z'], fill: true },
  box: { paths: ['M4 8.5 12 4l8 4.5v7L12 20l-8-4.5Z', 'M12 12 4 8.5M12 12v8M12 12l8-3.5'] },
  volume: { paths: ['M12 3 4 7v10l8 4 8-4V7Z', 'm4 7 8 4 8-4M12 11v10'] },
  truck: {
    paths: ['M3 16V7h10v9M13 10h4l3 3v3h-7'],
    circles: [
      [7, 17.5, 1.8],
      [17, 17.5, 1.8],
    ],
  },
  snow: { paths: ['M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9'] },
  eye: {
    paths: ['M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12Z'],
    circles: [[12, 12, 2.6]],
  },
  droplets: { paths: ['M12 3.2s5.6 6.1 5.6 10.2a5.6 5.6 0 0 1-11.2 0C6.4 9.3 12 3.2 12 3.2Z'] },
  car: {
    paths: ['M4 15v-3.2L6.2 7h11.6L20 11.8V15', 'M7 18v-2.4M17 18v-2.4'],
    circles: [
      [7.5, 15, 1.4],
      [16.5, 15, 1.4],
    ],
  },
  wrench: {
    paths: [
      'M14.8 6.2a3.6 3.6 0 0 0-4.9 4.6l-5.6 5.6a1.8 1.8 0 0 0 2.5 2.5l5.6-5.6a3.6 3.6 0 0 0 4.6-4.9l-2.4 2.4-2.1-2.1Z',
    ],
  },
  crosshair: {
    paths: ['M12 2v3.5M12 18.5V22M2 12h3.5M18.5 12H22'],
    circles: [[12, 12, 6.5]],
  },
  calendar: {
    paths: ['M8 3v4M16 3v4M4 10h16'],
    rects: [[4, 5, 16, 16, 2]],
  },
  globe: {
    paths: ['M4 12h16M12 4a14 14 0 0 1 0 16 14 14 0 0 1 0-16'],
    circles: [[12, 12, 8]],
  },
  file: { paths: ['M6 3h8l4 4v14H6Z', 'M14 3v5h5'] },
  help: {
    paths: ['M9.5 9a2.5 2.5 0 1 1 3.6 2.2c-.7.4-1.1 1-1.1 1.8M12 17h.01'],
    circles: [[12, 12, 8]],
  },
  edit: { paths: ['M4 20h4L19 9l-4-4L4 16Z', 'm14.5 5.5 4 4'] },
  phone: {
    paths: ['M6 3h3l2 5-2.5 1.5a12 12 0 0 0 6 6L16 13l5 2v3a2 2 0 0 1-2.2 2A16 16 0 0 1 4 5.2 2 2 0 0 1 6 3Z'],
  },
  paperclip: {
    paths: [
      'm20 11-7.6 7.6a5 5 0 0 1-7-7L13 4a3.4 3.4 0 0 1 4.8 4.8l-7.6 7.6a1.8 1.8 0 0 1-2.6-2.6l6.8-6.8',
    ],
  },
  send: { paths: ['M4 12 20 4l-4 16-4.2-6.2Z'] },
  chevronDown: { paths: ['m6 9 6 6 6-6'] },
  alert: { paths: ['M12 8v5M12 16h.01'], circles: [[12, 12, 9]] },
  image: { paths: ['M4 4h16v16H4Z', 'm4 16 4.5-4.5 3.5 3.5 3-3L20 16'], circles: [[15.5, 8.5, 1.4]] },
  refresh: { paths: ['M20 11a8 8 0 0 0-14-4L4 9M4 4v5h5M4 13a8 8 0 0 0 14 4l2-2M20 20v-5h-5'] },
} satisfies Record<string, Shape>;

export type IconName = keyof typeof ICONS;

type Props = {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  style?: object;
};

export function Icon({ name, size = 20, color = '#16202e', strokeWidth = 1.8, style }: Props) {
  const icon: Shape = ICONS[name];
  if (icon.fill) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={style}>
        {(icon.paths || []).map((d) => (
          <Path key={d} d={d} />
        ))}
      </Svg>
    );
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      {(icon.rects || []).map(([x, y, w, h, rx]) => (
        <Rect
          key={`r${x}${y}`}
          x={x}
          y={y}
          width={w}
          height={h}
          rx={rx}
          stroke={color}
          strokeWidth={strokeWidth}
        />
      ))}
      {(icon.circles || []).map(([cx, cy, r]) => (
        <Circle key={`c${cx}${cy}`} cx={cx} cy={cy} r={r} stroke={color} strokeWidth={strokeWidth} />
      ))}
      {(icon.paths || []).map((d) => (
        <Path
          key={d}
          d={d}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </Svg>
  );
}
