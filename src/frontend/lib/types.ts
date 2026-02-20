export interface Dataset {
  id: string;
  about: {
    title: string;
    description: string;
    version: string;
  };
  dates: {
    start_date: string;  // YYYY-MM-DD format
    end_date: string;    // YYYY-MM-DD format
  };
  clusters: number;
  reprints: number;
  newspapers: number;
  publishers: number;
  columns: string;
}

export interface Cluster {
  id: string;
  dates: {
    start_date: string; // YYYY-MM-DD format
    end_date: string; // YYYY-MM-DD format
  };
  newspapers: string[];
  publishers: string[];
  thumbnail: string;
  images: string[];
}

export interface Image {
  id: string;
  date: string;
  newspaper: string;
  publisher: string;
  place?: string;
  ocr?: string;
  url: string;
  cluster_id: string;
}

export interface SearchParams {
  query?: string;
  start_date?: string; // YYYY-MM-DD format
  end_date?: string; // YYYY-MM-DD format
  newspaper_name?: string[];
  publisher?: string[];
  page?: number;
  limit?: number;
  offset?: number;
  order_by?: 'newspaper_count' | 'publisher_count' | 'image_count';
  order_direction?: 'asc' | 'desc';
}

export interface SearchFacets {
  newspapers: Record<string, number>;
  publishers: Record<string, number>;
}




