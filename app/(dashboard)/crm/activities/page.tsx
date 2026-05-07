"use client"

import { useState } from "react"
import Link from "next/link"
import { Activity, Plus, Phone, Mail, MessageSquare, Calendar, CheckCircle2, Clock, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useActivities } from "@/hooks/useActivities"

const getActivityIcon = (type: string) => {
  const icons: Record<string, React.ReactNode> = {
    call: <Phone className="w-4 h-4" />,
    email: <Mail className="w-4 h-4" />,
    meeting: <Calendar className="w-4 h-4" />,
    demo: <Activity className="w-4 h-4" />,
    whatsapp: <MessageSquare className="w-4 h-4" />,
    proposal: <CheckCircle2 className="w-4 h-4" />,
    visit: <Calendar className="w-4 h-4" />,
    note: <Activity className="w-4 h-4" />,
    task: <CheckCircle2 className="w-4 h-4" />,
  }
  return icons[type] || <Activity className="w-4 h-4" />
}

const getActivityColor = (type: string) => {
  const colors: Record<string, string> = {
    call: "bg-blue-500/20 text-blue-400",
    email: "bg-purple-500/20 text-purple-400",
    meeting: "bg-amber-500/20 text-amber-400",
    demo: "bg-emerald-500/20 text-emerald-400",
    whatsapp: "bg-green-500/20 text-green-400",
    proposal: "bg-pink-500/20 text-pink-400",
    visit: "bg-orange-500/20 text-orange-400",
    note: "bg-muted-foreground/40/20 text-muted-foreground",
    task: "bg-cyan-500/20 text-cyan-400",
  }
  return colors[type] || "bg-muted-foreground/40/20 text-muted-foreground"
}

export default function ActivitiesPage() {
  const { activities, loading } = useActivities()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Activity className="w-6 h-6 text-emerald-500" />
            Aktivitas CRM
          </h1>
          <p className="text-muted-foreground mt-1">Log aktivitas dan follow-up</p>
        </div>
        <Link href="/crm/activities/new">
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-2" />
            Log Aktivitas
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        </div>
      ) : activities.length > 0 ? (
        <div className="space-y-3">
          {activities.map((activity: any) => (
            <Card key={activity.id} className={`bg-card border-border ${activity.is_completed ? 'opacity-60' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getActivityColor(activity.activity_type)}`}>
                    {getActivityIcon(activity.activity_type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-medium ${activity.is_completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{activity.subject}</h3>
                      {activity.is_completed && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{activity.description}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{activity.crm_leads?.contact_name || activity.crm_leads?.company_name || '-'}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{activity.scheduled_at ? new Date(activity.scheduled_at).toLocaleString('id-ID') : '-'}</span>
                    </div>
                  </div>
                  <Badge variant="outline" className="border-border text-muted-foreground capitalize">{activity.activity_type}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Belum ada aktivitas CRM</p>
          <p className="text-sm mt-1">Tambahkan aktivitas pertama Anda</p>
        </div>
      )}
    </div>
  )
}
