import { AbsoluteFill, Audio, Sequence } from 'remotion';
import { TitleScene } from '../scenes/TitleScene';
import { ConceptScene } from '../scenes/ConceptScene';
import { CodeScene } from '../scenes/CodeScene';

interface Props {
  script: any;
  language: string;
  audioUrl?: string;
}

export const EducationalVideo: React.FC<Props> = ({ script, language, audioUrl }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#0f172a' }}>
      {audioUrl && <Audio src={audioUrl} />}
      
      {script.scenes?.map((scene: any, index: number) => {
        const startFrame = scene.start * 30; // Convert seconds to frames
        const durationFrames = (scene.end - scene.start) * 30;
        
        return (
          <Sequence
            key={index}
            from={startFrame}
            durationInFrames={durationFrames}
          >
            {scene.type === 'title' && <TitleScene {...scene} />}
            {scene.type === 'concept' && <ConceptScene {...scene} />}
            {scene.type === 'code' && <CodeScene {...scene} />}
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

