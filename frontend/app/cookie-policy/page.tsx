"use client";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Cookie,
  Settings,
  Eye,
  Shield,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { useState } from "react";

export default function CookiePolicyPage() {
  const [cookieSettings, setCookieSettings] = useState({
    essential: true, // Always enabled
    analytics: true,
    marketing: false,
    personalization: true,
    social: false,
  });

  const handleToggle = (category: string) => {
    if (category === "essential") return; // Essential cookies cannot be disabled
    setCookieSettings((prev) => ({
      ...prev,
      [category]: !prev[category as keyof typeof prev],
    }));
  };

  const cookieCategories = [
    {
      id: "essential",
      name: "Essential Cookies",
      description:
        "These cookies are necessary for the website to function and cannot be switched off in our systems. They are usually only set in response to actions made by you which amount to a request for services.",
      examples: [
        "User authentication",
        "Security tokens",
        "Session management",
      ],
      enabled: cookieSettings.essential,
      required: true,
    },
    {
      id: "analytics",
      name: "Analytics Cookies",
      description:
        "These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our site. They help us to know which pages are the most and least popular.",
      examples: [
        "Google Analytics",
        "User behavior tracking",
        "Performance monitoring",
      ],
      enabled: cookieSettings.analytics,
      required: false,
    },
    {
      id: "marketing",
      name: "Marketing Cookies",
      description:
        "These cookies may be set through our site by our advertising partners. They may be used by those companies to build a profile of your interests and show you relevant adverts.",
      examples: [
        "Advertisement targeting",
        "Conversion tracking",
        "Retargeting",
      ],
      enabled: cookieSettings.marketing,
      required: false,
    },
    {
      id: "personalization",
      name: "Personalization Cookies",
      description:
        "These cookies enable the website to provide enhanced functionality and personalization. They help us provide you with content that is relevant to your interests.",
      examples: [
        "News preferences",
        "AI recommendations",
        "User interface settings",
      ],
      enabled: cookieSettings.personalization,
      required: false,
    },
    {
      id: "social",
      name: "Social Media Cookies",
      description:
        "These cookies are set by social media services that we have added to the site to enable you to share our content with your friends and networks.",
      examples: [
        "Social media sharing",
        "Login with social accounts",
        "Social widgets",
      ],
      enabled: cookieSettings.social,
      required: false,
    },
  ];

  const lastUpdated = "August 30, 2025";

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Cookie Policy</h1>
          <p className="text-gray-400 text-lg">
            Learn about how we use cookies and similar technologies to improve
            your experience.
          </p>
          <div className="flex items-center gap-2 justify-center mt-6 text-sm text-gray-400">
            <Eye className="h-4 w-4" />
            Last Updated: {lastUpdated}
          </div>
        </div>

        {/* Introduction */}
        <Card className="bg-gray-800 border-gray-700 mb-8">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Cookie className="h-5 w-5" />
              What Are Cookies?
            </h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              Cookies are small text files that are placed on your computer or
              mobile device when you visit our website. They are widely used to
              make websites work more efficiently and provide information to the
              owners of the site.
            </p>
            <p className="text-gray-300 leading-relaxed">
              We use cookies to enhance your browsing experience, analyze site
              traffic, personalize content, and provide social media features.
              This policy explains what cookies we use, why we use them, and how
              you can control them.
            </p>
          </CardContent>
        </Card>

        {/* Cookie Settings */}
        <Card className="bg-gray-800 border-gray-700 mb-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Cookie Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-gray-300">
              You can control which cookies we use on our website. Essential
              cookies cannot be disabled as they are necessary for the website
              to function properly.
            </p>

            {cookieCategories.map((category, index) => (
              <div key={category.id}>
                <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-semibold text-white mb-1">
                      {category.name}
                    </h3>
                    <p className="text-gray-300 text-sm mb-2">
                      {category.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {category.examples.map((example, exampleIndex) => (
                        <span
                          key={exampleIndex}
                          className="text-xs bg-gray-600 text-gray-300 px-2 py-1 rounded"
                        >
                          {example}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="ml-4">
                    <button
                      onClick={() => handleToggle(category.id)}
                      className={`flex items-center ${
                        category.required
                          ? "cursor-not-allowed opacity-50"
                          : "cursor-pointer"
                      }`}
                      disabled={category.required}
                    >
                      {category.enabled ? (
                        <ToggleRight className="h-8 w-8 text-blue-400" />
                      ) : (
                        <ToggleLeft className="h-8 w-8 text-gray-500" />
                      )}
                    </button>
                    {category.required && (
                      <span className="text-xs text-gray-500 mt-1 block">
                        Required
                      </span>
                    )}
                  </div>
                </div>
                {index < cookieCategories.length - 1 && (
                  <Separator className="bg-gray-700" />
                )}
              </div>
            ))}

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button className="bg-blue-600 hover:bg-blue-700">
                Save Cookie Preferences
              </Button>
              <Button
                variant="outline"
                className="border-gray-600 text-gray-300 hover:text-white hover:border-white"
              >
                Accept All Cookies
              </Button>
              <Button
                variant="outline"
                className="border-gray-600 text-gray-300 hover:text-white hover:border-white"
              >
                Reject All Optional Cookies
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Types of Cookies */}
        <Card className="bg-gray-800 border-gray-700 mb-8">
          <CardHeader>
            <CardTitle className="text-white">
              Types of Cookies We Use
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold text-white mb-2">Session Cookies</h3>
              <p className="text-gray-300">
                These are temporary cookies that are deleted when you close your
                browser. They help us recognize you as you navigate between
                pages during a single browser session.
              </p>
            </div>
            <Separator className="bg-gray-700" />
            <div>
              <h3 className="font-semibold text-white mb-2">
                Persistent Cookies
              </h3>
              <p className="text-gray-300">
                These cookies remain on your device until they expire or you
                delete them. They help us remember your preferences and provide
                a personalized experience across multiple visits.
              </p>
            </div>
            <Separator className="bg-gray-700" />
            <div>
              <h3 className="font-semibold text-white mb-2">
                First-Party Cookies
              </h3>
              <p className="text-gray-300">
                These are cookies set by our website directly. We use them to
                provide core functionality and improve your user experience.
              </p>
            </div>
            <Separator className="bg-gray-700" />
            <div>
              <h3 className="font-semibold text-white mb-2">
                Third-Party Cookies
              </h3>
              <p className="text-gray-300">
                These cookies are set by external services we use, such as
                analytics providers, advertising networks, and social media
                platforms.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* How to Control Cookies */}
        <Card className="bg-gray-800 border-gray-700 mb-8">
          <CardHeader>
            <CardTitle className="text-white">How to Control Cookies</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold text-white mb-2">
                Browser Settings
              </h3>
              <p className="text-gray-300 mb-2">
                Most web browsers allow you to control cookies through their
                settings preferences. You can:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-1">
                <li>Block all cookies</li>
                <li>Block third-party cookies</li>
                <li>Delete existing cookies</li>
                <li>Set your browser to notify you when cookies are sent</li>
              </ul>
            </div>
            <Separator className="bg-gray-700" />
            <div>
              <h3 className="font-semibold text-white mb-2">
                Cookie Management Tools
              </h3>
              <p className="text-gray-300">
                You can also use our cookie preference center (above) to control
                which types of cookies we use. Your preferences will be
                remembered for future visits.
              </p>
            </div>
            <Separator className="bg-gray-700" />
            <div>
              <h3 className="font-semibold text-white mb-2">
                Impact of Disabling Cookies
              </h3>
              <p className="text-gray-300">
                Please note that disabling cookies may affect the functionality
                of our website. Some features may not work properly or may not
                be available if you choose to disable certain types of cookies.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Third-Party Services */}
        <Card className="bg-gray-800 border-gray-700 mb-8">
          <CardHeader>
            <CardTitle className="text-white">Third-Party Services</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-300 mb-4">
              We use various third-party services that may set their own
              cookies. These include:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  name: "Google Analytics",
                  purpose: "Website analytics and performance tracking",
                },
                {
                  name: "Google Ads",
                  purpose: "Advertising and conversion tracking",
                },
                {
                  name: "Facebook Pixel",
                  purpose: "Social media advertising and analytics",
                },
                {
                  name: "Twitter",
                  purpose: "Social media integration and sharing",
                },
                {
                  name: "TradingView",
                  purpose: "Financial market data and charts",
                },
                {
                  name: "Cloudflare",
                  purpose: "Content delivery and security services",
                },
              ].map((service, index) => (
                <div key={index} className="bg-gray-700 p-4 rounded-lg">
                  <h4 className="font-semibold text-white mb-1">
                    {service.name}
                  </h4>
                  <p className="text-gray-300 text-sm">{service.purpose}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Updates to This Policy */}
        <Card className="bg-gray-800 border-gray-700 mb-8">
          <CardHeader>
            <CardTitle className="text-white">Updates to This Policy</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 leading-relaxed mb-4">
              We may update this Cookie Policy from time to time to reflect
              changes in our practices or for other operational, legal, or
              regulatory reasons.
            </p>
            <p className="text-gray-300 leading-relaxed">
              We will notify you of any material changes by posting the new
              policy on our website and updating the "Last Updated" date. We
              encourage you to review this policy periodically.
            </p>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-gray-700">
          <CardContent className="p-6 text-center">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center justify-center gap-2">
              <Shield className="h-5 w-5" />
              Questions About Cookies?
            </h3>
            <p className="text-gray-300 mb-6">
              If you have any questions about our use of cookies or this Cookie
              Policy, please contact us:
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
