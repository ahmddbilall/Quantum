"use client";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  FileText,
  Shield,
  AlertTriangle,
  Scale,
  Gavel,
  Users,
  Ban,
  Eye,
} from "lucide-react";

export default function TermsOfServicePage() {
  const sections = [
    {
      title: "Acceptance of Terms",
      icon: FileText,
      content: [
        {
          subtitle: "Agreement to Terms",
          text: "By accessing and using Quantum's services, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.",
        },
        {
          subtitle: "Modifications",
          text: "We reserve the right to modify these terms at any time. We will notify users of any material changes, and continued use of the service constitutes acceptance of the modified terms.",
        },
      ],
    },
    {
      title: "Use License",
      icon: Scale,
      content: [
        {
          subtitle: "Permitted Use",
          text: "Permission is granted to temporarily access and use Quantum's services for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title.",
        },
        {
          subtitle: "Restrictions",
          text: "You may not: modify or copy the materials; use the materials for commercial purposes; attempt to reverse engineer any software; or remove any copyright or proprietary notations from the materials.",
        },
      ],
    },
    {
      title: "User Accounts",
      icon: Users,
      content: [
        {
          subtitle: "Account Creation",
          text: "To access certain features, you must create an account with accurate and complete information. You are responsible for maintaining the confidentiality of your account credentials.",
        },
        {
          subtitle: "Account Security",
          text: "You are responsible for all activities that occur under your account. Notify us immediately of any unauthorized use of your account or any other breach of security.",
        },
        {
          subtitle: "Account Termination",
          text: "We reserve the right to terminate or suspend your account at any time for violation of these terms or for any other reason at our sole discretion.",
        },
      ],
    },
    {
      title: "Prohibited Uses",
      icon: Ban,
      content: [
        {
          subtitle: "Illegal Activities",
          text: "You may not use our service for any unlawful purpose or to solicit others to perform unlawful acts. This includes but is not limited to violating any local, state, national, or international law.",
        },
        {
          subtitle: "Harmful Content",
          text: "You may not transmit any content that is harmful, threatening, abusive, harassing, defamatory, vulgar, obscene, or otherwise objectionable.",
        },
        {
          subtitle: "System Interference",
          text: "You may not attempt to interfere with, compromise the system integrity or security, or decipher any transmissions to or from the servers running the service.",
        },
      ],
    },
    {
      title: "Intellectual Property",
      icon: Shield,
      content: [
        {
          subtitle: "Our Content",
          text: "The service and its original content, features, and functionality are and will remain the exclusive property of Quantum and its licensors. The service is protected by copyright, trademark, and other laws.",
        },
        {
          subtitle: "User Content",
          text: "You retain ownership of any content you submit to our service. By submitting content, you grant us a worldwide, non-exclusive, royalty-free license to use, modify, and distribute your content in connection with the service.",
        },
        {
          subtitle: "Third-Party Content",
          text: "Our service may contain links to third-party websites or services. We do not own or control these third-party resources and are not responsible for their content or availability.",
        },
      ],
    },
    {
      title: "AI Services and Data Processing",
      icon: Eye,
      content: [
        {
          subtitle: "AI Analysis",
          text: "Our AI-powered features analyze news content and user behavior to provide personalized recommendations. This processing is performed in accordance with our Privacy Policy.",
        },
        {
          subtitle: "Data Accuracy",
          text: "While we strive for accuracy in our AI analysis and recommendations, we do not guarantee the accuracy, completeness, or reliability of any AI-generated content or analysis.",
        },
        {
          subtitle: "User Responsibility",
          text: "Users are responsible for verifying information and making their own judgments about content quality and reliability. Our AI features are tools to assist with information discovery, not definitive sources of truth.",
        },
      ],
    },
    {
      title: "Disclaimers and Limitations",
      icon: AlertTriangle,
      content: [
        {
          subtitle: "Service Availability",
          text: "The service is provided on an 'as is' basis. We do not warrant that the service will be uninterrupted, timely, secure, or error-free. Service availability may be affected by maintenance, updates, or unforeseen technical issues.",
        },
        {
          subtitle: "Content Accuracy",
          text: "We aggregate news from various sources and use AI to analyze and categorize content. We do not guarantee the accuracy, completeness, or reliability of any news content or AI analysis provided through our service.",
        },
        {
          subtitle: "Limitation of Liability",
          text: "In no event shall Quantum be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.",
        },
      ],
    },
    {
      title: "Privacy and Data Protection",
      icon: Shield,
      content: [
        {
          subtitle: "Data Collection",
          text: "We collect and process personal data in accordance with our Privacy Policy. By using our service, you consent to such processing and warrant that all data provided by you is accurate.",
        },
        {
          subtitle: "Data Security",
          text: "We implement appropriate security measures to protect your personal information. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.",
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
          <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
          <p className="text-gray-400 text-lg">
            Please read these terms carefully before using our services.
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
              Welcome to Quantum. These Terms of Service ("Terms") govern your
              use of our AI-powered news platform and related services provided
              by Quantum ("we," "our," or "us"). By accessing or using our
              services, you agree to be bound by these Terms. If you disagree
              with any part of these terms, then you may not access the service.
            </p>
          </CardContent>
        </Card>

        {/* Terms Sections */}
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

        {/* Subscription and Billing */}
        <Card className="bg-gray-800 border-gray-700 mt-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Gavel className="h-5 w-5" />
              </div>
              Subscription and Billing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold text-white mb-2">
                Subscription Terms
              </h4>
              <p className="text-gray-300 leading-relaxed">
                Certain features of our service may require a paid subscription.
                Subscription fees are billed in advance on a recurring basis and
                are non-refundable except as required by law.
              </p>
            </div>
            <Separator className="bg-gray-700" />
            <div>
              <h4 className="font-semibold text-white mb-2">Cancellation</h4>
              <p className="text-gray-300 leading-relaxed">
                You may cancel your subscription at any time through your
                account settings. Cancellation will take effect at the end of
                your current billing period.
              </p>
            </div>
            <Separator className="bg-gray-700" />
            <div>
              <h4 className="font-semibold text-white mb-2">Price Changes</h4>
              <p className="text-gray-300 leading-relaxed">
                We reserve the right to modify subscription fees with 30 days
                advance notice. Continued use of the service after a price
                change constitutes acceptance of the new pricing.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Governing Law */}
        <Card className="bg-gray-800 border-gray-700 mt-8">
          <CardHeader>
            <CardTitle className="text-white">
              Governing Law and Dispute Resolution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 leading-relaxed mb-4">
              These Terms shall be interpreted and governed by the laws of the
              State of California, United States, without regard to its conflict
              of law provisions.
            </p>
            <p className="text-gray-300 leading-relaxed">
              Any disputes arising out of or relating to these Terms or the
              service shall be resolved through binding arbitration in
              accordance with the rules of the American Arbitration Association.
            </p>
          </CardContent>
        </Card>

        {/* Severability */}
        <Card className="bg-gray-800 border-gray-700 mt-8">
          <CardHeader>
            <CardTitle className="text-white">Severability</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 leading-relaxed">
              If any provision of these Terms is held to be invalid or
              unenforceable by a court, the remaining provisions of these Terms
              will remain in effect. These Terms constitute the entire agreement
              between us regarding our service.
            </p>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-gray-700 mt-8">
          <CardContent className="p-6 text-center">
            <h3 className="text-xl font-semibold text-white mb-4">
              Questions About These Terms?
            </h3>
            <p className="text-gray-300 mb-6">
              If you have any questions about these Terms of Service, please
              contact us:
            </p>
            <div className="space-y-2 text-gray-300">
              <p>Email: legal@quantum.ai</p>
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
