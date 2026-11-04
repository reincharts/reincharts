import { lightTheme, TimeFormatter } from "@reincharts/core";
import {
    builtinTools,
    constrainAngle,
    createGeometry,
    distToSegment,
    extendSegment,
    inPolygon,
    linearRegression,
    nearPolyline,
    type Drawing,
    type DrawingStyle,
    type Geometry,
    type ToolDefinition,
} from "../src";

// time t -> x = 10 t, price p -> y = 300 - 2 p, pane 600×300
const data = Array.from({ length: 60 }, (_, i) => ({ close: 50 + i }));
const engine: any = {
    logicalOfTime: (t: number) => t,
    timeOfLogical: (l: number) => l,
    xOfLogical: (l: number) => l * 10,
    logicalOfX: (x: number) => x / 10,
    barSpacing: 10,
    xType: "number",
    data,
    xs: Float64Array.from(data, (_, i) => i),
    sorted: true,
    categories: [],
    time: new TimeFormatter(),
    intraday: false,
    formatX: (_i: number, l: number) => String(l),
};
const scale: any = {
    toY: (p: number) => 300 - 2 * p,
    fromY: (y: number) => (300 - y) / 2,
    format: (p: number) => p.toFixed(2),
};

const tool = (type: string): ToolDefinition => builtinTools.find((t) => t.type === type)!;

const geo = (type: string, points: [number, number][], style: DrawingStyle = {}): Geometry => {
    const t = tool(type);
    const d: Drawing = {
        id: "x",
        type,
        pane: "main",
        points: points.map(([time, price]) => ({ time, price })),
        style: { ...t.defaults, ...style },
    };
    return createGeometry(d, { engine, scale, theme: lightTheme, width: 600, height: 300 });
};

const ctx = () => document.createElement("canvas").getContext("2d")!;

const draws = (type: string, points: [number, number][], style: DrawingStyle = {}) => {
    const c = ctx() as any;
    const g = geo(type, points, style);
    tool(type).draw(c, g, g.drawing, { selected: true, hovered: true, preview: false });
    return { calls: c.__getDrawCalls() as any[], events: c.__getEvents() as any[] };
};

const texts = (type: string, points: [number, number][], style: DrawingStyle = {}) =>
    draws(type, points, style)
        .events.filter((e) => e.type === "fillText")
        .map((e) => e.props.text as string);

const hit = (type: string, points: [number, number][], x: number, y: number, style: DrawingStyle = {}) =>
    tool(type).hitTest(geo(type, points, style), x, y);

describe("geometry helpers", () => {
    it("measures distance to segments and polylines", () => {
        expect(distToSegment({ x: 5, y: 5 }, { x: 0, y: 0 }, { x: 10, y: 0 })).toBe(5);
        expect(distToSegment({ x: -3, y: 4 }, { x: 0, y: 0 }, { x: 10, y: 0 })).toBe(5);
        expect(distToSegment({ x: 3, y: 4 }, { x: 0, y: 0 }, { x: 0, y: 0 })).toBe(5);
        expect(
            nearPolyline(5, 1, [
                { x: 0, y: 0 },
                { x: 10, y: 0 },
            ]),
        ).toBe(true);
        expect(
            nearPolyline(
                0,
                5,
                [
                    { x: 0, y: 0 },
                    { x: 10, y: 0 },
                    { x: 10, y: 10 },
                ],
                true,
            ),
        ).toBe(true);
        expect(nearPolyline(1, 1, [{ x: 0, y: 0 }])).toBe(true);
    });

    it("extends segments", () => {
        const a = { x: 0, y: 0 };
        const b = { x: 10, y: 10 };
        expect(extendSegment(a, b, "none", 100, 100)).toEqual([a, b]);
        const [s, e] = extendSegment(a, b, "right", 100, 100);
        expect(s).toEqual(a);
        expect(e.x).toBeGreaterThan(100);
        expect(e.x).toBeCloseTo(e.y);
        const [l] = extendSegment(a, b, "both", 100, 100);
        expect(l.x).toBeLessThan(-100);
        expect(extendSegment(a, a, "both", 100, 100)).toEqual([a, a]);
    });

    it("constrains angles to 45° steps", () => {
        expect(constrainAngle({ x: 0, y: 0 }, { x: 100, y: 10 })).toEqual({ x: 100, y: 0 });
        expect(constrainAngle({ x: 0, y: 0 }, { x: 5, y: 100 })).toEqual({ x: 0, y: 100 });
        const p = constrainAngle({ x: 0, y: 0 }, { x: 100, y: 90 });
        expect(p.x).toBeCloseTo(p.y);
    });

    it("fits a linear regression", () => {
        const r = linearRegression([0, 1, 2, 3], [1, 3, 5, 7]);
        expect(r.slope).toBeCloseTo(2);
        expect(r.intercept).toBeCloseTo(1);
        expect(r.stdDev).toBeCloseTo(0);
        const noisy = linearRegression([0, 1, 2, 3], [0, 2, 0, 2]);
        expect(noisy.stdDev).toBeGreaterThan(0);
        expect(noisy.maxDev).toBeGreaterThan(0);
        expect(linearRegression([], []).slope).toBe(0);
    });

    it("tests points in polygons", () => {
        const tri = [
            { x: 0, y: 0 },
            { x: 10, y: 0 },
            { x: 0, y: 10 },
        ];
        expect(inPolygon(2, 2, tri)).toBe(true);
        expect(inPolygon(9, 9, tri)).toBe(false);
    });

    it("converts drawing points to pixels", () => {
        const g = geo("trendLine", [
            [10, 100],
            [30, 120],
        ]);
        expect(g.points).toEqual([
            { x: 100, y: 100 },
            { x: 300, y: 60 },
        ]);
        expect(g.time(250)).toBe(25);
        expect(g.price(100)).toBeCloseTo(100);
        expect(g.value(3)).toBe(53);
        expect(g.value(-1)).toBeUndefined();
        expect(g.color).toBe(lightTheme.drawing.color);
        expect(g.formatTime(12)).toBe("12");
    });
});

describe("built-in tools", () => {
    const line: [number, number][] = [
        [10, 100],
        [30, 120],
    ]; // (100,100) → (300,60)

    it("registers ~30 tools with unique types, icons and groups", () => {
        const types = builtinTools.map((t) => t.type);
        expect(new Set(types).size).toBe(types.length);
        expect(types.length).toBeGreaterThanOrEqual(29);
        for (const t of builtinTools) {
            expect(t.icon).toBeTruthy();
            expect(["lines", "freehand", "fib", "shapes", "annotation", "measure"]).toContain(t.group);
        }
    });

    it("every tool draws without throwing (complete and partial points)", () => {
        for (const t of builtinTools) {
            const n = t.points === "multi" ? 4 : t.points;
            const pts = Array.from({ length: n }, (_, i): [number, number] => [10 + i * 7, 100 + (i % 2) * 15]);
            const built = t.build
                ? t.build(geo(t.type, pts).points).map((p): [number, number] => [p.x / 10, (300 - p.y) / 2])
                : pts;
            expect(draws(t.type, built).calls.length, t.type).toBeGreaterThan(0);
            if (n > 2) {
                expect(() => draws(t.type, pts.slice(0, n - 1)), t.type).not.toThrow();
            }
        }
    });

    it("trend line / ray / extended line hit tests respect extension", () => {
        expect(hit("trendLine", line, 200, 80)).toBe(true);
        expect(hit("trendLine", line, 200, 120)).toBe(false);
        expect(hit("trendLine", line, 400, 40)).toBe(false);
        expect(hit("ray", line, 400, 40)).toBe(true);
        expect(hit("ray", line, 0, 120)).toBe(false);
        expect(hit("extendedLine", line, 0, 120)).toBe(true);
        expect(hit("arrow", line, 200, 80)).toBe(true);
        expect(hit("infoLine", line, 200, 80)).toBe(true);
    });

    it("info line shows price change, bars and angle", () => {
        const labels = texts("infoLine", line);
        expect(labels[0]).toContain("(+20.00%)");
        expect(labels[1]).toBe("20 bars, 20");
        expect(labels[2]).toBe(`${((Math.atan2(40, 200) * 180) / Math.PI).toFixed(2)}°`);
    });

    it("horizontal / vertical / cross lines", () => {
        expect(hit("horizontalLine", [[10, 100]], 5, 102)).toBe(true);
        expect(hit("horizontalLine", [[10, 100]], 5, 120)).toBe(false);
        expect(hit("horizontalRay", [[10, 100]], 50, 100)).toBe(false);
        expect(hit("horizontalRay", [[10, 100]], 150, 100)).toBe(true);
        expect(hit("verticalLine", [[10, 100]], 102, 5)).toBe(true);
        expect(hit("verticalLine", [[10, 100]], 120, 100)).toBe(false);
        expect(hit("crossLine", [[10, 100]], 300, 100)).toBe(true);
        expect(hit("crossLine", [[10, 100]], 100, 250)).toBe(true);
        expect(hit("crossLine", [[10, 100]], 300, 250)).toBe(false);
        const d = geo("horizontalLine", [[10, 100]]).drawing;
        expect(tool("horizontalLine").axisLabels!(d)).toEqual({ prices: [100] });
        expect(tool("horizontalLine").axisLabels!({ ...d, style: { axisLabel: false } })).toEqual({});
        expect(tool("verticalLine").axisLabels!(d)).toEqual({ times: [10] });
        expect(tool("horizontalRay").crossValue!(d, 5, (t) => t)).toBeUndefined();
        expect(tool("horizontalRay").crossValue!(d, 15, (t) => t)).toBe(100);
        expect(texts("horizontalLine", [[10, 100]], { text: "Support" })).toEqual(["Support"]);
    });

    it("parallel channel builds, hits and drags its width", () => {
        const t = tool("parallelChannel");
        const g = geo("parallelChannel", line);
        const built = t.build!([...g.points, { x: 200, y: 120 }]);
        expect(built[2]).toEqual({ x: 100, y: 140 });
        const pts: [number, number][] = [...line, [10, 80]]; // third point 40px below
        const cg = geo("parallelChannel", pts);
        expect(t.handles!(cg)).toHaveLength(4);
        expect(t.hitTest(cg, 200, 120)).toBe(true);
        expect(t.hitTest(cg, 200, 100)).toBe(true); // middle line
        expect(t.hitTest(cg, 200, 200)).toBe(false);
        expect(t.dragHandle!(cg, 3, { x: 300, y: 120 })[2]).toEqual({ x: 100, y: 160 });
        expect(t.dragHandle!(cg, 0, { x: 110, y: 90 })).toEqual([
            { x: 110, y: 90 },
            { x: 300, y: 60 },
            { x: 110, y: 130 },
        ]);
        expect(t.dragHandle!(cg, 1, { x: 310, y: 50 })[2]).toEqual({ x: 100, y: 140 });
    });

    it("regression channel fits the source between the points", () => {
        const pts: [number, number][] = [
            [10, 0],
            [30, 0],
        ];
        const t = tool("regressionChannel");
        const g = geo("regressionChannel", pts);
        // close = 50 + i → exact fit, the handles sit on the regression line
        expect(t.handles!(g)).toEqual([
            { x: 100, y: 300 - 2 * 60 },
            { x: 300, y: 300 - 2 * 80 },
        ]);
        expect(t.hitTest(g, 200, 300 - 2 * 70)).toBe(true);
        expect(t.hitTest(g, 200, 20)).toBe(false);
        expect(t.dragHandle!(g, 1, { x: 350, y: 0 })).toEqual([g.points[0], { x: 350, y: g.points[1].y }]);
        // single bar: falls back to the points
        expect(
            t.handles!(
                geo("regressionChannel", [
                    [10, 70],
                    [10, 70],
                ]),
            )[0],
        ).toEqual({ x: 100, y: 160 });
    });

    it("pitchfork hits the median and tines", () => {
        const pts: [number, number][] = [
            [10, 75],
            [30, 100],
            [30, 50],
        ]; // a (100,150), b (300,100), c (300,200) → median horizontal at y=150
        expect(hit("pitchfork", pts, 450, 150)).toBe(true);
        expect(hit("pitchfork", pts, 450, 100)).toBe(true);
        expect(hit("pitchfork", pts, 450, 125)).toBe(false);
        expect(hit("pitchfork", pts.slice(0, 2), 200, 125)).toBe(true);
    });

    it("fib retracement levels, labels and extension", () => {
        expect(hit("fibRetracement", line, 200, 80)).toBe(true); // 0.5
        expect(hit("fibRetracement", line, 200, 150)).toBe(false);
        expect(hit("fibRetracement", line, 400, 80)).toBe(false);
        expect(hit("fibRetracement", line, 400, 80, { extend: "right" })).toBe(true);
        expect(texts("fibRetracement", line)).toContain("0.5 (110.00)");
        expect(texts("fibRetracement", line, { showLabels: false })).toEqual([]);
        const custom = texts("fibRetracement", line, { levels: [{ value: 0 }, { value: 1, visible: false }] });
        expect(custom).toEqual(["0 (120.00)"]);
    });

    it("fib extension projects from the third point", () => {
        const pts: [number, number][] = [
            [10, 100],
            [20, 120],
            [30, 110],
        ];
        // level 1 = 110 + 20 = 130 → y 40
        expect(hit("fibExtension", pts, 320, 40)).toBe(true);
        expect(hit("fibExtension", pts, 150, 80)).toBe(true); // dashed trend
        expect(hit("fibExtension", pts, 320, 120)).toBe(false);
        expect(texts("fibExtension", pts)).toContain("1 (130.00)");
    });

    it("gann fan rays", () => {
        expect(hit("gannFan", line, 200, 80)).toBe(true); // 1/1
        expect(hit("gannFan", line, 500, 20)).toBe(true); // 1/1 extended
        expect(hit("gannFan", line, 120, 200)).toBe(false);
        expect(texts("gannFan", line)).toEqual(["1/8", "1/4", "1/3", "1/2", "1/1", "2/1", "3/1", "4/1", "8/1"]);
    });

    it("rectangle, ellipse and triangle", () => {
        const t = tool("rectangle");
        const g = geo("rectangle", line);
        expect(t.hitTest(g, 200, 80)).toBe(true);
        expect(t.hitTest(g, 400, 80)).toBe(false);
        expect(t.handles!(g)).toHaveLength(8);
        expect(t.dragHandle!(g, 7, { x: 350, y: 0 })).toEqual([
            { x: 100, y: 100 },
            { x: 350, y: 60 },
        ]);
        expect(t.dragHandle!(g, 2, { x: 320, y: 50 })).toEqual([
            { x: 100, y: 50 },
            { x: 320, y: 60 },
        ]);
        expect(t.dragHandle!(g, 4, { x: 0, y: 90 })).toEqual([
            { x: 100, y: 90 },
            { x: 300, y: 60 },
        ]);
        expect(texts("rectangle", line, { text: "Zone" })).toEqual(["Zone"]);
        const e = tool("ellipse");
        const eg = geo("ellipse", line);
        expect(e.hitTest(eg, 200, 80)).toBe(true);
        expect(e.hitTest(eg, 110, 62)).toBe(false);
        expect(e.handles!(eg)).toHaveLength(4);
        expect(e.dragHandle!(eg, 0, { x: 0, y: 40 })).toEqual([
            { x: 100, y: 40 },
            { x: 300, y: 60 },
        ]);
        const tri: [number, number][] = [
            [10, 100],
            [30, 100],
            [20, 140],
        ];
        expect(hit("triangle", tri, 200, 80)).toBe(true);
        expect(hit("triangle", tri, 110, 30)).toBe(false);
    });

    it("path and brush", () => {
        const pts: [number, number][] = [
            [10, 100],
            [20, 120],
            [30, 100],
        ];
        expect(hit("path", pts, 150, 80)).toBe(true);
        expect(hit("path", pts, 200, 100)).toBe(false);
        expect(hit("brush", pts, 250, 80)).toBe(true);
        const g = geo("brush", pts);
        expect(tool("brush").handles!(g)).toHaveLength(2);
        expect(tool("brush").dragHandle!(g, 1, { x: 0, y: 0 })[2]).toEqual({ x: 0, y: 0 });
    });

    it("text, callout and price label", () => {
        expect(hit("text", [[10, 100]], 105, 105)).toBe(true);
        expect(hit("text", [[10, 100]], 50, 50)).toBe(false);
        expect(texts("text", [[10, 100]], { text: "a\nb" })).toEqual(["a", "b"]);
        expect(tool("text").handles!(geo("text", [[10, 100]]))).toEqual([]);
        const call: [number, number][] = [
            [10, 100],
            [30, 120],
        ];
        expect(hit("callout", call, 305, 65)).toBe(true);
        expect(hit("callout", call, 200, 250)).toBe(false);
        expect(tool("callout").textAnchor!(geo("callout", call))).toEqual({ x: 300, y: 60 });
        expect(texts("priceLabel", [[10, 100]])).toEqual(["100.00"]);
        expect(hit("priceLabel", [[10, 100]], 100, 100)).toBe(true);
        expect(hit("priceLabel", [[10, 100]], 105, 80)).toBe(true);
        expect(hit("priceLabel", [[10, 100]], 105, 150)).toBe(false);
    });

    it("price line with close button", () => {
        const t = tool("priceLine");
        const g = geo("priceLine", [[10, 100]]);
        expect(t.hitTest(g, 400, 101)).toBe(true);
        expect(t.hitTest(g, 20, 100)).toBe("body");
        const b = texts("priceLine", [[10, 100]]);
        expect(b).toEqual(["Alert"]);
        // the close button is the right end of the label box
        let x = 20;
        while (t.hitTest(g, x, 100) === "body") {
            x++;
        }
        expect(t.hitTest(g, x, 100)).toBe("remove");
        expect(t.crossValue!(g.drawing, 0, (v) => v)).toBe(100);
    });

    it("long / short position build, stats, handles", () => {
        const t = tool("longPosition");
        const g = geo("longPosition", line);
        const built = t.build!(g.points);
        expect(built).toHaveLength(3);
        expect(built[2].y).toBeCloseTo(100 + 40 / 1.5);
        const pts = built.map((p): [number, number] => [p.x / 10, (300 - p.y) / 2]);
        const pg = geo("longPosition", pts);
        expect(t.hitTest(pg, 200, 80)).toBe(true);
        expect(t.hitTest(pg, 200, 110)).toBe(true);
        expect(t.hitTest(pg, 200, 200)).toBe(false);
        expect(t.handles!(pg)).toHaveLength(4);
        const moved = t.dragHandle!(pg, 3, { x: 400, y: 0 });
        expect(moved[1].x).toBe(400);
        expect(moved[2].x).toBe(400);
        expect(t.dragHandle!(pg, 1, { x: 0, y: 40 })[1]).toEqual({ x: 300, y: 40 });
        expect(t.dragHandle!(pg, 2, { x: 0, y: 140 })[2]).toEqual({ x: 300, y: 140 });
        const labels = texts("longPosition", pts);
        expect(labels[0]).toContain("Target: 120.00 (+20.00%) 20.00");
        expect(labels[1]).toContain("Stop:");
        expect(labels[2]).toBe("Risk/Reward Ratio: 1.50");
        // degenerate click: default size
        const d = t.build!([g.points[0], g.points[0]]);
        expect(d[1].x - d[0].x).toBe(120);
        const short = tool("shortPosition").build!([g.points[0], g.points[0]]);
        expect(short[1].y).toBeGreaterThan(short[0].y);
    });

    it("measure tools", () => {
        expect(texts("priceRange", line)).toEqual(["20.00 (+20.00%)"]);
        expect(texts("dateRange", line)).toEqual(["20 bars, 20"]);
        expect(texts("dateAndPriceRange", line)).toEqual(["20.00 (+20.00%)", "20 bars, 20"]);
        expect(
            texts("priceRange", [
                [10, 120],
                [30, 100],
            ])[0],
        ).toContain("−20.00");
        expect(hit("dateAndPriceRange", line, 200, 80)).toBe(true);
        expect(hit("dateAndPriceRange", line, 200, 200)).toBe(false);
    });
});
