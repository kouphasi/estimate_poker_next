"use client";

import { useState, useEffect } from "react";
import { useToast } from "./Toast";

interface JoinRequest {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  requestedAt: string;
  respondedAt: string | null;
  user: {
    id: string;
    nickname: string;
    email: string | null;
  };
  respondedBy: {
    id: string;
    nickname: string;
  } | null;
}

interface ProjectJoinRequestManagerProps {
  projectId: string;
}

export default function ProjectJoinRequestManager({
  projectId,
}: ProjectJoinRequestManagerProps) {
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/projects/${projectId}/requests`);

      if (!response.ok) {
        throw new Error("Failed to fetch join requests");
      }

      const data = await response.json();
      setRequests(data.requests);
    } catch (error) {
      console.error("Error fetching join requests:", error);
      showToast("参加リクエストの取得に失敗しました", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      setProcessing(requestId);
      const response = await fetch(
        `/api/projects/${projectId}/requests/${requestId}/approve`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to approve request");
      }

      await fetchRequests();
      showToast("参加リクエストを承認しました", "success");
    } catch (error) {
      console.error("Error approving request:", error);
      showToast("参加リクエストの承認に失敗しました", "error");
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      setProcessing(requestId);
      const response = await fetch(
        `/api/projects/${projectId}/requests/${requestId}/reject`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to reject request");
      }

      await fetchRequests();
      showToast("参加リクエストを拒否しました", "success");
    } catch (error) {
      console.error("Error rejecting request:", error);
      showToast("参加リクエストの拒否に失敗しました", "error");
    } finally {
      setProcessing(null);
    }
  };

  const pendingRequests = requests.filter((r) => r.status === "PENDING");
  const processedRequests = requests.filter((r) => r.status !== "PENDING");

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">参加リクエスト</h2>

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {/* Pending Requests */}
          {pendingRequests.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                承認待ち ({pendingRequests.length})
              </h3>
              <div className="space-y-3">
                {pendingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">
                          {request.user.nickname}
                        </div>
                        {request.user.email && (
                          <div className="text-sm text-gray-600">
                            {request.user.email}
                          </div>
                        )}
                        <div className="text-xs text-gray-500 mt-1">
                          申請日:{" "}
                          {new Date(request.requestedAt).toLocaleDateString(
                            "ja-JP"
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleApprove(request.id)}
                          disabled={processing === request.id}
                          className="px-4 py-2 text-white bg-green-600 rounded hover:bg-green-700 disabled:bg-gray-300 text-sm"
                        >
                          承認
                        </button>
                        <button
                          onClick={() => handleReject(request.id)}
                          disabled={processing === request.id}
                          className="px-4 py-2 text-white bg-red-600 rounded hover:bg-red-700 disabled:bg-gray-300 text-sm"
                        >
                          拒否
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Processed Requests */}
          {processedRequests.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                処理済み ({processedRequests.length})
              </h3>
              <div className="space-y-2">
                {processedRequests.map((request) => (
                  <div
                    key={request.id}
                    className="p-3 border border-gray-200 rounded-lg text-sm"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {request.user.nickname}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          申請日:{" "}
                          {new Date(request.requestedAt).toLocaleDateString(
                            "ja-JP"
                          )}{" "}
                          | 処理日:{" "}
                          {request.respondedAt
                            ? new Date(request.respondedAt).toLocaleDateString(
                                "ja-JP"
                              )
                            : "-"}
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          request.status === "APPROVED"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {request.status === "APPROVED" ? "承認済み" : "拒否"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Requests */}
          {requests.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              参加リクエストはありません
            </div>
          )}
        </>
      )}
    </div>
  );
}
