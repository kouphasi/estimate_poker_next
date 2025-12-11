"use client";

import { useState, useEffect } from "react";
import { useToast } from "./Toast";

interface Invitation {
  id: string;
  inviteToken: string;
  createdAt: string;
  isActive: boolean;
  createdBy: {
    id: string;
    nickname: string;
  };
}

interface ProjectInvitationManagerProps {
  projectId: string;
}

export default function ProjectInvitationManager({ projectId }: ProjectInvitationManagerProps) {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    fetchInvitations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/projects/${projectId}/invitations`);

      if (!response.ok) {
        throw new Error("Failed to fetch invitations");
      }

      const data = await response.json();
      setInvitations(data.invitations);
    } catch (error) {
      console.error("Error fetching invitations:", error);
      showToast("招待リンクの取得に失敗しました", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvitation = async () => {
    try {
      setCreating(true);
      const response = await fetch(`/api/projects/${projectId}/invitations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to create invitation");
      }

      await fetchInvitations();
      showToast("招待リンクを作成しました", "success");
    } catch (error) {
      console.error("Error creating invitation:", error);
      showToast("招待リンクの作成に失敗しました", "error");
    } finally {
      setCreating(false);
    }
  };

  const copyInviteLink = (inviteToken: string) => {
    const url = `${window.location.origin}/join/${inviteToken}`;
    navigator.clipboard.writeText(url);
    showToast("招待リンクをコピーしました", "success");
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">招待リンク</h2>
        <button
          onClick={handleCreateInvitation}
          disabled={creating}
          className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-gray-300"
        >
          {creating ? "作成中..." : "+ 招待リンクを作成"}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : invitations.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          招待リンクがまだありません
        </div>
      ) : (
        <div className="space-y-3">
          {invitations.map((invitation) => (
            <div
              key={invitation.id}
              className="p-4 border border-gray-200 rounded-lg"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-mono text-sm text-gray-700 mb-2 break-all">
                    {window.location.origin}/join/{invitation.inviteToken}
                  </div>
                  <div className="text-xs text-gray-500">
                    作成者: {invitation.createdBy.nickname} | 作成日:{" "}
                    {new Date(invitation.createdAt).toLocaleDateString("ja-JP")}
                  </div>
                </div>
                <button
                  onClick={() => copyInviteLink(invitation.inviteToken)}
                  className="ml-4 px-3 py-1 text-sm text-blue-600 bg-blue-50 rounded hover:bg-blue-100"
                >
                  コピー
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
