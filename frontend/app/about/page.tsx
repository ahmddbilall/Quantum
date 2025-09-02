"use client";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Brain,
  Zap,
  Globe,
  Users,
  Target,
  Award,
  Lightbulb,
  Heart,
} from "lucide-react";

export default function AboutPage() {
  const features = [
    {
      icon: Brain,
      title: "AI-Powered Intelligence",
      description:
        "Advanced machine learning algorithms that understand context and provide intelligent news analysis.",
    },
    {
      icon: Zap,
      title: "Real-Time Updates",
      description:
        "Stay informed with instant news updates from trusted sources around the world.",
    },
    {
      icon: Globe,
      title: "Global Coverage",
      description:
        "Comprehensive news coverage from international sources in multiple languages.",
    },
    {
      icon: Users,
      title: "Personalized Experience",
      description:
        "Tailored news feed based on your interests and reading preferences.",
    },
  ];

  const values = [
    {
      icon: Target,
      title: "Accuracy",
      description:
        "We prioritize factual, verified information from credible sources.",
    },
    {
      icon: Lightbulb,
      title: "Innovation",
      description: "Continuously improving through cutting-edge AI technology.",
    },
    {
      icon: Heart,
      title: "User-Centric",
      description:
        "Designed with user experience and accessibility at the forefront.",
    },
    {
      icon: Award,
      title: "Excellence",
      description:
        "Committed to delivering the highest quality news experience.",
    },
  ];

  const teamMembers = [
    {
      name: "Dr. Sarah Chen",
      role: "Chief Technology Officer",
      bio: "AI researcher with 15+ years experience in machine learning and natural language processing.",
      image: "/placeholder-user.jpg",
    },
    {
      name: "Michael Rodriguez",
      role: "Head of Product",
      bio: "Product strategist focused on creating intuitive user experiences for news consumption.",
      image: "/placeholder-user.jpg",
    },
    {
      name: "Emily Johnson",
      role: "Editorial Director",
      bio: "Former journalist with expertise in media ethics and information verification.",
      image: "/placeholder-user.jpg",
    },
    {
      name: "David Kim",
      role: "Lead Developer",
      bio: "Full-stack engineer specializing in scalable web applications and data processing.",
      image: "/placeholder-user.jpg",
    },
  ];

  const stats = [
    { number: "500K+", label: "Active Users" },
    { number: "10M+", label: "Articles Processed" },
    { number: "50+", label: "News Sources" },
    { number: "99.9%", label: "Uptime" },
  ];

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6">
            About <span className="font-oxanium">Quantum</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
            We're revolutionizing how people consume and understand news through
            the power of artificial intelligence. Our mission is to make
            information more accessible, understandable, and actionable for
            everyone.
          </p>
        </div>

        {/* Mission Statement */}
        <Card className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-gray-700 mb-16">
          <CardContent className="p-8 text-center">
            <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
            <p className="text-lg text-gray-300 max-w-4xl mx-auto">
              To democratize access to information by providing intelligent,
              personalized, and contextual news experiences that help people
              make informed decisions in an increasingly complex world.
            </p>
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, index) => (
            <Card
              key={index}
              className="bg-gray-800 border-gray-700 text-center"
            >
              <CardContent className="p-6">
                <div className="text-3xl font-bold text-blue-400 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-400">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Features */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">
            What Makes Us Different
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-colors"
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-white">
                    <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                      <feature.icon className="h-6 w-6" />
                    </div>
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Values */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <Card
                key={index}
                className="bg-gray-800 border-gray-700 text-center"
              >
                <CardContent className="p-6">
                  <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <value.icon className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {value.title}
                  </h3>
                  <p className="text-gray-400 text-sm">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Team Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">
            Meet Our Team
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map((member, index) => (
              <Card
                key={index}
                className="bg-gray-800 border-gray-700 text-center"
              >
                <CardContent className="p-6">
                  <div className="w-24 h-24 bg-gray-600 rounded-full mx-auto mb-4 overflow-hidden">
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-1">
                    {member.name}
                  </h3>
                  <Badge
                    variant="secondary"
                    className="mb-3 bg-blue-900 text-blue-300"
                  >
                    {member.role}
                  </Badge>
                  <p className="text-gray-400 text-sm">{member.bio}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Technology Stack */}
        <Card className="bg-gray-800 border-gray-700 mb-16">
          <CardHeader>
            <CardTitle className="text-white text-center text-2xl">
              Our Technology
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              {[
                "Machine Learning",
                "Natural Language Processing",
                "Real-time Data Processing",
                "Cloud Computing",
                "Advanced Analytics",
                "API Integration",
                "Responsive Design",
                "Security & Privacy",
              ].map((tech, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="p-3 border-gray-600 text-gray-300"
                >
                  {tech}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <Card className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border-gray-700">
          <CardContent className="p-8 text-center">
            <h2 className="text-3xl font-bold mb-4">Join Us on Our Journey</h2>
            <p className="text-lg text-gray-300 mb-6 max-w-2xl mx-auto">
              We're constantly evolving and improving. Be part of the future of
              news consumption and help us build a more informed world.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                Get Started
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-white text-white hover:bg-white hover:text-black"
              >
                Contact Us
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}
