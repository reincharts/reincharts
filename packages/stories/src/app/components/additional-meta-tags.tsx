export function AdditionalMetaTags() {
    return (
        <>
            {/* Preconnect to external domains for better loading performance */}
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />

            {/* DNS prefetch for GitHub (since we link to it) */}
            <link rel="dns-prefetch" href="https://github.com" />

            {/* Language and content information - these are not handled by Next.js metadata API */}
            <meta httpEquiv="content-language" content="en-US" />
            <meta name="geo.region" content="US" />
            <meta name="geo.placename" content="United States" />
        </>
    );
}
