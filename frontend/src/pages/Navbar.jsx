import Icons from "./Icons.jsx";
import LogoutButton from "./LogoutButton.jsx";

const Navbar = () => (
  <div className="min-h-[10vh] bg-gray-50 dark:bg-gray-900">
    <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
      <div className="  px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center text-white">
            <Icons.Shield />
          </div>
          <h1 className="lg font-medium dark:text-white">RBAC Dashboard</h1>
        </div>
        <LogoutButton />
      </div>
    </div>
 
  </div>
);

export default Navbar;
