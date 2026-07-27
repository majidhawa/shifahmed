import VideoCard from "@/components/VideoCard";
import { courseVideos } from "@/data/videos";

export default function VideosPage() {
  return (
    <main className="min-h-screen bg-gray-50">

      {/* Hero Section */}
      <section className="bg-green-700 py-20 text-white">
        <div className="mx-auto max-w-7xl px-6 text-center">

          <h1 className="text-5xl font-bold">
            Watch Our Course Videos
          </h1>

          <p className="mt-4 text-lg text-green-100">
            Explore our programmes and discover your future career path.
          </p>

        </div>
      </section>


      {/* Video Grid */}
      <section className="mx-auto max-w-7xl px-6 py-16">

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">

        {courseVideos.map((video) => (

  <VideoCard
    key={video.id}
    title={video.title}
    course={video.course}
    description={video.description}
    video={video.video}
    thumbnail={video.thumbnail}
  />

))}

        </div>

      </section>

    </main>
  );
}