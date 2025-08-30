import CircularTestimonials from "@/components/ui/circular-testionials";
import StarryBackground from "@/components/ui/starry-background";

const WhyChooseUs = () => {
  const whyChooseUsData = [
    {
      quote:
        "Get instant answers and context about any news story with our advanced AI chatbot. Ask questions, explore topics, and understand complex events with ease.",
      name: "AI Chatbot",
      designation: "Intelligent News Assistant",
      src: "/landing_page_res/chatai.png",
    },
    {
      quote:
        "Receive personalized news recommendations based on your interests and reading patterns. Our smart algorithm learns what matters to you most.",
      name: "Smart Recommendations",
      designation: "Personalized Content Delivery",
      src: "/landing_page_res/recommend.png",
    },
    {
      quote:
        "Access diverse perspectives from multiple trusted news sources all in one place. Compare viewpoints from different outlets to get the complete story and form your own informed opinion.",
      name: "Multiple News Sources",
      designation: "Diverse Perspectives & Coverage",
      src: "/landing_page_res/news_sources.jpg",
    },
    {
      quote:
        "Save time with AI-generated summaries that capture the key points of any article. Get informed quickly without reading full stories.",
      name: "Quick Summaries",
      designation: "Efficient Information Processing",
      src: "/landing_page_res/summary.png",
    },
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-black relative overflow-hidden">
      {/* Starry background */}
      <StarryBackground starCount={25} opacity={0.3} />

      <div className="max-w-7xl mx-auto relative z-10">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-12 text-center">
          Why Choose <span className="font-oxanium">Quantum</span>?
        </h2>
        <div className="flex items-center justify-center">
          <CircularTestimonials
            testimonials={whyChooseUsData}
            autoplay={true}
            colors={{
              name: "#ffffff",
              designation: "#e1e1e1",
              testimony: "#f1f1f7",
              arrowBackground: "#374151",
              arrowForeground: "#ffffff",
              arrowHoverBackground: "#ffffff",
              arrowHoverForeground: "#000000",
            }}
            fontSizes={{
              name: "28px",
              designation: "18px",
              quote: "18px",
            }}
          />
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
