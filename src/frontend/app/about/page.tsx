import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About - Viral Images",
  description: "Learn more about the Viral Images project.",
};

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-8 pt-20">
      <h1 className="text-4xl font-bold mb-6">About the Project</h1>
      <p className="text-lg text-gray-700 leading-relaxed mb-4">
        The Viral Images project explores the spread and evolution of visual content in historical newspapers.
        By leveraging advanced image recognition and clustering techniques, we aim to uncover patterns of image reuse,
        adaptation, and dissemination across different publications and time periods.
      </p>
      <p className="text-lg text-gray-700 leading-relaxed mb-4">
        Our goal is to provide researchers, historians, and the public with a unique tool to analyze the visual
        culture of the past, offering new insights into how images shaped public discourse and reflected societal changes.
      </p>
      <h2 className="text-3xl font-semibold mb-4 mt-8">Methodology</h2>
      <p className="text-lg text-gray-700 leading-relaxed mb-4">
        We use a combination of computer vision algorithms, including CLIP embeddings, to identify visually similar
        images. These images are then clustered, allowing us to track their appearances and transformations.
        Metadata from newspaper archives enriches our analysis, providing context such as publication dates,
        titles, and associated articles.
      </p>
      <h2 className="text-3xl font-semibold mb-4 mt-8">Team</h2>
      <p className="text-lg text-gray-700 leading-relaxed">
        This project is a collaborative effort by researchers passionate about digital humanities and computational history.
        For more information or to contribute, please contact us.
      </p>
    </div>
  );
}
