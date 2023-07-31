"use client";

import Link from "next/link";
import style from "./page.module.css";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { onAuthStateChanged, sendPasswordResetEmail } from "firebase/auth";
import { authService } from "../firebase";

export default function Forgot() {
  const router = useRouter();

  const [email, setEmail] = useState<string>('');

  const onSubmit = async () => {
    const regex: RegExp = /r'^[a-z0-9]+$'/;

    if (email.length >= 3 && !(regex.test(email))) {
      await sendPasswordResetEmail(authService, `${email}@email.daelim.ac.kr`)
        .then(() => {
          alert('해당 주소에 링크를 전송했어요.\n메일 확인 후 로그인 해주세요.');
          router.push('/');
        })
        .catch((e) => {
          switch (e.code) {
            case 'auth/invalid-email':
              alert('이메일 주소를 다시 확인해주세요.');
              break;
            case 'auth/user-not-found':
              alert('일치하는 정보가 없어요.');
              break;
            default:
              alert(e.code.toString());
              break;
          }
        });
    }
    else {
      alert('이메일을 확인해주세요.');
    }
  };

  useEffect(() => {
    const listener = onAuthStateChanged(authService, (user) => {
      if (!!user) {
        alert('이미 로그인 된 상태입니다.');
        router.push("/");
      }
    });

    listener();
  }, []);

  return (
    <article className={style.article}>
      <div className={style.form}>
        <h1 className={style.title}>비밀번호 찾기</h1>
        <div className={style.formDiv}>
          <input className={style.input} onChange={(event) => { setEmail(event.target.value); }} placeholder="이메일" type="email" />
          <span>@email.daelim.ac.kr</span>
        </div>
        <p className={style.links}>
          <Link href="/register"><span>회원가입</span></Link>
          &nbsp;|&nbsp;
          <Link href="/login"><span>로그인</span></Link>
          &nbsp;|&nbsp;
          <Link href="/forgot"><span>비밀번호 찾기</span></Link>
        </p>
        <button onClick={onSubmit} className={style.button}>이메일 전송</button>
      </div>
    </article>
  );
}