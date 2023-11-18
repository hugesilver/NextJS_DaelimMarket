"use client";

import Link from "next/link";
import style from "./page.module.css";
import { useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import {
  DocumentData,
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { authService, db } from "../Firebase";

export default function Register() {
  const router = useRouter();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirm, setConfirm] = useState<string>("");
  const [nickname, setNickname] = useState<string>("");
  const [isLoading, setIsLoading] = useState<Boolean>(false);

  const onSubmit = async () => {
    if (!isLoading) {
      setIsLoading(true);
      const emailRegex: RegExp = /r'^[a-z0-9]+$'/;
      const nicknameRegex: RegExp = /r'[a-zA-Zㄱ-ㅎㅏ-ㅣ가-힣0-9]'/;
      if (!(email.length >= 3)) {
        alert("이메일을 확인하세요.");
        setIsLoading(false);
      } else if (emailRegex.test(email)) {
        alert("이메일에 사용할 수 없는 문자가 포함되어있어요.");
        setIsLoading(false);
      } else if (!(password.length >= 4)) {
        alert("비밀번호를 확인하세요.");
        setIsLoading(false);
      } else if (!(nickname.length >= 2 && nickname.length <= 8)) {
        alert("닉네임은 2-8자로 해주세요.");
        setIsLoading(false);
      } else if (nicknameRegex.test(nickname)) {
        alert("닉네임은 영문자, 한글, 숫자만 가능해요.");
        setIsLoading(false);
      } else if (!(password == confirm)) {
        alert("비밀번호가 일치하지 않아요.");
        setIsLoading(false);
      } else {
        const nicknameQuery = query(
          collection(db, "user"),
          where("nickName", "==", nickname)
        );
        const nickNameCheck: DocumentData = await getDocs(nicknameQuery);

        if (nickNameCheck.docs.length == 0) {
          await createUserWithEmailAndPassword(
            authService,
            `${email}@email.daelim.ac.kr`,
            password
          )
            .then(async (value) => {
              await setDoc(doc(db, "user", value.user.uid), {
                nickName: nickname,
                id: email,
                email: `${email}@email.daelim.ac.kr`,
                posts: [],
                watchlist: [],
                token: "",
              });
              await setDoc(doc(db, "chat", value.user.uid), {
                daelimmarket: [
                  {
                    send_time: Date.now(),
                    sender: "daelimmarket",
                    type: "text",
                    text: "추가해줘서 고마워요!\n다른 판매자들과 채팅을 시작해보아요!",
                  },
                ],
                read_time: {},
              });

              if (authService.currentUser != null) {
                await sendEmailVerification(authService.currentUser);
                alert(
                  `${email}@email.daelim.ac.kr 주소에\n인증 링크 메일을 전송했어요!\n인증 후에 서비스를 이용할 수 있으니, 꼭 링크를 눌러주세요!\n(메일이 보이지 않는다면 스팸메일함을 확인해보세요.)`
                );
                await authService.signOut();
              }

              router.push("/");
            })
            .catch((e) => {
              switch (e.code) {
                case "auth/weak-password":
                  alert("비밀번호 보안을 신경써주세요.");
                  break;
                case "auth/email-already-in-use":
                  alert("이미 존재하는 계정이에요.");
                  break;
                case "auth/invalid-email":
                  alert("이메일 주소 형식을 다시 확인해주세요.");
                  break;
                case "auth/operation-not-allowed":
                  alert("허용되지 않은 작업이에요.");
                  break;
                default:
                  alert(e.code.toString());
                  break;
              }
              setIsLoading(false);
            });
        } else {
          alert("중복된 닉네임이 있습니다.");
          setIsLoading(false);
          return;
        }
      }
    }
  };

  useEffect(() => {
    const listener = onAuthStateChanged(authService, (user) => {
      if (!!user) {
        alert("이미 로그인 된 상태입니다.");
        router.push("/");
      }
    });

    listener();
  }, []);

  return (
    <article className={style.article}>
      <div className={style.form}>
        <h1 className={style.title}>회원가입</h1>
        <div className={style.formDiv}>
          <input
            className={style.input}
            onChange={(event) => {
              setEmail(event.target.value);
            }}
            placeholder="이메일"
            type="email"
          />
          <span>@email.daelim.ac.kr</span>
        </div>
        <div className={style.formDiv}>
          <input
            className={style.input}
            onChange={(event) => {
              setNickname(event.target.value);
            }}
            placeholder="닉네임(2-8자)"
            type="text"
            maxLength={8}
          />
        </div>
        <div className={style.formDiv}>
          <input
            className={style.input}
            onChange={(event) => {
              setPassword(event.target.value);
            }}
            placeholder="비밀번호(4자 이상)"
            type="password"
          />
        </div>
        <div className={style.formDiv}>
          <input
            className={style.input}
            onChange={(event) => {
              setConfirm(event.target.value);
            }}
            placeholder="비밀번호 확인"
            type="password"
          />
        </div>
        <p className={style.links}>
          <Link href="/register">
            <span>회원가입</span>
          </Link>
          &nbsp;|&nbsp;
          <Link href="/login">
            <span>로그인</span>
          </Link>
          &nbsp;|&nbsp;
          <Link href="/forgot">
            <span>비밀번호 찾기</span>
          </Link>
        </p>
        <button
          onClick={onSubmit}
          className={style.button}
          style={{ backgroundColor: isLoading ? "#CDCDCD" : "#00A5D9" }}
        >
          회원가입
        </button>
      </div>
    </article>
  );
}
