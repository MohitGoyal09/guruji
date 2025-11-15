import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import path from 'path';
import { fileURLToPath } from 'url';

export async function renderVideo(
  script: any,
  language: string,
  audioUrl: string,
  outputPath: string
): Promise<string> {
  const bundleLocation = await bundle({
    entryPoint: path.join(process.cwd(), 'remotion/index.ts'),
    webpackOverride: (config) => config,
    ignoreRegisterRootWarning: false, // We're using registerRoot now
  });
  
  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: 'EducationalVideo',
    inputProps: {
      script,
      language,
      audioUrl,
    },
  });
  
  await renderMedia({
    composition,
    serveUrl: bundleLocation,
    codec: 'h264',
    outputLocation: outputPath,
    inputProps: {
      script,
      language,
      audioUrl,
    },
  });
  
  return outputPath;
}

