"use client";

import { useRef } from "react";

interface Props {
  title: string;
  course: string;
  description: string;
  video: string;
  thumbnail: string;
}

export default function VideoCard({
  title,
  course,
  description,
  video,
  thumbnail,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-lg transition hover:-translate-y-1 hover:shadow-2xl">

      <video
        ref={videoRef}
        controls
        preload="metadata"
        poster={thumbnail}
        className="aspect-[9/16] w-full object-cover"
      >
        <source src={video} type="video/mp4" />
      </video>

      <div className="p-5">

        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
          {course}
        </span>

        <h3 className="mt-3 text-xl font-bold">
          {title}
        </h3>

        <p className="mt-2 text-gray-600">
          {description}
        </p>

      </div>

    </div>
  );
}