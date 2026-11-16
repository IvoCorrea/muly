import { ImageResponse } from '@vercel/og';

const API_BASE = process.env.API_URL || 'https://api.muly.xyz';

const LOGO_DATA_URI =
  'data:image/png;base64,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';

function truncate(str, max) {
  if (!str) return '';
  const clean = String(str).replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, max - 1).trimEnd() + '...';
}

function arrayBufferToBase64(buffer) {
  return Buffer.from(buffer).toString('base64');
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

export async function buildProfileBannerResponse(username, origin = 'https://muly.xyz', profileOverride = null) {
  const profile =
    profileOverride ||
    (username ? await fetchJson(`${API_BASE}/profile/${encodeURIComponent(username)}`) : null);

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

  const [avatarDataUri, albumCoverDataUri, ...topCoverDataUris] = await Promise.all([
    fetchImageAsDataUri(profile?.avatarUrl),
    fetchImageAsDataUri(featuredAlbum?.coverUrl),
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
        el('img', {
          src: LOGO_DATA_URI,
          width: 42,
          height: 42,
          style: { borderRadius: '9999px' }
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
            alignItems: 'flex-start',
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
                  gap: '12px',
                  marginTop: '20px',
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '12px',
                  padding: '10px 18px'
                }
              },
              el(
                'span',
                { style: { fontSize: '15px', fontWeight: 800, color: '#10b981', letterSpacing: '0.06em' } },
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
              featuredLabel
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
                      justifyContent: 'center'
                    }
                  },
                  el('img', {
                    src: LOGO_DATA_URI,
                    width: 72,
                    height: 72,
                    style: { borderRadius: '9999px', opacity: 0.85 }
                  })
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
    height: 630
  });
}

export default async function handler(req, res) {
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'muly.xyz';
  const origin = `${protocol}://${host}`;

  const { username } = req.query || {};
  const imgRes = await buildProfileBannerResponse(username, origin);
  const buffer = Buffer.from(await imgRes.arrayBuffer());

  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
  res.status(200).send(buffer);
}
