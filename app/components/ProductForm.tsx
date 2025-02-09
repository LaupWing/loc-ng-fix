import { FetcherWithComponents, Link } from "@remix-run/react"
import {
    CartForm,
    OptimisticCartLineInput,
    type VariantOption,
    VariantSelector,
} from "@shopify/hydrogen"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useState } from "react"
import type {
    ProductFragment,
    ProductVariantFragment,
} from "storefrontapi.generated"
// import { AddToCartButton } from "~/components/AddToCartButton"
import { useAside } from "~/components/Aside"

export function ProductForm({
    product,
    selectedVariant,
    variants,
}: {
    product: ProductFragment
    selectedVariant: ProductFragment["selectedVariant"]
    variants: Array<ProductVariantFragment>
}) {
    const { open } = useAside()
    const [quantity, setQuantity] = useState(1)

    return (
        <div className="grid gap-4 max-w-md mx-auto w-full">
            <VariantSelector
                handle={product.handle}
                options={product.options.filter(
                    (option) => option.values.length > 1
                )}
                variants={variants}
            >
                {({ option }) => (
                    <ProductOptions key={option.name} option={option} />
                )}
            </VariantSelector>
            <div className="flex items-center gap-4 bg-neutral-50/50 mr-auto border border-neutral-200 rounded-full p-2">
                <button
                    className="p-1.5 px-2 text-neutral-400"
                    onClick={() => {
                        if (quantity == 1) return
                        setQuantity(quantity - 1)
                    }}
                >
                    <ChevronLeft />
                </button>
                <div className="text-lg">{quantity}</div>
                <button
                    className="p-1.5 px-2 text-neutral-400"
                    onClick={() => {
                        setQuantity(quantity + 1)
                    }}
                >
                    <ChevronRight />
                </button>
            </div>
            <AddToCartButton
                disabled={!selectedVariant || !selectedVariant.availableForSale}
                onClick={() => {
                    open("cart")
                }}
                lines={
                    selectedVariant
                        ? [
                              {
                                  merchandiseId: selectedVariant.id,
                                  quantity: quantity,
                              },
                          ]
                        : []
                }
            >
                {selectedVariant?.availableForSale ? "Add to cart" : "Sold out"}
            </AddToCartButton>
        </div>
    )
}

function AddToCartButton({
    analytics,
    children,
    disabled,
    lines,
    onClick,
}: {
    analytics?: unknown
    children: React.ReactNode
    disabled?: boolean
    lines: Array<OptimisticCartLineInput>
    onClick?: () => void
}) {
    return (
        <CartForm
            route="/cart"
            inputs={{ lines }}
            action={CartForm.ACTIONS.LinesAdd}
        >
            {(fetcher: FetcherWithComponents<any>) => (
                <>
                    <input
                        name="analytics"
                        type="hidden"
                        value={JSON.stringify(analytics)}
                    />
                    <button
                        type="submit"
                        onClick={onClick}
                        disabled={disabled ?? fetcher.state !== "idle"}
                        className=" text-center bg-yellow-300 font-bold text-sm uppercase py-3 rounded-full w-full"
                    >
                        {children}
                    </button>
                </>
            )}
        </CartForm>
    )
}

function ProductOptions({ option }: { option: VariantOption }) {
    return (
        <div className="product-options" key={option.name}>
            <h5>{option.name}</h5>
            <div className="product-options-grid">
                {option.values.map(({ value, isAvailable, isActive, to }) => {
                    return (
                        <Link
                            className="product-options-item"
                            key={option.name + value}
                            prefetch="intent"
                            preventScrollReset
                            replace
                            to={to}
                            style={{
                                border: isActive
                                    ? "1px solid black"
                                    : "1px solid transparent",
                                opacity: isAvailable ? 1 : 0.3,
                            }}
                        >
                            {value}
                        </Link>
                    )
                })}
            </div>
            <br />
        </div>
    )
}
