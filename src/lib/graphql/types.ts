export interface WPFeaturedImage {
  node: {
    sourceUrl: string;
    altText?: string;
    mediaDetails?: { width?: number; height?: number };
  };
}

/** WPGraphQL: post.author.node */
export interface WPAuthor {
  node: {
    name: string;
    slug?: string;
    url?: string;
    avatar?: { url?: string };
  };
}

export interface WPCategory {
  slug: string;
  name: string;
  description?: string;
  count?: number;
}

export interface WPTag {
  slug: string;
  name: string;
  description?: string;
}

export interface WPPost {
  id: string;
  slug: string;
  title: string;
  content: string;
  excerpt: string;
  date: string;
  modified: string;
  featuredImage?: WPFeaturedImage;
  author?: WPAuthor;
  categories: {
    nodes: WPCategory[];
  };
  tags: {
    nodes: WPTag[];
  };
}

export interface WPPageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor?: string;
  endCursor?: string;
}

export interface PostsResponse {
  posts: {
    nodes: WPPost[];
    pageInfo: WPPageInfo;
  };
}

export interface PostBySlugResponse {
  post: WPPost | null;
}

export interface CategoriesResponse {
  categories: {
    nodes: WPCategory[];
  };
}

export interface CategoryBySlugResponse {
  category: WPCategory & {
    posts: {
      nodes: WPPost[];
      pageInfo: WPPageInfo;
    };
  } | null;
}

export interface TagsResponse {
  tags: {
    nodes: WPTag[];
  };
}

export interface TagBySlugResponse {
  tag: WPTag & {
    posts: {
      nodes: WPPost[];
      pageInfo: WPPageInfo;
    };
  } | null;
}
