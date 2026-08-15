export type ProductStatus =
  | "Live"
  | "Beta"
  | "Building"
  | "Free"
  | "Coming Soon"
  | "Archived";

export type ProductCategory =
  | "Apps"
  | "Skills"
  | "Agents"
  | "Templates"
  | "Resources";

export type Product = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  category: ProductCategory;
  status: ProductStatus;
  price: string;
  pricingType: string;
  featured: boolean;
  url: string;
};
