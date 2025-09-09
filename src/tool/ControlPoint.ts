import {
    buildBillboard,
    MathM,
    type ImageContent,
    type ImageGrid,
    type Item,
    type KeyFilter,
    type Vector2,
} from "@owlbear-rodeo/sdk";
import { matrixMultiply, type HasParameterizedMetadata } from "owlbear-utils";
import cp from "../../assets/cp.svg";
import { METADATA_KEY_CONTROL_POINT_INDEX } from "../constants";
import type { GradientTarget } from "./GradientTarget";

export type ControlPoint = Item &
    HasParameterizedMetadata<typeof METADATA_KEY_CONTROL_POINT_INDEX, number>;

export function buildControlPoint(
    target: GradientTarget,
    offset: Vector2,
    index: number,
) {
    const size = 512;
    const imageContent = {
        url: window.location.origin + cp,
        mime: "image/svg+xml",
        width: size,
        height: size,
    } satisfies ImageContent;
    const imageGrid = {
        dpi: size,
        offset: { x: size / 2, y: size / 2 },
    } satisfies ImageGrid;

    const transform = MathM.fromItem(target);
    return (
        buildBillboard(imageContent, imageGrid)
            .name("Gradient Control Point")
            .metadata({ [METADATA_KEY_CONTROL_POINT_INDEX]: index })
            .layer("CONTROL")
            .attachedTo(target.id)
            .position(matrixMultiply(transform, offset))
            .scale({ x: 0.3, y: 0.3 })
            .maxViewScale(1)
            .disableAttachmentBehavior(["COPY", "SCALE", "LOCKED"])
            .locked(true)
            // .disableHit(true)
            .build()
    );
}

export function isControlPoint(item: Item): item is ControlPoint {
    return typeof item.metadata[METADATA_KEY_CONTROL_POINT_INDEX] === "number";
}

export const KEY_FILTER_CONTROL_POINT: KeyFilter[] = [
    {
        key: ["metadata", METADATA_KEY_CONTROL_POINT_INDEX],
        operator: "!=",
        value: undefined,
    },
];

export const KEY_FILTER_NOT_CONTROL_POINT: KeyFilter[] = [
    {
        key: ["metadata", METADATA_KEY_CONTROL_POINT_INDEX],
        value: undefined,
    },
];
