import { defer, type LoaderFunctionArgs } from "@netlify/remix-runtime"
import { Link, useLoaderData, type MetaFunction } from "@remix-run/react"
import { getPaginationVariables, Image } from "@shopify/hydrogen"
import { ArticleItemFragment } from "storefrontapi.generated"
import { PaginatedResourceSection } from "~/components/PaginatedResourceSection"

export const meta: MetaFunction = () => {
    return [{ title: `Hydrogen | Articles` }]
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

    // return (
    //     <div className="articles">
    //         <h1>All Articles</h1>
    //         <div className="articles-grid">
    //             <PaginatedResourceSection connection={articles}>
    //                 {({ node: article }) => (
    //                     <Link
    //                         className="article"
    //                         key={article.handle}
    //                         prefetch="intent"
    //                         to={`/articles/${article.handle}`}
    //                     >
    //                         <h2>{article.title}</h2>
    //                     </Link>
    //                 )}
    //             </PaginatedResourceSection>
    //         </div>
    //     </div>
    // )
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
    return (
        <div className="blog-article" key={article.id}>
            <Link
                className="grid gap-2"
                to={`/blogs/${article.blog.handle}/${article.handle}`}
            >
                {article.image && (
                    <div className="rounded-xl overflow-hidden">
                        <Image
                            alt={article.image.altText || article.title}
                            aspectRatio="3/2"
                            className="w-full h-full object-cover"
                            data={article.image}
                            loading={loading}
                            sizes="(min-width: 768px) 50vw, 100vw"
                        />
                    </div>
                )}
                <small>{publishedAt}</small>
                <h3 className="text-2xl font-bold">{article.title}</h3>
                <div
                    className="line-clamp-4 text-sm"
                    dangerouslySetInnerHTML={{ __html: article.contentHtml! }}
                ></div>
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
