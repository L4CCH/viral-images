import HomeClient from "@/components/home-client";
import { FilterProvider } from "@/contexts/filter-context";

export default function Home() {
  return (
    <FilterProvider>
      <HomeClient />
    </FilterProvider>
  );
}
