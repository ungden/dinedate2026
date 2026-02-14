import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          position: 'relative',
          alignItems: 'center',
          justifyContent: 'center',
          background:
            'linear-gradient(135deg, #FF7A91 0%, #F0516C 50%, #8B5CF6 100%)',
          fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Inter, sans-serif',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.22) 0px, transparent 45%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.18) 0px, transparent 45%), radial-gradient(circle at 70% 80%, rgba(255,255,255,0.16) 0px, transparent 55%)',
          }}
        />
        <div
          style={{
            width: 980,
            padding: 56,
            borderRadius: 48,
            background: 'rgba(255,255,255,0.14)',
            border: '1px solid rgba(255,255,255,0.22)',
            boxShadow: '0 18px 48px rgba(0,0,0,0.18)',
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <div
              style={{
                width: 84,
                height: 84,
                borderRadius: 28,
                background: 'rgba(255,255,255,0.18)',
                border: '1px solid rgba(255,255,255,0.28)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: 44,
                color: '#fff',
              }}
            >
              D
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div
                style={{
                  fontSize: 54,
                  fontWeight: 900,
                  color: '#fff',
                  letterSpacing: -1,
                }}
              >
                DineDate
              </div>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 600,
                  color: 'rgba(255,255,255,0.9)',
                }}
              >
                Hen Ho Mu x Kham Pha Am Thuc
              </div>
            </div>
          </div>

          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: 'rgba(255,255,255,0.95)',
              lineHeight: 1.25,
            }}
          >
            Chon nha hang, tao date order, gap mat blind - trai nghiem doc dao!
          </div>

          <div
            style={{
              display: 'flex',
              gap: 12,
              marginTop: 8,
              flexWrap: 'wrap',
            }}
          >
            {['Blind Date', 'Nha hang chat luong', 'Combo cho 2', 'An toan'].map((t) => (
              <div
                key={t}
                style={{
                  padding: '10px 14px',
                  borderRadius: 999,
                  background: 'rgba(255,255,255,0.18)',
                  border: '1px solid rgba(255,255,255,0.24)',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: 18,
                }}
              >
                {t}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    size
  );
}