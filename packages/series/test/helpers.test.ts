import { addColumn, addRow, barLeft, barWidth, groupLayout, pixelSpan, PathBatch } from "../src/geometry";
import { drawMarker, traceMarker, type MarkerShape } from "../src/marker";
import { linePoints, traceArea, tracePath } from "../src/path";
import { stack } from "../src/stack";
import { volumeProfile } from "../src/VolumeProfileSeries";

const recorder = () => {
    const calls: [string, ...number[]][] = [];
    const rec =
        (name: string) =>
        (...args: number[]) =>
            calls.push([name, ...args]);
    return {
        calls,
        path: {
            moveTo: rec("M"),
            lineTo: rec("L"),
            bezierCurveTo: rec("C"),
            closePath: rec("Z"),
            rect: rec("rect"),
            roundRect: rec("roundRect"),
            arc: rec("arc"),
        } as unknown as Path2D,
    };
};

describe("geometry", () => {
    it("computes integer bar widths", () => {
        expect(barWidth(10)).toBe(8);
        expect(barWidth(10, 0.5)).toBe(5);
        expect(barWidth(0.5)).toBe(1);
        expect(barWidth(100, 0.8, 30)).toBe(30);
    });

    it("aligns bars to pixels", () => {
        expect(barLeft(10, 4)).toBe(8);
        expect(barLeft(10.4, 5)).toBe(8);
        expect(pixelSpan(20.4, 10.6)).toEqual([11, 9]);
        expect(pixelSpan(5, 5)).toEqual([5, 1]);
    });

    it("adds columns and rows, rounding only the far end", () => {
        const { calls, path } = recorder();
        addColumn(path, 10, 6, 5, 50);
        addColumn(path, 10, 6, 5, 50, 3);
        addColumn(path, 10, 6, 80, 50, 3);
        addRow(path, 0, 40, 20, 10, 2);
        expect(calls[0]).toEqual(["rect", 7, 5, 6, 45]);
        expect(calls[1]).toEqual(["roundRect", 7, 5, 6, 45, [3, 3, 0, 0]] as any);
        expect(calls[2]).toEqual(["roundRect", 7, 50, 6, 30, [0, 0, 3, 3]] as any);
        expect(calls[3]).toEqual(["roundRect", 0, 15, 40, 10, [0, 2, 2, 0]] as any);
    });

    it("lays out groups symmetrically around the slot centre", () => {
        const { width, offsets } = groupLayout(32, 3, 1);
        expect(width).toBe(10);
        expect(offsets).toEqual([-11, 0, 11]);
        expect(groupLayout(4, 3, 1)).toEqual({ width: 1, offsets: [-1, 0, 1] });
    });

    it("batches paths per color", () => {
        const batch = new PathBatch();
        expect(batch.get("red")).toBe(batch.get("red"));
        expect(batch.get("blue")).not.toBe(batch.get("red"));
        const ctx = { fill: vi.fn(), stroke: vi.fn(), setLineDash: vi.fn() } as any;
        batch.fill(ctx);
        expect(ctx.fill).toHaveBeenCalledTimes(2);
        batch.stroke(ctx, 2);
        expect(ctx.lineWidth).toBe(2);
        expect(ctx.stroke).toHaveBeenCalledTimes(2);
    });
});

describe("stack", () => {
    const data = [
        { a: 1, b: 2, c: -3 },
        { a: 4, b: undefined, c: 1 },
    ];

    it("stacks positive values up and negative values down", () => {
        const s = stack(data, ["a", "b", "c"]);
        expect(s[0]).toEqual([
            [0, 1],
            [0, 4],
        ]);
        expect(s[1]).toEqual([[1, 3], undefined]);
        expect(s[2]).toEqual([
            [0, -3],
            [4, 5],
        ]);
    });

    it("normalises to 100 with the percent offset", () => {
        const s = stack([{ a: 1, b: 3 }], ["a", "b"], { offset: "percent" });
        expect(s[0][0]).toEqual([0, 25]);
        expect(s[1][0]).toEqual([25, 100]);
        expect(stack([{ a: 0 }], ["a"], { offset: "percent" })[0][0]).toEqual([0, 0]);
    });

    it("accepts accessor functions", () => {
        expect(stack([{ v: 2 }], [(d) => d.v, (d) => d.v * 2])[1][0]).toEqual([2, 6]);
    });
});

describe("paths", () => {
    it("collects points with gaps", () => {
        const pts = linePoints(
            [{ v: 1 }, { v: undefined }, { v: 3 }],
            0,
            2,
            (i) => i * 10,
            (v) => v * 2,
            (d) => d.v,
        );
        expect(pts).toEqual([[0, 2], null, [20, 6]]);
    });

    it("traces gaps, connected gaps and steps", () => {
        const pts = [[0, 0], null, [10, 10]] as const;
        let r = recorder();
        tracePath(r.path, pts);
        expect(r.calls.map((c) => c[0])).toEqual(["M", "M"]);
        r = recorder();
        tracePath(r.path, pts, "linear", true);
        expect(r.calls).toEqual([
            ["M", 0, 0],
            ["L", 10, 10],
        ]);
        r = recorder();
        tracePath(
            r.path,
            [
                [0, 0],
                [10, 10],
            ],
            "step",
        );
        expect(r.calls).toEqual([
            ["M", 0, 0],
            ["L", 10, 0],
            ["L", 10, 10],
        ]);
        r = recorder();
        tracePath(
            r.path,
            [
                [0, 0],
                [10, 10],
            ],
            "stepBefore",
        );
        expect(r.calls).toEqual([
            ["M", 0, 0],
            ["L", 0, 10],
            ["L", 10, 10],
        ]);
    });

    it("draws monotone curves with flat tangents at extrema", () => {
        const r = recorder();
        tracePath(
            r.path,
            [
                [0, 0],
                [10, 10],
                [20, 0],
            ],
            "monotone",
        );
        expect(r.calls[1][0]).toBe("C");
        // the peak at (10, 10) has a horizontal tangent
        expect(r.calls[1][4]).toBe(10);
    });

    it("closes an area per run, to a constant bottom or a bottom line", () => {
        let r = recorder();
        traceArea(r.path, [[0, 5], [10, 6], null, [30, 7]], 100);
        expect(r.calls.filter((c) => c[0] === "Z")).toHaveLength(2);
        expect(r.calls.slice(0, 5)).toEqual([["M", 0, 5], ["L", 10, 6], ["L", 10, 100], ["L", 0, 100], ["Z"]]);
        r = recorder();
        traceArea(
            r.path,
            [
                [0, 5],
                [10, 6],
            ],
            [
                [0, 50],
                [10, 60],
            ],
        );
        expect(r.calls).toEqual([["M", 0, 5], ["L", 10, 6], ["L", 10, 60], ["L", 0, 50], ["Z"]]);
    });
});

describe("markers", () => {
    const shapes: MarkerShape[] = ["circle", "square", "diamond", "triangle", "triangleDown", "cross", "x", "star"];

    it.each(shapes)("traces a closed %s", (shape) => {
        const r = recorder();
        traceMarker(r.path, shape, 50, 50, 10);
        expect(r.calls.length).toBeGreaterThan(0);
        // every point stays within the marker's bounding box (+20% for diamonds / triangles / stars)
        for (const [name, x, y] of r.calls) {
            if (name === "M" || name === "L") {
                expect(Math.abs(x - 50)).toBeLessThanOrEqual(6.5);
                expect(Math.abs(y - 50)).toBeLessThanOrEqual(6.5);
            }
        }
    });

    it("draws a marker with fill and stroke", () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")!;
        drawMarker(ctx, "circle", 10, 10, 8, { fill: "#ff0000", stroke: "#0000ff", strokeWidth: 2 });
        const calls = (ctx as any).__getDrawCalls().map((c: any) => c.type);
        expect(calls).toEqual(["fill", "stroke"]);
        drawMarker(ctx, "square", 10, 10, 8);
        expect((ctx as any).__getDrawCalls().map((c: any) => c.type)).toEqual(["fill", "stroke", "fill"]);
    });
});

describe("volumeProfile", () => {
    const bars = [
        { lo: 0, hi: 10, v: 100, up: true },
        { lo: 0, hi: 5, v: 50, up: false },
        { lo: 10, hi: 10, v: 30, up: true },
    ];

    it("spreads volume over the rows a bar's range overlaps", () => {
        const rows = volumeProfile(
            bars,
            0,
            2,
            2,
            (d) => [d.lo, d.hi],
            (d) => d.v,
            (d) => d.up,
        );
        expect(rows.map((r) => [r.from, r.to])).toEqual([
            [0, 5],
            [5, 10],
        ]);
        expect(rows[0]).toMatchObject({ up: 50, down: 50 });
        expect(rows[1]).toMatchObject({ up: 80, down: 0 });
        const total = rows.reduce((s, r) => s + r.up + r.down, 0);
        expect(total).toBe(180);
    });

    it("returns no rows without data", () => {
        expect(
            volumeProfile(
                [],
                0,
                -1,
                10,
                () => [0, 0],
                () => 1,
                () => true,
            ),
        ).toEqual([]);
    });
});
