"use client";

import { useToast } from "./Toast";

interface JoinRequest {
  id: string;
  user: {
    id: string;
    nickname: string;
    email: string | null;
  };
  status: string;
  createdAt: string;
}

interface JoinRequestListProps {
  projectId: string;
  requests: JoinRequest[];
  onUpdate: () => void;
}

export default function JoinRequestList({
  projectId,
  requests,
  onUpdate,
}: JoinRequestListProps) {
  const { showToast } = useToast();

  const handleApprove = async (requestId: string) => {
    if (!confirm("この申請を承認しますか?")) return;

    try {
      const response = await fetch(
        `/api/projects/${projectId}/join-requests/${requestId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "approve" }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to approve request");
      }

      showToast("参加を承認しました", "success");
      onUpdate();
    } catch (err) {
      console.error("Error approving request:", err);
      showToast("承認に失敗しました", "error");
    }
  };

  const handleReject = async (requestId: string) => {
    if (!confirm("この申請を拒否しますか?")) return;

    try {
      const response = await fetch(
        `/api/projects/${projectId}/join-requests/${requestId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "reject" }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to reject request");
      }

      showToast("参加を拒否しました", "success");
      onUpdate();
    } catch (err) {
      console.error("Error rejecting request:", err);
      showToast("拒否に失敗しました", "error");
    }
  };

  if (requests.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">保留中のリクエストはありません</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((request) => (
        <div
          key={request.id}
          className="p-4 border border-gray-200 rounded-lg flex items-center justify-between"
        >
          <div className="flex-1">
            <p className="font-semibold text-gray-900">{request.user.nickname}</p>
            {request.user.email && (
              <p className="text-sm text-gray-600">{request.user.email}</p>
            )}
            <p className="text-xs text-gray-400 mt-1">
              申請日: {new Date(request.createdAt).toLocaleDateString("ja-JP")}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleApprove(request.id)}
              className="px-4 py-2 text-white bg-green-600 rounded hover:bg-green-700 text-sm font-medium"
            >
              承認
            </button>
            <button
              onClick={() => handleReject(request.id)}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm font-medium"
            >
              拒否
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
