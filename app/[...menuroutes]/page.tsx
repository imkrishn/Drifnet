import Home from "@/components/Home";

const Page = async ({ params }: { params: any }) => {
  const paramValue = await params;
  const menuRoutes = paramValue.menuroutes;

  return <div className="w-screen">{menuRoutes[0] === "home" && <Home />}</div>;
};

export default Page;
