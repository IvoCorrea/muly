import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge'
};

const API_BASE = 'https://api.muly.xyz';

function truncate(str, max) {
  if (!str) return '';
  const clean = String(str).replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, max - 1).trimEnd() + '…';
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

async function fetchJson(url) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function fetchImageAsDataUri(url) {
  if (!url || typeof url !== 'string' || !url.startsWith('http')) return null;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!res.ok) return null;

    const contentType = (res.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    if (!['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'].includes(contentType)) {
      return null;
    }

    const buffer = await res.arrayBuffer();
    if (buffer.byteLength === 0 || buffer.byteLength > 4 * 1024 * 1024) return null;
    return `data:${contentType};base64,${arrayBufferToBase64(buffer)}`;
  } catch {
    return null;
  }
}

function el(type, props, ...children) {
  const flatChildren = children.flat().filter((c) => c !== null && c !== undefined && c !== false);
  return {
    type,
    props: {
      ...props,
      children: flatChildren.length === 0 ? undefined : flatChildren.length === 1 ? flatChildren[0] : flatChildren
    }
  };
}

export default async function handler(req) {
  const reqUrl = new URL(req.url);
  const origin = `${reqUrl.protocol}//${reqUrl.host}`;
  const username = reqUrl.searchParams.get('username') || '';

  const profile = username
    ? await fetchJson(`${API_BASE}/profile/${encodeURIComponent(username)}`)
    : null;

  const displayName = profile?.displayName || profile?.username || username || 'Muly';
  const handle = `@${profile?.username || username || 'muly'}`;
  const initials = displayName.substring(0, 2).toUpperCase();
  const bio = truncate(
    profile?.bio || 'Acompanhando, avaliando álbuns e compartilhando listas musicais no Muly.',
    145
  );

  const featuredAlbum = profile?.favoriteAlbum || profile?.topAlbums?.[0]?.album || null;
  const featuredLabel = profile?.favoriteAlbum ? 'ÁLBUM FAVORITO' : 'DESTAQUE NO TOP 4';
  const topCoversRaw = (profile?.topAlbums || [])
    .map((t) => t?.album?.coverUrl)
    .filter(Boolean)
    .slice(0, 4);

  const [avatarDataUri, albumCoverDataUri, logoDataUri, ...topCoverDataUris] = await Promise.all([
    fetchImageAsDataUri(profile?.avatarUrl),
    fetchImageAsDataUri(featuredAlbum?.coverUrl),
    fetchImageAsDataUri(`${origin}/logo-circle.png`),
    ...topCoversRaw.map((u) => fetchImageAsDataUri(u))
  ]);

  const validTopCovers = topCoverDataUris.filter(Boolean);
  const totalReviews = profile?.totalReviews ?? 0;
  const followersCount = profile?.followersCount ?? 0;
  const followingCount = profile?.followingCount ?? 0;
  const currentTrack = profile?.currentTrack;

  const tree = el(
    'div',
    {
      style: {
        width: '1200px',
        height: '630px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: 'linear-gradient(135deg, #101417 0%, #14181c 55%, #0c2920 100%)',
        color: '#ffffff',
        padding: '48px 56px',
        fontFamily: 'sans-serif'
      }
    },
    // Top Header
    el(
      'div',
      {
        style: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%'
        }
      },
      el(
        'div',
        { style: { display: 'flex', alignItems: 'center', gap: '14px' } },
        logoDataUri
          ? el('img', {
              src: logoDataUri,
              width: 42,
              height: 42,
              style: { borderRadius: '9999px' }
            })
          : el('div', {
              style: {
                width: '42px',
                height: '42px',
                borderRadius: '9999px',
                backgroundColor: '#10b981'
              }
            }),
        el(
          'span',
          {
            style: {
              fontSize: '26px',
              fontWeight: 900,
              letterSpacing: '0.12em',
              color: '#f3f4f6'
            }
          },
          'MULY'
        )
      ),
      el(
        'div',
        {
          style: {
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'rgba(16, 185, 129, 0.14)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            borderRadius: '9999px',
            padding: '8px 18px',
            fontSize: '15px',
            fontWeight: 700,
            color: '#34d399',
            letterSpacing: '0.08em'
          }
        },
        'PERFIL MUSICAL'
      )
    ),

    // Main Content Row
    el(
      'div',
      {
        style: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '48px',
          flex: 1,
          marginTop: '24px',
          marginBottom: '20px'
        }
      },
      // Left Column: Avatar + Name + Bio + Current Track
      el(
        'div',
        {
          style: {
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            flex: 1
          }
        },
        el(
          'div',
          { style: { display: 'flex', alignItems: 'center', gap: '24px' } },
          avatarDataUri
            ? el('img', {
                src: avatarDataUri,
                width: 118,
                height: 118,
                style: {
                  borderRadius: '9999px',
                  border: '4px solid #10b981',
                  objectFit: 'cover'
                }
              })
            : el(
                'div',
                {
                  style: {
                    width: '118px',
                    height: '118px',
                    borderRadius: '9999px',
                    backgroundColor: '#1b2228',
                    border: '4px solid #10b981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '40px',
                    fontWeight: 900,
                    color: '#10b981'
                  }
                },
                initials
              ),
          el(
            'div',
            { style: { display: 'flex', flexDirection: 'column', gap: '4px' } },
            el(
              'span',
              {
                style: {
                  fontSize: '44px',
                  fontWeight: 900,
                  color: '#ffffff',
                  lineHeight: 1.1
                }
              },
              truncate(displayName, 22)
            ),
            el(
              'span',
              {
                style: {
                  fontSize: '24px',
                  fontWeight: 700,
                  color: '#10b981'
                }
              },
              truncate(handle, 28)
            )
          )
        ),

        // Bio
        el(
          'p',
          {
            style: {
              marginTop: '24px',
              marginBottom: '0px',
              fontSize: '23px',
              lineHeight: 1.4,
              color: '#cbd5e1',
              maxWidth: '640px'
            }
          },
          bio
        ),

        // Current Track (if set)
        currentTrack?.title
          ? el(
              'div',
              {
                style: {
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginTop: '20px',
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '12px',
                  padding: '10px 16px'
                }
              },
              el(
                'span',
                { style: { fontSize: '16px', fontWeight: 800, color: '#10b981' } },
                'OUVINDO'
              ),
              el(
                'span',
                { style: { fontSize: '18px', fontWeight: 600, color: '#f1f5f9' } },
                truncate(`${currentTrack.title}${currentTrack.artist ? ' — ' + currentTrack.artist : ''}`, 46)
              )
            )
          : null
      ),

      // Right Column: Most Loved / Favorite Album
      featuredAlbum
        ? el(
            'div',
            {
              style: {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                backgroundColor: 'rgba(18, 22, 26, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '22px',
                padding: '20px',
                width: '320px'
              }
            },
            el(
              'span',
              {
                style: {
                  fontSize: '13px',
                  fontWeight: 800,
                  letterSpacing: '0.12em',
                  color: '#10b981',
                  marginBottom: '12px'
                }
              },
              `★ ${featuredLabel}`
            ),
            albumCoverDataUri
              ? el('img', {
                  src: albumCoverDataUri,
                  width: 230,
                  height: 230,
                  style: {
                    borderRadius: '14px',
                    objectFit: 'cover',
                    border: '1px solid rgba(255,255,255,0.14)'
                  }
                })
              : el(
                  'div',
                  {
                    style: {
                      width: '230px',
                      height: '230px',
                      borderRadius: '14px',
                      backgroundColor: '#202830',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '56px',
                      color: '#10b981'
                    }
                  },
                  '♪'
                ),
            el(
              'span',
              {
                style: {
                  marginTop: '12px',
                  fontSize: '19px',
                  fontWeight: 800,
                  color: '#ffffff',
                  textAlign: 'center'
                }
              },
              truncate(featuredAlbum.title, 26)
            ),
            el(
              'span',
              {
                style: {
                  marginTop: '2px',
                  fontSize: '15px',
                  fontWeight: 600,
                  color: '#94a3b8',
                  textAlign: 'center'
                }
              },
              truncate(featuredAlbum.artist, 28)
            )
          )
        : null
    ),

    // Bottom Footer: Stats + Top 4 Mini Strip + URL
    el(
      'div',
      {
        style: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          paddingTop: '18px',
          width: '100%'
        }
      },
      el(
        'div',
        { style: { display: 'flex', alignItems: 'center', gap: '28px' } },
        el(
          'div',
          { style: { display: 'flex', alignItems: 'baseline', gap: '8px' } },
          el('span', { style: { fontSize: '24px', fontWeight: 900, color: '#ffffff' } }, String(totalReviews)),
          el('span', { style: { fontSize: '16px', color: '#94a3b8' } }, totalReviews === 1 ? 'avaliação' : 'avaliações')
        ),
        el(
          'div',
          { style: { display: 'flex', alignItems: 'baseline', gap: '8px' } },
          el('span', { style: { fontSize: '24px', fontWeight: 900, color: '#ffffff' } }, String(followersCount)),
          el('span', { style: { fontSize: '16px', color: '#94a3b8' } }, followersCount === 1 ? 'seguidor' : 'seguidores')
        ),
        el(
          'div',
          { style: { display: 'flex', alignItems: 'baseline', gap: '8px' } },
          el('span', { style: { fontSize: '24px', fontWeight: 900, color: '#ffffff' } }, String(followingCount)),
          el('span', { style: { fontSize: '16px', color: '#94a3b8' } }, 'seguindo')
        )
      ),
      el(
        'div',
        { style: { display: 'flex', alignItems: 'center', gap: '14px' } },
        validTopCovers.length > 0
          ? el(
              'div',
              { style: { display: 'flex', alignItems: 'center', gap: '6px' } },
              ...validTopCovers.map((src) =>
                el('img', {
                  src,
                  width: 38,
                  height: 38,
                  style: {
                    borderRadius: '6px',
                    objectFit: 'cover',
                    border: '1px solid rgba(255,255,255,0.18)'
                  }
                })
              )
            )
          : null,
        el(
          'span',
          { style: { fontSize: '18px', fontWeight: 700, color: '#10b981' } },
          `muly.xyz/profile/${truncate(profile?.username || username || '', 18)}`
        )
      )
    )
  );

  return new ImageResponse(tree, {
    width: 1200,
    height: 630,
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
    }
  });
}
