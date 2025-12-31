// プロジェクト共有機能の型定義

export type JoinRequestStatus = "PENDING" | "APPROVED" | "REJECTED";
export type MemberRole = "OWNER" | "MEMBER";
export type UserProjectStatus = "none" | "pending" | "member" | "owner";

export interface ProjectInviteResponse {
  inviteUrl: string;
  token: string;
  createdAt: string;
}

export interface JoinRequestResponse {
  id: string;
  user: {
    id: string;
    nickname: string;
    email: string | null;
  };
  status: JoinRequestStatus;
  createdAt: string;
}

export interface ProjectMemberResponse {
  id: string;
  user: {
    id: string;
    nickname: string;
    email: string | null;
  };
  role: MemberRole;
  joinedAt: string;
}

export interface ProjectWithMembershipResponse {
  id: string;
  name: string;
  description: string | null;
  role: MemberRole;
  owner: {
    id: string;
    nickname: string;
  };
  joinedAt: string;
  sessionCount: number;
}

export interface InviteProjectInfo {
  project: {
    id: string;
    name: string;
    description: string | null;
    owner: {
      id: string;
      nickname: string;
    };
  };
  userStatus: UserProjectStatus;
}
