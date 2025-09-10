import AutoAwesomeMotionIcon from "@mui/icons-material/AutoAwesomeMotion";
import { Paper, Stack, ToggleButton } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import { ThemeProvider } from "@mui/material/styles";
import OBR, { type Metadata, type Tool } from "@owlbear-rodeo/sdk";
import { produce } from "immer";
import {
    DO_NOTHING,
    getTheme,
    rgbToHex,
    WHITE_RGB,
    zeroToOne,
    type RgbColor,
} from "owlbear-utils";
import { useEffect, useState } from "react";
import ColorPicker, { useColorPicker } from "react-best-gradient-color-picker";
import {
    ID_POPOVER_SETTINGS,
    ID_TOOL_DRAWING,
    METADATA_KEY_GRADIENT,
} from "../constants";
import { type GradientStop, type Pattern } from "../tool/GradientTarget";
import { DEFAULT_TOOL_METADATA, type ToolMetadata } from "../tool/ToolMetadata";
import { PatternSettings } from "./PatternSettings";
import { usePopoverResizer } from "./usePopoverResizer";

type GradientObject = ReturnType<
    ReturnType<typeof useColorPicker>["getGradientObject"]
>;

interface GradientObjectColor {
    readonly value: string;
    readonly left: number;
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
                } as RgbColor,
                alpha: zeroToOne(Number(match[4])),
                left: zeroToOne(c.left / 100),
            };
        } else {
            throw Error(`Failed to parse color: ${c.value}`);
        }
    });
}

function useLoadToolMetadata<M>(id: Tool["id"], key: keyof Metadata) {
    const [loadedMetadata, setLoadedMetadata] = useState<M>();

    // Effect to load metadata from OBR
    useEffect(() => {
        void OBR.tool.getMetadata(id).then((md: Metadata | undefined) => {
            const data = md?.[key] as M | undefined;
            if (data) {
                setLoadedMetadata(data);
            }
        });
    }, [id, key]);
    return loadedMetadata;
}

function useSaveToolMetadata<M>(
    id: Tool["id"],
    key: keyof Metadata,
    metadata: M,
    enabled = true,
) {
    // Effect to write metadata to OBR
    useEffect(() => {
        // don't write until we've read first
        if (!enabled) {
            return DO_NOTHING;
        }

        // debounce
        const handler = setTimeout(() => {
            void OBR.tool.setMetadata(id, {
                [key]: metadata,
            });
        }, 100);
        return () => clearTimeout(handler);
    }, [enabled, id, key, metadata]);
}

function SettingsTabs() {
    const [toolMetadata, setToolMetadata] = useState<ToolMetadata>();
    const loadedToolMetadata = useLoadToolMetadata<ToolMetadata>(
        ID_TOOL_DRAWING,
        METADATA_KEY_GRADIENT,
    );
    useSaveToolMetadata(
        ID_TOOL_DRAWING,
        METADATA_KEY_GRADIENT,
        toolMetadata,
        !!loadedToolMetadata,
    );
    const [patternFlyoutOpen, setPatternFlyoutOpen] = useState(false);
    const [needsSetLinear, setNeedsSetLinear] = useState(false);

    // when we load the tool metadata, use it as our active tool metadata
    useEffect(() => {
        if (loadedToolMetadata) {
            setToolMetadata(loadedToolMetadata);
            if (loadedToolMetadata.pattern) {
                setPatternFlyoutOpen(true);
            }
        }
    }, [loadedToolMetadata]);
    const { getGradientObject, setLinear } = useColorPicker(
        toolMetadata?.css ?? DEFAULT_TOOL_METADATA.css,
        setGradientCss,
    );

    // effect to defer setting linear for a render cycle
    useEffect(() => {
        if (needsSetLinear) {
            setLinear();
            setNeedsSetLinear(false);
        }
    }, [needsSetLinear, setLinear]);

    function setGradientCss(css: string) {
        const gradientObject = getGradientObject(css);
        setToolMetadata(
            produce(toolMetadata, (draft) => {
                if (!draft) {
                    return;
                }
                draft.css = css;
                draft.type = css.startsWith("linear-gradient")
                    ? "LINEAR"
                    : "RADIAL";
                draft.angle = gradientObjectAngle(gradientObject);
                draft.stops = gradientObjectStops(gradientObject);
            }),
        );
    }

    function setPattern(pattern?: Pattern) {
        setToolMetadata(
            produce(toolMetadata, (draft) => {
                if (!draft) {
                    return;
                }
                draft.pattern = pattern;
            }),
        );
        setNeedsSetLinear(true);
    }

    const box = usePopoverResizer(ID_POPOVER_SETTINGS, 10, 1000, 0, 600);

    return (
        toolMetadata && (
            <Stack
                direction="row"
                gap={1}
                ref={box}
                sx={{ display: "inline-flex" }}
            >
                <ColorPicker
                    value={toolMetadata.css}
                    onChange={setGradientCss}
                    hideEyeDrop
                    hideColorTypeBtns
                />
                <ToggleButton
                    value="pattern"
                    selected={patternFlyoutOpen}
                    onChange={() => {
                        const newIsOpen = !patternFlyoutOpen;
                        setPatternFlyoutOpen(newIsOpen);
                    }}
                    aria-label="Toggle Pattern Settings"
                >
                    <AutoAwesomeMotionIcon />
                </ToggleButton>
                {patternFlyoutOpen && (
                    <Paper sx={{ p: 1 }}>
                        <PatternSettings
                            toolMetadata={toolMetadata}
                            onPatternChange={setPattern}
                            primaryColor={rgbToHex(
                                toolMetadata.stops[0]?.color ?? WHITE_RGB,
                            )}
                            secondaryColor={rgbToHex(
                                toolMetadata.stops[
                                    toolMetadata.stops.length - 1
                                ]?.color ?? WHITE_RGB,
                            )}
                        />
                    </Paper>
                )}
            </Stack>
        )
    );
}

export function Settings() {
    const [theme, setTheme] = useState<Theme>();

    useEffect(() => {
        void OBR.theme.getTheme().then((t) => setTheme(getTheme(t)));
        return OBR.theme.onChange((t) => setTheme(getTheme(t)));
    });

    return theme ? (
        <ThemeProvider theme={theme}>
            <SettingsTabs />
        </ThemeProvider>
    ) : null;
}
