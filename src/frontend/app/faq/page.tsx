import { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ - Viral Images",
  description: "Frequently Asked Questions about the Viral Images project.",
};

export default function FAQPage() {
  return (
    <div className="container mx-auto px-4 py-8 pt-20">
      <h1 className="text-4xl font-bold mb-6">Frequently Asked Questions</h1>

      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">What is Viral Images?</h2>
        <p className="text-lg text-gray-700 leading-relaxed">
          Viral Images is a research project that uses computational methods to track and analyze the spread of visual content in historical newspapers. We identify images that appear multiple times across different publications and time periods.
        </p>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">How do you identify "viral" images?</h2>
        <p className="text-lg text-gray-700 leading-relaxed">
          We use advanced computer vision techniques, specifically CLIP (Contrastive Language-Image Pre-training) embeddings, to find visually similar images. Images with high similarity scores are grouped into clusters, representing instances of a "viral" image.
        </p>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">What kind of data do you use?</h2>
        <p className="text-lg text-gray-700 leading-relaxed">
          Our primary data source is digitized historical newspapers. We extract images and their associated metadata (like publication date, newspaper title, and captions) to provide context for each image cluster.
        </p>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">Can I contribute to the project?</h2>
        <p className="text-lg text-gray-700 leading-relaxed">
          We welcome collaborations and contributions! If you are a researcher, historian, or developer interested in digital humanities, please reach out to us through the contact information provided on the About page.
        </p>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">Is the data publicly available?</h2>
        <p className="text-lg text-gray-700 leading-relaxed">
          We are working towards making our datasets and tools publicly accessible. Please check back on our website or contact us for updates on data availability.
        </p>
      </div>
    </div>
  );
}
