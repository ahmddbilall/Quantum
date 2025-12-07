"use client";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Eye, AlertTriangle } from "lucide-react";

export default function PrivacyPolicyPage() {
  const lastUpdated = "August 30, 2025";
  const effectiveDate = "September 1, 2025";

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar showSearch={true} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Privacy Policy
          </h1>
          <p className="text-gray-300 text-lg">
            Your privacy is important to us. This policy explains how we
            collect, use, and protect your information.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6 text-sm">
            <div className="flex items-center gap-2 text-gray-300">
              <Eye className="h-4 w-4" />
              Last Updated: {lastUpdated}
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <AlertTriangle className="h-4 w-4" />
              Effective: {effectiveDate}
            </div>
          </div>
        </div>

        {/* Single Content Section */}
        <Card className="bg-zinc-900 border-gray-700 hover:border-white/50 transition-all duration-300">
          <CardContent className="p-8 space-y-8">
            {/* Introduction */}
            <div>
              <p className="text-gray-300 leading-relaxed">
                Quantum ("we," "our," or "us") is committed to protecting your
                privacy. This Privacy Policy explains how we collect, use,
                disclose, and safeguard your information when you use our
                AI-powered news platform and related services. By using our
                services, you agree to the collection and use of information in
                accordance with this policy.
              </p>
            </div>

            <Separator className="bg-gray-700" />

            {/* Information We Collect */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">
                Information We Collect
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-white mb-2">
                    Personal Information
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    We collect information you provide directly to us, such as
                    when you create an account, subscribe to our services, or
                    contact us. This may include your name, email address, and
                    preferences.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">
                    Usage Information
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    We automatically collect information about how you use our
                    services, including your reading history, search queries,
                    and interaction patterns with our AI features.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">
                    Device Information
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    We collect information about the device you use to access
                    our services, including IP address, browser type, operating
                    system, and device identifiers.
                  </p>
                </div>
              </div>
            </div>

            <Separator className="bg-gray-700" />

            {/* How We Use Your Information */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">
                How We Use Your Information
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-white mb-2">
                    Service Provision
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    We use your information to provide, maintain, and improve
                    our news aggregation and AI analysis services, including
                    personalizing your news feed.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">
                    Communication
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    We may use your contact information to send you
                    service-related announcements, updates, and promotional
                    materials (with your consent).
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">
                    Analytics and Improvement
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    We analyze usage patterns to understand user behavior,
                    improve our algorithms, and develop new features and
                    services.
                  </p>
                </div>
              </div>
            </div>

            <Separator className="bg-gray-700" />

            {/* Information Sharing */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">
                Information Sharing
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-white mb-2">
                    Third-Party Services
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    We may share information with trusted third-party service
                    providers who assist us in operating our services, such as
                    hosting providers and analytics services.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">
                    Legal Requirements
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    We may disclose your information if required by law,
                    regulation, or legal process, or to protect the rights,
                    property, or safety of Quantum or others.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">
                    Business Transfers
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    In the event of a merger, acquisition, or sale of assets,
                    your information may be transferred as part of the
                    transaction.
                  </p>
                </div>
              </div>
            </div>

            <Separator className="bg-gray-700" />

            {/* Data Security */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">
                Data Security
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-white mb-2">
                    Security Measures
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    We implement appropriate technical and organizational
                    measures to protect your personal information against
                    unauthorized access, alteration, disclosure, or destruction.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">Encryption</h3>
                  <p className="text-gray-300 leading-relaxed">
                    We use industry-standard encryption protocols to protect
                    data in transit and at rest.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">
                    Access Controls
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    We maintain strict access controls and regularly audit our
                    systems to ensure the security of your information.
                  </p>
                </div>
              </div>
            </div>

            <Separator className="bg-gray-700" />

            {/* Your Rights and Choices */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">
                Your Rights and Choices
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-white mb-2">
                    Access and Correction
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    You have the right to access, update, or correct your
                    personal information at any time through your account
                    settings.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">
                    Data Portability
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    You can request a copy of your personal data in a
                    structured, commonly used format.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">Deletion</h3>
                  <p className="text-gray-300 leading-relaxed">
                    You can request deletion of your personal information,
                    subject to certain legal and operational requirements.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">Opt-Out</h3>
                  <p className="text-gray-300 leading-relaxed">
                    You can opt out of promotional communications and certain
                    data processing activities through your account settings or
                    by contacting us.
                  </p>
                </div>
              </div>
            </div>

            <Separator className="bg-gray-700" />

            {/* Cookies and Tracking */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">
                Cookies and Tracking
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-white mb-2">
                    Cookie Usage
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    We use cookies and similar technologies to enhance your
                    browsing experience, analyze site traffic, and personalize
                    content.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">
                    Third-Party Cookies
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    Our site may contain third-party cookies from analytics
                    providers and advertising partners.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">
                    Cookie Controls
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    You can control cookie preferences through your browser
                    settings or our cookie consent manager.
                  </p>
                </div>
              </div>
            </div>

            <Separator className="bg-gray-700" />

            {/* International Users */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">
                International Users
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                If you are accessing our services from outside the United
                States, please note that your information may be transferred to,
                stored, and processed in the United States and other countries
                where our servers are located.
              </p>
              <p className="text-gray-300 leading-relaxed">
                For users in the European Union, we comply with the General Data
                Protection Regulation (GDPR) and provide additional rights and
                protections as required by applicable law.
              </p>
            </div>

            <Separator className="bg-gray-700" />

            {/* Children's Privacy */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">
                Children's Privacy
              </h2>
              <p className="text-gray-300 leading-relaxed">
                Our services are not intended for children under the age of 13.
                We do not knowingly collect personal information from children
                under 13. If you are a parent or guardian and believe your child
                has provided us with personal information, please contact us so
                we can delete such information.
              </p>
            </div>

            <Separator className="bg-gray-700" />

            {/* Changes to Policy */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">
                Changes to This Privacy Policy
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                We may update this Privacy Policy from time to time. We will
                notify you of any changes by posting the new Privacy Policy on
                this page and updating the "Last Updated" date.
              </p>
              <p className="text-gray-300 leading-relaxed">
                We encourage you to review this Privacy Policy periodically for
                any changes. Your continued use of our services after the
                posting of changes constitutes your acceptance of such changes.
              </p>
            </div>

            <Separator className="bg-gray-700" />

            {/* Contact Information */}
            <div className="bg-gradient-to-r from-indigo-900/20 to-purple-900/20 p-6 rounded-lg border border-gray-700">
              <h2 className="text-xl font-semibold text-white mb-4 text-center">
                Questions About This Policy?
              </h2>
              <p className="text-gray-300 mb-6 text-center">
                If you have any questions about this Privacy Policy or our
                privacy practices, please contact us:
              </p>
              <div className="space-y-2 text-gray-300 text-center">
                <p>Email: privacy@quantum.ai</p>
                <p>
                  Address: 123 Tech Street, Suite 100, San Francisco, CA 94102
                </p>
                <p>Phone: +1 (555) 123-4567</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}
