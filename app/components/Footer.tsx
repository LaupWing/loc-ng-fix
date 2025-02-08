import { Suspense, useState } from "react"
import { Await, NavLink } from "@remix-run/react"
import type { FooterQuery, HeaderQuery } from "storefrontapi.generated"
import {
    ArrowRight,
    Banknote,
    BicepsFlexed,
    Loader2,
    ShieldCheck,
    Smartphone,
} from "lucide-react"
import { cn } from "~/lib/utils"
import Logo from "./logos/Logo"
import Threads from "./logos/Threads"
import X from "./logos/X"
import Instagram from "./logos/Instagram"
import { SocialIcons } from "./SocialIcons"
import { useToast } from "~/hooks/use-toast"

interface FooterProps {
    footer: Promise<FooterQuery | null>
    header: HeaderQuery
    publicStoreDomain: string
}

export function Footer({
    footer: footerPromise,
    header,
    publicStoreDomain,
}: FooterProps) {
    const NewsLetterInput = () => {
        const [focused, setFocused] = useState(false)
        const [loading, setLoading] = useState(false)
        const { toast } = useToast()
        const [email, setEmail] = useState("")
        const handleSubmit = async (e: React.FormEvent) => {
            e.preventDefault()
            setLoading(true)
            try {
                const response = await fetch("/subscribe", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email }),
                })

                await response.json()
                setEmail("")
                setLoading(false)
                toast({
                    title: "Subscribed!",
                    description:
                        "You have successfully subscribed to my newsletter",
                })
            } catch (error) {
                console.error(error)
                setLoading(false)
            }
        }
        return (
            <form
                onSubmit={handleSubmit}
                className={cn(
                    "p-2 px-4 relative items-center flex w-full md:w-auto rounded-full bg-neutral-700",
                    focused && "ring-2 ring-yellow-400"
                )}
            >
                <label
                    htmlFor="email"
                    className={cn(
                        focused || email
                            ? "top-0 text-yellow-400 text-sm"
                            : "top-1/2 transform -translate-y-1/2 text-base text-neutral-400",
                        "absolute pointer-events-none duration-300  left-6"
                    )}
                >
                    Fill in your email here
                </label>
                <input
                    id="email"
                    type="email"
                    value={email}
                    disabled={loading}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    className="p-1 focus:outline-none text-lg bg-neutral-700 w-full md:w-96"
                />
                <button
                    type="submit"
                    className="w-10 rounded-full flex items-center justify-center h-10 bg-yellow-400 text-neutral-700 flex-shrink-0"
                >
                    {loading ? (
                        <Loader2 className="animate-spin" />
                    ) : (
                        <ArrowRight />
                    )}
                </button>
            </form>
        )
    }

    const features = [
        {
            icon: BicepsFlexed,
            title: "Best version of yourself",
            description:
                "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Voluptatibus mollitia harum quidem doloremque",
        },
        {
            icon: Banknote,
            title: "Money Back",
            description:
                "100% Money Back Guarantee. If you're not satisfied, we're not satisfied",
        },
        {
            icon: Smartphone,
            title: "Customer Service",
            description:
                "I'm always here to help you. If you have any questions, please feel free to contact me!",
        },
        {
            icon: ShieldCheck,
            title: "Pay Safe",
            description:
                "Pay with the world's most popular and secure payment methods",
        },
    ]

    return (
        <Suspense>
            <div className="flex flex-col bg-neutral-950">
                <div className="flex flex-col bg-neutral-900 rounded-b-2xl overflow-hidden">
                    <div className="border-t rounded-b-3xl overflow-hidden bg-white">
                        <div className="my-16 md:divide-x md:divide-y-0 divide-y custom-container md:grid flex flex-col md:grid-cols-4">
                            {features.map(
                                ({ icon: Icon, title, description }, index) => (
                                    <div
                                        key={index}
                                        className="flex px-4 md:py-0 py-4 gap-4"
                                    >
                                        <Icon className="flex-shrink-0" />
                                        <div className="flex flex-col gap-0.5">
                                            <h3 className="md:text-lg text-neutral-800 font-bold">
                                                {title}
                                            </h3>
                                            <p className="md:text-sm text-xs text-neutral-600">
                                                {description}
                                            </p>
                                        </div>
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                    <div className="bg-neutral-900 overflow-hidden text-white py-16 text-sm text-center">
                        <div className="custom-container items-start flex md:flex-row flex-col-reverse gap-10 justify-between">
                            <div className="grid gap-2">
                                <Logo className="text-white w-40" />
                                <SocialIcons className="mt-4 text-white" />
                            </div>
                            <div className="flex flex-col items-start gap-3">
                                <h2 className="text-xl font-bold">
                                    Get the most out of your life
                                </h2>
                                <p className="text-base max-w-sm text-left mb-3">
                                    Join 7000+ other subscribers to become the
                                    strongest version mentally and physically
                                </p>
                                <NewsLetterInput />
                            </div>
                        </div>
                    </div>
                </div>
                <Await resolve={footerPromise}>
                    {(footer) => (
                        <footer className="bg-neutral-950 text-neutral-100 flex">
                            <div className="flex custom-container py-5">
                                <div className="flex flex-col gap-2">
                                    <p>
                                        © {new Date().getFullYear()}{" "}
                                        {header.shop.name}
                                    </p>
                                    {footer?.menu &&
                                        header.shop.primaryDomain?.url && (
                                            <FooterMenu
                                                menu={footer.menu}
                                                primaryDomainUrl={
                                                    header.shop.primaryDomain
                                                        .url
                                                }
                                                publicStoreDomain={
                                                    publicStoreDomain
                                                }
                                            />
                                        )}
                                </div>
                            </div>
                        </footer>
                    )}
                </Await>
            </div>
        </Suspense>
    )
}

function FooterMenu({
    menu,
    primaryDomainUrl,
    publicStoreDomain,
}: {
    menu: FooterQuery["menu"]
    primaryDomainUrl: FooterProps["header"]["shop"]["primaryDomain"]["url"]
    publicStoreDomain: string
}) {
    return (
        <nav className="flex text-xs gap-4" role="navigation">
            {(menu || FALLBACK_FOOTER_MENU).items.map((item) => {
                if (!item.url) return null
                // if the url is internal, we strip the domain
                const url =
                    item.url.includes("myshopify.com") ||
                    item.url.includes(publicStoreDomain) ||
                    item.url.includes(primaryDomainUrl)
                        ? new URL(item.url).pathname
                        : item.url
                const isExternal = !url.startsWith("/")
                return isExternal ? (
                    <a
                        href={url}
                        key={item.id}
                        rel="noopener noreferrer"
                        target="_blank"
                    >
                        {item.title}
                    </a>
                ) : (
                    <NavLink
                        end
                        key={item.id}
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

const FALLBACK_FOOTER_MENU = {
    id: "gid://shopify/Menu/199655620664",
    items: [
        {
            id: "gid://shopify/MenuItem/461633060920",
            resourceId: "gid://shopify/ShopPolicy/23358046264",
            tags: [],
            title: "Privacy Policy",
            type: "SHOP_POLICY",
            url: "/policies/privacy-policy",
            items: [],
        },
        {
            id: "gid://shopify/MenuItem/461633093688",
            resourceId: "gid://shopify/ShopPolicy/23358013496",
            tags: [],
            title: "Refund Policy",
            type: "SHOP_POLICY",
            url: "/policies/refund-policy",
            items: [],
        },
        {
            id: "gid://shopify/MenuItem/461633126456",
            resourceId: "gid://shopify/ShopPolicy/23358111800",
            tags: [],
            title: "Shipping Policy",
            type: "SHOP_POLICY",
            url: "/policies/shipping-policy",
            items: [],
        },
        {
            id: "gid://shopify/MenuItem/461633159224",
            resourceId: "gid://shopify/ShopPolicy/23358079032",
            tags: [],
            title: "Terms of Service",
            type: "SHOP_POLICY",
            url: "/policies/terms-of-service",
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
        color: isPending ? "grey" : "white",
    }
}
