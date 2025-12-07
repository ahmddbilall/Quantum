"use client";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Briefcase,
  MapPin,
  Calendar,
  Clock,
  Users,
  Award,
  TrendingUp,
} from "lucide-react";

export default function CareersPage() {
  const openPositions = [
    {
      id: 1,
      title: "Senior AI Engineer",
      department: "Engineering",
      location: "San Francisco, CA",
      type: "Full-time",
      experience: "5+ years",
      description:
        "Join our AI team to develop cutting-edge machine learning models for news analysis and recommendation systems.",
      skills: ["Python", "TensorFlow", "PyTorch", "NLP", "Machine Learning"],
      posted: "2 days ago",
    },
    {
      id: 2,
      title: "Frontend Developer",
      department: "Engineering",
      location: "Remote",
      type: "Full-time",
      experience: "3+ years",
      description:
        "Build beautiful, responsive user interfaces using React, Next.js, and modern web technologies.",
      skills: ["React", "Next.js", "TypeScript", "Tailwind CSS", "UI/UX"],
      posted: "1 week ago",
    },
    {
      id: 3,
      title: "Product Manager",
      department: "Product",
      location: "New York, NY",
      type: "Full-time",
      experience: "4+ years",
      description:
        "Lead product strategy and roadmap for our AI-powered news platform.",
      skills: [
        "Product Strategy",
        "Data Analysis",
        "User Research",
        "Agile",
        "AI/ML",
      ],
      posted: "3 days ago",
    },
    {
      id: 4,
      title: "Data Scientist",
      department: "Data Science",
      location: "London, UK",
      type: "Full-time",
      experience: "3+ years",
      description:
        "Analyze user behavior and news consumption patterns to improve our recommendation algorithms.",
      skills: [
        "Python",
        "SQL",
        "Statistics",
        "Data Visualization",
        "A/B Testing",
      ],
      posted: "5 days ago",
    },
    {
      id: 5,
      title: "Content Strategist",
      department: "Editorial",
      location: "Remote",
      type: "Full-time",
      experience: "2+ years",
      description:
        "Develop content strategy and editorial guidelines for our AI-curated news platform.",
      skills: [
        "Content Strategy",
        "Editorial",
        "SEO",
        "Analytics",
        "Journalism",
      ],
      posted: "1 week ago",
    },
    {
      id: 6,
      title: "DevOps Engineer",
      department: "Engineering",
      location: "San Francisco, CA",
      type: "Full-time",
      experience: "4+ years",
      description:
        "Manage our cloud infrastructure and deployment pipelines to ensure scalability and reliability.",
      skills: ["AWS", "Docker", "Kubernetes", "CI/CD", "Monitoring"],
      posted: "4 days ago",
    },
  ];

  const benefits = [
    {
      icon: TrendingUp,
      title: "Competitive Salary",
      description: "Industry-leading compensation packages with equity options",
    },
    {
      icon: Users,
      title: "Health & Wellness",
      description:
        "Comprehensive health insurance, dental, vision, and wellness programs",
    },
    {
      icon: Calendar,
      title: "Flexible Time Off",
      description: "Unlimited PTO policy and flexible working arrangements",
    },
    {
      icon: Award,
      title: "Learning & Development",
      description:
        "Annual learning budget and conference attendance opportunities",
    },
    {
      icon: MapPin,
      title: "Remote-First",
      description:
        "Work from anywhere with optional office access in major cities",
    },
    {
      icon: Briefcase,
      title: "Career Growth",
      description: "Clear advancement paths and mentorship programs",
    },
  ];

  const departments = [
    { name: "Engineering", count: 8, color: "bg-blue-600" },
    { name: "Product", count: 3, color: "bg-green-600" },
    { name: "Data Science", count: 5, color: "bg-purple-600" },
    { name: "Editorial", count: 4, color: "bg-orange-600" },
    { name: "Marketing", count: 2, color: "bg-pink-600" },
    { name: "Operations", count: 3, color: "bg-indigo-600" },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar showSearch={true} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Careers</h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Explore opportunities to join our team and help shape the future of
            AI-powered news.
          </p>
        </div>

        {/* Open Positions */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-left mb-12">Open Positions</h2>
          <div className="space-y-6">
            {openPositions.map((position) => (
              <Card
                key={position.id}
                className="bg-zinc-900 border-gray-700 hover:border-white/50 transition-all duration-300 cursor-pointer"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="text-xl font-semibold text-white">
                          {position.title}
                        </h3>
                        <Badge
                          variant="secondary"
                          className="bg-indigo-600 text-white"
                        >
                          {position.department}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="border-gray-600 text-gray-300 bg-gray-700"
                        >
                          {position.type}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-300 mb-3">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {position.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Briefcase className="h-4 w-4" />
                          {position.experience}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {position.posted}
                        </span>
                      </div>

                      <p className="text-gray-300 mb-4">
                        {position.description}
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {position.skills.map((skill, skillIndex) => (
                          <Badge
                            key={skillIndex}
                            variant="secondary"
                            className="text-xs bg-gray-700 text-gray-300"
                          >
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 lg:mt-0 lg:ml-6">
                      <Button className="w-full lg:w-auto cursor-pointer bg-white text-black hover:bg-white/90 transition-all duration-300">
                        Apply Now
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-8">
            <p className="text-gray-300 mb-4">
              Don't see a position that fits? We're always looking for talented
              people.
            </p>
            <Button className="bg-white text-black hover:bg-white/90 transition-all duration-300 cursor-pointer">
              Send Us Your Resume
            </Button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
