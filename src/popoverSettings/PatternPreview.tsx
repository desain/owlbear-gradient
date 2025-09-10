import { Box } from "@mui/material";
import type { Pattern } from "../tool/GradientTarget";

interface PatternPreviewProps {
    pattern: Pattern;
    primaryColor: string;
    secondaryColor: string;
    width?: number;
    height?: number;
}

export function PatternPreview({
    pattern,
    primaryColor,
    secondaryColor,
    width = 48,
    height = 48,
}: PatternPreviewProps) {
    const svgContent = () => {
        switch (pattern) {
            case "STRIPE":
                return (
                    <>
                        <rect
                            x="0"
                            y="0"
                            width={width}
                            height={height}
                            fill={secondaryColor}
                        />
                        <rect
                            x="0"
                            y={height * 0.1}
                            width={width}
                            height={height * 0.2}
                            fill={primaryColor}
                        />
                        <rect
                            x="0"
                            y={height * 0.4}
                            width={width}
                            height={height * 0.2}
                            fill={primaryColor}
                        />
                        <rect
                            x="0"
                            y={height * 0.7}
                            width={width}
                            height={height * 0.2}
                            fill={primaryColor}
                        />
                    </>
                );
            case "SIN":
                return (
                    <>
                        <rect
                            x="0"
                            y="0"
                            width={width}
                            height={height}
                            fill={primaryColor}
                        />
                        <path
                            d={`M 0 ${height / 2} C ${width / 4} 0, ${
                                (width * 3) / 4
                            } ${height}, ${width} ${
                                height / 2
                            } L ${width} 0 L 0 0 Z`}
                            fill={secondaryColor}
                        />
                    </>
                );
            case "TRIANGLE_WAVE":
                return (
                    <>
                        <rect
                            x="0"
                            y="0"
                            width={width}
                            height={height}
                            fill={primaryColor}
                        />
                        <path
                            d={`M 0 ${height / 2} L ${width / 4} ${
                                height * 0.25
                            } L ${(width * 3) / 4} ${
                                height * 0.75
                            } L ${width} ${height / 2} L ${width} 0 L 0 0 Z`}
                            fill={secondaryColor}
                        />
                    </>
                );
            case "HATCH": {
                const strokeWidth = width / 12;
                const d = `
                    M ${width / 4} 0 L ${width / 4} ${height}
                    M ${(width * 3) / 4} 0 L ${(width * 3) / 4} ${height}
                    M 0 ${height / 4} L ${width} ${height / 4}
                    M 0 ${(height * 3) / 4} L ${width} ${(height * 3) / 4}
                `;
                return (
                    <>
                        <rect
                            x="0"
                            y="0"
                            width={width}
                            height={height}
                            fill={secondaryColor}
                        />
                        <path
                            d={d}
                            stroke={primaryColor}
                            strokeWidth={strokeWidth}
                        />
                    </>
                );
            }
            case "CHECKER":
                return (
                    <>
                        <rect
                            x="0"
                            y="0"
                            width={width}
                            height={height}
                            fill={secondaryColor}
                        />
                        <rect
                            x="0"
                            y="0"
                            width={width / 2}
                            height={height / 2}
                            fill={primaryColor}
                        />
                        <rect
                            x={width / 2}
                            y={height / 2}
                            width={width / 2}
                            height={height / 2}
                            fill={primaryColor}
                        />
                    </>
                );
        }
    };

    return (
        <Box
            component="svg"
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            xmlns="http://www.w3.org/2000/svg"
        >
            {svgContent()}
        </Box>
    );
}
