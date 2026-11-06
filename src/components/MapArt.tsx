import React from 'react';
import Svg, { Circle, Path, Rect, Text as SvgText } from 'react-native-svg';
import { useI18n } from '../i18n/index';
import { colors } from '../theme';

export function MainMap({ style }: { style?: object }) {
  const { cityLabel } = useI18n();
  return (
    <Svg width="100%" height="100%" viewBox="0 0 390 300" preserveAspectRatio="xMidYMid slice" style={style}>
      <Rect width={390} height={300} fill={colors.mapBg} />
      <Path
        d="M-10 96C60 70 120 118 190 104c70-14 130 14 210-12"
        fill="none"
        stroke={colors.mapWater}
        strokeWidth={14}
        strokeLinecap="round"
        opacity={0.9}
      />
      <Path d="M-10 140c90 10 150-12 220 10s120 0 180 8" fill="none" stroke="#fff" strokeWidth={9} />
      <Path d="M40-10c20 80 52 140 34 220-10 48 6 80 22 100" fill="none" stroke="#fff" strokeWidth={9} />
      <Path d="M260-10c-10 70 40 130 32 190-6 50 8 100 18 130" fill="none" stroke="#fff" strokeWidth={8} />
      <Path d="M-10 228c100-14 190 8 270-14 60-16 100-6 140-18" fill="none" stroke="#fff" strokeWidth={7} />
      <Path d="M120 300c30-50 70-90 130-110" fill="none" stroke="#fff" strokeWidth={6} />
      <Path d="M300 60c30 50 50 100 30 160" fill="none" stroke="#fff" strokeWidth={6} />
      <Rect x={40} y={130} width={60} height={48} rx={6} fill={colors.mapBlock} />
      <Rect x={210} y={60} width={54} height={40} rx={6} fill={colors.mapBlock} />
      <Rect x={150} y={180} width={44} height={38} rx={6} fill={colors.mapBlock} />
      <Rect x={300} y={170} width={50} height={40} rx={6} fill={colors.mapBlock} />
      <Circle cx={70} cy={215} r={3} fill="#8b9a88" />
      <SvgText x={262} y={122} fill={colors.mapInk} fontSize={9} fontWeight="700" letterSpacing={1.2}>
        {cityLabel('Tashkent').toUpperCase()}
      </SvgText>
      <SvgText x={90} y={238} fill={colors.mapInk} fontSize={9} fontWeight="700" letterSpacing={1.2}>
        {cityLabel('Samarkand').toUpperCase()}
      </SvgText>
      <SvgText x={24} y={118} fill={colors.mapInk} fontSize={8.5} fontWeight="700" letterSpacing={1}>
        {cityLabel('Bukhara').toUpperCase()}
      </SvgText>
      <SvgText x={170} y={196} fill={colors.mapInk} fontSize={8.5} fontWeight="700" letterSpacing={1}>
        {cityLabel('Jizzakh').toUpperCase()}
      </SvgText>
      <SvgText x={318} y={76} fill={colors.mapInk} fontSize={8.5} fontWeight="700" letterSpacing={1}>
        {cityLabel('Fergana').toUpperCase()}
      </SvgText>
    </Svg>
  );
}

export function CreateMap() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 350 152" preserveAspectRatio="xMidYMid slice">
      <Rect width={350} height={152} fill={colors.mapBg} />
      <Path d="M-10 40c80 18 150-10 220 8s110 2 150 10" fill="none" stroke="#fff" strokeWidth={9} />
      <Path d="M-10 104c90-12 160 12 240-6s90-4 130-12" fill="none" stroke="#fff" strokeWidth={7} />
      <Path d="M90-10c10 50 34 80 22 130-4 16 0 26 6 34" fill="none" stroke="#fff" strokeWidth={8} />
      <Path d="M250-10c-8 44 20 74 14 108-4 24 6 40 12 56" fill="none" stroke="#fff" strokeWidth={7} />
      <Rect x={120} y={58} width={52} height={34} rx={5} fill={colors.mapBlock} />
      <Rect x={196} y={86} width={42} height={30} rx={5} fill={colors.mapBlock} />
    </Svg>
  );
}

export function ChatMiniMap() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 64 48">
      <Rect width={64} height={48} fill="#e3ebe2" />
      <Path d="M-2 14c16 4 26-2 38 2s18 2 30 4" fill="none" stroke="#fff" strokeWidth={5} />
      <Path d="M18-2c3 14 8 24 6 52" fill="none" stroke="#fff" strokeWidth={4} />
      <Circle cx={32} cy={24} r={7} fill={colors.navy} />
      <Circle cx={32} cy={24} r={2.6} fill={colors.orange} />
    </Svg>
  );
}
