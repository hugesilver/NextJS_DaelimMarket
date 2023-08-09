"use client";

import { useEffect, useState } from "react";
import style from "./page.module.css"
import { useRouter } from "next/navigation";
import { authService, db, getUserUid } from "../Firebase";
import { DocumentData, collection, doc, getDoc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { deleteObject, getDownloadURL, getStorage, listAll, ref, uploadBytes } from "firebase/storage";
import { deleteUser, signOut } from 'firebase/auth';
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";

export default function Mypage() {
  const router = useRouter();
  const [uid, setUid] = useState<string | null>(null);
  const [myData, setMyData] = useState<DocumentData | null>(null)
  const [myProfileImage, setMyProfileImage] = useState<string | null>(null);
  const [email, setEmail] = useState<string>('');
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [nickname, setNickname] = useState<string>('');

  const [loading, setLoading] = useState<Boolean>(true);
  const [stackWatchlist, setStackWatchlist] = useState<number>(0);
  const [watchlistsDocument, setWatchlistDocument] = useState<Array<object | null>>([]);
  const [stackPosts, setStackPosts] = useState<number>(0);
  const [postsDocument, setPostsDocument] = useState<Array<object | null>>([]);

  const getUid = async () => {
    try {
      await getUserUid().then(async (value) => {
        if (value == null) {
          alert('로그인이 필요합니다.');
          router.push('/');
        } else {
          setUid(value);
          await getDoc(doc(db, 'user', value)).then((myValue: DocumentData) => {
            setMyData(myValue.data());
          })
        }
      })
    } catch (e) {
      alert(`마이페이지에서 유저 채팅 정보를 불러오다가 오류 발생: ${e}`);
    }
    console.log("uid를 불러옴.");
  }

  const onClickSave = async () => {
    if (profileImage == null && nickname == null) {
      alert('빈 상태로 저장할 수 없습니다.');
      return;
    } else {
      if (profileImage != null) {
        try {
          const storage = getStorage();

          await Promise.all((await listAll(ref(storage, `profile/${uid}`))).items.map(async (item) => {
            await deleteObject(item);
          }));

          const fileName = `uid.${profileImage!.name.split('.').pop()}`;
          const storageRef = ref(storage, `profile/${uid}/${fileName}`);
          const snapshot = await uploadBytes(storageRef, profileImage);
          const url = await getDownloadURL(snapshot.ref);

          await updateDoc(doc(db, 'user', uid!), {
            'profile_image': url
          });
          alert('프로필 이미지를 변경하였습니다.');
        } catch (e) {
          alert(`프로필 사진을 업데이트 하는 중 오류가 발생하였습니다: ${e}`)
        }
      }
      if (nickname != null && nickname != '' && (/^[a-zA-Zㄱ-힣0-9]*$/).test(nickname)) {
        try {
          const nicknameQuery = query(
            collection(db, "user"),
            where("nickName", "==", nickname),
          );
          const nickNameCheck = await getDocs(nicknameQuery);

          if (nickNameCheck.docs.length === 0) {
            await updateDoc(doc(db, 'user', uid!), {
              'nickName': nickname
            });
            alert('닉네임을 변경하였습니다.');
          } else {
            alert('중복된 닉네임이 있습니다.');
          }
        } catch (e) {
          alert(`닉네임 변경 중 오류가 발생하였습니다: ${e}`);
        }
      } else {
        alert('닉네임에 사용할 수 없는 문자가 있거나 비어있어 변경되지 않았습니다.')
      }
      location.reload();
    }
  }

  const onClickDelete = async () => {
    if (uid != null) {
      try {
        await deleteUser(authService.currentUser!);
        await getDoc(doc(db, 'user', uid!)).then(async (value: DocumentData) => {
          await updateDoc(doc(db, 'user', uid!), {
            'nickName': `del_${value["nickName"]}`,
            'deleted': true
          });
        });
        await signOut(authService);
        alert('정보삭제가 완료되었습니다.');
        router.push('/');
      } catch (e) {
        alert(`계정삭제 중 오류가 발생하였습니다: ${e}`);
      }
    } else {
      alert('아직 정보가 불러오기가 안 된 상태입니다.');
    }
  }

  const priceFormatting = (price: string) => {
    const parsedPrice = parseInt(price, 10);

    if (parsedPrice >= 10000) {
      if (parsedPrice % 10000 === 0) {
        return `${(parsedPrice / 10000).toLocaleString()}만원`;
      } else {
        const manWon = Math.floor(parsedPrice / 10000).toLocaleString();
        const won = (parsedPrice % 10000).toLocaleString();
        return `${manWon}만 ${won}원`;
      }
    } else {
      return parsedPrice.toLocaleString() + '원';
    }
  };

  const getWatchlistDocuments = async () => {
    if (myData != null) {
      setLoading(true);
      if (myData["watchlist"].length > (stackWatchlist * 10)) {
        try {
          for (let i = (stackWatchlist * 10); i < (myData["watchlist"].length >= (stackWatchlist + 1) * 10 ? (stackWatchlist + 1) * 10 : myData["watchlist"].length); i++) {
            await getDoc(doc(db, 'product', myData["watchlist"][i])).then((value: DocumentData) => {
              setWatchlistDocument((prev) => [...prev, value.data()]);
            })
          }
          setStackWatchlist(stackWatchlist + 1);
          setLoading(false);
        } catch (e) {
          alert(`관심목록을 불러오는 중 오류가 발생하였습니다: ${e}`);
          setLoading(false);
        }
      } else {
        alert('더 불러올 문서가 없습니다.');
        setLoading(false);
      }
    }
  }

  const getPostsDocuments = async () => {
    if (myData != null) {
      setLoading(true);
      if (myData["posts"].length > (stackPosts * 10)) {
        try {
          for (let i = (stackPosts * 10); i < (myData["posts"].length >= (stackPosts + 1) * 10 ? (stackPosts + 1) * 10 : myData["posts"].length); i++) {
            await getDoc(doc(db, 'product', myData["posts"][i])).then((value: DocumentData) => {
              setPostsDocument((prev) => [...prev, value.data()]);
            })
          }
          setStackPosts(stackPosts + 1);
          setLoading(false);
        } catch (e) {
          alert(`판매내역을 불러오는 중 오류가 발생하였습니다: ${e}`);
          setLoading(false);
        }
      } else {
        alert('더 불러올 문서가 없습니다.');
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    getUid();
  }, []);

  useEffect(() => {
    if (myData != null) {
      setMyProfileImage(myData["profile_image"]);
      setEmail(myData["email"])
    }
    getWatchlistDocuments();
    getPostsDocuments();
  }, [myData]);

  return (
    <article className={style.article}>
      <h1 className={style.h1}>프로필 편집</h1>
      <input className={style.inputFile} type="file" style={{ display: "none" }} accept="image/*" id="file" onChange={(e) => { setProfileImage(e.target.files![0]); setMyProfileImage(URL.createObjectURL(e.target.files![0])) }} />
      <label className={style.label} htmlFor="file">
        <div className={style.profileDiv}>
          {
            myProfileImage ?
              <img src={myProfileImage} className={style.profileImg} />
              : null
          }
        </div>
      </label>
      <p className={style.p}>닉네임(12자 이내)</p>
      <input className={style.input} value={nickname} maxLength={12} onChange={(e) => { if ((/^[a-zA-Zㄱ-힣0-9]*$/).test(e.target.value)) { setNickname(e.target.value); } }} placeholder={myData ? myData["nickName"] : ""} />
      <p className={style.p}>이메일</p>
      <input className={style.input} value={email} disabled />
      <div className={style.accountDiv}>
        <span className={style.save} onClick={() => {
          const confirm = window.confirm(`정말로 프로필 상태를 변경하시겠습니까?`);
          if (confirm) {
            onClickSave();
          }
        }}>저장</span>
        <span className={style.delete} onClick={() => {
          const confirm = window.confirm(`정말로 계정을 삭제하시겠습니까?`);
          if (confirm) {
            onClickDelete();
          }
        }}>계정삭제</span>
      </div>
      {/* 관심목록 */}
      <h2 className={style.h2}>관심목록</h2>
      <div className={style.products}>
        {watchlistsDocument.length !== 0 ? watchlistsDocument.map((value: { [key: string]: any } | null) => {
          if (value != null) {
            return (
              <Link href={`/detail/${value["product_id"]}`} key={value["product_id"]}>
                <div className={style.product} key={value["product_id"]}>
                  <div className={style.productsImgDiv}>
                    <img className={style.productsImg} src={value["images"][0]} />
                    {
                      parseInt(value["status"]) > 0 ?
                        <div className={style.statusDiv}>
                          {parseInt(value["status"]) == 1 ? <p>예약중</p> : <p>판매완료</p>}
                        </div> :
                        <></>
                    }
                  </div>
                  <p className={style.title}>{value["title"]}</p>
                  <p className={style.loctime}>{value["location"]} | {format(value["uploadTime"].toDate(), 'yy.MM.dd')}</p>
                  <p className={style.price}>
                    {
                      priceFormatting(value["price"])
                    }
                  </p>
                  <div className={style.likes}>
                    <Image className={style.mypageHeartIcon} src="/images/mypage/icon_heart.svg" alt="좋아요 아이콘" width={14} height={13} />
                    <span className={style.likesSpan}>{value["likes"].length}</span>
                  </div>
                </div>
              </Link>
            );
          } else {
            return null;
          }
        }) : (
          <div className={style.nullDiv} key="null">
            <span className={style.nullSpan}>게시글이 존재하지 않습니다.</span>
          </div>
        )}
        {
          watchlistsDocument !== null && watchlistsDocument.length % 5 !== 0 ? (
            Array.from({ length: 5 - (watchlistsDocument.length % 5) }).map((_, index) => (
              <div className={style.products} key={index}>
                <div className={style.productsImgDiv}>
                </div>
              </div>
            ))
          ) : null
        }
      </div>
      {watchlistsDocument.length !== 0 ? (
        loading ?
          <Image className={style.loadingImg} src="/images/mypage/loading.gif" alt="불러오는 중" width={170} height={50} /> :
          <div onClick={() => { getWatchlistDocuments(); }} className={style.moreButton}>
            <span>더 불러오기</span>
          </div>
      ) : null}
      {/* 판매내역 */}
      <h2 className={style.h2}>판매내역</h2>
      <div className={style.products}>
        {postsDocument.length !== 0 ? postsDocument.map((value: { [key: string]: any } | null) => {
          if (value != null) {
            return (
              <Link href={`/detail/${value["product_id"]}`} key={value["product_id"]}>
                <div className={style.product} key={value["product_id"]}>
                  <div className={style.productsImgDiv}>
                    <img className={style.productsImg} src={value["images"][0]} />
                    {
                      parseInt(value["status"]) > 0 ?
                        <div className={style.statusDiv}>
                          {parseInt(value["status"]) == 1 ? <p>예약중</p> : <p>판매완료</p>}
                        </div> :
                        <></>
                    }
                  </div>
                  <p className={style.title}>{value["title"]}</p>
                  <p className={style.loctime}>{value["location"]} | {format(value["uploadTime"].toDate(), 'yy.MM.dd')}</p>
                  <p className={style.price}>
                    {
                      priceFormatting(value["price"])
                    }
                  </p>
                  <div className={style.likes}>
                    <Image className={style.mypageHeartIcon} src="/images/mypage/icon_heart.svg" alt="좋아요 아이콘" width={14} height={13} />
                    <span className={style.likesSpan}>{value["likes"].length}</span>
                  </div>
                </div>
              </Link>
            );
          } else {
            return null;
          }
        }) : (
          <div className={style.nullDiv} key="null">
            <span className={style.nullSpan}>게시글이 존재하지 않습니다.</span>
          </div>
        )}
        {
          postsDocument !== null && postsDocument.length % 5 !== 0 ? (
            Array.from({ length: 5 - (postsDocument.length % 5) }).map((_, index) => (
              <div className={style.products} key={index}>
                <div className={style.productsImgDiv}>
                </div>
              </div>
            ))
          ) : null
        }
      </div>
      {postsDocument.length !== 0 ? (
        loading ?
          <Image className={`${style.loadingImg} ${style.last}`} src="/images/mypage/loading.gif" alt="불러오는 중" width={170} height={50} /> :
          <div onClick={() => { getPostsDocuments(); }} className={`${style.moreButton} ${style.last}`}>
            <span>더 불러오기</span>
          </div>
      ) : null}
    </article>
  );
}