"use client";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Shield,
  Eye,
  Lock,
  Share2,
  Cookie,
  Database,
  Users,
  AlertTriangle,
} from "lucide-react";

export default function PrivacyPolicyPage() {
  const sections = [
    {
      title: "Information We Collect",
      icon: Database,
      content: [
        {
          subtitle: "Personal Information",
          text: "We collect information you provide directly to us, such as when you create an account, subscribe to our services, or contact us. This may include your name, email address, and preferences.",
        },
        {
          subtitle: "Usage Information",
          text: "We automatically collect information about how you use our services, including your reading history, search queries, and interaction patterns with our AI features.",
        },
        {
          subtitle: "Device Information",
          text: "We collect information about the device you use to access our services, including IP address, browser type, operating system, and device identifiers.",
        },
      ],
    },
    {
      title: "How We Use Your Information",
      icon: Users,
      content: [
        {
          subtitle: "Service Provision",
          text: "We use your information to provide, maintain, and improve our news aggregation and AI analysis services, including personalizing your news feed.",
        },
        {
          subtitle: "Communication",
          text: "We may use your contact information to send you service-related announcements, updates, and promotional materials (with your consent).",
        },
        {
          subtitle: "Analytics and Improvement",
          text: "We analyze usage patterns to understand user behavior, improve our algorithms, and develop new features and services.",
        },
      ],
    },
    {
      title: "Information Sharing",
      icon: Share2,
      content: [
        {
          subtitle: "Third-Party Services",
          text: "We may share information with trusted third-party service providers who assist us in operating our services, such as hosting providers and analytics services.",
        },
        {
          subtitle: "Legal Requirements",
          text: "We may disclose your information if required by law, regulation, or legal process, or to protect the rights, property, or safety of Quantum or others.",
        },
        {
          subtitle: "Business Transfers",
          text: "In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of the transaction.",
        },
      ],
    },
    {
      title: "Data Security",
      icon: Lock,
      content: [
        {
          subtitle: "Security Measures",
          text: "We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.",
        },
        {
          subtitle: "Encryption",
          text: "We use industry-standard encryption protocols to protect data in transit and at rest.",
        },
        {
          subtitle: "Access Controls",
          text: "We maintain strict access controls and regularly audit our systems to ensure the security of your information.",
        },
      ],
    },
    {
      title: "Your Rights and Choices",
      icon: Shield,
      content: [
        {
          subtitle: "Access and Correction",
          text: "You have the right to access, update, or correct your personal information at any time through your account settings.",
        },
        {
          subtitle: "Data Portability",
          text: "You can request a copy of your personal data in a structured, commonly used format.",
        },
        {
          subtitle: "Deletion",
          text: "You can request deletion of your personal information, subject to certain legal and operational requirements.",
        },
        {
          subtitle: "Opt-Out",
          text: "You can opt out of promotional communications and certain data processing activities through your account settings or by contacting us.",
        },
      ],
    },
    {
      title: "Cookies and Tracking",
      icon: Cookie,
      content: [
        {
          subtitle: "Cookie Usage",
          text: "We use cookies and similar technologies to enhance your browsing experience, analyze site traffic, and personalize content.",
        },
        {
          subtitle: "Third-Party Cookies",
          text: "Our site may contain third-party cookies from analytics providers and advertising partners.",
        },
        {
          subtitle: "Cookie Controls",
          text: "You can control cookie preferences through your browser settings or our cookie consent manager.",
        },
      ],
    },
  ];

  const lastUpdated = "August 30, 2025";
  const effectiveDate = "September 1, 2025";

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-gray-400 text-lg">
            Your privacy is important to us. This policy explains how we
            collect, use, and protect your information.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6 text-sm">
            <div className="flex items-center gap-2 text-gray-400">
              <Eye className="h-4 w-4" />
              Last Updated: {lastUpdated}
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <AlertTriangle className="h-4 w-4" />
              Effective: {effectiveDate}
            </div>
          </div>
        </div>

        {/* Introduction */}
        <Card className="bg-gray-800 border-gray-700 mb-8">
          <CardContent className="p-6">
            <p className="text-gray-300 leading-relaxed">
              Quantum ("we," "our," or "us") is committed to protecting your
              privacy. This Privacy Policy explains how we collect, use,
              disclose, and safeguard your information when you use our
              AI-powered news platform and related services. By using our
              services, you agree to the collection and use of information in
              accordance with this policy.
            </p>
          </CardContent>
        </Card>

        {/* Policy Sections */}
        <div className="space-y-8">
          {sections.map((section, index) => (
            <Card key={index} className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    <section.icon className="h-5 w-5" />
                  </div>
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {section.content.map((item, itemIndex) => (
                  <div key={itemIndex}>
                    <h4 className="font-semibold text-white mb-2">
                      {item.subtitle}
                    </h4>
                    <p className="text-gray-300 leading-relaxed">{item.text}</p>
                    {itemIndex < section.content.length - 1 && (
                      <Separator className="mt-4 bg-gray-700" />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* International Users */}
        <Card className="bg-gray-800 border-gray-700 mt-8">
          <CardHeader>
            <CardTitle className="text-white">International Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 leading-relaxed mb-4">
              If you are accessing our services from outside the United States,
              please note that your information may be transferred to, stored,
              and processed in the United States and other countries where our
              servers are located.
            </p>
            <p className="text-gray-300 leading-relaxed">
              For users in the European Union, we comply with the General Data
              Protection Regulation (GDPR) and provide additional rights and
              protections as required by applicable law.
            </p>
          </CardContent>
        </Card>

        {/* Children's Privacy */}
        <Card className="bg-gray-800 border-gray-700 mt-8">
          <CardHeader>
            <CardTitle className="text-white">Children's Privacy</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 leading-relaxed">
              Our services are not intended for children under the age of 13. We
              do not knowingly collect personal information from children under
              13. If you are a parent or guardian and believe your child has
              provided us with personal information, please contact us so we can
              delete such information.
            </p>
          </CardContent>
        </Card>

        {/* Changes to Policy */}
        <Card className="bg-gray-800 border-gray-700 mt-8">
          <CardHeader>
            <CardTitle className="text-white">
              Changes to This Privacy Policy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 leading-relaxed mb-4">
              We may update this Privacy Policy from time to time. We will
              notify you of any changes by posting the new Privacy Policy on
              this page and updating the "Last Updated" date.
            </p>
            <p className="text-gray-300 leading-relaxed">
              We encourage you to review this Privacy Policy periodically for
              any changes. Your continued use of our services after the posting
              of changes constitutes your acceptance of such changes.
            </p>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-gray-700 mt-8">
          <CardContent className="p-6 text-center">
            <h3 className="text-xl font-semibold text-white mb-4">
              Questions About This Policy?
            </h3>
            <p className="text-gray-300 mb-6">
              If you have any questions about this Privacy Policy or our privacy
              practices, please contact us:
            </p>
            <div className="space-y-2 text-gray-300">
              <p>Email: privacy@quantum.ai</p>
              <p>
                Address: 123 Tech Street, Suite 100, San Francisco, CA 94102
              </p>
              <p>Phone: +1 (555) 123-4567</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}
