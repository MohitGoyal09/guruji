import { AbsoluteFill } from 'remotion';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

export const CodeScene: React.FC<any> = ({ title, code, language = 'python' }) => {
  return (
    <AbsoluteFill style={{
      padding: 80,
      background: '#0f172a',
      color: 'white',
    }}>
      <h2 style={{ fontSize: 50, marginBottom: 40 }}>{title}</h2>
      <SyntaxHighlighter
        language={language}
        style={vscDarkPlus}
        customStyle={{
          fontSize: 32,
          padding: 40,
          borderRadius: 12,
        }}
      >
        {code}
      </SyntaxHighlighter>
    </AbsoluteFill>
  );
};

