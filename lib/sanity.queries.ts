export const articlesQuery = `*[_type == "article" && category == "article"] | order(publishedAt desc) {
  _id,
  title,
  slug,
  excerpt,
  publishedAt,
  category
}`;

export const documentationQuery = `*[_type == "article" && category == "documentation"] | order(publishedAt desc) {
  _id,
  title,
  slug,
  excerpt,
  publishedAt,
  category
}`;

export const articleBySlugQuery = `*[_type == "article" && slug.current == $slug][0] {
  _id,
  title,
  slug,
  body,
  excerpt,
  publishedAt,
  category,
  author
}`;

