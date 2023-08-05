import { useEffect } from "react";
import style from "./page.module.css";

export default function UserList({ user, userData, chatData }: any) {
  return (
    <div className={style.listDiv} key={user}>
      <div className={style.userProfile}>
        {
          userData!["profile_image"] != '' ?
            (
              <img src={userData!["profile_image"]} alt={`${userData!["nickName"]}의 프로필 이미지`} />
            )
            : null
        }
      </div>
      <div className={style.userInfo}>
        <p>{userData!.hasOwnProperty("deleted") ? "탈퇴한 사용자" : userData!["nickName"]}</p>
        <p>{(() => {
          console.log(chatData![user][chatData![user].length - 1]);
          switch (chatData![user][chatData![user].length - 1]["type"]) {
            case "text":
              chatData![user][chatData![user].length - 1]["text"];
            case "image":
              "이미지를 보냈습니다.";
            default:
              return "메시지를 보냈습니다.";
          }
        })()}</p>
      </div>
    </div>
  );
}