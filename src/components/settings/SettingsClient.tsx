"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { UserSettings, Category } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash2, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import { CATEGORY_ICONS } from "@/lib/categories";
import { ICON_MAP } from "@/components/reminders/CategoryIcon";
import { cn } from "@/lib/utils";

type CategoryWithCount = Category & { _count: { reminders: number } };

interface SettingsClientProps {
  settings: UserSettings;
  categories: CategoryWithCount[];
  user: { name: string | null; email: string | null };
}

const RECURRENCE_LABELS: Record<string, string> = {
  NONE: "None", DAILY: "Daily", WEEKLY: "Weekly", MONTHLY: "Monthly", YEARLY: "Yearly",
};

export function SettingsClient({ settings, categories, user }: SettingsClientProps) {
  const router = useRouter();
  const [emailOn, setEmailOn] = useState(settings.emailNotifications);
  const [advanceDays, setAdvanceDays] = useState(settings.defaultAdvanceDays);
  const [frequency, setFrequency] = useState(settings.emailDigestFrequency);
  const [discordOn, setDiscordOn] = useState(settings.discordNotifications);
  const [discordWebhook, setDiscordWebhook] = useState(settings.discordWebhookUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [testingDiscord, setTestingDiscord] = useState(false);

  const [newCatName, setNewCatName] = useState("");
  const [newCatIcon, setNewCatIcon] = useState<string>("star");
  const [newCatColor, setNewCatColor] = useState("#6C63FF");
  const [newCatRecurrence, setNewCatRecurrence] = useState("NONE");
  const [addingCat, setAddingCat] = useState(false);

  async function saveNotifications() {
    setSaving(true);
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        emailNotifications: emailOn,
        defaultAdvanceDays: advanceDays,
        emailDigestFrequency: frequency,
        discordNotifications: discordOn,
        discordWebhookUrl: discordWebhook || "",
      }),
    });
    setSaving(false);
    if (res.ok) toast.success("Settings saved!");
    else toast.error("Failed to save settings");
  }

  async function testDiscord() {
    if (!discordWebhook) { toast.error("Enter a webhook URL first"); return; }
    setTestingDiscord(true);
    try {
      const res = await fetch(discordWebhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "Remind Me",
          content: "✅ **Test notification** — Your Discord webhook is working!",
          embeds: [{ title: "🔔 Connection successful", color: 0x4f46e5 }],
        }),
      });
      if (res.ok) toast.success("Test message sent to Discord!");
      else toast.error("Webhook failed — check the URL");
    } catch {
      toast.error("Could not reach Discord — check the URL");
    }
    setTestingDiscord(false);
  }

  async function addCategory() {
    if (!newCatName.trim()) return;
    setAddingCat(true);
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCatName, icon: newCatIcon, color: newCatColor, defaultRecurrence: newCatRecurrence }),
    });
    setAddingCat(false);
    if (res.ok) {
      toast.success("Category added!");
      setNewCatName("");
      setNewCatIcon("star");
      setNewCatColor("#6C63FF");
      setNewCatRecurrence("NONE");
      router.refresh();
    } else {
      toast.error("Failed to add category");
    }
  }

  async function deleteCategory(id: string) {
    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Category deleted");
      router.refresh();
    } else {
      const err = await res.json();
      toast.error(err.error || "Cannot delete this category");
    }
  }

  const systemCats = categories.filter((c) => c.isSystem);
  const customCats = categories.filter((c) => !c.isSystem);

  return (
    <div className="space-y-6">
      {/* Account */}
      <Card>
        <CardHeader><CardTitle>Account</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-semibold">
              {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-medium text-sm">{user.name || "—"}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Configure when and how you get reminded</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Email reminders</Label>
                <p className="text-xs text-muted-foreground">Receive a daily digest of upcoming dates</p>
              </div>
              <Switch checked={emailOn} onCheckedChange={setEmailOn} />
            </div>
            {emailOn && (
              <div className="space-y-1.5 pl-1">
                <Label>Email digest frequency</Label>
                <Select value={frequency} onValueChange={(v) => setFrequency(v as typeof frequency)}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DAILY">Daily</SelectItem>
                    <SelectItem value="WEEKLY">Weekly</SelectItem>
                    <SelectItem value="NONE">Off</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="border-t" />

          {/* Discord */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Discord notifications</Label>
                <p className="text-xs text-muted-foreground">Send reminders to a Discord channel via webhook</p>
              </div>
              <Switch checked={discordOn} onCheckedChange={setDiscordOn} />
            </div>
            {discordOn && (
              <div className="space-y-1.5 pl-1">
                <Label htmlFor="webhook">Webhook URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="webhook"
                    type="url"
                    placeholder="https://discord.com/api/webhooks/..."
                    value={discordWebhook}
                    onChange={(e) => setDiscordWebhook(e.target.value)}
                    className="flex-1 font-mono text-xs"
                  />
                  <Button variant="outline" size="sm" onClick={testDiscord} disabled={testingDiscord || !discordWebhook}>
                    {testingDiscord ? <Loader2 className="h-4 w-4 animate-spin" /> : "Test"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  In Discord: channel → Edit → Integrations → Webhooks → New Webhook → Copy URL.{" "}
                  <a href="https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks" target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 inline-flex items-center gap-0.5 hover:underline">
                    Guide <ExternalLink className="h-3 w-3" />
                  </a>
                </p>
              </div>
            )}
          </div>

          <div className="border-t" />

          <div className="space-y-1.5">
            <Label htmlFor="advance">Default advance notice (days)</Label>
            <Input id="advance" type="number" min={0} max={365} value={advanceDays} onChange={(e) => setAdvanceDays(Number(e.target.value))} className="w-32" />
            <p className="text-xs text-muted-foreground">How many days before each event to notify you</p>
          </div>

          <Button onClick={saveNotifications} disabled={saving} size="sm" className="bg-indigo-600 hover:bg-indigo-700">
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save preferences
          </Button>
        </CardContent>
      </Card>

      {/* Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Categories</CardTitle>
          <CardDescription>Add your own categories beyond the presets</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Icon picker */}
          <div className="space-y-1.5">
            <Label>Icon</Label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORY_ICONS.map((name) => {
                const Icon = ICON_MAP[name];
                if (!Icon) return null;
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setNewCatIcon(name)}
                    className={cn(
                      "h-9 w-9 rounded-lg border flex items-center justify-center transition-colors",
                      newCatIcon === name
                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400"
                        : "border-border hover:border-indigo-300 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon size={16} strokeWidth={1.75} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Name + Color row */}
          <div className="flex gap-3 items-end flex-wrap">
            <div className="space-y-1.5 flex-1 min-w-[140px]">
              <Label>Name</Label>
              <Input placeholder="Category name" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Color</Label>
              <Input type="color" value={newCatColor} onChange={(e) => setNewCatColor(e.target.value)} className="w-16 h-9 p-1 cursor-pointer" />
            </div>
          </div>

          {/* Default recurrence */}
          <div className="space-y-1.5">
            <Label>Default recurrence</Label>
            <Select value={newCatRecurrence} onValueChange={setNewCatRecurrence}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">None (one-time)</SelectItem>
                <SelectItem value="DAILY">Daily</SelectItem>
                <SelectItem value="WEEKLY">Weekly</SelectItem>
                <SelectItem value="MONTHLY">Monthly</SelectItem>
                <SelectItem value="YEARLY">Yearly</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Auto-selects this recurrence when creating reminders with this category</p>
          </div>

          <Button onClick={addCategory} disabled={addingCat || !newCatName.trim()} size="sm" className="bg-indigo-600 hover:bg-indigo-700">
            {addingCat ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Add category
          </Button>

          {/* Custom category list */}
          {customCats.length > 0 && (
            <div className="space-y-2 pt-1">
              {customCats.map((cat) => {
                const Icon = ICON_MAP[cat.icon];
                const recurrence = (cat as Category & { defaultRecurrence?: string }).defaultRecurrence;
                return (
                  <div key={cat.id} className="flex items-center gap-3 p-2.5 rounded-lg border">
                    <div
                      className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${cat.color}22`, border: `1.5px solid ${cat.color}44` }}
                    >
                      {Icon ? <Icon size={15} strokeWidth={1.75} style={{ color: cat.color }} /> : null}
                    </div>
                    <span className="flex-1 text-sm font-medium">{cat.name}</span>
                    {recurrence && recurrence !== "NONE" && (
                      <Badge variant="secondary" className="text-xs">{RECURRENCE_LABELS[recurrence]}</Badge>
                    )}
                    <Badge variant="outline" className="text-xs">{cat._count.reminders}</Badge>
                    {cat._count.reminders === 0 && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => deleteCategory(cat.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* System presets */}
          <div className="pt-1">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2">
              Preset categories ({systemCats.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {systemCats.map((cat) => {
                const Icon = ICON_MAP[cat.icon];
                return (
                  <div key={cat.id} className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full border">
                    {Icon && <Icon size={12} strokeWidth={1.75} style={{ color: cat.color }} />}
                    <span>{cat.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
