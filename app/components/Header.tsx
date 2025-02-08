import { Suspense } from "react"
import { Await, NavLink } from "@remix-run/react"
import { type CartViewPayload, useAnalytics } from "@shopify/hydrogen"
import type { HeaderQuery, CartApiQueryFragment } from "storefrontapi.generated"
import { useAside } from "~/components/Aside"
import { ArrowLeft, ArrowRight, Facebook, Twitter, Youtube } from "lucide-react"
import { Whatsapp } from "./logos/Whatsapp"

interface HeaderProps {
    header: HeaderQuery
    cart: Promise<CartApiQueryFragment | null>
    isLoggedIn: Promise<boolean>
    publicStoreDomain: string
}

type Viewport = "desktop" | "mobile"

export function Header({
    header,
    isLoggedIn,
    cart,
    publicStoreDomain,
}: HeaderProps) {
    const { shop, menu } = header
    return (
        <>
            <div className="flex items-center justify-center h-12 bg-black z-50">
                <div className="custom-container items-center text-white grid grid-cols-1 md:grid-cols-4">
                    <div className="hidden md:flex items-center gap-4">
                        <Twitter />
                        <Facebook />
                        <Youtube />
                    </div>
                    <div className="col-span-2">
                        <AnnouncementBar />
                    </div>
                    <div className="hidden md:flex justify-end gap-4 text-xs">
                        <p>Chat With Me!</p>
                        <Whatsapp />
                    </div>
                </div>
            </div>
            <header className="header">
                <NavLink prefetch="intent" to="/" style={activeLinkStyle} end>
                    <strong>{shop.name}</strong>
                </NavLink>
                <HeaderMenu
                    menu={menu}
                    viewport="desktop"
                    primaryDomainUrl={header.shop.primaryDomain.url}
                    publicStoreDomain={publicStoreDomain}
                />
                <HeaderCtas isLoggedIn={isLoggedIn} cart={cart} />
            </header>
        </>
    )
}

const AnnouncementBar = () => {
    return (
        <div className="flex items-center max-w-lg mx-auto justify-between gap-4 uppercase">
            <ArrowLeft size={18} />
            <p className="text-xs">Support me by buying products</p>
            <ArrowRight size={18} />
        </div>
    )
}

export function HeaderMenu({
    menu,
    primaryDomainUrl,
    viewport,
    publicStoreDomain,
}: {
    menu: HeaderProps["header"]["menu"]
    primaryDomainUrl: HeaderProps["header"]["shop"]["primaryDomain"]["url"]
    viewport: Viewport
    publicStoreDomain: HeaderProps["publicStoreDomain"]
}) {
    const className = `header-menu-${viewport}`
    const { close } = useAside()

    return (
        <nav className={className} role="navigation">
            {viewport === "mobile" && (
                <NavLink
                    end
                    onClick={close}
                    prefetch="intent"
                    style={activeLinkStyle}
                    to="/"
                >
                    Home
                </NavLink>
            )}
            {(menu || FALLBACK_HEADER_MENU).items.map((item) => {
                if (!item.url) return null

                // if the url is internal, we strip the domain
                const url =
                    item.url.includes("myshopify.com") ||
                    item.url.includes(publicStoreDomain) ||
                    item.url.includes(primaryDomainUrl)
                        ? new URL(item.url).pathname
                        : item.url
                return (
                    <NavLink
                        className="header-menu-item"
                        end
                        key={item.id}
                        onClick={close}
                        prefetch="intent"
                        style={activeLinkStyle}
                        to={url}
                    >
                        {item.title}
                    </NavLink>
                )
            })}
        </nav>
    )
}

function HeaderCtas({
    isLoggedIn,
    cart,
}: Pick<HeaderProps, "isLoggedIn" | "cart">) {
    return (
        <nav className="header-ctas" role="navigation">
            <HeaderMenuMobileToggle />
            <NavLink prefetch="intent" to="/account" style={activeLinkStyle}>
                <Suspense fallback="Sign in">
                    <Await resolve={isLoggedIn} errorElement="Sign in">
                        {(isLoggedIn) => (isLoggedIn ? "Account" : "Sign in")}
                    </Await>
                </Suspense>
            </NavLink>
            <SearchToggle />
            <CartToggle cart={cart} />
        </nav>
    )
}

function HeaderMenuMobileToggle() {
    const { open } = useAside()
    return (
        <button
            className="header-menu-mobile-toggle reset"
            onClick={() => open("mobile")}
        >
            <h3>☰</h3>
        </button>
    )
}

function SearchToggle() {
    const { open } = useAside()
    return (
        <button className="reset" onClick={() => open("search")}>
            Search
        </button>
    )
}

function CartBadge({ count }: { count: number | null }) {
    const { open } = useAside()
    const { publish, shop, cart, prevCart } = useAnalytics()

    return (
        <a
            href="/cart"
            onClick={(e) => {
                e.preventDefault()
                open("cart")
                publish("cart_viewed", {
                    cart,
                    prevCart,
                    shop,
                    url: window.location.href || "",
                } as CartViewPayload)
            }}
        >
            Cart {count === null ? <span>&nbsp;</span> : count}
        </a>
    )
}

function CartToggle({ cart }: Pick<HeaderProps, "cart">) {
    return (
        <Suspense fallback={<CartBadge count={null} />}>
            <Await resolve={cart}>
                {(cart) => {
                    if (!cart) return <CartBadge count={0} />
                    return <CartBadge count={cart.totalQuantity || 0} />
                }}
            </Await>
        </Suspense>
    )
}

const FALLBACK_HEADER_MENU = {
    id: "gid://shopify/Menu/199655587896",
    items: [
        {
            id: "gid://shopify/MenuItem/461609500728",
            resourceId: null,
            tags: [],
            title: "Collections",
            type: "HTTP",
            url: "/collections",
            items: [],
        },
        {
            id: "gid://shopify/MenuItem/461609533496",
            resourceId: null,
            tags: [],
            title: "Blog",
            type: "HTTP",
            url: "/blogs/journal",
            items: [],
        },
        {
            id: "gid://shopify/MenuItem/461609566264",
            resourceId: null,
            tags: [],
            title: "Policies",
            type: "HTTP",
            url: "/policies",
            items: [],
        },
        {
            id: "gid://shopify/MenuItem/461609599032",
            resourceId: "gid://shopify/Page/92591030328",
            tags: [],
            title: "About",
            type: "PAGE",
            url: "/pages/about",
            items: [],
        },
    ],
}

function activeLinkStyle({
    isActive,
    isPending,
}: {
    isActive: boolean
    isPending: boolean
}) {
    return {
        fontWeight: isActive ? "bold" : undefined,
        color: isPending ? "grey" : "black",
    }
}
