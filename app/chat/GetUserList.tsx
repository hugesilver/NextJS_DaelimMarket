import { doc, getDoc } from "firebase/firestore";
import { db } from "../Firebase";
import UserList from "./UserList";

export default function GetUserList({ chatData }: any) {
  const getUserData = async (user: string) => {
    try {
      const data = (await getDoc(doc(db, 'user', user))).data();
      return data;
    } catch (e) {
      alert(`채팅 유저 목록을 불러오는 도중 오류가 발생했습니다: ${e}`);
      return null;
    }
  }

  return (
    <>
      {
        Object.keys(chatData!).forEach(async (key) => {
          const userData = await getUserData(key);
          return <UserList key={key} user={key} userData={userData} chatData={chatData} />
        })
      }
    </>
  );
}