import { Box } from "@mui/material";
import OBR, { type Metadata } from "@owlbear-rodeo/sdk";
import { DO_NOTHING } from "owlbear-utils";
import { useEffect, useRef, useState } from "react";
import ColorPicker, { useColorPicker } from "react-best-gradient-color-picker";
import {
    ID_POPOVER_SETTINGS,
    ID_TOOL_DRAWING,
    METADATA_KEY_GRADIENT,
} from "../constants";
import type { GradientShape, GradientStop } from "../tool/GradientTarget";
import type { ToolMetadata } from "../tool/ToolMetadata";
import { usePopoverResizer } from "./usePopoverResizer";

type GradientObject = ReturnType<
    ReturnType<typeof useColorPicker>["getGradientObject"]
>;

interface GradientObjectColor {
    readonly value: string;
    readonly left: number;
}

function gradientObjectType(gradientObject: GradientObject): GradientShape {
    if (gradientObject?.gradientType === "linear-gradient") {
        return "LINEAR";
    } else {
        return "RADIAL";
    }
}

function gradientObjectAngle(
    gradientObject: GradientObject,
): number | undefined {
    const degrees = gradientObject?.degrees;
    if (degrees) {
        const match = /\d+/.exec(degrees);
        if (match) {
            return Number(match[0]);
        }
    }
    return undefined;
}

function gradientObjectStops(gradientObject: GradientObject): GradientStop[] {
    if (!gradientObject?.isGradient) {
        return [];
    }
    return (gradientObject.colors as GradientObjectColor[]).map((c) => {
        const match =
            /^\s*rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)\s*$/.exec(
                c.value,
            );
        if (match?.[1] && match[2] && match[3] && match[4]) {
            return {
                color: {
                    x: Number(match[1]) / 255,
                    y: Number(match[2]) / 255,
                    z: Number(match[3]) / 255,
                },
                alpha: Number(match[4]),
                left: c.left / 100,
            };
        } else {
            throw Error(`Failed to parse color: ${c.value}`);
        }
    });
}

export function Settings() {
    const [loadedFromMetadata, setLoadedFromMetadata] = useState(false);
    const [gradientCss, setGradientCss] = useState(
        "linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(255,255,255,1) 100%)",
    );
    const { getGradientObject } = useColorPicker(gradientCss, setGradientCss);
    const box: React.RefObject<HTMLElement | null> = useRef(null);
    usePopoverResizer(ID_POPOVER_SETTINGS, 10, 1000, box);

    useEffect(() => {
        if (loadedFromMetadata) {
            const handler = setTimeout(() => {
                const gradientObject = getGradientObject(gradientCss);
                void OBR.tool.setMetadata(ID_TOOL_DRAWING, {
                    [METADATA_KEY_GRADIENT]: {
                        css: gradientCss,
                        type: gradientObjectType(gradientObject),
                        angle: gradientObjectAngle(gradientObject),
                        stops: gradientObjectStops(gradientObject),
                    } satisfies ToolMetadata,
                });
            }, 100);
            return () => clearTimeout(handler);
        } else {
            return DO_NOTHING;
        }
    }, [getGradientObject, gradientCss, loadedFromMetadata]);

    useEffect(() => {
        const setGradientFromMetadata = (md: Metadata | undefined) => {
            const gradient = md?.[METADATA_KEY_GRADIENT] as
                | ToolMetadata
                | undefined;
            if (gradient) {
                setGradientCss(gradient.css);
            }
        };
        void OBR.tool
            .getMetadata(ID_TOOL_DRAWING)
            .then(setGradientFromMetadata)
            .then(() => {
                setLoadedFromMetadata(true);
            });
    }, []);

    return (
        <Box ref={box} sx={{ p: 1 }}>
            <ColorPicker
                value={gradientCss}
                onChange={setGradientCss}
                hideEyeDrop
                hideColorTypeBtns
            />
        </Box>
    );
}
