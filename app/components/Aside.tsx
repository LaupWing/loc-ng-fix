import { createContext, type ReactNode, useContext, useState } from "react"
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
} from "./ui/drawer"
import { X } from "lucide-react"

type AsideType = "search" | "cart" | "mobile" | "closed"
type AsideContextValue = {
    type: AsideType
    open: (mode: AsideType) => void
    close: () => void
}

/**
 * A side bar component with Overlay
 * @example
 * ```jsx
 * <Aside type="search" heading="SEARCH">
 *  <input type="search" />
 *  ...
 * </Aside>
 * ```
 */
export function Aside({
    children,
    heading,
    type,
}: {
    children?: React.ReactNode
    type: AsideType
    heading: React.ReactNode
}) {
    const { type: activeType, close } = useAside()
    const expanded = type === activeType

    return (
        // <div
        //     aria-modal
        //     className={`overlay ${expanded ? "expanded" : ""}`}
        //     role="dialog"
        // >
        //     <button className="close-outside" onClick={close} />
        //     <aside>
        //         <header>
        //             <h3>{heading}</h3>
        //             <button className="close reset" onClick={close}>
        //                 &times;
        //             </button>
        //         </header>
        //         <main>{children}</main>
        //     </aside>
        // </div>
        <Drawer
            onOpenChange={(open) => {
                if (!open) {
                    close()
                }
            }}
            open={expanded}
        >
            <DrawerContent className="max-w-2xl mx-auto grid">
                <DrawerHeader className="flex items-center text-neutral-900 py-8 pt-4 px-6 border-b justify-between">
                    <DrawerTitle className="text-2xl md:text-3xl font-bold">
                        {heading}
                    </DrawerTitle>
                    <DrawerClose>
                        <button className="w-10 h-10 border border-neutral-200 text-neutral-500 rounded-full flex items-center justify-center">
                            <X size={18} />
                        </button>
                    </DrawerClose>
                </DrawerHeader>
                <main>{children}</main>
            </DrawerContent>
        </Drawer>
    )
}

const AsideContext = createContext<AsideContextValue | null>(null)

Aside.Provider = function AsideProvider({ children }: { children: ReactNode }) {
    const [type, setType] = useState<AsideType>("closed")

    return (
        <AsideContext.Provider
            value={{
                type,
                open: setType,
                close: () => setType("closed"),
            }}
        >
            {children}
        </AsideContext.Provider>
    )
}

export function useAside() {
    const aside = useContext(AsideContext)
    if (!aside) {
        throw new Error("useAside must be used within an AsideProvider")
    }
    return aside
}
