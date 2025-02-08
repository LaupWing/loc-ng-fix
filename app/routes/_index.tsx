import { defer, type LoaderFunctionArgs } from "@netlify/remix-runtime"
import { Await, useLoaderData, Link, type MetaFunction } from "@remix-run/react"
import { Suspense, useEffect, useRef, useState } from "react"
import { Image, Money } from "@shopify/hydrogen"
import { AnimatePresence, motion } from "motion/react"
import Slider from "react-slick"
import type {
    ArticleItemFragment,
    FeaturedCollectionFragment,
    RecommendedProductsQuery,
} from "storefrontapi.generated"
import { MoveLeft, MoveRight } from "lucide-react"
import { cn } from "~/lib/utils"
import {
    Carousel,
    CarouselApi,
    CarouselContent,
    CarouselItem,
} from "~/components/ui/carousel"

export const meta: MetaFunction = () => {
    return [{ title: "Hydrogen | Home" }]
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
async function loadCriticalData({ context }: LoaderFunctionArgs) {
    const [{ blog }, { collections }] = await Promise.all([
        context.storefront.query(BLOGS_QUERY, {
            variables: {
                startCursor: null,
            },
        }),
        context.storefront.query(FEATURED_COLLECTION_QUERY),
        // Add other queries here, so that they are loaded in parallel
    ])

    return {
        featuredCollection: collections.nodes[0],
        blogs: blog!.articles.nodes,
    }
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({ context }: LoaderFunctionArgs) {
    const recommendedProducts = context.storefront
        .query(RECOMMENDED_PRODUCTS_QUERY)
        .catch((error) => {
            // Log query errors, but don't throw them so the page can still render
            console.error(error)
            return null
        })

    return {
        recommendedProducts,
    }
}

export default function Homepage() {
    const data = useLoaderData<typeof loader>()
    const [isClient, setIsClient] = useState(false)
    useEffect(() => setIsClient(true), [])
    return (
        <div className="home">
            {isClient && <FeaturedBlogs blogs={data.blogs} />}
            <FeaturedCollection collection={data.featuredCollection} />
            <RecommendedProducts products={data.recommendedProducts} />
        </div>
    )
}

function FeaturedCollection({
    collection,
}: {
    collection: FeaturedCollectionFragment
}) {
    if (!collection) return null
    const image = collection?.image
    return (
        <Link
            className="featured-collection"
            to={`/collections/${collection.handle}`}
        >
            {image && (
                <div className="featured-collection-image">
                    <Image data={image} sizes="100vw" />
                </div>
            )}
            <h1>{collection.title}</h1>
        </Link>
    )
}

function RecommendedProducts({
    products,
}: {
    products: Promise<RecommendedProductsQuery | null>
}) {
    return (
        <div className="recommended-products">
            <h2>Recommended Products</h2>
            <Suspense fallback={<div>Loading...</div>}>
                <Await resolve={products}>
                    {(response) => (
                        <div className="recommended-products-grid">
                            {response
                                ? response.products.nodes.map((product) => (
                                      <Link
                                          key={product.id}
                                          className="recommended-product"
                                          to={`/products/${product.handle}`}
                                      >
                                          <Image
                                              data={product.images.nodes[0]}
                                              aspectRatio="1/1"
                                              sizes="(min-width: 45em) 20vw, 50vw"
                                          />
                                          <h4>{product.title}</h4>
                                          <small>
                                              <Money
                                                  data={
                                                      product.priceRange
                                                          .minVariantPrice
                                                  }
                                              />
                                          </small>
                                      </Link>
                                  ))
                                : null}
                        </div>
                    )}
                </Await>
            </Suspense>
            <br />
        </div>
    )
}

function FeaturedBlogs({ blogs }: { blogs: ArticleItemFragment[] }) {
    if (!blogs) return null
    const [isClient, setIsClient] = useState(false)
    useEffect(() => setIsClient(true), [])

    const [api, setApi] = useState<CarouselApi>()
    const [currentSlide, setCurrentSlide] = useState(0)

    const publishedAt = new Date(
        blogs[currentSlide].publishedAt
    ).toLocaleDateString("en-GB")

    const next = () => {
        if (api) {
            api?.scrollNext()
        }
    }
    const previous = () => {
        if (api) {
            api.scrollPrev()
        }
    }
    useEffect(() => {
        if (!api) {
            return
        }
        setCurrentSlide(api.selectedScrollSnap())

        api.on("select", () => {
            setCurrentSlide(api.selectedScrollSnap())
        })
    }, [api])

    return (
        <div className="bg-white pb-4 flex">
            <div className="custom-container">
                <div className=" w-full flex-shrink-0 rounded-2xl relative aspect-[8/12] md:aspect-[16/8] overflow-hidden flex">
                    <div className="h-[80%] pointer-events-none absolute bottom-0 left-0 right-0 bg-gradient-to-b from-transparent to-black z-10"></div>
                    <Carousel setApi={setApi} className="w-full h-full">
                        <CarouselContent className="w-full h-full">
                            {blogs.map((blog) => (
                                <CarouselItem
                                    key={blog.id}
                                    className="relative w-full h-full"
                                >
                                    <Image
                                        key={blog.id}
                                        data={blog.image!}
                                        className="object-cover object-center w-full h-full"
                                        sizes="(min-width: 45em) 20vw, 50vw"
                                    />
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                    </Carousel>
                    <div className="absolute z-20 md:px-10 px-6 md:pb-16 pb-8 bottom-0 left-0 right-0">
                        <div className="flex flex-col">
                            <div className="flex md:flex-row flex-col justify-between pb-4 md:pb-8 border-b border-neutral-400 md:items-end">
                                <div className="flex pointer-events-none gap-2 flex-col max-w-lg">
                                    {isClient && (
                                        <AnimatePresence mode="wait">
                                            <motion.span
                                                key={blogs[currentSlide].id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -20 }}
                                                transition={{
                                                    duration: 0.3,
                                                    ease: "easeOut",
                                                }}
                                                className="text-sm text-neutral-50 font-bold"
                                            >
                                                {publishedAt}
                                            </motion.span>
                                        </AnimatePresence>
                                    )}
                                    {isClient && (
                                        <AnimatePresence mode="wait">
                                            <motion.h2
                                                key={blogs[currentSlide].id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -20 }}
                                                transition={{
                                                    duration: 0.3,
                                                    delay: 0.1,
                                                    ease: "easeOut",
                                                }}
                                                className="text-neutral-50 text-4xl md:text-6xl font-bold font-display"
                                            >
                                                {blogs[currentSlide].title}
                                            </motion.h2>
                                        </AnimatePresence>
                                    )}
                                    {isClient && (
                                        <AnimatePresence mode="wait">
                                            <motion.div
                                                key={blogs[currentSlide].id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -20 }}
                                                transition={{
                                                    duration: 0.3,
                                                    delay: 0.2,
                                                    ease: "easeOut",
                                                }}
                                                className="text-neutral-100 text-sm md:text-base line-clamp-2"
                                                dangerouslySetInnerHTML={{
                                                    __html: blogs[currentSlide]
                                                        .contentHtml,
                                                }}
                                            ></motion.div>
                                        </AnimatePresence>
                                    )}
                                </div>
                                <button className="w-48 text-center mt-4 md:mt-0 bg-yellow-300 font-bold text-sm uppercase py-3 rounded-full">
                                    Read More
                                </button>
                            </div>
                            <div className="text-white flex justify-between items-center pt-4">
                                <button
                                    className="cursor-pointer hover:text-yellow-400"
                                    onClick={previous}
                                >
                                    <MoveLeft />
                                </button>
                                <div className="flex gap-5 items-center">
                                    {blogs.map((_, index) => (
                                        <button
                                            key={index}
                                            className={cn(
                                                "border p-1 rounded-full",
                                                index === currentSlide
                                                    ? "border-white"
                                                    : "border-transparent"
                                            )}
                                        >
                                            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                        </button>
                                    ))}
                                </div>
                                <button
                                    className="cursor-pointer hover:text-yellow-400"
                                    onClick={next}
                                >
                                    <MoveRight />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

const FEATURED_COLLECTION_QUERY = `#graphql
    fragment FeaturedCollection on Collection {
        id
        title
        image {
            id
            url
            altText
            width
            height
        }
        handle
    }
    query FeaturedCollection($country: CountryCode, $language: LanguageCode)
        @inContext(country: $country, language: $language) {
        collections(first: 1, sortKey: UPDATED_AT, reverse: true) {
            nodes {
                ...FeaturedCollection
            }
        }
    }
` as const

const RECOMMENDED_PRODUCTS_QUERY = `#graphql
    fragment RecommendedProduct on Product {
        id
        title
        handle
        priceRange {
            minVariantPrice {
                amount
                currencyCode
            }
        }
        images(first: 1) {
            nodes {
                id
                url
                altText
                width
                height
            }
        }
    }
    query RecommendedProducts ($country: CountryCode, $language: LanguageCode)
        @inContext(country: $country, language: $language) {
        products(first: 4, sortKey: UPDATED_AT, reverse: true) {
            nodes {
                ...RecommendedProduct
            }
        }
    }
` as const

const BLOGS_QUERY = `#graphql
    query BlogIndex(
        $language: LanguageCode
        $startCursor: String
    ) @inContext(language: $language) {
        blog(handle: "all") {
            title
            seo {
                title
                description
            }
            articles(
                first: 3
                after: $startCursor
            ) {
                nodes {
                    author: authorV2 {
                        name
                    }
                    contentHtml
                    handle
                    id
                    image {
                        id
                        altText
                        url(transform: { maxWidth: 2000, maxHeight: 2000, crop: CENTER })
                        width
                        height
                    }
                    publishedAt
                    title
                    blog {
                        handle
                    }
                }
                pageInfo {
                    hasPreviousPage
                    hasNextPage
                    endCursor
                    startCursor
                }
            }
        }
    }
` as const
