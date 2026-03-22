import Home from "@/components/Home";
import ProfileCard from "@/components/Profile";

const Page = async ({ params }: { params: any }) => {
  const paramValue = await params;
  const menuRoutes = paramValue.menuroutes;

  return (
    <div className="w-screen">
      {menuRoutes[0] === "home" && <Home />}
      {menuRoutes[0] === "view" && (
        <div className="min-h-screen  flex items-center justify-end lg:mx-14 ">
          <ProfileCard />
        </div>
      )}
    </div>
  );
};

export default Page;
