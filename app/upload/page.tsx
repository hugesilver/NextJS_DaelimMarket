"use client";

import { useEffect, useState } from "react";
import style from "./page.module.css";
import Image from "next/image";
import { db, getUserUid } from "../Firebase";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import {
  DocumentData,
  arrayUnion,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from "firebase/firestore";

export default function Upload() {
  const router = useRouter();
  const storage = getStorage();

  const locationList: Array<string> = [
    "전체",
    "다산관",
    "생활관",
    "수암관",
    "율곡관",
    "임곡관",
    "자동차관",
    "전산관",
    "정보통신관",
    "퇴계관",
    "한림관",
    "홍지관",
  ];

  const [uid, setUid] = useState<string | null>(null);
  const [userData, setUserData] = useState<DocumentData | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [title, setTitle] = useState<string>("");
  const [price, setPrice] = useState<string>("");
  const [location, setLocation] = useState<string>(locationList[0]);
  const [desc, setDesc] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const getUid = async () => {
    try {
      const value = await getUserUid();

      if (value == null) {
        alert("로그인이 필요합니다.");
        router.push("/");
      } else {
        setUid(value);
        const document: DocumentData = await getDoc(doc(db, "user", value));
        setUserData(document);
      }
    } catch (e) {
      alert(`upload 페이지에서 유저 정보를 불러오다가 오류 발생: ${e}`);
    }
    console.log("uid를 불러옴.");
  };

  const onChangeUpload = (event: any) => {
    const files = event.target.files;
    const selectedImages: File[] = [];

    if (images.length + files.length > 4) {
      alert("사진은 최대 5장까지 가능합니다.");
      return;
    }

    for (let i = 0; i < files.length; i++) {
      if (!files[i].type.startsWith("image/")) {
        alert("사진 파일만 업로드 할 수 있습니다.");
        return;
      } else if (files[i].size > 5 * (1024 * 1024)) {
        alert("개당 5MB 이하의 사진만 업로드 가능합니다.");
        return;
      } else {
        selectedImages.push(files[i]);
      }
    }

    setImages((prev) => [...prev, ...selectedImages]);
  };

  const onClickDelete = (idx: number) => {
    setImages((prev) => prev.filter((file, index) => index !== idx));
  };

  const onChangeNumber = (event: any) => {
    if (/^[0-9]+$/.test(event.target.value) || event.target.value == "") {
      setPrice(event.target.value);
    } else {
      return;
    }
  };

  const onClickUpload = async () => {
    if (images.length === 0) {
      alert("이미지를 선택해주세요.");
      return;
    } else if (title === "") {
      alert("제목을 작성하세요.");
      return;
    } else if (price === "" || !/^[0-9]+$/.test(price)) {
      alert("가격을 작성하세요.");
      return;
    } else if (userData == null || uid == null) {
      alert("회원정보를 불러오는 중 오류가 발생하였습니다.");
      return;
    } else {
      try {
        setIsLoading(true);
        const now = new Date();
        const productId = `${format(now, "yyyyMMddHHmmss")}_${
          userData.data()["id"]
        }`;

        const downloadUrls = await Promise.all(
          images.map(async (value, index) => {
            const fileName = `${productId}_${index}.${value.name
              .split(".")
              .pop()}`;
            const storageRef = ref(storage, `product/${productId}/${fileName}`);
            const snapshot = await uploadBytes(storageRef, value);
            const url = await getDownloadURL(snapshot.ref);
            return url;
          })
        );

        await updateDoc(doc(db, "user", uid), {
          posts: arrayUnion(productId),
        });

        await setDoc(doc(db, "product", productId), {
          id: userData.data()["id"],
          uid: uid,
          product_id: productId,
          nickName: userData.data()["nickName"],
          price: price,
          title: title,
          location: location,
          desc: desc,
          images: downloadUrls,
          likes: [],
          uploadTime: now,
          status: 0,
        });

        alert("성공적으로 판매글을 등록했어요!");
        router.push("/");
      } catch (e) {
        alert(`업로드 중 오류가 생겼습니다: ${e}`);

        console.log(e);
      }
    }
  };

  useEffect(() => {
    getUid();
  }, []);

  return (
    <article className={style.article}>
      <div className={style.imageTitle}>
        <h3 className={style.h3}>상품 이미지</h3>
        <input
          className={style.inputFile}
          type="file"
          multiple
          accept="image/*"
          id="file"
          disabled={isLoading ? true : false}
          onChange={(e) => onChangeUpload(e)}
        />
        <label className={style.label} htmlFor="file">
          업로드
        </label>
      </div>
      <div className={style.uploadDiv}>
        <div>
          {images[0] != null ? (
            <>
              <img
                className={style.uploadImg}
                src={URL.createObjectURL(images[0])}
                alt="상품 이미지 1"
              />
              <Image
                className={style.deleteImg}
                src="/images/upload/icon_delete.svg"
                alt="1번째 상품 이미지 삭제"
                width={29}
                height={29}
                onClick={() => {
                  onClickDelete(0);
                }}
              />
            </>
          ) : null}
        </div>
        <div>
          {images[1] != null ? (
            <>
              <img
                className={style.uploadImg}
                src={URL.createObjectURL(images[1])}
                alt="상품 이미지 2"
              />
              <Image
                className={style.deleteImg}
                src="/images/upload/icon_delete.svg"
                alt="2번째 상품 이미지 삭제"
                width={29}
                height={29}
                onClick={() => {
                  onClickDelete(1);
                }}
              />
            </>
          ) : null}
        </div>
        <div>
          {images[2] != null ? (
            <>
              <img
                className={style.uploadImg}
                src={URL.createObjectURL(images[2])}
                alt="상품 이미지 3"
              />
              <Image
                className={style.deleteImg}
                src="/images/upload/icon_delete.svg"
                alt="3번째 상품 이미지 삭제"
                width={29}
                height={29}
                onClick={() => {
                  onClickDelete(2);
                }}
              />
            </>
          ) : null}
        </div>
        <div>
          {images[3] != null ? (
            <>
              <img
                className={style.uploadImg}
                src={URL.createObjectURL(images[3])}
                alt="상품 이미지 4"
              />
              <Image
                className={style.deleteImg}
                src="/images/upload/icon_delete.svg"
                alt="4번째 상품 이미지 삭제"
                width={29}
                height={29}
                onClick={() => {
                  onClickDelete(3);
                }}
              />
            </>
          ) : null}
        </div>
        <div>
          {images[4] != null ? (
            <>
              <img
                className={style.uploadImg}
                src={URL.createObjectURL(images[4])}
                alt="상품 이미지 5"
              />
              <Image
                className={style.deleteImg}
                src="/images/upload/icon_delete.svg"
                alt="4번째 상품 이미지 삭제"
                width={29}
                height={29}
                onClick={() => {
                  onClickDelete(4);
                }}
              />
            </>
          ) : null}
        </div>
      </div>
      <h3 className={style.h3}>제목</h3>
      <input
        className={style.inputText}
        type="text"
        maxLength={25}
        value={title}
        disabled={isLoading ? true : false}
        onChange={(e) => {
          setTitle(e.target.value);
        }}
      />
      <h3 className={style.h3}>가격</h3>
      <input
        className={style.inputNumber}
        type="text"
        maxLength={8}
        value={price}
        disabled={isLoading ? true : false}
        onChange={(e) => {
          onChangeNumber(e);
        }}
      />
      <h3 className={style.h3}>장소</h3>
      <div className={style.locationDiv}>
        <select
          className={style.select}
          value={location}
          disabled={isLoading ? true : false}
          onChange={(event) => {
            setLocation(event.target.value);
          }}
        >
          {locationList.map((value) => {
            return (
              <option className={style.option} key={value} value={value}>
                {value}
              </option>
            );
          })}
        </select>
        <Image
          className={style.homeArrowDownIcon}
          src="/images/upload/icon_arrow_down.svg"
          alt="아래 화살표"
          width={10}
          height={10}
        />
      </div>
      <h3 className={style.h3}>설명</h3>
      <textarea
        className={style.textarea}
        maxLength={128}
        disabled={isLoading}
        onChange={(e) => {
          setDesc(e.target.value);
        }}
      />
      <button
        className={style.button}
        onClick={() => {
          if (isLoading == false) {
            const confirm = window.confirm(`정말로 업로드하시겠습니까?`);
            if (confirm) {
              onClickUpload();
            }
          }
        }}
      >
        판매글 올리기
      </button>
    </article>
  );
}
