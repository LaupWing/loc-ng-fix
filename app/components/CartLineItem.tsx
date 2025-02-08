import type { CartLineUpdateInput } from "@shopify/hydrogen/storefront-api-types"
import type { CartLayout } from "~/components/CartMain"
import { CartForm, Image, type OptimisticCartLine } from "@shopify/hydrogen"
import { useVariantUrl } from "~/lib/variants"
import { Link } from "@remix-run/react"
import { ProductPrice } from "./ProductPrice"
import { useAside } from "./Aside"
import type { CartApiQueryFragment } from "storefrontapi.generated"
import { ChevronLeft, ChevronRight } from "lucide-react"

type CartLine = OptimisticCartLine<CartApiQueryFragment>

/**
 * A single line item in the cart. It displays the product image, title, price.
 * It also provides controls to update the quantity or remove the line item.
 */
export function CartLineItem({
    layout,
    line,
}: {
    layout: CartLayout
    line: CartLine
}) {
    const { id, merchandise } = line
    const { product, title, image, selectedOptions } = merchandise
    const lineItemUrl = useVariantUrl(product.handle, selectedOptions)
    const { close } = useAside()

    return (
        <li key={id} className="flex gap-4 items-center">
            {image && (
                <Image
                    className="rounded-lg w-20 md:w-32"
                    alt={title}
                    aspectRatio="1/1"
                    data={image}
                    height={100}
                    loading="lazy"
                    width={100}
                />
            )}

            <div className="grid gap-2">
                <Link
                    prefetch="intent"
                    to={lineItemUrl}
                    onClick={() => {
                        if (layout === "aside") {
                            close()
                        }
                    }}
                >
                    <p className="md:text-lg font-semibold">{product.title}</p>
                </Link>
                <small className="text-sm">
                    <ProductPrice price={line?.cost?.totalAmount} />
                </small>
            </div>
            <CartLineQuantity line={line} />
            {/* <div>
                <Link
                    prefetch="intent"
                    to={lineItemUrl}
                    onClick={() => {
                        if (layout === "aside") {
                            close()
                        }
                    }}
                >
                    <p>
                        <strong>{product.title}</strong>
                    </p>
                </Link>
                <ProductPrice price={line?.cost?.totalAmount} />
                <ul>
                    {selectedOptions.map((option) => (
                        <li key={option.name}>
                            <small>
                                {option.name}: {option.value}
                            </small>
                        </li>
                    ))}
                </ul>
                
            </div> */}
        </li>
    )
}

/**
 * Provides the controls to update the quantity of a line item in the cart.
 * These controls are disabled when the line item is new, and the server
 * hasn't yet responded that it was successfully added to the cart.
 */
function CartLineQuantity({ line }: { line: CartLine }) {
    if (!line || typeof line?.quantity === "undefined") return null
    const { id: lineId, quantity, isOptimistic } = line
    const prevQuantity = Number(Math.max(0, quantity - 1).toFixed(0))
    const nextQuantity = Number((quantity + 1).toFixed(0))

    return (
        <div className="flex flex-col items-center gap-2 ml-auto">
            <div className="flex items-center rounded-full bg-neutral-50 border-neutral-200 border">
                <CartLineUpdateButton
                    lines={[{ id: lineId, quantity: prevQuantity }]}
                >
                    <button
                        aria-label="Decrease quantity"
                        disabled={quantity <= 1 || !!isOptimistic}
                        name="decrease-quantity"
                        className="p-1 md:p-2 text-neutral-400/80"
                        value={prevQuantity}
                    >
                        <ChevronLeft />
                    </button>
                </CartLineUpdateButton>
                {quantity}
                <CartLineUpdateButton
                    lines={[{ id: lineId, quantity: nextQuantity }]}
                >
                    <button
                        aria-label="Increase quantity"
                        name="increase-quantity"
                        className="p-1 md:p-2 text-neutral-400/80"
                        value={nextQuantity}
                        disabled={!!isOptimistic}
                    >
                        <ChevronRight size={20} />
                    </button>
                </CartLineUpdateButton>
            </div>
            <CartLineRemoveButton
                lineIds={[lineId]}
                disabled={!!isOptimistic}
            />
        </div>
    )
}

/**
 * A button that removes a line item from the cart. It is disabled
 * when the line item is new, and the server hasn't yet responded
 * that it was successfully added to the cart.
 */
function CartLineRemoveButton({
    lineIds,
    disabled,
}: {
    lineIds: string[]
    disabled: boolean
}) {
    return (
        <CartForm
            route="/cart"
            action={CartForm.ACTIONS.LinesRemove}
            inputs={{ lineIds }}
        >
            <button
                className="md:text-xs text-[10px] text-neutral-500 uppercase underline tracking-wider"
                disabled={disabled}
                type="submit"
            >
                Remove
            </button>
        </CartForm>
    )
}

function CartLineUpdateButton({
    children,
    lines,
}: {
    children: React.ReactNode
    lines: CartLineUpdateInput[]
}) {
    return (
        <CartForm
            route="/cart"
            action={CartForm.ACTIONS.LinesUpdate}
            inputs={{ lines }}
        >
            {children}
        </CartForm>
    )
}
