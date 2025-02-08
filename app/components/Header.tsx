import { Suspense } from "react"
import { Await, NavLink } from "@remix-run/react"
import { type CartViewPayload, useAnalytics } from "@shopify/hydrogen"
import type { HeaderQuery, CartApiQueryFragment } from "storefrontapi.generated"
import { useAside } from "~/components/Aside"
import { Facebook, Twitter, Youtube } from "lucide-react"

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
                        {/* <AnnouncementBar /> */}
                    </div>
                    <div className="hidden md:flex justify-end gap-4 text-xs">
                        <p>Chat With Me!</p>
                        <svg
                            className="w-4 text-white fill-current"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 448 512"
                        >
                            <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7 .9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" />
                        </svg>
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
