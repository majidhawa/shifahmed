"use client";

import { useRef, useState } from "react";

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

  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);


  const handleMouseEnter = () => {

    if (videoRef.current) {

      videoRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch(() => {});

    }

  };


  const handleMouseLeave = () => {

    if (videoRef.current) {

      videoRef.current.pause();
      videoRef.current.currentTime = 0;

      setIsPlaying(false);

    }

  };


  return (

    <article
      className="
      group
      overflow-hidden
      rounded-2xl
      bg-white
      shadow-lg
      transition-all
      duration-300
      hover:-translate-y-2
      hover:shadow-2xl
      "
    >


      {/* VIDEO AREA */}

      <div
        className="
        relative
        aspect-[9/16]
        overflow-hidden
        bg-gray-200
        "
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >


        {/* Thumbnail fallback */}

        {!isLoaded && (

          <img
            src={thumbnail}
            alt={title}
            className="
            absolute
            inset-0
            h-full
            w-full
            object-cover
            transition-opacity
            duration-500
            "
          />

        )}



        <video

          ref={videoRef}

          controls

          preload="none"

          poster={thumbnail}

          playsInline

          controlsList="nodownload"

          onLoadedData={() => setIsLoaded(true)}

          className="
          h-full
          w-full
          object-cover
          "
        >

          <source
            src={video}
            type="video/mp4"
          />

          Your browser does not support video playback.

        </video>



        {/* Play overlay */}

        {!isPlaying && (

          <div
            className="
            pointer-events-none
            absolute
            inset-0
            flex
            items-center
            justify-center
            "
          >

            <div
              className="
              flex
              h-16
              w-16
              items-center
              justify-center
              rounded-full
              bg-white/80
              text-2xl
              shadow-xl
              transition
              group-hover:scale-110
              "
            >

              ▶

            </div>

          </div>

        )}



      </div>



      {/* CONTENT */}


      <div className="p-5">


        <span
          className="
          inline-block
          rounded-full
          bg-green-100
          px-3
          py-1
          text-xs
          font-semibold
          text-green-700
          "
        >

          {course}

        </span>



        <h3
          className="
          mt-4
          text-xl
          font-bold
          text-gray-900
          "
        >

          {title}

        </h3>




        <p
          className="
          mt-3
          text-sm
          leading-relaxed
          text-gray-600
          "
        >

          {description}

        </p>



        <button
          className="
          mt-5
          w-full
          rounded-lg
          bg-green-600
          py-3
          font-semibold
          text-white
          transition
          hover:bg-green-700
          "
        >

          Apply Now

        </button>


      </div>


    </article>

  );
}