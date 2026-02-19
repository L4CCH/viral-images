import { Cluster, Image, SearchParams, SearchFacets, Dataset } from "@/lib/types";
import { TimelineHistogram } from "@/components/home-search-timeline";

/**
 * API client for backend FastAPI service 
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_PATH ||
  (typeof window !== "undefined" ? "/api" : "http://localhost:8000/api");

/**
 * Fetch all clusters with optional filters
 */
export async function searchClusters(params: SearchParams = {}): Promise<Cluster[]> {
  const searchParams = new URLSearchParams();
  
  if (params.query) searchParams.append('query', params.query);
  if (params.start_date) searchParams.append('start_date', params.start_date);
  if (params.end_date) searchParams.append('end_date', params.end_date);
  if (params.newspaper_name) searchParams.append('newspaper_name', params.newspaper_name);
  if (params.publisher) searchParams.append('publisher', params.publisher);
  if (params.page) searchParams.append('page', params.page.toString());
  if (params.limit) searchParams.append('limit', params.limit.toString());
  if (params.order_by) searchParams.append('order_by', params.order_by);
  if (params.order_direction) searchParams.append('order_direction', params.order_direction);

  const url = `${API_BASE_URL}/search?${searchParams.toString()}`;
  console.log(`Fetching from: ${url}`);
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API error (${response.status}):`, errorText);
      throw new Error(`Failed to fetch clusters: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(`Failed to connect to backend at ${API_BASE_URL}. Is the backend running?`);
    }
    throw error;
  }
}

/**
 * Fetch a single cluster by ID
 */
export async function getCluster(clusterId: string): Promise<Cluster> {
  const url = `${API_BASE_URL}/cluster/${clusterId}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Cluster not found: ${clusterId}`);
    }
    throw new Error(`Failed to fetch cluster: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Fetch image metadata by image ID
 */
export async function getImage(imageId: string): Promise<Image> {
  const url = `${API_BASE_URL}/image/${encodeURIComponent(imageId)}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Image not found: ${imageId}`);
    }
    throw new Error(`Failed to fetch image: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Fetch multiple images by their IDs
 */
export async function getImages(imageIds: string[]): Promise<Image[]> {
  const promises = imageIds.map(id => getImage(id).catch(err => {
    console.error(`Failed to fetch image ${id}:`, err);
    return null;
  }));
  
  const results = await Promise.all(promises);
  return results.filter((img): img is Image => img !== null);
}

/**
 * Fetch search facets (newspapers and publishers) with cluster counts
 */
export async function getFacets(params: {
  start_date?: string; // YYYY-MM-DD format
  end_date?: string; // YYYY-MM-DD format
} = {}): Promise<SearchFacets> {
  const searchParams = new URLSearchParams();
  
  if (params.start_date) searchParams.append('start_date', params.start_date);
  if (params.end_date) searchParams.append('end_date', params.end_date);

  const url = `${API_BASE_URL}/search/facets${
    searchParams.toString() ? `?${searchParams.toString()}` : ""
  }`;
  console.log(`Fetching facets from: ${url}`);
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API error (${response.status}):`, errorText);
      throw new Error(`Failed to fetch facets: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(`Failed to connect to backend at ${API_BASE_URL}. Is the backend running?`);
    }
    throw error;
  }
}

/**
 * Fetch timeline histogram data (cluster counts per year)
 */
export async function getTimelineHistogram(params: {
  start_date?: string; // YYYY-MM-DD format
  end_date?: string; // YYYY-MM-DD format
} = {}): Promise<TimelineHistogram> {
  const searchParams = new URLSearchParams();
  
  if (params.start_date) searchParams.append('start_date', params.start_date);
  if (params.end_date) searchParams.append('end_date', params.end_date);

  const url = `${API_BASE_URL}/search/timeline${
    searchParams.toString() ? `?${searchParams.toString()}` : ""
  }`;
  console.log(`Fetching timeline histogram from: ${url}`);
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API error (${response.status}):`, errorText);
      throw new Error(`Failed to fetch timeline histogram: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(`Failed to connect to backend at ${API_BASE_URL}. Is the backend running?`);
    }
    throw error;
  }
}

/**
 * Fetch dataset metadata including date range
 */
export async function getDatasetMetadata(): Promise<Dataset> {
  const url = `${API_BASE_URL}/`;
  console.log(`Fetching dataset info from: ${url}`);
  
  try {
    const response = await fetch(url);  
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API error (${response.status}):`, errorText);
      throw new Error(`Failed to fetch metadata: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(`Failed to connect to backend at ${API_BASE_URL}. Is the backend running?`);
    }
    throw error;
  }
}

