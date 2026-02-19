import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, UserPlus } from "lucide-react";
import { useAdminEmployeeData,useAdminEmployeeDeleteByemail } from "@/api/hooks";

const INITIAL_USERS = [
  { name: "Admin User", email: "admin@example.com", role: "ADMIN" },
  { name: "HR Manager", email: "mod1@example.com", role: "HR" },
  { name: "Employee User", email: "user1@example.com", role: "EMPLOYEE" },
];

export default function AdminDashboard() {
  const [users, setUsers] = useState(INITIAL_USERS);
  // const {data:  users,isLoading} =useAdminEmployeeData();

  const handleDelete = (email: string) => {
    setUsers(users.filter((u) => u.email !== email));
    // useAdminEmployeeDeleteByemail(email)
  };

  const handleAdd = () => {
    const name = prompt("Enter name");
    const email = prompt("Enter email");
    const role = prompt("Enter role (ADMIN/HR/EMPLOYEE)");

    if (name && email && role) {
      setUsers([...users, { name, email, role }]);
    }
    
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "destructive";
      case "HR":
        return "default";
      default:
        return "secondary";
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <Card className="border-2 border-border shadow-md">
        <CardHeader className="flex flex-row items-center justify-between border-b-2 border-border">
          <CardTitle className="text-2xl">User Management</CardTitle>
          <Button onClick={handleAdd} className="flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            Add User
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.email}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(u.role) as any}>
                      {u.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(u.email)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
