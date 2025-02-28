import { defer, type LoaderFunctionArgs } from "@netlify/remix-runtime"
import { Link, useLoaderData, type MetaFunction } from "@remix-run/react"
import { getPaginationVariables, Image } from "@shopify/hydrogen"
import { ArticleItemFragment } from "storefrontapi.generated"

export const meta: MetaFunction = () => {
    return [{ title: `Loc-Ng | Articles` }]
}

export async function loader(args: LoaderFunctionArgs) {
    const deferredData = loadDeferredData(args)
    const criticalData = await loadCriticalData(args)
    return defer({ ...deferredData, ...criticalData })
}

async function loadCriticalData({ context, request }: LoaderFunctionArgs) {
    const paginationVariables = getPaginationVariables(request, {
        pageBy: 10,
    })

    const [{ articles }] = await Promise.all([
        context.storefront.query(ARTICLES_QUERY, {
            variables: {
                ...paginationVariables,
            },
        }),
    ])

    return { articles }
}

function loadDeferredData({ context }: LoaderFunctionArgs) {
    return {}
}

export default function Articles() {
    const { articles } = useLoaderData<typeof loader>()

    return (
        <div className="bg-white md:pt-4 pb-16">
            <div className="custom-container flex items-start">
                <h2 className="text-neutral-800 mb-10 text-3xl md:text-5xl font-bold">
                    All Blogs
                    <div className="w-3/4 h-1 bg-yellow-400 mt-2 rounded-full" />
                </h2>
            </div>
            <div className="mx-auto mb-10 custom-container md:grid-cols-3 gap-10 grid">
                {articles.nodes.map((article: ArticleItemFragment) => (
                    <ArticleItem article={article} key={article.id} />
                ))}
                {/* <PaginatedResourceSection connection={articles}>
                    {({ node: article, index }) => (
                        <ArticleItem
                            article={article}
                            key={article.id}
                            loading={index < 2 ? "eager" : "lazy"}
                        />
                    )}
                </PaginatedResourceSection> */}
            </div>
        </div>
    )
}

function ArticleItem({
    article,
    loading,
}: {
    article: ArticleItemFragment
    loading?: HTMLImageElement["loading"]
}) {
    const publishedAt = new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    }).format(new Date(article.publishedAt!))
    const blogCategories = {
        coding: "bg-blue-500",
        "social-skills": "bg-emerald-500",
        fitness: "bg-yellow-500",
    }

    return (
        <div className="blog-article" key={article.id}>
            <Link
                className="grid gap-2"
                to={`/blogs/${article.blog.handle}/${article.handle}`}
            >
                {article.image && (
                    <div className="rounded-xl relative overflow-hidden">
                        <Image
                            alt={article.image.altText || article.title}
                            aspectRatio="3/2"
                            className="w-full h-full object-cover"
                            data={article.image}
                            loading={loading}
                            sizes="(min-width: 768px) 50vw, 100vw"
                        />
                        {article.blog.handle &&
                            blogCategories[
                                article.blog
                                    .handle as keyof typeof blogCategories
                            ] && (
                                <div
                                    className={`text-white absolute top-2 right-2 uppercase z-10 text-xs font-bold tracking-wide py-1 px-2 rounded-md ${
                                        // @ts-ignore
                                        blogCategories[article.blog.handle]
                                    }`}
                                >
                                    {article.blog.handle}
                                </div>
                            )}
                    </div>
                )}
                <small>{publishedAt}</small>
                <h3 className="text-2xl font-bold">{article.title}</h3>
                <div
                    className="line-clamp-4 text-sm"
                    dangerouslySetInnerHTML={{ __html: article.contentHtml! }}
                ></div>
                <small className="uppercase underline text-neutral-400">
                    Read more
                </small>
            </Link>
        </div>
    )
}

const ARTICLES_QUERY = `#graphql
    query Articles(
        $country: CountryCode
        $endCursor: String
        $first: Int
        $language: LanguageCode
        $last: Int
        $startCursor: String
    ) @inContext(country: $country, language: $language) {
        articles(
            first: $first,
            last: $last,
            before: $startCursor,
            after: $endCursor
            sortKey: PUBLISHED_AT
            reverse: true
        ) {
        pageInfo {
            hasNextPage
            hasPreviousPage
            startCursor
            endCursor
        }
        nodes {
            contentHtml
            handle
            id
            image {
                id
                altText
                url
                width
                height
            }
            publishedAt
            title
            handle
            blog {
                title
                handle
            }
            seo {
                title
                description
            }
        }
        }
    }
` as const
