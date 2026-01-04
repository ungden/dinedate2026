import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = {
  width: 180,
  height: 180,
};
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '180px',
          height: '180px',
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
              'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.22) 0px, transparent 55%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.16) 0px, transparent 55%)',
          }}
        />
        <div
          style={{
            width: 138,
            height: 138,
            borderRadius: 44,
            background: 'rgba(255,255,255,0.14)',
            border: '1px solid rgba(255,255,255,0.22)',
            boxShadow: '0 14px 36px rgba(0,0,0,0.22)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 900,
            fontSize: 84,
            letterSpacing: -3,
          }}
        >
          D
        </div>
      </div>
    ),
    size
  );
}