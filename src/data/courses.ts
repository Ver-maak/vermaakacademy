import course1 from "@/assets/course-1.jpg";
import course2 from "@/assets/course-2.jpg";
import course3 from "@/assets/course-3.jpg";
import course4 from "@/assets/course-4.jpg";
import course5 from "@/assets/course-5.jpg";
import course6 from "@/assets/course-6.jpg";

export type Course = {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  instructor: string;
  duration: string;
  category: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  rating: number;
  featured?: boolean;
};

export const categories = [
  "Digital Marketing",
  "Graphic Design",
  "UI/UX Design",
  "Web Development",
  "Game Development",
  "3D Design",
  "Animation",
  "Photography",
  "Creative Entrepreneurship",
  "AI & Emerging Tech",
];

export const courses: Course[] = [
  {
    id: "1",
    title: "Full-Stack Web Development",
    description: "Ship modern apps with React, TypeScript and Supabase from zero to deployed.",
    thumbnail: course1,
    instructor: "Amara Okonkwo",
    duration: "12 weeks",
    category: "Web Development",
    level: "Intermediate",
    rating: 4.9,
    featured: true,
  },
  {
    id: "2",
    title: "Product Design Mastery",
    description: "Design beautiful, accessible interfaces using Figma and a real design system.",
    thumbnail: course2,
    instructor: "Thabo Mokoena",
    duration: "8 weeks",
    category: "UI/UX Design",
    level: "Beginner",
    rating: 4.8,
    featured: true,
  },
  {
    id: "3",
    title: "Cinematic Storytelling",
    description: "Tell African stories with light, lens and rhythm — from script to color grade.",
    thumbnail: course3,
    instructor: "Zainab Adeyemi",
    duration: "10 weeks",
    category: "Photography",
    level: "Intermediate",
    rating: 4.9,
    featured: true,
  },
  {
    id: "4",
    title: "Motion & 3D Design",
    description: "Bring brands to life with motion graphics, Cinema 4D and Blender.",
    thumbnail: course4,
    instructor: "Kwame Asante",
    duration: "9 weeks",
    category: "Animation",
    level: "Advanced",
    rating: 4.7,
  },
  {
    id: "5",
    title: "Build with AI",
    description: "Practical prompt engineering and shipping AI features that actually work.",
    thumbnail: course5,
    instructor: "Lerato Ndlovu",
    duration: "6 weeks",
    category: "AI & Emerging Tech",
    level: "Intermediate",
    rating: 4.9,
    featured: true,
  },
  {
    id: "6",
    title: "Creative Entrepreneurship",
    description: "Turn your craft into a business — branding, pricing, clients, and growth.",
    thumbnail: course6,
    instructor: "Nia Mensah",
    duration: "7 weeks",
    category: "Creative Entrepreneurship",
    level: "Beginner",
    rating: 4.8,
  },
  {
    id: "7",
    title: "Brand Identity Systems",
    description: "Craft identities that scale — typography, color, voice and brand guidelines.",
    thumbnail: course2,
    instructor: "Adaeze Eze",
    duration: "8 weeks",
    category: "Graphic Design",
    level: "Intermediate",
    rating: 4.7,
  },
  {
    id: "8",
    title: "Game Dev with Unity",
    description: "Design and ship your first 2D/3D game using Unity and C#.",
    thumbnail: course4,
    instructor: "Sipho Dlamini",
    duration: "11 weeks",
    category: "Game Development",
    level: "Advanced",
    rating: 4.6,
  },
  {
    id: "9",
    title: "Growth Marketing 101",
    description: "Performance marketing for African startups — SEO, paid, content and analytics.",
    thumbnail: course1,
    instructor: "Yaa Boateng",
    duration: "6 weeks",
    category: "Digital Marketing",
    level: "Beginner",
    rating: 4.8,
  },
];
