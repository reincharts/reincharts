import { mappedSlidingWindow, path } from "../utils";
import { SAR as defaultOptions } from "./defaultOptionsForComputation";

function calc(prev: any, now: any, highPath: (d: any) => number, lowPath: (d: any) => number) {
    const risingSar = prev.risingSar + prev.af * (prev.risingEp - prev.risingSar);

    const fallingSar = prev.fallingSar - prev.af * (prev.fallingSar - prev.fallingEp);

    const risingEp = Math.max(prev.risingEp, highPath(now));
    const fallingEp = Math.min(prev.fallingEp, lowPath(now));

    return {
        risingSar,
        fallingSar,
        risingEp,
        fallingEp,
    };
}

export interface SAROptions {
    readonly accelerationFactor: number;
    readonly maxAccelerationFactor: number;
    readonly highPath?: string;
    readonly lowPath?: string;
}

export default function () {
    let options = defaultOptions;

    const calculator = (data: any[]) => {
        const { accelerationFactor, maxAccelerationFactor, highPath = "high", lowPath = "low" } = options;

        const highSource = path(highPath);
        const lowSource = path(lowPath);

        const algorithm = mappedSlidingWindow()
            .windowSize(2)
            // @ts-ignore
            .undefinedValue((d: any) => {
                const high = highSource(d);
                const low = lowSource(d);
                return {
                    risingSar: low,
                    risingEp: high,
                    fallingSar: high,
                    fallingEp: low,
                    af: accelerationFactor,
                };
            })
            .accumulator(([prev, now]: any) => {
                const { risingSar, fallingSar, risingEp, fallingEp } = calc(prev, now, highSource, lowSource);

                if (prev.use === undefined && risingSar > lowSource(now) && fallingSar < highSource(now)) {
                    return {
                        risingSar,
                        fallingSar,
                        risingEp,
                        fallingEp,
                    };
                }

                const use =
                    prev.use !== undefined
                        ? prev.use === "rising"
                            ? risingSar > lowSource(now)
                                ? "falling"
                                : "rising"
                            : fallingSar < highSource(now)
                              ? "rising"
                              : "falling"
                        : risingSar > lowSource(now)
                          ? "falling"
                          : "rising";

                const current =
                    prev.use === use
                        ? {
                              af: Math.min(maxAccelerationFactor, prev.af + accelerationFactor),
                              fallingEp,
                              risingEp,
                              fallingSar,
                              risingSar,
                          }
                        : {
                              af: accelerationFactor,
                              fallingEp: lowSource(now),
                              risingEp: highSource(now),
                              fallingSar: Math.max(prev.risingEp, highSource(now)),
                              risingSar: Math.min(prev.fallingEp, lowSource(now)),
                          };

                const { date } = now;
                const high = highSource(now);
                const low = lowSource(now);

                return {
                    date,
                    high,
                    low,
                    ...current,
                    use,
                    sar: use === "falling" ? current.fallingSar : current.risingSar,
                };
            });

        const calculatedData = algorithm(data).map((d: any) => d.sar);

        return calculatedData;
    };

    calculator.undefinedLength = () => {
        return 1;
    };

    calculator.options = (newOptions?: SAROptions) => {
        if (newOptions === undefined) {
            return options;
        }

        options = { ...defaultOptions, ...newOptions };

        return calculator;
    };

    return calculator;
}
