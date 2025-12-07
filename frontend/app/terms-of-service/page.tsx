"use client";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Eye, AlertTriangle } from "lucide-react";

export default function TermsOfServicePage() {
  const lastUpdated = "August 30, 2025";
  const effectiveDate = "September 1, 2025";

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar showSearch={true} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Terms of Service
          </h1>
          <p className="text-gray-300 text-lg">
            Please read these terms carefully before using our services.
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
                Welcome to Quantum. These Terms of Service ("Terms") govern your
                use of our AI-powered news platform and related services
                provided by Quantum ("we," "our," or "us"). By accessing or
                using our services, you agree to be bound by these Terms. If you
                disagree with any part of these terms, then you may not access
                the service.
              </p>
            </div>

            <Separator className="bg-gray-700" />

            {/* Acceptance of Terms */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">
                Acceptance of Terms
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-white mb-2">
                    Agreement to Terms
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    By accessing and using Quantum's services, you accept and
                    agree to be bound by the terms and provision of this
                    agreement. If you do not agree to abide by the above, please
                    do not use this service.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">
                    Modifications
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    We reserve the right to modify these terms at any time. We
                    will notify users of any material changes, and continued use
                    of the service constitutes acceptance of the modified terms.
                  </p>
                </div>
              </div>
            </div>

            <Separator className="bg-gray-700" />

            {/* Use License */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">
                Use License
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-white mb-2">
                    Permitted Use
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    Permission is granted to temporarily access and use
                    Quantum's services for personal, non-commercial transitory
                    viewing only. This is the grant of a license, not a transfer
                    of title.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">
                    Restrictions
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    You may not: modify or copy the materials; use the materials
                    for commercial purposes; attempt to reverse engineer any
                    software; or remove any copyright or proprietary notations
                    from the materials.
                  </p>
                </div>
              </div>
            </div>

            <Separator className="bg-gray-700" />

            {/* User Accounts */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">
                User Accounts
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-white mb-2">
                    Account Creation
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    To access certain features, you must create an account with
                    accurate and complete information. You are responsible for
                    maintaining the confidentiality of your account credentials.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">
                    Account Security
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    You are responsible for all activities that occur under your
                    account. Notify us immediately of any unauthorized use of
                    your account or any other breach of security.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">
                    Account Termination
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    We reserve the right to terminate or suspend your account at
                    any time for violation of these terms or for any other
                    reason at our sole discretion.
                  </p>
                </div>
              </div>
            </div>

            <Separator className="bg-gray-700" />

            {/* Prohibited Uses */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">
                Prohibited Uses
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-white mb-2">
                    Illegal Activities
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    You may not use our service for any unlawful purpose or to
                    solicit others to perform unlawful acts. This includes but
                    is not limited to violating any local, state, national, or
                    international law.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">
                    Harmful Content
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    You may not transmit any content that is harmful,
                    threatening, abusive, harassing, defamatory, vulgar,
                    obscene, or otherwise objectionable.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">
                    System Interference
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    You may not attempt to interfere with, compromise the system
                    integrity or security, or decipher any transmissions to or
                    from the servers running the service.
                  </p>
                </div>
              </div>
            </div>

            <Separator className="bg-gray-700" />

            {/* Intellectual Property */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">
                Intellectual Property
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-white mb-2">Our Content</h3>
                  <p className="text-gray-300 leading-relaxed">
                    The service and its original content, features, and
                    functionality are and will remain the exclusive property of
                    Quantum and its licensors. The service is protected by
                    copyright, trademark, and other laws.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">
                    User Content
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    You retain ownership of any content you submit to our
                    service. By submitting content, you grant us a worldwide,
                    non-exclusive, royalty-free license to use, modify, and
                    distribute your content in connection with the service.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">
                    Third-Party Content
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    Our service may contain links to third-party websites or
                    services. We do not own or control these third-party
                    resources and are not responsible for their content or
                    availability.
                  </p>
                </div>
              </div>
            </div>

            <Separator className="bg-gray-700" />

            {/* AI Services and Data Processing */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">
                AI Services and Data Processing
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-white mb-2">AI Analysis</h3>
                  <p className="text-gray-300 leading-relaxed">
                    Our AI-powered features analyze news content and user
                    behavior to provide personalized recommendations. This
                    processing is performed in accordance with our Privacy
                    Policy.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">
                    Data Accuracy
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    While we strive for accuracy in our AI analysis and
                    recommendations, we do not guarantee the accuracy,
                    completeness, or reliability of any AI-generated content or
                    analysis.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">
                    User Responsibility
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    Users are responsible for verifying information and making
                    their own judgments about content quality and reliability.
                    Our AI features are tools to assist with information
                    discovery, not definitive sources of truth.
                  </p>
                </div>
              </div>
            </div>

            <Separator className="bg-gray-700" />

            {/* Disclaimers and Limitations */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">
                Disclaimers and Limitations
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-white mb-2">
                    Service Availability
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    The service is provided on an 'as is' basis. We do not
                    warrant that the service will be uninterrupted, timely,
                    secure, or error-free. Service availability may be affected
                    by maintenance, updates, or unforeseen technical issues.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">
                    Content Accuracy
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    We aggregate news from various sources and use AI to analyze
                    and categorize content. We do not guarantee the accuracy,
                    completeness, or reliability of any news content or AI
                    analysis provided through our service.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">
                    Limitation of Liability
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    In no event shall Quantum be liable for any indirect,
                    incidental, special, consequential, or punitive damages,
                    including without limitation, loss of profits, data, use,
                    goodwill, or other intangible losses.
                  </p>
                </div>
              </div>
            </div>

            <Separator className="bg-gray-700" />

            {/* Privacy and Data Protection */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">
                Privacy and Data Protection
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-white mb-2">
                    Data Collection
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    We collect and process personal data in accordance with our
                    Privacy Policy. By using our service, you consent to such
                    processing and warrant that all data provided by you is
                    accurate.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">
                    Data Security
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    We implement appropriate security measures to protect your
                    personal information. However, no method of transmission
                    over the internet is 100% secure, and we cannot guarantee
                    absolute security.
                  </p>
                </div>
              </div>
            </div>

            <Separator className="bg-gray-700" />

            {/* Subscription and Billing */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">
                Subscription and Billing
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-white mb-2">
                    Subscription Terms
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    Certain features of our service may require a paid
                    subscription. Subscription fees are billed in advance on a
                    recurring basis and are non-refundable except as required by
                    law.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">
                    Cancellation
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    You may cancel your subscription at any time through your
                    account settings. Cancellation will take effect at the end
                    of your current billing period.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">
                    Price Changes
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    We reserve the right to modify subscription fees with 30
                    days advance notice. Continued use of the service after a
                    price change constitutes acceptance of the new pricing.
                  </p>
                </div>
              </div>
            </div>

            <Separator className="bg-gray-700" />

            {/* Governing Law */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">
                Governing Law and Dispute Resolution
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                These Terms shall be interpreted and governed by the laws of the
                State of California, United States, without regard to its
                conflict of law provisions.
              </p>
              <p className="text-gray-300 leading-relaxed">
                Any disputes arising out of or relating to these Terms or the
                service shall be resolved through binding arbitration in
                accordance with the rules of the American Arbitration
                Association.
              </p>
            </div>

            <Separator className="bg-gray-700" />

            {/* Severability */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">
                Severability
              </h2>
              <p className="text-gray-300 leading-relaxed">
                If any provision of these Terms is held to be invalid or
                unenforceable by a court, the remaining provisions of these
                Terms will remain in effect. These Terms constitute the entire
                agreement between us regarding our service.
              </p>
            </div>

            <Separator className="bg-gray-700" />

            {/* Contact Information */}
            <div className="bg-gradient-to-r from-indigo-900/20 to-purple-900/20 p-6 rounded-lg border border-gray-700">
              <h2 className="text-xl font-semibold text-white mb-4 text-center">
                Questions About These Terms?
              </h2>
              <p className="text-gray-300 mb-6 text-center">
                If you have any questions about these Terms of Service, please
                contact us:
              </p>
              <div className="space-y-2 text-gray-300 text-center">
                <p>Email: legal@quantum.ai</p>
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
