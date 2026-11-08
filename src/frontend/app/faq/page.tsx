import { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";

export const metadata: Metadata = {
  title: "FAQ - Viral Images",
  description: "Frequently Asked Questions about the Viral Images project.",
};

const linkClass =
  "font-medium text-blue-700 underline decoration-blue-700/30 underline-offset-4 " +
  "transition-colors hover:text-blue-900 hover:decoration-blue-900 " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 rounded-sm " +
  "dark:text-blue-400 dark:decoration-blue-400/40 dark:hover:text-blue-300 dark:hover:decoration-blue-300";

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={`${linkClass} break-words`}>
      {children}
      <ArrowUpRight aria-hidden className="ml-0.5 inline size-4 align-text-top" />
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

export default function FAQPage() {
  return (
    <div className="container mx-auto px-4 py-8 pt-20">
      <h1 className="text-4xl font-bold mb-6">Frequently Asked Questions</h1>

      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">What is Viral Images?</h2>
        <p className="text-lg text-gray-700 leading-relaxed">
          Viral Images is a research project that investigates how to identify image reprints within
          the digitized newspapers available in Chronicling America, a digital initiave hosted by the Library of Congress.
          The project is developed at the Lab for Computing Cultural Heritage within the School of Information
          at University of Washington, led by <a href="https://bcglee.github.io/" className={linkClass}>Dr. Ben Lee</a> and
          researchers <a href="https://sun770311.github.io/" className={linkClass}>Yueran Sun</a> and{" "}
          <a href="https://bruno.land/" className={linkClass}>Bruno Buccalon</a>.





        </p>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">How do you identify &ldquo;viral&rdquo; images?</h2>
        <p className="text-lg text-gray-700 leading-relaxed">
          We introduce an unsupervised method of identifying reprintings by leveraging
          contrastive language-image pretraining (CLIP) to embed 1.5 million photographs extracted from 16 million newspaper pages in Chronicling America.
          These image embeddings are then clustered using DBSCAN (Density-Based Spatial Clustering of Applications with Noise),
          which groups images by similarity and helps to identify reprinted content. Please check{" "}
          <a href="https://doi.org/10.48550/arXiv.2606.16209" className={linkClass}>our paper</a> for further details!
        </p>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">What kind of data do you use?</h2>
        <p className="text-lg text-gray-700 leading-relaxed">
          For our analysis, we adopted the Newspaper Navigator dataset of extracted photographs from Chronicling America. A version of this dataset is available on HuggingFace
          through the initiative BigLAM: BigScience Libraries, Archives and Museums:{" "}
          <ExternalLink href="https://huggingface.co/datasets/biglam/newspaper-navigator">
            huggingface.co/datasets/biglam/newspaper-navigator
          </ExternalLink>
        </p>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Are your results publicly available?</h2>
        <p className="text-lg text-gray-700 leading-relaxed">
          Yes! You can find the CLIP embeddings and the resultig clusters on the Viral Images repository at HuggingFace.
          The source code of our data analysis as well as our web application is available on GitHub:
        </p>
        <ul className="mt-3 list-disc space-y-2 pl-6 text-lg text-gray-700 leading-relaxed marker:text-blue-700 dark:marker:text-blue-400">
          <li>
            Embeddings and clusters:{" "}
            <ExternalLink href="https://huggingface.co/datasets/L4CCH/viral-images">
              huggingface.co/datasets/L4CCH/viral-images
            </ExternalLink>
          </li>
          <li>
            Source code:{" "}
            <ExternalLink href="https://github.com/L4CCH/viral-images">
              github.com/L4CCH/viral-images
            </ExternalLink>
          </li>
        </ul>
      </div>
    </div>
  );
}
