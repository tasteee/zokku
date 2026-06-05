import { redirect } from "next/navigation";

const HomePage = (): never => {
  redirect("/documents");
};

export default HomePage;
