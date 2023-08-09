"use client";

import Image from "next/image";
import Link from "next/link";
import style from "./Nav.module.css";
import { useEffect, useState } from "react";
import { DocumentData, doc, getDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { authService, db, getUserUid } from "../firebase";

export default function Nav() {
  const [userData, setUserData] = useState<DocumentData | null>(null);

  const getUserData = async () => {
    try {
      const uid = await getUserUid();
      if (uid != null) {
        const document: DocumentData = await getDoc(doc(db, 'user', uid));
        setUserData(await document);
        console.log('nav에서 user 데이터를 가져옴');
      } else {
        setUserData(null);
      }
    }
    catch (e) {
      alert(`유저 정보를 가져오는 중 오류가 발생하였습니다:\n${e}`);
      console.log(e);
    }
  }

  useEffect(() => {
    getUserData()
  }, []);

  return (
    <nav className={style.nav}>
      <div className={style.navDiv}>
        <Link href="/">
          <Image className={style.navLogo} src="/images/nav/logo.png" alt="대림마켓 로고" width={179} height={52} />
        </Link>
        <div className={style.navLinks}>
          <span className={style.navLogged}>
            {userData != null ?
              <>{userData.data()["nickName"]}님 환영합니다.&nbsp;|&nbsp;<span className={style.clickable} onClick={async () => { signOut(authService).then(() => { location.reload(); }); }}>로그아웃</span></> :
              <><Link href="/login" className={style.clickable}>로그인</Link>&nbsp;|&nbsp;<Link href="/register" className={style.clickable}>회원가입</Link></>
            }
          </span>
          {
            userData != null ?
              <>
                <Link href="/upload">
                  <Image className={style.navIcon} src="/images/nav/icon_upload.svg" alt="업로드" width={30} height={30} />
                </Link>
                <Link href="/chat">
                  <Image className={style.navIcon} src="/images/nav/icon_chat.svg" alt="채팅" width={30} height={30} />
                </Link>
                <Link href="/mypage">
                  <Image className={style.navIcon} src="/images/nav/icon_mypage.svg" alt="마이페이지" width={30} height={30} />
                </Link>
              </> :
              null
          }

        </div>
      </div>
      <div className={style.navLine}></div>
    </nav>
  );
};