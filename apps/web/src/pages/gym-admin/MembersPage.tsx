import { useCallback, useEffect, useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import SearchInput from "@/components/common/SearchInput";
import Pagination from "@/components/common/Pagination";
import MemberForm from "@/components/forms/MemberForm";
import MembersTable from "@/components/tables/MembersTable";
import { memberService } from "@/services/member.service";

export interface Member {
  id: string;
  memberId: string;
  fullName: string;
  phone: string;
  email?: string;
  gender?: string;
  status: "ACTIVE" | "INACTIVE" | "EXPIRED";
  joinedAt?: string;
}

const PAGE_SIZE = 10;

const mockMembers: Member[] = [
  {
    id: "1",
    memberId: "MEM001",
    fullName: "Arun Kumar",
    phone: "9876543210",
    email: "arun@example.com",
    gender: "Male",
    status: "ACTIVE",
    joinedAt: "2026-05-01",
  },
  {
    id: "2",
    memberId: "MEM002",
    fullName: "Priya Sharma",
    phone: "9876543211",
    email: "priya@example.com",
    gender: "Female",
    status: "ACTIVE",
    joinedAt: "2026-05-10",
  },
];

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const loadMembers = useCallback(async () => {
    try {
      setLoading(true);

      const response = await memberService.list();
      const data = response.data?.members ?? null;

      if (Array.isArray(data)) {
        setMembers(data as unknown as Member[]);
      } else {
        setMembers(mockMembers);
      }
    } catch (error) {
      console.error("Failed to load members:", error);
      setMembers(mockMembers);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadMembers();
  }, [loadMembers]);

  const filteredMembers = useMemo(() => {
    const query = search.toLowerCase();

    return members.filter(
      (member) =>
        member.fullName.toLowerCase().includes(query) ||
        member.phone.includes(query) ||
        member.memberId.toLowerCase().includes(query) ||
        member.email?.toLowerCase().includes(query)
    );
  }, [members, search]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredMembers.length / PAGE_SIZE)
  );

  const paginatedMembers = filteredMembers.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  function handleAddMember() {
    setSelectedMember(null);
    setFormOpen(true);
  }

  function handleEditMember(member: Member) {
    setSelectedMember(member);
    setFormOpen(true);
  }

  function handleDeleteMember(member: Member) {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${member.fullName}?`
    );

    if (!confirmed) return;

    setMembers((prev) =>
      prev.filter((item) => item.id !== member.id)
    );
  }

  function handleSaveMember(data: Partial<Member>) {
    if (selectedMember) {
      setMembers((prev) =>
        prev.map((item) =>
          item.id === selectedMember.id
            ? { ...item, ...data }
            : item
        )
      );
    } else {
      const newMember: Member = {
        id: Date.now().toString(),
        memberId: `MEM${String(members.length + 1).padStart(3, "0")}`,
        fullName: data.fullName || "",
        phone: data.phone || "",
        email: data.email || "",
        gender: data.gender || "Male",
        status: "ACTIVE",
        joinedAt: new Date().toISOString().split("T")[0],
      };

      setMembers((prev) => [newMember, ...prev]);
    }

    setFormOpen(false);
    setSelectedMember(null);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Members
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage all gym members.
          </p>
        </div>

        <Button onClick={handleAddMember}>
          + Add Member
        </Button>
      </div>

      {/* Search */}
      <Card className="p-4">
        <SearchInput
          placeholder="Search by name, phone, email, or member ID"
          value={search}
          onChange={(value: string) => {
            setSearch(value);
            setPage(1);
          }}
        />
      </Card>

      {/* Table */}
      <MembersTable
        data={paginatedMembers}
        loading={loading}
        onEdit={handleEditMember}
        onDelete={handleDeleteMember}
      />

      {/* Pagination */}
      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      {/* Modal Form */}
      <MemberForm
        key={selectedMember?.id ?? `new-member-${formOpen}`}
        open={formOpen}
        member={selectedMember}
        onClose={() => {
          setFormOpen(false);
          setSelectedMember(null);
        }}
        onSubmit={handleSaveMember}
      />
    </div>
  );
}