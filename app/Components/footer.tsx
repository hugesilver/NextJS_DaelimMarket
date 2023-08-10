"use client";

import Image from "next/image";
import style from "./Footer.module.css";

export default function Footer(){
  return (
    <footer className={style.footer}>
      <div className={style.footerDiv}>
        <div className={style.footerLogos}>
          <Image className={style.footerLogo} src="/images/footer/daelimmarket_textless_white.png" alt="대림마켓 심볼" width={111} height={111} />
          <Image className={style.footerLogo} src="/images/footer/ilpalsam_white.png" alt="일팔삼 로고" width={111} height={111} />
        </div>
        <p className={style.footerCopyright}>Copyright 2023 ILPALSAM. All rights reserved.</p>
        <Image className={style.footerGithubLogo} onClick={() => {location.href="https://github.com/team-ilpalsam/NextJS_DaelimMarket"}} src="/images/footer/github_logo.png" alt="Github" width={25} height={25} />
      </div>
    </footer>
  );
}