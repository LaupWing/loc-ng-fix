import { defer, type LoaderFunctionArgs } from "@netlify/remix-runtime"
import { Await, useLoaderData, Link, type MetaFunction } from "@remix-run/react"
import { Suspense, useEffect, useRef, useState } from "react"
import { Image, Money } from "@shopify/hydrogen"
import { AnimatePresence, motion } from "motion/react"
import type {
    ArticleItemFragment,
    FeaturedCollectionFragment,
    ProductDetailsFragment,
    RecommendedProductsQuery,
} from "storefrontapi.generated"
import { MoveLeft, MoveRight, Star } from "lucide-react"
import { cn } from "~/lib/utils"
import {
    Carousel,
    CarouselApi,
    CarouselContent,
    CarouselItem,
} from "~/components/ui/carousel"
import reviews from "~/lib/reviews"

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
    const [{ articles }, { collections }, { product }] = await Promise.all([
        context.storefront.query(ARTICLES_QUERY, {
            variables: {
                startCursor: null,
            },
        }),
        context.storefront.query(FEATURED_COLLECTION_QUERY),
        context.storefront.query(SPECIFIC_PRODUCT_QUERY),
        // Add other queries here, so that they are loaded in parallel
    ])
    return {
        featuredCollection: collections.nodes[0],
        articles: articles.nodes,
        specificProduct: product,
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
            {isClient && <FeaturedArticles articles={data.articles} />}
            <HeroText />
            {/* <FeaturedCollection collection={data.featuredCollection} /> */}
            <FeaturedProduct
                product={data.specificProduct as ProductDetailsFragment}
            />
            <RecommendedProducts products={data.recommendedProducts} />
        </div>
    )
}

// function FeaturedCollection({
//     collection,
// }: {
//     collection: FeaturedCollectionFragment
// }) {
//     if (!collection) return null
//     const image = collection?.image
//     return (
//         <Link
//             className="featured-collection"
//             to={`/collections/${collection.handle}`}
//         >
//             {image && (
//                 <div className="featured-collection-image">
//                     <Image data={image} sizes="100vw" />
//                 </div>
//             )}
//             <h1>{collection.title}</h1>
//         </Link>
//     )
// }

function HeroText() {
    return (
        <div className="flex items-start bg-white">
            <div className="custom-container flex flex-col md:flex-row items-start justify-between py-12">
                <div className="md:grid md:mb-0 mb-4 flex gap-2 leading-8 text-3xl md:text-4xl uppercase font-bold tracking-tighter md:gap-1">
                    <div className="grid md:gap-1">
                        <h3>Build, Rise</h3>
                        <div className="w-24 h-1 bg-yellow-400 rounded-full" />
                    </div>
                    <h3>Improve</h3>
                </div>
                <div className="text-neutral-700 grid gap-4 text-base max-w-xl">
                    <p>
                        Build your body, build your confidence. By improving
                        your body you will improve much more than what meets the
                        eye
                    </p>
                    <p>
                        Life is to short to not experience life being the best
                        you could be. People treat you with respect, you feel
                        better about yourself and you can do more things.
                    </p>
                </div>
            </div>
        </div>
    )
}

function RecommendedProducts({
    products,
}: {
    products: Promise<RecommendedProductsQuery | null>
}) {
    return (
        <div className="bg-white">
            <div className="custom-container py-8">
                <h2>Recommended Products</h2>
                <Suspense fallback={<div>Loading...</div>}>
                    <Await resolve={products}>
                        {(response) => (
                            <div className="grid md:grid-cols-4">
                                {response
                                    ? response.products.nodes.map((product) => (
                                          <Link
                                              key={product.id}
                                              className=""
                                              to={`/products/${product.handle}`}
                                          >
                                              <Image
                                                  data={product.images.nodes[0]}
                                                  aspectRatio="1/1"
                                                  className="rounded-xl"
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
        </div>
    )
}

function FeaturedArticles({ articles }: { articles: ArticleItemFragment[] }) {
    if (!articles) return null
    const [isClient, setIsClient] = useState(false)
    useEffect(() => setIsClient(true), [])

    const [api, setApi] = useState<CarouselApi>()
    const [currentSlide, setCurrentSlide] = useState(0)

    const publishedAt = new Date(
        articles[currentSlide].publishedAt
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
                    <Carousel setApi={setApi} className="w-full grid h-full">
                        <CarouselContent className="w-full h-full -ml-0">
                            {articles.map((article) => (
                                <CarouselItem
                                    key={article.id}
                                    className="relative w-full h-full pl-0"
                                >
                                    <Image
                                        key={article.id}
                                        data={article.image!}
                                        className="object-cover rounded-2xl object-center w-full h-full"
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
                                                key={articles[currentSlide].id}
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
                                                key={articles[currentSlide].id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -20 }}
                                                transition={{
                                                    duration: 0.3,
                                                    delay: 0.1,
                                                    ease: "easeOut",
                                                }}
                                                className="text-neutral-50 text-4xl md:text-5xl font-bold font-display"
                                            >
                                                {articles[currentSlide].title}
                                            </motion.h2>
                                        </AnimatePresence>
                                    )}
                                    {isClient && (
                                        <AnimatePresence mode="wait">
                                            <motion.div
                                                key={articles[currentSlide].id}
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
                                                    __html: articles[
                                                        currentSlide
                                                    ].contentHtml,
                                                }}
                                            ></motion.div>
                                        </AnimatePresence>
                                    )}
                                </div>
                                <Link
                                    to={`/blogs/${articles[currentSlide].blog.handle}/${articles[currentSlide].handle}`}
                                >
                                    <button className="w-48 text-center mt-4 md:mt-0 bg-yellow-300 font-bold text-sm uppercase py-3 rounded-full">
                                        Read More
                                    </button>
                                </Link>
                            </div>
                            <div className="text-white flex justify-between items-center pt-4">
                                <button
                                    className="cursor-pointer hover:text-yellow-400"
                                    onClick={previous}
                                >
                                    <MoveLeft />
                                </button>
                                <div className="flex gap-5 items-center">
                                    {articles.map((_, index) => (
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

function FeaturedProduct({ product }: { product: ProductDetailsFragment }) {
    const [currentSlide, setCurrentSlide] = useState(0)
    const [api, setApi] = useState<CarouselApi>()

    const [isClient, setIsClient] = useState(false)
    useEffect(() => setIsClient(true), [])

    return (
        <div className="bg-white">
            <div className="custom-container grid items-start grid-cols-1 md:grid-cols-7 gap-14 py-8">
                <div className="md:col-span-4 col-span-1 gap-2 items-start flex flex-col-reverse md:flex-row">
                    <div className="md:grid flex flex-shrink-0 gap-2">
                        {product!.images.nodes.map((image, index) => (
                            <div
                                key={image.id}
                                className={cn(
                                    "border-2 md:w-20 w-16 rounded-lg cursor-pointer",
                                    index === currentSlide
                                        ? "border-black"
                                        : "border-transparent hover:border-neutral-300"
                                )}
                                onClick={() => {
                                    if (api) {
                                        api.scrollTo(index)
                                    }
                                    setCurrentSlide(index)
                                }}
                            >
                                <Image
                                    className="rounded-lg"
                                    data={image}
                                    aspectRatio="1/1"
                                    sizes="(min-width: 45em) 20vw, 50vw"
                                />
                            </div>
                        ))}
                    </div>
                    <div className="overflow-hidden w-full h-full flex">
                        {isClient && (
                            <Carousel setApi={setApi} className="w-full h-full">
                                <CarouselContent className="w-full h-full">
                                    {product!.images.nodes.map((image) => (
                                        <CarouselItem
                                            key={image.id}
                                            className="relative w-full h-full"
                                        >
                                            <Link
                                                to={`/products/${
                                                    product!.handle
                                                }`}
                                            >
                                                <Image
                                                    className="rounded-2xl flex-1"
                                                    data={image}
                                                    aspectRatio="1/1"
                                                    sizes="(min-width: 45em) 20vw, 50vw"
                                                />
                                            </Link>
                                        </CarouselItem>
                                    ))}
                                </CarouselContent>
                            </Carousel>
                        )}
                    </div>
                </div>
                <div className="w-full md:col-span-3 grid gap-4">
                    <div className="flex gap-2 items-center">
                        <div className="flex">
                            {[...Array(5)].map((_, index) => (
                                <Star
                                    key={index}
                                    className={cn(
                                        "fill-current text-yellow-400",
                                        index <
                                            reviews["body-crafting-system"][
                                                "stars"
                                            ]
                                            ? "text-yellow-400"
                                            : "text-neutral-300"
                                    )}
                                    size={18}
                                />
                            ))}
                        </div>
                        <p className="text-sm">
                            <b>
                                {reviews["body-crafting-system"]["avg_rating"]}
                            </b>{" "}
                            | {reviews["body-crafting-system"]["reviews"]}{" "}
                            Reviews
                        </p>
                    </div>
                    <h4 className="uppercase font-display font-bold text-3xl">
                        {product!.title}
                    </h4>
                    <div className="text-xl">
                        <Money data={product!.priceRange.minVariantPrice} />
                    </div>
                    <div
                        id="article-content"
                        className="text-neutral-700 grid gap-2 md:text-base text-sm"
                        dangerouslySetInnerHTML={{
                            __html: product!.descriptionHtml,
                        }}
                    ></div>
                    <div className="flex my-2 md:my-4 rounded-full bg-emerald-100 mr-auto py-2.5 px-3">
                        <div className="w-3.5 h-3.5 border-2 border-emerald-200 bg-emerald-400 rounded-full animate-pulse" />
                        <p className="text-xs text-emerald-600 font-semibold ml-2">
                            Your world changes if you change.
                        </p>
                    </div>
                    <Link
                        to={`/products/${product!.handle}`}
                        className="text-center w-full flex"
                    >
                        <button className="text-center bg-yellow-300 font-bold text-sm uppercase py-3 w-full rounded-full">
                            View Product
                        </button>
                    </Link>
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

const ARTICLES_QUERY = `#graphql
    query AllArticles(
    $language: LanguageCode
    $startCursor: String
    $first: Int = 10
) @inContext(language: $language) {
    articles(
        first: $first
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
                title
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
` as const

const SPECIFIC_PRODUCT_QUERY = `#graphql
    fragment ProductDetails on Product {
        id
        title
        handle
        descriptionHtml
        priceRange {
            minVariantPrice {
                amount
                currencyCode
            }
        }
        images(first: 3) {
            nodes {
                url(transform: { maxWidth: 2000, maxHeight: 2000, crop: CENTER })
                id
                altText
                width
                height
            }
        }
        variants(first: 1) {  # 👈 Fetch the only variant of this product
            nodes {
                id
                availableForSale
                price {
                    amount
                    currencyCode
                }
            }
        }
    }

    query SpecificProduct($country: CountryCode, $language: LanguageCode)
        @inContext(country: $country, language: $language) {
        product(handle: "body-crafting-system") {
            ...ProductDetails
        }
    }
` as const
