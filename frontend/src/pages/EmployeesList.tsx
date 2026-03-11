import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useEmployees } from "@/api/hooks";

export default function EmployeeList() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { data: employees = [], isLoading, isError, refetch } = useEmployees();

  const filtered = employees.filter((e) =>
    e.name.toLowerCase().includes(query.toLowerCase()) ||
    e.email.toLowerCase().includes(query.toLowerCase()) ||
    e.skills.some((s) => s.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <Card className="border-2 border-border shadow-md">
        <CardHeader className="border-b-2 border-border">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">Employees</CardTitle>
            {!isLoading && (
              <span className="text-sm text-muted-foreground">{filtered.length} / {employees.length} shown</span>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <Input placeholder="Search by name, email or skill…" value={query} onChange={(e) => setQuery(e.target.value)} />

          {isLoading && (
            <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 rounded" />)}</div>
          )}

          {isError && (
            <div className="text-center py-8">
              <p className="text-destructive mb-2">Failed to load employees</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
            </div>
          )}

          {!isLoading && !isError && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Skills</TableHead>
                  <TableHead>Experience</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((e) => (
                  <TableRow key={e.employee_id}>
                    <TableCell className="font-medium">{e.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{e.email}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {e.skills.map((s) => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}
                      </div>
                    </TableCell>
                    <TableCell>{e.experience} yrs</TableCell>
                    <TableCell>
                      <Badge variant={e.status === "Allocated" ? "default" : "secondary"}>{e.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => navigate(`/hr/employees/${e.employee_id}`)}>
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">No employees found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
