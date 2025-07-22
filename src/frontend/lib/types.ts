export interface MetadataItem {
  filepath: string;
  pub_date: string;
  name: string;
  publisher: string;
  place_of_publication: string;
  prediction_section_iiif_url: string;
}

export interface SimilarImage {
  id: string;
  src: string;
  alt: string;
  date: string;
  publication: string;
  publisher: string;
  place_of_publication: string;
  caption: string;
}

export interface Cluster {
  id: string;
  title: string;
  description: string;
  similarImages: SimilarImage[];
  alternatePublications: SimilarImage[];
}