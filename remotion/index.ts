import { registerRoot } from 'remotion';
import { Composition } from 'remotion';
import { EducationalVideo } from './compositions/EducationalVideo';
import React from 'react';

const RemotionRoot = () => {
  return React.createElement(Composition, {
    id: "EducationalVideo",
    component: EducationalVideo as any,
    durationInFrames: 3600, // 2 minutes at 30fps
    fps: 30,
    width: 1920,
    height: 1080,
    defaultProps: {
      script: {},
      language: 'en',
    }
  });
};

registerRoot(RemotionRoot);

