import { Box, Stack, ToggleButton } from "@mui/material";
import type { Pattern } from "../tool/GradientTarget";
import type { ToolMetadata } from "../tool/ToolMetadata";
import { PatternPreview } from "./PatternPreview";

const PATTERNS: Pattern[] = [
    "STRIPE",
    "SIN",
    "TRIANGLE_WAVE",
    "HATCH",
    "CHECKER",
    "POLKA",
];

interface PatternSettingsProps {
    toolMetadata: ToolMetadata;
    onPatternChange: (pattern?: Pattern) => void;
    primaryColor: string;
    secondaryColor: string;
}

export function PatternSettings({
    toolMetadata,
    onPatternChange,
    primaryColor,
    secondaryColor,
}: PatternSettingsProps) {
    return (
        <Stack direction="column">
            <ToggleButton
                value="GRADIENT"
                aria-label="GRADIENT"
                selected={toolMetadata.pattern === undefined}
                onChange={() => onPatternChange(undefined)}
            >
                <Box
                    sx={{
                        width: 48,
                        height: 48,
                        background: toolMetadata.css,
                    }}
                />
            </ToggleButton>
            {PATTERNS.map((p) => (
                <ToggleButton
                    key={p}
                    value={p}
                    aria-label={p}
                    selected={toolMetadata.pattern === p}
                    onChange={() => onPatternChange(p)}
                >
                    <PatternPreview
                        pattern={p}
                        primaryColor={primaryColor}
                        secondaryColor={secondaryColor}
                    />
                </ToggleButton>
            ))}
        </Stack>
    );
}
