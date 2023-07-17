import Image from "next/image";
import style from "./nav.module.css";

export default function Nav(){
  return (
    <nav className={style.nav}>
      <div className={style.navDiv}>
        <Image className={style.navLogo} src="/images/nav/logo.png" alt="대림마켓 로고" width={179} height={52} />
        <div className={style.navLinks}>
          <Image className={style.navIcon} src="/images/nav/icon_upload.svg" alt="업로드" width={30} height={30} />
          <Image className={style.navIcon} src="/images/nav/icon_chat.svg" alt="채팅" width={30} height={30} />
          <Image className={style.navIcon} src="/images/nav/icon_mypage.svg" alt="마이페이지" width={30} height={30} />
        </div>
      </div>
      <div className={style.navLine}></div>
    </nav>
  );
};