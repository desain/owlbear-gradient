import {
    isCurve,
    isPath,
    isShape,
    type Curve,
    type Item,
    type KeyFilter,
    type Path,
    type Shape,
    type Vector2,
} from "@owlbear-rodeo/sdk";
import {
    isObject,
    type HasParameterizedMetadata,
    type RgbColor,
    type ZeroToOne,
} from "owlbear-utils";
import { METADATA_KEY_GRADIENT } from "../constants";

export type GradientShape = "LINEAR" | "RADIAL";
export const DEFAULT_GRADIENT_SHAPE: GradientShape = "RADIAL";

export type Pattern = "STRIPE" | "SIN" | "TRIANGLE_WAVE" | "HATCH" | "CHECKER";

export interface GradientStop {
    readonly color: RgbColor;
    readonly alpha: ZeroToOne;
    readonly left: ZeroToOne;
}

export interface GradientMetadata {
    readonly type: GradientShape;
    readonly pattern?: Pattern;
    readonly controlPointOffsets: [a: Vector2, b: Vector2];
    readonly stops: GradientStop[];
}

export type GradientTarget = (Shape | Curve | Path) &
    HasParameterizedMetadata<
        typeof METADATA_KEY_GRADIENT,
        GradientMetadata | undefined
    >;

export function isGradientTarget(item: Item): item is GradientTarget {
    return (
        (isShape(item) || isCurve(item) || isPath(item)) &&
        (item.metadata[METADATA_KEY_GRADIENT] === undefined ||
            isObject(item.metadata[METADATA_KEY_GRADIENT]))
    );
}

export const KEY_FILTER_GRADIENT_TARGET: KeyFilter[] = [
    {
        key: "type",
        value: "SHAPE",
        coordinator: "||",
    },
    {
        key: "type",
        value: "CURVE",
        coordinator: "||",
    },
    {
        key: "type",
        value: "PATH",
    },
];
