"use client";

import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";

interface ImageViewerProps {
  url: string;
  alt: string;
}

export function ImageViewer({ url, alt }: ImageViewerProps) {
  return (
    <div className="flex justify-center">
      <Zoom>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={alt}
          className="max-w-full rounded-lg border shadow-sm"
          style={{ maxHeight: "600px", objectFit: "contain" }}
        />
      </Zoom>
    </div>
  );
}
