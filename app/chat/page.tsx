"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import style from "./page.module.css";
import { db, getUserUid } from "../Firebase";
import { useRouter } from "next/navigation";
import { DocumentData, Timestamp, arrayUnion, collection, deleteField, doc, getDoc, onSnapshot, serverTimestamp, updateDoc } from "firebase/firestore";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import Image from "next/image";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import axios from "axios";

export default function Chat() {
  const router = useRouter();
  const [uid, setUid] = useState<string | null>(null);
  const [myData, setMyData] = useState<DocumentData | null>([]);
  const [chatData, setChatData] = useState<DocumentData | null>([]);
  const [readTimeData, setReadTimeData] = useState<DocumentData | null>([]);
  const [chatRoom, setChatRoom] = useState<string | null>(null);
  const [userData, setUserData] = useState<{ [key: string]: any }>({});
  const [chat, setChat] = useState<string>('');

  const getUid = async () => {
    try {
      await getUserUid().then((value) => {
        if (value == null) {
          alert('로그인이 필요합니다.');
          router.push('/');
        } else {
          setUid(value);
          getDoc(doc(db, 'user', value)).then((value) => {
            if (value.exists()) {
              setMyData(value.data());
            }
          })
          onSnapshot(doc(db, 'chat', value), (document) => {
            if (document.exists()) {
              const { read_time, ...list } = document.data();
              setReadTimeData(read_time);
              const alignResult: any = {};
              const alignList = Object.entries(list)
                .sort((a, b) => {
                  if (a[1].length > 0 && b[1].length > 0) {
                    return b[1][b[1].length - 1]['send_time'] - a[1][a[1].length - 1]['send_time'];
                  } else {
                    return Number.MAX_VALUE;
                  }
                });
              alignList.forEach(([key, value]) => {
                alignResult[key] = value;
              })
              setChatData(alignResult);
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

  const getUserData = async (user: string) => {
    try {
      const data = (await getDoc(doc(db, 'user', user))).data();
      return data;
    } catch (e) {
      alert(`채팅 유저 목록을 불러오는 도중 오류가 발생했습니다: ${e}`);
      return null;
    }
  }

  const returnUserData = async () => {
    Object.keys(chatData!).forEach(async (key) => {
      const data = await getUserData(key);
      const newData: any = {};
      newData[key] = data;
      setUserData((prev: any) => ({ ...prev, ...newData }))
    })
  }

  const getListElement = (user: string) => {
    if (chatData != null) {
      return (
        <div className={style.listDiv} key={user} onClick={() => { setChatRoom(user) }} style={{ backgroundColor: user == chatRoom ? "#E6E6E6" : "#FFFFFF" }}>
          <div className={style.userProfile}>
            {
              userData![user]["profile_image"] != '' ?
                (
                  <img className={style.userProfileImg} src={userData![user]["profile_image"]} alt={`${userData!["nickName"]}의 프로필 이미지`} />
                )
                : null
            }
          </div>
          <div className={style.userInfo}>
            <p>{userData![user].hasOwnProperty("deleted") ? "탈퇴한 사용자" : userData![user]["nickName"]}</p>
            <p>
              {(() => {
                if (chatData![user] != undefined) {
                  if (chatData![user].length > 0) {
                    switch (chatData![user][chatData![user].length - 1]["type"]) {
                      case "text":
                        return chatData![user][chatData![user].length - 1]["text"];
                      case "image":
                        return "이미지를 보냈습니다.";
                      default:
                        return "메시지를 보냈습니다.";
                    }
                  } else {
                    return "첫 대화를 시작해봐요!"
                  }
                }

              })()}
            </p>
          </div>
          {
            chatData![user] != null && chatData[user].length > 0 && readTimeData![`${uid}-${user}`] != null ?
              chatData![user][chatData![user].length - 1]["sender"] != uid && chatData![user!][chatData![user].length - 1]["send_time"].toDate() >= readTimeData![`${uid}-${user}`].toDate() ?
                <div className={style.redDot} /> :
                null
              : null
          }
        </div>
      );
    }
  }

  const read = () => {
    updateDoc(doc(db, 'chat', uid!), {
      'read_time': {
        ...readTimeData,
        [`${uid}-${chatRoom}`]: Timestamp.fromMillis(Date.now())
      }
    });
    updateDoc(doc(db, 'chat', chatRoom!), {
      'read_time': {
        ...readTimeData,
        [`${uid}-${chatRoom}`]: Timestamp.fromMillis(Date.now())
      }
    });
  }

  const returnChatElement = (index: number) => {
    const getChat = () => {
      if (chatData![chatRoom!][index]["sender"] == uid) {
        return (
          <div className={style.rightChat}>
            {
              chatData![chatRoom!][index]["type"] == "text" ?
                <span className={style.rightBubble}>{chatData![chatRoom!][index]["text"]}</span> :
                chatData![chatRoom!][index]["type"] == "image" ?
                  <img className={style.rightBubble} src={chatData![chatRoom!][index]["image"]} /> :
                  null
            }
            <div className={style.rightInfo}>
              {
                readTimeData![`${chatRoom}-${uid}`] != null && chatData![chatRoom!][index]["send_time"].toDate() >= readTimeData![`${chatRoom}-${uid}`].toDate() ?
                  <span className={style.chatGrey}>읽음</span>
                  : <span className={style.chatGrey}>전송됨</span>
              }
              {
                index == chatData![chatRoom!].length - 1 || chatData![chatRoom!][index + 1]["sender"] != chatData![chatRoom!][index]["sender"] || chatData![chatRoom!][index + 1]["send_time"].toDate().getMinutes() != chatData![chatRoom!][index]["send_time"].toDate().getMinutes() ?
                  <span className={style.chatGrey}>{format(chatData![chatRoom!][index]["send_time"].toDate(), 'hh:mm', { locale: ko })}</span>
                  : null
              }
            </div>
          </div>
        );
      } else {
        return (
          <div className={style.leftChat}>
            {
              chatData![chatRoom!][index]["type"] == "text" ?
                <span className={style.leftBubble}>{chatData![chatRoom!][index]["text"]}</span> :
                chatData![chatRoom!][index]["type"] == "image" ?
                  <img className={style.leftBubble} src={chatData![chatRoom!][index]["image"]} /> :
                  null
            }
            {
              index == chatData![chatRoom!].length - 1 || chatData![chatRoom!][index + 1]["sender"] != chatData![chatRoom!][index]["sender"] || chatData![chatRoom!][index + 1]["send_time"].toDate().getMinutes() != chatData![chatRoom!][index]["send_time"].toDate().getMinutes() ?
                <span className={style.chatGrey}>{format(chatData![chatRoom!][index]["send_time"].toDate(), 'hh:mm', { locale: ko })}</span>
                : null
            }
          </div>
        );
      }
    }

    if (chatData![chatRoom!] != null && index == chatData![chatRoom!].length - 1) {
      if (chatData![chatRoom!][chatData![chatRoom!].length - 1]["sender"] != uid) {
        if (readTimeData![`${uid}-${chatRoom}`] == undefined ||
          chatData![chatRoom!][chatData![chatRoom!].length - 1]["send_time"].toDate() > readTimeData![`${uid}-${chatRoom}`].toDate()
        ) {
          read();
          console.log("읽음 처리 중");
        }
      }
    }

    if (index == 0 || chatData![chatRoom!][index - 1]["send_time"].toDate().getDate() != chatData![chatRoom!][index]["send_time"].toDate().getDate()) {
      return (
        <>
          <p className={style.day}>{format(chatData![chatRoom!][index]["send_time"].toDate(), 'yyyy년 M월 d일 EEEE', { locale: ko })}</p>
          {getChat()}
        </>
      );
    } else {
      return (
        <>
          {getChat()}
        </>
      );
    }
  }

  const hashCode = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
    }
    return hash;
  }

  const sendChat = async () => {
    if (chat != '') {
      try {
        setChat('');
        await updateDoc(doc(db, 'chat', uid!), {
          [chatRoom!]: arrayUnion({
            'type': 'text',
            'send_time': Timestamp.fromMillis(Date.now()),
            'sender': uid,
            'text': chat,
          })
        })
        await updateDoc(doc(db, 'chat', chatRoom!), {
          [uid!]: arrayUnion({
            'type': 'text',
            'send_time': Timestamp.fromMillis(Date.now()),
            'sender': uid,
            'text': chat,
          })
        })
        if (chatField.current) {
          chatField.current.scrollTop = chatField.current.scrollHeight;
        }
        if (userData![chatRoom!]["token"] != '') {
          axios.post(
            'https://fcm.googleapis.com/fcm/send',
            {
              to: userData![chatRoom!]["token"],
              notification: {
                title: `${myData!["nickName"]}`,
                body: `${chat}`,
                android_channel_id: `${hashCode(uid!)}`,
                sound: 'alert.wav',
              },
              aps: {
                title: `${myData!["nickName"]}`,
                body: chat,
                badge: 1,
              },
              priority: 'high',
              data: {
                click_action: 'FLUTTER_NOTIFICATION_CLICK',
                id: `${hashCode(uid!)}`,
                status: 'done',
              },
            },
            {
              headers: {
                'Content-Type': 'application/json',
                Authorization: `key=${process.env.NEXT_PUBLIC_SERVER_KEY}`,
              },
            }
          );
        }
      } catch (e) {
        alert(`채팅을 전송하는 중 오류가 발생했습니다: ${e}`)
      }
    }

  }

  const sendPic = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e != null) {
      try {
        const pic = e.target.files![0]

        const storage = getStorage();

        const fileName = `chat_${format(Date.now(), 'yyyyMMddHHmmss')}.${pic!.name.split('.').pop()}`;
        const storageRef = ref(storage, `chat/${uid}/${fileName}`);
        const snapshot = await uploadBytes(storageRef, pic);
        const url = await getDownloadURL(snapshot.ref);

        await Promise.all([
          updateDoc(doc(db, 'chat', uid!), {
            [chatRoom!]: arrayUnion({
              'type': 'image',
              'send_time': Timestamp.fromMillis(Date.now()),
              'sender': uid,
              'image': url,
            })
          }),
          updateDoc(doc(db, 'chat', chatRoom!), {
            [uid!]: arrayUnion({
              'type': 'image',
              'send_time': Timestamp.fromMillis(Date.now()),
              'sender': uid,
              'image': url,
            })
          })
        ]);

        if (userData![chatRoom!]["token"] != '') {
          axios.post(
            'https://fcm.googleapis.com/fcm/send',
            {
              to: userData![chatRoom!]["token"],
              notification: {
                title: `${myData!["nickName"]}`,
                body: '이미지를 보냈습니다.',
                android_channel_id: `${hashCode(uid!)}`,
                sound: 'alert.wav',
              },
              aps: {
                title: `${myData!["nickName"]}`,
                body: chat,
                badge: 1,
              },
              priority: 'high',
              data: {
                click_action: 'FLUTTER_NOTIFICATION_CLICK',
                id: `${hashCode(uid!)}`,
                status: 'done',
              },
            },
            {
              headers: {
                'Content-Type': 'application/json',
                Authorization: `key=${process.env.NEXT_PUBLIC_SERVER_KEY}`,
              },
            }
          );
        }
      } catch (e) {
        alert(`사진을 전송 하는 중 문제가 발생하였습니다:${e}`)
      }
    }
  }

  const leaveChatRoom = async () => {
    try {
      await updateDoc(doc(db, 'chat', uid!), {
        [chatRoom!]: deleteField()
      });
    } catch (e) {
      alert(`채팅방을 나가는 도중 오류가 발생하였습니다.`);
      console.log(e);
    }

  }

  const chatField = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    getUid();
  }, []);

  useEffect(() => {
    returnUserData()
  }, [chatData]);

  useEffect(() => {
    if (chatField.current) {
      chatField.current.scrollTop = chatField.current.scrollHeight;
    }
  }, [chatRoom])

  return (
    <article className={style.article}>
      <section className={style.listSection}>
        <>
          {
            userData != null ?
              Object.keys(userData).map((user) => {
                return getListElement(user);
              })
              : null
          }
        </>
      </section>
      <div className={style.line}></div>
      <section className={style.chatSection}>
        {
          chatData != null && chatRoom != null ?
            <div className={style.chatInfo}>
              <div>
                <div>
                  <img src={userData![chatRoom]["profile_image"]} />
                </div>
                <span>{userData![chatRoom].hasOwnProperty("deleted") ? "탈퇴한 사용자" : userData![chatRoom]["nickName"]}</span>
              </div>
              <span className={style.out} onClick={() => {
                const confirm = window.confirm(`정말로 채팅방을 나가시겠습니까?`);
                if (confirm) {
                  leaveChatRoom();
                  setChatRoom(null);
                  location.reload();
                }
              }}>나가기</span>
            </div>
            : null
        }
        <div className={style.chatField} ref={chatField}>
          {
            chatData != null && chatRoom != null ?
              chatData[chatRoom!].map((_: object, index: number) => {
                return (
                  <>
                    {returnChatElement(index)}
                  </>
                );
              })
              : null
          }
        </div>
        {
          chatData != null && chatRoom != null ?
            <div className={style.chatInput}>
              <input className={style.inputFile} type="file" style={{ display: "none" }} accept="image/*" id="file" onChange={(e) => { sendPic(e); }} />
              <label className={style.label} htmlFor="file">
                <Image className={style.sendPic} src="/images/chat/icon_plus.svg" alt="사진 보내기" width={35} height={35} />
              </label>
              <input className={style.sendChat} onKeyPress={(event) => { if (event.key == 'Enter') { sendChat(); } }} value={chat} onChange={(e) => setChat(e.target.value)} placeholder={userData![chatRoom].hasOwnProperty("deleted") ? "탈퇴한 사용자와 대화할 수 없습니다." : "Enter를 눌러 메시지 보내기"} disabled={userData![chatRoom].hasOwnProperty("deleted")} />
            </div>
            : null
        }
      </section>
    </article>
  );
}