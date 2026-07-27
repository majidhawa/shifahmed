export interface CourseVideo {
  id: number;
  slug: string;
  title: string;
  course: string;
  category: string;
  duration: string;
  description: string;
  video: string;
  thumbnail: string;
  featured: boolean;
  views: number;
  color: string;
  applyLink: string;
}

export const courseVideos: CourseVideo[] = [
  {
    id: 1,
    slug: "german-language",
    title: "Certificate in German Language",
    course: "Certificate in German Language",
    category: "Language",
    duration: "3 Months",
    description:
      "Master German communication skills and prepare for study, work, and migration opportunities in Germany, Austria, and Switzerland.",
    video: "/videos/german-language.mp4",
    thumbnail: "/videos/thumbnails/german-language.jpg",
    featured: true,
    views: 1280,
    color: "#1B5E20",
    applyLink: "/apply",
  },

  {
    id: 2,
    slug: "paramedicine",
    title: "Diploma in Paramedicine",
    course: "Diploma in Paramedicine",
    category: "Diploma",
    duration: "2 Years",
    description:
      "Train as a professional paramedic with advanced emergency medical care, ambulance operations, trauma management, and life-saving skills.",
    video: "/videos/paramedicine.mp4",
    thumbnail: "/videos/thumbnails/paramedicine.jpg",
    featured: true,
    views: 2450,
    color: "#0D47A1",
    applyLink: "/apply",
  },

  {
    id: 3,
    slug: "emt",
    title: "Emergency Medical Technology (EMT)",
    course: "Emergency Medical Technology",
    category: "Certificate",
    duration: "6 Months",
    description:
      "Gain practical emergency response skills including CPR, first aid, trauma care, patient transport, and disaster preparedness.",
    video: "/videos/emt.mp4",
    thumbnail: "/videos/thumbnails/emt.jpg",
    featured: true,
    views: 1965,
    color: "#C62828",
    applyLink: "/apply",
  },

  {
    id: 4,
    slug: "caregiving",
    title: "Caregiving Level 4",
    course: "Caregiving Level 4",
    category: "Certificate",
    duration: "6 Months",
    description:
      "Develop hands-on caregiving skills in personal care, elderly support, patient hygiene, mobility assistance, and professional ethics.",
    video: "/videos/caregiving.mp4",
    thumbnail: "/videos/thumbnails/caregiving.jpg",
    featured: false,
    views: 1578,
    color: "#6A1B9A",
    applyLink: "/apply",
  },

  {
    id: 5,
    slug: "safe-phlebotomy",
    title: "Safe Phlebotomy",
    course: "Safe Phlebotomy",
    category: "Short Course",
    duration: "8 Weeks",
    description:
      "Learn safe blood specimen collection techniques, infection prevention, laboratory ethics, and practical venipuncture skills.",
    video: "/videos/phlebotomy.mp4",
    thumbnail: "/videos/thumbnails/phlebotomy.jpg",
    featured: false,
    views: 980,
    color: "#EF6C00",
    applyLink: "/apply",
  },

  {
    id: 6,
    slug: "dialysis-technology",
    title: "Dialysis Technology",
    course: "Dialysis Technology",
    category: "Certificate",
    duration: "3 Months",
    description:
      "Learn dialysis procedures, renal patient care, machine operation, infection control, and clinical monitoring techniques.",
    video: "/videos/dialysis.mp4",
    thumbnail: "/videos/thumbnails/dialysis.jpg",
    featured: false,
    views: 842,
    color: "#00838F",
    applyLink: "/apply",
  },
];