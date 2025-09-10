import { BLACK_RGB, WHITE_RGB, zeroToOne } from "owlbear-utils";
import type { GradientShape, GradientStop, Pattern } from "./GradientTarget";

export interface ToolMetadata {
    readonly css: string;
    readonly type: GradientShape;
    readonly pattern?: Pattern;
    readonly angle?: number;
    readonly stops: GradientStop[];
}

export const DEFAULT_TOOL_METADATA: ToolMetadata = {
    css: "linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(255,255,255,1) 100%)",
    type: "LINEAR",
    stops: [
        {
            color: BLACK_RGB,
            alpha: zeroToOne(0),
            left: zeroToOne(0),
        },
        {
            color: WHITE_RGB,
            alpha: zeroToOne(1),
            left: zeroToOne(1),
        },
    ],
};
