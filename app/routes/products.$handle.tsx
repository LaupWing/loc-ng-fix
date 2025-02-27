import { Suspense, useEffect, useRef, useState } from "react"
import {
    defer,
    redirect,
    type LoaderFunctionArgs,
} from "@netlify/remix-runtime"
import { Await, useLoaderData, type MetaFunction } from "@remix-run/react"
import type { ProductFragment } from "storefrontapi.generated"
import {
    getSelectedProductOptions,
    Analytics,
    useOptimisticVariant,
    Image,
    Money,
} from "@shopify/hydrogen"
import type { SelectedOption } from "@shopify/hydrogen/storefront-api-types"
import { getVariantUrl } from "~/lib/variants"
import { ProductPrice } from "~/components/ProductPrice"
import { ProductImage } from "~/components/ProductImage"
import { ProductForm } from "~/components/ProductForm"
import { cn } from "~/lib/utils"
import { ChevronLeft, ChevronRight, Star } from "lucide-react"

import {
    Carousel,
    CarouselApi,
    CarouselContent,
    CarouselItem,
} from "~/components/ui/carousel"
import reviews from "~/lib/reviews"

export const meta: MetaFunction<typeof loader> = ({ data }) => {
    return [{ title: `Loc-Ng | ${data?.product.title ?? ""}` }]
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
async function loadCriticalData({
    context,
    params,
    request,
}: LoaderFunctionArgs) {
    const { handle } = params
    const { storefront } = context

    if (!handle) {
        throw new Error("Expected product handle to be defined")
    }

    const [{ product }] = await Promise.all([
        storefront.query(PRODUCT_QUERY, {
            variables: {
                handle,
                selectedOptions: getSelectedProductOptions(request),
            },
        }),
        // Add other queries here, so that they are loaded in parallel
    ])

    if (!product?.id) {
        throw new Response(null, { status: 404 })
    }

    const firstVariant = product.variants.nodes[0]
    const firstVariantIsDefault = Boolean(
        firstVariant.selectedOptions.find(
            (option: SelectedOption) =>
                option.name === "Title" && option.value === "Default Title"
        )
    )

    if (firstVariantIsDefault) {
        product.selectedVariant = firstVariant
    } else {
        // if no selected variant was returned from the selected options,
        // we redirect to the first variant's url with it's selected options applied
        if (!product.selectedVariant) {
            throw redirectToFirstVariant({ product, request })
        }
    }

    return {
        product,
    }
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({ context, params }: LoaderFunctionArgs) {
    // In order to show which variants are available in the UI, we need to query
    // all of them. But there might be a *lot*, so instead separate the variants
    // into it's own separate query that is deferred. So there's a brief moment
    // where variant options might show as available when they're not, but after
    // this deffered query resolves, the UI will update.
    const variants = context.storefront
        .query(VARIANTS_QUERY, {
            variables: { handle: params.handle! },
        })
        .catch((error) => {
            // Log query errors, but don't throw them so the page can still render
            console.error(error)
            return null
        })

    return {
        variants,
    }
}

function redirectToFirstVariant({
    product,
    request,
}: {
    product: ProductFragment
    request: Request
}) {
    const url = new URL(request.url)
    const firstVariant = product.variants.nodes[0]

    return redirect(
        getVariantUrl({
            pathname: url.pathname,
            handle: product.handle,
            selectedOptions: firstVariant.selectedOptions,
            searchParams: new URLSearchParams(url.search),
        }),
        {
            status: 302,
        }
    )
}

export default function Product() {
    const { product, variants } = useLoaderData<typeof loader>()
    const selectedVariant = useOptimisticVariant(
        product.selectedVariant,
        variants
    )
    const [currentSlide, setCurrentSlide] = useState(0)
    const [api, setApi] = useState<CarouselApi>()

    return (
        <div className="bg-white">
            <div className="custom-container grid items-start grid-cols-1 md:grid-cols-7 gap-14 pb-8">
                <div className="col-span-1 md:col-span-4 gap-2 items-start flex flex-col-reverse md:flex-row">
                    <div className="md:grid flex flex-shrink-0 gap-2">
                        {product!.images.nodes.map(
                            (image: any, index: number) => (
                                <button
                                    key={image.id}
                                    className={cn(
                                        "border-2 w-16 md:w-20 rounded-lg cursor-pointer",
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
                                </button>
                            )
                        )}
                    </div>
                    <div className="overflow-hidden relative w-full h-full flex">
                        <Carousel setApi={setApi} className="">
                            <CarouselContent className="-ml-0">
                                {product!.images.nodes.map((image: any) => (
                                    <CarouselItem
                                        key={image.id}
                                        className="w-full h-full pl-0"
                                    >
                                        <Image
                                            className="rounded-2xl flex-1"
                                            data={image}
                                            aspectRatio="1/1"
                                            sizes="(min-width: 45em) 20vw, 50vw"
                                        />
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                            {/* <CarouselContent className="w-full h-full -ml-0"></CarouselContent> */}
                        </Carousel>
                        {/* <Swiper
                            spaceBetween={50}
                            slidesPerView={1}
                            onSlideChange={(swiper) =>
                                setCurrentSlide(swiper.activeIndex)
                            }
                            onSwiper={(swiper) => {
                                // @ts-expect-error
                                sliderRef.current = swiper
                            }}
                        >
                            {product!.images.nodes.map((image: any) => (
                                <SwiperSlide
                                    key={image.id}
                                    className="w-full h-full"
                                >
                                    <Image
                                        className="rounded-2xl flex-1"
                                        data={image}
                                        aspectRatio="1/1"
                                        sizes="(min-width: 45em) 20vw, 50vw"
                                    />
                                </SwiperSlide>
                            ))}
                        </Swiper> */}
                    </div>
                </div>
                <div className="md:col-span-3 grid gap-4">
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
                            |{reviews["body-crafting-system"]["reviews"]}{" "}
                            Reviews
                        </p>
                    </div>
                    <h4 className="uppercase font-display font-bold text-3xl">
                        {product!.title}
                    </h4>
                    <div className="text-xl">
                        <Money data={selectedVariant.price} />
                    </div>
                    <div
                        id="article-content"
                        className="text-neutral-700 grid gap-2 text-sm md:text-base"
                        dangerouslySetInnerHTML={{
                            __html: product!.descriptionHtml,
                        }}
                    ></div>
                    <div className="flex my-4 rounded-full bg-emerald-100 mr-auto py-2.5 px-3">
                        <div className="w-3.5 h-3.5 border-2 border-emerald-200 bg-emerald-400 rounded-full animate-pulse" />
                        <p className="text-xs text-emerald-600 font-semibold ml-2">
                            Your world changes if you change.
                        </p>
                    </div>
                    <Suspense
                        fallback={
                            <ProductForm
                                product={product}
                                selectedVariant={selectedVariant}
                                variants={[]}
                            />
                        }
                    >
                        <Await
                            errorElement="There was a problem loading product variants"
                            resolve={variants}
                        >
                            {(data) => (
                                <ProductForm
                                    product={product}
                                    selectedVariant={selectedVariant}
                                    variants={
                                        data?.product?.variants.nodes || []
                                    }
                                />
                            )}
                        </Await>
                    </Suspense>
                </div>
                {/* <ProductImage image={selectedVariant?.image} />
                <div className="product-main">
                    <h1>{title}</h1>
                    <ProductPrice
                        price={selectedVariant?.price}
                        compareAtPrice={selectedVariant?.compareAtPrice}
                    />
                    <br />
                    <br />
                    <br />
                    <p>
                        <strong>Description</strong>
                    </p>
                    <br />
                    <div
                        dangerouslySetInnerHTML={{ __html: descriptionHtml }}
                    />
                    <br />
                </div> */}
            </div>
            <Analytics.ProductView
                data={{
                    products: [
                        {
                            id: product.id,
                            title: product.title,
                            price: selectedVariant?.price.amount || "0",
                            vendor: product.vendor,
                            variantId: selectedVariant?.id || "",
                            variantTitle: selectedVariant?.title || "",
                            quantity: 1,
                        },
                    ],
                }}
            />
        </div>
    )
}

const PRODUCT_VARIANT_FRAGMENT = `#graphql
        fragment ProductVariant on ProductVariant {
            availableForSale
            compareAtPrice {
                amount
                currencyCode
            }
            id
            image {
                __typename
                id
                url
                altText
                width
                height
            }
            price {
                amount
                currencyCode
            }
            product {
                title
                handle
            }
            selectedOptions {
                name
                value
            }
            sku
            title
            unitPrice {
                amount
                currencyCode
            }
        }
` as const

const PRODUCT_FRAGMENT = `#graphql
        fragment Product on Product {
            id
            title
            vendor
            handle
            descriptionHtml
            description
            options {
                name
                values
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
            selectedVariant: variantBySelectedOptions(selectedOptions: $selectedOptions, ignoreUnknownOptions: true, caseInsensitiveMatch: true) {
                ...ProductVariant
            }
            variants(first: 1) {
                nodes {
                ...ProductVariant
                }
            }
            seo {
                description
                title
            }
        }
    ${PRODUCT_VARIANT_FRAGMENT}
` as const

const PRODUCT_QUERY = `#graphql
    query Product(
        $country: CountryCode
        $handle: String!
        $language: LanguageCode
        $selectedOptions: [SelectedOptionInput!]!
    ) @inContext(country: $country, language: $language) {
        product(handle: $handle) {
            ...Product
        }
    }
    ${PRODUCT_FRAGMENT}
` as const

const PRODUCT_VARIANTS_FRAGMENT = `#graphql
    fragment ProductVariants on Product {
        variants(first: 250) {
            nodes {
            ...ProductVariant
            }
        }
    }
    ${PRODUCT_VARIANT_FRAGMENT}
` as const

const VARIANTS_QUERY = `#graphql
    ${PRODUCT_VARIANTS_FRAGMENT}
    query ProductVariants(
        $country: CountryCode
        $language: LanguageCode
        $handle: String!
    ) @inContext(country: $country, language: $language) {
        product(handle: $handle) {
            ...ProductVariants
        }
    }
` as const
