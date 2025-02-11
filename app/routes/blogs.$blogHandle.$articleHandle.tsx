import { defer, type LoaderFunctionArgs } from "@netlify/remix-runtime"
import { useLoaderData, type MetaFunction } from "@remix-run/react"
import { Image } from "@shopify/hydrogen"

export const meta: MetaFunction<typeof loader> = ({ data }) => {
    return [{ title: `Hydrogen | ${data?.article.title ?? ""} article` }]
}

export async function loader(args: LoaderFunctionArgs) {
    // Start fetching non-critical data without blocking time to first byte
    const deferredData = loadDeferredData(args)

    // Await the critical data required to render initial state of the page
    const criticalData = await loadCriticalData(args)

    return defer({ ...deferredData, ...criticalData })
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 */
async function loadCriticalData({ context, params }: LoaderFunctionArgs) {
    const { blogHandle, articleHandle } = params

    if (!articleHandle || !blogHandle) {
        throw new Response("Not found", { status: 404 })
    }

    const [{ blog }] = await Promise.all([
        context.storefront.query(ARTICLE_QUERY, {
            variables: { blogHandle, articleHandle },
        }),
        // Add other queries here, so that they are loaded in parallel
    ])

    if (!blog?.articleByHandle) {
        throw new Response(null, { status: 404 })
    }

    const article = blog.articleByHandle

    return { article }
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({ context }: LoaderFunctionArgs) {
    return {}
}

export default function Article() {
    const { article } = useLoaderData<typeof loader>()
    const { title, image, contentHtml, author } = article

    const publishedDate = new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    }).format(new Date(article.publishedAt))

    return (
        <div className="bg-white items-center flex flex-col">
            <small className="mt-4 text-neutral-500">
                {publishedDate} &middot; {author?.name}
            </small>
            <h1 className="mx-auto text-center text-4xl md:text-5xl font-bold pt-2 pb-6">
                {title}
            </h1>

            <div className="rounded-2xl overflow-hidden">
                {image && (
                    <Image
                        className="custom-container overflow-hidden mt-4 object-cover"
                        data={image}
                        aspectRatio="16/9"
                        sizes="90vw"
                        loading="eager"
                    />
                )}
            </div>
            <div
                id="article-content"
                dangerouslySetInnerHTML={{ __html: contentHtml }}
                className="py-10 px-4 w-full max-w-5xl mx-auto grid gap-4"
            />
        </div>
    )
}

// NOTE: https://shopify.dev/docs/api/storefront/latest/objects/blog#field-blog-articlebyhandle
const ARTICLE_QUERY = `#graphql
    query Article(
      $articleHandle: String!
      $blogHandle: String!
      $country: CountryCode
      $language: LanguageCode
    ) @inContext(language: $language, country: $country) {
      blog(handle: $blogHandle) {
        articleByHandle(handle: $articleHandle) {
          title
          contentHtml
          publishedAt
          author: authorV2 {
            name
          }
          image {
            id
            altText
            url
            width
            height
          }
          seo {
            description
            title
          }
        }
      }
    }
` as const
