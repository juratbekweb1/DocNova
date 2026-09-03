import { getServerSession } from "next-auth";
import { authConfig } from "@/auth.config";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  Plus,
  LayoutGrid,
  List,
  MoreVertical,
  Edit,
  Copy,
  Download,
  Trash2,
  Share2,
} from "lucide-react";

import { getDocuments } from "@/actions/document-actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default async function DocumentsPage() {
  const session = await getServerSession(authConfig);

  if (!session?.user) {
    redirect("/login");
  }

  const documents = await getDocuments();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Documents</h1>
          <p className="text-slate-400">Manage your resumes, cover letters, and portfolios.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center rounded-lg border border-white/10 bg-slate-900/50 p-1">
            <button className="rounded-md bg-slate-800 p-1.5 text-white shadow-sm">
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button className="rounded-md p-1.5 text-slate-400 hover:text-white">
              <List className="h-4 w-4" />
            </button>
          </div>
          <Link
            href="/dashboard/documents/new"
            className="flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-sm font-medium text-white transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-cyan-500/25"
          >
            <Plus className="h-4 w-4" />
            New Document
          </Link>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="group relative flex flex-col rounded-2xl border border-white/10 bg-slate-900/50 p-6 transition-all hover:border-cyan-500/50 hover:bg-slate-800/50"
          >
            <div className="absolute top-4 right-4 z-10">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-white"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-48 border-white/10 bg-slate-900 text-white"
                >
                  <DropdownMenuItem asChild>
                    <Link
                      href={`/dashboard/editor/${doc.id}`}
                      className="flex cursor-pointer items-center"
                    >
                      <Edit className="mr-2 h-4 w-4" /> Edit
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex cursor-pointer items-center">
                    <Copy className="mr-2 h-4 w-4" /> Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex cursor-pointer items-center">
                    <Download className="mr-2 h-4 w-4" /> Download PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex cursor-pointer items-center">
                    <Share2 className="mr-2 h-4 w-4" /> Share Link
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex cursor-pointer items-center text-red-400 focus:bg-red-400/10 focus:text-red-400">
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <Link href={`/dashboard/editor/${doc.id}`} className="block flex flex-1 flex-col">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="font-medium text-white group-hover:text-cyan-400">{doc.title}</h3>
              <div className="mt-1 flex items-center gap-2 text-sm text-slate-400">
                <span className="capitalize">{doc.type.replace("_", " ").toLowerCase()}</span>
                <span>•</span>
                <span>{doc.status}</span>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
