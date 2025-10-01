import { ImageResponse } from "next/og";
import { siteConfig } from "@/app/config/site";

export const dynamic = "force-static";

export const alt = "Reincharts - Interactive React Charting Library";
export const size = {
    width: 1200,
    height: 630,
};
export const contentType = "image/png";

export default async function Image() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background:
                        "radial-gradient(circle at top right, rgba(110,231,183,0.25), transparent 45%), radial-gradient(circle at 15% 85%, rgba(59,130,246,0.18), transparent 50%), linear-gradient(135deg, #020617 0%, #0f172a 100%)",
                    color: "white",
                    fontFamily: 'Inter, "DM Sans", system-ui',
                }}
            >
                <div
                    style={{
                        width: "100%",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "36px",
                        textAlign: "center",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "12px",
                            alignItems: "center",
                            textAlign: "center",
                        }}
                    >
                        <h1
                            style={{
                                margin: 0,
                                fontSize: "86px",
                                fontWeight: 700,
                                letterSpacing: "-3px",
                            }}
                        >
                            {siteConfig.name}
                        </h1>
                        <p
                            style={{
                                margin: 0,
                                fontSize: "34px",
                                color: "rgba(226,232,240,0.88)",
                                lineHeight: 1.25,
                            }}
                        >
                            {siteConfig.description}
                        </p>
                    </div>
                </div>
            </div>
        ),
        {
            ...size,
        },
    );
}
