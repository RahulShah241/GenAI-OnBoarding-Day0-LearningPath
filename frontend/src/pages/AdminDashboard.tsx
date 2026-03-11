import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, UserPlus, Loader2, AlertCircle, Users } from "lucide-react";
import { useEmployees, useRegisterUser, type RegisterPayload } from "@/api/hooks";
import { Data } from "@/store/Data";
import { toast } from "sonner";

// ─── Add User Dialog ──────────────────────────────────────────────────────────
function AddUserDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState<RegisterPayload>({
    employee_id: "", name: "", email: "", password: "",
    role: "EMPLOYEE", skills: [], experience: 0, status: "Bench",
    designation: "", department: "",
  });

  const { mutate: register, isPending, error, reset } = useRegisterUser();

  const set = (field: keyof RegisterPayload, val: string | number) =>
    setForm((p) => ({ ...p, [field]: val }));

  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = () => {
    if (!form.employee_id || !form.name || !form.email || !form.password) {
      toast.error("ID, name, email and password are required");
      return;
    }
    register(form, {
      onSuccess: (emp) => {
        toast.success(`${emp.name} registered successfully`);
        handleClose();
        setForm({ employee_id: "", name: "", email: "", password: "", role: "EMPLOYEE", skills: [], experience: 0, status: "Bench", designation: "", department: "" });
      },
      onError: (err: Error) => toast.error(err.message),
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Register New User</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive flex items-center gap-2 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />{(error as Error).message}
            </div>
          )}
          <Input placeholder="Employee ID  e.g. E007" value={form.employee_id} onChange={(e) => set("employee_id", e.target.value)} />
          <Input placeholder="Full Name" value={form.name} onChange={(e) => set("name", e.target.value)} />
          <Input placeholder="Email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
          <Input placeholder="Password" type="password" value={form.password} onChange={(e) => set("password", e.target.value)} />
          <Select value={form.role} onValueChange={(v) => set("role", v)}>
            <SelectTrigger><SelectValue placeholder="Role" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="EMPLOYEE">Employee</SelectItem>
              <SelectItem value="HR">HR</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
            </SelectContent>
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Designation (optional)" value={form.designation ?? ""} onChange={(e) => set("designation", e.target.value)} />
            <Input placeholder="Department (optional)" value={form.department ?? ""} onChange={(e) => set("department", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Experience (yrs)</label>
              <Input type="number" min="0" value={form.experience} onChange={(e) => set("experience", parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Status</label>
              <Select value={form.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bench">Bench</SelectItem>
                  <SelectItem value="Allocated">Allocated</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isPending}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Registering…</> : "Register User"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
const ROLE_BADGE: Record<string, "destructive" | "default" | "secondary"> = {
  ADMIN: "destructive",
  HR: "default",
  EMPLOYEE: "secondary",
};

export default function AdminDashboard() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const currentUser = Data((state) => state.user);

  const { data: employees = [], isLoading } = useEmployees();

  const filtered = employees.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: employees.length,
    admins: employees.filter((e) => e.role === "ADMIN").length,
    hr: employees.filter((e) => e.role === "HR").length,
    employees: employees.filter((e) => e.role === "EMPLOYEE").length,
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Users", value: stats.total, color: "text-foreground" },
          { label: "Admins", value: stats.admins, color: "text-destructive" },
          { label: "HR", value: stats.hr, color: "text-blue-600" },
          { label: "Employees", value: stats.employees, color: "text-green-600" },
        ].map((s) => (
          <Card key={s.label} className="border-2 border-border">
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main table */}
      <Card className="border-2 border-border shadow-md">
        <CardHeader className="flex flex-row items-center justify-between border-b-2 border-border">
          <CardTitle className="text-2xl flex items-center gap-2">
            <Users className="w-5 h-5" /> User Management
          </CardTitle>
          <Button onClick={() => setDialogOpen(true)} className="flex items-center gap-2">
            <UserPlus className="w-4 h-4" /> Add User
          </Button>
        </CardHeader>

        <CardContent className="space-y-4 pt-4">
          <Input
            placeholder="Search by name, email or role…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 rounded" />)}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((u) => (
                  <TableRow key={u.employee_id} className={u.employee_id === currentUser?.employee_id ? "bg-primary/5" : ""}>
                    <TableCell className="font-mono text-xs">{u.employee_id}</TableCell>
                    <TableCell className="font-medium">
                      {u.name}
                      {u.employee_id === currentUser?.employee_id && (
                        <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{u.email}</TableCell>
                    <TableCell>
                      <Badge variant={ROLE_BADGE[u.role] ?? "secondary"}>{u.role}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{u.designation ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={u.status === "Allocated" ? "default" : "secondary"}>
                        {u.status ?? "—"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                      No users found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AddUserDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  );
}
