// Project sharing types

export type ProjectRole = "owner" | "member";

export type JoinRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface ProjectInvitation {
  id: string;
  inviteToken: string;
  createdAt: string;
  expiresAt: string | null;
  isActive: boolean;
  createdBy: {
    id: string;
    nickname: string;
  };
}

export interface ProjectJoinRequest {
  id: string;
  status: JoinRequestStatus;
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

export interface ProjectWithRole {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  role: ProjectRole;
  owner: {
    id: string;
    nickname: string;
  };
  _count: {
    sessions: number;
  };
}

export interface InvitationInfo {
  id: string;
  project: {
    id: string;
    name: string;
    description: string | null;
    owner: {
      id: string;
      nickname: string;
    };
  };
  createdAt: string;
  expiresAt: string | null;
}
