import Nav from './components/Nav'
import Footer from './components/Footer'
import './globals.css'

export const metadata = {
  title: '대림마켓',
  description: '',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" suppressHydrationWarning={true}>
      <body suppressHydrationWarning={true}>
        <Nav />
        {children}
        <Footer />
      </body>
    </html>
  )
}
