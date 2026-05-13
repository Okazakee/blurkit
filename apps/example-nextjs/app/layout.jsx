export const metadata = {
  title: 'blurkit Next.js example',
  description: 'Minimal blurkit integration in Next.js',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
