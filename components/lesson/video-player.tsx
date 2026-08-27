"use client";

type VideoPlayerProps = {
  videoUrl?: string;
  startSeconds?: number;
};

function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.slice(1).split("/")[0];
      return id || null;
    }
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return v;
      const parts = u.pathname.split("/").filter(Boolean);
      const embedIdx = parts.indexOf("embed");
      if (embedIdx !== -1 && parts[embedIdx + 1]) return parts[embedIdx + 1];
    }
  } catch {}
  return null;
}

function extractVimeoId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean).pop();
      if (id && /^\d+$/.test(id)) return id;
    }
  } catch {}
  return null;
}

function buildEmbedSrc(videoUrl: string | undefined, startSeconds: number): string | null {
  if (!videoUrl) return null;
  const youTubeId = extractYouTubeId(videoUrl);
  if (youTubeId) {
    const start = startSeconds > 0 ? `&start=${startSeconds}` : "";
    return `https://www.youtube.com/embed/${youTubeId}?rel=0&modestbranding=1${start}`;
  }
  const vimeoId = extractVimeoId(videoUrl);
  if (vimeoId) {
    const hash = startSeconds > 0 ? `#t=${startSeconds}s` : "";
    return `https://player.vimeo.com/video/${vimeoId}${hash}`;
  }
  // Bunny / generic iframe – append start if it looks like Bunny
  if (videoUrl.includes("mediadelivery.net") || videoUrl.includes("bunny.net") || videoUrl.includes("iframe.mediadelivery")) {
    try {
      const u = new URL(videoUrl);
      if (startSeconds > 0) u.searchParams.set("start", String(startSeconds));
      return u.toString();
    } catch {
      return videoUrl;
    }
  }
  // Fallback – if already an embed URL, append start
  try {
    const u = new URL(videoUrl);
    if (u.hostname.includes("youtube.com") && u.pathname.includes("/embed/") && startSeconds > 0) {
      u.searchParams.set("start", String(startSeconds));
      return u.toString();
    }
    return videoUrl;
  } catch {
    return videoUrl;
  }
}

export function VideoPlayer({ videoUrl, startSeconds = 0 }: VideoPlayerProps) {
  const src = buildEmbedSrc(videoUrl, startSeconds);

  if (!src) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-xl bg-black text-white">
        <p className="text-small text-neutral-400">No video available</p>
      </div>
    );
  }

  return (
    <div className="aspect-video w-full overflow-hidden rounded-xl bg-black shadow-sm">
      <iframe
        key={src}
        src={src}
        title="Lesson video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="size-full border-0"
      />
    </div>
  );
}
