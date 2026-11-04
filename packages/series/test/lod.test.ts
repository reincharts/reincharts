import { seededRandom } from "@reincharts/testing";
import { getLod, linePoints, LOD_BLOCK, LOD_MIN_LENGTH, lodExtent } from "../src";

const make = (n: number, seed = 3) => {
    const r = seededRandom(seed);
    let v = 100;
    return Array.from({ length: n }, () => ({ v: (v += r() - 0.5), lo: v - r(), hi: v + r() }));
};
type Row = ReturnType<typeof make>[number];
const value = (d: Row) => d.v;

describe("level-of-detail index", () => {
    it("is only built for large series and is cached per data + accessor", () => {
        expect(getLod(make(100), value)).toBeUndefined();
        const data = make(LOD_MIN_LENGTH + 5);
        const lod = getLod(data, value)!;
        expect(lod.min.length).toBe(Math.ceil(data.length / LOD_BLOCK));
        expect(getLod(data, value)).toBe(lod);
    });

    it("gives exactly the brute-force extent for random ranges", () => {
        const data = make(50_000);
        const lo = (d: Row) => d.lo;
        const hi = (d: Row) => d.hi;
        const lod = getLod(data, lo, hi)!;
        const r = seededRandom(9);
        for (let k = 0; k < 200; k++) {
            const a = Math.floor(r() * data.length);
            const b = Math.min(data.length - 1, a + Math.floor(r() * 30_000));
            let min = Infinity;
            let max = -Infinity;
            for (let i = a; i <= b; i++) {
                min = Math.min(min, data[i].lo);
                max = Math.max(max, data[i].hi);
            }
            expect(lodExtent(lod, data, a, b, lo, hi)).toEqual([min, max]);
        }
    });
});

describe("linePoints decimation", () => {
    const width = 500;
    const pointsFor = (data: Row[]) => {
        const x = (i: number) => (i / (data.length - 1)) * width;
        return { x, pts: linePoints(data, 0, data.length - 1, x, (v) => v, value) };
    };

    it("keeps every pixel column's true min and max with at most 4 points per column", () => {
        for (const n of [5_000, 60_000]) {
            // 5k: per-bar M4; 60k: block (LOD) path
            const data = make(n);
            const { x, pts } = pointsFor(data);
            expect(pts.length).toBeLessThanOrEqual((width + 1) * 4);
            const columns = new Map<number, { min: number; max: number }>();
            data.forEach((d, i) => {
                const c = Math.floor(x(i));
                const e = columns.get(c) ?? { min: Infinity, max: -Infinity };
                columns.set(c, { min: Math.min(e.min, d.v), max: Math.max(e.max, d.v) });
            });
            const drawn = new Map<number, { min: number; max: number }>();
            for (const p of pts) {
                const c = Math.floor(p![0]);
                const e = drawn.get(c) ?? { min: Infinity, max: -Infinity };
                drawn.set(c, { min: Math.min(e.min, p![1]), max: Math.max(e.max, p![1]) });
            }
            for (const [c, e] of columns) {
                expect(drawn.get(c), `column ${c} of ${n}`).toEqual(e);
            }
            // first and last points are kept exactly
            expect(pts[0]).toEqual([0, data[0].v]);
            expect(pts.at(-1)).toEqual([width, data[n - 1].v]);
        }
    });

    it("draws every point when there is room for them", () => {
        const data = make(300);
        expect(pointsFor(data).pts).toHaveLength(300);
    });

    it("keeps gaps while bars are drawn individually", () => {
        // 5k points on 500px: per-bar M4 path; inside a sub-pixel block (LOD path) a single gap is not visible
        const data = make(5_000);
        data[2_500] = { v: NaN, lo: NaN, hi: NaN };
        expect(pointsFor(data).pts).toContain(null);
    });
});
