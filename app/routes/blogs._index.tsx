import { defer, type LoaderFunctionArgs } from "@netlify/remix-runtime"
import { Link, useLoaderData, type MetaFunction } from "@remix-run/react"
import { getPaginationVariables } from "@shopify/hydrogen"
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

    return (
        <div className="articles">
            <h1>All Articles</h1>
            <div className="articles-grid">
                <PaginatedResourceSection connection={articles}>
                    {({ node: article }) => (
                        <Link
                            className="article"
                            key={article.handle}
                            prefetch="intent"
                            to={`/articles/${article.handle}`}
                        >
                            <h2>{article.title}</h2>
                        </Link>
                    )}
                </PaginatedResourceSection>
            </div>
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
            title
            handle
            blog {
            title
            }
            seo {
            title
            description
            }
        }
        }
    }
` as const
