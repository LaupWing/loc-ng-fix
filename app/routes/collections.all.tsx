import { defer, type LoaderFunctionArgs } from "@netlify/remix-runtime"
import { useLoaderData, Link, type MetaFunction } from "@remix-run/react"
import { getPaginationVariables, Image, Money } from "@shopify/hydrogen"
import type { ProductItemFragment } from "storefrontapi.generated"
import { useVariantUrl } from "~/lib/variants"
// import { PaginatedResourceSection } from "~/components/PaginatedResourceSection"

export const meta: MetaFunction<typeof loader> = () => {
    return [{ title: `Loc-Ng | Products` }]
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
async function loadCriticalData({ context, request }: LoaderFunctionArgs) {
    const { storefront } = context
    const paginationVariables = getPaginationVariables(request, {
        pageBy: 8,
    })

    const [{ products }] = await Promise.all([
        storefront.query(CATALOG_QUERY, {
            variables: { ...paginationVariables },
        }),
        // Add other queries here, so that they are loaded in parallel
    ])
    return { products }
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({ context }: LoaderFunctionArgs) {
    return {}
}

export default function Collection() {
    const { products } = useLoaderData<typeof loader>()

    return (
        <div className="bg-white pb-16">
            <div className="relative flex items-center justify-center flex-col rounded-t-3xl overflow-hidden">
                <div className="absolute inset-0 z-10 bg-black/60 md:bg-black/40"></div>
                <div className="absolute mt-20 grid w-full custom-container z-20">
                    <p className="text-lg font-semibold tracking-wider uppercase text-yellow-400 md:text-yellow-200">
                        Do what works and
                    </p>
                    <h2 className="text-white font-bold uppercase text-3xl md:text-5xl">
                        Become the best version
                    </h2>
                </div>
                <img
                    className="md:aspect-[16/7] object-[40%_75%] md:object-center aspect-[8/10] object-cover"
                    src="/banner.png"
                    alt=""
                />
            </div>
            <div className="custom-container grid grid-cols-1 md:grid-cols-3 gap-4 mt-10">
                {/* @ts-ignore */}
                {products.nodes.map((product) => (
                    <ProductItem key={product.id} product={product} />
                ))}
            </div>
            {/* <PaginatedResourceSection
                connection={products}
                resourcesClassName="products-grid"
            >
                {({ node: product, index }) => (
                    <ProductItem
                        key={product.id}
                        product={product}
                        loading={index < 8 ? "eager" : undefined}
                    />
                )}
            </PaginatedResourceSection> */}
        </div>
    )
}

function ProductItem({
    product,
    loading,
}: {
    product: ProductItemFragment
    loading?: "eager" | "lazy"
}) {
    const variant = product.variants.nodes[0]
    const variantUrl = useVariantUrl(product.handle, variant.selectedOptions)
    return (
        <Link
            className="grid gap-2"
            key={product.id}
            prefetch="intent"
            to={variantUrl}
        >
            {product.featuredImage && (
                <Image
                    alt={product.featuredImage.altText || product.title}
                    aspectRatio="1/1"
                    className="rounded-xl overflow-hidden"
                    data={product.featuredImage}
                    loading={loading}
                    sizes="(min-width: 45em) 400px, 100vw"
                />
            )}
            <div className="flex justify-between">
                <h4 className="text-lg font-semibold text-neutral-900">
                    {product.title}
                </h4>
                <small className="text-base text-neutral-600">
                    <Money data={product.priceRange.minVariantPrice} />
                </small>
            </div>
        </Link>
    )
}

const PRODUCT_ITEM_FRAGMENT = `#graphql
    fragment MoneyProductItem on MoneyV2 {
        amount
        currencyCode
    }
    fragment ProductItem on Product {
        id
        handle
        title
        featuredImage {
            id
            altText
            url
            width
            height
        }
        priceRange {
            minVariantPrice {
                ...MoneyProductItem
            }
            maxVariantPrice {
                ...MoneyProductItem
            }
        }
        variants(first: 1) {
            nodes {
                selectedOptions {
                    name
                    value
                }
            }
        }
    }
` as const

// NOTE: https://shopify.dev/docs/api/storefront/2024-01/objects/product
const CATALOG_QUERY = `#graphql
    query Catalog(
        $country: CountryCode
        $language: LanguageCode
        $first: Int
        $last: Int
        $startCursor: String
        $endCursor: String
    ) @inContext(country: $country, language: $language) {
        products(first: $first, last: $last, before: $startCursor, after: $endCursor) {
            nodes {
                ...ProductItem
            }
            pageInfo {
                hasPreviousPage
                hasNextPage
                startCursor
                endCursor
            }
        }
    }
    ${PRODUCT_ITEM_FRAGMENT}
` as const
