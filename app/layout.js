import { Analytics } from '@vercel/analytics/next';

export const metadata = {
  title: "Colour Hunt",
  description: "Hunt by colour. See differently. Nine photos, one colour, the clock is ticking.",
  openGraph: {
    title: "Colour Hunt",
    description: "Hunt by colour. See differently.",
    type: "website",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#F7F2EA",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
