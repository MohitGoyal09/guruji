import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';

export const ConceptScene: React.FC<any> = ({ title, points }) => {
  const frame = useCurrentFrame();
  
  return (
    <AbsoluteFill style={{
      padding: 80,
      background: '#1e293b',
      color: 'white',
    }}>
      <h2 style={{ fontSize: 60, marginBottom: 60 }}>{title}</h2>
      <ul style={{ fontSize: 40, lineHeight: 2 }}>
        {points?.map((point: string, i: number) => {
          const delay = i * 20;
          const opacity = interpolate(frame, [delay, delay + 20], [0, 1], {
            extrapolateRight: 'clamp',
          });
          return (
            <li key={i} style={{ opacity, marginBottom: 30 }}>
              {point}
            </li>
          );
        })}
      </ul>
    </AbsoluteFill>
  );
};

