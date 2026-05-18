import { useCallback, useEffect, useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import SearchInput from "@/components/common/SearchInput";
import Pagination from "@/components/common/Pagination";
import MembershipForm from "@/components/forms/MembershipForm";
import MembershipsTable from "@/components/tables/MembershipsTable";
import { membershipService } from "@/services/membership.service";

export interface Membership {
  id: string;
  name: string;
  duration: number; // in months
  price: number;
  status: "ACTIVE" | "INACTIVE";
  description?: string;
}

const PAGE_SIZE = 10;

const mockMemberships: Membership[] = [
  {
    id: "1",
    name: "Monthly Plan",
    duration: 1,
    price: 1500,
    status: "ACTIVE",
    description: "Basic monthly membership",
  },
  {
    id: "2",
    name: "Quarterly Plan",
    duration: 3,
    price: 4000,
    status: "ACTIVE",
    description: "3 months discounted plan",
  },
  {
    id: "3",
    name: "Yearly Plan",
    duration: 12,
    price: 15000,
    status: "ACTIVE",
    description: "Best value annual membership",
  },
];

export default function MembershipsPage() {
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [selectedMembership, setSelectedMembership] =
    useState<Membership | null>(null);

  const loadMemberships = useCallback(async () => {
    try {
      setLoading(true);

      const response =
        typeof membershipService.getAll === "function"
          ? await membershipService.getAll()
          : null;

      const data = response;

      if (Array.isArray(data)) {
        setMemberships(data as unknown as Membership[]);
      } else {
        setMemberships(mockMemberships);
      }
    } catch (error) {
      console.error("Failed to load memberships:", error);
      setMemberships(mockMemberships);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadMemberships();
  }, [loadMemberships]);

  const filteredMemberships = useMemo(() => {
    const query = search.toLowerCase();

    return memberships.filter(
      (membership) =>
        membership.name.toLowerCase().includes(query) ||
        membership.description?.toLowerCase().includes(query)
    );
  }, [memberships, search]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredMemberships.length / PAGE_SIZE)
  );

  const paginatedMemberships = filteredMemberships.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  function handleAddMembership() {
    setSelectedMembership(null);
    setFormOpen(true);
  }

  function handleEditMembership(membership: Membership) {
    setSelectedMembership(membership);
    setFormOpen(true);
  }

  function handleDeleteMembership(membership: Membership) {
    const confirmed = window.confirm(
      `Delete "${membership.name}" membership plan?`
    );

    if (!confirmed) return;

    setMemberships((prev) =>
      prev.filter((item) => item.id !== membership.id)
    );
  }

  function handleSaveMembership(
    data: Partial<Membership>
  ) {
    if (selectedMembership) {
      setMemberships((prev) =>
        prev.map((item) =>
          item.id === selectedMembership.id
            ? { ...item, ...data }
            : item
        )
      );
    } else {
      const newMembership: Membership = {
        id: Date.now().toString(),
        name: data.name || "",
        duration: Number(data.duration || 1),
        price: Number(data.price || 0),
        description: data.description || "",
        status: "ACTIVE",
      };

      setMemberships((prev) => [
        newMembership,
        ...prev,
      ]);
    }

    setFormOpen(false);
    setSelectedMembership(null);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Membership Plans
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage pricing and membership durations.
          </p>
        </div>

        <Button onClick={handleAddMembership}>
          + Add Membership
        </Button>
      </div>

      {/* Search */}
      <Card className="p-4">
        <SearchInput
          placeholder="Search membership plans..."
          value={search}
          onChange={(value: string) => {
            setSearch(value);
            setPage(1);
          }}
        />
      </Card>

      {/* Table */}
      <MembershipsTable
        data={paginatedMemberships}
        loading={loading}
        onEdit={handleEditMembership}
        onDelete={handleDeleteMembership}
      />

      {/* Pagination */}
      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      {/* Form Modal */}
      <MembershipForm
        key={selectedMembership?.id ?? `new-membership-${formOpen}`}
        open={formOpen}
        membership={selectedMembership}
        onClose={() => {
          setFormOpen(false);
          setSelectedMembership(null);
        }}
        onSubmit={handleSaveMembership}
      />
    </div>
  );
}