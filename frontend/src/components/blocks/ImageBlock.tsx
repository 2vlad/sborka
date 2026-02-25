import { useEffect, useRef, useState } from "react";
import type { Block, ImagePayload } from "../../types/blocks";

interface ImageBlockProps {
  block: Block;
}

function parseAspectRatio(ratio: string): number {
  const parts = ratio.split(":");
  if (parts.length === 2) {
    const w = parseFloat(parts[0]);
    const h = parseFloat(parts[1]);
    if (w > 0 && h > 0) return w / h;
  }
  return 16 / 9;
}

export function ImageBlock({ block }: ImageBlockProps) {
  const payload = block.payload as unknown as ImagePayload;
  const aspectRatio = parseAspectRatio(payload.aspect_ratio ?? "16:9");
  const [loaded, setLoaded] = useState(false);
  const lastUrl = useRef<string | null>(null);

  // Reset loaded state only when URL actually changes to a *different* value
  useEffect(() => {
    if (payload.url && payload.url !== lastUrl.current) {
      lastUrl.current = payload.url;
      setLoaded(false);
    }
  }, [payload.url]);

  return (
    <figure className="my-4">
      <div
        className="relative w-full overflow-hidden rounded-xl bg-gray-100"
        style={{ aspectRatio: String(aspectRatio) }}
      >
        {payload.url ? (
          <>
            {/* Placeholder shown until image loads */}
            {!loaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-8 w-8 animate-spin-ease rounded-full border-4 border-gray-200 border-t-gray-600" />
              </div>
            )}
            <img
              src={payload.url}
              alt={payload.alt ?? ""}
              className={`h-full w-full object-cover transition-opacity duration-500 ${
                loaded ? "opacity-100" : "opacity-0"
              }`}
              onLoad={() => setLoaded(true)}
            />
          </>
        ) : (
          <>
            {/* Shimmer background */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)",
                backgroundSize: "200% 100%",
                animation: "shimmer 1.5s infinite ease-in-out",
              }}
            />
            {/* Centered icon + label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <svg
                className="h-8 w-8 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span className="text-sm font-medium text-gray-400">
                Генерируем изображение...
              </span>
            </div>
          </>
        )}
      </div>
      {payload.caption && (
        <figcaption className="mt-2 text-center text-sm text-gray-500">
          {payload.caption}
        </figcaption>
      )}
    </figure>
  );
}
