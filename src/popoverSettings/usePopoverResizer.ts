import OBR from "@owlbear-rodeo/sdk";
import { useEffect, useState } from "react";

export function usePopoverResizer(
    id: string,
    minHeight: number,
    maxHeight: number,
    minWidth: number,
    maxWidth: number,
): (node: HTMLElement | null) => void {
    const [container, setContainer] = useState<HTMLElement | null>(null);
    useEffect(() => {
        if (!container) {
            return;
        }

        const observer = new ResizeObserver(async (entries) => {
            if (entries.length === 0) {
                return;
            }
            const box = entries[0]?.borderBoxSize?.[0];

            if (!box) {
                return;
            }

            const height = Math.min(
                maxHeight,
                Math.max(minHeight, box.blockSize),
            );

            const width = Math.min(
                maxWidth,
                Math.max(minWidth, box.inlineSize),
            );

            await Promise.all([
                OBR.popover.setHeight(id, height),
                OBR.popover.setWidth(id, width),
            ]);
        });

        observer.observe(container);
        return () => {
            observer.disconnect();
        };
    }, [id, container, minHeight, maxHeight, minWidth, maxWidth]);
    return setContainer;
}
