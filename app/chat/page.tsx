"use client";

import { useEffect, useState } from "react";
import style from "./page.module.css";
import { db, getUserUid } from "../Firebase";
import { useRouter } from "next/navigation";
import { DocumentData, doc, getDoc, onSnapshot } from "firebase/firestore";
import GetUserList from "./GetUserList";

export default function Chat() {
  const router = useRouter();
  const [uid, setUid] = useState<string | null>(null);
  const [chatData, setChatData] = useState<DocumentData | null>([]);
  const [readTimeData, setReadTimeData] = useState<DocumentData | null>([]);
  const [chatRoom, setChatRoom] = useState<DocumentData | null>([]);

  const getUid = async () => {
    try {
      await getUserUid().then((value) => {
        if (value == null) {
          alert('로그인이 필요합니다.');
          router.push('/');
        } else {
          setUid(value);
          onSnapshot(doc(db, 'chat', value), (document) => {
            if (document.exists()) {
              const { read_time, ...list } = document.data();
              setChatData(list);
              console.log(chatData);
              setReadTimeData(read_time);
            } else {
              setChatData(null);
              setReadTimeData(null);
            }
          });
        }
      })
    } catch (e) {
      alert(`chat 페이지에서 유저 채팅 정보를 불러오다가 오류 발생: ${e}`);
    }
    console.log("uid를 불러옴.");
  }

  useEffect(() => {
    getUid();
  }, []);

  return (
    <article className={style.article}>
      <section className={style.listSection}>
        <GetUserList chatData={chatData!} />
      </section>
      <div className={style.line}></div>
      <section className={style.chatSection}>

      </section>
    </article>
  );
}