"use client";

import Link from "next/link";
import style from "./page.module.css";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signInWithEmailAndPassword } from "firebase/auth";
import { authService } from "../firebase";

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  const onSubmit = async () => {
    const regex: RegExp = /r'^[a-z0-9]+$'/;
    if (email.length >= 3 && password.length >= 4 && !(regex.test(email))) {
      await signInWithEmailAndPassword(authService, `${email}@email.daelim.ac.kr`, password)
        .then((user) => {
          if (user.user.emailVerified) {
            alert('로그인되었습니다.');
            location.reload();
          }
          else {
            alert('이메일 인증이 안 된 계정이에요.');
          }
        })
        .catch((e) => {
          switch (e.code) {
            case 'auth/user-not-found':
            case 'auth/wrong-password':
              alert('일치하는 정보가 없어요.');
              break;
            case 'auth/user-disabled':
              alert('사용할 수 없는 계정이에요.');
              break;
            case 'auth/invalid-email':
              alert('이메일 주소 형식을 다시 확인해주세요.');
              break;
            default:
              alert(e.code.toString());
              break;
          }
        });
    } else {
      alert('이메일과 비밀번호를 확인해주세요.');
    }
  }

  useEffect(() => {
    const listener = onAuthStateChanged(authService, (user) => {
      if (!!user) {
        router.push("/");
      }
    });

    listener();
  }, []);

  return (
    <article className={style.article}>
      <div className={style.form}>
        <h1 className={style.title}>로그인</h1>
        <div className={style.formDiv}>
          <input className={style.input} onChange={(event) => { setEmail(event.target.value); }} placeholder="이메일" type="email" />
          <span>@email.daelim.ac.kr</span>
        </div>
        <div className={style.formDiv}>
          <input className={style.input} onChange={(event) => { setPassword(event.target.value); }} placeholder="비밀번호" type="password" />
        </div>
        <p className={style.links}>
          <Link href="/register"><span>회원가입</span></Link>
          &nbsp;|&nbsp;
          <Link href="/login"><span>로그인</span></Link>
          &nbsp;|&nbsp;
          <Link href="/forgot"><span>비밀번호 찾기</span></Link>
        </p>
        <button onClick={onSubmit} className={style.button}>로그인</button>
      </div>
    </article>
  );
}