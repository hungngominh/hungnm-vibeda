declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string;
        alt?: string;
        'auto-rotate'?: boolean | '';
        'camera-controls'?: boolean | '';
        'tone-mapping'?: string;
        'environment-image'?: string;
        'shadow-intensity'?: string;
        exposure?: string;
      };
    }
  }
}

export type MascotKey = 'chick' | 'axolotl' | 'mocha' | 'whale';

const MASCOT_FILES: Record<MascotKey, string> = {
  chick:   '/mascot/cute_chick.glb',
  axolotl: '/mascot/cute_axolotl.glb',
  mocha:   '/mascot/cute_mocha_cat_3.glb',
  whale:   '/mascot/cute_whale.glb',
};

interface ModelViewerProps {
  mascot: MascotKey;
  style?: React.CSSProperties;
  cameraControls?: boolean;
}

export function ModelViewer({ mascot, style, cameraControls }: ModelViewerProps) {
  return (
    <model-viewer
      src={MASCOT_FILES[mascot]}
      alt={`${mascot} mascot`}
      auto-rotate=""
      camera-controls={cameraControls ? '' : undefined}
      tone-mapping="commerce"
      environment-image="neutral"
      shadow-intensity="0.6"
      exposure="1.1"
      style={{ width: '100%', height: '100%', ...style }}
    />
  );
}
