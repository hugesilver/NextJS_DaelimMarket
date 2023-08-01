import Nav from './components/Nav'
import Footer from './components/Footer'
import './globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" suppressHydrationWarning={true}>
      <title>대림마켓</title>
      <body suppressHydrationWarning={true}>
        <Nav />
        {children}
        <Footer />
      </body>
    </html>
  )
}
