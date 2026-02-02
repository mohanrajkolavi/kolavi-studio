export const GET_POSTS = `
  query GetPosts($first: Int!, $after: String) {
    posts(first: $first, after: $after, where: { status: PUBLISH }) {
      nodes {
        id
        slug
        title
        excerpt
        date
        featuredImage {
          node {
            sourceUrl
            altText
          }
        }
        categories {
          nodes {
            slug
            name
          }
        }
        author {
          node {
            name
            slug
            url
          }
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
`;

export const GET_POST_BY_SLUG = `
  query GetPostBySlug($slug: ID!) {
    post(id: $slug, idType: SLUG) {
      id
      slug
      title
      content
      excerpt
      date
      modified
      featuredImage {
        node {
          sourceUrl
          altText
          mediaDetails {
            width
            height
          }
        }
      }
      categories {
        nodes {
          slug
          name
        }
      }
      tags {
        nodes {
          slug
          name
        }
      }
      author {
        node {
          name
          slug
          url
        }
      }
    }
  }
`;

export const GET_CATEGORIES = `
  query GetCategories {
    categories(first: 100) {
      nodes {
        slug
        name
        description
        count
      }
    }
  }
`;

export const GET_CATEGORY_BY_SLUG = `
  query GetCategoryBySlug($slug: ID!, $first: Int!, $after: String) {
    category(id: $slug, idType: SLUG) {
      slug
      name
      description
      posts(first: $first, after: $after, where: { status: PUBLISH }) {
        nodes {
          id
          slug
          title
          excerpt
          date
          featuredImage {
            node {
              sourceUrl
              altText
            }
          }
          categories {
            nodes {
              slug
              name
            }
          }
          author {
            node {
              name
              slug
              url
            }
          }
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
          startCursor
          endCursor
        }
      }
    }
  }
`;

export const GET_TAGS = `
  query GetTags {
    tags(first: 100) {
      nodes {
        slug
        name
      }
    }
  }
`;

export const GET_TAG_BY_SLUG = `
  query GetTagBySlug($slug: ID!, $first: Int!, $after: String) {
    tag(id: $slug, idType: SLUG) {
      slug
      name
      posts(first: $first, after: $after, where: { status: PUBLISH }) {
        nodes {
          id
          slug
          title
          excerpt
          date
          featuredImage {
            node {
              sourceUrl
              altText
            }
          }
          categories {
            nodes {
              slug
              name
            }
          }
          author {
            node {
              name
              slug
              url
            }
          }
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
          startCursor
          endCursor
        }
      }
    }
  }
`;

export const GET_ALL_POST_SLUGS = `
  query GetAllPostSlugs {
    posts(first: 1000, where: { status: PUBLISH }) {
      nodes {
        slug
        modified
      }
    }
  }
`;

export const GET_ALL_CATEGORY_SLUGS = `
  query GetAllCategorySlugs {
    categories(first: 100) {
      nodes {
        slug
      }
    }
  }
`;

export const GET_ALL_TAG_SLUGS = `
  query GetAllTagSlugs {
    tags(first: 100) {
      nodes {
        slug
      }
    }
  }
`;
