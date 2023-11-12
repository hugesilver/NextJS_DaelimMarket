"use client";
import Image from "next/image";
import style from "./page.module.css";
import {
  DocumentData,
  arrayRemove,
  arrayUnion,
  deleteDoc,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { db, getUserUid } from "@/app/Firebase";
import { useRouter } from "next/navigation";
import { deleteObject, getStorage, listAll, ref } from "firebase/storage";

export default function Detail({ params }: { params: { id: string } }) {
  const router = useRouter();
  const statusList: Array<string> = ["판매중", "예약중", "거래완료"];

  const [document, setDocument] = useState<DocumentData | null>(null);
  const [dotIndex, setIndex] = useState<number>(0);
  const [status, setStatus] = useState(statusList[0]);
  const [uid, setUid] = useState<string | null>(null);
  const [profileImg, setProfileImg] = useState<string | null>(null);
  const [profileNickName, setProfileNickName] = useState<string | null>(null);

  const storage = getStorage();

  const getDocument = async () => {
    try {
      const productDocument = (
        await getDoc(doc(db, "product", params.id))
      ).data();
      if (productDocument != null) {
        setDocument(await productDocument);
        setStatus(statusList[parseInt(productDocument["status"])]);
        console.log("데이터를 불러옴(detail)");
      }
    } catch (e) {
      alert(`에러가 발생하였습니다: ${e}`);
      console.log(e);
    }
  };

  const getUid = async () => {
    setUid(await getUserUid());
    console.log("uid를 불러옴.");
  };

  useEffect(() => {
    getDocument();
    getUid();
  }, []);

  useEffect(() => {
    getPostedUserInfo();
  }, [uid, document]);

  const changeStatus = async (event: any) => {
    setStatus(event.target.value);
    try {
      await updateDoc(doc(db, "product", params.id), {
        status: statusList.indexOf(event.target.value),
      });
      await getDocument();
      alert(`${event.target.value} 상태로 변경하였습니다.`);
      console.log("판매 상태가 변경됨.");
    } catch (e) {
      alert(`판매 상태를 변경하는 중 오류가 발생하였습니다: ${e}`);
    }
  };

  const like = async () => {
    try {
      await updateDoc(doc(db, "product", params.id), {
        likes: arrayUnion(uid!),
      });
      await updateDoc(doc(db, "user", uid!), {
        watchlist: arrayUnion(params.id),
      });
      alert(`관심목록에 추가하였습니다.`);
      await getDocument();
      console.log("관심 목록 추가");
    } catch (e) {
      alert(`좋아요를 처리하는 중 오류가 발생하였습니다: ${e}`);
    }
  };

  const unLike = async () => {
    try {
      await updateDoc(doc(db, "product", params.id), {
        likes: arrayRemove(uid!),
      });
      await updateDoc(doc(db, "user", uid!), {
        watchlist: arrayRemove(params.id),
      });
      alert(`관심목록에 제거하였습니다.`);
      await getDocument();
      console.log("관심 목록 제거");
    } catch (e) {
      alert(`좋아요를 취소하던 중 오류가 발생하였습니다: ${e}`);
    }
  };

  const deletePost = async () => {
    try {
      await deleteDoc(doc(db, "product", params.id));
      await updateDoc(doc(db, "user", uid!), {
        posts: arrayRemove(params.id),
      });
      await Promise.all(
        (
          await listAll(ref(storage, `product/${params.id}`))
        ).items.map(async (item) => {
          await deleteObject(item);
        })
      );
      alert("판매글을 삭제했어요.");
      router.push("/");
    } catch (e) {
      console.log(e);
      alert(`삭제하는 중 오류가 발생하였습니다: ${e}`);
    }
  };

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
      return parsedPrice.toLocaleString() + "원";
    }
  };

  const onClickGoToChat = async () => {
    if (uid != null && document != null) {
      await getDoc(doc(db, "chat", uid!)).then(async (value: DocumentData) => {
        if (value[`${document!["uid"]}`] != undefined) {
          await updateDoc(doc(db, "chat", uid!), {
            [document!["uid"]]: [],
          });
        }
      });
    }
    router.push("/chat");
  };

  const getPostedUserInfo = async () => {
    if (document != null) {
      try {
        await getDoc(doc(db, "user", document!["uid"])).then(
          (value: DocumentData) => {
            setProfileImg(value.data()["profile_image"]);
            setProfileNickName(value.data()["nickName"]);
          }
        );
      } catch (e) {
        alert(`유저의 프로필을 불러오는 중 오류가 발생하였습니다: ${e}`);
        console.log(e);
      }
    }
  };

  return (
    <>
      <title>{document != null ? document["title"] : "대림마켓"}</title>
      <article className={style.article}>
        {document != null ? (
          <>
            <div className={style.detailTopDiv}>
              <div className={style.alignImgDiv}>
                <div
                  className={style.productImgDiv}
                  style={{ marginLeft: `${-100 * dotIndex}%` }}
                >
                  {document["images"].map((value: string, index: number) => {
                    return (
                      <img
                        className={style.productImg}
                        src={value}
                        key={index}
                        alt="상품 이미지"
                      />
                    );
                  })}
                  {parseInt(document["status"]) > 0 ? (
                    <div className={style.statusImgDiv}>
                      {parseInt(document["status"]) == 1 ? (
                        <p>예약중</p>
                      ) : (
                        <p>판매완료</p>
                      )}
                    </div>
                  ) : (
                    <></>
                  )}
                </div>
                <div className={style.dots}>
                  {document["images"].map((_: string, index: number) => {
                    return (
                      <div
                        className={style.dot}
                        onClick={() => setIndex(index)}
                        style={{
                          backgroundColor:
                            index == dotIndex ? "#FFFFFF" : "#ACACAC",
                        }}
                        key={`dot${index}`}
                      ></div>
                    );
                  })}
                </div>
              </div>
              <div className={style.infoDiv}>
                <div className={style.infoesDiv}>
                  <h1 className={style.title}>{document["title"]}</h1>
                  <p className={style.price}>
                    {priceFormatting(document["price"])}
                  </p>
                  <div className={style.userInfoDiv}>
                    <div className={style.profileDiv}>
                      {profileImg != null && profileImg != "" ? (
                        <img
                          src={profileImg}
                          alt={`${document["nickName"]}의 프로필 사진`}
                        />
                      ) : null}
                    </div>
                    <p className={style.nickname}>
                      {profileNickName != null && profileNickName != ""
                        ? profileNickName
                        : null}
                    </p>
                  </div>
                  <p className={style.location}>
                    거래장소: {document["location"]}
                  </p>
                  <p className={style.uploadtime}>
                    등록일:{" "}
                    {format(
                      document["uploadTime"].toDate(),
                      "yyyy년 MM월 dd일 aa h시 mm분 ss초",
                      { locale: ko }
                    )}
                  </p>
                  {document["uid"] == uid ? (
                    <span
                      className={style.delete}
                      onClick={() => {
                        const confirm =
                          window.confirm(`정말로 판매글을 삭제하시겠습니까?`);
                        if (confirm) {
                          deletePost();
                        }
                      }}
                    >
                      삭제하기
                    </span>
                  ) : (
                    <></>
                  )}
                </div>
                <div className={style.buttonsDiv}>
                  <div
                    className={style.likeDiv}
                    onClick={() => {
                      if (uid != null) {
                        if (document["likes"].includes(uid)) {
                          unLike();
                        } else {
                          like();
                        }
                      } else {
                        alert("로그인이 필요합니다.");
                        router.push("/login");
                      }
                    }}
                  >
                    <Image
                      className={style.likeImg}
                      src={
                        document["likes"].includes(uid)
                          ? "/images/detail/icon_heart_fill.svg"
                          : "/images/detail/icon_heart.svg"
                      }
                      alt="관심 아이콘"
                      width={33}
                      height={29}
                    />
                    <span>관심 {document["likes"].length}</span>
                  </div>
                  {document["uid"] != uid ? (
                    <div
                      className={style.chatDiv}
                      onClick={() => onClickGoToChat()}
                    >
                      <Image
                        className={style.chatImg}
                        src="/images/detail/icon_chat.svg"
                        alt="채팅 아이콘"
                        width={33}
                        height={29}
                      />
                      <span>채팅하기</span>
                    </div>
                  ) : (
                    <></>
                  )}
                  {document["uid"] == uid &&
                  parseInt(document["status"]) < 2 ? (
                    <div className={style.statusDiv}>
                      <select
                        className={style.select}
                        value={status}
                        onChange={(event) => {
                          const confirm = window.confirm(
                            `정말로 ${event.target.value} 상태로 바꾸시겠습니까?`
                          );
                          if (confirm) {
                            changeStatus(event);
                          }
                        }}
                      >
                        {statusList.map((value) => {
                          return (
                            <option
                              className={style.option}
                              key={value}
                              value={value}
                            >
                              {value}
                            </option>
                          );
                        })}
                      </select>
                      <Image
                        className={style.homeArrowDownIcon}
                        src="/images/home/icon_arrow_down.svg"
                        alt="아래 화살표"
                        width={10}
                        height={10}
                      />
                    </div>
                  ) : (
                    <></>
                  )}
                </div>
              </div>
            </div>
            <div className={style.detailLine} />
            <h2 className={style.descH2}>상품설명</h2>
            <p className={style.detailDesc}>{document["desc"]}</p>
          </>
        ) : (
          <span className={style.nullSpan}>정보를 불러올 수 없습니다.</span>
        )}
      </article>
    </>
  );
}
