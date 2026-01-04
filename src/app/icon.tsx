import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = {
  width: 512,
  height: 512,
};
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '512px',
          height: '512px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #FF7A91 0%, #E63B5A 60%, #8B5CF6 110%)',
          position: 'relative',
          fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Inter, sans-serif',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.22) 0px, transparent 55%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.16) 0px, transparent 55%), radial-gradient(circle at 60% 85%, rgba(255,255,255,0.14) 0px, transparent 60%)',
          }}
        />
        <div
          style={{
            width: 380,
            height: 380,
            borderRadius: 120,
            background: 'rgba(255,255,255,0.14)',
            border: '1px solid rgba(255,255,255,0.22)',
            boxShadow: '0 26px 70px rgba(0,0,0,0.22)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 900,
            fontSize: 220,
            letterSpacing: -8,
          }}
        >
          D
        </div>
      </div>
    ),
    size
  );
}