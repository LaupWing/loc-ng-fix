import { FC } from "react"
import Threads from "./logos/Threads"
import X from "./logos/X"
import Instagram from "./logos/Instagram"
import { cn } from "~/lib/utils"

export const SocialIcons: FC<{
    className?: string
}> = ({ className = "" }) => {
    return (
        <div className={cn("flex gap-4", className)}>
            <Threads className="fill-current w-6" />
            <X className="fill-current w-6" />
            <Instagram className="fill-current w-6" />
        </div>
    )
}
