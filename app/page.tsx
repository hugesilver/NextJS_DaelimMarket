import Nav from "./Components/nav";
import Home from "./home";
import Footer from "./Components/footer";
import style from "./page.module.css";

export default function Root() {
  return (
    <div>
      <Nav />
      <div className={style.emptySpace} />
      <Home />
      <Footer />
    </div>
  )
}