import { Grid, XAxis, YAxis } from "@reincharts/axes";
import { ChartCanvas, Pane } from "@reincharts/core";
import { generateBars } from "@reincharts/testing";
import { mountChart } from "@reincharts/testing/browser";
import * as React from "react";
import { page } from "vitest/browser";
import {
    AreaSeries,
    BaselineSeries,
    CandlestickSeries,
    ColumnsSeries,
    HLCAreaSeries,
    KagiSeries,
    LineBreakSeries,
    OHLCSeries,
    PointAndFigureSeries,
    RenkoSeries,
    VolumeCandlesSeries,
    VolumeProfileSeries,
    VolumeSeries,
} from "../src";
import { kagiLines, lineBreakBoxes, pointAndFigure, renkoBricks } from "./fixtures";

const bars = generateBars(120, { seed: 7 });
const size = { width: 560, height: 300 };

interface FrameProps {
    readonly data: readonly any[];
    readonly theme?: "light" | "dark";
    readonly children: React.ReactNode;
    readonly scales?: any;
    readonly fit?: boolean;
}

const Frame = ({ data, theme = "light", children, scales, fit }: FrameProps) => (
    <ChartCanvas
        data={data}
        theme={theme}
        ratio={1}
        timeZone="UTC"
        initialView={fit ? "fit" : undefined}
        rightOffset={fit ? 1 : undefined}
    >
        <Pane id="price" scales={scales}>
            <Grid />
            {children}
            <YAxis />
        </Pane>
        <XAxis />
    </ChartCanvas>
);

const shot = async (name: string, ui: React.ReactElement) => {
    const { host, unmount } = await mountChart(ui, size);
    await expect.element(page.elementLocator(host)).toMatchScreenshot(name);
    unmount();
};

const volumeScales = { volume: { margins: { top: 0.8, bottom: 0 } } };

describe("financial series (visual)", () => {
    it("hollow candles with a volume overlay on its own scale", () =>
        shot(
            "candles-hollow-volume",
            <Frame data={bars} scales={volumeScales}>
                <VolumeSeries scale="volume" />
                <CandlestickSeries hollow />
            </Frame>,
        ));

    it("candles with volume overlay (dark)", () =>
        shot(
            "candles-volume-dark",
            <Frame data={bars} scales={volumeScales} theme="dark">
                <VolumeSeries scale="volume" />
                <CandlestickSeries />
            </Frame>,
        ));

    it("OHLC bars", () =>
        shot(
            "ohlc",
            <Frame data={bars.slice(-60)}>
                <OHLCSeries />
            </Frame>,
        ));

    it("HLC bars", () =>
        shot(
            "hlc",
            <Frame data={bars.slice(-60)}>
                <OHLCSeries hlc />
            </Frame>,
        ));

    it("baseline", () =>
        shot(
            "baseline",
            <Frame data={bars}>
                <BaselineSeries base={100} />
            </Frame>,
        ));

    it("area", () =>
        shot(
            "area",
            <Frame data={bars}>
                <AreaSeries />
            </Frame>,
        ));

    it("HLC area", () =>
        shot(
            "hlc-area",
            <Frame data={bars.slice(-80)}>
                <HLCAreaSeries />
            </Frame>,
        ));

    it("columns", () =>
        shot(
            "columns",
            <Frame data={bars.slice(-80)}>
                <ColumnsSeries />
            </Frame>,
        ));

    it("volume candles", () =>
        shot(
            "volume-candles",
            <Frame data={bars.slice(-70)}>
                <VolumeCandlesSeries mode="both" />
            </Frame>,
        ));

    it("volume profile", () =>
        shot(
            "volume-profile",
            <Frame data={bars}>
                <VolumeProfileSeries />
                <CandlestickSeries />
            </Frame>,
        ));

    it("renko", () =>
        shot(
            "renko",
            <Frame data={renkoBricks()}>
                <RenkoSeries />
            </Frame>,
        ));

    it("line break", () =>
        shot(
            "line-break",
            <Frame data={lineBreakBoxes()} fit>
                <LineBreakSeries />
            </Frame>,
        ));

    it("kagi", () =>
        shot(
            "kagi",
            <Frame data={kagiLines(260, 12)} fit>
                <KagiSeries />
            </Frame>,
        ));

    it("point & figure", () =>
        shot(
            "point-and-figure",
            <Frame data={pointAndFigure()} fit>
                <PointAndFigureSeries />
            </Frame>,
        ));
});
