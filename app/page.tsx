"use client";

import { useEffect, useState } from "react";
import { QueryDocumentSnapshot, collection, getDocs, limit, orderBy, query, startAfter, where } from "firebase/firestore";
import Image from "next/image";
import style from "./page.module.css";
import { format } from "date-fns";
import Link from "next/link";
import { db } from "./Firebase";

export default function Root() {
  const locationList: Array<string> = [
    '전체',
    '다산관',
    '생활관',
    '수암관',
    '율곡관',
    '임곡관',
    '자동차관',
    '전산관',
    '정보통신관',
    '퇴계관',
    '한림관',
    '홍지관',
  ];

  const limits: number = 10;

  const [loading, setLoading] = useState<Boolean>(true);
  const [location, setLocation] = useState(locationList[0]);
  const [inputValue, setInputValue] = useState<string>("");
  const [products, setProducts] = useState<Array<object | null>>([]);
  const [lastDocument, setLastDocument] = useState<QueryDocumentSnapshot | null>(null);

  const getProducts = async () => {
    try {
      let productQuery;
      if (location == locationList[0]) {
        if (inputValue == "") {
          productQuery = query(
            collection(db, "product"),
            where("status", "<", 2),
            orderBy("status"),
            orderBy("uploadTime", "desc"),
            limit(limits),
          );
        } else {
          productQuery = query(
            collection(db, "product"),
            where("title", ">=", inputValue),
            where("title", "<=", `${inputValue}\uf8ff`),
            orderBy('title'),
            orderBy("uploadTime", "desc"),
            limit(limits),
          );
        }
      }
      else {
        if (inputValue == "") {
          productQuery = query(
            collection(db, "product"),
            where("location", "==", location),
            where("status", "<", 2),
            orderBy("status"),
            orderBy("uploadTime", "desc"),
            limit(limits),
          );
        } else {
          productQuery = query(
            collection(db, "product"),
            where("title", ">=", inputValue),
            where("title", "<=", `${inputValue}\uf8ff`),
            where("location", "==", location),
            orderBy('title'),
            orderBy("uploadTime", "desc"),
            limit(limits),
          );
        }
      }
      const productsDocuments = await getDocs(productQuery);
      setLastDocument(productsDocuments.docs[productsDocuments.docs.length - 1] || null);
      productsDocuments.forEach((result) => {
        setProducts((prev) => [...prev, result.data()]);
      });
      setLoading(false);
      console.log("데이터를 불러옴(home)");
    }
    catch (e) {
      alert(`상품 정보를 불러오는 중 에러가 발생하였습니다: ${e}`);
      console.log(e);
      setLoading(false);
      setProducts([]);
    }
  }

  const getNextProducts = async (last: QueryDocumentSnapshot | null) => {
    try {
      let productQuery;
      if (location == locationList[0]) {
        if (inputValue == "") {
          productQuery = query(
            collection(db, "product"),
            where("status", "<", 2),
            orderBy("status"),
            orderBy("uploadTime", "desc"),
            startAfter(last),
            limit(limits),
          );
        } else {
          productQuery = query(
            collection(db, "product"),
            where("title", ">=", inputValue),
            where("title", "<=", `${inputValue}\uf8ff`),
            orderBy('title'),
            orderBy("uploadTime", "desc"),
            startAfter(last),
            limit(limits),
          );
        }
      } else {
        if (inputValue == "") {
          productQuery = query(
            collection(db, "product"),
            where("location", "==", location),
            where("status", "<", 2),
            orderBy("status"),
            orderBy("uploadTime", "desc"),
            startAfter(last),
            limit(limits),
          );
        } else {
          productQuery = query(
            collection(db, "product"),
            where("title", ">=", inputValue),
            where("title", "<=", `${inputValue}\uf8ff`),
            where("location", "==", location),
            orderBy('title'),
            orderBy("uploadTime", "desc"),
            startAfter(last),
            limit(limits),
          );
        }
      }
      const productsDocuments = await getDocs(productQuery);
      setLastDocument(productsDocuments.docs[productsDocuments.docs.length - 1] || null);
      productsDocuments.forEach((result) => {
        setProducts((prev) => [...prev, result.data()]);
      });
      setLoading(false);
      console.log("데이터를 추가로 불러옴(home)");
    }
    catch (e) {
      alert(`데이터를 추가로 불러오던 중 에러가 발생하였습니다: ${e}`);
      console.log(e);
      setLoading(false);
    }
  }

  const resetProducts = async () => {
    setProducts([]);
    setLastDocument(null);
    await getProducts();
  }

  useEffect(() => {
    resetProducts();
  }, []);

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

  return (
    <article className={style.article}>
      <div className={style.homeTop}>
        <div className={style.homeLocationDiv}>
          <select className={style.select} value={location} onChange={(event) => { setLocation(event.target.value); }}>
            {locationList.map((value) => {
              return <option className={style.option} key={value} value={value}>{value}</option>;
            })}
          </select>
          <Image className={style.homeArrowDownIcon} src="/images/home/icon_arrow_down.svg" alt="아래 화살표" width={10} height={10} />
        </div>
        <div className={style.homeSearchDiv}>
          <input className={style.input} onChange={(event) => { setInputValue(event.target.value); }} onKeyPress={(event) => { if (event.key == 'Enter') { resetProducts(); } }} />
          <div className={style.homeSearchIconDiv} onClick={() => { resetProducts(); }}>
            <Image className={style.homeSearchIcon} src="/images/home/icon_search.svg" alt="돋보기" width={24} height={24} />
          </div>
        </div>
      </div>
      <h1 className={style.locationH1}>현재 <b className={style.locationBold}>{location}</b>의 거래글을 보고 있습니다.</h1>
      <section className={style.section}>
        <div className={style.products}>
          {products.length !== 0 ? products.map((value: { [key: string]: any } | null) => {
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
                      <Image className={style.homeHeartIcon} src="/images/home/icon_heart.svg" alt="좋아요 아이콘" width={14} height={13} />
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
            products !== null && products.length % 5 !== 0 ? (
              Array.from({ length: 5 - (products.length % 5) }).map((_, index) => (
                <div className={style.products} key={index}>
                  <div className={style.productsImgDiv}>
                  </div>
                </div>
              ))
            ) : null
          }
        </div>
        {products.length !== 0 ? (
          loading ?
            <Image className={style.loadingImg} src="/images/home/loading.gif" alt="불러오는 중" width={170} height={50} /> :
            <div onClick={() => { if (lastDocument != null) { setLoading(true); getNextProducts(lastDocument); } else { setLoading(false); alert('마지막 항목입니다.'); } }} className={style.moreButton}>
              <span>더 불러오기</span>
            </div>
        ) : null}
      </section>
    </article>
  );
}