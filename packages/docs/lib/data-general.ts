// General-purpose sample data for live examples, generated in the browser from a fixed seed
// (deterministic, no network requests).

const seeded = (seed: number) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

export interface WeatherDay {
    date: Date;
    /** Daily mean temperature, °C. */
    temp: number;
    /** Daily low, °C. */
    low: number;
    /** Daily high, °C. */
    high: number;
    /** Difference from the seasonal normal, °C. */
    anomaly: number;
}

/** Two years of daily temperatures for a temperate city. */
export const weather: WeatherDay[] = (() => {
    const rand = seeded(21);
    let drift = 0;
    return Array.from({ length: 730 }, (_, i) => {
        const date = new Date(2024, 10, 1 + i);
        const doy = (date.getTime() - new Date(date.getFullYear(), 0, 1).getTime()) / 86_400_000;
        const normal = 10.5 - 9.5 * Math.cos(((doy - 15) / 365) * 2 * Math.PI);
        drift = drift * 0.82 + (rand() - 0.5) * 3.2;
        const temp = normal + drift;
        const spread = 4 + rand() * 3 + (normal > 12 ? 2 : 0);
        const r = (v: number) => Math.round(v * 10) / 10;
        return {
            date,
            temp: r(temp),
            low: r(temp - spread / 2),
            high: r(temp + spread / 2),
            anomaly: r(temp - normal),
        };
    });
})();

export interface TrafficDay {
    date: Date;
    /** Sessions per day. */
    sessions: number;
    /** Sign-ups per day. */
    signups: number;
}

/** Two years of daily website traffic with weekly seasonality and steady growth. */
export const traffic: TrafficDay[] = (() => {
    const rand = seeded(8);
    return Array.from({ length: 730 }, (_, i) => {
        const date = new Date(2024, 10, 1 + i);
        const weekday = date.getDay();
        const weekly = weekday === 0 || weekday === 6 ? 0.7 : 1;
        const sessions = Math.round((2400 + i * 4.2 + 380 * Math.sin(i / 45)) * weekly * (0.92 + rand() * 0.16));
        return { date, sessions, signups: Math.round(sessions * (0.028 + rand() * 0.01)) };
    });
})();
