import { Composition } from 'remotion';
import { EducationalVideo } from './compositions/EducationalVideo';
import React from 'react';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="EducationalVideo"
        component={EducationalVideo}
        durationInFrames={3600} // 2 minutes at 30fps
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          script: {},
          language: 'en',
        }}
      />
    </>
  );
};

