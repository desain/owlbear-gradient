import {
    buildShape,
    MathM,
    type Item,
    type KeyFilter,
    type Vector2,
} from "@owlbear-rodeo/sdk";
import { matrixMultiply, type HasParameterizedMetadata } from "owlbear-utils";
import { METADATA_KEY_CONTROL_POINT_INDEX } from "../constants";
import type { GradientTarget } from "./GradientTarget";

export type ControlPoint = Item &
    HasParameterizedMetadata<typeof METADATA_KEY_CONTROL_POINT_INDEX, number>;

export function buildControlPoint(
    target: GradientTarget,
    offset: Vector2,
    index: number,
) {
    const transform = MathM.fromItem(target);
    return (
        buildShape()
            .name("Gradient Control Point")
            .shapeType("CIRCLE")
            .metadata({ [METADATA_KEY_CONTROL_POINT_INDEX]: index })
            .width(30)
            .height(30)
            .strokeColor("#3e4050")
            .strokeOpacity(1)
            .strokeWidth(10)
            .fillColor("#ffffff")
            .fillOpacity(1)
            .layer("CONTROL")
            .attachedTo(target.id)
            .position(matrixMultiply(transform, offset))
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
