import OBR from "@owlbear-rodeo/sdk";
import { useEffect } from "react";

export function usePopoverResizer(
    id: string,
    baseHeight: number,
    maxHeight: number,
    container: React.RefObject<HTMLElement | null>,
) {
    useEffect(() => {
        if (!container.current) {
            return;
        }

        const observer = new ResizeObserver(async (entries) => {
            if (entries.length === 0) {
                return;
            }
            const entry = entries[0];

            if (!entry?.borderBoxSize) {
                return;
            }

            const height = Math.min(
                maxHeight,
                baseHeight + entry.borderBoxSize[0]!.blockSize,
            );

            await OBR.popover.setHeight(id, height);
        });

        observer.observe(container.current);
        return () => {
            observer.disconnect();
            void OBR.popover.setHeight(id, baseHeight);
        };
    }, [id, container, baseHeight, maxHeight]);
}
