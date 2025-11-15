import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { spring, useVideoConfig } from 'remotion';

export const TitleScene: React.FC<any> = ({ title, subtitle }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const scale = spring({
    frame,
    fps,
    from: 0.8,
    to: 1,
  });
  
  const opacity = interpolate(frame, [0, 30], [0, 1]);
  
  return (
    <AbsoluteFill style={{
      justifyContent: 'center',
      alignItems: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    }}>
      <div style={{
        transform: `scale(${scale})`,
        opacity,
        textAlign: 'center',
      }}>
        <h1 style={{ fontSize: 80, color: 'white', margin: 0 }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ fontSize: 40, color: '#e0e0e0', marginTop: 20 }}>
            {subtitle}
          </p>
        )}
      </div>
    </AbsoluteFill>
  );
};

