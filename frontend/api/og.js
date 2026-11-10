const API_BASE = process.env.API_URL || 'https://api.muly.xyz';

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatStars(rating) {
  if (!rating || rating <= 0) return '';
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  return '★'.repeat(full) + (half ? '½' : '');
}

async function fetchJson(url) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6500);
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

export default async function handler(req, res) {
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'muly.xyz';
  const origin = `${protocol}://${host}`;

  const { type, id, review } = req.query || {};

  let title = 'Muly | A rede social para quem ama música';
  let description = 'Catalogue o que você ouve, avalie álbuns e faixas, monte listas temáticas e compartilhe seu perfil musical.';
  let image = `${origin}/logo-emerald.png`;
  let canonicalPath = '/';

  if (type === 'profile' && id) {
    canonicalPath = `/profile/${encodeURIComponent(id)}`;
    const profile = await fetchJson(`${API_BASE}/profile/${encodeURIComponent(id)}`);
    if (profile) {
      title = `@${profile.username} no Muly (${profile.totalReviews || 0} ${profile.totalReviews === 1 ? 'avaliação' : 'avaliações'})`;
      const parts = [];
      if (profile.favoriteAlbum) {
        parts.push(`★ Favorito: ${profile.favoriteAlbum.title} — ${profile.favoriteAlbum.artist}`);
        if (profile.favoriteAlbum.coverUrl) {
          image = profile.favoriteAlbum.coverUrl;
        }
      }
      if (profile.currentTrack) {
        parts.push(`🎧 Ouvindo: ${profile.currentTrack.title} (${profile.currentTrack.artist || ''})`);
        if (image.endsWith('/logo-emerald.png') && profile.currentTrack.coverUrl) {
          image = profile.currentTrack.coverUrl;
        }
      }
      if (profile.topAlbums && profile.topAlbums.length > 0) {
        const topTitles = profile.topAlbums.map(t => t.album?.title).filter(Boolean).join(', ');
        if (topTitles) {
          parts.push(`Top 4: ${topTitles}`);
        }
        if (image.endsWith('/logo-emerald.png') && profile.topAlbums[0]?.album?.coverUrl) {
          image = profile.topAlbums[0].album.coverUrl;
        }
      }
      description = parts.length > 0
        ? parts.join(' • ')
        : `Confira o perfil musical, avaliações e listas de @${profile.username} no Muly.`;
    }
  } else if (type === 'album' && id) {
    canonicalPath = `/catalog/albums/${encodeURIComponent(id)}${review ? `?review=${encodeURIComponent(review)}` : ''}`;
    const [album, reviewsSummary] = await Promise.all([
      fetchJson(`${API_BASE}/catalog/albums/${encodeURIComponent(id)}`),
      fetchJson(`${API_BASE}/reviews/album/${encodeURIComponent(id)}`)
    ]);

    if (album) {
      if (album.coverUrl) {
        image = album.coverUrl;
      }

      let matchedReview = null;
      if (review && reviewsSummary) {
        const allReviews = [
          ...(reviewsSummary.reviews || []),
          ...(reviewsSummary.trackReviews || [])
        ];
        matchedReview = allReviews.find(r => String(r.id) === String(review));
      }

      if (matchedReview) {
        const stars = formatStars(matchedReview.rating);
        const targetLabel = matchedReview.trackNumber
          ? `a música "${matchedReview.trackTitle}" de ${album.title}`
          : `o álbum "${album.title}" (${album.artist})`;
        title = `${stars} (${matchedReview.rating.toFixed(1)}/5) — Review de @${matchedReview.username} para ${targetLabel}`;
        description = matchedReview.reviewText
          ? `"${matchedReview.reviewText}" — Avaliado por @${matchedReview.username} no Muly.`
          : `Veja a avaliação de @${matchedReview.username} para ${album.title} (${album.artist}) no Muly.`;
      } else {
        const avg = reviewsSummary?.averageRating ? `★ ${Number(reviewsSummary.averageRating).toFixed(1)}/5` : '';
        title = `${album.title} — ${album.artist} ${avg ? `(${avg})` : ''} | Muly`;
        description = `Veja as avaliações, faixas e resenhas da comunidade para ${album.title} de ${album.artist} no Muly.`;
      }
    }
  } else if (type === 'list' && id) {
    canonicalPath = `/lists/${encodeURIComponent(id)}`;
    const list = await fetchJson(`${API_BASE}/lists/${encodeURIComponent(id)}`);
    if (list) {
      title = `${list.title} — Lista por @${list.username} | Muly`;
      const count = list.items ? list.items.length : 0;
      description = list.description
        ? `${list.description} (${count} ${count === 1 ? 'álbum' : 'álbuns'} • ♥ ${list.likesCount || 0})`
        : `Lista com ${count} ${count === 1 ? 'álbum' : 'álbuns'} criada por @${list.username} no Muly.`;
      if (list.items && list.items.length > 0 && list.items[0]?.album?.coverUrl) {
        image = list.items[0].album.coverUrl;
      }
    }
  } else if (type === 'review' && id) {
    canonicalPath = `/reviews/${encodeURIComponent(id)}`;
    const rev = await fetchJson(`${API_BASE}/reviews/${encodeURIComponent(id)}`);
    if (rev) {
      if (rev.albumCoverUrl) {
        image = rev.albumCoverUrl;
      }
      const stars = formatStars(rev.rating);
      const targetLabel = rev.trackNumber
        ? `a música "${rev.trackTitle}" (${rev.albumTitle})`
        : `o álbum "${rev.albumTitle}" (${rev.albumArtist})`;
      title = `${stars} (${Number(rev.rating).toFixed(1)}/5) — Review de @${rev.username} para ${targetLabel}`;
      description = rev.reviewText
        ? `"${rev.reviewText}" — Avaliado por @${rev.username} no Muly.`
        : `Veja a avaliação de @${rev.username} para ${rev.albumTitle} (${rev.albumArtist}) no Muly.`;
    }
  }

  const fullUrl = `${origin}${canonicalPath}`;
  const html = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)}</title>
  <meta name="theme-color" content="#10b981">
  <meta name="description" content="${escapeHtml(description)}">

  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Muly">
  <meta property="og:url" content="${escapeHtml(fullUrl)}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${escapeHtml(image)}">
  <meta property="og:image:width" content="640">
  <meta property="og:image:height" content="640">

  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${escapeHtml(image)}">

  <meta http-equiv="refresh" content="0;url=${escapeHtml(canonicalPath)}">
</head>
<body style="background:#14181c;color:#fff;font-family:sans-serif;text-align:center;padding:40px">
  <p>Redirecionando para <a href="${escapeHtml(canonicalPath)}" style="color:#10b981">${escapeHtml(title)}</a>...</p>
  <script>window.location.replace(${JSON.stringify(canonicalPath)});</script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  res.status(200).send(html);
}
