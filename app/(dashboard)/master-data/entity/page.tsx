"use client";

import { useEffect, useState } from "react";
import { Plus, Building2, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useEntities } from "@/hooks/useEntities";

interface Entity {
  id: string;
  code: string;
  name: string;
  type: string;
  city: string;
  status: string;
  created_at: string;
}

export default function EntityPage() {
  const { entities, loading, error, fetchEntities, deleteEntity } = useEntities();
  const [actionError, setActionError] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus entity ini?")) return;
    setActionError(null)
    try {
      await deleteEntity(id);
      await fetchEntities();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Gagal menghapus entity")
    }
  };

  useEffect(() => {
    fetchEntities();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Entity</h1>
            <p className="text-muted-foreground mt-1">Kelola cabang dan unit bisnis</p>
          </div>
          <Button disabled className="bg-emerald-600">
            <Plus className="w-4 h-4 mr-2" />
            Tambah Entity
          </Button>
        </div>
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Loading...
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Entity</h1>
            <p className="text-muted-foreground mt-1">Kelola cabang dan unit bisnis</p>
          </div>
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-2" />
            Tambah Entity
          </Button>
        </div>
        <Card className="border-red-500/20">
          <CardContent className="p-8 text-center">
            <p className="text-red-400">Error: {error}</p>
            <p className="text-muted-foreground text-sm mt-2">
              Pastikan tabel &quot;entities&quot; sudah dibuat di InsForge
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Entity</h1>
          <p className="text-muted-foreground mt-1">Kelola cabang dan unit bisnis</p>
        </div>
        <Link href="/master-data/entity/new">
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-2" />
            Tambah Entity
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 rounded-lg">
                <Building2 className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{entities.length}</p>
                <p className="text-sm text-muted-foreground">Total Entity</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 rounded-lg">
                <Building2 className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {entities.filter((e) => e.status === "active").length}
                </p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 rounded-lg">
                <Building2 className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {new Set(entities.map((e) => e.city)).size}
                </p>
                <p className="text-sm text-muted-foreground">Kota</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Entity</CardTitle>
        </CardHeader>
        <CardContent>
          {actionError && (
            <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {actionError}
            </div>
          )}
          {entities.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Belum ada entity</p>
              <p className="text-muted-foreground text-sm mt-1">
                Klik &quot;Tambah Entity&quot; untuk membuat entity pertama
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Kode</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                      Nama
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Tipe</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Kota</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {entities.map((entity) => (
                    <tr key={entity.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="py-3 px-4 text-foreground font-medium">{entity.code}</td>
                      <td className="py-3 px-4 text-foreground">
                        <span className="mr-2">{entity.name}</span>
                        {(entity as { is_headquarters?: boolean }).is_headquarters && (
                          <Badge className="border-amber-500/40 bg-amber-500/15 text-amber-400">
                            Kantor pusat
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="secondary" className="bg-muted text-foreground">
                          {entity.type}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-foreground">{entity.city || "-"}</td>
                      <td className="py-3 px-4">
                        <Badge
                          className={
                            entity.status === "active"
                              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                              : "bg-muted text-muted-foreground"
                          }
                        >
                          {entity.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/master-data/entity/${entity.id}/edit`}>
                          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-red-400"
                            onClick={() => handleDelete(entity.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
